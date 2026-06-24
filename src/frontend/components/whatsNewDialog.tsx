import React from "react";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

interface IWhatsNewDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

const WHATS_NEW_HEADER_TEXT = "The two most recent releases addressed issues with create & edit board setup and add work item functionality.";

const WHATS_NEW_ITEMS = [
  "Fixed board name update behavior to prevent accidental renames resulting in duplicate board names.",
  "Added create and edit validation messaging for missing and duplicate retrospective names.",
  "Simplified wording for board settings and added notes for each option.",
  "Adjusted \'Add work item\' selection to ensure the full work item list is visible on Act tab.",
  "Limited Focus mode work item type options to requirement backlog types.",
  "Fixed issues with Act tab and Focus mode sorting and numbering.",
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