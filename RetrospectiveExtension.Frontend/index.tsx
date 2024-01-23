import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

import React from 'react';
import * as ReactDOM from 'react-dom';
import { init as sdkInit } from 'azure-devops-extension-sdk';
import { isHostedAzureDevOps } from './utilities/azureDevOpsContextHelper';
import { getProjectId } from './utilities/servicesHelper';
import './css/main.scss';
import { reactPlugin } from './utilities/telemetryClient';
import { AppInsightsErrorBoundary } from '@microsoft/applicationinsights-react-js';
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from './components/feedbackBoardContainer';

initializeIcons();

sdkInit({ applyTheme: true }).then(() => {
  Promise.all([isHostedAzureDevOps(), getProjectId()]).then(res => {
    const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
      isHostedAzureDevOps: res[0],
      projectId: res[1]
    };

    ReactDOM.render(
      <AppInsightsErrorBoundary onError={() => <h1>We detected an error in the application</h1>} appInsights={reactPlugin}>
          <FeedbackBoardContainer {...feedbackBoardContainerProps} />
      </AppInsightsErrorBoundary>,
      document.getElementById('root') as HTMLElement,
    );
  });
});
