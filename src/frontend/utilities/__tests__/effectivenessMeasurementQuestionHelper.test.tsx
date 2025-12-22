import { questions, getQuestionName, getQuestionShortName, getQuestionTooltip, getQuestionIconClassName } from "../effectivenessMeasurementQuestionHelper";

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
    const expectedTitle = "I clearly understand what is expected of me on this team";

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
    const expectedTooltip = 'Only about 50% employees strongly indicate they know what is expected of them at work according to https://www.gallup.com/workplace/236567/obsolete-annual-reviews-gallup-advice.aspx (Gallup). Furthermore, clarity of expectations is statistically linked to many important organizational outcomes. Getting expectations right relates to better customer perceptions of service quality, productivity, retention of employees and safety. Substantial gains in clarity of expectations connect to productivity gains of 5% to 10%, and link to 10% to 20% fewer safety incidents, for example.';

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
