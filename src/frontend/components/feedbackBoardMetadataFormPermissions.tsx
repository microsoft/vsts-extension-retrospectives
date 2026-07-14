import React, { useEffect } from "react";
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from "../interfaces/feedback";
import { useTrackMetric } from "@microsoft/applicationinsights-react-js";
import { reactPlugin } from "../utilities/telemetryClient";
import { canCurrentUserManageBoard, isCurrentUserTeamAdmin } from "../utilities/boardAccessHelper";
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

interface PermissionOptionInputProps {
  optionId: string;
  optionType: FeedbackBoardPermissionOption["type"];
  isBoardOwner: boolean;
  isChecked: boolean;
  isIndeterminate: boolean;
  onPermissionClicked: (optionId: string, optionType: FeedbackBoardPermissionOption["type"], hasPermission: boolean) => void;
}

const isGroupOption = (option: FeedbackBoardPermissionOption): boolean => {
  return /^\[[^\]]+\]\\/.test(option.name); // assumes groups have names like [project]\group
};

const PublicWarningBanner = React.memo(function PublicWarningBanner(props: { isVisible: boolean }): React.JSX.Element | null {
  if (props.isVisible) {
    return <div className="board-metadata-form-section-information">{getIconElement("exclamation")} This board is visible to every member in the project</div>;
  }

  return null;
});

const PermissionSearchInput = React.memo(function PermissionSearchInput(props: { searchTerm: string; onSearchTermChanged: (newSearchTerm: string) => void }): React.JSX.Element {
  return (
    <input
      aria-label="Search for a team or a member to add permissions"
      aria-required={true}
      placeholder="Search teams or users"
      id="retrospective-permission-search-input"
      value={props.searchTerm}
      onChange={event => props.onSearchTermChanged(event.target.value)}
      type="text"
      className="permission-search-input"
    />
  );
});

const SelectAllPermissionOptionsInput = React.memo(function SelectAllPermissionOptionsInput(props: { canManageBoard: boolean; isChecked: boolean; onSelectAllClicked: (checked: boolean) => void }): React.JSX.Element {
  return (
    <input
      className="my-2"
      id="select-all-permission-options-visible"
      aria-label="Add permission to every team or member in the table."
      disabled={!props.canManageBoard}
      checked={props.isChecked}
      onChange={event => props.onSelectAllClicked(event.target.checked)}
      type="checkbox"
    />
  );
});

const PermissionOptionInput = React.memo(function PermissionOptionInput(props: PermissionOptionInputProps): React.JSX.Element {
  return (
    <input
      className="my-2"
      id={`permission-option-${props.optionId}`}
      aria-label="Add permission to every team or member in the table"
      disabled={props.isBoardOwner}
      checked={props.isChecked}
      onChange={event => {
        props.onPermissionClicked(props.optionId, props.optionType, event.target.checked);
      }}
      type="checkbox"
      ref={input => {
        if (input) {
          input.indeterminate = props.isIndeterminate;
        }
      }}
    />
  );
});

function FeedbackBoardMetadataFormPermissions(props: Readonly<IFeedbackBoardMetadataFormPermissionsProps>): React.JSX.Element {
  const trackActivity = useTrackMetric(reactPlugin, "FeedbackBoardMetadataFormPermissions");

  const [teamPermissions, setTeamPermissions] = React.useState(props.permissions?.Teams ?? []);
  const [memberPermissions, setMemberPermissions] = React.useState(props.permissions?.Members ?? []);
  const [selectAllChecked, setSelectAllChecked] = React.useState<boolean>(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const boardOwnerId = props.isNewBoardCreation ? props.currentUserId : props.board?.createdBy?.id;

  const canManageBoard = canCurrentUserManageBoard({
    boardOwnerId: props.board?.createdBy?.id,
    currentUserId: props.currentUserId,
    isTeamAdmin: isCurrentUserTeamAdmin(props.currentUserId, props.permissionOptions),
    isNewBoardCreation: props.isNewBoardCreation,
  });

  const cleanPermissionOptions = React.useMemo(() => props.permissionOptions.filter(option => !isGroupOption(option)), [props.permissionOptions]); // removes groups
  const [filteredPermissionOptions, setFilteredPermissionOptions] = React.useState<FeedbackBoardPermissionOption[]>(cleanPermissionOptions);

  const handlePermissionClicked = React.useCallback((optionId: string, optionType: FeedbackBoardPermissionOption["type"], hasPermission: boolean) => {
    if (!canManageBoard) return;

    const setPermissionList = optionType === "team" ? setTeamPermissions : setMemberPermissions;
    setPermissionList(permissionList => {
      if (hasPermission) {
        return permissionList.includes(optionId) ? permissionList : [...permissionList, optionId];
      }

      return permissionList.filter(t => t !== optionId);
    });
  }, [canManageBoard]);

  const setSelectAllState = React.useCallback(() => {
    const allVisibleIds = filteredPermissionOptions.map(o => o.id);
    const allPermissionIds = [...teamPermissions, ...memberPermissions];
    const allVisibleIdsAreInFilteredOptions: boolean = allVisibleIds.every(id => allPermissionIds.includes(id));

    setSelectAllChecked(allVisibleIdsAreInFilteredOptions);
  }, [filteredPermissionOptions, memberPermissions, teamPermissions]);

  const handleSelectAllClicked = React.useCallback(
    (checked: boolean) => {
      if (!canManageBoard) return;
      const visibleIds = filteredPermissionOptions.map(o => o.id);

      if (checked) {
        const visibleTeamIds = filteredPermissionOptions.filter(o => o.type === "team").map(o => o.id);
        const visibleMemberIds = filteredPermissionOptions.filter(o => o.type === "member").map(o => o.id);

        setTeamPermissions(current => [...current, ...visibleTeamIds.filter(id => !current.includes(id))]);
        setMemberPermissions(current => [...current, ...visibleMemberIds.filter(id => !current.includes(id))]);
      } else {
        setTeamPermissions(current => current.filter(id => !visibleIds.includes(id)));
        setMemberPermissions(current => current.filter(id => !visibleIds.includes(id)));
      }

      setSelectAllState();
    },
    [canManageBoard, filteredPermissionOptions, setSelectAllState],
  );

  const orderedPermissionOptions = React.useCallback((options: FeedbackBoardPermissionOption[]): FeedbackBoardPermissionOption[] => {
    const orderedPermissionOptions = options
      .map(o => {
        o.hasPermission = teamPermissions.includes(o.id) || memberPermissions.includes(o.id);
        return o;
      })
      .sort((a, b) => {
        // Step 1: Ensure the board owner appears first
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
  }, [boardOwnerId, memberPermissions, teamPermissions]);

  const handleSearchTermChanged = React.useCallback(
    (newSearchTerm: string) => {
      setSearchTerm(newSearchTerm);

      const filteredOptions = cleanPermissionOptions.filter(option => {
        if (newSearchTerm.length === 0) return true;
        return option.name.toLowerCase().includes(newSearchTerm.toLowerCase());
      });

      setSelectAllState();
      setFilteredPermissionOptions(orderedPermissionOptions(filteredOptions));
    },
    [cleanPermissionOptions, orderedPermissionOptions, setSelectAllState],
  );

  const emitChangeEvent = () => {
    if (canManageBoard) {
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

  const PermissionEditWarning = () => {
    if (!canManageBoard) {
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
        <PublicWarningBanner isVisible={teamPermissions.length === 0 && memberPermissions.length === 0} />

        <div className="search-bar">
          <PermissionSearchInput searchTerm={searchTerm} onSearchTermChanged={handleSearchTermChanged} />
        </div>

        <div className="board-metadata-table-container">
          <table className="board-metadata-table">
            <thead>
              <tr>
                <th className="cell-checkbox" scope="col">
                  <SelectAllPermissionOptionsInput
                    canManageBoard={canManageBoard}
                    isChecked={selectAllChecked}
                    onSelectAllClicked={handleSelectAllClicked}
                  />
                </th>
                <th className={"text-left"} scope="col">
                  <span aria-label="Permission option name table header">{"Name"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissionOptions.map(option => {
                const isBoardOwner: boolean = option.id === boardOwnerId;
                return (
                  <tr key={option.id} className="option-row">
                    <td>
                      <PermissionOptionInput
                        optionId={option.id}
                        optionType={option.type}
                        isBoardOwner={isBoardOwner}
                        isChecked={isBoardOwner || teamPermissions.includes(option.id) || memberPermissions.includes(option.id)}
                        isIndeterminate={teamPermissions.length === 0 && memberPermissions.length === 0 && isBoardOwner}
                        onPermissionClicked={handlePermissionClicked}
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
