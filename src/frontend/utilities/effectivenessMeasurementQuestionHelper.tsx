import { ITeamAssessmentQuestion } from "../interfaces/feedback";

export const questions: ITeamAssessmentQuestion[] = [
  {
    id: 1,
    shortTitle: "Clarity",
    discussActTemplate: "clarity",
    title: "I clearly understand what is expected of me in my role on this team.",
    iconClassName: "fa-solid fa-magnifying-glass",
    tooltip: "Clear expectations improve focus, performance, and accountability. This helps reveal whether roles, goals, and priorities are well understood. Without clarity, teams experience confusion, rework, and missed expectations. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#clarity (Learn more) about the supporting research and best practices.",
  },
  {
    id: 2,
    shortTitle: "Energy",
    discussActTemplate: "energy",
    title: "My day-to-day work keeps me engaged, motivated, and energized.",
    iconClassName: "fa-solid fa-bolt",
    tooltip: "People do their best work when the work energizes them. This helps reveal alignment with strengths, motivation, and engagement. Low energy often signals burnout, disengagement, or poor fit. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#energy (Learn more) about the supporting research and best practices.",
  },
  {
    id: 3,
    shortTitle: "Psych Safety",
    discussActTemplate: "psy-safety",
    title: "I feel safe speaking up, raising issues, taking risks, and asking for help.",
    iconClassName: "fa-regular fa-handshake",
    tooltip: "Teams perform better when people feel safe speaking up and taking risks. This helps surface issues early and supports learning and collaboration. Without safety, problems stay hidden and improvement slows. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#psychological-safety (Learn more) about the supporting research and best practices.",
  },
  {
    id: 4,
    shortTitle: "Work-Life",
    discussActTemplate: "wlb",
    title: "My workload is sustainable and supports a healthy work-life balance.",
    iconClassName: "fa-solid fa-scale-balanced",
    tooltip: "Sustainable workload supports consistent performance and well-being. This helps maintain quality, morale, and long-term productivity. Without balance, burnout increases and results begin to decline. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#work-life-balance (Learn more) about the supporting research and best practices.",
  },
  {
    id: 5,
    shortTitle: "Confidence",
    discussActTemplate: "confidence",
    title: "I am confident our team will be successful and achieve our goals.",
    iconClassName: "fa-solid fa-square-poll-vertical",
    tooltip: "Shared confidence reflects belief in the team's ability to succeed. This helps signal alignment, momentum, and commitment to outcomes. Low confidence often leads to hesitation and weaker execution. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#confidence (Learn more) about the supporting research and best practices.",
  },
  {
    id: 6,
    shortTitle: "Efficiency",
    discussActTemplate: "efficiency",
    title: "Our processes and tools help me work efficiently and effectively.",
    iconClassName: "fa-solid fa-gears",
    tooltip: "Effective tools and processes reduce friction and improve delivery. This helps teams respond faster and meet customer needs more consistently. Without efficiency, delays, frustration, and rework increase. https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md#efficiency (Learn more) about the supporting research and best practices.",
  },
];

/**
 * @param questionId Id of the question
 *
 * @returns name of the question
 */
export const getQuestionName = (questionId: number): string => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    return question.title;
  }
  return "";
};

/**
 * @param questionId Id of the question
 *
 * @returns short name of the question
 */
export const getQuestionShortName = (questionId: number): string => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    return question.shortTitle;
  }
  return "";
};

/**
 * @param questionId Id of the question
 *
 * @returns tooltip of the question
 */
export const getQuestionTooltip = (questionId: number): string => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    return question.tooltip;
  }
  return "";
};

/**
 * @param questionId Id of the question
 *
 * @returns associated fontaswesome icon of the question
 */
export const getQuestionIconClassName = (questionId: number): string => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    return question.iconClassName;
  }
  return "";
};
