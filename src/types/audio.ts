// src/types/audio.ts
// Central type definitions for audio data and visualizer settings

/** Normalized snapshot of audio analysis for a single animation frame */
export interface AudioData {
  /** Overall volume/amplitude 0–1 */
  volume: number;
  /** Low frequency energy (20–300 Hz) — bass/body resonance 0–1 */
  bassEnergy: number;
  /** Mid frequency energy (300–3000 Hz) — guitar body warmth 0–1 */
  midEnergy: number;
  /** High frequency energy (3000–20000 Hz) — string sparkle/pick attack 0–1 */
  highEnergy: number;
  /** Transient/strum intensity — sharp onset detection 0–1 */
  strumIntensity: number;
  /** Raw FFT frequency bin data (0–255 per bin) */
  frequencyData: Uint8Array<ArrayBuffer>;
  /** Raw time-domain waveform data (0–255 per sample) */
  waveformData: Uint8Array<ArrayBuffer>;
}

/** Available visualizer rendering modes */
export type VisualizerMode =
  | 'aurora'
  | 'firelight'
  | 'ocean'
  | 'cosmic'
  | 'sacred';

/** Named color palette */
export type ColorPalette =
  | 'aurora'
  | 'fire'
  | 'ocean'
  | 'cosmic'
  | 'earth'
  | 'golden';

/** All user-adjustable visualizer settings */
export interface VisualizerSettings {
  mode: VisualizerMode;
  palette: ColorPalette;
  /** Microphone input sensitivity multiplier 0.1–3.0 */
  sensitivity: number;
  /** Animation motion intensity multiplier 0.1–2.0 */
  motionIntensity: number;
  /** Canvas background darkness 0–1 (0=transparent trails, 1=full clear) */
  bgDarkness: number;
}

/** Preset theme that overrides a group of settings at once */
export interface PresetTheme {
  name: string;
  icon: string;
  description: string;
  settings: Partial<VisualizerSettings>;
}

/** Current microphone/audio permission and connection state */
export type MicState = 'idle' | 'requesting' | 'listening' | 'error' | 'file';
