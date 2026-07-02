// src/visualizers/OceanPulse.ts
// Ocean Pulse — deep waveforms that swell massively with fingerpicking energy

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';

interface RippleRing {
  x: number; y: number;
  radius: number; maxRadius: number;
  alpha: number; hue: number; thickness: number;
}

export class OceanPulse {
  private ripples: RippleRing[] = [];
  private time = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity, waveformData } = audioData;
    const motion = settings.motionIntensity;
    const primaryHSL = parseHSL(palette.primary);

    this.time += dt * 0.001;
    const breathe = Math.sin(this.time * 0.6) * 0.5 + 0.5;

    const trailAlpha = 0.03 + settings.bgDarkness * 0.18 + strumIntensity * 0.08;
    ctx.fillStyle = `rgba(5,5,8,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Spawn ripple rings on any significant audio event
    if (strumIntensity > 0.05 || (volume > 0.3 && Math.random() < 0.3)) {
      const count = 1 + Math.floor(strumIntensity * 3);
      for (let r = 0; r < count; r++) {
        this.ripples.push({
          x: width * (0.2 + Math.random() * 0.6),
          y: height * (0.3 + Math.random() * 0.4),
          radius: 5,
          maxRadius: 100 + strumIntensity * 350 + bassEnergy * 200,
          alpha: 0.6 + strumIntensity * 0.4,
          hue: (primaryHSL.h + (Math.random() - 0.5) * 60 + 360) % 360,
          thickness: 1.5 + strumIntensity * 5 + bassEnergy * 3,
        });
      }
    }

    // Update and draw ripples
    this.ripples = this.ripples.filter(r => r.alpha > 0.01 && r.radius < r.maxRadius * 1.1);
    for (const r of this.ripples) {
      r.radius += (4 + bassEnergy * 8 + volume * 6) * motion * (dt / 16);
      r.alpha *= 0.975;
      const progress = r.radius / r.maxRadius;
      const ringAlpha = r.alpha * Math.max(0, 1 - progress);

      for (let i = 0; i < 3; i++) {
        const rr = r.radius - i * 10;
        if (rr <= 0) continue;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = hslToRgba(r.hue, 85, 65, ringAlpha * (1 - i * 0.3));
        ctx.shadowColor = hslToRgba(r.hue, 95, 75, 0.6);
        ctx.shadowBlur = 20 + bassEnergy * 20;
        ctx.lineWidth = r.thickness * (1 - i * 0.3);
        ctx.stroke();
      }
    }

    // Draw 5 layered waveforms — huge amplitude response
    const waveCount = 5;
    for (let w = 0; w < waveCount; w++) {
      const t = w / (waveCount - 1);
      const yCenter = height * (0.3 + t * 0.4);
      const phase = this.time * (0.4 + w * 0.2) * motion;
      const layerAlpha = (0.7 - t * 0.4) * (0.3 + volume * 0.7);
      const hue = (primaryHSL.h + w * 18) % 360;
      const lit = primaryHSL.l + (1 - t) * 20;

      // Big amplitude — waveform fills a large portion of the canvas
      const amplitude = height * (0.06 + volume * 0.28 + midEnergy * 0.18 + bassEnergy * 0.12 + breathe * 0.04 * (1-t)) * (1.3 - t * 0.6) * motion;

      ctx.beginPath();
      ctx.shadowColor = hslToRgba(hue, primaryHSL.s, lit, 0.9);
      ctx.shadowBlur = 25 + bassEnergy * 40 + strumIntensity * 30;
      ctx.strokeStyle = hslToRgba(hue, primaryHSL.s, lit, layerAlpha);
      ctx.lineWidth = (4 - t * 2.5) * (1 + bassEnergy * 1.5);
      ctx.lineJoin = 'round';

      const steps = Math.min(waveformData.length || 256, 400);
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const raw = waveformData.length > 0 ? ((waveformData[Math.floor((i/steps) * waveformData.length)] - 128) / 128) : 0;
        const sine = Math.sin(i * 0.018 + phase) * 0.35;
        const y = yCenter + (raw * 0.65 + sine) * amplitude;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Sparkle on water surface
    if (highEnergy > 0.15 || midEnergy > 0.4) {
      const n = Math.floor((highEnergy * 0.6 + midEnergy * 0.4) * 35 * motion);
      for (let i = 0; i < n; i++) {
        const hue = (primaryHSL.h + 40) % 360;
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(hue, 90, 88, Math.random() * (highEnergy + midEnergy * 0.5) * 0.7);
        ctx.shadowColor = hslToRgba(hue, 100, 92, 0.9);
        ctx.shadowBlur = 8;
        ctx.arc(Math.random()*width, height*(0.2 + Math.random()*0.6), 1 + highEnergy * 3 * Math.random(), 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  reset(): void { this.ripples = []; this.time = 0; }
}
