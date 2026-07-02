// src/visualizers/index.ts
// Visualizer factory — returns the correct renderer for a given mode

import { AuroraStrings } from './AuroraStrings';
import { Firelight } from './Firelight';
import { OceanPulse } from './OceanPulse';
import { CosmicEcho } from './CosmicEcho';
import { SacredGeometry } from './SacredGeometry';
import { VisualizerMode, AudioData, VisualizerSettings } from '../types/audio';

/** Common interface all visualizer renderers must implement */
export interface VisualRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    audioData: AudioData,
    settings: VisualizerSettings,
    dt: number
  ): void;
  reset(): void;
}

/** Map of mode name to renderer class */
const RENDERERS: Record<VisualizerMode, () => VisualRenderer> = {
  aurora:    () => new AuroraStrings(),
  firelight: () => new Firelight(),
  ocean:     () => new OceanPulse(),
  cosmic:    () => new CosmicEcho(),
  sacred:    () => new SacredGeometry(),
};

/** Create a fresh renderer instance for the given mode */
export function createRenderer(mode: VisualizerMode): VisualRenderer {
  return RENDERERS[mode]();
}

export const MODE_INFO: Record<VisualizerMode, { label: string; icon: string; description: string }> = {
  aurora:    { label: 'Aurora Strings', icon: '〰️', description: 'Flowing wave ribbons that pulse with chords' },
  firelight: { label: 'Firelight',      icon: '🔥', description: 'Warm glowing particles that flare with strums' },
  ocean:     { label: 'Ocean Pulse',    icon: '🌊', description: 'Slow waveforms that flow with fingerpicking' },
  cosmic:    { label: 'Cosmic Echo',    icon: '✨', description: 'Stars and ripples reacting to resonance' },
  sacred:    { label: 'Sacred Geometry',icon: '🔮', description: 'Mandala shapes expanding with each strum' },
};

export type { VisualizerMode };
