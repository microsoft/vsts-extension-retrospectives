import { itemDataService } from '../itemDataService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';
/*
describe("ItemDataService - getVotes", () => {
  it("should return the total votes for a feedback item", () => {
    // Define a partial feedback item
    const feedbackItem: Partial<IFeedbackItemDocument> = {
      voteCollection: { user1: 3, user2: 2, user3: 5 },
    };

    // Cast it to IFeedbackItemDocument before calling the method
    const result = itemDataService.getVotes(feedbackItem as IFeedbackItemDocument);

    expect(result).toBe(10); // 3 + 2 + 5
  });

  it("should return 0 if voteCollection is empty", () => {
    const feedbackItem: Partial<IFeedbackItemDocument> = {
      voteCollection: {},
    };

    const result = itemDataService.getVotes(feedbackItem as IFeedbackItemDocument);

    expect(result).toBe(0);
  });

  it("should return 0 if voteCollection is undefined", () => {
    const feedbackItem: Partial<IFeedbackItemDocument> = {
      voteCollection: undefined,
    };

    const result = itemDataService.getVotes(feedbackItem as IFeedbackItemDocument);

    expect(result).toBe(0);
  });
});
*/

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
