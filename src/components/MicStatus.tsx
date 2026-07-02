// src/components/MicStatus.tsx
// Animated microphone status indicator

import { MicState } from '../types/audio';

interface Props {
  micState: MicState;
  error: string | null;
}

const STATE_CONFIG: Record<MicState, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: 'Ready',     color: 'bg-zinc-600',   pulse: false },
  requesting: { label: 'Requesting…', color: 'bg-yellow-500', pulse: true },
  listening:  { label: 'Listening', color: 'bg-emerald-500', pulse: true },
  error:      { label: 'Error',     color: 'bg-red-500',    pulse: false },
  file:       { label: 'File Mode', color: 'bg-violet-500', pulse: true },
};

export function MicStatus({ micState, error }: Props) {
  const config = STATE_CONFIG[micState];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="relative flex h-2.5 w-2.5">
          <span
            className={`${config.pulse ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}
          />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
        </div>
        <span className="text-xs font-medium text-white/70 uppercase tracking-widest">
          {config.label}
        </span>
      </div>
      {error && micState === 'error' && (
        <p className="text-xs text-red-400 max-w-[200px] leading-snug">{error}</p>
      )}
    </div>
  );
}
