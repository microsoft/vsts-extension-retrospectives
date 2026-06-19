import { questions, getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionIconClassName, normalizeTeamAssessmentQuestions } from "../effectivenessMeasurementQuestionHelper";

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
    const expectedClass = "fa-solid fa-magnifying-glass";

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
  it("uses the default questions when no team assessment questions are provided", () => {
    const result = normalizeTeamAssessmentQuestions();

    expect(result).toEqual(questions);
  });

  it("uses the current built-in icon for stored Efficiency questions", () => {
    const result = normalizeTeamAssessmentQuestions([
      {
        ...questions[5],
        iconClassName: "fa-solid fa-gears",
      },
    ]);

    expect(result[0].iconClassName).toBe("gears");
  });

  it("preserves non-custom questions that do not match a built-in question", () => {
    const unknownQuestion = {
      id: 999,
      shortTitle: "Unknown",
      title: "Unknown question",
      iconClassName: "unknown-icon",
      tooltip: "",
    };

    const result = normalizeTeamAssessmentQuestions([unknownQuestion]);

    expect(result[0]).toBe(unknownQuestion);
  });

  it("preserves custom question icons", () => {
    const result = normalizeTeamAssessmentQuestions([
      {
        id: 7,
        shortTitle: "Custom",
        title: "Custom question",
        iconClassName: "assessment",
        tooltip: "",
        isCustom: true,
      },
    ]);

    expect(result[0].iconClassName).toBe("assessment");
  });
});
