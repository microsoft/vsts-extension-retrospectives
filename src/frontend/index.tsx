import React from "react";
import { createRoot } from "react-dom/client";
import { init as sdkInit } from "azure-devops-extension-sdk";
import { isHostedAzureDevOps } from "./utilities/azureDevOpsContextHelper";
import { getProjectId } from "./utilities/servicesHelper";
import { reactPlugin } from "./utilities/telemetryClient";
import { AppInsightsErrorBoundary } from "@microsoft/applicationinsights-react-js";
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from "./components/feedbackBoardContainer";

sdkInit({ applyTheme: true })
  .then(() => {
    return Promise.all([isHostedAzureDevOps(), getProjectId()]);
  })
  .then(res => {
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
  })
  .catch(error => {
    console.error("Failed to initialize the Retrospectives extension:", error);

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML =
        '<div style="padding: 20px; font-family: sans-serif;">' +
        "<h2>Unable to load Retrospectives</h2>" +
        "<p>The extension failed to initialize. This can happen if browser extensions, tracking prevention, or security tools are blocking required resources.</p>" +
        "<p><strong>Try these steps:</strong></p>" +
        "<ul>" +
        "<li>Open this page in an InPrivate/Incognito window</li>" +
        "<li>Disable browser extensions temporarily</li>" +
        "<li>Check that tracking prevention is not set to Strict</li>" +
        "<li>Refresh the page</li>" +
        "</ul>" +
        "</div>";
    }
  });
