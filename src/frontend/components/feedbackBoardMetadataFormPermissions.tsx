import React, { useEffect } from 'react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from '../interfaces/feedback';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from '../utilities/telemetryClient';

export interface IFeedbackBoardMetadataFormPermissionsProps {
  board: IFeedbackBoardDocument;
  permissions: IFeedbackBoardDocumentPermissions;
  permissionOptions: FeedbackBoardPermissionOption[];
  onPermissionChanged: (state: FeedbackBoardPermissionState) => void;
}

export interface FeedbackBoardPermissionState {
  permissions: IFeedbackBoardDocumentPermissions
}

export interface FeedbackBoardPermissionOption {
  id: string;
  name: string;
  uniqueName: string;
  hasPermission?: boolean;
  type: 'team' | 'member';
  thumbnailUrl?: string;
}

function FeedbackBoardMetadataFormPermissions(props: Readonly<IFeedbackBoardMetadataFormPermissionsProps>): JSX.Element {
  const [teamPermissions, setTeamPermissions] = React.useState(props.permissions?.Teams ?? []);
  const [memberPermissions, setMemberPermissions] = React.useState(props.permissions?.Members ?? []);
  const [filteredPermissionOptions, setFilteredPermissionOptions] = React.useState<FeedbackBoardPermissionOption[]>(props.permissionOptions);
  const [selectAllChecked, setSelectAllChecked] = React.useState<boolean>(false);
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const handleSelectAllClicked = (checked: boolean) => {
    if(checked) {
      setTeamPermissions([...teamPermissions, ...filteredPermissionOptions.filter(o => o.type === 'team' && !teamPermissions.includes(o.id)).map(o => o.id)]);
      setMemberPermissions([...memberPermissions, ...filteredPermissionOptions.filter(o => o.type === 'member' && !memberPermissions.includes(o.id)).map(o => o.id)]);
    } else {
      setTeamPermissions(teamPermissions.filter(o => !filteredPermissionOptions.map(o => o.id).includes(o)));
      setMemberPermissions(memberPermissions.filter(o => !filteredPermissionOptions.map(o => o.id).includes(o)));
    }

    setSelectAllState();
  }

  const handlePermissionClicked = (option: FeedbackBoardPermissionOption, hasPermission: boolean) => {
    let permissionList: string[] = option.type === 'team'
      ? teamPermissions ?? []
      : memberPermissions ?? [];

    if(hasPermission) {
      permissionList.push(option.id);
    } else {
      permissionList = permissionList.filter(t => t !== option.id);
    }

    if(option.type === 'team') {
      setTeamPermissions([...permissionList]);
    }
    else {
      setMemberPermissions([...permissionList]);
    }
  }

  const handleSearchTermChanged = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);

    const filteredOptions: FeedbackBoardPermissionOption[] = props.permissionOptions.filter(o => {
      if(newSearchTerm.length === 0) {
        return true
      }

      return o.name.toLowerCase().includes(newSearchTerm.toLowerCase());
    });

    setSelectAllState();
    setFilteredPermissionOptions(orderedPermissionOptions(filteredOptions));
  }

  const setSelectAllState = () => {
    const allVisibleIds = filteredPermissionOptions.map(o => o.id);
    const allPermissionIds = [...teamPermissions, ...memberPermissions];
    const allVisibleIdsAreInFilteredOptions: boolean = allVisibleIds.every(id => allPermissionIds.includes(id));

    setSelectAllChecked(allVisibleIdsAreInFilteredOptions);
  };

  const orderedPermissionOptions = (options: FeedbackBoardPermissionOption[]): FeedbackBoardPermissionOption[] => {
    const orderedPermissionOptions = options
      .map(o => {
        o.hasPermission = teamPermissions.includes(o.id) || memberPermissions.includes(o.id);
        return o;
      })
      .sort((a, b) => {
        if (a.hasPermission !== b.hasPermission) {
          return b.hasPermission ? 1 : -1;
        }

        return a.name.localeCompare(b.name);
      });

    return orderedPermissionOptions;
  }

  const emitChangeEvent = () => {
    props.onPermissionChanged({
      permissions: {
        Teams: teamPermissions,
        Members: memberPermissions
      }
    })
  }

  const PermissionImage = (props: {option: FeedbackBoardPermissionOption}) => {
    if (props.option.type === 'team') {
      return <i className="permission-image fa-solid fa-users h-11 w-11"></i>
    }

    return <img className="permission-image" src={props.option.thumbnailUrl} alt={`Permission for ${props.option.name}`} />
  }

  const PublicWarningBanner = () => {
    if(teamPermissions.length === 0 && memberPermissions.length === 0) {
      return <div className="board-metadata-form-section-information">
        <i className="fas fa-exclamation-circle" aria-label="Board is visible to every member in the organization"></i>&nbsp;This board is visible to every member in the organization.
      </div>
    }

    return null;
  }

  useEffect(() => {
    setSelectAllState();
    setFilteredPermissionOptions(orderedPermissionOptions(filteredPermissionOptions));
    emitChangeEvent();
  }, [teamPermissions, memberPermissions])

  return <div className="board-metadata-form board-metadata-form-permissions">
    <section className="board-metadata-form-board-settings board-metadata-form-board-settings--no-padding">
      <PublicWarningBanner />

      <div className="search-bar">
        <TextField
          ariaLabel="Search for a team or a member to add permissions"
          aria-required={true}
          placeholder={'Search teams or users'}
          id="retrospective-permission-search-input"
          value={searchTerm}
          onChange={(_, newValue) => handleSearchTermChanged(newValue)}
        />
      </div>

      <div className="board-metadata-table-container">
        <table className="board-metadata-table">
          <thead>
            <tr>
              <th className="cell-checkbox">
                <Checkbox
                  className="my-2"
                  id="select-all-permission-options-visible"
                  ariaLabel="Select all permission options that are visible in the permission option list."
                  boxSide="start"
                  checked={selectAllChecked}
                  onChange={(_, checked) => handleSelectAllClicked(checked)}
                />
              </th>
              <th className={"text-left"}>
                <span aria-label="Permission option name table header">{"Name"}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissionOptions.map((option) => {
              const isBoardOwner: boolean = option.id === props.board?.createdBy?.id;
              return (
                <tr key={option.id} className="option-row">
                  <td>
                    <Checkbox
                      className="my-2"
                      id={`permission-option-${option.id}`}
                      ariaLabel="Add permission to every team or member in the table"
                      boxSide="start"
                      disabled={isBoardOwner}
                      checked={isBoardOwner || teamPermissions.includes(option.id) || memberPermissions.includes(option.id)}
                      onChange={(_, isChecked) => handlePermissionClicked(option, isChecked)}
                    />
                  </td>
                  <td className="cell-content flex flex-row flex-nowrap">
                    <div className="content-image">
                      {PermissionImage({ option })}
                    </div>
                    <div className="content-text flex flex-col flex-nowrap text-left">
                      <span aria-label="Team or member name">{option.name}</span>
                      <span aria-label="Team or member unique name" className="content-sub-text">{option.uniqueName}</span>
                    </div>
                    <div className="content-badge">
                      {isBoardOwner && <span aria-label="Board owner badge">{'Owner'}</span>}
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
