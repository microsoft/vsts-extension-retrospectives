import { initializeLocale, setLocale, t } from "../localization";

describe("localization", () => {
  afterEach(() => {
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
});
