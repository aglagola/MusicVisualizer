// src/components/ModeSelector.tsx
// Visual mode selector cards

import { VisualizerMode } from '../types/audio';
import { MODE_INFO } from '../visualizers';

interface Props {
  currentMode: VisualizerMode;
  onSelect: (mode: VisualizerMode) => void;
}

const MODES = Object.entries(MODE_INFO) as [VisualizerMode, typeof MODE_INFO[VisualizerMode]][];

export function ModeSelector({ currentMode, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        Visual Mode
      </label>
      <div className="grid grid-cols-1 gap-1.5">
        {MODES.map(([mode, info]) => {
          const isActive = mode === currentMode;
          return (
            <button
              key={mode}
              id={`mode-${mode}`}
              onClick={() => onSelect(mode)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                ${isActive
                  ? 'bg-white/15 border border-white/30 shadow-lg shadow-white/5'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <span className="text-lg leading-none" role="img" aria-label={info.label}>
                {info.icon}
              </span>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {info.label}
                </div>
                <div className="text-xs text-white/40 truncate">{info.description}</div>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
