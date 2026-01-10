import React from "react";
import EditableText from "./editableText";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";

export interface EditableDocumentCardTitleProps {
  isDisabled?: boolean;
  isMultiline?: boolean;
  maxLength?: number;
  title: string;
  isChangeEventRequired: boolean;
  onSave: (newText: string) => void;
}

const EditableDocumentCardTitle: React.FC<EditableDocumentCardTitleProps> = ({ isDisabled, isMultiline, maxLength, title, isChangeEventRequired, onSave }) => {
  const trackActivity = useTrackMetric(reactPlugin, "EditableDocumentCardTitle");

  return (
    <div className="editable-document-card-title" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <EditableText isDisabled={isDisabled} isMultiline={isMultiline} maxLength={maxLength} text={title} isChangeEventRequired={isChangeEventRequired} onSave={onSave} />
    </div>
  );
};

export default EditableDocumentCardTitle;
