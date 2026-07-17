import { questions, normalizeTeamAssessmentQuestions, getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionIconClassName } from "../effectivenessMeasurementQuestionHelper";

describe("effectivenessMeasurementQuestionHelper", () => {
  it("should have the correct number of questions", () => {
    expect(questions).toHaveLength(6);
  });

  it("should have the correct properties for each question", () => {
    questions.forEach(question => {
      expect(question).toHaveProperty("id");
      expect(question).toHaveProperty("shortTitle");
      expect(question).toHaveProperty("discussActTemplate");
      expect(question).toHaveProperty("title");
      expect(question).toHaveProperty("iconClassName");
      expect(question).toHaveProperty("tooltip");
    });
  });
});

describe("getQuestionName", () => {
  it("should return the question title if the question exists", () => {
    const questionId = 1;
    const expectedTitle = questions[0].title;

    const result = getQuestionName(questionId);

    expect(result).toBe(expectedTitle);
  });

  it("should return an empty string if the question does not exist", () => {
    const questionId = 10;
    const expectedTitle = "";

    const result = getQuestionName(questionId);

    expect(result).toBe(expectedTitle);
  });
});

describe("getQuestionShortName", () => {
  it("should return the short name of the question if it exists", () => {
    const questionId = 1;
    const expectedShortName = "Clarity";

    const result = getQuestionShortName(questionId);

    expect(result).toBe(expectedShortName);
  });

  it("should return an empty string if the question does not exist", () => {
    const questionId = 10;
    const expectedShortName = "";

    const result = getQuestionShortName(questionId);

    expect(result).toBe(expectedShortName);
  });
});

describe("getQuestionTooltip", () => {
  it("should return the tooltip for a valid question ID", () => {
    const questionId = 1;
    const expectedTooltip = questions[0].tooltip;

    const result = getQuestionTooltip(questionId);

    expect(result).toEqual(expectedTooltip);
  });

  it("should return emty string for an invalid question ID", () => {
    const questionId = 10;
    const expectedTooltip = "";

    const result = getQuestionTooltip(questionId);

    expect(result).toEqual(expectedTooltip);
  });
});

describe("getQuestionFontAwesomeClass", () => {
  it("should return the font awesome class for a valid question id", () => {
    const questionId = 1;
    const expectedClass = "search";

    const result = getQuestionIconClassName(questionId);

    expect(result).toBe(expectedClass);
  });

  it("should return an empty string for an invalid question id", () => {
    const questionId = 10;

    const result = getQuestionIconClassName(questionId);

    expect(result).toBe("");
  });
});

describe("normalizeTeamAssessmentQuestions", () => {
  it("returns default questions when board questions are missing", () => {
    expect(normalizeTeamAssessmentQuestions()).toEqual(questions);
  });

  it("returns default questions when board questions are empty", () => {
    expect(normalizeTeamAssessmentQuestions([])).toEqual(questions);
  });

  it("uses the current default icon for saved default questions", () => {
    const savedQuestion = { ...questions[5], iconClassName: "legacy-gear" };

    expect(normalizeTeamAssessmentQuestions([savedQuestion])).toEqual([{ ...savedQuestion, iconClassName: "gears" }]);
  });

  it("preserves custom questions", () => {
    const customQuestion = { ...questions[0], id: 99, isCustom: true, iconClassName: "custom-icon" };

    expect(normalizeTeamAssessmentQuestions([customQuestion])).toEqual([customQuestion]);
  });

  it("leaves unknown default questions unchanged", () => {
    const unknownQuestion = { ...questions[0], id: 99, iconClassName: "unknown-icon" };

    expect(normalizeTeamAssessmentQuestions([unknownQuestion])).toEqual([unknownQuestion]);
  });
});
