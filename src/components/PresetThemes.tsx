// src/components/PresetThemes.tsx
// Named preset themes that configure multiple settings at once

import { VisualizerSettings } from '../types/audio';
import { PresetTheme } from '../types/audio';

interface Props {
  onApply: (overrides: Partial<VisualizerSettings>) => void;
}

const PRESETS: PresetTheme[] = [
  {
    name: 'Northern Lights',
    icon: '🌌',
    description: 'Ethereal aurora waves',
    settings: { mode: 'aurora', palette: 'aurora', bgDarkness: 0.15, motionIntensity: 1.2, sensitivity: 1.2 },
  },
  {
    name: 'Campfire',
    icon: '🔥',
    description: 'Warm dancing flames',
    settings: { mode: 'firelight', palette: 'fire', bgDarkness: 0.4, motionIntensity: 1.0, sensitivity: 1.0 },
  },
  {
    name: 'Deep Space',
    icon: '🚀',
    description: 'Stars and cosmic echoes',
    settings: { mode: 'cosmic', palette: 'cosmic', bgDarkness: 0.08, motionIntensity: 0.8, sensitivity: 1.5 },
  },
  {
    name: 'Golden Hour',
    icon: '🌅',
    description: 'Warm sacred geometry',
    settings: { mode: 'sacred', palette: 'golden', bgDarkness: 0.25, motionIntensity: 1.1, sensitivity: 1.0 },
  },
];

export function PresetThemes({ onApply }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Presets
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            id={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onApply(preset.settings)}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all duration-200 text-center group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform duration-200">
              {preset.icon}
            </span>
            <span className="text-xs font-semibold text-white/80 leading-tight">{preset.name}</span>
            <span className="text-[10px] text-white/40 leading-tight">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
