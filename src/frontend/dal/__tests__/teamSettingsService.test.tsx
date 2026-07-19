const mockGetValue = jest.fn();
const mockSetValue = jest.fn();

jest.mock("../dataService", () => ({
  getValue: mockGetValue,
  setValue: mockSetValue,
}));

describe("teamSettingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns saved allowed action item work item type names", async () => {
    const { teamSettingsService } = await import("../teamSettingsService");
    mockGetValue.mockResolvedValue(["Bug", "Task"]);

    const result = await teamSettingsService.getAllowedActionItemWorkItemTypeNames("team-1");

    expect(result).toEqual(["Bug", "Task"]);
    expect(mockGetValue).toHaveBeenCalledWith("team.team-1.allowedActionItemWorkItemTypes");
  });

  it("returns an empty list when the saved value is not an array", async () => {
    const { teamSettingsService } = await import("../teamSettingsService");
    mockGetValue.mockResolvedValue("Bug");

    await expect(teamSettingsService.getAllowedActionItemWorkItemTypeNames("team-2")).resolves.toEqual([]);
  });

  it("deduplicates, sorts, and saves allowed action item work item type names", async () => {
    const { teamSettingsService } = await import("../teamSettingsService");
    mockSetValue.mockImplementation(async (_key, value) => value);

    const result = await teamSettingsService.saveAllowedActionItemWorkItemTypeNames("team-3", ["Task", "Bug", "Task"]);

    expect(result).toEqual(["Bug", "Task"]);
    expect(mockSetValue).toHaveBeenCalledWith("team.team-3.allowedActionItemWorkItemTypes", ["Bug", "Task"]);
  });
});
