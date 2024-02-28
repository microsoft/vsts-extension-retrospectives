import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config as environment } from '../config/config';

const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: environment.AppInsightsInstrumentKey,
    extensions: [reactPlugin],
    loggingLevelConsole: 2,
    loggingLevelTelemetry: 2,
    extensionConfig: {
      [reactPlugin.identifier]: { history: {} }
    }
  }
});
appInsights.loadAppInsights();

export const TelemetryEvents = {
  WorkItemCreated: 'Work item created',
  ExistingWorkItemLinked: 'Existing work item linked',
  FeedbackBoardCreated: 'Feedback board created',
  FeedbackBoardMetadataUpdated: 'Feedback board metadata updated',
  TeamSelectionChanged: 'Team changed',
  FeedbackBoardSelectionChanged: 'Feedback board changed',
  WorkflowPhaseChanged: 'Workflow phase changed',
  FeedbackBoardDeleted: 'Feedback board deleted',
  SummaryDashboardOpened: 'Summary dashboard opened',
  SummaryDashboardClosed: 'Summary dashboard closed',
  FeedbackBoardShared: 'Feedback board shared',
  FeedbackItemCreated: 'Feedback item created',
  FeedbackItemGrouped: 'Feedback items grouped',
  FeedbackItemUngrouped: 'Feedback items ungrouped',
  FeedbackItemDeleted: 'Feedback item deleted',
  FeedbackItemTitleEdited: 'Feedback item title edited',
  FeedbackItemUpvoted: 'Feedback item upvoted',
  ExtensionLaunched: 'Extension launched',
  FeedbackItemCarouselLaunched: 'Feedback item carousel launched',
};

const updatedConsoleError = ((oldErrorFunction) => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: function (message?: any, ...optionalParams: any[]) {
      oldErrorFunction(message, optionalParams);
      appInsights.trackException({ error: { message: message, name: "console.error" } });
    },
  };
})(window.console.error);

window.console.error = updatedConsoleError.error;

export { reactPlugin, appInsights };
