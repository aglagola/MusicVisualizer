// src/visualizers/OceanPulse.ts
// Ocean Pulse — deep layered waveforms with glow trails for soft fingerpicking

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp } from '../utils/canvasUtils';

interface RippleRing {
  radius: number;
  maxRadius: number;
  alpha: number;
  x: number;
  y: number;
  hue: number;
}

export class OceanPulse {
  private ripples: RippleRing[] = [];
  private time = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity, waveformData } = audioData;
    const motion = settings.motionIntensity;

    this.time += dt * 0.001;
    const breathe = Math.sin(this.time * 0.5) * 0.5 + 0.5;

    const trailAlpha = lerp(0.02, 0.12, settings.bgDarkness);
    ctx.fillStyle = `rgba(5, 5, 8, ${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);

    if (strumIntensity > 0.1) {
      this.ripples.push({
        radius: 5,
        maxRadius: 150 + strumIntensity * 200 * motion,
        alpha: strumIntensity * 0.8,
        x: width * 0.5 + (Math.random() - 0.5) * width * 0.3,
        y: height * 0.5 + (Math.random() - 0.5) * height * 0.2,
        hue: (primaryHSL.h + Math.random() * 40 - 20) % 360,
      });
    }

    // Update and draw ripple rings
    this.ripples = this.ripples.filter(r => r.alpha > 0.005);
    for (const r of this.ripples) {
      r.radius += (2 + bassEnergy * 4) * motion;
      r.alpha *= 0.97;
      const ringAlpha = r.alpha * Math.min(1, (1 - r.radius / r.maxRadius) * 2);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = hslToRgba(r.hue, 80, 65, ringAlpha);
      ctx.shadowColor = hslToRgba(r.hue, 90, 70, 0.5);
      ctx.shadowBlur = 15;
      ctx.lineWidth = 1.5 + midEnergy * 3;
      ctx.stroke();
    }

    // Draw 4 layered waveforms
    const waveCount = 4;
    for (let w = 0; w < waveCount; w++) {
      const layerT = w / (waveCount - 1);
      const yCenter = height * lerp(0.35, 0.65, layerT);
      const phaseOffset = this.time * (0.3 + w * 0.15) * motion;
      const layerAlpha = lerp(0.6, 0.15, layerT) * (0.3 + volume * 0.7);
      const ampMultiplier = lerp(1.2, 0.5, layerT);
      const hue = (primaryHSL.h + w * 15) % 360;
      const lit = primaryHSL.l + (1 - layerT) * 15;

      ctx.beginPath();
      ctx.shadowColor = hslToRgba(hue, primaryHSL.s, lit, 0.8);
      ctx.shadowBlur = 20 + bassEnergy * 30;
      ctx.strokeStyle = hslToRgba(hue, primaryHSL.s, lit, layerAlpha);
      ctx.lineWidth = lerp(3, 1, layerT) * (1 + bassEnergy * 2);
      ctx.lineJoin = 'round';

      const steps = Math.min(waveformData.length || 256, 512);
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const rawSample = waveformData.length > 0
          ? ((waveformData[Math.floor((i / steps) * waveformData.length)] - 128) / 128) : 0;
        const breathSine = Math.sin(i * 0.015 + phaseOffset) * breathe * 0.3;
        const amplitude = height * 0.12 * (0.3 + volume * 0.7 + midEnergy * 0.3) * ampMultiplier * motion;
        const y = yCenter + (rawSample * 0.7 + breathSine) * amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // High-frequency sparkles
    if (highEnergy > 0.08) {
      const sparkCount = Math.floor(highEnergy * 25 * motion);
      for (let i = 0; i < sparkCount; i++) {
        const sx = Math.random() * width;
        const sy = height * lerp(0.3, 0.7, Math.random());
        const sr = 1 + highEnergy * 2 * Math.random();
        const sparkHue = (primaryHSL.h + 30) % 360;
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(sparkHue, 90, 85, Math.random() * highEnergy * 0.8);
        ctx.shadowColor = hslToRgba(sparkHue, 100, 90, 0.8);
        ctx.shadowBlur = 6;
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  reset(): void {
    this.ripples = [];
    this.time = 0;
  }
}
