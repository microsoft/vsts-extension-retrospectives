import { itemDataService } from '../itemDataService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

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
