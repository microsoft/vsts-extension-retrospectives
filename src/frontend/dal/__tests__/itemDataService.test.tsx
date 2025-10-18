import { itemDataService } from "../itemDataService";
import { IFeedbackItemDocument, IFeedbackBoardDocument, ITeamEffectivenessMeasurementVoteCollection } from "../../interfaces/feedback";
import { IdentityRef } from "azure-devops-extension-api/WebApi";
import { IColumnItem } from "../../components/feedbackBoard";
import * as dataService from "../dataService";
import * as userIdentityHelper from "../../utilities/userIdentityHelper";
import { WorkItem } from "azure-devops-extension-api/WorkItemTracking/WorkItemTracking";
import { workItemService } from "../azureDevOpsWorkItemService";

// Mock dependencies
jest.mock("../dataService");
jest.mock("../../utilities/userIdentityHelper");
jest.mock("../azureDevOpsWorkItemService");

// Mock IdentityRef object
const mockIdentityRef: IdentityRef = {
  id: "user-1",
  displayName: "Test User",
  uniqueName: "testuser@domain.com",
  imageUrl: "https://example.com/user.png",
  directoryAlias: "testuser",
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "https://example.com/profile",
  _links: {},
  descriptor: "descriptor-string",
  url: "https://example.com/user",
};

// Define reusable base feedback item
const baseFeedbackItem: IFeedbackItemDocument = {
  id: "test-id",
  boardId: "test-board",
  title: "Test Title",
  columnId: "test-column",
  createdBy: mockIdentityRef,
  createdDate: new Date(),
  userIdRef: "test-user-ref",
  originalColumnId: "test-column",
  voteCollection: {},
  upvotes: 0,
  groupIds: [],
  isGroupedCarouselItem: false,
  timerSecs: 0,
  timerstate: false,
  timerId: null,
};

// Define collection with votes
const feedbackItemWithVotes: IFeedbackItemDocument = {
  ...baseFeedbackItem,
  voteCollection: { user1: 3, user2: 0, user3: 5, user4: 2 },
  upvotes: 10,
};

// Define collection with no votes
const feedbackItemWithNoVotes: IFeedbackItemDocument = {
  ...baseFeedbackItem,
  voteCollection: { user1: 0, user2: 0 },
  upvotes: 0,
};

describe("ItemDataService - isVoted", () => {
  beforeEach(() => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockImplementation(async (_boardId: string, feedbackItemId: string): Promise<IFeedbackItemDocument | undefined> => {
      if (feedbackItemId === "withVotes") {
        return feedbackItemWithVotes;
      } else if (feedbackItemId === "withNoVotes") {
        return feedbackItemWithNoVotes;
      } else if (feedbackItemId === "emptyVotes") {
        return { ...baseFeedbackItem };
      } else if (feedbackItemId === "maxVotes") {
        return { ...baseFeedbackItem, voteCollection: { user1: 12 }, upvotes: 12 };
      } else {
        return undefined;
      }
    });
  });

  it("should return the user's vote count as a string if the user has voted", async () => {
    const result = await itemDataService.isVoted("test-board", "user1", "withVotes");
    expect(result).toBe("3");
  });

  it("should return '0' if the user has not voted but the item has upvotes", async () => {
    const result = await itemDataService.isVoted("test-board", "user2", "withVotes");
    expect(result).toBe("0");
  });

  it("should return '0' if the user does not exist but the item has upvotes", async () => {
    const result = await itemDataService.isVoted("test-board", "user5", "withVotes");
    expect(result).toBe("0");
  });

  it("should return '0' if the item has no upvotes and the user has not voted", async () => {
    const result = await itemDataService.isVoted("test-board", "user1", "withNoVotes");
    expect(result).toBe("0");
  });

  it("should return '0' if voteCollection is empty", async () => {
    const result = await itemDataService.isVoted("test-board", "user1", "emptyVotes");
    expect(result).toBe("0");
  });

  it("should handle the maximum votes allowed for a user (12)", async () => {
    const result = await itemDataService.isVoted("test-board", "user1", "maxVotes");
    expect(result).toBe("12");
  });

  it("should return undefined if the feedback item does not exist", async () => {
    const result = await itemDataService.isVoted("test-board", "user1", "nonExistentItem");
    expect(result).toBeUndefined();
  });
});

describe("ItemDataService - getVotes", () => {
  it("should return the total votes for a feedback item", () => {
    const result = itemDataService.getVotes(feedbackItemWithVotes);
    expect(result).toBe(10);
  });

  it("should return 0 if voteCollection is empty", () => {
    const result = itemDataService.getVotes(baseFeedbackItem);
    expect(result).toBe(0);
  });

  it("should return 0 if voteCollection is undefined", () => {
    const feedbackItemWithUndefinedVotes: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: undefined,
    };
    const result = itemDataService.getVotes(feedbackItemWithUndefinedVotes);
    expect(result).toBe(0);
  });

  it("should return 0 if all users have zero votes", () => {
    const result = itemDataService.getVotes(feedbackItemWithNoVotes);
    expect(result).toBe(0);
  });
});

describe("ItemDataService - getVotesByUser", () => {
  it("should return the total votes for a specific user", () => {
    const result = itemDataService.getVotesByUser(feedbackItemWithVotes, "user1");
    expect(result).toBe(3);
  });

  it("should return 0 if user does not exist in voteCollection", () => {
    const feedbackItemWithoutUser: IFeedbackItemDocument = {
      ...feedbackItemWithVotes,
      voteCollection: { user1: 3, user2: 2 },
    };
    const result = itemDataService.getVotesByUser(feedbackItemWithoutUser, "user3");
    expect(result).toBe(0);
  });

  it("should return 0 if voteCollection is undefined", () => {
    const feedbackItemWithUndefinedVotes: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: undefined,
    };
    const result = itemDataService.getVotesByUser(feedbackItemWithUndefinedVotes, "user1");
    expect(result).toBe(0);
  });
});

describe("ItemDataService - getVotesForGroupedItems", () => {
  it("should return the total votes for the main item and grouped items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 0 } },
      { ...baseFeedbackItem, voteCollection: { user3: 5 } },
    ];
    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);
    expect(result).toBe(8);
  });

  it("should return the total votes for the main item and grouped items for same user", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user1: 0 } },
      { ...baseFeedbackItem, voteCollection: { user1: 5 } },
    ];
    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);
    expect(result).toBe(8);
  });

  it("should return only the main item votes if grouped items are empty", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [];
    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);
    expect(result).toBe(3);
  });

  it("should return 0 if both main item and grouped items have no votes", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 0 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 0 } },
      { ...baseFeedbackItem, voteCollection: { user3: 0 } },
    ];
    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);
    expect(result).toBe(0);
  });
});

describe("ItemDataService - getVotesForGroupedItemsByUser", () => {
  it("should return the total votes for a specific user across main and grouped items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user1: 0 } },
      { ...baseFeedbackItem, voteCollection: { user1: 5 } },
    ];
    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");
    expect(result).toBe(8);
  });

  it("should return 0 if the user has no votes in both main and grouped items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user2: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 0 } },
      { ...baseFeedbackItem, voteCollection: { user2: 5 } },
    ];
    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");
    expect(result).toBe(0);
  });

  it("should return 0 if voteCollection is undefined for all items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: undefined,
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: undefined },
      { ...baseFeedbackItem, voteCollection: undefined },
    ];
    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");
    expect(result).toBe(0);
  });
});

describe("ItemDataService - sortItemsByVotesAndDate", () => {
  const createItem = (id: string, votes: Record<string, number>, date: Date, childIds: string[] = []): IColumnItem => ({
    feedbackItem: {
      ...baseFeedbackItem,
      id,
      voteCollection: votes,
      createdDate: date,
      childFeedbackItemIds: childIds.length > 0 ? childIds : undefined,
    },
    actionItems: [],
  });

  it("should sort items by total votes (descending)", () => {
    const items: IColumnItem[] = [createItem("item1", { user1: 2 }, new Date("2024-01-01")), createItem("item2", { user1: 5 }, new Date("2024-01-02")), createItem("item3", { user1: 1 }, new Date("2024-01-03"))];

    const result = itemDataService.sortItemsByVotesAndDate(items, items);

    expect(result[0].feedbackItem.id).toBe("item2");
    expect(result[1].feedbackItem.id).toBe("item1");
    expect(result[2].feedbackItem.id).toBe("item3");
  });

  it("should sort by date when votes are equal", () => {
    const items: IColumnItem[] = [createItem("item1", { user1: 3 }, new Date("2024-01-01")), createItem("item2", { user1: 3 }, new Date("2024-01-03")), createItem("item3", { user1: 3 }, new Date("2024-01-02"))];

    const result = itemDataService.sortItemsByVotesAndDate(items, items);

    expect(result[0].feedbackItem.id).toBe("item2");
    expect(result[1].feedbackItem.id).toBe("item3");
    expect(result[2].feedbackItem.id).toBe("item1");
  });

  it("should handle grouped items in vote calculation", () => {
    const childItem1 = createItem("child1", { user1: 2 }, new Date("2024-01-01"));
    const childItem2 = createItem("child2", { user1: 3 }, new Date("2024-01-01"));

    const items: IColumnItem[] = [createItem("parent1", { user1: 5 }, new Date("2024-01-01"), ["child1", "child2"]), createItem("item2", { user1: 8 }, new Date("2024-01-02")), childItem1, childItem2];

    const result = itemDataService.sortItemsByVotesAndDate(items, items);

    expect(result[0].feedbackItem.id).toBe("parent1");
    expect(result[1].feedbackItem.id).toBe("item2");
  });
});

describe("ItemDataService - updateVote", () => {
  const mockBoardId = "board-1";
  const mockTeamId = "team-1";
  const mockUserId = "user-1";
  const mockEncryptedUserId = "encrypted-user-1";
  const mockFeedbackItemId = "item-1";

  beforeEach(() => {
    jest.clearAllMocks();
    (userIdentityHelper.encrypt as jest.Mock).mockReturnValue(mockEncryptedUserId);
  });

  it("should increment vote successfully", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      id: mockFeedbackItemId,
      voteCollection: {},
      upvotes: 0,
    };

    const mockBoardItem: IFeedbackBoardDocument = {
      id: mockBoardId,
      boardVoteCollection: {},
      maxVotesPerUser: 5,
    } as any;

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    jest.spyOn(itemDataService, "getBoardItem").mockResolvedValue(mockBoardItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValueOnce({ ...mockFeedbackItem, voteCollection: { [mockEncryptedUserId]: 1 }, upvotes: 1 }).mockResolvedValueOnce({ ...mockBoardItem, boardVoteCollection: { [mockEncryptedUserId]: 1 } });

    const result = await itemDataService.updateVote(mockBoardId, mockTeamId, mockUserId, mockFeedbackItemId, false);

    expect(result).toBeDefined();
    expect(result.upvotes).toBe(1);
    expect(result.voteCollection[mockEncryptedUserId]).toBe(1);
  });

  it("should decrement vote successfully", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      id: mockFeedbackItemId,
      voteCollection: { [mockEncryptedUserId]: 2 },
      upvotes: 2,
    };

    const mockBoardItem: IFeedbackBoardDocument = {
      id: mockBoardId,
      boardVoteCollection: { [mockEncryptedUserId]: 2 },
      maxVotesPerUser: 5,
    } as any;

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    jest.spyOn(itemDataService, "getBoardItem").mockResolvedValue(mockBoardItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValueOnce({ ...mockFeedbackItem, voteCollection: { [mockEncryptedUserId]: 1 }, upvotes: 1 }).mockResolvedValueOnce({ ...mockBoardItem, boardVoteCollection: { [mockEncryptedUserId]: 1 } });

    const result = await itemDataService.updateVote(mockBoardId, mockTeamId, mockUserId, mockFeedbackItemId, true);

    expect(result).toBeDefined();
    expect(result.upvotes).toBe(1);
  });

  it("should return undefined when feedback item not found", async () => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(null);

    const result = await itemDataService.updateVote(mockBoardId, mockTeamId, mockUserId, mockFeedbackItemId, false);

    expect(result).toBeUndefined();
  });

  it("should return undefined when user exceeds max votes", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: {},
    };

    const mockBoardItem: IFeedbackBoardDocument = {
      id: mockBoardId,
      boardVoteCollection: { [mockEncryptedUserId]: 5 },
      maxVotesPerUser: 5,
    } as any;

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    jest.spyOn(itemDataService, "getBoardItem").mockResolvedValue(mockBoardItem);

    const result = await itemDataService.updateVote(mockBoardId, mockTeamId, mockUserId, mockFeedbackItemId, false);

    expect(result).toBeUndefined();
  });

  it("should rollback when board update fails", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: {},
      upvotes: 0,
    };

    const mockBoardItem: IFeedbackBoardDocument = {
      id: mockBoardId,
      boardVoteCollection: {},
      maxVotesPerUser: 5,
    } as any;

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    jest.spyOn(itemDataService, "getBoardItem").mockResolvedValue(mockBoardItem);
    (dataService.updateDocument as jest.Mock)
      .mockResolvedValueOnce({ ...mockFeedbackItem, voteCollection: { [mockEncryptedUserId]: 1 }, upvotes: 1 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...mockFeedbackItem, voteCollection: {}, upvotes: 0 });

    const result = await itemDataService.updateVote(mockBoardId, mockTeamId, mockUserId, mockFeedbackItemId, false);

    expect(result.upvotes).toBe(0);
    expect(dataService.updateDocument).toHaveBeenCalledTimes(3);
  });
});

describe("ItemDataService - updateTitle", () => {
  it("should update title successfully", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      title: "Old Title",
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, title: "New Title" });

    const result = await itemDataService.updateTitle("board-1", "item-1", "New Title");

    expect(result).toBeDefined();
    expect(result.title).toBe("New Title");
  });

  it("should return undefined when feedback item not found", async () => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(null);

    const result = await itemDataService.updateTitle("board-1", "item-1", "New Title");

    expect(result).toBeUndefined();
  });
});

describe("ItemDataService - flipTimer", () => {
  it("should flip timer state from false to true", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      timerstate: false,
      timerId: null,
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, timerstate: true, timerId: "timer-123" });

    const result = await itemDataService.flipTimer("board-1", "item-1", "timer-123");

    expect(result.timerstate).toBe(true);
    expect(result.timerId).toBe("timer-123");
  });

  it("should return undefined when feedback item not found", async () => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(null);

    const result = await itemDataService.flipTimer("board-1", "item-1", "timer-123");

    expect(result).toBeUndefined();
  });
});

describe("ItemDataService - updateTimer", () => {
  it("should increment timer count", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      timerSecs: 5,
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, timerSecs: 6 });

    const result = await itemDataService.updateTimer("board-1", "item-1", false);

    expect(result.timerSecs).toBe(6);
  });

  it("should set timer to zero when setZero is true", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      timerSecs: 100,
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, timerSecs: 0 });

    const result = await itemDataService.updateTimer("board-1", "item-1", true);

    expect(result.timerSecs).toBe(0);
  });

  it("should return undefined when feedback item not found", async () => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(null);

    const result = await itemDataService.updateTimer("board-1", "item-1", false);

    expect(result).toBeUndefined();
  });
});

describe("ItemDataService - addAssociatedActionItem", () => {
  it("should add work item to empty associatedActionItemIds", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: undefined,
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, associatedActionItemIds: [123] });

    const result = await itemDataService.addAssociatedActionItem("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).toContain(123);
  });

  it("should not add duplicate work item", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: [123],
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);

    const result = await itemDataService.addAssociatedActionItem("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).toHaveLength(1);
  });

  it("should return undefined when feedback item not found", async () => {
    jest.spyOn(itemDataService, "getFeedbackItem").mockRejectedValue(new Error("Not found"));

    const result = await itemDataService.addAssociatedActionItem("board-1", "item-1", 123);

    expect(result).toBeUndefined();
  });
});

describe("ItemDataService - removeAssociatedActionItem", () => {
  it("should remove work item from associatedActionItemIds", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: [123, 456],
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, associatedActionItemIds: [456] });

    const result = await itemDataService.removeAssociatedActionItem("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).not.toContain(123);
    expect(result.associatedActionItemIds).toContain(456);
  });

  it("should return item when no associated action items exist", async () => {
    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: undefined,
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);

    const result = await itemDataService.removeAssociatedActionItem("board-1", "item-1", 123);

    expect(result).toBeDefined();
  });
});

describe("ItemDataService - removeAssociatedItemIfNotExistsInVsts", () => {
  it("should remove work item when it does not exist in VSTS", async () => {
    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([]);

    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: [123],
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, associatedActionItemIds: [] });

    const result = await itemDataService.removeAssociatedItemIfNotExistsInVsts("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).not.toContain(123);
  });

  it("should keep work item when it exists in VSTS", async () => {
    const mockWorkItem = { id: 123 } as WorkItem;
    (workItemService.getWorkItemsByIds as jest.Mock).mockResolvedValue([mockWorkItem]);

    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: [123],
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);

    const result = await itemDataService.removeAssociatedItemIfNotExistsInVsts("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).toContain(123);
  });

  it("should remove work item when VSTS throws error", async () => {
    (workItemService.getWorkItemsByIds as jest.Mock).mockRejectedValue(new Error("VSTS error"));

    const mockFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      associatedActionItemIds: [123],
    };

    jest.spyOn(itemDataService, "getFeedbackItem").mockResolvedValue(mockFeedbackItem);
    (dataService.updateDocument as jest.Mock).mockResolvedValue({ ...mockFeedbackItem, associatedActionItemIds: [] });

    const result = await itemDataService.removeAssociatedItemIfNotExistsInVsts("board-1", "item-1", 123);

    expect(result.associatedActionItemIds).not.toContain(123);
  });
});
