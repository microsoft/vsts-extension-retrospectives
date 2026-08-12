import React from "react";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

interface IWhatsNewDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

const WHATS_NEW_HEADER_TEXT = "Highlights from releases v1.92.60, v1.92.59, v1.92.58, and v1.92.57 include:";

const WHATS_NEW_ITEMS = [
  "Refactored avatar rendering for feedback cards and board summary to use a unified avatar implementation.",
  "Improved avatar fallback behavior for initials and color rendering to align with Azure DevOps Coin behavior, and simplified permissions table identity icons.",
  "Added a Move Everyone control so board managers can move all participants to the selected retrospective phase.",
  "Expanded feedback search to include archived boards.",
  "Fixed a Focus Mode render loop that could cause constant CPU usage.",
  "Optimized board, permission, workflow-stage, and Team Assessment History rendering to reduce unnecessary updates.",
  "Improved board settings dialog layout, tabs, accessibility, and view-only settings for non-editors.",
  "Improved team and board loading, including default-team lookup, recovery from local-network access restrictions, and retrospective board links for Azure DevOps organizations in the Pakistan region.",
  "Increased the allowed length of retrospective column titles, added sort-direction indicators to Board Summary table headers, and improved permission management with team search and select-all controls.",
];

const WHATS_NEW_FOOTER_TEXT = "Refer to the Changelog for a complete history of updates.";

const WHATS_NEW_CHANGELOG_URL = "https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md";

export const WhatsNewDialog: React.FC<IWhatsNewDialogProps> = ({ dialogRef }) => (
  <dialog className="whats-new-dialog" aria-label="What is New" ref={dialogRef} onCancel={() => dialogRef.current!.close()}>
    <div className="header">
      <h2 className="title">{t("whats_new")}</h2>
      <button onClick={() => dialogRef.current!.close()} aria-label="Close">
        {getIconElement("close")}
      </button>
    </div>
    <div className="subText">{WHATS_NEW_HEADER_TEXT}</div>
    {WHATS_NEW_ITEMS.map(item => (
      <div className="subText li" key={item}>
        {item}
      </div>
    ))}
    <div className="subText">{WHATS_NEW_FOOTER_TEXT}</div>
    <div className="inner">
      <button className="button" onClick={() => window.open(WHATS_NEW_CHANGELOG_URL, "_blank")}>
        Open change log
      </button>
      <button className="default button" onClick={() => dialogRef.current!.close()}>
        {t("common_close")}
      </button>
    </div>
  </dialog>
);

export default WhatsNewDialog;
