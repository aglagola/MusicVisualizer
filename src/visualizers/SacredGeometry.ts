// src/visualizers/SacredGeometry.ts
// Sacred Geometry — rotating mandala shapes that expand with each strum

import { AudioData, VisualizerSettings } from '../types/audio';
import { COLOR_PALETTES, parseHSL, hslToRgba } from '../utils/colorPalettes';
import { lerp, polarToCart, drawPolygon } from '../utils/canvasUtils';

export class SacredGeometry {
  private rotation = 0;
  private rotationVelocity = 0;
  private pulseScale = 1;
  private time = 0;
  private hueShift = 0;

  render(ctx: CanvasRenderingContext2D, audioData: AudioData, settings: VisualizerSettings, dt: number): void {
    const { width, height } = ctx.canvas;
    const palette = COLOR_PALETTES[settings.palette];
    const { volume, bassEnergy, midEnergy, highEnergy, strumIntensity } = audioData;
    const motion = settings.motionIntensity;
    const cx = width / 2;
    const cy = height / 2;

    this.time += dt * 0.001;

    // Strum triggers a rotation impulse and scale pulse
    if (strumIntensity > 0.05) {
      this.rotationVelocity += strumIntensity * 0.04 * motion;
      this.pulseScale = 1 + strumIntensity * 0.3 * motion;
    }

    // Dampen rotation and scale back to base
    this.rotationVelocity *= 0.97;
    this.rotation += this.rotationVelocity + 0.002 * motion;
    this.pulseScale = lerp(this.pulseScale, 1, 0.08);
    this.hueShift = (this.hueShift + 0.3 * motion * (1 + bassEnergy)) % 360;

    const trailAlpha = lerp(0.05, 0.20, settings.bgDarkness);
    ctx.fillStyle = `rgba(5, 5, 8, ${trailAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const primaryHSL = parseHSL(palette.primary);
    const baseRadius = Math.min(width, height) * 0.35 * this.pulseScale;

    ctx.save();
    ctx.translate(cx, cy);

    // Draw 6 layers of sacred geometry rings
    const layers = 6;
    for (let layer = 0; layer < layers; layer++) {
      const layerT = layer / (layers - 1);
      const layerRadius = baseRadius * lerp(0.15, 1.0, layerT) * (1 + bassEnergy * 0.2 * (1 - layerT));
      const rotOffset = this.rotation * (layer % 2 === 0 ? 1 : -1) * (1 + layerT * 0.5);
      const sides = 3 + layer * 2; // 3, 5, 7, 9, 11, 13 sides — sacred numbers
      const innerRatio = 0.5 + midEnergy * 0.3;
      const hue = (primaryHSL.h + this.hueShift + layer * 30) % 360;
      const alpha = lerp(0.8, 0.2, layerT) * (0.4 + volume * 0.6);
      const glowIntensity = highEnergy * 30 + 10;

      // Draw filled polygon (inner glow)
      drawPolygon(ctx, 0, 0, layerRadius, layerRadius * innerRatio, sides, rotOffset);
      ctx.fillStyle = hslToRgba(hue, 80, 40, alpha * 0.15);
      ctx.fill();

      // Draw polygon outline with glow
      ctx.strokeStyle = hslToRgba(hue, 90, 65, alpha);
      ctx.shadowColor = hslToRgba(hue, 100, 70, 0.8);
      ctx.shadowBlur = glowIntensity;
      ctx.lineWidth = lerp(2.5, 0.8, layerT) * (1 + strumIntensity * 2);
      ctx.stroke();

      // Draw connecting lines from center to vertices (Flower of Life effect)
      if (layer < 3) {
        for (let v = 0; v < sides; v++) {
          const angle = (v / sides) * Math.PI * 2 + rotOffset;
          const pt = polarToCart(0, 0, layerRadius, angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = hslToRgba(hue, 80, 60, alpha * 0.3);
          ctx.shadowBlur = 5;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Central glowing orb driven by volume
    const orbRadius = 8 + volume * 25 + bassEnergy * 15;
    const orbGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius);
    const orbHue = (primaryHSL.h + this.hueShift) % 360;
    orbGrad.addColorStop(0, hslToRgba(orbHue, 100, 90, 0.9 * (0.3 + volume * 0.7)));
    orbGrad.addColorStop(0.5, hslToRgba(orbHue, 80, 60, 0.4 * volume));
    orbGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.fillStyle = orbGrad;
    ctx.arc(0, 0, orbRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  reset(): void {
    this.rotation = 0;
    this.rotationVelocity = 0;
    this.pulseScale = 1;
    this.time = 0;
    this.hueShift = 0;
  }
}
