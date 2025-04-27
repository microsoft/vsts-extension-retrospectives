import { itemDataService } from '../itemDataService'; // Import the service instance
import { IFeedbackItemDocument } from '../../interfaces/feedback'; // Import the interface

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
