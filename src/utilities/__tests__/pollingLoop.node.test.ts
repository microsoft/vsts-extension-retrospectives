/**
 * @jest-environment node
 */
import { startPollingLoop } from "../pollingLoop";

describe("startPollingLoop without browser globals", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("polls on its interval and stops cleanly when document and window are unavailable", async () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");

    const poll = jest.fn().mockResolvedValue(undefined);
    const loop = startPollingLoop({ poll, intervalMs: 1000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);
    expect(poll).toHaveBeenCalledTimes(2);

    loop.stop();
    expect(loop.isActive()).toBe(false);

    await jest.advanceTimersByTimeAsync(5000);
    expect(poll).toHaveBeenCalledTimes(2);
  });
});
