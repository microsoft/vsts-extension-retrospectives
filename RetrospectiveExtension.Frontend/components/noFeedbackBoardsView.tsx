import * as React from 'react';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface NoFeedbackBoardsViewProps {
  onCreateBoardClick: () => void
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
        <DefaultButton
          primary={true}
          text="Create Board"
          onClick={this.props.onCreateBoardClick}
          className="create-new-board-button" />
      </div>
    )
  }
}

export default withAITracking(reactPlugin, NoFeedbackBoardsView);