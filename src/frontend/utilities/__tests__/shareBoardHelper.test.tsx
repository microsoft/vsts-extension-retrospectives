import { shareBoardHelper } from '../shareBoardHelper';
import { IFeedbackBoardDocument, IFeedbackItemDocument } from '../../interfaces/feedback';
import { WorkflowPhase } from '../../interfaces/workItem';
import { workItemService } from '../../dal/azureDevOpsWorkItemService';
import { itemDataService } from '../../dal/itemDataService';
import { getBoardUrl } from '../../utilities/boardUrlHelper';
import { saveAs } from 'file-saver';

jest.mock('../../dal/azureDevOpsWorkItemService');
jest.mock('../../dal/itemDataService');
jest.mock('../../utilities/boardUrlHelper');
jest.mock('file-saver');

const mockWorkItemService = workItemService as jest.Mocked<typeof workItemService>;
const mockItemDataService = itemDataService as jest.Mocked<typeof itemDataService>;
const mockGetBoardUrl = getBoardUrl as jest.MockedFunction<typeof getBoardUrl>;
const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>;

describe('ShareBoardHelper', () => {
  const mockBoardUrl = 'https://dev.azure.com/test-org/test-project/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=team1&boardId=board1';

  const mockBoard = {
    id: 'board1',
    title: 'Test Retrospective Board',
    teamId: 'team1',
    projectId: 'project1',
    createdBy: {
      id: 'user1',
      displayName: 'Test User',
      uniqueName: 'test@example.com'
    },
    createdDate: new Date('2023-01-01T00:00:00Z'),
    columns: [
      {
        id: 'col1',
        title: 'What went well',
        iconClass: 'icon-happy',
        accentColor: '#00ff00'
      },
      {
        id: 'col2',
        title: 'What could be improved',
        iconClass: 'icon-sad',
        accentColor: '#ff0000'
      },
      {
        id: 'col3',
        title: 'Action items',
        iconClass: 'icon-action',
        accentColor: '#0000ff'
      }
    ],
    activePhase: WorkflowPhase.Collect,
    maxVotesPerUser: 5,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: []
  } as IFeedbackBoardDocument;

  const mockFeedbackItems = [
    {
      id: 'item1',
      boardId: 'board1',
      title: 'Great teamwork',
      columnId: 'col1',
      originalColumnId: 'col1',
      upvotes: 3,
      voteCollection: { 'user1': 2, 'user2': 1 },
      createdBy: {
        id: 'user1',
        displayName: 'Test User',
        uniqueName: 'test@example.com'
      },
      createdDate: new Date('2023-01-01T10:00:00Z'),
      userIdRef: 'user1',
      timerSecs: 0,
      timerstate: false,
      associatedActionItemIds: [123, 456]
    },
    {
      id: 'item2',
      boardId: 'board1',
      title: 'Need better communication',
      columnId: 'col2',
      originalColumnId: 'col2',
      upvotes: 2,
      voteCollection: { 'user1': 1, 'user2': 1 },
      createdBy: {
        id: 'user2',
        displayName: 'Another User',
        uniqueName: 'another@example.com'
      },
      createdDate: new Date('2023-01-01T10:30:00Z'),
      userIdRef: 'user2',
      timerSecs: 0,
      timerstate: false
    },
    {
      id: 'item3',
      boardId: 'board1',
      title: 'Grouped feedback parent',
      columnId: 'col1',
      originalColumnId: 'col1',
      upvotes: 1,
      voteCollection: { 'user1': 1 },
      createdBy: {
        id: 'user1',
        displayName: 'Test User',
        uniqueName: 'test@example.com'
      },
      createdDate: new Date('2023-01-01T11:00:00Z'),
      userIdRef: 'user1',
      timerSecs: 0,
      timerstate: false,
      childFeedbackItemIds: ['item4', 'item5', 'item6']
    },
    {
      id: 'item4',
      boardId: 'board1',
      title: 'Grouped child item 1',
      columnId: 'col1',
      originalColumnId: 'col1',
      upvotes: 0,
      voteCollection: {},
      createdBy: {
        id: 'user2',
        displayName: 'Another User',
        uniqueName: 'another@example.com'
      },
      createdDate: new Date('2023-01-01T11:15:00Z'),
      userIdRef: 'user2',
      timerSecs: 0,
      timerstate: false,
      parentFeedbackItemId: 'item3'
    },
    {
      id: 'item5',
      boardId: 'board1',
      title: 'Grouped child item 2',
      columnId: 'col1',
      originalColumnId: 'col1',
      upvotes: 1,
      voteCollection: { 'user1': 1 },
      createdBy: {
        id: 'user1',
        displayName: 'Test User',
        uniqueName: 'test@example.com'
      },
      createdDate: new Date('2023-01-01T11:30:00Z'),
      userIdRef: 'user1',
      timerSecs: 0,
      timerstate: false,
      parentFeedbackItemId: 'item3'
    }
  ] as IFeedbackItemDocument[];

  const mockWorkItems = [
    {
      id: 123,
      fields: {
        'System.Title': 'Improve team communication',
        'System.WorkItemType': 'Task'
      },
      _links: {
        html: {
          href: 'https://dev.azure.com/test-org/test-project/_workitems/edit/123'
        }
      }
    },
    {
      id: 456,
      fields: {
        'System.Title': 'Set up team retrospectives',
        'System.WorkItemType': 'User Story'
      },
      _links: {
        html: {
          href: 'https://dev.azure.com/test-org/test-project/_workitems/edit/456'
        }
      }
    }
  ] as unknown[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBoardUrl.mockResolvedValue(mockBoardUrl);
    mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(mockFeedbackItems);
    mockWorkItemService.getWorkItemsByIds.mockResolvedValue(mockWorkItems as never);

    global.Blob = jest.fn().mockImplementation((content: BlobPart[], options?: BlobPropertyBag) => ({
      content: Array.isArray(content) ? content.join('') : content,
      type: options?.type || '',
      size: 0,
      stream: jest.fn(),
      arrayBuffer: jest.fn(),
      slice: jest.fn(),
      text: jest.fn().mockResolvedValue(Array.isArray(content) ? content.join('') : content)
    })) as never;
  });

  describe('generateCSVContent', () => {
    it('should generate CSV content with feedback items and work items', async () => {
      await shareBoardHelper.generateCSVContent(mockBoard);

      expect(mockGetBoardUrl).toHaveBeenCalledWith('team1', 'board1');
      expect(mockItemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith('board1');
      expect(mockWorkItemService.getWorkItemsByIds).toHaveBeenCalledWith([123, 456]);
      expect(mockSaveAs).toHaveBeenCalled();

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const filename = saveAsCall[1] as string;

      expect(filename).toBe('retro.csv');
      expect(blob.type).toBe('text/plain;charset=utf-8');

      const text = await blob.text();

      expect(text).toContain('"Retrospectives Summary for \'Test Retrospective Board\' (https://dev.azure.com/test-org/test-project/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=team1&boardId=board1)"');
      expect(text).toContain('Feedback Items');
      expect(text).toContain('Type,Description,Votes,CreatedDate,CreatedBy');
      expect(text).toContain('Work Items');
      expect(text).toContain('Feedback Description,Work Item Title,Work Item Type,Work Item Id,Url');

      expect(text).toContain('"What went well","Great teamwork",3');
      expect(text).toContain('"What could be improved","Need better communication",2');
      expect(text).toContain('"What went well","Grouped feedback parent",1');
      expect(text).toContain('"What went well","Grouped child item 1",0');
      expect(text).toContain('"What went well","Grouped child item 2",1');

      expect(text).toContain('"Great teamwork","Improve team communication",Task,123');
      expect(text).toContain('"Great teamwork","Set up team retrospectives",User Story,456');
    });

    it('should handle feedback items without work items', async () => {
      const feedbackItemsWithoutWorkItems = mockFeedbackItems.map(item => ({
        ...item,
        associatedActionItemIds: undefined as number[] | undefined
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithoutWorkItems);

      await shareBoardHelper.generateCSVContent(mockBoard);

      expect(mockWorkItemService.getWorkItemsByIds).not.toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalled();

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const text = await blob.text();

      expect(text).toContain('Work Items');
      expect(text).toContain('Feedback Description,Work Item Title,Work Item Type,Work Item Id,Url');
    });

    it('should handle feedback items with empty work item arrays', async () => {
      const feedbackItemsWithEmptyWorkItems = mockFeedbackItems.map(item => ({
        ...item,
        associatedActionItemIds: [] as number[]
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithEmptyWorkItems);

      await shareBoardHelper.generateCSVContent(mockBoard);

      expect(mockWorkItemService.getWorkItemsByIds).not.toHaveBeenCalled();
    });

    it('should filter out non-existent child feedback items', async () => {
      await shareBoardHelper.generateCSVContent(mockBoard);

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const text = await blob.text();

      expect(text).toContain('"What went well","Grouped child item 1",0');
      expect(text).toContain('"What went well","Grouped child item 2",1');
      expect(text).not.toContain('item6');
    });

    it('should handle items with undefined createdBy', async () => {
      const feedbackItemsWithUndefinedCreatedBy = [
        {
          ...mockFeedbackItems[0],
          createdBy: undefined as IFeedbackItemDocument['createdBy']
        }
      ];
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithUndefinedCreatedBy);

      await shareBoardHelper.generateCSVContent(mockBoard);

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const text = await blob.text();

      expect(text).toContain('"What went well","Great teamwork",3');
      expect(text).toContain('"undefined"');
    });

    it('should handle parent items where all child items are non-existent', async () => {
      const feedbackItemsWithNonExistentChildren = [
        {
          ...mockFeedbackItems[0],
          childFeedbackItemIds: ['non-existent-1', 'non-existent-2'] as string[]
        }
      ];
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithNonExistentChildren);

      await shareBoardHelper.generateCSVContent(mockBoard);

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const text = await blob.text();

      expect(text).toContain('"What went well","Great teamwork",3');
      expect(text).not.toContain('non-existent-1');
      expect(text).not.toContain('non-existent-2');
    });

    it('should handle child feedback items with undefined createdBy in CSV generation', async () => {
      const feedbackItemsWithChildUndefinedCreatedBy = [
        ...mockFeedbackItems.slice(0, 3),
        {
          ...mockFeedbackItems[3],
          createdBy: undefined as IFeedbackItemDocument['createdBy']
        },
        ...mockFeedbackItems.slice(4)
      ];
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithChildUndefinedCreatedBy);

      await shareBoardHelper.generateCSVContent(mockBoard);

      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0] as Blob;
      const text = await blob.text();

      expect(text).toContain('"What went well","Grouped child item 1",0');
      expect(text).toContain('"undefined"');
    });
  });

  describe('generateEmailText', () => {
    it('should generate email text with sendEmail=false and return content', async () => {
      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(mockGetBoardUrl).not.toHaveBeenCalled();
      expect(mockItemDataService.getFeedbackItemsForBoard).toHaveBeenCalledWith('board1');
      expect(mockWorkItemService.getWorkItemsByIds).toHaveBeenCalledWith([123, 456]);

      expect(result).toContain('Retrospectives Summary');
      expect(result).toContain('Retrospective: Test Retrospective Board');
      expect(result).toContain('What went well:');
      expect(result).toContain(' - Great teamwork [3 votes]');
      expect(result).toContain('What could be improved:');
      expect(result).toContain(' - Need better communication [2 votes]');
      expect(result).toContain('Work items:');
      expect(result).toContain(' - Improve team communication [Task #123]');
      expect(result).toContain(' - Set up team retrospectives [User Story #456]');
      expect(result).toContain('Link to retrospective:');
      expect(result).toContain(mockBoardUrl);
    });

    it('should generate email text with sendEmail=true and open mailto link', async () => {
      const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, true);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:?subject=Retrospectives Summary for Test Retrospective Board&body=')
      );

      const call = mockWindowOpen.mock.calls[0][0] as string;
      const encodedBody = call.split('&body=')[1];
      const decodedBody = decodeURIComponent(encodedBody);

      expect(decodedBody).toContain('Retrospectives Summary');
      expect(decodedBody).toContain('Retrospective: Test Retrospective Board');

      mockWindowOpen.mockRestore();
    });

    it('should handle columns with no feedback items', async () => {
      const emptyBoard = {
        ...mockBoard,
        columns: [
          ...mockBoard.columns,
          {
            id: 'col4',
            title: 'Empty Column',
            iconClass: 'icon-empty',
            accentColor: '#000000'
          }
        ]
      };

      const result = await shareBoardHelper.generateEmailText(emptyBoard, mockBoardUrl, false);

      expect(result).toContain('Empty Column:');
      expect(result).toContain(' - No items');
    });

    it('should handle grouped feedback items in email', async () => {
      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain(' - Grouped feedback parent [1 votes]');
      expect(result).toContain('\t- Grouped feedback items:');
      expect(result).toContain('\t\t- Grouped child item 1 [0 votes]');
      expect(result).toContain('\t\t- Grouped child item 2 [1 votes]');
    });

    it('should handle feedback items without associated work items', async () => {
      const feedbackItemsWithoutWorkItems = mockFeedbackItems.map(item => ({
        ...item,
        associatedActionItemIds: undefined as number[] | undefined
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithoutWorkItems);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain('Work items:');
      expect(result).toContain(' - No work items');
      expect(mockWorkItemService.getWorkItemsByIds).not.toHaveBeenCalled();
    });

    it('should handle empty work items array', async () => {
      const feedbackItemsWithEmptyWorkItems = mockFeedbackItems.map(item => ({
        ...item,
        associatedActionItemIds: [] as number[]
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithEmptyWorkItems);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain('Work items:');
      expect(result).toContain(' - No work items');
    });

    it('should handle grouped feedback items where child items have undefined createdBy', async () => {
      const feedbackItemsWithUndefinedChildCreatedBy = [
        ...mockFeedbackItems.slice(0, 3),
        {
          ...mockFeedbackItems[3],
          createdBy: undefined as IFeedbackItemDocument['createdBy']
        },
        ...mockFeedbackItems.slice(4)
      ];
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithUndefinedChildCreatedBy);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain('\t\t- Grouped child item 1 [0 votes]');
      expect(result).toContain('\t\t- Grouped child item 2 [1 votes]');
    });
  });

  describe('getFeedbackBody (private method testing through public methods)', () => {
    it('should filter out non-existent child feedback items', async () => {
      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain('\t\t- Grouped child item 1 [0 votes]');
      expect(result).toContain('\t\t- Grouped child item 2 [1 votes]');
      expect(result).not.toContain('item6');
    });

    it('should handle parent items with no child items', async () => {
      const itemsWithoutChildren = mockFeedbackItems.map(item => ({
        ...item,
        childFeedbackItemIds: undefined as string[] | undefined
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(itemsWithoutChildren);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain(' - Great teamwork [3 votes]');
      expect(result).toContain(' - Need better communication [2 votes]');
      expect(result).toContain(' - Grouped feedback parent [1 votes]');
      expect(result).not.toContain('\t- Grouped feedback items:');
    });

    it('should handle parent items with empty child items array', async () => {
      const itemsWithEmptyChildren = mockFeedbackItems.map(item => ({
        ...item,
        childFeedbackItemIds: item.childFeedbackItemIds ? ([] as string[]) : undefined
      }));
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(itemsWithEmptyChildren);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).not.toContain('\t- Grouped feedback items:');
    });

    it('should handle parent items where all child items are non-existent', async () => {
      const feedbackItemsWithNonExistentChildren = [
        {
          ...mockFeedbackItems[0],
          childFeedbackItemIds: ['non-existent-1', 'non-existent-2'] as string[]
        }
      ];
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackItemsWithNonExistentChildren);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain(' - Great teamwork [3 votes]');
      expect(result).not.toContain('non-existent-1');
      expect(result).not.toContain('non-existent-2');
    });
  });

  describe('getActionItemsBody (private method testing through public methods)', () => {
    it('should handle multiple work items for a single feedback item', async () => {
      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain(' - Improve team communication [Task #123]: https://dev.azure.com/test-org/test-project/_workitems/edit/123');
      expect(result).toContain(' - Set up team retrospectives [User Story #456]: https://dev.azure.com/test-org/test-project/_workitems/edit/456');
    });

    it('should handle feedback items with different work item types', async () => {
      const workItemsWithDifferentTypes = [
        {
          id: 789,
          fields: {
            'System.Title': 'Bug fix required',
            'System.WorkItemType': 'Bug'
          },
          _links: {
            html: {
              href: 'https://dev.azure.com/test-org/test-project/_workitems/edit/789'
            }
          }
        }
      ];

      const feedbackWithBugWorkItem = [
        {
          ...mockFeedbackItems[1],
          associatedActionItemIds: [789] as number[]
        }
      ];

      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue(feedbackWithBugWorkItem);
      mockWorkItemService.getWorkItemsByIds.mockResolvedValue(workItemsWithDifferentTypes as never);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain(' - Bug fix required [Bug #789]: https://dev.azure.com/test-org/test-project/_workitems/edit/789');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty feedback items array', async () => {
      mockItemDataService.getFeedbackItemsForBoard.mockResolvedValue([]);

      const result = await shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false);

      expect(result).toContain('Retrospectives Summary');
      expect(result).toContain('What went well:');
      expect(result).toContain(' - No items');
      expect(result).toContain('What could be improved:');
      expect(result).toContain(' - No items');
      expect(result).toContain('Action items:');
      expect(result).toContain(' - No items');
      expect(result).toContain('Work items:');
      expect(result).toContain(' - No work items');
    });

    it('should handle service errors gracefully for CSV generation', async () => {
      mockItemDataService.getFeedbackItemsForBoard.mockRejectedValue(new Error('Service error'));

      await expect(shareBoardHelper.generateCSVContent(mockBoard)).rejects.toThrow('Service error');
    });

    it('should handle service errors gracefully for email generation', async () => {
      mockItemDataService.getFeedbackItemsForBoard.mockRejectedValue(new Error('Service error'));

      await expect(shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false)).rejects.toThrow('Service error');
    });

    it('should handle work item service errors', async () => {
      mockWorkItemService.getWorkItemsByIds.mockRejectedValue(new Error('Work item service error'));

      await expect(shareBoardHelper.generateEmailText(mockBoard, mockBoardUrl, false)).rejects.toThrow('Work item service error');
    });

    it('should handle getBoardUrl errors in CSV generation', async () => {
      mockGetBoardUrl.mockRejectedValue(new Error('URL generation error'));

      await expect(shareBoardHelper.generateCSVContent(mockBoard)).rejects.toThrow('URL generation error');
    });
  });
});
