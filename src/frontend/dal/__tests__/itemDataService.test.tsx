import { itemDataService } from '../itemDataService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

// Mock IdentityRef object
const mockIdentityRef: IdentityRef = {
  id: 'user-1',
  displayName: 'Test User',
  uniqueName: 'testuser@domain.com',
  imageUrl: 'https://example.com/user.png',
  directoryAlias: 'testuser',
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false, // Additional required property
  profileUrl: 'https://example.com/profile', // Additional required property
  _links: {}, // Placeholder for required _links object
  descriptor: 'descriptor-string', // Additional required property
  url: 'https://example.com/user', // Additional required property
};

// Define reusable base feedback items
const baseFeedbackItem: IFeedbackItemDocument = {
  id: 'test-id',
  boardId: 'test-board',
  title: 'Test Title',
  columnId: 'test-column',
  createdBy: mockIdentityRef,
  createdDate: new Date(),
  userIdRef: 'test-user-ref',
  originalColumnId: 'test-column',
  voteCollection: {},
  upvotes: 0,
  groupIds: [],
  isGroupedCarouselItem: false,
  timerSecs: 0,
  timerstate: false,
  timerId: null,
};

// Define or override variants as needed
const feedbackItemWithVotes: IFeedbackItemDocument = {
  ...baseFeedbackItem,
  voteCollection: { user1: 3, user2: 0, user3: 5, user4: 2 },
  upvotes: 10
};

// Define or override variants as needed
const feedbackItemWithNoVotes: IFeedbackItemDocument = {
  ...baseFeedbackItem,
  voteCollection: { user1: 0, user2: 0, user3: 0, user4: 0 },
  upvotes: 0
};

describe("ItemDataService - isVoted", () => {
  beforeEach(() => {
    jest.spyOn(itemDataService, 'getFeedbackItem').mockImplementation(async (_boardId: string, feedbackItemId: string) => {
      if (feedbackItemId === 'test-item') {
        return { ...feedbackItemWithVotes };
      } else if (feedbackItemId === 'no-votes-item') {
        return { ...feedbackItemWithNoVotes };
      } else if (feedbackItemId === 'undefined-votes-item') {
        return {
          ...baseFeedbackItem,
          voteCollection: undefined,
          upvotes: 0,
        };
      } else {
        return undefined;
      }
    });
  });

  it("should return the user's vote count as a string if the user has voted", async () => {
    const result = await itemDataService.isVoted('test-board', 'user1', 'test-item');
    expect(result).toBe("3");
  });

  it("should return '0' if the user has not voted but the item has upvotes", async () => {
    const result = await itemDataService.isVoted('test-board', 'user2', 'test-item');
    expect(result).toBe("0");
  });

  it("should return '0' if the item has no upvotes and the user has not voted", async () => {
    const result = await itemDataService.isVoted('test-board', 'user1', 'no-votes-item');
    expect(result).toBe("0");
  });
/*
  it("should return '0' if voteCollection is undefined", async () => {
    const result = await itemDataService.isVoted('test-board', 'user1', 'undefined-votes-item');
    expect(result).toBe("0");
  });

  it("should return undefined if the feedback item does not exist", async () => {
    const result = await itemDataService.isVoted('test-board', 'user1', 'non-existent-item');
    expect(result).toBeUndefined();
  });
*/
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
      voteCollection: undefined,
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: undefined },
      { ...baseFeedbackItem, voteCollection: undefined },
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
      { ...baseFeedbackItem, voteCollection: { user1: 5 } },
      { ...baseFeedbackItem, voteCollection: { user1: 2 } },
    ];
    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");
    expect(result).toBe(10);
  });

  it("should return 0 if the user has no votes in both main and grouped items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user2: 3 },
    };
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 5 } },
      { ...baseFeedbackItem, voteCollection: { user2: 2 } },
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
