// src/components/VisualizerCanvas.tsx
// Full-screen canvas that drives a single RAF loop: reads audio + renders visuals

import { useRef, useEffect, useCallback } from 'react';
import { AudioEngine } from '../audio/audioEngine';
import { VisualizerSettings } from '../types/audio';
import { createRenderer, VisualRenderer } from '../visualizers';

interface Props {
  /** Direct reference to the audio engine — read each frame, no React state */
  engineRef: React.MutableRefObject<AudioEngine | null>;
  settings: VisualizerSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function VisualizerCanvas({ engineRef, settings, canvasRef }: Props) {
  const rendererRef = useRef<VisualRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const settingsRef = useRef<VisualizerSettings>(settings);

  // Keep settings ref current so the RAF closure always sees latest values
  settingsRef.current = settings;

  /** Resize canvas to fill its CSS display area at device pixel resolution */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const newW = Math.round(rect.width * dpr);
    const newH = Math.round(rect.height * dpr);
    if (canvas.width !== newW || canvas.height !== newH) {
      canvas.width = newW;
      canvas.height = newH;
      // Canvas dimensions are physical pixels. No ctx.scale needed —
      // all visualizers draw directly in physical pixel space.
      rendererRef.current?.reset();
    }
  }, [canvasRef]);

  /**
   * Single RAF loop: reads fresh audio data from the engine, then renders.
   * Keeping audio reading and rendering in the same loop guarantees they
   * are always in sync — no two-loop latency or React state batching delays.
   */
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cap dt to 50ms to handle tab-switching pauses gracefully
    const dt = Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    // Read the latest audio data directly from the engine each frame
    const currentSettings = settingsRef.current;
    const audioData = engineRef.current
      ? engineRef.current.getAudioData(currentSettings.sensitivity)
      : null;

    if (audioData && rendererRef.current) {
      rendererRef.current.render(ctx, audioData, currentSettings, dt);
    } else if (rendererRef.current) {
      // No audio active — still run idle animation with silent data
      rendererRef.current.render(ctx, {
        volume: 0, bassEnergy: 0, midEnergy: 0, highEnergy: 0, strumIntensity: 0,
        frequencyData: new Uint8Array(new ArrayBuffer(0)),
        waveformData: new Uint8Array(new ArrayBuffer(0)),
      }, currentSettings, dt);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [canvasRef, engineRef]);

  // Create/replace renderer when mode changes
  useEffect(() => {
    const prev = rendererRef.current;
    rendererRef.current = createRenderer(settings.mode);
    if (prev) {
      // Hard-clear on mode change for a clean transition
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#050508';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [settings.mode, canvasRef]);

  // Start the single RAF loop on mount, wire up resize observer
  useEffect(() => {
    resizeCanvas();
    animFrameRef.current = requestAnimationFrame(animate);
    const observer = new ResizeObserver(resizeCanvas);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
    };
  }, [animate, resizeCanvas, canvasRef]);

  return (
    <canvas
      ref={(el) => { (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el; }}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
      aria-label="Music visualizer canvas"
    />
  );
}
