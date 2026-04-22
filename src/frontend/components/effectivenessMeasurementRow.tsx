import React, { useState, useCallback, useMemo, useEffect } from "react";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";

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
const TOOLTIP_LINK_REGEX = /(https?:\/\/\S+)(?:\s\(([^)]+)\))?/g;

const getFavorabilityBand = (value: number): string => {
  if (value <= 6) {
    return "Unfavorable";
  }

  if (value <= 8) {
    return "Neutral";
  }

  return "Favorable";
};

const renderTooltipContent = (tooltip: string): React.ReactElement => {
  const segments: React.ReactElement[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of tooltip.matchAll(TOOLTIP_LINK_REGEX)) {
    const [fullMatch, url, label] = match;
    const matchStart = match.index ?? 0;

    if (matchStart > cursor) {
      segments.push(<span key={`tooltip-text-${key++}`}>{tooltip.slice(cursor, matchStart)}</span>);
    }

    segments.push(
      <a key={`tooltip-link-${key++}`} href={url} target="_blank" rel="noreferrer noopener">
        {label || url}
      </a>,
    );

    cursor = matchStart + fullMatch.length;
  }

  if (cursor < tooltip.length) {
    segments.push(<span key={`tooltip-text-${key++}`}>{tooltip.slice(cursor)}</span>);
  }

  return <p className="effectiveness-measurement-tooltip-content">{segments}</p>;
};

const EffectivenessMeasurementRow: React.FC<EffectivenessMeasurementRowProps> = ({ title, subtitle, iconClassName, tooltip, questionId, votes = [], onSelectedChange }) => {
  const initialSelection = useMemo(() => {
    const currentUserId = obfuscateUserId(getUserIdentity().id);
    const vote = votes.find(e => e.userId === currentUserId)?.responses || [];
    const currentVote = vote.find(v => v.questionId === questionId);
    return currentVote ? currentVote.selection : 0;
  }, [votes, questionId]);

  const [selected, setSelected] = useState(initialSelection);

  useEffect(() => {
    setSelected(initialSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes, questionId]);

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
        <TooltipHost
          hostClassName="effectiveness-measurement-tooltip-host"
          content={renderTooltipContent(tooltip)}
          calloutProps={{
            gapSpace: 4,
            doNotLayer: true,
            styles: {
              root: {
                zIndex: 1000000,
                marginTop: "0.5rem",
              },
              calloutMain: {
                width: "44rem",
                maxWidth: "min(90vw, 44rem)",
                padding: "0.125rem 0.25rem",
                textAlign: "left",
              },
            },
          }}
        >
          <button type="button" className="contextual-menu-button tooltip" aria-label={`More information about ${title}`} aria-description={tooltip}>
            {getIconElement("info")}
          </button>
        </TooltipHost>
      </td>
      {VOTING_SCALE.map((value: number) => {
        const isSelected = selected === value;
        const selectedState = isSelected ? "Selected" : "Not selected";
        return (
          <td key={value}>
            <button
              type="button"
              className={`team-assessment-score-button ${isSelected ? "team-assessment-score-button-selected" : ""}`}
              aria-label={`${title}, score ${value}, ${getFavorabilityBand(value)}, ${selectedState}`}
              aria-pressed={isSelected}
              onClick={() => handleSelect(value)}
            >
              <span className="team-assessment-score-circle" />
            </button>
          </td>
        );
      })}
    </tr>
  );
};

export default EffectivenessMeasurementRow;
