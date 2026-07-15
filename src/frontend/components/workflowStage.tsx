import React, { useCallback } from "react";
import { WorkflowPhase } from "../interfaces/workItem";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { getIconElement } from "./icons";
import { t } from "../utilities/localization";

export interface IWorkflowStageProps {
  display: string;
  value: WorkflowPhase;
  isActive: boolean;
  ariaPosInSet: number;
  clickEventCallback: (clickedElement: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => void;
  canManageBoard?: boolean;
  isMoveEveryonePending?: boolean;
  isLiveSyncAvailable?: boolean;
  moveEveryoneCallback?: (newPhase: WorkflowPhase) => void;
}

const WorkflowStage: React.FC<IWorkflowStageProps> = ({ display, value, isActive, ariaPosInSet, clickEventCallback, canManageBoard = false, isMoveEveryonePending = false, isLiveSyncAvailable = true, moveEveryoneCallback }) => {
  const trackActivity = useTrackMetric(reactPlugin, "WorkflowStage");
  const moveEveryoneLabel = t("workflow_move_everyone_to_phase", { phase: display });
  const moveEveryoneTooltip = isLiveSyncAvailable ? moveEveryoneLabel : t("workflow_move_everyone_live_sync_unavailable");
  const moveEveryoneTooltipId = `move-everyone-${value.toLowerCase()}-tooltip`;

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

  const combinedKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      trackActivity();
      handleKeyDown(event);
    },
    [trackActivity, handleKeyDown],
  );

  const handleMoveEveryone = useCallback(() => {
    moveEveryoneCallback?.(value);
  }, [moveEveryoneCallback, value]);

  return (
    <div className="workflow-stage-wrapper">
      {canManageBoard && isActive && (
        <>
          <button type="button" className="workflow-stage-move-everyone" aria-label={moveEveryoneLabel} aria-describedby={moveEveryoneTooltipId} aria-busy={isMoveEveryonePending} disabled={isMoveEveryonePending || !isLiveSyncAvailable} onClick={handleMoveEveryone} interestFor={moveEveryoneTooltipId}>
            {getIconElement("people-forward")}
            <span>{t("workflow_move_everyone")}</span>
          </button>
          <div id={moveEveryoneTooltipId} className="tooltip" popover="hint" role="tooltip">
            {moveEveryoneTooltip}
          </div>
        </>
      )}
      <div className={`workflow-stage-tab${isActive ? " workflow-stage-tab--active" : ""}`} aria-setsize={4} aria-posinset={ariaPosInSet} aria-label={display} aria-selected={isActive} role="tab" onClick={handleClick} onKeyDown={combinedKeyDown} onMouseMove={trackActivity} onTouchStart={trackActivity} tabIndex={0}>
        <p className="stage-text">{display}</p>
      </div>
    </div>
  );
};

export default WorkflowStage;
