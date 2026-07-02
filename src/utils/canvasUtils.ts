// src/utils/canvasUtils.ts
// Shared canvas drawing utilities used by all visualizer modes

/**
 * Clear the canvas with a semi-transparent dark overlay.
 * This creates the "motion trail" effect — instead of clearing fully,
 * we paint a dark layer that makes previous frames fade out gradually.
 *
 * @param ctx      - Canvas 2D context
 * @param darkness - 0 = very long trails (nearly transparent), 1 = instant clear (no trails)
 * @param bgColor  - Background tint color (default: near-black)
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  darkness: number,
  bgColor: string = '#050508'
): void {
  // Map darkness 0–1 to alpha 0.02–0.35
  const alpha = 0.02 + darkness * 0.33;
  ctx.fillStyle = bgColor.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(').replace('hsl(', 'hsla(');

  // If bgColor doesn't have rgba, use a fallback approach
  if (!bgColor.startsWith('rgb') && !bgColor.startsWith('hsl')) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/**
 * Fully clear the canvas to transparent black.
 * Used for modes that manage their own trail logic.
 */
export function hardClear(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draw a radial glow/bloom effect at a point.
 * Creates a soft, diffused light source using a radial gradient.
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('hsl(', 'hsla('));
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a glowing circle outline (ring).
 * Used for Cosmic Echo and Sacred Geometry rings.
 */
export function drawGlowRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  lineWidth: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = lineWidth * 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Linearly interpolate between two numbers.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Convert polar coordinates to Cartesian.
 */
export function polarToCart(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

/**
 * Draw a smooth closed polygon/star shape.
 * Used by Sacred Geometry mode for mandala petals.
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  sides: number,
  rotation: number
): void {
  ctx.beginPath();
  for (let i = 0; i < sides * 2; i++) {
    const angle = (i / (sides * 2)) * Math.PI * 2 + rotation;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
