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
