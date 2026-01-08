import React, { useCallback } from "react";
import { cn } from "../utilities/classNameHelper";
import { WorkflowPhase } from "../interfaces/workItem";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";

export interface IWorkflowStageProps {
  display: string;
  value: WorkflowPhase;
  isActive: boolean;
  ariaPosInSet: number;
  clickEventCallback: (clickedElement: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => void;
}

const WorkflowStage: React.FC<IWorkflowStageProps> = ({ display, value, isActive, ariaPosInSet, clickEventCallback }) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      clickEventCallback(event, value);
    },
    [clickEventCallback, value],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter") {
        clickEventCallback(event, value);
      }
    },
    [clickEventCallback, value],
  );

  const classes = cn("workflow-stage-tab", isActive && "workflow-stage-tab--active");

  return (
    <div className={classes} aria-setsize={4} aria-posinset={ariaPosInSet} aria-label={display} aria-selected={isActive} role="tab" onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0}>
      <p className="stage-text">{display}</p>
    </div>
  );
};

export default withAITracking(reactPlugin, WorkflowStage);
