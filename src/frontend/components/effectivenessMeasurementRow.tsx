import React, { useState, useCallback, useEffect } from "react";

import { hashUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import { ITeamEffectivenessMeasurementVoteCollection } from "../interfaces/feedback";
import { getIconElement } from "./icons";

export interface EffectivenessMeasurementRowProps {
  title: string;
  subtitle: string;
  iconClassName: string;
  tooltip: string;
  questionId?: number;
  boardId: string;
  votes?: ITeamEffectivenessMeasurementVoteCollection[];
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

const VOTING_SCALE = Array.from({ length: 10 }, (_, index) => index + 1);

const EffectivenessMeasurementRow: React.FC<EffectivenessMeasurementRowProps> = ({ title, subtitle, iconClassName, tooltip, questionId, boardId, votes = [], onSelectedChange }) => {
  const [selected, setSelected] = useState(0);
  const [hashedUserId, setHashedUserId] = useState<string>("");

  // Compute hashed user ID asynchronously
  useEffect(() => {
    const computeHash = async () => {
      const hashed = await hashUserId(getUserIdentity().id, boardId);
      setHashedUserId(hashed);
    };
    computeHash();
  }, [boardId]);

  // Determine initial selection based on hashed user ID
  useEffect(() => {
    if (!hashedUserId) return;
    const vote = votes.find(e => e.userId === hashedUserId)?.responses || [];
    const currentVote = vote.filter(v => v.questionId === questionId);
    if (currentVote.length > 0) {
      setSelected(currentVote[0].selection);
    }
  }, [hashedUserId, votes, questionId]);

  const handleSelect = useCallback(
    (value: number) => {
      setSelected(value);
      onSelectedChange(value);
    },
    [onSelectedChange],
  );

  return (
    <tr className="effectiveness-measurement-row">
      <th scope="row">
        <p>
          {getIconElement(iconClassName)}
          {title}
        </p>
        {subtitle}
      </th>
      <td className="effectiveness-measurement-tooltip-cell">
        <button className="contextual-menu-button tooltip" aria-label={tooltip} title={tooltip}>
          {getIconElement("exclamation")}
        </button>
      </td>
      {VOTING_SCALE.map((value: number) => {
        const isSelected = selected === value;
        return (
          <td key={value}>
            <button type="button" className={`team-assessment-score-button ${isSelected ? "team-assessment-score-button-selected" : ""}`} aria-label={`${value}`} aria-pressed={isSelected} onClick={() => handleSelect(value)}>
              <span className="team-assessment-score-circle" />
            </button>
          </td>
        );
      })}
    </tr>
  );
};

export default EffectivenessMeasurementRow;
