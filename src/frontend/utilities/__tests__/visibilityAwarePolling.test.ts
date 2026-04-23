import { createVisibilityAwarePolling } from "../visibilityAwarePolling";

describe("createVisibilityAwarePolling", () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    addSpy = jest.spyOn(document, "addEventListener");
    removeSpy = jest.spyOn(document, "removeEventListener");
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("calls the callback at the specified interval when enabled and visible", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 1000, enabled: true });

    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(3);

    handle.cleanup();
  });

  it("does not call the callback when disabled", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: false });

    jest.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    handle.cleanup();
  });

  it("does not call the callback when the document is hidden", () => {
    const callback = jest.fn();
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });

    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    jest.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    handle.cleanup();
  });

  it("registers a visibilitychange listener and removes it on cleanup", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 1000, enabled: true });

    expect(addSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    handle.cleanup();

    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  it("stops polling when visibility changes to hidden", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    // Simulate hide
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    const visibilityHandler = addSpy.mock.calls.find(call => call[0] === "visibilitychange")[1];
    visibilityHandler();

    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(1);

    handle.cleanup();
  });

  it("resumes polling when visibility changes back to visible", () => {
    const callback = jest.fn();
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    const visibilityHandler = addSpy.mock.calls.find(call => call[0] === "visibilitychange")[1];

    jest.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    // Make visible again
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    visibilityHandler();

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    handle.cleanup();
  });

  it("does not restart polling if already running", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    const visibilityHandler = addSpy.mock.calls.find(call => call[0] === "visibilitychange")[1];

    // Trigger visibility change while already visible (no-op)
    visibilityHandler();

    jest.advanceTimersByTime(500);
    // Should only fire once, not double-firing from double start
    expect(callback).toHaveBeenCalledTimes(1);

    handle.cleanup();
  });

  it("does not start timer on visibility restore when disabled", () => {
    const callback = jest.fn();
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: false });

    const visibilityHandler = addSpy.mock.calls.find(call => call[0] === "visibilitychange")[1];

    // Make visible
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    visibilityHandler();

    jest.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    handle.cleanup();
  });

  it("cleanup is safe to call multiple times", () => {
    const callback = jest.fn();
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    handle.cleanup();
    expect(() => handle.cleanup()).not.toThrow();
  });

  it("handles async callback without error", () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    const handle = createVisibilityAwarePolling({ callback, intervalMs: 500, enabled: true });

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    handle.cleanup();
  });
});
