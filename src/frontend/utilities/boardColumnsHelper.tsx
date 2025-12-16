import React from "react";
import { IFeedbackColumn } from "../interfaces/feedback";
import { generateUUID } from "./random";
import { AddCircleIcon, AddIcon, AdjustIcon, AnchorIcon, AngryFaceIcon, ArrowCircleDownIcon, ArrowCircleUpIcon, CheckCircleIcon, ConstructionIcon, DeleteIcon, ExclamationIcon, HappyFaceIcon, HelpIcon, LightBulbIcon, LockIcon, MenuBookIcon, PlayCircleIcon, RocketLaunchIcon, SadFaceIcon, StarIcon, StopCircleIcon, SupportIcon, ThumbDownIcon, ThumbUpDownIcon, ThumbUpIcon } from "../components/icons";

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  const NEXT_ACTION = "One action to try next.";

  switch (templateId) {
    case "start-stop-continue":
      return [
        {
          accentColor: "#008000", //green
          icon: <PlayCircleIcon />,
          id: generateUUID(),
          title: "Start",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <StopCircleIcon />,
          id: generateUUID(),
          title: "Stop",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <AdjustIcon />,
          id: generateUUID(),
          title: "Continue",
          notes: "",
        },
      ];
    case "good-improve-ideas-thanks":
      return [
        {
          accentColor: "#008000", //green
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "Good",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "Improve",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <HelpIcon />,
          id: generateUUID(),
          title: "Ideas",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          icon: <ExclamationIcon />,
          id: generateUUID(),
          title: "Thanks",
          notes: "",
        },
      ];
    case "mad-sad-glad":
      return [
        {
          accentColor: "#cc293d", //red
          icon: <AngryFaceIcon />,
          id: generateUUID(),
          title: "Mad",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "Sad",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "Glad",
          notes: "",
        },
      ];
    case "4ls": // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: "#008000", //green
          icon: <ThumbUpIcon />,
          id: generateUUID(),
          title: "Liked",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          icon: <LightBulbIcon />,
          id: generateUUID(),
          title: "Learned",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <ThumbDownIcon />,
          id: generateUUID(),
          title: "Lacked",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <StarIcon />,
          id: generateUUID(),
          title: "Longed for",
          notes: "",
        },
      ];
    case "daki": // Drop, Add, Keep, Improve
      return [
        {
          accentColor: "#cc293d", //red
          icon: <DeleteIcon />,
          id: generateUUID(),
          title: "Drop",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          icon: <AddIcon />,
          id: generateUUID(),
          title: "Add",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          icon: <LockIcon />,
          id: generateUUID(),
          title: "Keep",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <ConstructionIcon />,
          id: generateUUID(),
          title: "Improve",
          notes: "",
        },
      ];
    case "kalm": // Keep, Add, Less, More
      return [
        {
          accentColor: "#0078d4", //blue
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: "Keep",
          notes: "",
        },
        {
          accentColor: "#008000", //green
          icon: <AddCircleIcon />,
          id: generateUUID(),
          title: "Add",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <ArrowCircleDownIcon />,
          id: generateUUID(),
          title: "Less",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          icon: <ArrowCircleUpIcon />,
          id: generateUUID(),
          title: "More",
          notes: "",
        },
      ];
    case "wlai": // Went Well, Learned, Accelerators, Impediments
      return [
        {
          accentColor: "#008000", //green
          icon: <StarIcon />,
          id: generateUUID(),
          title: "Went Well",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          icon: <MenuBookIcon />,
          id: generateUUID(),
          title: "Learned",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          icon: <RocketLaunchIcon />,
          id: generateUUID(),
          title: "Accelerators",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <ExclamationIcon />,
          id: generateUUID(),
          title: "Impediments",
          notes: "",
        },
      ];
    case "1to1": // 1-to-1 - Good, So-so, Not-so-good, Done
      return [
        {
          accentColor: "#008000", //green
          icon: <ThumbUpIcon />,
          id: generateUUID(),
          title: "Good",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <ThumbUpDownIcon />,
          id: generateUUID(),
          title: "So-so",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <ThumbDownIcon />,
          id: generateUUID(),
          title: "Not-so-good",
          notes: "",
        },
        {
          accentColor: "#8063bf", //purple
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: "Done",
          notes: "",
        },
      ];
    case "speedboat": // Speedboat retrospective - Propellors, Life Preserver, Anchors, Rocks
      return [
        {
          accentColor: "#008000", //green
          icon: <RocketLaunchIcon />,
          id: generateUUID(),
          title: "Propellors",
          notes: "",
        },
        {
          accentColor: "#0078d4", //blue
          icon: <SupportIcon />,
          id: generateUUID(),
          title: "Lifesavers",
          notes: "",
        },
        {
          accentColor: "#cc293d", //red
          icon: <AnchorIcon />,
          id: generateUUID(),
          title: "Anchors",
          notes: "",
        },
        {
          accentColor: "#f6af08", //yellow
          icon: <ThumbDownIcon />,
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
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What provides clarity?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What obstructs clarity?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "energy":
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What boosts energy?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What drains energy?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "psy-safety":
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What fosters psychological safety?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What undermines pyschological safety?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "wlb":
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What helps work-life balance?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What hinders work-life balance?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "confidence":
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What enhances confidence in team?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What reduces confidence in team?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    case "efficiency":
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What increases efficiency?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What decreases efficiency?",
          notes: "",
        },
        {
          accentColor: "#0078d4",
          icon: <CheckCircleIcon />,
          id: generateUUID(),
          title: NEXT_ACTION,
          notes: "",
        },
      ];
    default: {
      return [
        {
          accentColor: "#008000",
          icon: <HappyFaceIcon />,
          id: generateUUID(),
          title: "What went well?",
          notes: "",
        },
        {
          accentColor: "#cc293d",
          icon: <SadFaceIcon />,
          id: generateUUID(),
          title: "What didn't go well?",
          notes: "",
        },
      ];
    }
  }
};
