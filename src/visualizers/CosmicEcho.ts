// src/visualizers/CosmicEcho.ts
// Cosmic Echo — star field with expanding circular ripples reacting to resonance

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp } from '../utils/canvasUtils';

interface Star {
  x: number; y: number;
  baseSize: number;
  twinkle: number; // Phase offset for twinkling
  hue: number;
}

interface EchoRing {
  x: number; y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  hue: number;
  thickness: number;
}

export class CosmicEcho {
  private stars: Star[] = [];
  private rings: EchoRing[] = [];
  private time = 0;
  private initialized = false;

  private initStars(width: number, height: number, primaryHue: number): void {
    this.stars = [];
    const count = 200;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseSize: 0.5 + Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2,
        hue: (primaryHue + (Math.random() - 0.5) * 60) % 360,
      });
    }
    this.initialized = true;
  }

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity } = audioData;
    const motion = settings.motionIntensity;
    const primaryHSL = parseHSL(palette.primary);

    this.time += dt * 0.001;

    if (!this.initialized || this.stars.length === 0) {
      this.initStars(width, height, primaryHSL.h);
    }

    const trailAlpha = lerp(0.04, 0.18, settings.bgDarkness);
    ctx.fillStyle = `rgba(5, 5, 8, ${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Spawn echo rings on strum or bass hit
    if (strumIntensity > 0.08) {
      const cx = width * 0.5 + (Math.random() - 0.5) * width * 0.4;
      const cy = height * 0.5 + (Math.random() - 0.5) * height * 0.4;
      this.rings.push({
        x: cx, y: cy,
        radius: 10,
        maxRadius: 80 + strumIntensity * 300 + bassEnergy * 150,
        alpha: 0.7 + strumIntensity * 0.3,
        hue: (primaryHSL.h + Math.random() * 60 - 30) % 360,
        thickness: 1.5 + strumIntensity * 4,
      });
    }

    // Draw stars — twinkling with highEnergy
    for (const star of this.stars) {
      star.twinkle += 0.02 * motion;
      const twinkleFactor = (Math.sin(star.twinkle) + 1) * 0.5;
      const size = star.baseSize * (0.5 + twinkleFactor * 0.5 + highEnergy * 1.5);
      const alpha = 0.3 + twinkleFactor * 0.4 + highEnergy * 0.3;
      const lit = 70 + twinkleFactor * 20 + highEnergy * 10;

      ctx.beginPath();
      ctx.fillStyle = hslToRgba(star.hue, 80, lit, alpha);
      ctx.shadowColor = hslToRgba(star.hue, 90, 80, 0.6);
      ctx.shadowBlur = size * 4;
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update and draw echo rings
    this.rings = this.rings.filter(r => r.alpha > 0.01);
    for (const r of this.rings) {
      r.radius += (3 + bassEnergy * 5 + midEnergy * 3) * motion;
      r.alpha *= 0.975;

      const progress = r.radius / r.maxRadius;
      const ringAlpha = r.alpha * Math.max(0, 1 - progress);

      // Draw multiple concentric rings for depth
      for (let i = 0; i < 3; i++) {
        const rr = r.radius - i * 8;
        if (rr <= 0) continue;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = hslToRgba(r.hue, 80, 65, ringAlpha * (1 - i * 0.3));
        ctx.shadowColor = hslToRgba(r.hue, 90, 75, 0.5);
        ctx.shadowBlur = 20;
        ctx.lineWidth = r.thickness * (1 - i * 0.25);
        ctx.stroke();
      }
    }

    // Central nebula glow driven by volume
    if (volume > 0.01) {
      const nebula = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, height * 0.4);
      nebula.addColorStop(0, hslToRgba(primaryHSL.h, 70, 40, 0.08 * volume));
      nebula.addColorStop(0.5, hslToRgba((primaryHSL.h + 30) % 360, 60, 30, 0.04 * bassEnergy));
      nebula.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.shadowBlur = 0;
  }

  reset(): void {
    this.rings = [];
    this.time = 0;
    this.initialized = false;
  }
}
