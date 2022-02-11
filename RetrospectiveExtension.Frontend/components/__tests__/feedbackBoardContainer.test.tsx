import { FeedbackBoardContainerProps } from '../feedbackBoardContainer';
import { mockWorkflowStage } from '../__mocks__/WorkflowStage';

jest.mock('../workflowStage', () => { return mockWorkflowStage; });

const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
  isHostedAzureDevOps: false,
  projectId: "1",
};

describe(`The Feedback Board Component`, () => {
  it("Renders a Feedback Board Container Component", () => {
    console.log(feedbackBoardContainerProps);
  });
});