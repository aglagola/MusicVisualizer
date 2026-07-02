// src/visualizers/CosmicEcho.ts
// Cosmic Echo — star field + violent ring explosions on every strum

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';

interface Star { x: number; y: number; size: number; twinkle: number; hue: number; }
interface EchoRing { x: number; y: number; radius: number; maxRadius: number; alpha: number; hue: number; thickness: number; }

export class CosmicEcho {
  private stars: Star[] = [];
  private rings: EchoRing[] = [];
  private time = 0;
  private initialized = false;

  private initStars(width: number, height: number, hue: number): void {
    this.stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      size: 0.5 + Math.random() * 2.5,
      twinkle: Math.random() * Math.PI * 2,
      hue: (hue + (Math.random() - 0.5) * 80 + 360) % 360,
    }));
    this.initialized = true;
  }

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity } = audioData;
    const motion = settings.motionIntensity;
    const primaryHSL = parseHSL(palette.primary);

    this.time += dt * 0.001;

    if (!this.initialized) this.initStars(width, height, primaryHSL.h);

    const trailAlpha = 0.04 + settings.bgDarkness * 0.2 + strumIntensity * 0.12;
    ctx.fillStyle = `rgba(5,5,8,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Spawn rings on strum or significant bass
    if (strumIntensity > 0.05 || (bassEnergy > 0.5 && Math.random() < 0.4)) {
      const count = 1 + Math.floor(strumIntensity * 4);
      for (let c = 0; c < count; c++) {
        this.rings.push({
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (0.15 + Math.random() * 0.7),
          radius: 8,
          maxRadius: 80 + strumIntensity * 400 + bassEnergy * 200 + volume * 100,
          alpha: 0.7 + strumIntensity * 0.3,
          hue: (primaryHSL.h + (Math.random() - 0.5) * 90 + 360) % 360,
          thickness: 2 + strumIntensity * 6 + bassEnergy * 3,
        });
      }
    }

    // Twinkling stars — pulsing with highEnergy
    for (const star of this.stars) {
      star.twinkle += 0.03 * motion * (1 + highEnergy * 3);
      const tw = (Math.sin(star.twinkle) + 1) * 0.5;
      const size = star.size * (0.6 + tw * 0.4 + highEnergy * 2.5 + volume * 1.5);
      const alpha = 0.3 + tw * 0.5 + highEnergy * 0.2 + volume * 0.15;

      ctx.beginPath();
      ctx.fillStyle = hslToRgba(star.hue, 80, 75 + tw * 20, alpha);
      ctx.shadowColor = hslToRgba(star.hue, 90, 85, 0.7);
      ctx.shadowBlur = size * 5;
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expand and draw rings
    this.rings = this.rings.filter(r => r.alpha > 0.005 && r.radius < r.maxRadius * 1.05);
    for (const r of this.rings) {
      r.radius += (5 + bassEnergy * 10 + midEnergy * 5 + volume * 8) * motion * (dt / 16);
      r.alpha *= 0.972;
      const prog = r.radius / r.maxRadius;
      const ringAlpha = r.alpha * Math.max(0, 1 - prog * 0.9);

      for (let i = 0; i < 4; i++) {
        const rr = r.radius - i * 12;
        if (rr <= 0) continue;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = hslToRgba(r.hue, 85, 70, ringAlpha * (1 - i * 0.22));
        ctx.shadowColor = hslToRgba(r.hue, 95, 80, 0.7);
        ctx.shadowBlur = 25 + bassEnergy * 20;
        ctx.lineWidth = r.thickness * (1 - i * 0.2);
        ctx.stroke();
      }
    }

    // Nebula core: bright when loud
    if (volume > 0.1) {
      const nebula = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, height * (0.25 + volume * 0.3));
      nebula.addColorStop(0, hslToRgba(primaryHSL.h, 80, 50, 0.15 * volume + 0.05 * bassEnergy));
      nebula.addColorStop(0.5, hslToRgba((primaryHSL.h + 40) % 360, 60, 35, 0.08 * bassEnergy));
      nebula.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.shadowBlur = 0;
  }

  reset(): void { this.rings = []; this.time = 0; this.initialized = false; }
}
