import React from "react";

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
          iconClass: "play-circle",
          id: "uuid-1",
          title: "Start",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "stop-circle",
          id: "uuid-2",
          title: "Stop",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "adjust",
          id: "uuid-3",
          title: "Continue",
          notes: "",
        });
      });
    });

    describe("good-improve-ideas-thanks template", () => {
      it("should return correct columns for good-improve-ideas-thanks template", () => {
        const result = getColumnsByTemplateId("good-improve-ideas-thanks");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "happy-face",
          id: "uuid-1",
          title: "Good",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "Improve",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "help",
          id: "uuid-3",
          title: "Ideas",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#0078d4",
          iconClass: "exclamation",
          id: "uuid-4",
          title: "Thanks",
          notes: "",
        });
      });
    });

    describe("mad-sad-glad template", () => {
      it("should return correct columns for mad-sad-glad template", () => {
        const result = getColumnsByTemplateId("mad-sad-glad");

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({
          accentColor: "#cc293d",
          iconClass: "angry-face",
          id: "uuid-1",
          title: "Mad",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#f6af08",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "Sad",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#008000",
          iconClass: "happy-face",
          id: "uuid-3",
          title: "Glad",
          notes: "",
        });
      });
    });

    describe("4ls template", () => {
      it("should return correct columns for 4ls template (The 4 Ls)", () => {
        const result = getColumnsByTemplateId("4ls");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "thumb-up",
          id: "uuid-1",
          title: "Liked",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#0078d4",
          iconClass: "light-bulb",
          id: "uuid-2",
          title: "Learned",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "thumb-down",
          id: "uuid-3",
          title: "Lacked",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "star",
          id: "uuid-4",
          title: "Longed for",
          notes: "",
        });
      });
    });

    describe("daki template", () => {
      it("should return correct columns for daki template (Drop, Add, Keep, Improve)", () => {
        const result = getColumnsByTemplateId("daki");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#cc293d",
          iconClass: "delete",
          id: "uuid-1",
          title: "Drop",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#008000",
          iconClass: "add",
          id: "uuid-2",
          title: "Add",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#0078d4",
          iconClass: "lock",
          id: "uuid-3",
          title: "Keep",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "construction",
          id: "uuid-4",
          title: "Improve",
          notes: "",
        });
      });
    });

    describe("kalm template", () => {
      it("should return correct columns for kalm template (Keep, Add, Less, More)", () => {
        const result = getColumnsByTemplateId("kalm");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: "uuid-1",
          title: "Keep",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#008000",
          iconClass: "add-circle",
          id: "uuid-2",
          title: "Add",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#f6af08",
          iconClass: "arrow-circle-down",
          id: "uuid-3",
          title: "Less",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#8063bf",
          iconClass: "arrow-circle-up",
          id: "uuid-4",
          title: "More",
          notes: "",
        });
      });
    });

    describe("wlai template", () => {
      it("should return correct columns for wlai template (Went Well, Learned, Accelerators, Impediments)", () => {
        const result = getColumnsByTemplateId("wlai");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "star",
          id: "uuid-1",
          title: "Went Well",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#8063bf",
          iconClass: "menu-book",
          id: "uuid-2",
          title: "Learned",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#0078d4",
          iconClass: "rocket-launch",
          id: "uuid-3",
          title: "Accelerators",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#cc293d",
          iconClass: "exclamation",
          id: "uuid-4",
          title: "Impediments",
          notes: "",
        });
      });
    });

    describe("1to1 template", () => {
      it("should return correct columns for 1to1 template (1-to-1 feedback)", () => {
        const result = getColumnsByTemplateId("1to1");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "thumb-up",
          id: "uuid-1",
          title: "Good",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#f6af08",
          iconClass: "thumb-up-down",
          id: "uuid-2",
          title: "So-so",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "thumb-down",
          id: "uuid-3",
          title: "Not-so-good",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#8063bf",
          iconClass: "check-circle",
          id: "uuid-4",
          title: "Done",
          notes: "",
        });
      });
    });

    describe("speedboat template", () => {
      it("should return correct columns for speedboat template (Propellors, Lifesavers, Anchors, Rocks)", () => {
        const result = getColumnsByTemplateId("speedboat");

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "rocket-launch",
          id: "uuid-1",
          title: "Propellors",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#0078d4",
          iconClass: "support",
          id: "uuid-2",
          title: "Lifesavers",
          notes: "",
        });
        expect(result[2]).toEqual({
          accentColor: "#cc293d",
          iconClass: "anchor",
          id: "uuid-3",
          title: "Anchors",
          notes: "",
        });
        expect(result[3]).toEqual({
          accentColor: "#f6af08",
          iconClass: "thumb-down",
          id: "uuid-4",
          title: "Rocks",
          notes: "",
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
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What provides clarity?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What obstructs clarity?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
          });
        });
      });

      describe("energy template", () => {
        it("should return correct columns for energy template", () => {
          const result = getColumnsByTemplateId("energy");

          expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
              accentColor: "#008000",
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What boosts energy?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What drains energy?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
          });
        });
      });

      describe("psy-safety template", () => {
        it("should return correct columns for psy-safety template", () => {
          const result = getColumnsByTemplateId("psy-safety");

          expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
              accentColor: "#008000",
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What fosters psychological safety?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What undermines pyschological safety?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
          });
        });
      });

      describe("wlb template", () => {
        it("should return correct columns for wlb template (work-life balance)", () => {
          const result = getColumnsByTemplateId("wlb");

          expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
              accentColor: "#008000",
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What helps work-life balance?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What hinders work-life balance?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
          });
        });
      });

      describe("confidence template", () => {
        it("should return correct columns for confidence template", () => {
          const result = getColumnsByTemplateId("confidence");

          expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
              accentColor: "#008000",
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What enhances confidence in team?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What reduces confidence in team?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
          });
        });
      });

      describe("efficiency template", () => {
        it("should return correct columns for efficiency template", () => {
          const result = getColumnsByTemplateId("efficiency");

          expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
              accentColor: "#008000",
              iconClass: "happy-face",
              id: "uuid-1",
              title: "What increases efficiency?",
              notes: "",
            });
          expect(result[1]).toEqual({
            accentColor: "#cc293d",
            iconClass: "sad-face",
            id: "uuid-2",
            title: "What decreases efficiency?",
            notes: "",
          });
          expect(result[2]).toEqual({
            accentColor: "#0078d4",
            iconClass: "check-circle",
            id: "uuid-3",
            title: "One action to try next.",
            notes: "",
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
          iconClass: "happy-face",
          id: "uuid-1",
          title: "What went well?",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "What didn't go well?",
          notes: "",
        });
      });

      it("should return default columns for empty string template ID", () => {
        const result = getColumnsByTemplateId("");

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "happy-face",
          id: "uuid-1",
          title: "What went well?",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "What didn't go well?",
          notes: "",
        });
      });

      it("should return default columns for null template ID", () => {
        const result = getColumnsByTemplateId(null as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "happy-face",
          id: "uuid-1",
          title: "What went well?",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "What didn't go well?",
          notes: "",
        });
      });

      it("should return default columns for undefined template ID", () => {
        const result = getColumnsByTemplateId(undefined as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          accentColor: "#008000",
          iconClass: "happy-face",
          id: "uuid-1",
          title: "What went well?",
          notes: "",
        });
        expect(result[1]).toEqual({
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: "uuid-2",
          title: "What didn't go well?",
          notes: "",
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

    describe("icon validation", () => {
      it("should provide a valid React icon element", () => {
        const allTemplates = ["start-stop-continue", "good-improve-ideas-thanks", "mad-sad-glad", "4ls", "daki", "kalm", "wlai", "1to1", "speedboat"];

        allTemplates.forEach(templateId => {
          const result = getColumnsByTemplateId(templateId);
          result.forEach(column => {
            expect(typeof column.iconClass).toBe("string");
          });
        });
      });
    });
  });
});
