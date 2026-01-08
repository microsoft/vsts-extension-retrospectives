import { useState, useCallback, useRef, useEffect } from "react";
import { playStartChime, playStopChime } from "./audioHelper";

export interface BoardTimerState {
  seconds: number;
  isRunning: boolean;
  countdownDurationMinutes: number;
  hasPlayedStopChime: boolean;
}

export interface BoardTimerControls {
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
  setCountdownDuration: (minutes: number) => void;
}

export function formatBoardTimer(timeInSeconds: number): string {
  const isNegative = timeInSeconds < 0;
  const absoluteSeconds = Math.abs(timeInSeconds);
  const minutes = Math.floor(absoluteSeconds / 60);
  const seconds = absoluteSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  return isNegative ? `-${formattedTime}` : formattedTime;
}

export const DEFAULT_TIMER_STATE: BoardTimerState = {
  seconds: 0,
  isRunning: false,
  countdownDurationMinutes: 5,
  hasPlayedStopChime: false,
};

export function useBoardTimer(initialState: Partial<BoardTimerState> = {}): [BoardTimerState, BoardTimerControls] {
  const [state, setState] = useState<BoardTimerState>({
    ...DEFAULT_TIMER_STATE,
    ...initialState,
  });

  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== undefined) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== undefined) {
      return;
    }

    const isStopwatchMode = state.countdownDurationMinutes === 0;

    if (state.seconds === 0 && !isStopwatchMode) {
      playStartChime();
      setState(prev => ({
        ...prev,
        seconds: prev.countdownDurationMinutes * 60,
        hasPlayedStopChime: false,
        isRunning: true,
      }));

      intervalRef.current = window.setInterval(() => {
        setState(prev => {
          const newSeconds = prev.seconds - 1;
          if (newSeconds === 0 && !prev.hasPlayedStopChime) {
            playStopChime();
            return { ...prev, seconds: newSeconds, hasPlayedStopChime: true };
          }
          return { ...prev, seconds: newSeconds };
        });
      }, 1000);
    } else {
      playStartChime();
      setState(prev => ({ ...prev, isRunning: true }));

      intervalRef.current = window.setInterval(() => {
        setState(prev => {
          const isStopwatchMode = prev.countdownDurationMinutes === 0;

          if (isStopwatchMode) {
            return { ...prev, seconds: prev.seconds + 1 };
          } else {
            const newSeconds = prev.seconds - 1;
            if (newSeconds === 0 && !prev.hasPlayedStopChime) {
              playStopChime();
              return { ...prev, seconds: newSeconds, hasPlayedStopChime: true };
            }
            return { ...prev, seconds: newSeconds };
          }
        });
      }, 1000);
    }
  }, [state.countdownDurationMinutes, state.seconds]);

  const pause = useCallback(() => {
    clearTimerInterval();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [clearTimerInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    setState(prev => ({
      ...prev,
      seconds: 0,
      isRunning: false,
      hasPlayedStopChime: false,
    }));
  }, [clearTimerInterval]);

  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, pause, start]);

  const setCountdownDuration = useCallback((minutes: number) => {
    setState(prev => ({ ...prev, countdownDurationMinutes: minutes }));
  }, []);

  const controls: BoardTimerControls = {
    start,
    pause,
    reset,
    toggle,
    setCountdownDuration,
  };

  return [state, controls];
}

export class BoardTimerManager {
  private intervalId?: number;
  private onStateChange: (state: Partial<BoardTimerState>) => void;
  private getState: () => BoardTimerState;

  constructor(onStateChange: (state: Partial<BoardTimerState>) => void, getState: () => BoardTimerState) {
    this.onStateChange = onStateChange;
    this.getState = getState;
  }

  cleanup(): void {
    this.clearInterval();
  }

  private clearInterval(): void {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  start(): void {
    if (this.intervalId !== undefined) {
      return;
    }

    const state = this.getState();
    const isStopwatchMode = state.countdownDurationMinutes === 0;

    if (state.seconds === 0 && !isStopwatchMode) {
      playStartChime();
      this.onStateChange({
        seconds: state.countdownDurationMinutes * 60,
        hasPlayedStopChime: false,
        isRunning: true,
      });

      this.intervalId = window.setInterval(() => {
        const currentState = this.getState();
        const newSeconds = currentState.seconds - 1;
        if (newSeconds === 0 && !currentState.hasPlayedStopChime) {
          playStopChime();
          this.onStateChange({ seconds: newSeconds, hasPlayedStopChime: true });
        } else {
          this.onStateChange({ seconds: newSeconds });
        }
      }, 1000);
    } else {
      playStartChime();
      this.onStateChange({ isRunning: true });

      this.intervalId = window.setInterval(() => {
        const currentState = this.getState();
        const isStopwatchMode = currentState.countdownDurationMinutes === 0;

        if (isStopwatchMode) {
          this.onStateChange({ seconds: currentState.seconds + 1 });
        } else {
          const newSeconds = currentState.seconds - 1;
          if (newSeconds === 0 && !currentState.hasPlayedStopChime) {
            playStopChime();
            this.onStateChange({ seconds: newSeconds, hasPlayedStopChime: true });
          } else {
            this.onStateChange({ seconds: newSeconds });
          }
        }
      }, 1000);
    }
  }

  pause(): void {
    this.clearInterval();
    this.onStateChange({ isRunning: false });
  }

  reset(): void {
    this.clearInterval();
    this.onStateChange({
      seconds: 0,
      isRunning: false,
      hasPlayedStopChime: false,
    });
  }

  toggle(): void {
    const state = this.getState();
    if (state.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  hasInterval(): boolean {
    return this.intervalId !== undefined;
  }
}
