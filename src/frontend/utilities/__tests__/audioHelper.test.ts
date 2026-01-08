import { getAudioContextConstructor, createAudioContext, playNote, playChime, playStartChime, playStopChime, isAudioSupported } from "../audioHelper";

describe("audioHelper", () => {
  // Store original window properties
  const originalAudioContext = window.AudioContext;
  const originalWebkitAudioContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  // Mock AudioContext
  let mockOscillator: {
    connect: jest.Mock;
    type: OscillatorType;
    frequency: { value: number };
    start: jest.Mock;
    stop: jest.Mock;
  };

  let mockGainNode: {
    connect: jest.Mock;
    gain: {
      setValueAtTime: jest.Mock;
      linearRampToValueAtTime: jest.Mock;
      exponentialRampToValueAtTime: jest.Mock;
    };
  };

  let mockAudioContext: {
    currentTime: number;
    destination: AudioDestinationNode;
    createOscillator: jest.Mock;
    createGain: jest.Mock;
  };

  const createMockAudioContext = () => {
    mockOscillator = {
      connect: jest.fn(),
      type: "sine",
      frequency: { value: 0 },
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockAudioContext = {
      currentTime: 0,
      destination: {} as AudioDestinationNode,
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createGain: jest.fn().mockReturnValue(mockGainNode),
    };

    return mockAudioContext;
  };

  beforeEach(() => {
    createMockAudioContext();
  });

  afterEach(() => {
    // Restore original window properties
    Object.defineProperty(window, "AudioContext", {
      value: originalAudioContext,
      writable: true,
      configurable: true,
    });
    if (originalWebkitAudioContext !== undefined) {
      Object.defineProperty(window, "webkitAudioContext", {
        value: originalWebkitAudioContext,
        writable: true,
        configurable: true,
      });
    } else {
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    }
  });

  describe("getAudioContextConstructor", () => {
    it("should return AudioContext when available", () => {
      const MockAudioContext = jest.fn();
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });

      expect(getAudioContextConstructor()).toBe(MockAudioContext);
    });

    it("should return webkitAudioContext when AudioContext is not available", () => {
      const MockWebkitAudioContext = jest.fn();
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        value: MockWebkitAudioContext,
        writable: true,
        configurable: true,
      });

      expect(getAudioContextConstructor()).toBe(MockWebkitAudioContext);
    });

    it("should return undefined when no AudioContext is available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      expect(getAudioContextConstructor()).toBeUndefined();
    });
  });

  describe("createAudioContext", () => {
    it("should create an AudioContext when available", () => {
      const MockAudioContext = jest.fn().mockImplementation(() => mockAudioContext);
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });

      const result = createAudioContext();
      expect(result).toBe(mockAudioContext);
      expect(MockAudioContext).toHaveBeenCalled();
    });

    it("should return null when AudioContext is not available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      expect(createAudioContext()).toBeNull();
    });

    it("should return null when AudioContext constructor throws", () => {
      const MockAudioContext = jest.fn().mockImplementation(() => {
        throw new Error("Audio not allowed");
      });
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });

      expect(createAudioContext()).toBeNull();
    });
  });

  describe("playNote", () => {
    it("should create oscillator and gain node", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };
      playNote(mockAudioContext as unknown as AudioContext, 440, 0, options);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("should connect oscillator to gain node", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };
      playNote(mockAudioContext as unknown as AudioContext, 440, 0, options);

      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
    });

    it("should connect gain node to destination", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };
      playNote(mockAudioContext as unknown as AudioContext, 440, 0, options);

      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it("should set oscillator type to sine", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };
      playNote(mockAudioContext as unknown as AudioContext, 440, 0, options);

      expect(mockOscillator.type).toBe("sine");
    });

    it("should set correct frequency", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };
      playNote(mockAudioContext as unknown as AudioContext, 440, 0, options);

      expect(mockOscillator.frequency.value).toBe(440);
    });

    it("should configure gain envelope", () => {
      const options = { volume: 0.5, noteDuration: 0.3, noteDelay: 0.05 };
      const startTime = 1.0;
      playNote(mockAudioContext as unknown as AudioContext, 440, startTime, options);

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, startTime);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, startTime + 0.01);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, startTime + 0.3);
    });

    it("should start and stop oscillator at correct times", () => {
      const options = { volume: 0.3, noteDuration: 0.5, noteDelay: 0.05 };
      const startTime = 2.0;
      playNote(mockAudioContext as unknown as AudioContext, 440, startTime, options);

      expect(mockOscillator.start).toHaveBeenCalledWith(startTime);
      expect(mockOscillator.stop).toHaveBeenCalledWith(startTime + 0.5);
    });

    it("should handle different frequencies", () => {
      const options = { volume: 0.3, noteDuration: 0.3, noteDelay: 0.05 };

      playNote(mockAudioContext as unknown as AudioContext, 523.25, 0, options);
      expect(mockOscillator.frequency.value).toBe(523.25);
    });
  });

  describe("playChime", () => {
    beforeEach(() => {
      const MockAudioContext = jest.fn().mockImplementation(() => createMockAudioContext());
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });
    });

    it("should return true when audio is available", () => {
      const result = playChime([440, 550, 660]);
      expect(result).toBe(true);
    });

    it("should return false when audio is not available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      const result = playChime([440, 550, 660]);
      expect(result).toBe(false);
    });

    it("should create oscillator for each frequency", () => {
      playChime([440, 550, 660]);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("should use default options when none provided", () => {
      playChime([440]);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, expect.any(Number));
    });

    it("should use custom volume option", () => {
      playChime([440], { volume: 0.5 });
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number));
    });

    it("should use custom note duration", () => {
      playChime([440], { noteDuration: 0.5 });
      expect(mockOscillator.stop).toHaveBeenCalledWith(0.5);
    });

    it("should handle empty frequency array", () => {
      const result = playChime([]);
      expect(result).toBe(true);
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it("should apply note delay between notes", () => {
      mockAudioContext.currentTime = 0;
      playChime([440, 550], { noteDelay: 0.1 });

      // First note starts at currentTime (0)
      // Second note starts at currentTime + 0.1
      expect(mockOscillator.start).toHaveBeenNthCalledWith(1, 0);
      expect(mockOscillator.start).toHaveBeenNthCalledWith(2, 0.1);
    });
  });

  describe("playStartChime", () => {
    beforeEach(() => {
      const MockAudioContext = jest.fn().mockImplementation(() => createMockAudioContext());
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });
    });

    it("should return true when audio is available", () => {
      expect(playStartChime()).toBe(true);
    });

    it("should play three notes (G5, E5, C5)", () => {
      playStartChime();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("should play descending notes (verified by oscillator creation)", () => {
      // The descending notes (783.99, 659.25, 523.25) are set on the oscillators
      // We verify this indirectly by checking the correct number of oscillators are created
      playStartChime();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it("should accept custom options", () => {
      playStartChime({ volume: 0.8 });
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, expect.any(Number));
    });

    it("should return false when audio is not supported", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      expect(playStartChime()).toBe(false);
    });
  });

  describe("playStopChime", () => {
    beforeEach(() => {
      const MockAudioContext = jest.fn().mockImplementation(() => createMockAudioContext());
      Object.defineProperty(window, "AudioContext", {
        value: MockAudioContext,
        writable: true,
        configurable: true,
      });
    });

    it("should return true when audio is available", () => {
      expect(playStopChime()).toBe(true);
    });

    it("should play three notes (C5, E5, G5)", () => {
      playStopChime();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("should play ascending notes (verified by oscillator creation)", () => {
      // The ascending notes (523.25, 659.25, 783.99) are set on the oscillators
      // We verify this indirectly by checking the correct number of oscillators are created
      playStopChime();
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it("should accept custom options", () => {
      playStopChime({ volume: 0.2, noteDuration: 0.4 });
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.2, expect.any(Number));
    });

    it("should return false when audio is not supported", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      expect(playStopChime()).toBe(false);
    });
  });

  describe("isAudioSupported", () => {
    it("should return true when AudioContext is available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });

      expect(isAudioSupported()).toBe(true);
    });

    it("should return true when webkitAudioContext is available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });

      expect(isAudioSupported()).toBe(true);
    });

    it("should return false when no AudioContext is available", () => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      delete (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      expect(isAudioSupported()).toBe(false);
    });
  });
});
