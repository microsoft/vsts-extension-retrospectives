export const questions = [
  {
    id: 1,
    shortTitle: "Clarity",
    discussActTemplate: "clarity",
    title: "I clearly understand what is expected of me on this team",
    fontAwesomeClass: "fa-solid fa-magnifying-glass",
    tooltip: "Only about 50% employees strongly indicate they know what is expected of them at work according to <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.gallup.com/workplace/236567/obsolete-annual-reviews-gallup-advice.aspx\">Gallup</a>. Furthermore, clarity of expectations is statistically linked to many important organizational outcomes. Getting expectations right relates to better customer perceptions of service quality, productivity, retention of employees and safety. Substantial gains in clarity of expectations connect to productivity gains of 5% to 10%, and link to 10% to 20% fewer safety incidents, for example.",
  },
  {
    id: 2,
    shortTitle: "Energy",
    discussActTemplate: "energy",
    title: "I am energized by the work I do",
    fontAwesomeClass: "fa-solid fa-bolt",
    tooltip: "Only 2 out of 10 employees strongly indicate that they use their strengths every day at work according to <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.marcusbuckingham.com/business-case-for-strengths/\">Marcus Buckingham</a>, yet those who do have 38% higher productivity, 44% higher customer satisfaction scores, and 50% higher retention. Using your strengths at work results in being excited to work and is one of the strongest predictors of whether you are on a high performing team. Furthermore, <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.marcusbuckingham.com/spend-a-week/\">Marcus Buckingham</a> argues that if we spend less than 20% of our time at work doing what we love we are much more likely to burnout. An inspired (excited) employee is 2.25 times more productive than a merely satisfied employee according to research by the <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.bain.com/insights/summary-of-time-talent-and-energy/#:~:text=Energy%20is%20an%20intangible%20but%20powerful%20force%20that,inspiration%2C%20and%20a%20strong%20company%20culture.%20SUMMARY%20INTRODUCTION?msclkid=e1685e51c7ee11ec88caa816909a51ff\">Bain Company</a> summarized in the book 'Time, Talent, Energy'.",
  },
  {
    id: 3,
    shortTitle: "Psychological Safety",
    discussActTemplate: "psy-safety",
    title: "I feel safe and do not fear making mistakes, raising tough issues, taking risks, or asking for help",
    fontAwesomeClass: "fa-regular fa-handshake",
    tooltip: "Psychological safety is the #1 predictor of team success according to a <a target=\"_blank\" rel=\"noreferrer\" href=\"https://rework.withgoogle.com/\">study done by Google</a> as well as numerous studies including those outlined in the book <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.amazon.com/Fearless-Organization-Psychological-Workplace-Innovation/dp/1119477247\">The Fearless Organization by Amy Edmonson</a>. Furthermore, data shows that psychological safety results in a 12% increase in productivity, a 27% reduction in turnover, and a 40% reduction in mistakes according to <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.gallup.com/workplace/236198/create-culture-psychological-safety.aspx\">Gallup</a>.",
  },
  {
    id: 4,
    shortTitle: "Work-life Balance",
    discussActTemplate: "wlb",
    title: "My typical workload allows me to achieve an acceptable level of work-life balance",
    fontAwesomeClass: "fa-solid fa-scale-balanced",
    tooltip: "Self-assessed productivity in 2021 was the same or higher than in previous years for many employees (82%), but at a human cost. One in five global survey respondents say their employer doesn't care about their work-life balance. 54% of workers feel overworked and 39% feel exhausted according to the <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.microsoft.com/en-us/worklab/work-trend-index/hybrid-work\">2021 Work Trend Index from Microsoft</a>.",
  },
  {
    id: 5,
    shortTitle: "Confidence",
    discussActTemplate: "team-confidence",
    title: "I'm confident our team will be successful",
    fontAwesomeClass: "fa-solid fa-square-poll-vertical",
    tooltip: "<a target=\"_blank\" rel=\"noreferrer\" href=\"https://content.apa.org/record/2009-06703-020\">Research</a> shows the strongest predictor of team efficacy is the collective confidence of the team to be successful.",
  },
  {
    id: 6,
    shortTitle: "Efficiency",
    discussActTemplate: "team-efficiency",
    title: "Tools, resources, processes, and procedures allow me to effectively meet my customers' needs",
    fontAwesomeClass: "fa-solid fa-gears",
    tooltip: "Case studies, such as those in <a target=\"_blank\" rel=\"noreferrer\" href=\"https://www.amazon.com/Accelerate-Software-Performing-Technology-Organizations/dp/1942788339/\">Accelerate</a> by Forsgren, Humble, and Kim, show that organizations that optimize their processes and tools see improvements in customer responsiveness, lead time, and developer satisfaction.",
  }
];

/**
 * Helpers for Effectiveness Measurement Questions.
 */

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
}

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
}

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
}

/**
 * @param questionId Id of the question
 *
 * @returns associated fontaswesome icon of the question
 */
export const getQuestionFontAwesomeClass = (questionId: number): string => {
  const question = questions.find(q => q.id === questionId);
  if (question) {
    return question.fontAwesomeClass;
  }
  return "";
}
