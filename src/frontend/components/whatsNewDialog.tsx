import React from "react";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

interface IWhatsNewDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

const WHATS_NEW_HEADER_TEXT = "Highlights from releases v1.92.59, v1.92.58, and v1.92.57 include:";

const WHATS_NEW_ITEMS = [
  "Updated legacy icon mappings and curated the icon selection tray.",
  "Improved team and board loading, including default-team lookup and recovery from local-network access restrictions.",
  "Fixed retrospective board links for Azure DevOps organizations in the Pakistan region.",
  "Added longer column titles and sort-direction indicators to Board Summary.",
  "Reorganized board settings and permissions into tabs, with team search and select-all permission controls.",
  "Added contextual tooltips for column details and commonly used board controls.",
  "Fixed email summary scrolling and Copy to clipboard, and extended team-admin permissions for cards and column notes.",
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