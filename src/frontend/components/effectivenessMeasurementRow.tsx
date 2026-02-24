import React, { useState, useCallback, useMemo } from "react";

import { obfuscateUserId, getUserIdentity } from "../utilities/userIdentityHelper";
import { ITeamEffectivenessMeasurementVoteCollection } from "../interfaces/feedback";
import { getIconElement } from "./icons";

export interface EffectivenessMeasurementRowProps {
  title: string;
  subtitle: string;
  iconClassName: string;
  tooltip: string;
  questionId?: number;
  votes?: ITeamEffectivenessMeasurementVoteCollection[];
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

const VOTING_SCALE = Array.from({ length: 10 }, (_, index) => index + 1);

const EffectivenessMeasurementRow: React.FC<EffectivenessMeasurementRowProps> = ({ title, subtitle, iconClassName, tooltip, questionId, votes = [], onSelectedChange }) => {
  const initialSelection = useMemo(() => {
    const currentUserId = obfuscateUserId(getUserIdentity().id);
    const vote = votes.find(e => e.userId === currentUserId)?.responses || [];
    const currentVote = vote.filter(v => v.questionId === questionId);
    return currentVote.length > 0 ? currentVote[0].selection : 0;
  }, [votes, questionId]);

  const [selected, setSelected] = useState(initialSelection);

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
        <button type="button" className="contextual-menu-button tooltip" aria-label={`More information about ${title}`} aria-description={tooltip} title={tooltip}>
          {getIconElement("exclamation")}
        </button>
      </td>
      {VOTING_SCALE.map((value: number) => {
        const isSelected = selected === value;
        return (
          <td key={value}>
            <button type="button" className={`team-assessment-score-button ${isSelected ? "team-assessment-score-button-selected" : ""}`} aria-label={`${title}, score ${value}, ${value <= 6 ? "Unfavorable" : value <= 8 ? "Neutral" : "Favorable"}`} aria-pressed={isSelected} onClick={() => handleSelect(value)}>
              <span className="team-assessment-score-circle" />
            </button>
          </td>
        );
      })}
    </tr>
  );
};

export default EffectivenessMeasurementRow;
