import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { parseMarkdown, hasMarkdownFormatting } from "../utilities/markdownUtils";

export interface EditableTextProps {
  isDisabled?: boolean;
  isMultiline?: boolean;
  maxLength?: number;
  text: string;
  isChangeEventRequired: boolean;
  onSave: (newText: string) => void;
}

export const EditableText: React.FC<EditableTextProps> = ({ isDisabled, isMultiline, maxLength, text, isChangeEventRequired, onSave }) => {
  const trackActivity = useTrackMetric(reactPlugin, "EditableText");

  const [isEditing, setIsEditing] = useState(!text.trim());
  const [newText, setNewText] = useState(text);
  const [hasErrors, setHasErrors] = useState(false);

  const editableTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setNewText(text);
    }
  }, [text, isEditing]);

  const handleClickOutside = useCallback(
    (event: Event) => {
      if (editableTextRef.current && !editableTextRef.current.contains(event.target as Node)) {
        if (!newText.trim()) {
          setNewText("");
          setHasErrors(true);
          onSave("");
          return;
        }

        onSave(newText);
        setIsEditing(false);
        setHasErrors(!newText.trim());
      }
    },
    [newText, onSave],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      if (!newValue.trim()) {
        setNewText("");
        setHasErrors(true);
        return;
      }

      const sanitizedValue = newValue.replace(/\r?|\r/g, "");
      setNewText(sanitizedValue);
      setHasErrors(!newValue.trim());

      if (isChangeEventRequired) {
        onSave(sanitizedValue);
      }
    },
    [isChangeEventRequired, onSave],
  );

  const handleEdit = useCallback((event: React.MouseEvent<HTMLParagraphElement>) => {
    event.stopPropagation();
    setIsEditing(true);
    setHasErrors(false);
  }, []);

  const handleEditKeyDown = useCallback((event: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === "Enter") {
      event.stopPropagation();
      setIsEditing(true);
      setHasErrors(false);
    }
  }, []);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      event.stopPropagation();

      if (event.key === "Escape") {
        setIsEditing(false);
        setNewText(text);
        onSave(text);
        return;
      }

      if (event.key === "Enter" && (event.shiftKey || event.ctrlKey)) {
        if (!newText.trim()) {
          setHasErrors(true);
          return;
        }

        setHasErrors(false);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        if (!newText.trim()) {
          setHasErrors(true);
          return;
        }

        onSave(newText);
        setIsEditing(false);
        setHasErrors(false);
      }
    },
    [newText, text, onSave],
  );

  if (isEditing) {
    return (
      <div className="editable-text-container" ref={editableTextRef} onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
        <div className="editable-text-input-container">
          {isMultiline ? (
            <textarea
              autoFocus
              aria-label="Please enter feedback title"
              aria-required={true}
              className={`editable-text-input${hasErrors ? " error-border" : ""}`}
              value={newText}
              onChange={handleTextChange}
              maxLength={maxLength}
              onKeyDown={handleKeyPress}
              onClick={(e: React.MouseEvent<HTMLTextAreaElement>) => {
                e.stopPropagation();
              }}
            />
          ) : (
            <input
              autoFocus
              aria-label="Please enter feedback title"
              aria-required={true}
              className={`editable-text-input${hasErrors ? " error-border" : ""}`}
              type="text"
              value={newText}
              onChange={handleTextChange}
              maxLength={maxLength}
              onKeyDown={handleKeyPress}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                e.stopPropagation();
              }}
            />
          )}
        </div>
        {hasErrors && (
          <span className="input-validation-message" role="alert" aria-live="assertive">
            This cannot be empty.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="editable-text-container" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <p className="editable-text" tabIndex={0} onKeyDown={isDisabled ? () => {} : handleEditKeyDown} onClick={isDisabled ? () => {} : handleEdit} role="textbox" title="Click to edit" aria-required={true} aria-label={`Feedback title is ${isDisabled ? "obscured during collection." : text + ". Click to edit."}`}>
        {hasMarkdownFormatting(text) ? parseMarkdown(text) : text}
      </p>
    </div>
  );
};

export default EditableText;
