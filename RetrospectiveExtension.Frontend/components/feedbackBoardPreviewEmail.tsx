import * as copy from 'copy-to-clipboard';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ITextField, TextField } from 'office-ui-fabric-react/lib/TextField';
import * as React from 'react';
import { IFeedbackBoardDocument } from '../interfaces/feedback';
import { getBoardUrl } from '../utilities/boardUrlHelper';
import { shareBoardHelper } from '../utilities/shareBoardHelper';

interface IFeedbackBoardPreviewEmailState {
  emailContent: string;
}

interface IFeedbackBoardPreviewEmailProps {
  board: IFeedbackBoardDocument;
  teamId: string;
  onCopy: () => void;
}

export default class FeedbackBoardPreviewEmail extends React.Component<IFeedbackBoardPreviewEmailProps, IFeedbackBoardPreviewEmailState> {
  private emailTextField: ITextField;

  constructor(props: IFeedbackBoardPreviewEmailProps) {
    super(props);

    this.state = {
      emailContent: '',
    };
  }

  public async componentDidMount() {
    const url = await getBoardUrl(this.props.teamId, this.props.board.id);
    const previewContent: string = await shareBoardHelper.generateEmailText(this.props.board, url, false);
    this.setState({ emailContent: previewContent });
  }

  private handleClick = () => {
    if (this.emailTextField) {
      this.emailTextField.select();
    }
  }

  private onCopyButtonClick = () => {
    copy(this.state.emailContent);
    this.props.onCopy();
  }

  public render(): JSX.Element {
    if (!this.state.emailContent) {
      return (
        <Spinner className="preview-email-spinner"
          size={SpinnerSize.large}
          label="Loading..."
          ariaLive="assertive" />
      );
    }
    
    return (
      <>
        <ActionButton className="copy-email-button"
          text="Copy to clipboard"
          onClick={this.onCopyButtonClick}
          iconProps={{ iconName: "Copy" }} />
        <TextField multiline rows={20} className="preview-email-field"
            componentRef={(element: ITextField) => {this.emailTextField = element;}}
            readOnly={true}
            ariaLabel="Email summary for retrospective"
            onClick={(e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement, MouseEvent>) => {e.stopPropagation(); this.handleClick();}}
            value={this.state.emailContent} />
      </>
    );
  }
}
