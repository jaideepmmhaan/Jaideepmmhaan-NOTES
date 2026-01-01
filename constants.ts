import { Theme, ThemeColors } from './types';

export const APP_NAME = "FRAME NOTES";
export const AUTHOR_HANDLE = "@jaideepmmhaan";

export const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    bg: "bg-neutral-950",
    surface: "bg-neutral-900",
    text: "text-neutral-200",
    textMuted: "text-neutral-500",
    accent: "text-cyan-400",
    border: "border-neutral-800",
  },
  pink: {
    bg: "bg-[#2a0a12]", // Deep brownish pink
    surface: "bg-[#3d101a]",
    text: "text-rose-100",
    textMuted: "text-rose-300/50",
    accent: "text-rose-400",
    border: "border-rose-900/30",
  },
  royal: {
    bg: "bg-[#050a14]", // Deep navy
    surface: "bg-[#0a152e]",
    text: "text-slate-200",
    textMuted: "text-slate-500",
    accent: "text-amber-400", // Gold
    border: "border-blue-900/30",
  },
};

export const NEON_COLORS = [
  "#22d3ee", // Cyan
  "#e879f9", // Fuchsia
  "#a78bfa", // Violet
  "#fb7185", // Rose
  "#facc15", // Yellow
  "#ffffff", // White
];
