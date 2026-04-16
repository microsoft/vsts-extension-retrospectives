/**
 * Creates a polling mechanism that:
 * - Only polls when the document is visible
 * - Supports enable/disable (e.g. skip when live-sync is connected)
 * - Uses configurable interval with optional backoff
 * - Automatically pauses/resumes on visibility change
 *
 * Returns a cleanup function.
 */
export interface VisibilityAwarePollingOptions {
  /** The async function to call on each poll tick. */
  callback: () => void | Promise<void>;
  /** Polling interval in milliseconds. */
  intervalMs: number;
  /** If true, polling is enabled. When false, polling pauses without clearing the setup. */
  enabled: boolean;
}

export interface VisibilityAwarePollingHandle {
  /** Call this to tear down the polling (remove listeners, clear interval). */
  cleanup: () => void;
}

export function createVisibilityAwarePolling(options: VisibilityAwarePollingOptions): VisibilityAwarePollingHandle {
  const { callback, intervalMs, enabled } = options;
  let timerId: ReturnType<typeof setInterval> | undefined;

  const isDocumentVisible = (): boolean => {
    return typeof document !== "undefined" && document.visibilityState !== "hidden";
  };

  const startPolling = () => {
    if (timerId !== undefined) {
      return;
    }
    timerId = setInterval(() => {
      if (enabled && isDocumentVisible()) {
        void callback();
      }
    }, intervalMs);
  };

  const stopPolling = () => {
    if (timerId !== undefined) {
      clearInterval(timerId);
      timerId = undefined;
    }
  };

  const handleVisibilityChange = () => {
    if (isDocumentVisible() && enabled) {
      startPolling();
    } else {
      stopPolling();
    }
  };

  // Initial setup
  if (enabled && isDocumentVisible()) {
    startPolling();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  const cleanup = () => {
    stopPolling();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };

  return { cleanup };
}
