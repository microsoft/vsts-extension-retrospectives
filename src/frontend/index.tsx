import { registerIcons } from "@fluentui/react/lib/Styling";
import React from "react";
import { createRoot } from "react-dom/client";
import { init as sdkInit } from "azure-devops-extension-sdk";
import { isHostedAzureDevOps } from "./utilities/azureDevOpsContextHelper";
import { getProjectId } from "./utilities/servicesHelper";
import { reactPlugin } from "./utilities/telemetryClient";
import { AppInsightsErrorBoundary } from "@microsoft/applicationinsights-react-js";
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from "./components/feedbackBoardContainer";
import { fluentUiIcons } from "./components/icons";

registerIcons({ icons: fluentUiIcons });

sdkInit({ applyTheme: true }).then(() => {
  Promise.all([isHostedAzureDevOps(), getProjectId()]).then(res => {
    const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
      isHostedAzureDevOps: res[0],
      projectId: res[1],
    };

    const root = createRoot(document.getElementById("root"));
    root.render(
      <AppInsightsErrorBoundary
        onError={() => {
          return <h1>We detected an error in the application</h1>;
        }}
        appInsights={reactPlugin}
      >
        <FeedbackBoardContainer {...feedbackBoardContainerProps} />
      </AppInsightsErrorBoundary>,
    );
  });
});
