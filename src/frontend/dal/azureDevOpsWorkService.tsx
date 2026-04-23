import { TeamFieldValues, TeamSettingsIteration } from "azure-devops-extension-api/Work";
import { WorkRestClient } from "azure-devops-extension-api/Work/WorkClient";
import { getClient } from "azure-devops-extension-api/Common";

import { getProjectId } from "../utilities/servicesHelper";
import { appInsights, TelemetryExceptions } from "../utilities/telemetryClient";
import { isAzureDevOpsError, AzureDevOpsErrorTypes } from "../interfaces/azureDevOpsError";
import { TtlCache } from "../utilities/ttlCache";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class WorkService {
  private _httpWorkClient: WorkRestClient;
  private _iterationsCache = new TtlCache<TeamSettingsIteration[]>(CACHE_TTL_MS);
  private _teamFieldValuesCache = new TtlCache<TeamFieldValues>(CACHE_TTL_MS);

  constructor() {
    this._httpWorkClient = getClient(WorkRestClient);
  }

  /**
   * Gets the iterations for the current project and a given team
   */
  public async getIterations(teamId: string, timeframe?: string): Promise<TeamSettingsIteration[]> {
    const cacheKey = `${teamId}:${timeframe ?? ""}`;
    const cached = this._iterationsCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const projectId = await getProjectId();
    const teamContext = {
      project: "",
      projectId,
      team: "",
      teamId,
    };

    let teamIterations: TeamSettingsIteration[] = [];

    try {
      teamIterations = await this._httpWorkClient.getTeamIterations(teamContext, timeframe);
      this._iterationsCache.set(cacheKey, teamIterations);
    } catch (e: unknown) {
      appInsights.trackException({ exception: e instanceof Error ? e : new Error(String(e)), properties: { teamId } });
      if (isAzureDevOpsError(e) && e.serverError?.typeKey === AzureDevOpsErrorTypes.CurrentIterationDoesNotExist) {
        appInsights.trackTrace({ message: TelemetryExceptions.CurrentTeamIterationNotFound, properties: { teamId, e } });
      }
    }

    return teamIterations;
  }

  /**
   * Gets the team field values (default being area paths) for project and team
   */
  public async getTeamFieldValues(teamId: string): Promise<TeamFieldValues> {
    const cached = this._teamFieldValuesCache.get(teamId);
    if (cached !== undefined) {
      return cached;
    }

    const projectId = await getProjectId();
    const teamContext = {
      project: "",
      projectId,
      team: "",
      teamId,
    };

    let teamFieldValues: TeamFieldValues = undefined;

    try {
      teamFieldValues = await this._httpWorkClient.getTeamFieldValues(teamContext);
      if (teamFieldValues !== undefined) {
        this._teamFieldValuesCache.set(teamId, teamFieldValues);
      }
    } catch (e) {
      appInsights.trackException(e, { teamId });
    }

    return teamFieldValues;
  }

  /**
   * Clears all cached team metadata (iterations and team field values).
   */
  public clearCache(): void {
    this._iterationsCache.clear();
    this._teamFieldValuesCache.clear();
  }
}

export const workService = new WorkService();
