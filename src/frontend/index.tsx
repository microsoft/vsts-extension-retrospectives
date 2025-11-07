import { initializeIcons } from "@fluentui/react/lib/Icons";
import React from "react";
import { createRoot } from "react-dom/client";
import { init as sdkInit } from "azure-devops-extension-sdk";
import { isHostedAzureDevOps } from "./utilities/azureDevOpsContextHelper";
import { getProjectId } from "./utilities/servicesHelper";
import "./css/main.scss";
import { reactPlugin } from "./utilities/telemetryClient";
import { AppInsightsErrorBoundary } from "@microsoft/applicationinsights-react-js";
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from "./components/feedbackBoardContainer";

// Catch all uncaught errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error("[window.onerror] Uncaught error:", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  return false;
};

window.addEventListener("unhandledrejection", function (event) {
  console.error("[unhandledrejection] Unhandled promise rejection:", event.reason);
});

initializeIcons("https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/");

sdkInit({ applyTheme: true }).then(() => {
  Promise.all([isHostedAzureDevOps(), getProjectId()]).then(res => {
    const feedbackBoardContainerProps: FeedbackBoardContainerProps = {
      isHostedAzureDevOps: res[0],
      projectId: res[1],
    };

    const root = createRoot(document.getElementById("root"));
    root.render(
      <AppInsightsErrorBoundary
        onError={error => {
          console.error("[ErrorBoundary] Caught error:", error);
          return <h1>We detected an error in the application</h1>;
        }}
        appInsights={reactPlugin}
      >
        <FeedbackBoardContainer {...feedbackBoardContainerProps} />
      </AppInsightsErrorBoundary>,
    );
  });
});
