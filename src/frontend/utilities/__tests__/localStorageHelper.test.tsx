import localStorageHelper from "../localStorageHelper";

describe("localStorageHelper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should set and get the ID value from local storage", () => {
    const id = "12345";
    localStorageHelper.setIdValue(id);
    const retrievedId = localStorageHelper.getIdValue();
    expect(retrievedId).toBe(id);
  });

  it("should return undefined if ID value is not set", () => {
    const retrievedId = localStorageHelper.getIdValue();
    expect(retrievedId).toBeNull();
  });
});
