import * as React from 'react';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';

import { getUserIdentity } from '../utilities/userIdentityHelper';

import { ITeamEffectivenessMeasurementVoteCollection } from '../interfaces/feedback';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface EffectivenessMeasurementRowProps {
  title: string;
  tooltip: JSX.Element;
  questionId?: string;
  votes?: ITeamEffectivenessMeasurementVoteCollection[];
  selected?: number;

  onSelectedChange: (selected: number) => void;
}

export interface EffectivenessMeasurementRowState {
  selected: number;
}

 class EffectivenessMeasurementRow extends React.Component<EffectivenessMeasurementRowProps, EffectivenessMeasurementRowState> {
  constructor(props: EffectivenessMeasurementRowProps) {
    super(props);
    const currentUserId = getUserIdentity().id;
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
  }

  public render() {
    return (
      <tr>
        <td>{this.props.title}</td>
        <td>
          <TooltipHost
            hostClassName="toggle-carousel-button-tooltip-wrapper"
            content={ this.props.tooltip }
            calloutProps={{ gapSpace: 0 }}>
            <DefaultButton
              className="contextual-menu-button hide-mobile"
              iconProps={{ iconName: 'Error' }}
            />
          </TooltipHost>
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="1"
            onClick={() => this.updateSelected(1)}
            iconProps={{ iconName: this.state.selected === 1 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="2"
            onClick={() => this.updateSelected(2)}
            iconProps={{ iconName: this.state.selected === 2 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="3"
            onClick={() => this.updateSelected(3)}
            iconProps={{ iconName: this.state.selected === 3 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="4"
            onClick={() => this.updateSelected(4)}
            iconProps={{ iconName: this.state.selected === 4 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="5"
            onClick={() => this.updateSelected(5)}
            iconProps={{ iconName: this.state.selected === 5 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="6"
            onClick={() => this.updateSelected(6)}
            iconProps={{ iconName: this.state.selected === 6 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="7"
            onClick={() => this.updateSelected(7)}
            iconProps={{ iconName: this.state.selected === 7 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="8"
            onClick={() => this.updateSelected(8)}
            iconProps={{ iconName: this.state.selected === 8 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="9"
            onClick={() => this.updateSelected(9)}
            iconProps={{ iconName: this.state.selected === 9 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
        <td>
          <DefaultButton
            className="contextual-menu-button hide-mobile"
            aria-label="10"
            onClick={() => this.updateSelected(10)}
            iconProps={{ iconName: this.state.selected === 10 ? 'CircleFill' : 'CircleRing' }}
          />
        </td>
      </tr>
    );
  }
}

export default withAITracking(reactPlugin, EffectivenessMeasurementRow);
