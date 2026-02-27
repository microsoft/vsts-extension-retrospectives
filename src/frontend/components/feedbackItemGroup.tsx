import React, { useState, useCallback, useRef, useEffect } from "react";

import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { WorkflowPhase } from "../interfaces/workItem";
import localStorageHelper from "../utilities/localStorageHelper";
import { reactPlugin } from "../utilities/telemetryClient";
import FeedbackItem, { FeedbackItemHelper, IFeedbackItemProps } from "./feedbackItem";

export interface IFeedbackItemGroupProps {
  groupedWorkItems: IFeedbackItemProps[];
  mainFeedbackItem: IFeedbackItemProps;
  workflowState: WorkflowPhase;
}

const FeedbackItemGroup: React.FC<IFeedbackItemGroupProps> = ({ groupedWorkItems, mainFeedbackItem }) => {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackItemGroup");

  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const [isGroupExpanded, setIsGroupExpanded] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  const toggleGroupExpand = useCallback(() => {
    setIsGroupExpanded(prev => !prev);
  }, []);

  const setIsGroupBeingDragged = useCallback((dragging: boolean) => {
    setIsBeingDragged(dragging);
  }, []);

  const handleGroupKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === " " && target.tagName !== "BUTTON") {
        e.preventDefault();
        toggleGroupExpand();
      }
    },
    [toggleGroupExpand],
  );

  useEffect(() => {
    const currentRef = groupRef.current!;
    currentRef.addEventListener("keydown", handleGroupKeyDown);
    return () => {
      currentRef.removeEventListener("keydown", handleGroupKeyDown);
    };
  }, [handleGroupKeyDown]);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isBeingDragged) {
        e.preventDefault();
      }
      e.stopPropagation();
      e.dataTransfer.dropEffect = "link";
    },
    [isBeingDragged],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Using localStorage as a temporary solution for Edge issue
      // Bug 19016440: Edge drag and drop dataTransfer protocol is bugged
      const droppedItemId = e.dataTransfer?.getData("text/plain") || e.dataTransfer?.getData("text") || localStorageHelper.getIdValue();
      FeedbackItemHelper.handleDropFeedbackItemOnFeedbackItem(mainFeedbackItem, droppedItemId, mainFeedbackItem.id);
      e.stopPropagation();
    },
    [mainFeedbackItem],
  );

  const groupTitle = mainFeedbackItem.title || "Untitled feedback";

  return (
    <div ref={groupRef} className={`feedback-item-group ${isGroupExpanded ? "feedback-item-group-expanded" : ""}`} onDragOver={handleDragOver} onDrop={handleDrop} onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity} role="group" aria-label={`${groupTitle}. Feedback group with ${groupedWorkItems.length + 1} items${isGroupExpanded ? ", expanded" : ", collapsed"}`}>
      <ul className="item-cards" aria-label="Group Feedback Items">
        <li className="feedback-item-group-entry">
          <FeedbackItem
            {...mainFeedbackItem}
            groupedItemProps={{
              groupedCount: groupedWorkItems.length,
              isGroupExpanded: isGroupExpanded,
              isMainItem: true,
              parentItemId: undefined,
              setIsGroupBeingDragged: setIsGroupBeingDragged,
              toggleGroupExpand: toggleGroupExpand,
            }}
          />
        </li>
        {isGroupExpanded &&
          groupedWorkItems.map(itemProps => (
            <li key={itemProps.id} className="feedback-item-group-entry">
              <FeedbackItem
                {...itemProps}
                groupedItemProps={{
                  groupedCount: undefined,
                  isGroupExpanded: undefined,
                  isMainItem: false,
                  parentItemId: mainFeedbackItem.id,
                  setIsGroupBeingDragged: setIsGroupBeingDragged,
                  toggleGroupExpand: undefined,
                }}
              />
            </li>
          ))}
      </ul>
    </div>
  );
};

export default FeedbackItemGroup;
