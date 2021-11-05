import * as React from 'react';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { getUserIdentity } from '../utilities/userIdentityHelper';

export interface EffectivenessMeasurementRowProps {
  title: string;
  questionId?: string;
  votes?: { [voter: string]: {questionId: string, selection: number}[]};
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

export interface EffectivenessMeasurementRowState {
  selected: number;
}

export default class EffectivenessMeasurementRow extends React.Component<EffectivenessMeasurementRowProps, EffectivenessMeasurementRowState> {
  constructor(props: EffectivenessMeasurementRowProps) {
    super(props);
    const currentUserId = getUserIdentity().id;
    const votes = this.props.votes || {};
    const vote = votes[currentUserId] || [];
    const currentVote = vote.filter(vote => vote.questionId === this.props.questionId || "");
    this.state = {
      selected: currentVote.length > 0 ? currentVote[0].selection : 0,
    };
  }

  updateSelected = (selected: number) => {
    this.setState({ selected });
    this.props.onSelectedChange(selected);
  }

  public render() {
    return (
    );
  }
}
