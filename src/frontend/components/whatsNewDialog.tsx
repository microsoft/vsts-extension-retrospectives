import React from "react";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

interface IWhatsNewDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

const WHATS_NEW_HEADER_TEXT = "Highlights from releases v1.92.59, v1.92.57, and v1.92.56 include:";

const WHATS_NEW_ITEMS = [
  "Restricted editing of retrospective settings to the Board Owner and Team Admin.",
  "Addressed legacy icon mapping gaps and updated icons used in templates, team assessment, and help menu.",
  "Streamlined the icon selection tray from 37 to 30 curated icons.",
  "Fixed the email summary Copy to clipboard action so it works reliably from the preview dialog.",
  "Extended permissions so team admins can also update column notes and edit or delete feedback cards.",
  "Improved hidden feedback behavior to display blurred feedback while announcing \"feedback blurred\".",
  "Added user settings to toggle between show all teams or my teams and to toggle between scrolling by board or by column.",
  "Added team admin setting for configuring available work item types in \"Add work item\".",
  "Defaulted add-work-item type options to Requirement Backlog types for the Act tab and Focus mode.",
  "Adjusted the \"Add work item\" selection to ensure the full list of work item types is visible for the Act tab and Focus mode.",
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