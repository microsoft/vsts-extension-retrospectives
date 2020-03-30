const environment = {
  CollaborationStateServiceUrl: process.env.NODE_ENV !== 'production'
  ? 'https://collaborationstateservice-int.azurewebsites.net'
  : 'https://retrospectivesbackendservice.azurewebsites.net',
  CurrentEnvironment: process.env.NODE_ENV,
  AppInsightsInstrumentKey: process.env.NODE_ENV !== 'production'
    ? '26d5beb3-87a7-43da-b6bc-a78618ee657f'
    : '5fc71d68-349e-4a15-a894-9fb382e47f76'
};

export default environment;
