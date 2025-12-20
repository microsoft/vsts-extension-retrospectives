import React from "react";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";

export interface NoFeedbackBoardsViewProps {
  onCreateBoardClick: () => void;
}

class NoFeedbackBoardsView extends React.Component<NoFeedbackBoardsViewProps> {
  constructor(props: NoFeedbackBoardsViewProps) {
    super(props);
  }

  public render() {
    return (
      <div className="no-boards-container">
        <div className="no-boards-text">Get started with your first Retrospective</div>
        <div className="no-boards-sub-text">Create a new board to start collecting feedback and create new work items.</div>
        <button title="Create Board" onClick={this.props.onCreateBoardClick} className="create-new-board-button">
          Create Board
        </button>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, NoFeedbackBoardsView);
