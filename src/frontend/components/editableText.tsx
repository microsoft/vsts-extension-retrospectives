import React from "react";
import { TextField } from "@fluentui/react/lib/TextField";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";

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

class EditableText extends React.Component<EditableTextProps, EditableTextState> {
  constructor(props: EditableTextProps) {
    super(props);

    this.state = {
      isEditing: !this.props.text.trim(),
      newText: this.props.text,
      hasErrors: false,
    };
  }

  public componentDidUpdate(prevProps: EditableTextProps) {
    if (this.props.text !== prevProps.text) {
      if (!this.state.isEditing) {
        this.setState({
          newText: this.props.text,
        });
      }
    }
  }

  private editableTextRef: HTMLElement;

  private readonly handleTextChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string) => {
    if (!newValue.trim()) {
      this.setState({
        newText: "",
        hasErrors: true,
      });
      return;
    }

    this.setState({
      newText: newValue.replace(/\r?|\r/g, ""),
      hasErrors: !newValue.trim(),
    });

    if (this.props.isChangeEventRequired) {
      this.props.onSave(newValue.replace(/\r?|\r/g, ""));
    }
  };

  private readonly handleEdit = (event: React.MouseEvent<HTMLParagraphElement>) => {
    event.stopPropagation();
    this.setState({
      isEditing: true,
      hasErrors: false,
    });
  };

  private readonly handleEditKeyDown = (event: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === "Enter") {
      event.stopPropagation();
      this.setState({
        isEditing: true,
        hasErrors: false,
      });
    }
  };

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  private readonly handleClickOutside = (event: Event) => {
    if (this.editableTextRef && !this.editableTextRef.contains(event.target as Node)) {
      if (!this.state.newText.trim()) {
        this.setState(
          {
            newText: "",
            hasErrors: true,
          },
          () => {
            this.props.onSave("");
          },
        );
        return;
      }

      this.props.onSave(this.state.newText);
      this.setState({
        isEditing: false,
        hasErrors: !this.state.newText.trim(),
      });
    }
  };

  private readonly handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    // ESC
    if (event.key === "Escape") {
      this.setState(
        {
          isEditing: false,
          newText: this.props.text,
        },
        () => {
          this.props.onSave(this.props.text);
        },
      );
      return;
    }

    // Enter + Ctrl
    if (event.key === "Enter" && event.ctrlKey) {
      if (!this.state.newText.trim()) {
        this.setState({ hasErrors: true });
        return;
      }

      this.setState({
        newText: `${this.state.newText} \n`,
        isEditing: true,
        hasErrors: false,
      });

      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      if (!this.state.newText.trim()) {
        this.setState({ hasErrors: true });
        return;
      }

      this.props.onSave(this.state.newText);
      this.setState({
        isEditing: false,
        hasErrors: false,
      });
    }
  };

  public render(): React.JSX.Element {
    if (this.state.isEditing) {
      return (
        <div
          className="editable-text-container"
          ref={element => {
            this.editableTextRef = element;
          }}
          aria-live="assertive"
        >
          <TextField
            autoFocus
            ariaLabel="Please enter feedback title"
            aria-required={true}
            inputClassName={`editable-text-input${this.state.hasErrors ? " error-border" : ""}`}
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
      <div className="editable-text-container">
        <p className="editable-text" tabIndex={0} onKeyDown={this.props.isDisabled ? () => {} : this.handleEditKeyDown} onClick={this.props.isDisabled ? () => {} : this.handleEdit} role="textbox" title="Click to edit" aria-required={true} aria-label={`Feedback title is ${this.props.isDisabled ? "obscured during collection." : this.props.text + ". Click to edit."}`}>
          {this.props.text}
        </p>
      </div>
    );
  }
}

export default withAITracking(reactPlugin, EditableText);
