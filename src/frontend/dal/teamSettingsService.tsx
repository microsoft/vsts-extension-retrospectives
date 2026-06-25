import { getValue, setValue } from "./dataService";

const getAllowedActionItemWorkItemTypesKey = (teamId: string): string => `team.${teamId}.allowedActionItemWorkItemTypes`;

class TeamSettingsService {
  public async getAllowedActionItemWorkItemTypeNames(teamId: string): Promise<string[]> {
    const value = await getValue<string[]>(getAllowedActionItemWorkItemTypesKey(teamId));
    return Array.isArray(value) ? value : [];
  }

  public async saveAllowedActionItemWorkItemTypeNames(teamId: string, workItemTypeNames: string[]): Promise<string[]> {
    const uniqueWorkItemTypeNames = [...new Set(workItemTypeNames)].sort((left, right) => left.localeCompare(right));
    return await setValue(getAllowedActionItemWorkItemTypesKey(teamId), uniqueWorkItemTypeNames);
  }
}

export const teamSettingsService = new TeamSettingsService();
