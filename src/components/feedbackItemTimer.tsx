import React, { useCallback } from "react";
import { getIconElement } from "./icons";

export interface IFeedbackItemTimerProps {
  feedbackItemId: string;
  timerSecs: number;
  timerState: boolean;
  onTimerToggle: (feedbackItemId: string) => void;
}

export const formatTimer = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const FeedbackItemTimer: React.FC<IFeedbackItemTimerProps> = ({ feedbackItemId, timerSecs, timerState, onTimerToggle }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onTimerToggle(feedbackItemId);
    },
    [feedbackItemId, onTimerToggle],
  );

  return (
    <div className="card-action-timer">
      <button title="Timer" aria-live="polite" aria-label={timerState ? "Stop timer" : "Start timer"} tabIndex={-1} data-card-control="true" className="feedback-action-button" onClick={handleClick}>
        {timerState ? getIconElement("stop-circle") : getIconElement("play-circle")}
        <span>{formatTimer(timerSecs)} elapsed</span>
      </button>
    </div>
  );
};

FeedbackItemTimer.displayName = "FeedbackItemTimer";

export default FeedbackItemTimer;
