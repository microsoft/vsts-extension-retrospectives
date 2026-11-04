import React from "react";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

interface IWhatsNewDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

const WHATS_NEW_HEADER_TEXT = "Highlights from release v1.92.60 include:";

const WHATS_NEW_ITEMS = [
  "Fixed Move Everyone so board managers can change the phase for everyone; other open boards follow on their next live update.",
  "Improved deep-linked board navigation so the correct team stays visible even when the user is not a member of that team.",
  "Improved live updates across all retrospective phases, with automatic recovery from temporary sync failures.",
  "Improved notifications so they stay visible without covering open menus.",
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
