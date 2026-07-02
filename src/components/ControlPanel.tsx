// src/components/ControlPanel.tsx
// Main glassmorphism control panel with all user-adjustable settings

import { useState, useCallback } from 'react';
import { VisualizerSettings, MicState, ColorPalette } from '../types/audio';
import { COLOR_PALETTES } from '../utils/colorPalettes';
import { MicStatus } from './MicStatus';
import { ModeSelector } from './ModeSelector';
import { PresetThemes } from './PresetThemes';
import { AudioFileUploader } from './AudioFileUploader';

interface Props {
  settings: VisualizerSettings;
  micState: MicState;
  error: string | null;
  isRecording: boolean;
  onSettingsChange: (partial: Partial<VisualizerSettings>) => void;
  onStart: () => void;
  onStop: () => void;
  onScreenshot: () => void;
  onRecordToggle: () => void;
  onFileLoad: (buffer: ArrayBuffer) => void;
  onFullscreen: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ id, label, value, min, max, step, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-medium text-white/60">{label}</label>
        <span className="text-xs text-white/40 font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full h-1.5 rounded-full appearance-none cursor-pointer
          bg-white/10 accent-violet-400"
      />
    </div>
  );
}

const PALETTES = Object.entries(COLOR_PALETTES) as [ColorPalette, typeof COLOR_PALETTES[ColorPalette]][];

export function ControlPanel({
  settings, micState, error, isRecording,
  onSettingsChange, onStart, onStop,
  onScreenshot, onRecordToggle, onFileLoad, onFullscreen,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const isListening = micState === 'listening' || micState === 'file';

  const handleStartStop = useCallback(() => {
    if (isListening) onStop();
    else onStart();
  }, [isListening, onStart, onStop]);

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        id="panel-toggle"
        onClick={() => setIsOpen(p => !p)}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-xl
          bg-black/40 backdrop-blur-xl border border-white/15
          flex items-center justify-center text-white/70 hover:text-white
          hover:bg-black/60 transition-all duration-200 shadow-xl"
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
      >
        {isOpen ? '✕' : '⚙️'}
      </button>

      {/* Slide-in panel */}
      <div className={`
        fixed top-0 right-0 h-full z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full w-[280px] bg-black/50 backdrop-blur-2xl
          border-l border-white/10 shadow-2xl overflow-y-auto
          flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎸</div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">Acoustic Visualizer</h1>
                <MicStatus micState={micState} error={error} />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

            {/* Start / Stop */}
            <button
              id="mic-toggle"
              onClick={handleStartStop}
              disabled={micState === 'requesting'}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-sm
                flex items-center justify-center gap-2.5
                transition-all duration-200 active:scale-95
                ${isListening
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                  : 'bg-violet-600/80 border border-violet-400/40 text-white hover:bg-violet-500/90 shadow-lg shadow-violet-500/20'
                }
                ${micState === 'requesting' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-base">
                {micState === 'requesting' ? '⏳' : isListening ? '⏹' : '🎤'}
              </span>
              {micState === 'requesting' ? 'Requesting…' : isListening ? 'Stop Listening' : 'Start Listening'}
            </button>

            {/* Mode selector */}
            <ModeSelector
              currentMode={settings.mode}
              onSelect={(mode) => onSettingsChange({ mode })}
            />

            {/* Palette */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Color Palette
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PALETTES.map(([key, pal]) => (
                  <button
                    key={key}
                    id={`palette-${key}`}
                    onClick={() => onSettingsChange({ palette: key })}
                    title={pal.name}
                    className={`
                      h-10 rounded-lg transition-all duration-200
                      ${settings.palette === key
                        ? 'ring-2 ring-white/60 scale-105'
                        : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
                      }
                    `}
                    style={{ background: pal.gradient }}
                  >
                    <span className="sr-only">{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-3.5">
              <Slider
                id="sensitivity"
                label="Sensitivity"
                value={settings.sensitivity}
                min={0.1} max={3} step={0.05}
                onChange={(v) => onSettingsChange({ sensitivity: v })}
              />
              <Slider
                id="motion-intensity"
                label="Motion Intensity"
                value={settings.motionIntensity}
                min={0.1} max={2} step={0.05}
                onChange={(v) => onSettingsChange({ motionIntensity: v })}
              />
              <Slider
                id="bg-darkness"
                label="Trail Length"
                value={1 - settings.bgDarkness}
                min={0} max={1} step={0.01}
                onChange={(v) => onSettingsChange({ bgDarkness: 1 - v })}
              />
            </div>

            {/* Preset themes */}
            <PresetThemes onApply={onSettingsChange} />

            {/* Audio file upload */}
            <AudioFileUploader onFileLoaded={onFileLoad} />

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Capture
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="screenshot-btn"
                  onClick={onScreenshot}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl
                    bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25
                    transition-all duration-200 text-white/70 hover:text-white"
                >
                  <span className="text-lg">📷</span>
                  <span className="text-xs font-medium">Screenshot</span>
                </button>
                <button
                  id="record-btn"
                  onClick={onRecordToggle}
                  className={`
                    flex flex-col items-center gap-1 py-3 px-2 rounded-xl
                    border transition-all duration-200
                    ${isRecording
                      ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25 text-white/70 hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg">{isRecording ? '⏹' : '⏺'}</span>
                  <span className="text-xs font-medium">{isRecording ? 'Stop Rec' : 'Record'}</span>
                </button>
              </div>
              <button
                id="fullscreen-btn"
                onClick={onFullscreen}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                  bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25
                  transition-all duration-200 text-white/60 hover:text-white text-sm"
              >
                <span>⛶</span>
                <span className="font-medium">Fullscreen</span>
              </button>
            </div>

          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-white/10">
            <p className="text-[10px] text-white/25 text-center">
              Play guitar · Watch it come alive ✨
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
