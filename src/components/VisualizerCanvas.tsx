// src/components/VisualizerCanvas.tsx
// Full-screen canvas component that drives the visual rendering loop

import { useRef, useEffect, useCallback } from 'react';
import { AudioData, VisualizerSettings } from '../types/audio';
import { createRenderer, VisualRenderer } from '../visualizers';

interface Props {
  audioData: AudioData;
  settings: VisualizerSettings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function VisualizerCanvas({ audioData, settings, canvasRef }: Props) {
  const rendererRef = useRef<VisualRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const audioDataRef = useRef<AudioData>(audioData);
  const settingsRef = useRef<VisualizerSettings>(settings);

  // Keep refs current so the animation loop always reads latest values
  audioDataRef.current = audioData;
  settingsRef.current = settings;

  /** Resize canvas to match its CSS display size (respects device pixel ratio) */
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
      // No ctx.scale here — canvas dimensions are already in physical pixels.
      // Visualizers read ctx.canvas.width/height directly, so they draw in
      // physical pixel space which maps correctly to the CSS display size.
      rendererRef.current?.reset();
    }
  }, [canvasRef]);

  /** Main animation loop — called by requestAnimationFrame at ~60fps */
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(timestamp - lastTimeRef.current, 50); // cap at 50ms to handle tab switching
    lastTimeRef.current = timestamp;

    rendererRef.current?.render(ctx, audioDataRef.current, settingsRef.current, dt);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [canvasRef]);

  // Create/replace renderer when mode changes
  useEffect(() => {
    const prev = rendererRef.current;
    rendererRef.current = createRenderer(settings.mode);
    if (prev) {
      // Clear canvas on mode change for a clean transition
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

  // Start animation loop once on mount
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
