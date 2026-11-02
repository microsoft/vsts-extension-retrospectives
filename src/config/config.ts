export interface AppConfiguration {
  AppInsightsInstrumentKey: string;
  CurrentEnvironment: string;
}

const getConfiguration = (): AppConfiguration => {
  const appInsightsInstrumentKey = process.env.REACT_APP_APP_INSIGHTS_INSTRUMENTATION_KEY;
  if (!appInsightsInstrumentKey) {
    console.warn(`missing Application Insights Instrumentation key, logging and telemetry will not be collected`);
  }
  return {
    AppInsightsInstrumentKey: appInsightsInstrumentKey || "",
    CurrentEnvironment: process.env.NODE_ENV,
  };
};

export const config: AppConfiguration = getConfiguration();
