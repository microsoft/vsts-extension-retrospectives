import React from 'react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { BaseSelectedItemsList } from 'office-ui-fabric-react/lib/SelectedItemsList';
import { IFeedbackBoardDocumentPermissions } from '../interfaces/feedback';

import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';
import { WebApiTeam } from 'azure-devops-extension-api/Core';
import SelectorCombo from './selectorCombo';
import { DataGrid, DataGridBody, DataGridCell, DataGridHeader, DataGridHeaderCell, DataGridRow, TableCellLayout, TableColumnDefinition, createTableColumn } from '@fluentui/react-components';

export interface IFeedbackBoardMetadataFormPermissionsProps {
  isPublic: boolean;
  permissions: IFeedbackBoardDocumentPermissions;
  permissionOptions: FeedbackBoardPermissionOption[];
  onPermissionChanged: (state: FeedbackBoardPermissionState) => void;
}

export interface FeedbackBoardPermissionState {
  isPublic: boolean;
  permissions: IFeedbackBoardDocumentPermissions
}

export interface FeedbackBoardPermissionOption {
  id: string;
  name: string;
  uniqueName: string;
  type: 'team' | 'member';
  thumbnailUrl?: string;
}

function FeedbackBoardMetadataFormPermissions(props: IFeedbackBoardMetadataFormPermissionsProps): JSX.Element {
  const [state, setState] = React.useState({
    isPublic: props.isPublic,
    permissions: props.permissions
  })

  const [filteredPermissionOptions, setFilteredPermissionOptions] = React.useState<FeedbackBoardPermissionOption[]>(props.permissionOptions);

  const handlePublicState = (isPublic: boolean) => {
    setState({
      ...state,
      isPublic,
      permissions: null
    })

    emitChangeEvent();
  }

  const emitChangeEvent = () => {
    props.onPermissionChanged({ isPublic: state.isPublic, permissions: state.permissions })
  }

  return <div className="board-metadata-form">
    <section className="board-metadata-form-board-settings">
      <Checkbox
        className="my-2"
        id="visible-to-every-team-member-checkbox"
        label="Visible to every Team Member in the Organization"
        ariaLabel="Visible to every Team Member. The board will be public."
        boxSide="start"
        defaultChecked={state.isPublic}
        onChange={(_, checked) => handlePublicState(checked)}
      />
    </section>

    <section className="board-metadata-form-board-settings">
      <div>
        <TextField
          ariaLabel="Search for a team or a member to add permissions"
          aria-required={true}
          placeholder={'Search teams or users'}
          id="retrospective-permission-search-input"
        />
      </div>
      <table className="board-metadata-table">
        <thead>
          <tr>
            <th><Checkbox
              className="my-2"
              id="visible-to-every-team-member-checkbox"
              ariaLabel="Visible to every Team Member. The board will be public."
              boxSide="start"
              defaultChecked={state.isPublic}
              onChange={(_, checked) => handlePublicState(checked)}
            /></th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredPermissionOptions.map((option, index) => {
            return (
              <tr key={'table-row-' + index}>
                <td>
                  <Checkbox
                    className="my-2"
                    id="visible-to-every-team-member-checkbox"
                    ariaLabel="Visible to every Team Member. The board will be public."
                    boxSide="start"
                    defaultChecked={state.isPublic}
                    onChange={(_, checked) => handlePublicState(checked)}
                  />
                </td>
                <td>{option.name}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  </div>;
}

export default withAITracking(reactPlugin, FeedbackBoardMetadataFormPermissions);
