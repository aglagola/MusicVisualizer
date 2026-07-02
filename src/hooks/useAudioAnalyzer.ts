// src/hooks/useAudioAnalyzer.ts
// React hook that manages the AudioEngine lifecycle and microphone permissions

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine } from '../audio/audioEngine';
import { MicState } from '../types/audio';

interface UseAudioAnalyzerReturn {
  /** Direct reference to the engine — read audio data from this each RAF frame */
  engineRef: React.MutableRefObject<AudioEngine | null>;
  micState: MicState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  loadFile: (buffer: ArrayBuffer) => Promise<void>;
}

/**
 * useAudioAnalyzer — manages microphone/file audio capture lifecycle.
 *
 * DESIGN: We expose engineRef directly so the canvas RAF loop can call
 * engine.getAudioData() each frame without React state updates in between.
 * This eliminates the two-loop synchronization issue and ensures the canvas
 * always reads the freshest audio data on every frame.
 */
export function useAudioAnalyzer(sensitivity: number = 1): UseAudioAnalyzerReturn {
  const [micState, setMicState] = useState<MicState>('idle');
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<AudioEngine | null>(null);
  const sensitivityRef = useRef(sensitivity);

  // Keep sensitivity ref current without any side effects
  sensitivityRef.current = sensitivity;

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      setMicState('error');
      console.error('AudioEngine start error:', err);
    }
  }, []);

  /** Stop listening and reset state */
  const stop = useCallback(() => {
    engineRef.current?.stop();
    setMicState('idle');
  }, []);

  /** Load and analyze an audio file buffer */
  const loadFile = useCallback(async (buffer: ArrayBuffer) => {
    setError(null);
    try {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine({ fftSize: 2048 });
      }
      await engineRef.current.startAudioBuffer(buffer);
      setMicState('file');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(message);
      setMicState('error');
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  return { engineRef, micState, error, start, stop, loadFile };
}
