import { IFeedbackColumn } from "../interfaces/feedback";
import { generateUUID } from "./random";

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  const NEXT_ACTION = "One action to try next.";

  switch (templateId) {
    case "start-stop-continue":
      return [
        {
          accentColor: "#008000", //green
          iconClass: "play-circle",
          id: generateUUID(),
          title: "Start",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "stop-circle",
          id: generateUUID(),
          title: "Stop",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "adjust",
          id: generateUUID(),
          title: "Continue",
          notes: "",
        },
      ];
    case "good-improve-ideas-thanks":
      return [
        {
          accentColor: "#008000", //green
          iconClass: "happy-face",
          id: generateUUID(),
          title: "Good",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "sad-face",
          id: generateUUID(),
          title: "Improve",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "help",
          id: generateUUID(),
          title: "Ideas",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          iconClass: "exclamation",
          id: generateUUID(),
          title: "Thanks",
          notes: "",
        },
      ];
    case "mad-sad-glad":
      return [
        {
          accentColor: "#cc293d", //red
          iconClass: "angry-face",
          id: generateUUID(),
          title: "Mad",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "sad-face",
          id: generateUUID(),
          title: "Sad",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          iconClass: "happy-face",
          id: generateUUID(),
          title: "Glad",
          notes: "",
        },
      ];
    case "4ls": // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: "#008000", //green
          iconClass: "thumb-up",
          id: generateUUID(),
          title: "Liked",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          iconClass: "light-bulb",
          id: generateUUID(),
          title: "Learned",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "thumb-down",
          id: generateUUID(),
          title: "Lacked",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "star",
          id: generateUUID(),
          title: "Longed for",
          notes: "",
        },
      ];
    case "daki": // Drop, Add, Keep, Improve
      return [
        {
          accentColor: "#cc293d", //red
          iconClass: "delete",
          id: generateUUID(),
          title: "Drop",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          iconClass: "add",
          id: generateUUID(),
          title: "Add",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          iconClass: "lock",
          id: generateUUID(),
          title: "Keep",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "construction",
          id: generateUUID(),
          title: "Improve",
          notes: "",
        },
      ];
    case "kalm": // Keep, Add, Less, More
      return [
        {
          accentColor: "#0078d4", //blue
          iconClass: "check-circle",
          id: generateUUID(),
          title: "Keep",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          iconClass: "add-circle",
          id: generateUUID(),
          title: "Add",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "arrow-circle-down",
          id: generateUUID(),
          title: "Less",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          iconClass: "arrow-circle-up",
          id: generateUUID(),
          title: "More",
          notes: "",
        },
      ];
    case "wlai": // Went Well, Learned, Accelerators, Impediments
      return [
        {
          accentColor: "#008000", //green
          iconClass: "star",
          id: generateUUID(),
          title: "Went Well",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          iconClass: "menu-book",
          id: generateUUID(),
          title: "Learned",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          iconClass: "rocket-launch",
          id: generateUUID(),
          title: "Accelerators",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "exclamation",
          id: generateUUID(),
          title: "Impediments",
          notes: "",
        },
      ];
    case "1to1": // 1-to-1 - Good, So-so, Not-so-good, Done
      return [
        {
          accentColor: "#008000", //green
          iconClass: "thumb-up",
          id: generateUUID(),
          title: "Good",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "thumb-up-down",
          id: generateUUID(),
          title: "So-so",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "thumb-down",
          id: generateUUID(),
          title: "Not-so-good",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          iconClass: "check-circle",
          id: generateUUID(),
          title: "Done",
          notes: "",
        },
      ];
    case "speedboat": // Speedboat retrospective - Propellors, Life Preserver, Anchors, Rocks
      return [
        {
          accentColor: "#008000", //green
          iconClass: "rocket-launch",
          id: generateUUID(),
          title: "Propellors",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          iconClass: "support",
          id: generateUUID(),
          title: "Lifesavers",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          iconClass: "anchor",
          id: generateUUID(),
          title: "Anchors",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          iconClass: "thumb-down",
          id: generateUUID(),
          title: "Rocks",
          notes: "",
        },
      ];
    // Team Assessment Templates
    case "clarity":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What provides clarity?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What obstructs clarity?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "energy":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What boosts energy?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What drains energy?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "psy-safety":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What fosters psychological safety?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What undermines pyschological safety?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "wlb":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What helps work-life balance?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What hinders work-life balance?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "confidence":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What enhances confidence in team?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What reduces confidence in team?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "efficiency":
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What increases efficiency?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What decreases efficiency?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          iconClass: "check-circle",
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    default: {
      return [
        {
          accentColor: "#008000",
          iconClass: "happy-face",
          id: generateUUID(),
          title: "What went well?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          iconClass: "sad-face",
          id: generateUUID(),
          title: "What didn't go well?",
          notes: "",
        },
      ];
    }
  }
};
