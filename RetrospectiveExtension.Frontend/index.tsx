import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { init as sdkInit }  from 'azure-devops-extension-sdk';
import { isHostedAzureDevOps } from './utilities/azureDevOpsContextHelper';
import { getProjectId } from './utilities/servicesHelper';
import './css/main.scss';

import FeedbackBoardContainer, { FeedbackBoardContainerProps } from './components/feedbackBoardContainer';

initializeIcons();

sdkInit()
  .then(() => {
    Promise.all([isHostedAzureDevOps(), getProjectId()]).then(res => {
      const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
        isHostedAzureDevOps: res[0],
        projectId: res[1]
      };

      ReactDOM.render(
        <FeedbackBoardContainer {...feedbackBoardContainerProps}/>,
        document.getElementById('root') as HTMLElement,
      );
    });
  });
