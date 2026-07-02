// src/visualizers/Firelight.ts
// Firelight — explosive particle system that erupts with every strum

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  hue: number; sat: number;
}

export class Firelight {
  private particles: Particle[] = [];
  private time = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, strumIntensity, highEnergy, midEnergy } = audioData;
    const motion = settings.motionIntensity;
    const primaryHSL = parseHSL(palette.primary);

    this.time += dt * 0.001;

    const trailAlpha = 0.08 + settings.bgDarkness * 0.3 + strumIntensity * 0.1;
    ctx.fillStyle = `rgba(5,5,8,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Continuous spawning based on volume
    const spawnBase = Math.floor((volume * 20 + bassEnergy * 10) * motion);
    for (let i = 0; i < spawnBase && this.particles.length < 800; i++) {
      const spread = width * (0.1 + volume * 0.4);
      const life = 0.6 + Math.random() * 0.8;
      this.particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * spread,
        y: height * (0.75 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 3 * motion,
        vy: -(3 + Math.random() * 7 + bassEnergy * 8) * motion,
        life, maxLife: life,
        size: 3 + Math.random() * 8 + volume * 10,
        hue: primaryHSL.h + (Math.random() - 0.5) * 35,
        sat: 90 + Math.random() * 10,
      });
    }

    // Strum burst — explosive upward spray
    if (strumIntensity > 0.2) {
      const burst = Math.floor(strumIntensity * 60 * motion);
      for (let i = 0; i < burst && this.particles.length < 800; i++) {
        const angle = -Math.PI * (0.2 + Math.random() * 0.6); // upward arc
        const speed = (5 + Math.random() * 15) * strumIntensity * motion;
        const life = 0.4 + Math.random() * 0.6;
        this.particles.push({
          x: width * (0.3 + Math.random() * 0.4),
          y: height * (0.5 + Math.random() * 0.3),
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
          vy: Math.sin(angle) * speed,
          life, maxLife: life,
          size: 2 + Math.random() * 6,
          hue: primaryHSL.h + 25 + Math.random() * 30,
          sat: 100,
        });
      }
    }

    const turbulence = Math.sin(this.time * 4) * 0.5;
    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.particles) {
      p.vx += (Math.random() - 0.5) * 0.8 + turbulence * 0.3;
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy *= 0.975;
      p.vx *= 0.965;
      p.life -= (dt / 16) * 0.025;
      p.size *= 0.992;

      const t = p.life / p.maxLife;
      const lit = 30 + t * 55;
      const alpha = Math.min(1, t * 2.5) * 0.85;

      ctx.beginPath();
      ctx.fillStyle = hslToRgba(p.hue, p.sat, lit, alpha);
      ctx.shadowColor = hslToRgba(p.hue, p.sat, 70, 0.8);
      ctx.shadowBlur = p.size * 3.5;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Base flame glow
    const glowSize = width * (0.15 + bassEnergy * 0.35 + volume * 0.2);
    const glow = ctx.createRadialGradient(width*0.5, height*0.85, 0, width*0.5, height*0.85, glowSize);
    glow.addColorStop(0, hslToRgba(primaryHSL.h, 90, 65, 0.5 * (volume + bassEnergy * 0.5)));
    glow.addColorStop(0.5, hslToRgba(primaryHSL.h - 10, 80, 45, 0.2 * volume));
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(width*0.5, height*0.88, glowSize, height*0.12, 0, 0, Math.PI*2);
    ctx.fill();

    // High-freq embers
    if (highEnergy > 0.2 || midEnergy > 0.3) {
      const embers = Math.floor((highEnergy + midEnergy * 0.5) * 25);
      for (let i = 0; i < embers; i++) {
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(primaryHSL.h + 30, 100, 92, Math.random() * highEnergy);
        ctx.shadowColor = 'white'; ctx.shadowBlur = 5;
        ctx.arc(Math.random()*width, Math.random()*height*0.8, 1.5 + highEnergy*2*Math.random(), 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  reset(): void { this.particles = []; this.time = 0; }
}
