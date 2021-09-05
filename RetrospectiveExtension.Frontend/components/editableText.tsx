import * as React from 'react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

export interface EditableTextProps {
  isDisabled?: boolean;
  isMultiline?: boolean;
  maxLength?: number;
  text: string;
  isChangeEventRequired: boolean;
  onSave: (newText: string) => void;
}

export interface EditableTextState {
  isEditing: boolean;
  newText: string;
  hasErrors: boolean;
}

export default class EditableText extends React.Component<EditableTextProps, EditableTextState> {
  constructor(props: EditableTextProps) {
    super(props);

    this.state = {
      isEditing: this.props.text.trim() ? false : true,
      newText: this.props.text,
      hasErrors: false,
    };
  }

  public componentDidUpdate(prevProps: EditableTextProps) {
    if (this.props.text !== prevProps.text) {
      if (!this.state.isEditing) {
        this.setState({
          newText: this.props.text
        });
      }
    }
  }

  private editableTextRef: HTMLElement;

  private handleTextChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => {
    if (!newValue.trim()) {
      this.setState({
        newText: "",
        hasErrors: true
      });
    return;
    }

    this.setState({
      newText: newValue.replace(/\r?|\r/g, ""),
      hasErrors: !newValue.trim()
    });

    if (this.props.isChangeEventRequired) {
      this.props.onSave(newValue.replace(/\r?|\r/g, ""));
    }
  }

  private handleEdit = (event: React.MouseEvent<HTMLParagraphElement>) => {
    event.stopPropagation();
    this.setState({
      isEditing: true,
      hasErrors: false
    });
  }

  private handleEditKeyDown = (event: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (event.keyCode === 13) {
      event.stopPropagation();
      this.setState({
        isEditing: true,
        hasErrors: false
      });
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private handleClickOutside = (event: Event) => {
    if (this.editableTextRef && !this.editableTextRef.contains(event.target as Node)) {
      if (!this.state.newText.trim()) {
        this.setState({
          newText: "",
          hasErrors: true
        }, () => {
          this.props.onSave('')
        });
        return;
      }

      this.props.onSave(this.state.newText);
      this.setState({
        isEditing: false,
        hasErrors: !this.state.newText.trim()
      });
    }
  }

  private handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    // ESC
    if (event.keyCode === 27) {
      this.setState({
        isEditing: false,
        newText: this.props.text,
      }, () => {
        this.props.onSave(this.props.text);
      });
      return;
    }

    // Enter or tab
    if (event.keyCode === 13 || event.keyCode === 9) {
      if (!this.state.newText.trim()) {
        this.setState({ hasErrors: true });
        return;
      }

      this.props.onSave(this.state.newText);
      this.setState({
        isEditing: false,
        hasErrors: false
      });
    }

    // Enter + Ctrl
    if (event.keyCode === 13 && event.ctrlKey) {
      if (!this.state.newText.trim()) {
        this.setState({ hasErrors: true });
        return;
      }

      this.setState({
        newText: `${this.state.newText} \n`,
        isEditing: true,
        hasErrors: false
      });
    }
  }

  public render(): JSX.Element {
    if (this.state.isEditing) {
      return (
        <div
          className="editable-text-container"
          ref={(element) => {
            this.editableTextRef = element;
          }}
          aria-live="assertive">
          <TextField autoFocus
            ariaLabel="Please enter feedback title"
            inputClassName={'editable-text-input' + (this.state.hasErrors ? ' error-border' : '')}
            value={this.state.newText}
            onChange={this.handleTextChange}
            className="editable-text-input-container"
            autoAdjustHeight
            multiline={this.props.isMultiline}
            maxLength={this.props.maxLength}
            resizable={false}
            onKeyDown={this.handleKeyPress}
            onClick={(e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement, MouseEvent>) => {
              e.stopPropagation();
            }}
          />
            {this.state.hasErrors && <span className="input-validation-message">This cannot be empty.</span>}
          </div>
        );
    }

    return (
      <div
        className="editable-text-container">
        <p className="editable-text"
          tabIndex={0}
          onKeyDown={this.props.isDisabled ? () => {} : this.handleEditKeyDown}
          onClick={this.props.isDisabled ? () => {} : this.handleEdit}
          aria-label={'Feedback title is' + this.props.text + '. Click to edit.'}
          aria-required={true}>
          {this.props.text}
        </p>
      </div>
    );
  }
}
