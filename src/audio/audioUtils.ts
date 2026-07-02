// src/audio/audioUtils.ts
// Pure utility functions for audio signal processing

/**
 * Exponential smoothing — blends previous value toward next value.
 * factor near 0 = very smooth (slow), factor near 1 = instant response.
 * Used to prevent jittery visuals from raw audio data.
 */
export function smoothValue(prev: number, next: number, factor: number): number {
  return prev + (next - prev) * factor;
}

/**
 * Compute average energy in a frequency band by summing FFT bins
 * that fall within [lowHz, highHz]. Returns a normalized 0–1 value.
 *
 * @param fftData    - Uint8Array from AnalyserNode.getByteFrequencyData()
 * @param sampleRate - AudioContext.sampleRate (typically 44100 or 48000)
 * @param fftSize    - The AnalyserNode.fftSize (number of time-domain samples)
 * @param lowHz      - Lower bound of the frequency band in Hz
 * @param highHz     - Upper bound of the frequency band in Hz
 */
export function computeBandEnergy(
  fftData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  lowHz: number,
  highHz: number
): number {
  // Each bin represents: sampleRate / fftSize Hz
  const binHz = sampleRate / fftSize;
  const lowBin = Math.max(0, Math.floor(lowHz / binHz));
  const highBin = Math.min(fftData.length - 1, Math.ceil(highHz / binHz));

  if (lowBin >= highBin) return 0;

  let sum = 0;
  for (let i = lowBin; i <= highBin; i++) {
    sum += fftData[i];
  }

  // Normalize: divide by 255 (max uint8) and by bin count
  return sum / ((highBin - lowBin + 1) * 255);
}

/**
 * Compute overall RMS amplitude from time-domain waveform data.
 * waveformData values are 0–255, with 128 as the zero crossing.
 * Returns a normalized 0–1 value.
 */
export function computeVolume(waveformData: Uint8Array): number {
  let sumSquares = 0;
  for (let i = 0; i < waveformData.length; i++) {
    // Center around zero (-1 to +1 range)
    const sample = (waveformData[i] - 128) / 128;
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / waveformData.length);
}

/**
 * Simple onset/transient detector for strum detection.
 * Detects sudden increases in volume (energy rise above threshold).
 * Returns a 0–1 value representing strum intensity.
 */
export function detectStrum(
  prevVolume: number,
  currVolume: number,
  threshold: number = 0.05
): number {
  const delta = currVolume - prevVolume;
  if (delta < threshold) return 0;
  // Clamp and normalize the strum intensity
  return Math.min(1, delta / 0.3);
}

/** Linear interpolation between two values */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Map a value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
