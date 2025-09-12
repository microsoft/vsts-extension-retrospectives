import { getColumnsByTemplateId } from "../boardColumnsHelper";
import { IFeedbackColumn } from "../../interfaces/feedback";
import * as randomModule from "../random";

// Mock the generateUUID function
jest.mock("../random", () => ({
  generateUUID: jest.fn(),
}));

const mockGenerateUUID = randomModule.generateUUID as jest.MockedFunction<typeof randomModule.generateUUID>;

describe("boardColumnsHelper", () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockGenerateUUID.mockClear();
    // Return predictable UUIDs for testing
    mockGenerateUUID.mockReturnValueOnce("uuid-1").mockReturnValueOnce("uuid-2").mockReturnValueOnce("uuid-3").mockReturnValueOnce("uuid-4").mockReturnValueOnce("uuid-5");
  });

  describe("getColumnsByTemplateId", () => {
    describe("start-stop-continue template", () => {
      it("should return correct columns for start-stop-continue template", () => {
        const result = getColumnsByTemplateId("start-stop-continue");

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-circle-play",
          id: "uuid-1",
          title: "Start",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-circle-stop",
          id: "uuid-2",
          title: "Stop",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "far fa-circle-dot",
          id: "uuid-3",
          title: "Continue",
        });
      });
    });

    describe("good-improve-ideas-thanks template", () => {
      it("should return correct columns for good-improve-ideas-thanks template", () => {
        const result = getColumnsByTemplateId("good-improve-ideas-thanks");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-1",
          title: "Good",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "Improve",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "far fa-question",
          id: "uuid-3",
          title: "Ideas",
        });
        expect(result[3]).toEqual({
          accentColor: "#0078d4",
          iconClass: "far fa-exclamation",
          id: "uuid-4",
          title: "Thanks",
        });
      });
    });

    describe("mad-sad-glad template", () => {
      it("should return correct columns for mad-sad-glad template", () => {
        const result = getColumnsByTemplateId("mad-sad-glad");

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-angry",
          id: "uuid-1",
          title: "Mad",
        });
        expect(result[1]).toEqual({
          accentColor: "#f6af08",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "Sad",
        });
        expect(result[2]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-3",
          title: "Glad",
        });
      });
    });

    describe("4ls template", () => {
      it("should return correct columns for 4ls template (The 4 Ls)", () => {
        const result = getColumnsByTemplateId("4ls");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-thumbs-up",
          id: "uuid-1",
          title: "Liked",
        });
        expect(result[1]).toEqual({
          accentColor: "#0078d4",
          iconClass: "far fa-lightbulb",
          id: "uuid-2",
          title: "Learned",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-thumbs-down",
          id: "uuid-3",
          title: "Lacked",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "far fa-star",
          id: "uuid-4",
          title: "Longed for",
        });
      });
    });

    describe("daki template", () => {
      it("should return correct columns for daki template (Drop, Add, Keep, Improve)", () => {
        const result = getColumnsByTemplateId("daki");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#cc293d",
          iconClass: "fas fa-trash",
          id: "uuid-1",
          title: "Drop",
        });
        expect(result[1]).toEqual({
          accentColor: "#008000",
          iconClass: "fas fa-cart-plus",
          id: "uuid-2",
          title: "Add",
        });
        expect(result[2]).toEqual({
          accentColor: "#0078d4",
          iconClass: "fas fa-lock",
          id: "uuid-3",
          title: "Keep",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "fas fa-wrench",
          id: "uuid-4",
          title: "Improve",
        });
      });
    });

    describe("kalm template", () => {
      it("should return correct columns for kalm template (Keep, Add, Less, More)", () => {
        const result = getColumnsByTemplateId("kalm");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#0078d4",
          iconClass: "far fa-square-check",
          id: "uuid-1",
          title: "Keep",
        });
        expect(result[1]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-square-plus",
          id: "uuid-2",
          title: "Add",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "far fa-circle-down",
          id: "uuid-3",
          title: "Less",
        });
        expect(result[3]).toEqual({
          accentColor: "#8063bf",
          iconClass: "far fa-circle-up",
          id: "uuid-4",
          title: "More",
        });
      });
    });

    describe("wlai template", () => {
      it("should return correct columns for wlai template (Went Well, Learned, Accelerators, Impediments)", () => {
        const result = getColumnsByTemplateId("wlai");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "fas fa-star",
          id: "uuid-1",
          title: "Went Well",
        });
        expect(result[1]).toEqual({
          accentColor: "#8063bf",
          iconClass: "fas fa-book",
          id: "uuid-2",
          title: "Learned",
        });
        expect(result[2]).toEqual({
          accentColor: "#0078d4",
          iconClass: "fas fa-rocket",
          id: "uuid-3",
          title: "Accelerators",
        });
        expect(result[3]).toEqual({
          accentColor: "#cc293d",
          iconClass: "fas fa-exclamation-triangle",
          id: "uuid-4",
          title: "Impediments",
        });
      });
    });

    describe("1to1 template", () => {
      it("should return correct columns for 1to1 template (1-to-1 feedback)", () => {
        const result = getColumnsByTemplateId("1to1");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "fas fa-scale-unbalanced",
          id: "uuid-1",
          title: "Good",
        });
        expect(result[1]).toEqual({
          accentColor: "#f6af08",
          iconClass: "fas fa-scale-balanced",
          id: "uuid-2",
          title: "So-so",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "fas fa-scale-unbalanced-flip",
          id: "uuid-3",
          title: "Not-so-good",
        });
        expect(result[3]).toEqual({
          accentColor: "#8063bf",
          iconClass: "fas fa-birthday-cake",
          id: "uuid-4",
          title: "Done",
        });
      });
    });

    describe("speedboat template", () => {
      it("should return correct columns for speedboat template (Propellors, Lifesavers, Anchors, Rocks)", () => {
        const result = getColumnsByTemplateId("speedboat");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "fas fa-fan",
          id: "uuid-1",
          title: "Propellors",
        });
        expect(result[1]).toEqual({
          accentColor: "#0078d4",
          iconClass: "fas fa-life-ring",
          id: "uuid-2",
          title: "Lifesavers",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "fas fa-anchor",
          id: "uuid-3",
          title: "Anchors",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "fas fa-skull-crossbones",
          id: "uuid-4",
          title: "Rocks",
        });
      });
    });

    describe("Team Assessment Templates", () => {
      describe("clarity template", () => {
        it("should return correct columns for clarity template", () => {
          const result = getColumnsByTemplateId("clarity");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What provides clarity?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What obstructs clarity?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });

      describe("energy template", () => {
        it("should return correct columns for energy template", () => {
          const result = getColumnsByTemplateId("energy");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What boosts energy?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What drains energy?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });

      describe("psy-safety template", () => {
        it("should return correct columns for psy-safety template", () => {
          const result = getColumnsByTemplateId("psy-safety");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What fosters psychological safety?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What undermines pyschological safety?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });

      describe("wlb template", () => {
        it("should return correct columns for wlb template (work-life balance)", () => {
          const result = getColumnsByTemplateId("wlb");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What helps work-life balance?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What hinders work-life balance?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });

      describe("confidence template", () => {
        it("should return correct columns for confidence template", () => {
          const result = getColumnsByTemplateId("confidence");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What enhances confidence in team?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What reduces confidence in team?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });

      describe("efficiency template", () => {
        it("should return correct columns for efficiency template", () => {
          const result = getColumnsByTemplateId("efficiency");

          expect(result).toHaveLength(3);
          expect(result[0]).toEqual({
            accentColor: "#008000",
            iconClass: "far fa-smile",
            id: "uuid-1",
            title: "What increases efficiency?",
          });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "far fa-frown",
            id: "uuid-2",
            title: "What decreases efficiency?",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "far fa-circle-check",
            id: "uuid-3",
            title: "One action to try next.",
          });
        });
      });
    });

    describe("default template", () => {
      it("should return default columns for unknown template ID", () => {
        const result = getColumnsByTemplateId("unknown-template");

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-1",
          title: "What went well?",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "What didn't go well?",
        });
      });

      it("should return default columns for empty string template ID", () => {
        const result = getColumnsByTemplateId("");

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-1",
          title: "What went well?",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "What didn't go well?",
        });
      });

      it("should return default columns for null template ID", () => {
        const result = getColumnsByTemplateId(null as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-1",
          title: "What went well?",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "What didn't go well?",
        });
      });

      it("should return default columns for undefined template ID", () => {
        const result = getColumnsByTemplateId(undefined as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "far fa-smile",
          id: "uuid-1",
          title: "What went well?",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "far fa-frown",
          id: "uuid-2",
          title: "What didn't go well?",
        });
      });
    });

    describe("column structure validation", () => {
      it("should ensure all columns have required IFeedbackColumn properties", () => {
        const templateIds = ["start-stop-continue", "good-improve-ideas-thanks", "mad-sad-glad", "4ls", "daki", "kalm", "wlai", "1to1", "speedboat", "clarity", "energy", "psy-safety", "wlb", "confidence", "efficiency", "unknown-template"];

        templateIds.forEach(templateId => {
          // Reset mock for each iteration
          mockGenerateUUID.mockClear();
          mockGenerateUUID.mockReturnValueOnce("uuid-1").mockReturnValueOnce("uuid-2").mockReturnValueOnce("uuid-3").mockReturnValueOnce("uuid-4").mockReturnValueOnce("uuid-5");

          const result = getColumnsByTemplateId(templateId);

          result.forEach((column: IFeedbackColumn) => {
            expect(column).toHaveProperty("id");
            expect(column).toHaveProperty("title");
            expect(column).toHaveProperty("iconClass");
            expect(column).toHaveProperty("accentColor");

            expect(typeof column.id).toBe("string");
            expect(typeof column.title).toBe("string");
            expect(typeof column.iconClass).toBe("string");
            expect(typeof column.accentColor).toBe("string");

            expect(column.id).not.toBe("");
            expect(column.title).not.toBe("");
            expect(column.iconClass).not.toBe("");
            expect(column.accentColor).not.toBe("");
          });
        });
      });

      it("should generate unique IDs for each column", () => {
        const result = getColumnsByTemplateId("start-stop-continue");
        const ids = result.map(column => column.id);

        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3); // All IDs should be unique
      });

      it("should use generateUUID for each column ID", () => {
        getColumnsByTemplateId("good-improve-ideas-thanks");

        expect(mockGenerateUUID).toHaveBeenCalledTimes(4); // Called once for each column
      });
    });

    describe("color consistency", () => {
      it("should use consistent color scheme across templates", () => {
        const commonColors = {
          green: "#008000",
          red: "#cc293d",
          yellow: "#f6af08",
          blue: "#0078d4",
          purple: "#8063bf",
        };

        const startStopContinue = getColumnsByTemplateId("start-stop-continue");
        expect(startStopContinue[0].accentColor).toBe(commonColors.green);
        expect(startStopContinue[1].accentColor).toBe(commonColors.red);
        expect(startStopContinue[2].accentColor).toBe(commonColors.yellow);

        const madSadGlad = getColumnsByTemplateId("mad-sad-glad");
        expect(madSadGlad[0].accentColor).toBe(commonColors.red);
        expect(madSadGlad[1].accentColor).toBe(commonColors.yellow);
        expect(madSadGlad[2].accentColor).toBe(commonColors.green);
      });
    });

    describe("icon class validation", () => {
      it("should use valid FontAwesome icon classes", () => {
        const allTemplates = ["start-stop-continue", "good-improve-ideas-thanks", "mad-sad-glad", "4ls", "daki", "kalm", "wlai", "1to1", "speedboat"];

        allTemplates.forEach(templateId => {
          const result = getColumnsByTemplateId(templateId);
          result.forEach(column => {
            expect(column.iconClass).toMatch(/^(far|fas|fa-solid|fa-regular)\s+fa-.+/);
          });
        });
      });
    });
  });
});
