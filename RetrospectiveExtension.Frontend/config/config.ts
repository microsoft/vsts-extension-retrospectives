export interface AppConfiguration {
  CollaborationStateServiceUrl: string,
  AppInsightsInstrumentKey: string,
  CurrentEnvironment: string,
}

const getConfiguration = (): AppConfiguration => {
  const appInsightsInstrumentKey = process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;
  const collaborationStateServiceUrl = process.env.REACT_APP_COLLABORATION_STATE_SERVICE_URL;
  console.log(`backend service URL is ${collaborationStateServiceUrl}`);
  if (!appInsightsInstrumentKey) {
    console.warn(`missing Application Insights Instrumentation key, logging and telemetry will not be collected`);
  }
  if (!collaborationStateServiceUrl) {
    console.warn(`Backend Service URL was not provided, the real time updates feature will be disabled`);
  }
  return {
    AppInsightsInstrumentKey: appInsightsInstrumentKey || '',
    CollaborationStateServiceUrl: collaborationStateServiceUrl || 'https://website-unset.com/',
    CurrentEnvironment: process.env.NODE_ENV,
  }
}

export const config: AppConfiguration = getConfiguration();
