/// <reference types="vss-web-extension-sdk" />

import '@fortawesome/fontawesome-free/css/all.css'

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './css/main.scss';

import FeedbackBoardContainer, { FeedbackBoardContainerProps } from './components/feedbackBoardContainer';

import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
initializeIcons();

import { appInsightsClient, TelemetryEvents } from './utilities/appInsightsClient'
appInsightsClient.trackEvent(TelemetryEvents.ExtensionLaunched);

const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
  projectId: VSS.getWebContext().project.id
} 

ReactDOM.render(
  <FeedbackBoardContainer {...feedbackBoardContainerProps}/>,
  document.getElementById('root') as HTMLElement,
);
