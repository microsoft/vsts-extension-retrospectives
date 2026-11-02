export const LIVE_SYNC_POLL_INTERVAL_MS = 2000;
export const BOARD_LIST_POLL_INTERVAL_MS = 30000;
export const MAX_POLL_BACKOFF_MS = 30000;

const MAX_BACKOFF_EXPONENT = 16;
const MAX_BACKOFF_JITTER_MS = 1000;

export interface IPollingLoopOptions {
  /**
   * Performs one poll. `isActive` turns false once the loop is stopped, so results
   * that arrive after a stop (e.g. board switch or unmount) can be discarded.
   */
  poll: (isActive: () => boolean) => Promise<void>;
  intervalMs: number;
  maxBackoffMs?: number;
  onError?: (error: unknown, consecutiveErrorCount: number) => void;
  pollImmediately?: boolean;
  pauseWhenHidden?: boolean;
}

export interface IPollingLoop {
  stop: () => void;
  pollNow: () => void;
  isActive: () => boolean;
}

export const getPollingBackoffDelayMs = (consecutiveErrorCount: number, maxBackoffMs: number = MAX_POLL_BACKOFF_MS, random: () => number = Math.random): number => {
  const exponent = Math.min(Math.max(consecutiveErrorCount, 1), MAX_BACKOFF_EXPONENT);
  return Math.min(maxBackoffMs, 1000 * Math.pow(2, exponent)) + Math.floor(random() * MAX_BACKOFF_JITTER_MS);
};

const isDocumentHidden = (): boolean => typeof document !== "undefined" && document.hidden === true;

/**
 * Starts a sequential polling loop: polls never overlap, the loop pauses while the page is hidden,
 * wakes up immediately when the page becomes visible or the browser comes back online, and backs off
 * exponentially (with jitter) on consecutive failures.
 */
export const startPollingLoop = ({ poll, intervalMs, maxBackoffMs = MAX_POLL_BACKOFF_MS, onError, pollImmediately = true, pauseWhenHidden = true }: IPollingLoopOptions): IPollingLoop => {
  let active = true;
  let pollRequested = false;
  let consecutiveErrorCount = 0;
  let wakeUp: (() => void) | undefined;

  const isActive = () => active;

  const sleep = (ms: number) =>
    new Promise<void>(resolve => {
      const timeoutId = setTimeout(() => {
        wakeUp = undefined;
        resolve();
      }, ms);

      wakeUp = () => {
        clearTimeout(timeoutId);
        wakeUp = undefined;
        resolve();
      };
    });

  const pollNow = () => {
    if (!active) {
      return;
    }

    pollRequested = true;
    wakeUp?.();
  };

  const handleVisibilityChange = () => {
    if (!isDocumentHidden()) {
      pollNow();
    }
  };

  const run = async () => {
    if (!pollImmediately) {
      await sleep(intervalMs);
    }

    while (active) {
      if (pauseWhenHidden && isDocumentHidden() && !pollRequested) {
        await sleep(intervalMs);
        continue;
      }

      pollRequested = false;

      try {
        await poll(isActive);
        consecutiveErrorCount = 0;
      } catch (error) {
        if (!active) {
          break;
        }

        consecutiveErrorCount++;

        try {
          onError?.(error, consecutiveErrorCount);
        } catch {
          // Error reporting must never stop the loop.
        }

        await sleep(getPollingBackoffDelayMs(consecutiveErrorCount, maxBackoffMs));
        continue;
      }

      if (!active) {
        break;
      }

      if (!pollRequested) {
        await sleep(intervalMs);
      }
    }
  };

  const stop = () => {
    if (!active) {
      return;
    }

    active = false;
    wakeUp?.();

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", pollNow);
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", pollNow);
  }

  void run();

  return { stop, pollNow, isActive };
};
