import localStorageHelper from "../localStorageHelper";

describe("localStorageHelper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should set and get the id value from local storage", () => {
    const id = "12345";
    localStorageHelper.setIdValue(id);
    const retrievedId = localStorageHelper.getIdValue();
    expect(retrievedId).toBe(id);
  });

  it("should return undefined if id value is not set", () => {
    const retrievedId = localStorageHelper.getIdValue();
    expect(retrievedId).toBeNull();
  });
});
