// src/App.tsx
// Root application component — assembles canvas + controls + audio

import { useRef, useState, useCallback, useEffect } from 'react';
import { VisualizerSettings } from './types/audio';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { ControlPanel } from './components/ControlPanel';
import {
  takeScreenshot,
  startRecording,
  stopRecording,
  isRecording as getIsRecording,
} from './utils/mediaRecorder';

const DEFAULT_SETTINGS: VisualizerSettings = {
  mode: 'aurora',
  palette: 'aurora',
  sensitivity: 1.2,
  motionIntensity: 1.0,
  bgDarkness: 0.2,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [recordingActive, setRecordingActive] = useState(false);

  const { audioData, micState, error, start, stop, loadFile } = useAudioAnalyzer(settings.sensitivity);

  const handleSettingsChange = useCallback((partial: Partial<VisualizerSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const handleScreenshot = useCallback(() => {
    if (canvasRef.current) takeScreenshot(canvasRef.current);
  }, []);

  const handleRecordToggle = useCallback(() => {
    if (getIsRecording()) {
      stopRecording();
      setRecordingActive(false);
    } else if (canvasRef.current) {
      const started = startRecording(canvasRef.current);
      setRecordingActive(started);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Keep recording state in sync if stopped externally
  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingActive(getIsRecording());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#050508] overflow-hidden">
      {/* Full-screen visualizer canvas */}
      <VisualizerCanvas
        audioData={audioData}
        settings={settings}
        canvasRef={canvasRef}
      />

      {/* Ambient top title (fades on interaction) */}
      <div className="absolute top-5 left-6 pointer-events-none select-none z-10">
        <div className="flex items-center gap-2.5 opacity-60">
          <span className="text-lg">🎸</span>
          <span className="text-white/70 text-sm font-light tracking-[0.2em] uppercase">
            Acoustic Visualizer
          </span>
        </div>
      </div>

      {/* Recording indicator */}
      {recordingActive && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
          bg-red-500/20 backdrop-blur-xl border border-red-500/40 rounded-full px-4 py-1.5
          pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-300 text-xs font-semibold tracking-wide">REC</span>
        </div>
      )}

      {/* Controls panel */}
      <ControlPanel
        settings={settings}
        micState={micState}
        error={error}
        isRecording={recordingActive}
        onSettingsChange={handleSettingsChange}
        onStart={start}
        onStop={stop}
        onScreenshot={handleScreenshot}
        onRecordToggle={handleRecordToggle}
        onFileLoad={loadFile}
        onFullscreen={handleFullscreen}
        canvasRef={canvasRef}
      />
    </div>
  );
}
