import { itemDataService } from '../itemDataService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

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
  _links: {}, // Placeholder for the required _links object
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

// You can also define other reusable variants as needed
const feedbackItemWithVotes: IFeedbackItemDocument = {
  ...baseFeedbackItem,
  voteCollection: { user1: 3, user2: 2, user3: 5 },
};

describe("ItemDataService - getVotes", () => {
  it("should return the total votes for a feedback item", () => {
    // Use the predefined feedback item with votes
    const result = itemDataService.getVotes(feedbackItemWithVotes);

    expect(result).toBe(10); // 3 + 2 + 5
  });

  it("should return 0 if voteCollection is empty", () => {
    // Use the base feedback item with an empty voteCollection
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
});

describe("ItemDataService - getVotesByUser", () => {
  it("should return the total votes for a specific user", () => {
    const result = itemDataService.getVotesByUser(feedbackItemWithVotes, "user1");

    expect(result).toBe(3); // Votes for user1
  });

  it("should return 0 if user does not exist in voteCollection", () => {
    const feedbackItemWithoutUser: IFeedbackItemDocument = {
      ...feedbackItemWithVotes,
      voteCollection: { user1: 3, user2: 2 }, // No user3 votes
    };

    const result = itemDataService.getVotesByUser(feedbackItemWithoutUser, "user3");

    expect(result).toBe(0); // User3 has no votes
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
    // Main Feedback Item with votes
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 }, // Mock votes for the main item
    };

    // Grouped Feedback Items
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 2 } },
      { ...baseFeedbackItem, voteCollection: { user3: 5 } },
    ];

    // Calculate total votes for the main and grouped items
    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);

    expect(result).toBe(10); // 3 (main) + 2 + 5
  });

  it("should return only the main item votes if grouped items are empty", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 }, // Mock votes for the main item
    };

    const groupedFeedbackItems: IFeedbackItemDocument[] = []; // No grouped items

    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);

    expect(result).toBe(3); // Only main item votes
  });

  it("should return 0 if both main item and grouped items have no votes", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: undefined, // No votes for the main item
    };

    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: undefined },
      { ...baseFeedbackItem, voteCollection: undefined },
    ]; // No votes for grouped items

    const result = itemDataService.getVotesForGroupedItems(mainFeedbackItem, groupedFeedbackItems);

    expect(result).toBe(0); // No votes at all
  });
});

describe("ItemDataService - getVotesForGroupedItemsByUser", () => {
  it("should return the total votes for a specific user across main and grouped items", () => {
    // Main Feedback Item with votes for the user
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user1: 3 }, // Votes for user1
    };

    // Grouped Feedback Items with votes for the same user
    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user1: 5 } },
      { ...baseFeedbackItem, voteCollection: { user1: 2 } },
    ];

    // Calculate total votes for user1
    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");

    expect(result).toBe(10); // 3 (main) + 5 + 2
  });

  it("should return 0 if the user has no votes in both main and grouped items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: { user2: 3 }, // Votes for user2, not user1
    };

    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: { user2: 5 } },
      { ...baseFeedbackItem, voteCollection: { user2: 2 } },
    ];

    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");

    expect(result).toBe(0); // No votes for user1
  });

  it("should return 0 if voteCollection is undefined for all items", () => {
    const mainFeedbackItem: IFeedbackItemDocument = {
      ...baseFeedbackItem,
      voteCollection: undefined, // No votes for main item
    };

    const groupedFeedbackItems: IFeedbackItemDocument[] = [
      { ...baseFeedbackItem, voteCollection: undefined },
      { ...baseFeedbackItem, voteCollection: undefined },
    ]; // No votes for grouped items

    const result = itemDataService.getVotesForGroupedItemsByUser(mainFeedbackItem, groupedFeedbackItems, "user1");

    expect(result).toBe(0); // No votes at all
  });
});
