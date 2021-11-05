/// <reference types="vss-web-extension-sdk" />

/**
 * Helpers for Effectiveness Measurement Questions.
 *
 * @param questionId Id of the question
 *
 * @returns name of the question
 */
 export const getQuestionName = (questionId: string): string => {
  switch (questionId) {
    case "1":
      return "I clearly understand what is expected of me on this team";
    case "2":
      return "I have felt excited to work everyday this past sprint";
    case "3":
      return "I feel safe and do not fear making mistakes, raising tough issues, taking risks, or asking for help";
    case "4":
      return "My typical workload allows me to achieve an acceptable level of work-life balance";
    default:
      return "";
  }
}

/**
 * Helpers for Effectiveness Measurement Questions.
 *
 * @param questionId Id of the question
 *
 * @returns tooltip of the question
 */
 export const getQuestionTooltip = (questionId: string): string => {
  switch (questionId) {
    case "1":
      return "Only about 50% employees strongly indicate they know what is expected of them at work according to Gallup. Furthermore,  clarity of expectations is statistically linked to many important organizational outcomes. Getting expectations right relates to better customer perceptions of service quality, productivity, retention of employees and safety. Substantial gains in clarity of expectations connect to productivity gains of 5% to 10%, and link to 10% to 20% fewer safety incidents, for example.​";
    case "2":
      return "Only 2 out of 10 employees strongly indicate that they use their strengths every day at work according to Marcus Buckingham, yet those who do have 38% higher productivity, 44% higher customer satisfaction scores, and 50% higher retention. Using your strengths every day at work. Using your strengths at work results in being excited to work and is one of the strongest predictors of whether you are on a high performing team. Furthermore, Marcus Buckingham argues that if we spend less than 20% of our time at work doing what we love we are much more likely to burnout.​";
    case "3":
      return "Psychological safety is the #1 predictor of team success according to a study done by Google as well as numerous studies including those outlined in the book The Fearless Organization by Amy Edmonson. Furthermore, data shows that psychological safety results in a 12% increase in productivity, a 27% reduction in turnover, and a 40% reduction in mistakes according to Gallup.​";
    case "4":
      return "Self-assessed productivity in 2021 was the same or higher than in previous years for many employees (82%), but at a human cost. One in five global survey respondents say their employer doesn’t care about their work-life balance. 54% of workers feel overworked and 39% feel exhausted according to the 2021 Work Trend Index from Microsoft.";
    default:
      return "";
  }
}
