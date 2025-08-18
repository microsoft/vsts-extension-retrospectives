import { userDataService } from "../userDataService";
import { getValue, setValue } from "../dataService";
import { IUserVisit } from "../../interfaces/feedback";

jest.mock("../dataService", () => ({
  getValue: jest.fn(),
  setValue: jest.fn(),
}));

const mockGetValue = getValue as jest.MockedFunction<typeof getValue>;
const mockSetValue = setValue as jest.MockedFunction<typeof setValue>;

describe("UserDataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addVisit", () => {
    it("should add a new visit when no existing visits", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const expectedVisit: IUserVisit = { teamId, boardId };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual([expectedVisit]);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
      expect(mockSetValue).toHaveBeenCalledWith("visits", [expectedVisit], true);
    });

    it("should add a new visit with undefined boardId", async () => {
      // Arrange
      const teamId = "team123";
      const expectedVisit: IUserVisit = { teamId, boardId: undefined };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act
      const result = await userDataService.addVisit(teamId);

      // Assert
      expect(result).toEqual([expectedVisit]);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
      expect(mockSetValue).toHaveBeenCalledWith("visits", [expectedVisit], true);
    });

    it("should add visit to existing visits without duplicates", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const newVisit: IUserVisit = { teamId, boardId };
      const existingVisits: IUserVisit[] = [
        { teamId: "team999", boardId: "board999" },
        { teamId: "team888", boardId: "board888" },
      ];
      const expectedVisits = [...existingVisits, newVisit];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
      expect(mockSetValue).toHaveBeenCalledWith("visits", expectedVisits, true);
    });

    it("should remove duplicate visit before adding the new one", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const duplicateVisit: IUserVisit = { teamId, boardId };
      const existingVisits: IUserVisit[] = [{ teamId: "team999", boardId: "board999" }, duplicateVisit, { teamId: "team888", boardId: "board888" }];
      const expectedVisits = [{ teamId: "team999", boardId: "board999" }, { teamId: "team888", boardId: "board888" }, duplicateVisit];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(mockSetValue).toHaveBeenCalledWith("visits", expectedVisits, true);
    });

    it("should handle duplicate visit with undefined boardId", async () => {
      // Arrange
      const teamId = "team123";
      const duplicateVisit: IUserVisit = { teamId, boardId: undefined };
      const existingVisits: IUserVisit[] = [{ teamId: "team999", boardId: "board999" }, duplicateVisit, { teamId: "team888", boardId: "board888" }];
      const expectedVisits = [{ teamId: "team999", boardId: "board999" }, { teamId: "team888", boardId: "board888" }, duplicateVisit];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(mockSetValue).toHaveBeenCalledWith("visits", expectedVisits, true);
    });

    it("should keep only 10 most recent visits when adding to a full list", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const newVisit: IUserVisit = { teamId, boardId };

      // Create 10 existing visits
      const existingVisits: IUserVisit[] = [];
      for (let i = 0; i < 10; i++) {
        existingVisits.push({ teamId: `team${i}`, boardId: `board${i}` });
      }

      const expectedVisits = [...existingVisits.slice(1), newVisit];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(result).toHaveLength(10);
      expect(result[result.length - 1]).toEqual(newVisit);
      expect(result[0]).toEqual({ teamId: "team1", boardId: "board1" });
    });

    it("should keep only 10 most recent visits when adding to list with more than 10 items", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const newVisit: IUserVisit = { teamId, boardId };

      const existingVisits: IUserVisit[] = [];
      for (let i = 0; i < 15; i++) {
        existingVisits.push({ teamId: `team${i}`, boardId: `board${i}` });
      }

      const expectedVisits = [...existingVisits.slice(6), newVisit];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(result).toHaveLength(10);
      expect(result[result.length - 1]).toEqual(newVisit);
      expect(result[0]).toEqual({ teamId: "team6", boardId: "board6" });
    });

    it("should handle empty string parameters", async () => {
      // Arrange
      const teamId = "";
      const boardId = "";
      const expectedVisit: IUserVisit = { teamId, boardId };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act
      const result = await userDataService.addVisit(teamId, boardId);

      // Assert
      expect(result).toEqual([expectedVisit]);
      expect(mockSetValue).toHaveBeenCalledWith("visits", [expectedVisit], true);
    });

    it("should handle getValue error gracefully", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const expectedVisit: IUserVisit = { teamId, boardId };

      mockGetValue.mockRejectedValue(new Error("getData failed"));
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act & Assert
      await expect(userDataService.addVisit(teamId, boardId)).rejects.toThrow("getData failed");
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("should handle setValue error gracefully", async () => {
      // Arrange
      const teamId = "team123";
      const boardId = "board456";
      const expectedVisit: IUserVisit = { teamId, boardId };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockRejectedValue(new Error("setData failed"));

      // Act & Assert
      await expect(userDataService.addVisit(teamId, boardId)).rejects.toThrow("setData failed");
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
      expect(mockSetValue).toHaveBeenCalledWith("visits", [expectedVisit], true);
    });
  });

  describe("getVisits", () => {
    it("should return visits when they exist", async () => {
      // Arrange
      const expectedVisits: IUserVisit[] = [{ teamId: "team1", boardId: "board1" }, { teamId: "team2", boardId: "board2" }, { teamId: "team3" }];

      mockGetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.getVisits();

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return null/undefined when no visits exist", async () => {
      // Arrange
      mockGetValue.mockResolvedValue(null);

      // Act
      const result = await userDataService.getVisits();

      // Assert
      expect(result).toBeNull();
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return empty array when empty array is stored", async () => {
      // Arrange
      mockGetValue.mockResolvedValue([]);

      // Act
      const result = await userDataService.getVisits();

      // Assert
      expect(result).toEqual([]);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should handle getValue error gracefully", async () => {
      // Arrange
      mockGetValue.mockRejectedValue(new Error("getData failed"));

      // Act & Assert
      await expect(userDataService.getVisits()).rejects.toThrow("getData failed");
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });
  });

  describe("getMostRecentVisit", () => {
    it("should return the most recent visit (last item in array)", async () => {
      // Arrange
      const visits: IUserVisit[] = [
        { teamId: "team1", boardId: "board1" },
        { teamId: "team2", boardId: "board2" },
        { teamId: "team3", boardId: "board3" },
      ];
      const expectedMostRecent = visits[visits.length - 1];

      mockGetValue.mockResolvedValue(visits);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toEqual(expectedMostRecent);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return the only visit when array has one item", async () => {
      // Arrange
      const visits: IUserVisit[] = [{ teamId: "team1", boardId: "board1" }];
      const expectedMostRecent = visits[0];

      mockGetValue.mockResolvedValue(visits);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toEqual(expectedMostRecent);
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return undefined when no visits exist (null)", async () => {
      // Arrange
      mockGetValue.mockResolvedValue(null);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toBeUndefined();
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return undefined when no visits exist (undefined)", async () => {
      // Arrange
      mockGetValue.mockResolvedValue(undefined);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toBeUndefined();
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should return undefined when visits array is empty", async () => {
      // Arrange
      mockGetValue.mockResolvedValue([]);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toBeUndefined();
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });

    it("should handle visit with undefined boardId", async () => {
      // Arrange
      const visits: IUserVisit[] = [{ teamId: "team1", boardId: "board1" }, { teamId: "team2" }];
      const expectedMostRecent = visits[visits.length - 1];

      mockGetValue.mockResolvedValue(visits);

      // Act
      const result = await userDataService.getMostRecentVisit();

      // Assert
      expect(result).toEqual(expectedMostRecent);
      expect(result.boardId).toBeUndefined();
    });

    it("should handle getValue error gracefully", async () => {
      // Arrange
      mockGetValue.mockRejectedValue(new Error("getData failed"));

      // Act & Assert
      await expect(userDataService.getMostRecentVisit()).rejects.toThrow("getData failed");
      expect(mockGetValue).toHaveBeenCalledWith("visits", true);
    });
  });

  describe("clearVisits", () => {
    it("should clear all visits and return empty array", async () => {
      // Arrange
      const emptyArray: IUserVisit[] = [];
      mockSetValue.mockResolvedValue(emptyArray);

      // Act
      const result = await userDataService.clearVisits();

      // Assert
      expect(result).toEqual(emptyArray);
      expect(mockSetValue).toHaveBeenCalledWith("visits", [], true);
    });

    it("should handle setValue error gracefully", async () => {
      // Arrange
      mockSetValue.mockRejectedValue(new Error("setData failed"));

      // Act & Assert
      await expect(userDataService.clearVisits()).rejects.toThrow("setData failed");
      expect(mockSetValue).toHaveBeenCalledWith("visits", [], true);
    });
  });

  describe("edge cases and integration scenarios", () => {
    it("should handle multiple addVisit calls maintaining the 10-item limit", async () => {
      // Arrange
      let currentVisits: IUserVisit[] = [];

      mockGetValue.mockImplementation(async () => currentVisits);

      mockSetValue.mockImplementation(async (_key: string, data: unknown) => {
        currentVisits = [...(data as IUserVisit[])];
        return currentVisits;
      });

      for (let i = 0; i < 15; i++) {
        await userDataService.addVisit(`team${i}`, `board${i}`);
      }

      // Assert
      expect(currentVisits).toHaveLength(10);
      expect(currentVisits[0]).toEqual({ teamId: "team5", boardId: "board5" });
      expect(currentVisits[9]).toEqual({ teamId: "team14", boardId: "board14" });
    });

    it("should handle visit with very long teamId and boardId", async () => {
      // Arrange
      const longTeamId = "a".repeat(1000);
      const longBoardId = "b".repeat(1000);
      const expectedVisit: IUserVisit = { teamId: longTeamId, boardId: longBoardId };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act
      const result = await userDataService.addVisit(longTeamId, longBoardId);

      // Assert
      expect(result).toEqual([expectedVisit]);
      expect(result[0].teamId).toHaveLength(1000);
      expect(result[0].boardId).toHaveLength(1000);
    });

    it("should handle visit with special characters in teamId and boardId", async () => {
      // Arrange
      const specialTeamId = "team@#$%^&*()_+{}|:\"<>?[]\\;',./-=";
      const specialBoardId = "board🚀💯⚡️🎯🔥💡";
      const expectedVisit: IUserVisit = { teamId: specialTeamId, boardId: specialBoardId };

      mockGetValue.mockResolvedValue(null);
      mockSetValue.mockResolvedValue([expectedVisit]);

      // Act
      const result = await userDataService.addVisit(specialTeamId, specialBoardId);

      // Assert
      expect(result).toEqual([expectedVisit]);
      expect(result[0].teamId).toBe(specialTeamId);
      expect(result[0].boardId).toBe(specialBoardId);
    });

    it("should correctly identify duplicates when boardId is undefined in both visits", async () => {
      // Arrange
      const teamId = "team123";
      const existingVisits: IUserVisit[] = [
        { teamId: "team999", boardId: "board999" },
        { teamId, boardId: undefined },
        { teamId: "team888", boardId: "board888" },
      ];
      const expectedVisits = [
        { teamId: "team999", boardId: "board999" },
        { teamId: "team888", boardId: "board888" },
        { teamId, boardId: undefined },
      ];

      mockGetValue.mockResolvedValue(existingVisits);
      mockSetValue.mockResolvedValue(expectedVisits);

      // Act
      const result = await userDataService.addVisit(teamId);

      // Assert
      expect(result).toEqual(expectedVisits);
      expect(result).toHaveLength(3);
    });
  });
});
