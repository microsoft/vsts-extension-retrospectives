export interface ChimeOptions {
  /** Volume level from 0 to 1. Default is 0.3 */
  volume?: number;
  /** Duration of each note in seconds. Default is 0.3 */
  noteDuration?: number;
  /** Delay between notes in seconds. Default is 0.05 */
  noteDelay?: number;
}

const DEFAULT_CHIME_OPTIONS: Required<ChimeOptions> = {
  volume: 0.3,
  noteDuration: 0.3,
  noteDelay: 0.05,
};

// Musical frequencies for C major chord
const C_MAJOR_CHORD = {
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
};

export const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
};

export const createAudioContext = (): AudioContext | null => {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) {
    return null;
  }

  try {
    return new AudioContextClass();
  } catch {
    return null;
  }
};

export const playNote = (audioContext: AudioContext, frequency: number, startTime: number, options: Required<ChimeOptions>): void => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(options.volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + options.noteDuration);

  oscillator.start(startTime);
  oscillator.stop(startTime + options.noteDuration);
};

export const playChime = (frequencies: number[], options: ChimeOptions = {}): boolean => {
  const audioContext = createAudioContext();
  if (!audioContext) {
    return false;
  }

  const mergedOptions: Required<ChimeOptions> = { ...DEFAULT_CHIME_OPTIONS, ...options };
  const now = audioContext.currentTime;

  frequencies.forEach((freq, index) => {
    const delay = index * mergedOptions.noteDelay;
    playNote(audioContext, freq, now + delay, mergedOptions);
  });

  return true;
};

export const playStopChime = (options: ChimeOptions = {}): boolean => {
  const frequencies = [C_MAJOR_CHORD.C5, C_MAJOR_CHORD.E5, C_MAJOR_CHORD.G5];
  return playChime(frequencies, options);
};

export const playStartChime = (options: ChimeOptions = {}): boolean => {
  const frequencies = [C_MAJOR_CHORD.G5, C_MAJOR_CHORD.E5, C_MAJOR_CHORD.C5];
  return playChime(frequencies, options);
};

export const isAudioSupported = (): boolean => {
  return getAudioContextConstructor() !== undefined;
};
