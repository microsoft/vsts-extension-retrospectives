import React from "react";

import { encrypt, getUserIdentity } from "../utilities/userIdentityHelper";
import { ITeamEffectivenessMeasurementVoteCollection } from "../interfaces/feedback";
import { getIconElement } from "./icons";

export interface EffectivenessMeasurementRowProps {
  title: string;
  subtitle: string;
  iconClass: string;
  tooltip: string;
  questionId?: number;
  votes?: ITeamEffectivenessMeasurementVoteCollection[];
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

export interface EffectivenessMeasurementRowState {
  selected: number;
}

export default class EffectivenessMeasurementRow extends React.Component<EffectivenessMeasurementRowProps, EffectivenessMeasurementRowState> {
  private readonly votingScale = Array.from({ length: 10 }, (_, index) => index + 1);

  constructor(props: EffectivenessMeasurementRowProps) {
    super(props);
    const currentUserId = encrypt(getUserIdentity().id);
    const votes = this.props.votes || [];
    const vote = votes.find(e => e.userId === currentUserId)?.responses || [];
    const currentVote = vote.filter(vote => vote.questionId === this.props.questionId || "");
    this.state = {
      selected: currentVote.length > 0 ? currentVote[0].selection : 0,
    };
  }

  updateSelected = (selected: number) => {
    this.setState({ selected });
    this.props.onSelectedChange(selected);
  };

  public render() {
    return (
      <tr className="effectiveness-measurement-row">
        <th scope="row">
          <p>
            {getIconElement(this.props.iconClass)}
            {this.props.title}
          </p>
          {this.props.subtitle}
        </th>
        <td className="effectiveness-measurement-tooltip-cell">
          <button className="contextual-menu-button tooltip" aria-label={this.props.tooltip} title={this.props.tooltip}>
            {getIconElement("exclamation")}
          </button>
        </td>
        {this.votingScale.map((value: number) => {
          const isSelected = this.state.selected === value;
          return (
            <td key={value}>
              <button type="button" className={`team-assessment-score-button ${isSelected ? "team-assessment-score-button-selected" : ""}`} aria-label={`${value}`} aria-pressed={isSelected} onClick={() => this.updateSelected(value)}>
                <span className="team-assessment-score-circle" />
              </button>
            </td>
          );
        })}
      </tr>
    );
  }
}
