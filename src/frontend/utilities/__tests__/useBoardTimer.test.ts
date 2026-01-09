import { renderHook, act } from "@testing-library/react";
import { useBoardTimer, formatBoardTimer, BoardTimerManager, DEFAULT_TIMER_STATE, BoardTimerState } from "../useBoardTimer";
import * as audioHelper from "../audioHelper";

// Mock the audio helper
jest.mock("../audioHelper", () => ({
  playStartChime: jest.fn(),
  playStopChime: jest.fn(),
}));

describe("formatBoardTimer", () => {
  it("should format 0 seconds as 0:00", () => {
    expect(formatBoardTimer(0)).toBe("0:00");
  });

  it("should format single digit seconds with leading zero", () => {
    expect(formatBoardTimer(5)).toBe("0:05");
  });

  it("should format double digit seconds", () => {
    expect(formatBoardTimer(30)).toBe("0:30");
  });

  it("should format minutes correctly", () => {
    expect(formatBoardTimer(60)).toBe("1:00");
    expect(formatBoardTimer(90)).toBe("1:30");
    expect(formatBoardTimer(125)).toBe("2:05");
  });

  it("should format large values correctly", () => {
    expect(formatBoardTimer(3600)).toBe("60:00");
    expect(formatBoardTimer(5400)).toBe("90:00");
  });

  it("should format negative seconds (overtime) with minus sign", () => {
    expect(formatBoardTimer(-1)).toBe("-0:01");
    expect(formatBoardTimer(-30)).toBe("-0:30");
    expect(formatBoardTimer(-65)).toBe("-1:05");
  });
});

describe("DEFAULT_TIMER_STATE", () => {
  it("should have correct default values", () => {
    expect(DEFAULT_TIMER_STATE).toEqual({
      seconds: 0,
      isRunning: false,
      countdownDurationMinutes: 5,
      hasPlayedStopChime: false,
    });
  });
});

describe("useBoardTimer hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useBoardTimer());
      const [state] = result.current;

      expect(state).toEqual(DEFAULT_TIMER_STATE);
    });

    it("should accept partial initial state overrides", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 10, seconds: 30 }));
      const [state] = result.current;

      expect(state.countdownDurationMinutes).toBe(10);
      expect(state.seconds).toBe(30);
      expect(state.isRunning).toBe(false);
    });
  });

  describe("start", () => {
    it("should start countdown from duration when seconds is 0", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].start();
      });

      const [state] = result.current;
      expect(state.isRunning).toBe(true);
      expect(state.seconds).toBe(300); // 5 minutes in seconds
      expect(audioHelper.playStartChime).toHaveBeenCalledTimes(1);
    });

    it("should resume from current position when seconds > 0", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5, seconds: 150 }));

      act(() => {
        result.current[1].start();
      });

      const [state] = result.current;
      expect(state.isRunning).toBe(true);
      expect(state.seconds).toBe(150);
      expect(audioHelper.playStartChime).toHaveBeenCalledTimes(1);
    });

    it("should count down when in countdown mode", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 1, seconds: 10 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const [state] = result.current;
      expect(state.seconds).toBe(7); // 10 - 3 = 7
    });

    it("should count up when in stopwatch mode", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 0 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const [state] = result.current;
      expect(state.seconds).toBe(5);
    });

    it("should not start if already running", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        result.current[1].start();
      });

      expect(audioHelper.playStartChime).toHaveBeenCalledTimes(1);
    });

    it("should play stop chime when countdown reaches 0", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 1, seconds: 3 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(audioHelper.playStopChime).toHaveBeenCalledTimes(1);
      expect(result.current[0].hasPlayedStopChime).toBe(true);
      expect(result.current[0].seconds).toBe(0);
    });

    it("should play stop chime when countdown from initial zero reaches 0", () => {
      // This tests the interval path when starting from 0 (lines 135-136)
      const { result } = renderHook(
        () => useBoardTimer({ countdownDurationMinutes: 1 }), // seconds defaults to 0
      );

      act(() => {
        result.current[1].start();
      });

      // Timer should now be at 60 seconds (1 minute countdown)
      expect(result.current[0].seconds).toBe(60);

      // Advance to exactly reach 0
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(audioHelper.playStopChime).toHaveBeenCalledTimes(1);
      expect(result.current[0].hasPlayedStopChime).toBe(true);
      expect(result.current[0].seconds).toBe(0);
    });

    it("should continue counting into negative (overtime) after reaching 0", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 1, seconds: 2 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current[0].seconds).toBe(-3);
    });

    it("should not play stop chime again when already played", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 1, seconds: 2 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(audioHelper.playStopChime).toHaveBeenCalledTimes(1);
    });
  });

  describe("pause", () => {
    it("should stop the timer", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5, seconds: 100 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      act(() => {
        result.current[1].pause();
      });

      const secondsAtPause = result.current[0].seconds;
      expect(result.current[0].isRunning).toBe(false);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current[0].seconds).toBe(secondsAtPause);
    });
  });

  describe("reset", () => {
    it("should reset to initial state", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      act(() => {
        result.current[1].reset();
      });

      const [state] = result.current;
      expect(state.seconds).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.hasPlayedStopChime).toBe(false);
    });

    it("should preserve countdownDurationMinutes", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 10 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0].countdownDurationMinutes).toBe(10);
    });
  });

  describe("toggle", () => {
    it("should start when not running", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].toggle();
      });

      expect(result.current[0].isRunning).toBe(true);
    });

    it("should pause when running", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].start();
      });

      act(() => {
        result.current[1].toggle();
      });

      expect(result.current[0].isRunning).toBe(false);
    });
  });

  describe("setCountdownDuration", () => {
    it("should update the countdown duration", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].setCountdownDuration(15);
      });

      expect(result.current[0].countdownDurationMinutes).toBe(15);
    });

    it("should set to 0 for stopwatch mode", () => {
      const { result } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].setCountdownDuration(0);
      });

      expect(result.current[0].countdownDurationMinutes).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should clean up interval on unmount", () => {
      const { result, unmount } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      act(() => {
        result.current[1].start();
      });

      unmount();

      // Interval should be cleared, no errors should occur
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });

    it("should handle unmount when timer is NOT running (line 52 branch)", () => {
      const { result, unmount } = renderHook(() => useBoardTimer({ countdownDurationMinutes: 5 }));

      // Timer is not started, so intervalRef.current is undefined
      expect(result.current[0].isRunning).toBe(false);

      // Unmount without starting - should not throw and should cover the
      // branch where intervalRef.current === undefined
      unmount();

      // No errors should occur
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });
  });
});

describe("BoardTimerManager (class-compatible API)", () => {
  let manager: BoardTimerManager;
  let state: BoardTimerState;
  let onStateChange: jest.Mock;
  let getState: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    state = { ...DEFAULT_TIMER_STATE };
    onStateChange = jest.fn((partial: Partial<BoardTimerState>) => {
      state = { ...state, ...partial };
    });
    getState = jest.fn(() => state);

    manager = new BoardTimerManager(onStateChange, getState);
  });

  afterEach(() => {
    manager.cleanup();
    jest.useRealTimers();
  });

  describe("start", () => {
    it("should start countdown from duration when seconds is 0", () => {
      manager.start();

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          seconds: 300,
          isRunning: true,
        }),
      );
      expect(audioHelper.playStartChime).toHaveBeenCalledTimes(1);
    });

    it("should resume from current position when seconds > 0", () => {
      state.seconds = 150;
      manager.start();

      expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ isRunning: true }));
      expect(audioHelper.playStartChime).toHaveBeenCalledTimes(1);
    });

    it("should count down in countdown mode", () => {
      state.seconds = 10;
      manager.start();

      jest.advanceTimersByTime(3000);

      expect(state.seconds).toBe(7);
    });

    it("should count up in stopwatch mode", () => {
      state.countdownDurationMinutes = 0;
      manager.start();

      jest.advanceTimersByTime(5000);

      expect(state.seconds).toBe(5);
    });

    it("should not start if already running", () => {
      manager.start();
      const callCount = onStateChange.mock.calls.length;

      manager.start();

      expect(onStateChange.mock.calls.length).toBe(callCount);
    });

    it("should play stop chime when countdown reaches 0", () => {
      state.seconds = 3;
      manager.start();

      jest.advanceTimersByTime(3000);

      expect(audioHelper.playStopChime).toHaveBeenCalledTimes(1);
      expect(state.hasPlayedStopChime).toBe(true);
    });

    it("should play stop chime when countdown from initial zero reaches 0", () => {
      // This tests the interval path when starting from 0 (lines 273-274)
      // state.seconds defaults to 0, state.countdownDurationMinutes defaults to 5
      manager.start();

      // Timer should now be at 300 seconds (5 minute countdown)
      expect(state.seconds).toBe(300);

      // Advance to exactly reach 0
      jest.advanceTimersByTime(300000);

      expect(audioHelper.playStopChime).toHaveBeenCalledTimes(1);
      expect(state.hasPlayedStopChime).toBe(true);
      expect(state.seconds).toBe(0);
    });
  });

  describe("pause", () => {
    it("should stop the timer and set isRunning to false", () => {
      state.seconds = 100;
      manager.start();
      jest.advanceTimersByTime(2000);

      manager.pause();

      expect(state.isRunning).toBe(false);
      const secondsAtPause = state.seconds;

      jest.advanceTimersByTime(2000);

      expect(state.seconds).toBe(secondsAtPause);
    });
  });

  describe("reset", () => {
    it("should reset timer state", () => {
      manager.start();
      jest.advanceTimersByTime(5000);

      manager.reset();

      expect(state.seconds).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.hasPlayedStopChime).toBe(false);
    });
  });

  describe("toggle", () => {
    it("should start when not running", () => {
      manager.toggle();

      expect(state.isRunning).toBe(true);
    });

    it("should pause when running", () => {
      manager.start();
      state.isRunning = true;

      manager.toggle();

      expect(state.isRunning).toBe(false);
    });
  });

  describe("hasInterval", () => {
    it("should return false when not running", () => {
      expect(manager.hasInterval()).toBe(false);
    });

    it("should return true when running", () => {
      manager.start();

      expect(manager.hasInterval()).toBe(true);
    });

    it("should return false after cleanup", () => {
      manager.start();
      manager.cleanup();

      expect(manager.hasInterval()).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should clear the interval", () => {
      manager.start();
      expect(manager.hasInterval()).toBe(true);

      manager.cleanup();

      expect(manager.hasInterval()).toBe(false);
    });
  });
});
