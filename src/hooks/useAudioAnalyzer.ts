// src/hooks/useAudioAnalyzer.ts
// React hook that manages the AudioEngine lifecycle and microphone permissions

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine } from '../audio/audioEngine';
import { AudioData, MicState } from '../types/audio';

interface UseAudioAnalyzerReturn {
  audioData: AudioData;
  micState: MicState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  loadFile: (buffer: ArrayBuffer) => Promise<void>;
}

/** Empty/silent audio data returned when not listening */
const SILENT_DATA: AudioData = {
  volume: 0,
  bassEnergy: 0,
  midEnergy: 0,
  highEnergy: 0,
  strumIntensity: 0,
  frequencyData: new Uint8Array(new ArrayBuffer(0)),
  waveformData: new Uint8Array(new ArrayBuffer(0)),
};

/**
 * useAudioAnalyzer — manages the full lifecycle of audio capture and analysis.
 *
 * @param sensitivity - Multiplier applied to all audio energy values (from UI slider)
 * @returns Normalized audio data plus controls to start/stop listening
 */
export function useAudioAnalyzer(sensitivity: number = 1): UseAudioAnalyzerReturn {
  const [audioData, setAudioData] = useState<AudioData>(SILENT_DATA);
  const [micState, setMicState] = useState<MicState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Use a ref for the engine so it persists without causing re-renders
  const engineRef = useRef<AudioEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sensitivityRef = useRef(sensitivity);

  // Keep sensitivity ref in sync without restarting the loop
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  /** Internal animation loop — polls audio data at display refresh rate */
  const startLoop = useCallback(() => {
    const tick = () => {
      if (!engineRef.current) return;
      const data = engineRef.current.getAudioData(sensitivityRef.current);
      setAudioData(data);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  /** Start capturing from the microphone */
  const start = useCallback(async () => {
    setError(null);
    setMicState('requesting');

    try {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine({ fftSize: 2048 });
      }

      await engineRef.current.startMicrophone();
      setMicState('listening');
      startLoop();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      setMicState('error');
      console.error('AudioEngine start error:', err);
    }
  }, [startLoop]);

  /** Stop listening and reset state */
  const stop = useCallback(() => {
    stopLoop();
    engineRef.current?.stop();
    setAudioData(SILENT_DATA);
    setMicState('idle');
  }, [stopLoop]);

  /** Load and analyze an audio file buffer */
  const loadFile = useCallback(async (buffer: ArrayBuffer) => {
    setError(null);
    stopLoop();

    try {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine({ fftSize: 2048 });
      }

      await engineRef.current.startAudioBuffer(buffer);
      setMicState('file');
      startLoop();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(message);
      setMicState('error');
    }
  }, [startLoop, stopLoop]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopLoop();
      engineRef.current?.destroy();
    };
  }, [stopLoop]);

  return { audioData, micState, error, start, stop, loadFile };
}
