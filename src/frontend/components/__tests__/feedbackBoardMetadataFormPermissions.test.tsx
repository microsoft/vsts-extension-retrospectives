import React from 'react';
import { mount, shallow } from 'enzyme';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';
import { TextField } from 'office-ui-fabric-react';
import { mockUuid } from '../__mocks__/uuid/v4';
import { testExistingBoard, testTeamId, testUserId } from '../__mocks__/mocked_components/mockedBoardMetadataForm';
import { IFeedbackBoardDocument } from '../../interfaces/feedback';
import FeedbackBoardMetadataFormPermissions, { IFeedbackBoardMetadataFormPermissionsProps, FeedbackBoardPermissionOption }
  from '../feedbackBoardMetadataFormPermissions';

const mockIdentityRef: IdentityRef = {
  id: "user-1",
  displayName: "Test User",
  uniqueName: "testuser@domain.com",
  imageUrl: "https://example.com/user.png",
  directoryAlias: "testuser",
  inactive: false,
  isAadIdentity: true,
  isContainer: false,
  isDeletedInOrigin: false,
  profileUrl: "https://example.com/profile",
  _links: {},
  descriptor: "descriptor-string",
  url: "https://example.com/user",
};

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

const mockBoard: IFeedbackBoardDocument = {
  id: 'mock-board-id',
  title: 'Mock Board',
  teamId: 'mock-team-id',
  createdBy: mockIdentityRef,
  createdDate: new Date(),
  modifiedDate: new Date(),
  permissions: { Teams: [], Members: [] },
  columns: [], // Ensure an array is provided
  activePhase: 'Collect', // Use a default valid phase
  maxVotesPerUser: 5,
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
};

jest.mock('uuid', () => ({ v4: () => mockUuid}));

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
      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...mockedProps} />);
      const component = wrapper.children().dive();
      const element = component.findWhere(c => c.text() === publicBannerText);

      expect(element).toBeDefined();
    });

    it('should hide when there are team permissions', () => {
      const props = {
        ...mockedProps,
        permissions: {
          Teams: [testTeamId],
          Members: [] as string[]
        }
      };
      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();
      const element = component.findWhere(c => c.text() === publicBannerText);

      expect(element).toHaveLength(0);
    })

    it('should hide when there are member permissions', () => {
      const props = {
        ...mockedProps,
        permissions: {
          Teams: [] as string[],
          Members: [testUserId]
        }
      };
      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();
      const element = component.findWhere(c => c.text() === publicBannerText);

      expect(element).toHaveLength(0);
    })
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
  });

  describe('Editing Permissions', () => {
    it('should allow current user to edit permissions when creating a new board', () => {
      const mockPermissionOptions: FeedbackBoardPermissionOption[] = [
        { id: 'user123', name: 'Current User', uniqueName: 'currentuser@domain.com', type: "member" }
      ];

      const props = {
        ...mockedProps,
        isNewBoardCreation: true,
        currentUserId: 'user123',
        board: mockBoard,
        permissionOptions: mockPermissionOptions, // Uses correctly typed array
      };

      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();

      // Assert that the "Only Board Owner or Admin can edit" warning does NOT appear
      expect(component.findWhere(c => c.text().includes('Only the Board Owner or Team Admin can edit permissions'))).toHaveLength(0);
    });

    it('should display permission restriction warning for non-owners', () => {
      const differentUserIdentityRef: IdentityRef = {
        ...mockIdentityRef, // Copy all existing properties
        id: 'owner456', // Change ID to represent a different user
        displayName: 'Board Owner', // Update display name
        uniqueName: 'owner456@domain.com',
      };

      const anotherMockBoard: IFeedbackBoardDocument = {
        ...mockBoard,
        createdBy: differentUserIdentityRef,
      };

      const mockPermissionOptions: FeedbackBoardPermissionOption[] = [
        { id: 'user123', name: 'Current User', uniqueName: 'currentuser@domain.com', type: "member", isTeamAdmin: false }
      ];

      const props: IFeedbackBoardMetadataFormPermissionsProps = {
        ...mockedProps,
        board: anotherMockBoard, // Use structured board object
        currentUserId: 'user123', // Not the board owner
        isNewBoardCreation: false, // Editing an existing board
        permissionOptions: mockPermissionOptions, // Correctly typed permission options
      };

      const wrapper = shallow(<FeedbackBoardMetadataFormPermissions {...props} />);
      const component = wrapper.children().dive();

      // Validate the restriction warning appears for non-owner users
      expect(component.text()).toContain('Only the Board Owner or a Team Admin can edit permissions.');
    });

  });

});
