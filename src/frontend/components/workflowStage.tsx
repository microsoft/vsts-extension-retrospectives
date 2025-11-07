import React from "react";
import { cn } from "../utilities/classNameHelper";
import { WorkflowPhase } from "../interfaces/workItem";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";

export interface IWorkflowStageProps {
  display: string;
  value: WorkflowPhase;
  isActive: boolean;
  ariaPosInSet: number;
  clickEventCallback: (clickedElement: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLDivElement>, newPhase: WorkflowPhase) => void;
}

export interface IWorkflowStageState {}

class WorkflowStage extends React.Component<IWorkflowStageProps, IWorkflowStageState> {
  constructor(props: IWorkflowStageProps) {
    super(props);
    this.state = {};
  }

  public clickWorkflowState = (clickedElement: React.MouseEvent<HTMLElement>, newState: WorkflowPhase) => {
    this.props.clickEventCallback(clickedElement, newState);
  };

  public render() {
    const classes = cn("px-2.5 py-1.5 cursor-pointer text-sm", this.props.isActive && "font-bold border-b-2 border-[#0078d4]");

    return (
      <div className={classes} aria-setsize={4} aria-posinset={this.props.ariaPosInSet} aria-label={this.props.display} aria-selected={this.props.isActive} role="tab" onClick={e => this.clickWorkflowState(e, this.props.value)} onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => this.handleKeyPressWorkFlowState(e, this.props.value)} tabIndex={0}>
        <p className="stage-text">{this.props.display}</p>
      </div>
    );
  }

  private handleKeyPressWorkFlowState = (event: React.KeyboardEvent<HTMLDivElement>, newState: WorkflowPhase) => {
    if (event.key === "Enter") {
      this.props.clickEventCallback(event, newState);
    }
    return;
  };
}

export default withAITracking(reactPlugin, WorkflowStage);
