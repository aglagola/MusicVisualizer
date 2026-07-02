// src/utils/colorPalettes.ts
// Curated color palettes for each visualizer mood

import { ColorPalette } from '../types/audio';

export interface Palette {
  name: string;
  /** Primary glow/wave color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Highlight / sparkle color */
  accent: string;
  /** Soft ambient glow */
  glow: string;
  /** Background base tint */
  bg: string;
  /** CSS gradient string for UI swatches */
  gradient: string;
}

export const COLOR_PALETTES: Record<ColorPalette, Palette> = {
  aurora: {
    name: 'Aurora',
    primary: 'hsl(270, 80%, 65%)',
    secondary: 'hsl(190, 90%, 55%)',
    accent: 'hsl(320, 85%, 70%)',
    glow: 'hsl(260, 60%, 40%)',
    bg: 'hsl(240, 30%, 5%)',
    gradient: 'linear-gradient(135deg, hsl(270,80%,65%), hsl(190,90%,55%), hsl(320,85%,70%))',
  },
  fire: {
    name: 'Firelight',
    primary: 'hsl(30, 100%, 60%)',
    secondary: 'hsl(10, 95%, 55%)',
    accent: 'hsl(50, 100%, 70%)',
    glow: 'hsl(20, 80%, 35%)',
    bg: 'hsl(15, 30%, 4%)',
    gradient: 'linear-gradient(135deg, hsl(30,100%,60%), hsl(10,95%,55%), hsl(50,100%,70%))',
  },
  ocean: {
    name: 'Ocean',
    primary: 'hsl(210, 90%, 60%)',
    secondary: 'hsl(190, 85%, 55%)',
    accent: 'hsl(170, 80%, 65%)',
    glow: 'hsl(220, 60%, 30%)',
    bg: 'hsl(220, 40%, 4%)',
    gradient: 'linear-gradient(135deg, hsl(210,90%,60%), hsl(190,85%,55%), hsl(170,80%,65%))',
  },
  cosmic: {
    name: 'Cosmic',
    primary: 'hsl(250, 70%, 70%)',
    secondary: 'hsl(300, 65%, 65%)',
    accent: 'hsl(200, 100%, 80%)',
    glow: 'hsl(270, 50%, 30%)',
    bg: 'hsl(250, 40%, 3%)',
    gradient: 'linear-gradient(135deg, hsl(250,70%,70%), hsl(300,65%,65%), hsl(200,100%,80%))',
  },
  earth: {
    name: 'Earth',
    primary: 'hsl(35, 75%, 55%)',
    secondary: 'hsl(20, 70%, 45%)',
    accent: 'hsl(60, 80%, 60%)',
    glow: 'hsl(30, 50%, 25%)',
    bg: 'hsl(25, 30%, 4%)',
    gradient: 'linear-gradient(135deg, hsl(35,75%,55%), hsl(20,70%,45%), hsl(60,80%,60%))',
  },
  golden: {
    name: 'Golden Hour',
    primary: 'hsl(45, 100%, 65%)',
    secondary: 'hsl(25, 90%, 60%)',
    accent: 'hsl(55, 100%, 80%)',
    glow: 'hsl(35, 70%, 30%)',
    bg: 'hsl(30, 35%, 4%)',
    gradient: 'linear-gradient(135deg, hsl(45,100%,65%), hsl(25,90%,60%), hsl(55,100%,80%))',
  },
};

/**
 * Parse an HSL string like 'hsl(270, 80%, 65%)' into {h, s, l} numbers.
 * Used by visualizers to manipulate palette colors programmatically.
 */
export function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return { h: 0, s: 50, l: 50 };
  return { h: +match[1], s: +match[2], l: +match[3] };
}

/** Build an RGBA CSS string from HSL values and alpha */
export function hslToRgba(h: number, s: number, l: number, a: number): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}
