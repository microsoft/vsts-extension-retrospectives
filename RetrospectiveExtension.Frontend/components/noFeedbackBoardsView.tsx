import * as React from 'react';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
const NoWorkSvg = require('../images/zerodata-no-work-scheduled.svg');

export interface NoFeedbackBoardsViewProps {
  onCreateBoardClick: () => void
}

export default class NoFeedbackBoardsView extends React.Component<NoFeedbackBoardsViewProps> {
  constructor(props: NoFeedbackBoardsViewProps) {
    super(props);
  }

  public render() {
    return (
      <div className="no-boards-container">
        <img src={NoWorkSvg} alt="No Retrospectives found, create your first one to get started." />
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
