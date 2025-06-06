import React from 'react';
import { mount, shallow } from 'enzyme';
import { TextField } from 'office-ui-fabric-react';
import { mockUuid } from '../__mocks__/uuid/v4';
import { testExistingBoard, testTeamId, testUserId } from '../__mocks__/mocked_components/mockedBoardMetadataForm';
import FeedbackBoardMetadataFormPermissions from '../feedbackBoardMetadataFormPermissions';
import { FeedbackBoardPermissionOption, IFeedbackBoardMetadataFormPermissionsProps } from '../feedbackBoardMetadataFormPermissions';

const mockedProps: IFeedbackBoardMetadataFormPermissionsProps = {
  board: testExistingBoard,
  permissions: {
    Teams: [],
    Members: []
  },
  permissionOptions: [],
  currentUserId: testUserId,
  isNewBoardCreation: false,
  onPermissionChanged: jest.fn()
};

const mockIdentityRef = {
  id: 'some-id',
  directoryAlias: '',
  imageUrl: '',
  inactive: false,
  isAadIdentity: false,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: '',
  uniqueName: '',
  displayName: '',
  url: '',
  descriptor: '',
  _links: {}
};

const teamOption: FeedbackBoardPermissionOption = {
  id: 'team-1',
  name: 'Team 1',
  uniqueName: 'team1',
  type: 'team',
  thumbnailUrl: ''
};

const ownerOption: FeedbackBoardPermissionOption = {
  id: 'user-1',
  name: 'Board Owner',
  uniqueName: 'user1',
  type: 'member',
  thumbnailUrl: ''
};

const adminOption: FeedbackBoardPermissionOption = {
  id: 'user-2',
  name: 'Team Admin',
  uniqueName: 'user2',
  type: 'member',
  thumbnailUrl: '',
  isTeamAdmin: true
};

const memberOption: FeedbackBoardPermissionOption = {
  id: 'user-3',
  name: 'Team Member',
  uniqueName: 'user3',
  type: 'member',
  thumbnailUrl: ''
};

const allOptions = [teamOption, ownerOption, adminOption, memberOption];

function makeProps(overrides: Partial<IFeedbackBoardMetadataFormPermissionsProps> = {}): IFeedbackBoardMetadataFormPermissionsProps {
  return {
    ...mockedProps,
    board: {
      ...mockedProps.board,
      createdBy: { ...mockedProps.board.createdBy, id: 'user-1' }, // default owner
      ...(overrides.board || {})
    },
    permissionOptions: allOptions,
    onPermissionChanged: jest.fn(),
    isNewBoardCreation: false,
    currentUserId: 'user-1',
    permissions: { Teams: [], Members: [] },
    ...overrides
  };
}

jest.mock('uuid', () => ({ v4: () => mockUuid }));

describe('Board Metadata Form Permissions', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('can be rendered', () => {
    const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...mockedProps} />);
    const component = wrapper.children().dive();
    const textField = component.findWhere(c => c.prop('id') === 'retrospective-permission-search-input').find(TextField);

    expect(textField).toBeDefined();
    expect(textField.prop('value')).toEqual('');
  });

  describe('Public Banner', () => {
    const publicBannerText: string = 'This board is visible to every member in the project.';

    it('should show when there are not team or member permissions', () => {
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...mockedProps} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const banner = elements.filterWhere(e =>
        e.text().includes(publicBannerText)
      );
      expect(banner.exists()).toBe(true);
    });

    it('should hide when there are team permissions', () => {
      const props = {
        ...mockedProps,
        permissions: {
          Teams: [testTeamId],
          Members: [] as string[]
        }
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const banner = elements.filterWhere(e =>
        e.text().includes(publicBannerText)
      );
      expect(banner.exists()).toBe(false);
    });

    it('should hide when there are member permissions', () => {
      const props = {
        ...mockedProps,
        permissions: {
          Teams: [] as string[],
          Members: [testUserId]
        }
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const banner = elements.filterWhere(e =>
        e.text().includes(publicBannerText)
      );
      expect(banner.exists()).toBe(false);
    });
  });

  describe('Permission Edit Warning', () => {
    const permissionEditWarningText = 'Only the Board Owner or a Team Admin can edit permissions.';

    it('should show when user is neither board owner nor team admin', () => {
      const props = {
        ...mockedProps,
        isNewBoardCreation: false,
        board: { ...mockedProps.board, createdBy: { ...mockIdentityRef, id: 'someone-else' } },
        currentUserId: 'not-owner-or-admin',
        permissionOptions: [
          {
            id: 'not-owner-or-admin',
            name: 'User',
            uniqueName: 'User',
            type: 'member', // literal type
            thumbnailUrl: ''
          } as FeedbackBoardPermissionOption // <-- Explicitly cast here
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const warning = elements.filterWhere(e =>
        e.text().includes(permissionEditWarningText)
      );
      expect(warning.exists()).toBe(true);
    });

    it('should hide when user is board owner', () => {
      const props = {
        ...mockedProps,
        isNewBoardCreation: false,
        board: {
          ...mockedProps.board,
          createdBy: { ...mockIdentityRef, id: mockedProps.currentUserId } // Use full IdentityRef
        },
        currentUserId: mockedProps.currentUserId,
        permissionOptions: [
          {
            id: mockedProps.currentUserId,
            name: 'Owner',
            uniqueName: 'Owner',
            type: 'member',
            thumbnailUrl: ''
          } as FeedbackBoardPermissionOption
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const warning = elements.filterWhere(e =>
        e.text().includes(permissionEditWarningText)
      );
      expect(warning.exists()).toBe(false);
    });

    it('should hide when user is a team admin', () => {
      const props = {
        ...mockedProps,
        isNewBoardCreation: false,
        board: { ...mockedProps.board, createdBy: { ...mockIdentityRef, id: 'someone-else' } },
        currentUserId: 'team-admin-id',
        permissionOptions: [
          {
            id: 'team-admin-id',
            name: 'Admin',
            uniqueName: 'Admin',
            type: 'member', // or 'team' if your logic expects team admins as teams
            thumbnailUrl: '',
            isTeamAdmin: true
          } as FeedbackBoardPermissionOption
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const elements = wrapper.find('.board-metadata-form-section-information');
      const warning = elements.filterWhere(e =>
        e.text().includes(permissionEditWarningText)
      );
      expect(warning.exists()).toBe(false);
    });
  });

  describe('Permission Table', () => {

    it('should show team permissions', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissionOptions: [
          {
            id: '1',
            name: 'Team 1',
            uniqueName: 'Team 1',
            type: 'team',
            thumbnailUrl: ''
          },
          {
            id: '2',
            name: 'Team 2',
            uniqueName: 'Team 2',
            type: 'team',
            thumbnailUrl: ''
          }
        ]
      };
      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();
      const tableBody = component.find('tbody');
      const tableRows = tableBody.find('tr');

      expect(tableRows).toHaveLength(2);

      const everyRowHasTeamIcon = tableRows.find('i').everyWhere(c => c.hasClass('fa-users'));
      expect(everyRowHasTeamIcon).toBeTruthy();
    });

    it('should show member permissions', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissionOptions: [
          {
            id: '1',
            name: 'User 1',
            uniqueName: 'User 1',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '2',
            name: 'User 2',
            uniqueName: 'User 2',
            type: 'member',
            thumbnailUrl: ''
          }
        ]
      };
      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();
      const tableBody = component.find('tbody');
      const tableRows = tableBody.find('tr');

      expect(tableRows).toHaveLength(2);

      const everyRowHasUserImage = tableRows.find('img').everyWhere(c => c.hasClass('permission-image'));
      expect(everyRowHasUserImage).toBeTruthy();
    })

    it('should order teams alphabetically then users alphabetically', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissionOptions: [
          {
            id: '1',
            name: 'Alpha',
            uniqueName: 'User 1',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '2',
            name: 'Charlie',
            uniqueName: 'User 2',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '3',
            name: 'Bravo',
            uniqueName: 'Team 1',
            type: 'team',
            thumbnailUrl: ''
          },
          {
            id: '4',
            name: 'Delta',
            uniqueName: 'Team 2',
            type: 'team',
            thumbnailUrl: ''
          }
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableBody = wrapper.find('tbody');
      const tableRows = tableBody.find('tr');

      expect(tableRows).toHaveLength(4);

      const first = tableRows.first().find('span').first();
      expect(first.text()).toEqual('Bravo');

      const last = tableRows.last().find('span').first();
      expect(last.text()).toEqual('Charlie');
    })

    it('should order options that have permission before those without', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissions: {
          Teams: ['4'],  // set id 4 to have permission
          Members: ['2'] // set id 2 to have permission
        },
        permissionOptions: [
          {
            id: '1',
            name: 'Alpha',
            uniqueName: 'User 1',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '2',
            name: 'Charlie',
            uniqueName: 'User 2',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '3',
            name: 'Bravo',
            uniqueName: 'Team 1',
            type: 'team',
            thumbnailUrl: ''
          },
          {
            id: '4',
            name: 'Delta',
            uniqueName: 'Team 2',
            type: 'team',
            thumbnailUrl: ''
          }
        ]
      };

      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableBody = wrapper.find('tbody');
      const tableRows = tableBody.find('tr');

      expect(tableRows).toHaveLength(4);

      const first = tableRows.first().find('span').first();
      expect(first.text()).toEqual('Delta');

      const last = tableRows.last().find('span').first();
      expect(last.text()).toEqual('Alpha');
    })

    it('should set an Owner label for user that created the board and list board owner first', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: {
          ...mockedProps.board,
          createdBy: {
            ...mockedProps.board.createdBy,
            id: '5'
          }
        },
        permissions: {
          Teams: ['4'],
          Members: ['2']
        },
        permissionOptions: [
          {
            id: '1',
            name: 'Alpha',
            uniqueName: 'User 1',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '2',
            name: 'Charlie',
            uniqueName: 'User 2',
            type: 'member',
            thumbnailUrl: ''
          },
          {
            id: '3',
            name: 'Bravo',
            uniqueName: 'Team 1',
            type: 'team',
            thumbnailUrl: ''
          },
          {
            id: '4',
            name: 'Delta',
            uniqueName: 'Team 2',
            type: 'team',
            thumbnailUrl: ''
          },
          // if Zebra wasn't owner, would sort last
          {
            id: '5',
            name: 'Zebra',
            uniqueName: 'User Z',
            type: 'member',
            thumbnailUrl: ''
          }
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableBody = wrapper.find('tbody');
      const tableRows = tableBody.find('tr');

      expect(tableRows).toHaveLength(5);

      const first = tableRows.first();
      const hasOwnerLabel1 = first.find('span').last().text() === 'Owner';
      expect(hasOwnerLabel1).toBeTruthy();

      const last = tableRows.last();
      const hasOwnerLabel2 = last.find('span').last().text() === 'Owner';
      expect(hasOwnerLabel2).toBeFalsy();
    })

    it('should display the Team Admin badge for a team admin', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissions: {
          Teams: [],
          Members: []
        },
        permissionOptions: [
          {
            id: '3',
            name: 'Delta',
            uniqueName: 'Team 4',
            type: 'team',
            thumbnailUrl: '',
            isTeamAdmin: false
          },
          {
            id: '1',
            name: 'Albert',
            uniqueName: 'User',
            type: 'member',
            thumbnailUrl: '',
            isTeamAdmin: false
          },
          {
            id: '2',
            name: 'Brady',
            uniqueName: 'Team 2',
            type: 'member',
            thumbnailUrl: '',
            isTeamAdmin: true // This team is admin
          }
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableBody = wrapper.find('tbody');
      const tableRows = tableBody.find('tr');

      // Find the row for the team admin
      const teamAdminRow = tableRows.filterWhere(row =>
        row.text().includes('Brady')
      );
      expect(teamAdminRow.find('span').last().text()).toBe('Admin');

      // Non-admin member should not have the badge
      const nonAdminRow = tableRows.filterWhere(row =>
        row.text().includes('Albert')
      );
      expect(nonAdminRow.find('span').last().text()).not.toBe('Admin');

      // Teams shouldn't have team admin badge
      const nonAdminRowTeam = tableRows.filterWhere(row =>
        row.text().includes('Delta')
      );
      expect(nonAdminRowTeam.find('span').last().text()).not.toBe('Admin');
    });

    it('should not display the Team Admin badge if isTeamAdmin is false or missing', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        permissions: {
          Teams: ['3'],
          Members: []
        },
        permissionOptions: [
          {
            id: '3',
            name: 'Bravo',
            uniqueName: 'Team 2',
            type: 'team',
            thumbnailUrl: ''
            // isTeamAdmin is missing
          },
          {
            id: '2',
            name: 'Brady',
            uniqueName: 'User 2',
            type: 'member',
            thumbnailUrl: ''
            // isTeamAdmin is missing
          }
        ]
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableBody = wrapper.find('tbody');
      const tableRows = tableBody.find('tr');

      const teamRow = tableRows.filterWhere(row =>
        row.text().includes('Bravo')
      );
      expect(teamRow.find('span').last().text()).not.toBe('Admin');

      const memberRow = tableRows.filterWhere(row =>
        row.text().includes('Brady')
      );
      expect(memberRow.find('span').last().text()).not.toBe('Admin');
    });

    it('should display correct admin badges for users who are team admins on different teams', () => {
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: {
          ...mockedProps.board,
          createdBy: { ...mockedProps.board.createdBy, id: 'owner-id' }
        },
        currentUserId: 'owner-id',
        permissions: { Teams: ['team-1', 'team-2'], Members: ['user-1', 'user-2'] },
        permissionOptions: [
          // Teams
          { id: 'team-1', name: 'Team 1', uniqueName: 'team1', type: 'team' },
          { id: 'team-2', name: 'Team 2', uniqueName: 'team2', type: 'team' },
          // Users (members)
          { id: 'user-1', name: 'User 1', uniqueName: 'user1', type: 'member', isTeamAdmin: true },  // Admin on Team 1
          { id: 'user-2', name: 'User 2', uniqueName: 'user2', type: 'member', isTeamAdmin: true }   // Admin on Team 2
        ],
        isNewBoardCreation: false,
        onPermissionChanged: jest.fn()
      };

      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const tableRows = wrapper.find('tbody').find('tr');

      // Should have 4 rows: Team 1, Team 2, User 1, User 2
      expect(tableRows).toHaveLength(4);

      // Find rows by name
      const team1Row = tableRows.filterWhere(row => row.text().includes('Team 1'));
      const team2Row = tableRows.filterWhere(row => row.text().includes('Team 2'));
      const user1Row = tableRows.filterWhere(row => row.text().includes('User 1'));
      const user2Row = tableRows.filterWhere(row => row.text().includes('User 2'));

      // User 1 should have Admin badge
      expect(user1Row.find('span').last().text()).toBe('Admin');
      // User 2 should have Admin badge
      expect(user2Row.find('span').last().text()).toBe('Admin');
      // Teams should not have Admin badge
      expect(team1Row.find('span').last().text()).not.toBe('Admin');
      expect(team2Row.find('span').last().text()).not.toBe('Admin');
    });
  });

  describe('Editing Permissions', () => {

    it('should allow the board owner to change permissions', () => {
      const onPermissionChanged = jest.fn();
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: {
          ...mockedProps.board,
          createdBy: { ...mockedProps.board.createdBy, id: 'owner-id' }
        },
        currentUserId: 'owner-id',
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: 'team-1', name: 'Team 1', uniqueName: 'team1', type: 'team' }
        ],
        isNewBoardCreation: false,
        onPermissionChanged
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      // Simulate checking the permission checkbox
      wrapper.find('input[type="checkbox"]').at(1).simulate('change', { target: { checked: true } });
      expect(onPermissionChanged).toHaveBeenCalled();
    });

    it('should allow a team admin to change permissions', () => {
      const onPermissionChanged = jest.fn();
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: {
          ...mockedProps.board,
          createdBy: { ...mockedProps.board.createdBy, id: 'someone-else' }
        },
        currentUserId: 'admin-id',
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: 'admin-id', name: 'Admin', uniqueName: 'admin', type: 'team', isTeamAdmin: true }
        ],
        isNewBoardCreation: false,
        onPermissionChanged
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      // Simulate checking the permission checkbox
      wrapper.find('input[type="checkbox"]').at(1).simulate('change', { target: { checked: true } });
      expect(onPermissionChanged).toHaveBeenCalled();
    })

    it('should NOT allow a user who is neither board owner nor team admin to change permissions', () => {
      const onPermissionChanged = jest.fn();
      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: {
          ...mockedProps.board,
          createdBy: { ...mockedProps.board.createdBy, id: 'owner-id' }
        },
        currentUserId: 'random-user-id',
        permissions: { Teams: [], Members: [] },
        permissionOptions: [
          { id: 'team-1', name: 'Team 1', uniqueName: 'team1', type: 'team', isTeamAdmin: false }
        ],
        isNewBoardCreation: false,
        onPermissionChanged
      };
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      // Try to simulate checking the permission checkbox
      wrapper.find('input[type="checkbox"]').at(1).simulate('change', { target: { checked: true } });
      expect(onPermissionChanged).not.toHaveBeenCalled();
    });
  });
});

describe('Select Permissions', () => {
  it('should grant permission to all when select all is clicked and saved', async () => {
    const onPermissionChanged = jest.fn();
    const props = makeProps({ onPermissionChanged, currentUserId: 'user-1', isNewBoardCreation: true, board: { ...mockedProps.board, createdBy: { ...mockedProps.board.createdBy, id: 'user-3' } } });
    const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
    wrapper.find('input#select-all-permission-options-visible').simulate('change', { target: { checked: true } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const lastCall = onPermissionChanged.mock.calls[onPermissionChanged.mock.calls.length - 1][0];
    expect(lastCall.permissions.Teams).toEqual(expect.arrayContaining(['team-1']));
    expect(lastCall.permissions.Members).toEqual(expect.arrayContaining(['user-1', 'user-2', 'user-3']));
  });

  it('should grant permission to the selected team and the board owner only when team is selected and saved', async () => {
    const onPermissionChanged = jest.fn();
    const props = makeProps({ onPermissionChanged });
    const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
    wrapper.find('input#permission-option-team-1').simulate('change', { target: { checked: true } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const lastCall = onPermissionChanged.mock.calls[onPermissionChanged.mock.calls.length - 1][0];
    expect(lastCall.permissions.Teams).toEqual(expect.arrayContaining(['team-1']));
    expect(lastCall.permissions.Members).not.toContain('user-1');
    expect(lastCall.permissions.Members).not.toContain('user-2');
    expect(lastCall.permissions.Members).not.toContain('user-3');
  });

  it('should grant permission to the selected users only when their checkboxes are selected and saved', async () => {
    const onPermissionChanged = jest.fn();
    const props = makeProps({ onPermissionChanged });
    const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
    wrapper.find('input#permission-option-user-2').simulate('change', { target: { checked: true } });
    wrapper.find('input#permission-option-user-3').simulate('change', { target: { checked: true } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const lastCall = onPermissionChanged.mock.calls[onPermissionChanged.mock.calls.length - 1][0];
    expect(lastCall.permissions.Members).toEqual(expect.arrayContaining(['user-2', 'user-3']));
    expect(lastCall.permissions.Members).not.toContain('user-1');
    expect(lastCall.permissions.Teams).not.toContain('team-1');
  });

  describe('Board Owner Row Rendering', () => {
    it('should show the current user as board owner when creating a new board or copying a board (isNewBoardCreation: true)', () => {
      const props = makeProps({
        isNewBoardCreation: true,
        currentUserId: 'user-1',
        // board.createdBy is still user-2, but should not matter
        board: { ...mockedProps.board, createdBy: { ...mockedProps.board.createdBy, id: 'user-2' } }
      });
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      const ownerRow = wrapper.find('tr.option-row').filterWhere(row => row.text().includes('Owner'));
      expect(ownerRow.text()).toContain('user1');
      expect(ownerRow.find('[aria-label="Board owner badge"]').exists()).toBe(true);
    });

    it('should show the board.createdBy as board owner when editing an existing board (isNewBoardCreation: false)', () => {
      const props = makeProps({
        isNewBoardCreation: false,
        currentUserId: 'user-1',
        board: { ...mockedProps.board, createdBy: { ...mockedProps.board.createdBy, id: 'user-2' } }
      });
      const wrapper = mount(<FeedbackBoardMetadataFormPermissions {...props} />);
      // Find the row with the Owner badge
      const ownerRow = wrapper.find('tr.option-row').filterWhere(row =>
        row.find('[aria-label="Board owner badge"]').exists()
      );
      expect(ownerRow).toHaveLength(1);
      expect(ownerRow.text()).toContain('user2');
      // Owner badge should exist
      expect(ownerRow.find('[aria-label="Board owner badge"]').exists()).toBe(true);
      // Admin badge should also exist if user2 is admin
      //expect(ownerRow.find('[aria-label="Team admin badge"]').exists()).toBe(true);
    });
  });
});
