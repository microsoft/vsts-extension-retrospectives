import * as React from 'react';
import EditableText from './editableText';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/external/telemetryClient';

export interface EditableDocumentCardTitleProps {
  isDisabled?: boolean;
  isMultiline?: boolean;
  maxLength?: number;
  title: string;
  isChangeEventRequired: boolean;
  onSave: (newText: string) => void;
}

export interface EditableDocumentCardTitleState {
}

class EditableDocumentCardTitle extends React.Component<EditableDocumentCardTitleProps, EditableDocumentCardTitleState> {
  constructor(props: EditableDocumentCardTitleProps) {
    super(props);

    this.state = {
    };
  }

  public render(): JSX.Element {
    return (
      <div className="editable-document-card-title">
        <EditableText
          isDisabled={this.props.isDisabled}
          isMultiline={this.props.isMultiline}
          maxLength={this.props.maxLength}
          text={this.props.title}
          isChangeEventRequired={this.props.isChangeEventRequired}
          onSave={this.props.onSave}
        />
      </div>
    );
  }
}

export default withAITracking(reactPlugin, EditableDocumentCardTitle);