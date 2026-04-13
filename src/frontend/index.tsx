import React from "react";
import { createRoot } from "react-dom/client";
import { init as sdkInit } from "azure-devops-extension-sdk";
import { AppInsightsErrorBoundary } from "@microsoft/applicationinsights-react-js";

import { isHostedAzureDevOps } from "./utilities/azureDevOpsContextHelper";
import { getProjectId } from "./utilities/servicesHelper";
import { initializeLocale, t } from "./utilities/localization";
import { reactPlugin } from "./utilities/telemetryClient";
import FeedbackBoardContainer, { FeedbackBoardContainerProps } from "./components/feedbackBoardContainer";

initializeLocale();

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
          return <h1>{t("app_error_boundary_heading")}</h1>;
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
        `<h2>${t("app_init_failed_heading")}</h2>` +
        `<p>${t("app_init_failed_description")}</p>` +
        `<p><strong>${t("app_init_failed_steps_heading")}</strong></p>` +
        "<ul>" +
        `<li>${t("app_init_failed_step_incognito")}</li>` +
        `<li>${t("app_init_failed_step_disable_extensions")}</li>` +
        `<li>${t("app_init_failed_step_tracking_prevention")}</li>` +
        `<li>${t("app_init_failed_step_refresh")}</li>` +
        "</ul>" +
        "</div>";
    }
  });
