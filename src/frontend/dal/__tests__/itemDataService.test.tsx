import { itemDataService } from '../itemDataService';
import { IFeedbackItemDocument } from '../../interfaces/feedback';

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

describe("ItemDataService - getVotesByUser", () => {
  it("should return the total votes for a specific user", () => {
    const feedbackItem: Partial<IFeedbackItemDocument> = {
        voteCollection: { user1: 3, user2: 2, user3: 5 },
    };

    const result = itemDataService.getVotesByUser(feedbackItem, "user1");

    expect(result).toBe(3);
  });

  it("should return 0 if user does not exist in voteCollection", () => {
    const feedbackItem: Partial<IFeedbackItemDocument> = {
        voteCollection: { user1: 3, user2: 2 },
    };

    const result = itemDataService.getVotesByUser(feedbackItem, "user3");

    expect(result).toBe(0);
  });

  it("should return 0 if voteCollection is undefined", () => {
    const feedbackItem = {
      voteCollection: undefined,
    } as IFeedbackItemDocument;

    const result = itemDataService.getVotesByUser(feedbackItem, "user1");

    expect(result).toBe(0);
  });
});
