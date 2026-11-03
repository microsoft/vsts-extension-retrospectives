import * as actionItemDisplay from "../actionItemDisplay";
import * as boardSummary from "../boardSummary";
import * as editableText from "../editableText";
import * as extensionSettingsMenu from "../extensionSettingsMenu";
import * as feedbackBoard from "../feedbackBoard";
import * as feedbackBoardMetadataForm from "../feedbackBoardMetadataForm";
import * as feedbackCarousel from "../feedbackCarousel";
import * as teamAssessmentHistoryChart from "../teamAssessmentHistoryChart";
import * as toastNotifications from "../toastNotifications";
import * as whatsNewDialog from "../whatsNewDialog";
import { FocusManager, focusManager } from "../../utilities/focusManager";

jest.mock("../../dal/azureDevOpsWorkService", () => ({
  workService: {},
}));

describe("public exports", () => {
  it("preserves named and default component exports", () => {
    expect(actionItemDisplay.ActionItemDisplay).toBe(actionItemDisplay.default);
    expect(boardSummary.BoardSummary).toBe(boardSummary.default);
    expect(editableText.EditableText).toBe(editableText.default);
    expect(extensionSettingsMenu.ExtensionSettingsMenu).toBe(extensionSettingsMenu.default);
    expect(feedbackBoard.FeedbackBoard).toBe(feedbackBoard.default);
    expect(feedbackBoardMetadataForm.FeedbackBoardMetadataForm).toBe(feedbackBoardMetadataForm.default);
    expect(feedbackCarousel.FeedbackCarousel).toBe(feedbackCarousel.default);
    expect(teamAssessmentHistoryChart.TeamAssessmentHistoryChart).toBe(teamAssessmentHistoryChart.default);
    expect(whatsNewDialog.WhatsNewDialog).toBe(whatsNewDialog.default);
  });

  it("preserves the toast API and singleton focus manager", () => {
    expect(toastNotifications.default).toBe(toastNotifications.toast);
    expect(focusManager).toBeInstanceOf(FocusManager);
  });

  it("exports the feedback version comparator", () => {
    expect(feedbackBoard.compareFeedbackItemVersions).toEqual(expect.any(Function));
  });
});
