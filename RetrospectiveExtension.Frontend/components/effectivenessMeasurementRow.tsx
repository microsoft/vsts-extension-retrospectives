import * as React from 'react';

export interface EffectivenessMeasurementRowProps {
  title: string;
  questionId?: string;
  votes?: { [voter: string]: {questionId: string, selection: number}[]};
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

export interface EffectivenessMeasurementRowState {
}

export default class EffectivenessMeasurementRow extends React.Component<EffectivenessMeasurementRowProps, EffectivenessMeasurementRowState> {
  constructor(props: EffectivenessMeasurementRowProps) {
    super(props);
  }
  public render() {
    return (
    );
  }
}
