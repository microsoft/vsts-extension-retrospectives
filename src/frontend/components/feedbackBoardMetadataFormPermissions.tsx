import React, { useEffect } from "react";
import { TextField } from "@fluentui/react/lib/TextField";
import { Checkbox } from "@fluentui/react/lib/Checkbox";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from "../interfaces/feedback";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { getIconElement } from "./icons";

export interface IFeedbackBoardMetadataFormPermissionsProps {
  board: IFeedbackBoardDocument;
  permissions: IFeedbackBoardDocumentPermissions;
  permissionOptions: FeedbackBoardPermissionOption[];
  currentUserId: string;
  isNewBoardCreation: boolean;
  onPermissionChanged: (state: FeedbackBoardPermissionState) => void;
}

export interface FeedbackBoardPermissionState {
  permissions: IFeedbackBoardDocumentPermissions;
}

export interface FeedbackBoardPermissionOption {
  id: string;
  name: string;
  uniqueName: string;
  hasPermission?: boolean;
  type: "team" | "member";
  thumbnailUrl?: string;
  isTeamAdmin?: boolean;
}

function FeedbackBoardMetadataFormPermissions(props: Readonly<IFeedbackBoardMetadataFormPermissionsProps>): React.JSX.Element {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardMetadataFormPermissions");

  const [teamPermissions, setTeamPermissions] = React.useState(props.permissions?.Teams ?? []);
  const [memberPermissions, setMemberPermissions] = React.useState(props.permissions?.Members ?? []);
  const [selectAllChecked, setSelectAllChecked] = React.useState<boolean>(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const isBoardOwner = props.isNewBoardCreation || props.board?.createdBy?.id === props.currentUserId;
  const isTeamAdmin = props.permissionOptions.some(option => option.id === props.currentUserId && option.isTeamAdmin);
  const canEditPermissions = isBoardOwner || isTeamAdmin;
  const isGroupOption = (option: FeedbackBoardPermissionOption): boolean => {
    return /^\[[^\]]+\]\\/.test(option.name); // assumes groups have names like [project]\group
  };

  const cleanPermissionOptions = props.permissionOptions.filter(option => !isGroupOption(option)); // removes groups
  const [filteredPermissionOptions, setFilteredPermissionOptions] = React.useState<FeedbackBoardPermissionOption[]>(cleanPermissionOptions);

  const handleSelectAllClicked = (_event: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
    if (!canEditPermissions) return;
    const nextChecked = checked as boolean;

    if (nextChecked) {
      setTeamPermissions([...teamPermissions, ...filteredPermissionOptions.filter(o => o.type === "team" && !teamPermissions.includes(o.id)).map(o => o.id)]);
      setMemberPermissions([...memberPermissions, ...filteredPermissionOptions.filter(o => o.type === "member" && !memberPermissions.includes(o.id)).map(o => o.id)]);
    } else {
      setTeamPermissions(teamPermissions.filter(o => !filteredPermissionOptions.map(o => o.id).includes(o)));
      setMemberPermissions(memberPermissions.filter(o => !filteredPermissionOptions.map(o => o.id).includes(o)));
    }

    setSelectAllState();
  };

  const handlePermissionClicked = (option: FeedbackBoardPermissionOption, hasPermission: boolean) => {
    if (!canEditPermissions) return;

    let permissionList: string[] = option.type === "team" ? teamPermissions : memberPermissions;

    if (hasPermission) {
      permissionList.push(option.id);
    } else {
      permissionList = permissionList.filter(t => t !== option.id);
    }

    if (option.type === "team") {
      setTeamPermissions([...permissionList]);
    } else {
      setMemberPermissions([...permissionList]);
    }
  };

  const handleSearchTermChanged = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);

    const filteredOptions = cleanPermissionOptions.filter(option => {
      if (newSearchTerm.length === 0) return true;
      return option.name.toLowerCase().includes(newSearchTerm.toLowerCase());
    });

    setSelectAllState();
    setFilteredPermissionOptions(orderedPermissionOptions(filteredOptions));
  };

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
        // Step 1: Ensure the board owner appears first
        const boardOwnerId = props.isNewBoardCreation ? props.currentUserId : props.board?.createdBy?.id;
        const isAOwner = a.id === boardOwnerId;
        const isBOwner = b.id === boardOwnerId;
        if (isAOwner && !isBOwner) return -1;
        if (!isAOwner && isBOwner) return 1;
        // Step 2: Sort by hasPermission (true before false)
        if (a.hasPermission !== b.hasPermission) {
          return b.hasPermission ? 1 : -1;
        }
        // Step 3: Sort by type (team before member)
        if (a.type === "team" && b.type === "member") {
          return -1;
        } else if (a.type === "member" && b.type === "team") {
          return 1;
        }
        // Step 4: Sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

    return orderedPermissionOptions;
  };

  const emitChangeEvent = () => {
    if (canEditPermissions) {
      props.onPermissionChanged({
        permissions: {
          Teams: teamPermissions,
          Members: memberPermissions,
        },
      });
    }
  };

  const PermissionImage = (props: { option: FeedbackBoardPermissionOption }) => {
    if (props.option.type === "team") {
      return <i className="permission-image fa-solid fa-users h-11 w-11"></i>;
    }

    return <img className="permission-image" src={props.option.thumbnailUrl} alt={`Permission for ${props.option.name}`} />;
  };

  const PublicWarningBanner = () => {
    if (teamPermissions.length === 0 && memberPermissions.length === 0) {
      return <div className="board-metadata-form-section-information">{getIconElement("exclamation")} This board is visible to every member in the project</div>;
    }

    return null;
  };

  const PermissionEditWarning = () => {
    if (!canEditPermissions) {
      return <div className="board-metadata-form-section-information">{getIconElement("exclamation")} Only the Board Owner or a Team Admin can edit permissions</div>;
    }
    return null;
  };

  useEffect(() => {
    setSelectAllState();
    setFilteredPermissionOptions(orderedPermissionOptions(filteredPermissionOptions));
    emitChangeEvent();
  }, [teamPermissions, memberPermissions]);

  return (
    <div className="board-metadata-form board-metadata-form-permissions" onKeyDown={trackActivity} onMouseMove={trackActivity} onTouchStart={trackActivity}>
      <section className="board-metadata-form-board-settings board-metadata-form-board-settings--no-padding">
        <PublicWarningBanner />

        <div className="search-bar">
          <TextField ariaLabel="Search for a team or a member to add permissions" aria-required={true} placeholder={"Search teams or users"} id="retrospective-permission-search-input" value={searchTerm} onChange={(_, newValue) => handleSearchTermChanged(newValue)} />
        </div>

        <div className="board-metadata-table-container">
          <table className="board-metadata-table">
            <thead>
              <tr>
                <th className="cell-checkbox" scope="col">
                  <Checkbox className="my-2" id="select-all-permission-options-visible" ariaLabel="Add permission to every team or member in the table." boxSide="start" disabled={!canEditPermissions} checked={selectAllChecked} onChange={(event, checked) => handleSelectAllClicked(event, checked)} />
                </th>
                <th className={"text-left"} scope="col">
                  <span aria-label="Permission option name table header">{"Name"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissionOptions.map(option => {
                const isBoardOwner: boolean = props.isNewBoardCreation ? option.id === props.currentUserId : option.id === props.board?.createdBy?.id;
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
                        indeterminate={teamPermissions.length === 0 && memberPermissions.length === 0 && isBoardOwner}
                        onChange={(_event, isChecked) => {
                          handlePermissionClicked(option, isChecked as boolean);
                        }}
                      />
                    </td>
                    <td className="cell-content flex flex-row flex-nowrap">
                      <div className="content-image">{PermissionImage({ option })}</div>
                      <div className="content-text flex flex-col flex-nowrap text-left">
                        <span aria-label="Team or member name">{option.name}</span>
                        <span aria-label="Team or member unique name" className="content-sub-text">
                          {option.uniqueName}
                        </span>
                        <span>{option.isTeamAdmin}</span>
                      </div>
                      <div className="content-badge">
                        {isBoardOwner && <span aria-label="Board owner badge">{"Owner"}</span>}
                        {option.isTeamAdmin && <span aria-label="Team admin badge">{"Admin"}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <PermissionEditWarning />
    </div>
  );
}

export default FeedbackBoardMetadataFormPermissions;
