// src/visualizers/AuroraStrings.ts
// Aurora Strings — massive flowing wave ribbons that erupt with each chord

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';

interface WaveLayer {
  phase: number;
  speed: number;
  yCenter: number; // 0–1 of canvas height
  ampScale: number;
  hueShift: number;
  width: number;
}

export class AuroraStrings {
  private layers: WaveLayer[] = [
    { phase: 0,   speed: 0.025, yCenter: 0.5,  ampScale: 1.4, hueShift: 0,   width: 5 },
    { phase: 1.2, speed: 0.038, yCenter: 0.4,  ampScale: 1.0, hueShift: 25,  width: 3 },
    { phase: 2.4, speed: 0.018, yCenter: 0.6,  ampScale: 1.2, hueShift: -25, width: 4 },
    { phase: 0.8, speed: 0.045, yCenter: 0.35, ampScale: 0.8, hueShift: 50,  width: 2 },
    { phase: 3.6, speed: 0.022, yCenter: 0.65, ampScale: 0.9, hueShift: -50, width: 3 },
    { phase: 1.6, speed: 0.055, yCenter: 0.3,  ampScale: 0.6, hueShift: 75,  width: 2 },
    { phase: 4.8, speed: 0.020, yCenter: 0.7,  ampScale: 0.7, hueShift: -75, width: 2 },
  ];
  private hueRotation = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, midEnergy, highEnergy, strumIntensity, waveformData } = audioData;
    const motion = settings.motionIntensity;

    this.hueRotation = (this.hueRotation + 0.08 * motion * (1 + volume)) % 360;

    // Trail: short on loud hits, long trails on silence
    const trailAlpha = 0.04 + settings.bgDarkness * 0.25 + strumIntensity * 0.15;
    ctx.fillStyle = `rgba(5,5,8,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);
    const steps = 300;

    this.layers.forEach((layer) => {
      layer.phase += layer.speed * motion * dt * 0.06 * (1 + volume * 3);

      const hue = (primaryHSL.h + layer.hueShift + this.hueRotation) % 360;
      const sat = Math.min(100, primaryHSL.s + midEnergy * 30);
      const lit = Math.min(90, primaryHSL.l + highEnergy * 25);

      // Amplitude: massive when loud, still visible when quiet
      const amplitude = height * (0.08 + volume * 0.35 + midEnergy * 0.2 + strumIntensity * 0.15) * layer.ampScale * motion;
      const lineAlpha = 0.5 + volume * 0.5;

      ctx.beginPath();
      ctx.shadowColor = hslToRgba(hue, sat, lit, 0.9);
      ctx.shadowBlur = 18 + midEnergy * 50 + strumIntensity * 40;
      ctx.strokeStyle = hslToRgba(hue, sat, lit, lineAlpha);
      ctx.lineWidth = layer.width * (1 + strumIntensity * 3 + volume * 2);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const wIdx = Math.floor((i / steps) * (waveformData.length || 1));
        const raw = waveformData.length > 0 ? ((waveformData[wIdx] - 128) / 128) : 0;
        const sine1 = Math.sin(i * 0.025 + layer.phase) * 0.55;
        const sine2 = Math.sin(i * 0.012 + layer.phase * 0.7) * 0.3;
        const y = height * layer.yCenter + (raw * 0.4 + sine1 + sine2) * amplitude;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Sparkle burst on high frequencies
    if (highEnergy > 0.3) {
      const count = Math.floor(highEnergy * 60 * motion);
      for (let i = 0; i < count; i++) {
        const hue = (primaryHSL.h + 60 + this.hueRotation) % 360;
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(hue, 100, 90, Math.random() * highEnergy);
        ctx.shadowColor = hslToRgba(hue, 100, 90, 0.9);
        ctx.shadowBlur = 10;
        ctx.arc(Math.random() * width, Math.random() * height, highEnergy * 4 * Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  reset(): void { this.hueRotation = 0; this.layers.forEach((l, i) => { l.phase = i * 1.2; }); }
}
