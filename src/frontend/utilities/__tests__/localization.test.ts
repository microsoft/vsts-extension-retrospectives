/** @jest-environment jsdom */

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

  it("switches to German when a supported locale is provided", () => {
    initializeLocale("de-DE");

    expect(t("common_cancel")).toBe("Abbrechen");
  });

  it("switches to French when a supported locale is provided", () => {
    initializeLocale("fr-FR");

    expect(t("common_cancel")).toBe("Annuler");
  });

  it.each([
    ["en-US", "Focus Mode", "Focus Mode allows your team to focus on one feedback item at a time. Try it!"],
    ["es-ES", "Modo de enfoque", "El modo de enfoque permite que tu equipo se centre en un elemento de feedback a la vez. Pruebalo!"],
    ["de-DE", "Fokusmodus", "Im Fokusmodus kann sich Ihr Team jeweils auf einen Feedback-Eintrag konzentrieren. Probieren Sie ihn aus!"],
    ["fr-FR", "Mode Focus", "Le mode Focus permet a votre equipe de se concentrer sur un element de feedback a la fois. Essayez-le !"],
  ])("translates Focus Mode and its tooltip for %s", (locale, expectedLabel, expectedTooltip) => {
    initializeLocale(locale);

    expect(t("feedback_board_focus_mode")).toBe(expectedLabel);
    expect(t("feedback_board_focus_mode_tooltip")).toBe(expectedTooltip);
  });

  it.each([
    ["en-US", "Team Assessment"],
    ["es-ES", "Evaluacion del equipo"],
    ["de-DE", "Team-Bewertung"],
    ["fr-FR", "Evaluation d'equipe"],
  ])("translates Team Assessment for %s", (locale, expectedLabel) => {
    initializeLocale(locale);

    expect(t("feedback_board_team_assessment")).toBe(expectedLabel);
  });

  it("falls back to English strings for unsupported locales", () => {
    initializeLocale("it-IT");

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

    expect(t("feedback_board_create_example", { other: "value" })).toBe("Example: {{date}} Retrospective");
  });

  it("replaces placeholders when interpolation values are provided", () => {
    initializeLocale("en-US");

    expect(t("feedback_board_create_example", { date: "May 2026" })).toBe("Example: May 2026 Retrospective");
  });

  it("trims the locale and updates document language when set explicitly", () => {
    expect(setLocale("  en-GB  ")).toBe("en-GB");
    expect(getCurrentLocale()).toBe("en-GB");
    expect(document.documentElement.lang).toBe("en-GB");
  });

  it("normalizes underscore locale separators before formatting dates and numbers", () => {
    expect(setLocale("en_PK")).toBe("en-PK");
    expect(getCurrentLocale()).toBe("en-PK");
    expect(document.documentElement.lang).toBe("en-PK");
    expect(() => formatDate(new Date("2024-03-15T00:00:00Z"), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })).not.toThrow();
    expect(() => formatNumber(1234.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).not.toThrow();
  });

  it("falls back to the default locale when setLocale receives a blank value", () => {
    expect(setLocale("   ")).toBe("en-US");
    expect(getCurrentLocale()).toBe("en-US");
    expect(document.documentElement.lang).toBe("en-US");
  });

  it("falls back to the default locale when setLocale receives an invalid locale identifier", () => {
    expect(setLocale("constructor-GB")).toBe("en-US");
    expect(getCurrentLocale()).toBe("en-US");
    expect(document.documentElement.lang).toBe("en-US");
  });

  it("falls back to the default locale when canonical locales are empty", () => {
    const getCanonicalLocalesSpy = jest.spyOn(Intl, "getCanonicalLocales").mockReturnValueOnce([]);

    expect(setLocale("es-ES")).toBe("en-US");
    expect(getCurrentLocale()).toBe("en-US");
    expect(document.documentElement.lang).toBe("en-US");
    getCanonicalLocalesSpy.mockRestore();
  });

  it("falls back to English templates when the locale token matches an inherited object property", () => {
    initializeLocale("constructor-GB");

    expect(t("common_cancel")).toBe("Cancel");
  });

  it("returns undefined for unknown runtime translation keys", () => {
    initializeLocale("en-US");

    expect(t("missing_key" as never)).toBeUndefined();
  });

  it("formats dates and numbers using the active locale", () => {
    initializeLocale("en-US");

    expect(formatDate(new Date("2024-03-15T00:00:00Z"), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })).toBe("Mar 15, 2024");
    expect(formatNumber(1234.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe("1,234.5");
  });
});
