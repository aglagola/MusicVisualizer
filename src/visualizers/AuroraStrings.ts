// src/visualizers/AuroraStrings.ts
// Aurora Strings — layered flowing sine-wave ribbons that pulse with chords
// Inspired by the northern lights: smooth color gradients, organic wave motion

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp } from '../utils/canvasUtils';

interface WaveLayer {
  /** Phase offset for this wave layer */
  phase: number;
  /** Phase speed (animation speed) */
  speed: number;
  /** Vertical center position (0–1 of canvas height) */
  yOffset: number;
  /** Amplitude multiplier for this layer */
  ampScale: number;
  /** Hue offset relative to palette primary */
  hueShift: number;
  /** Line width */
  width: number;
}

export class AuroraStrings {
  private layers: WaveLayer[];
  private time = 0;
  private hueRotation = 0;

  constructor() {
    // Create 7 wave layers with different characteristics
    this.layers = [
      { phase: 0,    speed: 0.008, yOffset: 0.35, ampScale: 1.0, hueShift: 0,   width: 3 },
      { phase: 1.2,  speed: 0.011, yOffset: 0.42, ampScale: 0.8, hueShift: 20,  width: 2 },
      { phase: 2.4,  speed: 0.006, yOffset: 0.50, ampScale: 1.2, hueShift: -20, width: 4 },
      { phase: 0.8,  speed: 0.014, yOffset: 0.58, ampScale: 0.7, hueShift: 40,  width: 2 },
      { phase: 3.6,  speed: 0.009, yOffset: 0.65, ampScale: 0.9, hueShift: -40, width: 3 },
      { phase: 1.6,  speed: 0.013, yOffset: 0.28, ampScale: 0.6, hueShift: 60,  width: 1.5 },
      { phase: 4.8,  speed: 0.007, yOffset: 0.72, ampScale: 0.5, hueShift: -60, width: 1.5 },
    ];
  }

  render(
    ctx: CanvasRenderingContext2D,
    audioData: AudioData,
    settings: VisualizerSettings,
    dt: number
  ): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, midEnergy, highEnergy, strumIntensity, waveformData } = audioData;
    const motion = settings.motionIntensity;

    // Update time for wave animation
    this.time += dt * 0.001;

    // Slowly rotate hue for living color effect
    this.hueRotation = (this.hueRotation + 0.05 * motion) % 360;

    // Strum creates a ripple impulse across all wave amplitudes
    const strumBoost = 1 + strumIntensity * 3 * motion;

    // Clear with trail effect
    const alpha = lerp(0.03, 0.15, settings.bgDarkness);
    ctx.fillStyle = `rgba(5, 5, 8, ${alpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);
    const steps = Math.min(waveformData.length, 256);

    this.layers.forEach((layer) => {
      // Update wave phase
      layer.phase += layer.speed * motion * (1 + volume * 2);

      const hue = (primaryHSL.h + layer.hueShift + this.hueRotation) % 360;
      const sat = primaryHSL.s + midEnergy * 20;
      const lit = primaryHSL.l + highEnergy * 15;
      const waveAlpha = lerp(0.3, 0.9, volume * 0.8 + midEnergy * 0.2);

      ctx.beginPath();
      ctx.shadowColor = hslToRgba(hue, sat, lit, 0.6);
      ctx.shadowBlur = 20 + midEnergy * 40;
      ctx.strokeStyle = hslToRgba(hue, sat, lit, waveAlpha);
      ctx.lineWidth = layer.width * (1 + strumIntensity * 2);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const waveformValue = waveformData.length > 0
          ? ((waveformData[Math.floor((i / steps) * waveformData.length)] - 128) / 128)
          : 0;

        // Combine: slow sine base + waveform detail + strum distortion
        const sineBase = Math.sin(i * 0.02 + layer.phase) * 0.5;
        const wavDetail = waveformValue * 0.3;
        const combined = (sineBase + wavDetail) * strumBoost * layer.ampScale;

        // Amplitude driven by volume and midEnergy
        const amplitude = height * 0.12 * (0.3 + volume * 0.7 + midEnergy * 0.4) * motion;
        const y = height * layer.yOffset + combined * amplitude;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    // Add sparkle dots on high-frequency content
    if (highEnergy > 0.15) {
      const sparkCount = Math.floor(highEnergy * 30 * motion);
      for (let s = 0; s < sparkCount; s++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const sr = highEnergy * 3 * Math.random();
        const sparkHue = (primaryHSL.h + 60 + this.hueRotation) % 360;
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(sparkHue, 100, 85, Math.random() * highEnergy);
        ctx.shadowColor = hslToRgba(sparkHue, 100, 85, 0.8);
        ctx.shadowBlur = 8;
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
  }

  reset(): void {
    this.time = 0;
    this.hueRotation = 0;
    this.layers.forEach((l, i) => {
      l.phase = i * 1.2;
    });
  }
}
