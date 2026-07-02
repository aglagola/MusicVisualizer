// src/visualizers/SacredGeometry.ts
// Sacred Geometry — mandala that violently rotates and expands with strums

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp, polarToCart, drawPolygon } from '../utils/canvasUtils';

export class SacredGeometry {
  private rotation = 0;
  private rotVelocity = 0;
  private pulseScale = 1;
  private hueShift = 0;
  private breathe = 0;
  private time = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity } = audioData;
    const motion = settings.motionIntensity;
    const cx = width / 2, cy = height / 2;

    this.time += dt * 0.001;
    this.breathe = Math.sin(this.time * 0.8) * 0.5 + 0.5;

    // Strum triggers an explosive rotation impulse and scale pulse
    if (strumIntensity > 0.03) {
      this.rotVelocity += strumIntensity * 0.12 * motion;
      this.pulseScale = 1 + strumIntensity * 0.6 * motion + volume * 0.2;
    }
    // Bass pushes the scale out continuously
    this.pulseScale = lerp(this.pulseScale, 1 + bassEnergy * 0.25 + this.breathe * 0.05, 0.08);
    this.rotVelocity *= 0.96;
    this.rotation += this.rotVelocity + 0.003 * motion * (1 + volume * 2);
    this.hueShift = (this.hueShift + 0.4 * motion * (1 + bassEnergy * 2)) % 360;

    const trailAlpha = 0.05 + settings.bgDarkness * 0.22 + strumIntensity * 0.1;
    ctx.fillStyle = `rgba(5,5,8,${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);
    const maxRadius = Math.min(width, height) * 0.42 * this.pulseScale;

    ctx.save();
    ctx.translate(cx, cy);

    const layers = 7;
    for (let l = 0; l < layers; l++) {
      const t = l / (layers - 1);
      const radius = maxRadius * lerp(0.12, 1.0, t) * (1 + bassEnergy * 0.3 * (1 - t) + volume * 0.15);
      const rotDir = l % 2 === 0 ? 1 : -1;
      const rotOffset = this.rotation * rotDir * (1 + t * 0.7);
      const sides = 3 + l * 2; // 3,5,7,9,11,13,15
      const innerRatio = 0.45 + midEnergy * 0.35;
      const hue = (primaryHSL.h + this.hueShift + l * 35) % 360;
      const alpha = lerp(0.9, 0.3, t) * (0.4 + volume * 0.6);
      const glow = 15 + highEnergy * 45 + strumIntensity * 35;
      const lineW = lerp(3.5, 0.8, t) * (1 + strumIntensity * 2.5 + volume * 1.5);

      drawPolygon(ctx, 0, 0, radius, radius * innerRatio, sides, rotOffset);
      ctx.fillStyle = hslToRgba(hue, 85, 45, alpha * 0.2);
      ctx.fill();
      ctx.strokeStyle = hslToRgba(hue, 92, 68, alpha);
      ctx.shadowColor = hslToRgba(hue, 100, 75, 0.9);
      ctx.shadowBlur = glow;
      ctx.lineWidth = lineW;
      ctx.stroke();

      // Radial spokes on inner layers
      if (l < 4) {
        for (let v = 0; v < sides; v++) {
          const angle = (v / sides) * Math.PI * 2 + rotOffset;
          const pt = polarToCart(0, 0, radius, angle);
          const innerR = radius * innerRatio * 0.5;
          const inner = polarToCart(0, 0, innerR, angle);
          ctx.beginPath();
          ctx.moveTo(inner.x, inner.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = hslToRgba(hue, 80, 65, alpha * 0.35);
          ctx.shadowBlur = 6;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Central orb — bright when loud
    const orbR = 12 + volume * 40 + bassEnergy * 25 + strumIntensity * 30;
    const orbHue = (primaryHSL.h + this.hueShift) % 360;
    const orbGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbR * 2.5);
    orbGrad.addColorStop(0, hslToRgba(orbHue, 100, 95, 0.95 * (0.4 + volume * 0.6)));
    orbGrad.addColorStop(0.4, hslToRgba(orbHue, 90, 65, 0.5 * (volume + bassEnergy * 0.5)));
    orbGrad.addColorStop(1, 'transparent');
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = orbGrad;
    ctx.arc(0, 0, orbR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  reset(): void {
    this.rotation = 0; this.rotVelocity = 0; this.pulseScale = 1;
    this.hueShift = 0; this.time = 0;
  }
}
