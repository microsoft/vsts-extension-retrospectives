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

  const PermissionImage = (props: {option: FeedbackBoardPermissionOption}) => {
    if (props.option.type === 'team') {
      return <i className="permission-image fa-solid fa-users h-11 w-11"></i>
    }

    return <img className="permission-image" src={props.option.thumbnailUrl} alt={`Permission image for ${props.option.name}`} />
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

    <section className="board-metadata-form-board-settings board-metadata-form-board-settings--no-padding">
      <div className="search-bar">
        <TextField
          ariaLabel="Search for a team or a member to add permissions"
          aria-required={true}
          placeholder={'Search teams or users'}
          id="retrospective-permission-search-input"
        />
      </div>
      <div className="board-metadata-table-container">
        {/* TODO: Replace with Fluent grid once we migration components over */}
        <table className="board-metadata-table">
          <thead>
            <tr>
              <th className="cell-checkbox">
                <Checkbox
                  className="my-2"
                  id="visible-to-every-team-member-checkbox"
                  ariaLabel="Visible to every Team Member. The board will be public."
                  boxSide="start"
                  defaultChecked={false}
                  onChange={(_, checked) => handlePublicState(checked)}
                />
              </th>
              <th className={"text-left"}>
                <span>{"Name"}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissionOptions.map((option, index) => {
              return (
                <tr key={'table-row-' + index} className="option-row" onClick={() => handlePublicState(!state.isPublic)}>
                  <td>
                    <Checkbox
                      className="my-2"
                      id="visible-to-every-team-member-checkbox"
                      ariaLabel="Visible to every Team Member. The board will be public."
                      boxSide="start"
                      defaultChecked={false}
                    />
                  </td>
                  <td className="cell-content flex flex-row flex-nowrap">
                    <div className="content-image">
                      <PermissionImage option={option} />
                    </div>
                    <div className="content-text flex flex-col flex-nowrap text-left">
                      <span>{option.name}</span>
                      <span>{option.uniqueName}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}

export default withAITracking(reactPlugin, FeedbackBoardMetadataFormPermissions);
