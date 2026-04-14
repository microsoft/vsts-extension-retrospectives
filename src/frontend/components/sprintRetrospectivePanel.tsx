import React from "react";
import { getConfiguration, register, resize, unregister } from "azure-devops-extension-sdk";
import { TeamSettingsIteration } from "azure-devops-extension-api/Work";

import BoardDataService from "../dal/boardDataService";
import { WorkflowPhase } from "../interfaces/workItem";
import { getBoardUrl } from "../utilities/boardUrlHelper";
import { formatDate, t } from "../utilities/localization";
import { appInsights } from "../utilities/telemetryClient";
import { workService } from "../dal/azureDevOpsWorkService";
import {
  createOrGetSprintRetrospectiveBoard,
  findSprintRetrospectiveBoard,
  getCurrentIteration,
  resolveIterationFromConfiguration,
  sortIterationsForRetrospectives,
} from "../utilities/sprintRetrospectiveHelper";

const REGISTERED_OBJECT_ID = "sprintRetrospectivePanelObject";

type SprintRetrospectivePanelState = {
  isLoading: boolean;
  isWorking: boolean;
  errorMessage?: string;
  infoMessage?: string;
  teamId: string;
  teamName: string;
  iteration?: TeamSettingsIteration;
  boardTitle?: string;
  boardUrl?: string;
};

const initialState: SprintRetrospectivePanelState = {
  isLoading: true,
  isWorking: false,
  teamId: "",
  teamName: "",
};

const formatIterationDateRange = (iteration: TeamSettingsIteration): string => {
  const startDate = iteration.attributes?.startDate;
  const finishDate = iteration.attributes?.finishDate;

  if (!startDate || !finishDate) {
    return t("sprint_retro_dates_unavailable");
  }

  return `${formatDate(startDate, { month: "short", day: "numeric", year: "numeric" })} - ${formatDate(finishDate, { month: "short", day: "numeric", year: "numeric" })}`;
};

export default function SprintRetrospectivePanel(): React.ReactElement {
  const [state, setState] = React.useState<SprintRetrospectivePanelState>(initialState);

  React.useEffect(() => {
    let isDisposed = false;

    register(REGISTERED_OBJECT_ID, {
      workItemSelectionChanged: (): void => {},
    });

    const loadPanelState = async () => {
      try {
        const configuration = getConfiguration();
        const configuredTeam = configuration.team as { id?: string; name?: string } | undefined;
        const teamId = typeof configuredTeam?.id === "string" ? configuredTeam.id : "";
        const teamName = typeof configuredTeam?.name === "string" ? configuredTeam.name : "";

        if (!teamId) {
          throw new Error("Sprint retrospective panel did not receive team context from Azure DevOps.");
        }

        const iterations = sortIterationsForRetrospectives(await workService.getIterations(teamId));
        const iteration = resolveIterationFromConfiguration(configuration, iterations) ?? getCurrentIteration(iterations) ?? iterations[0];

        if (!iteration) {
          throw new Error("Sprint retrospective panel could not resolve an iteration.");
        }

        const boards = await BoardDataService.getBoardsForTeam(teamId);
        const existingBoard = findSprintRetrospectiveBoard(boards, teamId, iteration);
        const boardUrl = existingBoard ? await getBoardUrl(teamId, existingBoard.id, WorkflowPhase.Collect) : undefined;

        if (isDisposed) {
          return;
        }

        setState({
          isLoading: false,
          isWorking: false,
          teamId,
          teamName,
          iteration,
          errorMessage: undefined,
          boardTitle: existingBoard?.title,
          boardUrl,
          infoMessage: existingBoard ? t("sprint_retro_panel_exists", { title: existingBoard.title }) : undefined,
        });
      } catch (error) {
        appInsights.trackException(error, { action: "loadSprintRetrospectivePanel" });

        if (isDisposed) {
          return;
        }

        setState(previousState => ({
          ...previousState,
          isLoading: false,
          isWorking: false,
          errorMessage: t("sprint_retro_panel_error"),
        }));
      }
    };

    loadPanelState();

    return () => {
      isDisposed = true;
      unregister(REGISTERED_OBJECT_ID);
    };
  }, []);

  React.useEffect(() => {
    resize();
  }, [state]);

  const createSprintRetrospective = async () => {
    if (!state.teamId || !state.iteration) {
      return;
    }

    setState(previousState => ({ ...previousState, isWorking: true, errorMessage: undefined }));

    try {
      const result = await createOrGetSprintRetrospectiveBoard({
        teamId: state.teamId,
        iteration: state.iteration,
      });
      const boardUrl = await getBoardUrl(state.teamId, result.board.id, WorkflowPhase.Collect);

      setState(previousState => ({
        ...previousState,
        isWorking: false,
        errorMessage: undefined,
        boardTitle: result.board.title,
        boardUrl,
        infoMessage: t(result.wasCreated ? "sprint_retro_created" : "sprint_retro_exists", { title: result.board.title, iteration: state.iteration!.name }),
      }));
    } catch (error) {
      appInsights.trackException(error, { action: "createSprintRetrospectiveFromPanel", teamId: state.teamId, iterationId: state.iteration.id });
      setState(previousState => ({ ...previousState, isWorking: false, errorMessage: t("sprint_retro_error", { iteration: state.iteration!.name }) }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-(--text-primary-color)">
      <div>
        <h2 className="m-0 text-lg font-semibold">{t("sprint_retro_panel_title")}</h2>
        <p className="mt-2 mb-0 text-(--text-secondary-color)">{t("sprint_retro_panel_description")}</p>
      </div>

      {state.errorMessage && (
        <div className="retro-message-bar" role="alert" aria-live="assertive">
          <span>{state.errorMessage}</span>
        </div>
      )}

      {state.infoMessage && !state.errorMessage && (
        <div className="retro-message-bar" role="status" aria-live="polite">
          <span>{state.infoMessage}</span>
        </div>
      )}

      {state.isLoading ? (
        <div className="spinner" aria-live="polite">
          <div></div>
          <span>{t("common_loading")}</span>
        </div>
      ) : state.iteration ? (
        <>
          <dl className="m-0 grid gap-3 rounded border border-(--border-subtle-color) bg-(--background-color) p-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary-color)">{t("sprint_retro_team_label")}</dt>
              <dd className="m-0 mt-1">{state.teamName || state.teamId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary-color)">{t("sprint_retro_iteration_label")}</dt>
              <dd className="m-0 mt-1">{state.iteration.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary-color)">{t("sprint_retro_dates_label")}</dt>
              <dd className="m-0 mt-1">{formatIterationDateRange(state.iteration)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary-color)">{t("sprint_retro_status_label")}</dt>
              <dd className="m-0 mt-1">{state.boardTitle ?? t("sprint_retro_panel_ready")}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            {!state.boardUrl && (
              <button type="button" className="cursor-pointer rounded border border-primary bg-primary px-4 py-2 text-white" disabled={state.isWorking} onClick={createSprintRetrospective}>
                {state.isWorking ? t("common_loading") : t("sprint_retro_create_button")}
              </button>
            )}
            {state.boardUrl && (
              <a href={state.boardUrl} target="_top" rel="noreferrer" className="rounded border border-primary bg-primary px-4 py-2 text-white no-underline">
                {t("sprint_retro_open_button")}
              </a>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}