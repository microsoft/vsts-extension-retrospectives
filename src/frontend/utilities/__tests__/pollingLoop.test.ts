import { BOARD_LIST_POLL_INTERVAL_MS, DEFAULT_IDLE_AFTER_UNCHANGED_POLLS, getPollingBackoffDelayMs, LIVE_SYNC_IDLE_POLL_INTERVAL_MS, LIVE_SYNC_POLL_INTERVAL_MS, MAX_POLL_BACKOFF_MS, startPollingLoop, IPollingLoop } from "../pollingLoop";

describe("getPollingBackoffDelayMs", () => {
  it("doubles the delay for each consecutive error and adds jitter", () => {
    expect(getPollingBackoffDelayMs(1, MAX_POLL_BACKOFF_MS, () => 0)).toBe(2000);
    expect(getPollingBackoffDelayMs(2, MAX_POLL_BACKOFF_MS, () => 0)).toBe(4000);
    expect(getPollingBackoffDelayMs(3, MAX_POLL_BACKOFF_MS, () => 0.5)).toBe(8500);
  });

  it("caps the delay at the maximum backoff plus jitter", () => {
    expect(getPollingBackoffDelayMs(5, MAX_POLL_BACKOFF_MS, () => 0)).toBe(MAX_POLL_BACKOFF_MS);
    expect(getPollingBackoffDelayMs(1000, MAX_POLL_BACKOFF_MS, () => 0.999)).toBe(MAX_POLL_BACKOFF_MS + 999);
    expect(getPollingBackoffDelayMs(3, 5000, () => 0)).toBe(5000);
  });

  it("treats non-positive error counts as the first error", () => {
    expect(getPollingBackoffDelayMs(0, MAX_POLL_BACKOFF_MS, () => 0)).toBe(2000);
    expect(getPollingBackoffDelayMs(-3, MAX_POLL_BACKOFF_MS, () => 0)).toBe(2000);
  });

  it("uses Math.random for jitter by default", () => {
    const delay = getPollingBackoffDelayMs(1);
    expect(delay).toBeGreaterThanOrEqual(2000);
    expect(delay).toBeLessThan(3000);
  });

  it("exposes sensible interval defaults", () => {
    expect(LIVE_SYNC_POLL_INTERVAL_MS).toBe(2000);
    expect(LIVE_SYNC_IDLE_POLL_INTERVAL_MS).toBeGreaterThan(LIVE_SYNC_POLL_INTERVAL_MS);
    expect(BOARD_LIST_POLL_INTERVAL_MS).toBeGreaterThan(LIVE_SYNC_IDLE_POLL_INTERVAL_MS);
    expect(DEFAULT_IDLE_AFTER_UNCHANGED_POLLS).toBeGreaterThan(0);
  });
});

describe("startPollingLoop", () => {
  let hidden = false;
  let loop: IPollingLoop | undefined;

  const setHidden = (value: boolean) => {
    hidden = value;
    document.dispatchEvent(new Event("visibilitychange"));
  };

  beforeAll(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  });

  afterAll(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    hidden = false;
    loop = undefined;
  });

  afterEach(() => {
    loop?.stop();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("polls immediately and then once per interval", async () => {
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(999);
    expect(poll).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(3000);
    expect(poll).toHaveBeenCalledTimes(5);
  });

  it("waits one interval before the first poll when pollImmediately is false", async () => {
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000, pollImmediately: false });

    await jest.advanceTimersByTimeAsync(999);
    expect(poll).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("never runs overlapping polls", async () => {
    let resolvePoll: () => void = () => undefined;
    const poll = jest.fn().mockImplementation(() => new Promise<void>(resolve => (resolvePoll = resolve)));
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(5000);
    expect(poll).toHaveBeenCalledTimes(1);

    resolvePoll();
    await jest.advanceTimersByTimeAsync(999);
    expect(poll).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("stops polling and reports inactive after stop", async () => {
    let capturedIsActive: () => boolean = () => true;
    const poll = jest.fn().mockImplementation(async (isActive: () => boolean) => {
      capturedIsActive = isActive;
    });
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(loop.isActive()).toBe(true);
    expect(capturedIsActive()).toBe(true);

    loop.stop();
    loop.stop();

    expect(loop.isActive()).toBe(false);
    expect(capturedIsActive()).toBe(false);

    await jest.advanceTimersByTimeAsync(10000);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not poll again when stopped during an in-flight poll", async () => {
    let resolvePoll: () => void = () => undefined;
    const poll = jest.fn().mockImplementation(() => new Promise<void>(resolve => (resolvePoll = resolve)));
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    loop.stop();
    resolvePoll();

    await jest.advanceTimersByTimeAsync(10000);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("pauses while the page is hidden and polls as soon as it becomes visible", async () => {
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    setHidden(true);
    await jest.advanceTimersByTimeAsync(10000);
    expect(poll).toHaveBeenCalledTimes(1);

    setHidden(false);
    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("does not poll on start while the page is hidden", async () => {
    hidden = true;
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(5000);
    expect(poll).not.toHaveBeenCalled();

    setHidden(false);
    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("keeps polling while hidden when pauseWhenHidden is false", async () => {
    hidden = true;
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000, pauseWhenHidden: false });

    await jest.advanceTimersByTimeAsync(2000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("backs off exponentially after consecutive failures and resets after a success", async () => {
    const error = new Error("network");
    const onError = jest.fn();
    const poll = jest.fn().mockRejectedValueOnce(error).mockRejectedValueOnce(error).mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000, onError });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenLastCalledWith(error, 1);

    await jest.advanceTimersByTimeAsync(1999);
    expect(poll).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenLastCalledWith(error, 2);

    await jest.advanceTimersByTimeAsync(3999);
    expect(poll).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(1000);
    expect(poll).toHaveBeenCalledTimes(4);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("respects a custom maximum backoff", async () => {
    const poll = jest.fn().mockRejectedValue(new Error("down"));
    loop = startPollingLoop({ poll, intervalMs: 100, maxBackoffMs: 1500 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1500);
    expect(poll).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1500);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("keeps polling when the error handler throws", async () => {
    const onError = jest.fn().mockImplementation(() => {
      throw new Error("handler failed");
    });
    const poll = jest.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000, onError });

    await jest.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(2000);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("does not report errors from a poll that finished after stop", async () => {
    let rejectPoll: (error: Error) => void = () => undefined;
    const onError = jest.fn();
    const poll = jest.fn().mockImplementation(() => new Promise<void>((_, reject) => (rejectPoll = reject)));
    loop = startPollingLoop({ poll, intervalMs: 1000, onError });

    await jest.advanceTimersByTimeAsync(0);
    loop.stop();
    rejectPoll(new Error("late failure"));
    await jest.advanceTimersByTimeAsync(10000);

    expect(onError).not.toHaveBeenCalled();
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("polls immediately when pollNow is called while sleeping", async () => {
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    loop.pollNow();
    await jest.advanceTimersByTimeAsync(0);

    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("polls again right after an in-flight poll when pollNow is called during it", async () => {
    let resolvePoll: () => void = () => undefined;
    const poll = jest.fn().mockImplementation(() => new Promise<void>(resolve => (resolvePoll = resolve)));
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    loop.pollNow();
    resolvePoll();
    await jest.advanceTimersByTimeAsync(0);

    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("honors pollNow while the page is hidden", async () => {
    hidden = true;
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).not.toHaveBeenCalled();

    loop.pollNow();
    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("ignores pollNow after stop", async () => {
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    loop.stop();
    loop.pollNow();
    await jest.advanceTimersByTimeAsync(5000);

    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("skips the backoff and polls when the browser comes back online", async () => {
    const poll = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("online"));
    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("removes its event listeners when stopped", async () => {
    const removeDocumentListener = jest.spyOn(document, "removeEventListener");
    const removeWindowListener = jest.spyOn(window, "removeEventListener");
    const poll = jest.fn().mockResolvedValue(undefined);
    loop = startPollingLoop({ poll, intervalMs: 1000 });

    loop.stop();

    expect(removeDocumentListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith("online", expect.any(Function));

    setHidden(false);
    window.dispatchEvent(new Event("online"));
    await jest.advanceTimersByTimeAsync(5000);
    expect(poll).toHaveBeenCalledTimes(1);
  });

  describe("idle slowdown", () => {
    const REGULAR_MS = 1000;
    const IDLE_MS = 5000;

    const startIdleLoop = (poll: jest.Mock, idleAfterUnchangedPolls = 2) => startPollingLoop({ poll, intervalMs: REGULAR_MS, idleIntervalMs: IDLE_MS, idleAfterUnchangedPolls });

    it("keeps the regular interval when no idle interval is set", async () => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startPollingLoop({ poll, intervalMs: REGULAR_MS });

      await jest.advanceTimersByTimeAsync(20 * REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(21);
    });

    it("slows down after the configured number of unchanged polls", async () => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startIdleLoop(poll, 3);

      await jest.advanceTimersByTimeAsync(2 * REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(IDLE_MS - 1);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(4);

      await jest.advanceTimersByTimeAsync(IDLE_MS);
      expect(poll).toHaveBeenCalledTimes(5);
    });

    it("waits for the default number of unchanged polls before slowing down", async () => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startPollingLoop({ poll, intervalMs: REGULAR_MS, idleIntervalMs: IDLE_MS });

      await jest.advanceTimersByTimeAsync((DEFAULT_IDLE_AFTER_UNCHANGED_POLLS - 1) * REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(DEFAULT_IDLE_AFTER_UNCHANGED_POLLS);

      await jest.advanceTimersByTimeAsync(IDLE_MS - 1);
      expect(poll).toHaveBeenCalledTimes(DEFAULT_IDLE_AFTER_UNCHANGED_POLLS);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(DEFAULT_IDLE_AFTER_UNCHANGED_POLLS + 1);
    });

    it("returns to the regular interval after a poll reports changes", async () => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startIdleLoop(poll);

      await jest.advanceTimersByTimeAsync(REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(2);

      poll.mockResolvedValueOnce(true);
      await jest.advanceTimersByTimeAsync(IDLE_MS);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(REGULAR_MS - 1);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(4);
    });

    it("treats a poll that resolves without a value as activity", async () => {
      const poll = jest.fn().mockResolvedValue(undefined);
      loop = startIdleLoop(poll);

      await jest.advanceTimersByTimeAsync(10 * REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(11);
    });

    const wakeUps: Array<[string, () => void]> = [
      ["pollNow is called", () => loop?.pollNow()],
      [
        "the page becomes visible again",
        () => {
          setHidden(true);
          setHidden(false);
        },
      ],
      ["the browser comes back online", () => window.dispatchEvent(new Event("online"))],
    ];

    it.each(wakeUps)("returns to the regular interval when %s", async (_description, wakeUp) => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startIdleLoop(poll);

      await jest.advanceTimersByTimeAsync(REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(2);

      wakeUp();
      await jest.advanceTimersByTimeAsync(0);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(REGULAR_MS - 1);
      expect(poll).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(4);

      await jest.advanceTimersByTimeAsync(IDLE_MS - 1);
      expect(poll).toHaveBeenCalledTimes(4);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(5);
    });

    it("does not count a poll as unchanged when pollNow was called while it was running", async () => {
      const resolvers: Array<(hasChanges: boolean) => void> = [];
      const poll = jest.fn().mockImplementation(() => new Promise<boolean>(resolve => resolvers.push(resolve)));
      loop = startIdleLoop(poll);

      await jest.advanceTimersByTimeAsync(0);
      loop.pollNow();
      resolvers[0](false);
      await jest.advanceTimersByTimeAsync(0);
      expect(poll).toHaveBeenCalledTimes(2);

      resolvers[1](false);
      await jest.advanceTimersByTimeAsync(REGULAR_MS - 1);
      expect(poll).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(3);
    });

    it("never idles faster than the regular interval", async () => {
      const poll = jest.fn().mockResolvedValue(false);
      loop = startPollingLoop({ poll, intervalMs: REGULAR_MS, idleIntervalMs: REGULAR_MS / 2, idleAfterUnchangedPolls: 1 });

      await jest.advanceTimersByTimeAsync(0);
      expect(poll).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(REGULAR_MS - 1);
      expect(poll).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(2);
    });

    it("treats an idle threshold below one as one", async () => {
      const poll = jest.fn().mockResolvedValue(true);
      loop = startIdleLoop(poll, 0);

      await jest.advanceTimersByTimeAsync(2 * REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(3);

      poll.mockResolvedValue(false);
      await jest.advanceTimersByTimeAsync(REGULAR_MS);
      expect(poll).toHaveBeenCalledTimes(4);

      await jest.advanceTimersByTimeAsync(IDLE_MS - 1);
      expect(poll).toHaveBeenCalledTimes(4);

      await jest.advanceTimersByTimeAsync(1);
      expect(poll).toHaveBeenCalledTimes(5);
    });
  });
});
