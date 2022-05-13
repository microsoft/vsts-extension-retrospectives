import classNames from 'classnames';
import * as React from 'react';
import { WorkflowPhase } from '../interfaces/workItem';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface IWorkflowStageProps {
  display: string;
  value: WorkflowPhase;
  isActive: boolean;
  clickEventCallback: (clickedElement: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => void;
}

export interface IWorkflowStageState {
}

 class WorkflowStage extends React.Component<IWorkflowStageProps, IWorkflowStageState> {
  constructor(props: IWorkflowStageProps) {
    super(props);
    this.state = { };
  }

  public clickWorkflowState = (clickedElement: React.MouseEvent<HTMLElement>, newState: WorkflowPhase) => {
    this.props.clickEventCallback(clickedElement, newState);
  }

  public render() {
    const classes = classNames( 'retrospective-workflowState', {
      active: ( this.props.isActive ),
    });
    const ariaLabel = this.props.isActive
      ? 'Selected ' + this.props.display + ' workflow stage'
      : 'Not selected ' + this.props.display + ' workflow stage';

    return (
      <div className={classes}
        aria-label={ariaLabel}
        role="tab"
        onClick={ (e) => this.clickWorkflowState(e, this.props.value) }
        onKeyDown={ (e) => this.handleKeyPressWorkFlowState(e, this.props.value) }
        tabIndex={0}>
        <p className="stage-text">
          {this.props.display}
        </p>
      </div>
    );
  }

  private handleKeyPressWorkFlowState = (event: React.KeyboardEvent<HTMLDivElement>, newState: WorkflowPhase) => {
    if (event.keyCode === 13) {
      this.props.clickEventCallback(event, newState);
    }
    return;
  }
}

export default withAITracking(reactPlugin, WorkflowStage);
