import { formatDate, formatNumber, getCurrentLocale, initializeLocale, setLocale, t } from "../localization";

describe("localization", () => {
  const originalDocumentLang = document.documentElement.lang;
  const originalNavigatorLanguages = navigator.languages;
  const originalNavigatorLanguage = navigator.language;

  const setNavigatorLocale = (languages?: readonly string[], language: string = "") => {
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: languages,
    });

    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: language,
    });
  };

  afterEach(() => {
    document.documentElement.lang = originalDocumentLang;
    setNavigatorLocale(originalNavigatorLanguages, originalNavigatorLanguage);
    setLocale("en-US");
  });

  it("uses English by default", () => {
    initializeLocale("en-US");

    expect(t("common_cancel")).toBe("Cancel");
  });

  it("switches to Spanish when a supported locale is provided", () => {
    initializeLocale("es-ES");

    expect(t("common_cancel")).toBe("Cancelar");
  });

  it("falls back to English strings for unsupported locales", () => {
    initializeLocale("fr-FR");

    expect(t("common_cancel")).toBe("Cancel");
  });

  it("prefers the document locale when initializeLocale is called without an argument", () => {
    document.documentElement.lang = "es-MX";
    setNavigatorLocale(["fr-FR"], "fr-FR");

    expect(initializeLocale()).toBe("es-MX");
    expect(getCurrentLocale()).toBe("es-MX");
    expect(t("common_cancel")).toBe("Cancelar");
  });

  it("falls back to the browser locale when the document locale is empty", () => {
    document.documentElement.lang = "";
    setNavigatorLocale(["es-AR"], "fr-FR");

    expect(initializeLocale()).toBe("es-AR");
    expect(getCurrentLocale()).toBe("es-AR");
    expect(t("common_cancel")).toBe("Cancelar");
  });

  it("falls back to the default locale when neither document nor browser locale is set", () => {
    document.documentElement.lang = "";
    setNavigatorLocale(undefined, "");

    expect(initializeLocale()).toBe("en-US");
    expect(getCurrentLocale()).toBe("en-US");
  });

  it("preserves placeholders when interpolation values are missing", () => {
    initializeLocale("en-US");

    expect(t("feedback_board_create_example", { other: "value" })).toBe("Example: Retrospective {{date}}");
  });

  it("replaces placeholders when interpolation values are provided", () => {
    initializeLocale("en-US");

    expect(t("feedback_board_create_example", { date: "Mar 15, 2024" })).toBe("Example: Retrospective Mar 15, 2024");
  });

  it("trims the locale and updates document language when set explicitly", () => {
    expect(setLocale("  en-GB  ")).toBe("en-GB");
    expect(getCurrentLocale()).toBe("en-GB");
    expect(document.documentElement.lang).toBe("en-GB");
  });

  it("formats dates and numbers using the active locale", () => {
    initializeLocale("en-US");

    expect(formatDate(new Date("2024-03-15T00:00:00Z"), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })).toBe("Mar 15, 2024");
    expect(formatNumber(1234.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe("1,234.5");
  });
});
