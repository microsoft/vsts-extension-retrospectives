import { createBrowserHistory } from "history";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { config as environment } from "../config/config";

const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: environment.AppInsightsInstrumentKey,
    extensions: [reactPlugin as any],
    loggingLevelConsole: 2,
    loggingLevelTelemetry: 2,
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory },
    },
  },
});
appInsights.loadAppInsights();
appInsights.trackPageView();

export const TelemetryExceptions = {
  BoardsNotFoundForTeam: "Feedback boards not found for team",
  CurrentTeamIterationNotFound: "Current iteration does not exist",
  FeedbackItemsNotFoundForBoard: "Feedback items not found for board",
};

export const TelemetryEvents = {
  WorkItemCreated: "Work item created",
  ExistingWorkItemLinked: "Existing work item linked",
  FeedbackBoardCreated: "Feedback board created",
  FeedbackBoardMetadataUpdated: "Feedback board metadata updated",
  TeamSelectionChanged: "Team changed",
  FeedbackBoardSelectionChanged: "Feedback board changed",
  WorkflowPhaseChanged: "Workflow phase changed",
  FeedbackBoardArchived: "Feedback board archived",
  FeedbackBoardDeleted: "Feedback board deleted",
  FeedbackBoardRestored: "Feedback board restored from archive",
  SummaryDashboardOpened: "Summary dashboard opened",
  SummaryDashboardClosed: "Summary dashboard closed",
  FeedbackBoardShared: "Feedback board shared",
  FeedbackItemCreated: "Feedback item created",
  FeedbackItemGrouped: "Feedback items grouped",
  FeedbackItemUngrouped: "Feedback items ungrouped",
  FeedbackItemDeleted: "Feedback item deleted",
  FeedbackItemTitleEdited: "Feedback item title edited",
  FeedbackItemUpvoted: "Feedback item upvoted",
  ExtensionLaunched: "Extension launched",
  FeedbackItemCarouselLaunched: "Feedback item carousel launched",
};

export { reactPlugin, appInsights };
