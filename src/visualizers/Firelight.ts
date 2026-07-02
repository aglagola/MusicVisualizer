// src/visualizers/Firelight.ts
// Firelight — warm glowing particle system that flares with hard strums
// Particles spawn at the base, drift upward with turbulence, fade out

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp } from '../utils/canvasUtils';

interface Particle {
  x: number;
  y: number;
  vx: number;   // Horizontal velocity (wind/turbulence)
  vy: number;   // Vertical velocity (upward drift)
  life: number; // 0–1 remaining life (1=new, 0=dead)
  size: number;
  hue: number;
  sat: number;
}

export class Firelight {
  private particles: Particle[] = [];
  private readonly MAX_PARTICLES = 600;
  private time = 0;

  render(
    ctx: CanvasRenderingContext2D,
    audioData: AudioData,
    settings: VisualizerSettings,
    dt: number
  ): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, strumIntensity, highEnergy } = audioData;
    const motion = settings.motionIntensity;

    this.time += dt * 0.001;

    // Trail: darker clearing for fire (shorter trails look more like flame)
    const trailAlpha = lerp(0.06, 0.25, settings.bgDarkness);
    ctx.fillStyle = `rgba(5, 5, 8, ${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);

    // Spawn new particles on strum or sustained bass
    const spawnRate = Math.floor(
      (volume * 8 + strumIntensity * 40 + bassEnergy * 12) * motion
    );

    for (let i = 0; i < spawnRate && this.particles.length < this.MAX_PARTICLES; i++) {
      // Spawn near the bottom center of the screen, spread by volume
      const spread = width * (0.15 + volume * 0.25);
      this.particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * spread,
        y: height * (0.85 + Math.random() * 0.1),
        vx: (Math.random() - 0.5) * 2 * motion,
        vy: -(2 + Math.random() * 4 + bassEnergy * 6) * motion,
        life: 1,
        size: 2 + Math.random() * 6 + strumIntensity * 8,
        // Fire hue range: warm orange to bright yellow
        hue: primaryHSL.h + (Math.random() - 0.5) * 40,
        sat: 85 + Math.random() * 15,
      });
    }

    // Also add ember bursts on hard strums
    if (strumIntensity > 0.4) {
      const burstCount = Math.floor(strumIntensity * 20 * motion);
      for (let i = 0; i < burstCount && this.particles.length < this.MAX_PARTICLES; i++) {
        const angle = Math.random() * Math.PI; // Upper hemisphere
        const speed = 3 + Math.random() * 8 * strumIntensity * motion;
        this.particles.push({
          x: width * 0.5 + (Math.random() - 0.5) * width * 0.3,
          y: height * 0.75,
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
          vy: -Math.sin(angle) * speed,
          life: 0.7 + Math.random() * 0.3,
          size: 1 + Math.random() * 4,
          hue: primaryHSL.h + 20 + Math.random() * 30,
          sat: 100,
        });
      }
    }

    // Turbulence factor oscillates with time to mimic flickering fire
    const turbulence = Math.sin(this.time * 3) * 0.3;

    // Update and draw particles
    ctx.save();
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const p of this.particles) {
      // Physics: add turbulence to horizontal drift
      p.vx += (Math.random() - 0.5) * 0.5 + turbulence * 0.2;
      p.x += p.vx;
      p.y += p.vy;

      // Particles slow down and heat lightens toward yellow/white
      p.vy *= 0.98;
      p.vx *= 0.97;
      p.life -= 0.012 / motion;
      p.size *= 0.995;

      // Color: hot particles are yellow-white, cooler ones are orange-red
      const lifeFactor = p.life; // 1=young(hot), 0=old(cool)
      const lit = lerp(30, 80, lifeFactor);
      const alpha = Math.min(1, p.life * 2) * (0.4 + bassEnergy * 0.6);

      ctx.beginPath();
      ctx.fillStyle = hslToRgba(p.hue, p.sat, lit, alpha);
      ctx.shadowColor = hslToRgba(p.hue, p.sat, lit, 0.8);
      ctx.shadowBlur = p.size * 3;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw fire base glow
    if (volume > 0.02) {
      const glowGradient = ctx.createRadialGradient(
        width * 0.5, height * 0.85, 0,
        width * 0.5, height * 0.85, width * (0.1 + bassEnergy * 0.2)
      );
      glowGradient.addColorStop(0, hslToRgba(primaryHSL.h, 90, 60, 0.3 * volume));
      glowGradient.addColorStop(0.5, hslToRgba(primaryHSL.h - 10, 80, 40, 0.15 * volume));
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.88, width * (0.2 + bassEnergy * 0.3), height * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // High frequency sparkle — tiny embers floating at top
    if (highEnergy > 0.1) {
      const emberCount = Math.floor(highEnergy * 15);
      for (let i = 0; i < emberCount; i++) {
        const ex = Math.random() * width;
        const ey = Math.random() * height * 0.6;
        const er = highEnergy * 1.5 * Math.random();
        ctx.beginPath();
        ctx.fillStyle = hslToRgba(primaryHSL.h + 30, 100, 90, Math.random() * highEnergy * 0.8);
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 4;
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  reset(): void {
    this.particles = [];
    this.time = 0;
  }
}
