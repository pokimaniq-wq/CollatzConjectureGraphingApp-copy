export interface Theme {
  key: string;
  name: string;
  bg: string;
  bgPanel: string;
  bgInput: string;
  border: string;
  borderAccent: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentText: string;
  danger: string;
  grid: string;
  axisTick: string;
  axisLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipLabel: string;
  progressBg: string;
}

export const THEMES: Theme[] = [
  {
    key: "oscilloscope",
    name: "Oscilloscope",
    bg: "#080b0f",
    bgPanel: "#0e1420",
    bgInput: "#0a1018",
    border: "#1a2a3a",
    borderAccent: "#1e3a5f",
    text: "#c8d6e5",
    textMuted: "#4a7a9b",
    textDim: "#2a4a6a",
    accent: "#00d2ff",
    accentText: "#080b0f",
    danger: "#ff6b6b",
    grid: "rgba(60,100,160,0.12)",
    axisTick: "#3a6a9a",
    axisLine: "#1e3a5f",
    tooltipBg: "#0e1420",
    tooltipBorder: "#1e3a5f",
    tooltipLabel: "#4a8abf",
    progressBg: "#1a2a3a",
  },
  {
    key: "terminal",
    name: "Terminal",
    bg: "#020804",
    bgPanel: "#041008",
    bgInput: "#030c06",
    border: "#0d2b10",
    borderAccent: "#174a1c",
    text: "#00e535",
    textMuted: "#2a8a40",
    textDim: "#155020",
    accent: "#00ff50",
    accentText: "#020804",
    danger: "#ff4444",
    grid: "rgba(0,200,60,0.1)",
    axisTick: "#2a8a40",
    axisLine: "#174a1c",
    tooltipBg: "#041008",
    tooltipBorder: "#174a1c",
    tooltipLabel: "#40c060",
    progressBg: "#0d2b10",
  },
  {
    key: "blueprint",
    name: "Blueprint",
    bg: "#09122a",
    bgPanel: "#0f1e40",
    bgInput: "#0b1632",
    border: "#1a3268",
    borderAccent: "#2250b0",
    text: "#ddeeff",
    textMuted: "#5888cc",
    textDim: "#2a4a90",
    accent: "#4da8ff",
    accentText: "#09122a",
    danger: "#ff7070",
    grid: "rgba(77,168,255,0.1)",
    axisTick: "#4870b8",
    axisLine: "#2250b0",
    tooltipBg: "#0f1e40",
    tooltipBorder: "#2250b0",
    tooltipLabel: "#5888cc",
    progressBg: "#1a3268",
  },
  {
    key: "light",
    name: "Light Lab",
    bg: "#f0f4f8",
    bgPanel: "#ffffff",
    bgInput: "#f8fafc",
    border: "#d8e4ee",
    borderAccent: "#b0c8e0",
    text: "#1a2a3a",
    textMuted: "#5070a0",
    textDim: "#90aac0",
    accent: "#0077cc",
    accentText: "#ffffff",
    danger: "#cc2222",
    grid: "rgba(0,80,160,0.07)",
    axisTick: "#6080a0",
    axisLine: "#b0c8e0",
    tooltipBg: "#ffffff",
    tooltipBorder: "#b0c8e0",
    tooltipLabel: "#5070a0",
    progressBg: "#d8e4ee",
  },
  {
    key: "sunset",
    name: "Sunset",
    bg: "#0f0710",
    bgPanel: "#1c0d20",
    bgInput: "#140910",
    border: "#30143c",
    borderAccent: "#602080",
    text: "#f0d0f0",
    textMuted: "#9060b0",
    textDim: "#5a2870",
    accent: "#e040ff",
    accentText: "#0f0710",
    danger: "#ff5555",
    grid: "rgba(200,64,255,0.1)",
    axisTick: "#9060b0",
    axisLine: "#602080",
    tooltipBg: "#1c0d20",
    tooltipBorder: "#602080",
    tooltipLabel: "#b080d0",
    progressBg: "#30143c",
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}
