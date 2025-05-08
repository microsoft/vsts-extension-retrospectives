import BoardDataService from '../boardDataService';
import { createDocument, deleteDocument, readDocument, readDocuments, updateDocument, setValue, getValue } from '../dataService';
import { IFeedbackBoardDocument, IFeedbackBoardDocumentPermissions } from '../../interfaces/feedback';
import { IdentityRef } from 'azure-devops-extension-api/WebApi';

jest.mock('../dataService', () => ({
  createDocument: jest.fn(),
  deleteDocument: jest.fn(),
  readDocument: jest.fn(),
  readDocuments: jest.fn(),
  updateDocument: jest.fn(),
  getValue: jest.fn(),
  setValue: jest.fn(),
}));

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
    (createDocument as jest.Mock).mockResolvedValue(mockBoard); // ✅ Explicitly cast createDocument
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
  beforeEach(() => {
    (readDocument as jest.Mock).mockResolvedValue(mockBoard); // ✅ Explicitly cast readDocument
    (updateDocument as jest.Mock).mockResolvedValue({ ...mockBoard, title: "New Title", maxVotesPerUser: 10 });
  });
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

describe("BoardDataService - getBoardForTeamById", () => {
  it("should retrieve a board by its ID", async () => {
    (readDocument as jest.Mock).mockResolvedValue(mockBoard);
    const result = await BoardDataService.getBoardForTeamById("team-123", "board-1");
    expect(result).toEqual(mockBoard);
  });

  it("should return undefined if board does not exist", async () => {
    (readDocument as jest.Mock).mockResolvedValue(undefined);
    const result = await BoardDataService.getBoardForTeamById("team-123", "non-existent-id");
    expect(result).toBeUndefined();
  });
});

describe("BoardDataService - deleteFeedbackBoard", () => {
  it("should delete the board and all associated items", async () => {
    (readDocuments as jest.Mock).mockResolvedValue([{ id: "item-1" }, { id: "item-2" }]);
    await BoardDataService.deleteFeedbackBoard("team-123", "board-1");
    expect(deleteDocument).toHaveBeenCalledTimes(3); // Two items + board itself.
  });

  it("should delete board even if there are no items", async () => {
    (readDocuments as jest.Mock).mockResolvedValue([]);
    await BoardDataService.deleteFeedbackBoard("team-123", "board-1");
    expect(deleteDocument).toHaveBeenCalledWith("team-123", "board-1");
  });
});

describe("BoardDataService - archiveFeedbackBoard", () => {
  it("should archive a board with correct metadata", async () => {
    (readDocument as jest.Mock).mockResolvedValue(mockBoard);
    (updateDocument as jest.Mock).mockResolvedValue({ 
      ...mockBoard, 
      isArchived: true, 
      archivedDate: new Date() // ✅ Ensure it returns a Date
    });

    const result = await BoardDataService.archiveFeedbackBoard("team-123", "board-1");
    expect(result.isArchived).toBe(true);
    expect(result.archivedDate).toBeInstanceOf(Date);
    expect(updateDocument).toHaveBeenCalled();
  });

  it("should return undefined if board does not exist", async () => {
    (readDocument as jest.Mock).mockResolvedValue(undefined);
    const result = await BoardDataService.archiveFeedbackBoard("team-123", "non-existent-id");
    expect(result).toBeUndefined();
  });
});

describe("BoardDataService - restoreArchivedFeedbackBoard", () => {
  it("should restore an archived board", async () => {
    (readDocument as jest.Mock).mockResolvedValue({ ...mockBoard, isArchived: true });
    (updateDocument as jest.Mock).mockResolvedValue({ 
      ...mockBoard, 
      isArchived: false, 
      archivedDate: undefined // ✅ Ensure it resets properly
    });

    const result = await BoardDataService.restoreArchivedFeedbackBoard("team-123", "board-1");
    expect(result.isArchived).toBe(false);
    expect(result.archivedDate).toBeUndefined();
    expect(updateDocument).toHaveBeenCalled();
  });
});

describe("BoardDataService - saveSetting & getSetting", () => {
  it("should save and retrieve settings correctly", async () => {
    (setValue as jest.Mock).mockResolvedValue(undefined);
    (getValue as jest.Mock).mockResolvedValue("Test Value");

    await BoardDataService.saveSetting("setting-key", "Test Value");
    const result = await BoardDataService.getSetting("setting-key");

    expect(result).toBe("Test Value");
    expect(setValue).toHaveBeenCalledWith("setting-key", "Test Value", true);
    expect(getValue).toHaveBeenCalledWith("setting-key", true);
  });

  it("should return null for undefined settings", async () => {
    (getValue as jest.Mock).mockResolvedValue(undefined);
    const result = await BoardDataService.getSetting("missing-key");
    expect(result).toBeNull();
  });
});
