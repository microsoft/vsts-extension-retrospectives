import React from "react";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";

import { encrypt, getUserIdentity } from "../utilities/userIdentityHelper";
import { ITeamEffectivenessMeasurementVoteCollection } from "../interfaces/feedback";

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

  private readonly renderVotingButton = (value: number) => {
    const isSelected = this.state.selected === value;
    return (
      <td key={value}>
        <button type="button" className={`team-assessment-score-button ${isSelected ? "team-assessment-score-button-selected" : ""}`} aria-label={`${value}`} aria-pressed={isSelected} onClick={() => this.updateSelected(value)}>
          <span className="team-assessment-score-circle" />
        </button>
      </td>
    );
  };

  public render() {
    return (
      <tr className="effectiveness-measurement-row">
        <td className="effectiveness-measurement-question-cell">
          <i className={this.props.iconClass} />
          &nbsp;&nbsp;
          <span style={{ fontWeight: "bolder" }}>{this.props.title}</span>
          <br />
          {this.props.subtitle}
        </td>
        <td className="effectiveness-measurement-tooltip-cell">
          <TooltipHost hostClassName="toggle-carousel-button-tooltip-wrapper" content={<div dangerouslySetInnerHTML={{ __html: this.props.tooltip }} />} calloutProps={{ gapSpace: 0 }}>
            <DefaultButton className="contextual-menu-button" iconProps={{ iconName: "Error" }} />
          </TooltipHost>
        </td>
        {this.votingScale.map(this.renderVotingButton)}
      </tr>
    );
  }
}
