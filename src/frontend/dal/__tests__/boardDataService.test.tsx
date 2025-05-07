import BoardDataService from '../boardDataService';
import { createDocument, deleteDocument, readDocument, readDocuments, updateDocument } from '../dataService';
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

jest.mock('../dataService', () => ({
  createDocument: jest.fn().mockResolvedValue(mockBoard),
  deleteDocument: jest.fn().mockResolvedValue(true),
  readDocument: jest.fn().mockResolvedValue(mockBoard),
  readDocuments: jest.fn(), // ✅ Ensure Jest recognizes it as a mock
  updateDocument: jest.fn().mockResolvedValue(mockBoard),
}));

/*
jest.mock('../dataService', () => ({
  getDataService: jest.fn().mockResolvedValue({
    createDocument: jest.fn().mockResolvedValue(mockBoard),
  }),
}));
*/

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

const mockPermissions: IFeedbackBoardDocumentPermissions = { Teams: ["team1"], Members: ["user1"] };

const mockBoard: IFeedbackBoardDocument = {
  id: "board-1",
  title: "Sprint Planning",
  teamId: "team-123",
  columns: [],
  createdBy: mockIdentityRef, // Using full IdentityRef
  createdDate: new Date(),
  modifiedDate: new Date(),
  maxVotesPerUser: 5,
  isIncludeTeamEffectivenessMeasurement: true,
  displayPrimeDirective: true,
  shouldShowFeedbackAfterCollect: false,
  isAnonymous: false,
  activePhase: "Collect",
  boardVoteCollection: {},
  teamEffectivenessMeasurementVoteCollection: [],
  isPublic: true,
  permissions: mockPermissions,
};

const mockBoards: IFeedbackBoardDocument[] = [
  { ...mockBoard, id: "board-1", title: "Sprint Planning" },
  { ...mockBoard, id: "board-2", title: "Team Sync" },
];

describe("BoardDataService - createBoardForTeam", () => {
  it("should create a new board with default values", async () => {
    const result = await BoardDataService.createBoardForTeam("team-123", "Sprint Planning", 5, []);
    expect(result).toEqual(mockBoard);
    expect(createDocument).toHaveBeenCalledWith("team-123", expect.any(Object));
  });
});

describe("BoardDataService - checkIfBoardNameIsTaken", () => {
  beforeEach(() => {
    (readDocuments as jest.Mock).mockResolvedValue(mockBoards); // ✅ Explicitly cast readDocuments
  });

  it("should return true if a board with the same name exists", async () => {
    const result = await BoardDataService.checkIfBoardNameIsTaken("team-123", "Sprint Planning");
    expect(result).toBe(true);
  });

  it("should return false if no matching board exists", async () => {
    const result = await BoardDataService.checkIfBoardNameIsTaken("team-123", "Retrospective");
    expect(result).toBe(false);
  });
});

describe("BoardDataService - getBoardsForTeam", () => {
  it("should return all boards for a team", async () => {
    (readDocuments as jest.Mock).mockResolvedValue(mockBoards); // ✅ Explicitly cast
    const result = await BoardDataService.getBoardsForTeam("team-123");
    expect(result).toEqual(mockBoards);
  });

  it("should return an empty list if no boards exist", async () => {
    (readDocuments as jest.Mock).mockResolvedValue([]);
    const result = await BoardDataService.getBoardsForTeam("team-123");
    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    (readDocuments as jest.Mock).mockRejectedValue(new Error("Failed to fetch boards"));
    const result = await BoardDataService.getBoardsForTeam("team-123");
    expect(result).toEqual([]);
  });
});

describe("BoardDataService - deleteFeedbackBoard", () => {
  it("should delete the board and all associated documents", async () => {
    (readDocuments as jest.Mock).mockResolvedValue([{ id: "item-1" }, { id: "item-2" }]);
    await BoardDataService.deleteFeedbackBoard("team-123", "board-1");
    expect(deleteDocument).toHaveBeenCalledTimes(3); // 2 items + board itself
  });
});

describe("BoardDataService - updateBoardMetadata", () => {
  it("should update board metadata", async () => {
    const result = await BoardDataService.updateBoardMetadata("team-123", "board-1", 10, "New Title", [], mockPermissions);
    expect(result.title).toBe("New Title");
    expect(result.maxVotesPerUser).toBe(10);
    expect(updateDocument).toHaveBeenCalled();
  });

  it("should not update metadata if board does not exist", async () => {
    (readDocument as jest.Mock).mockResolvedValue(undefined); // ✅ Explicitly cast
    const result = await BoardDataService.updateBoardMetadata("team-123", "board-1", 10, "New Title", [], mockPermissions);
    expect(result).toBeUndefined();
    expect(updateDocument).not.toHaveBeenCalled();
  });
});
