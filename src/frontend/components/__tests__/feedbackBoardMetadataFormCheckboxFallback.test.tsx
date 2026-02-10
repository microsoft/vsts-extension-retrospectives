/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import FeedbackBoardMetadataForm from "../feedbackBoardMetadataForm";
import FeedbackBoardMetadataFormPermissions from "../feedbackBoardMetadataFormPermissions";

jest.mock("@fluentui/react/lib/Checkbox", () => ({
  Checkbox: ({ onChange, checked, label, ariaLabel, id, disabled }: any) => (
    <label htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        aria-label={ariaLabel || label}
        disabled={disabled}
        checked={checked}
        onChange={event => onChange?.(event, undefined)}
      />
      {label}
    </label>
  ),
}));

jest.mock("../../utilities/telemetryClient", () => ({
  appInsights: {
    trackEvent: jest.fn(),
    trackException: jest.fn(),
  },
  reactPlugin: {},
  TelemetryEvents: {},
  TelemetryExceptions: {},
}));

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  withAITracking: jest.fn((plugin, component) => component),
  useTrackMetric: () => jest.fn(),
}));

jest.mock("../../dal/boardDataService", () => ({
  __esModule: true,
  default: {
    checkIfBoardNameIsTaken: jest.fn().mockResolvedValue(false),
    getSetting: jest.fn().mockResolvedValue(null),
    saveSetting: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("FeedbackBoardMetadataForm checkbox fallback", () => {
  it("toggles board settings when checked param is undefined", async () => {
    const user = userEvent.setup();

    render(
      <FeedbackBoardMetadataForm
        isNewBoardCreation={true}
        isDuplicatingBoard={false}
        currentBoard={null}
        teamId="team-1"
        placeholderText=""
        maxVotesPerUser={5}
        availablePermissionOptions={[]}
        currentUserId="user-1"
        onFormSubmit={jest.fn()}
        onFormCancel={jest.fn()}
      />,
    );

    const obscureCheckbox = screen.getByRole("checkbox", { name: /only show feedback after collect phase/i });
    expect(obscureCheckbox).not.toBeChecked();

    await user.click(obscureCheckbox);
    expect(obscureCheckbox).toBeChecked();
  });
});

describe("FeedbackBoardMetadataFormPermissions checkbox fallback", () => {
  it("adds a permission when checked param is undefined", async () => {
    const user = userEvent.setup();
    const onPermissionChanged = jest.fn();

    render(
      <FeedbackBoardMetadataFormPermissions
        board={null}
        permissions={{ Teams: [], Members: [] }}
        permissionOptions={[
          { id: "team-1", name: "Team One", uniqueName: "Team One", type: "team" },
        ]}
        currentUserId="user-1"
        isNewBoardCreation={true}
        onPermissionChanged={onPermissionChanged}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /add permission to every team or member in the table$/i });
    await user.click(checkbox);

    await waitFor(() => {
      expect(onPermissionChanged).toHaveBeenCalledWith({
        permissions: {
          Teams: ["team-1"],
          Members: [],
        },
      });
    });
  });
});
