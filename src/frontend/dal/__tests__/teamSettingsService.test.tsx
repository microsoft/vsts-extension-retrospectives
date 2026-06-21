const mockGetValue = jest.fn();
const mockSetValue = jest.fn();

jest.mock("../dataService", () => ({
  getValue: mockGetValue,
  setValue: mockSetValue,
}));

import { teamSettingsService } from "../teamSettingsService";

describe("teamSettingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllowedActionItemWorkItemTypeNames", () => {
    it("returns saved work item type names", async () => {
      mockGetValue.mockResolvedValue(["Bug", "User Story"]);

      const result = await teamSettingsService.getAllowedActionItemWorkItemTypeNames("team-1");

      expect(result).toEqual(["Bug", "User Story"]);
      expect(mockGetValue).toHaveBeenCalledWith("team.team-1.allowedActionItemWorkItemTypes");
    });

    it("returns an empty array when no setting exists", async () => {
      mockGetValue.mockResolvedValue(undefined);

      const result = await teamSettingsService.getAllowedActionItemWorkItemTypeNames("team-1");

      expect(result).toEqual([]);
    });

    it("returns an empty array when stored setting is not an array", async () => {
      mockGetValue.mockResolvedValue("Bug");

      const result = await teamSettingsService.getAllowedActionItemWorkItemTypeNames("team-1");

      expect(result).toEqual([]);
    });
  });

  describe("saveAllowedActionItemWorkItemTypeNames", () => {
    it("deduplicates and sorts work item type names before saving", async () => {
      mockSetValue.mockResolvedValue(["Bug", "Task", "User Story"]);

      const result = await teamSettingsService.saveAllowedActionItemWorkItemTypeNames("team-1", ["Task", "Bug", "Task", "User Story"]);

      expect(result).toEqual(["Bug", "Task", "User Story"]);
      expect(mockSetValue).toHaveBeenCalledWith("team.team-1.allowedActionItemWorkItemTypes", ["Bug", "Task", "User Story"]);
    });

    it("saves an empty array when no work item types are selected", async () => {
      mockSetValue.mockResolvedValue([]);

      const result = await teamSettingsService.saveAllowedActionItemWorkItemTypeNames("team-1", []);

      expect(result).toEqual([]);
      expect(mockSetValue).toHaveBeenCalledWith("team.team-1.allowedActionItemWorkItemTypes", []);
    });
  });
});
