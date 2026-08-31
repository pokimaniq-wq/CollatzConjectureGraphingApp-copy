import { useState, useMemo, useRef, useCallback, useId } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  collatzSequence,
  getGridInterval,
  LINE_COLORS,
  type CollatzSequence,
  type JSONExport,
} from "./utils/collatz";
import { renderStaticChart, exportVideo } from "./utils/canvasDraw";
import { THEMES, hexToRgb, rgbToHex, type Theme } from "./utils/themes";

let nextId = 1;

type ThemeColorKey = "bg" | "bgPanel" | "text" | "accent";

const THEME_COLOR_FIELDS: Array<{ key: ThemeColorKey; label: string; description: string }> = [
  { key: "bg", label: "Canvas", description: "Page background" },
  { key: "bgPanel", label: "Panels", description: "Cards and settings" },
  { key: "text", label: "Text", description: "Primary copy" },
  { key: "accent", label: "Accent", description: "Controls and highlights" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

function makeTooltip(t: Theme) {
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs font-mono shadow-xl border"
        style={{ background: t.tooltipBg, borderColor: t.tooltipBorder }}
      >
        <p className="mb-1" style={{ color: t.tooltipLabel }}>
          term {label}
        </p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };
}

// ── RGB Slider row ────────────────────────────────────────────────────────────

function RgbSliders({
  color,
  onChange,
  t,
}: {
  color: string;
  onChange: (hex: string) => void;
  t: Theme;
}) {
  const { r, g, b } = hexToRgb(color);
  const ch = (channel: "r" | "g" | "b", val: number) => {
    const next = { r, g, b, [channel]: val };
    onChange(rgbToHex(next.r, next.g, next.b));
  };
  const trackBg = (ch: "r" | "g" | "b") => {
    if (ch === "r") return `linear-gradient(to right, #000, #ff0000)`;
    if (ch === "g") return `linear-gradient(to right, #000, #00ff00)`;
    return `linear-gradient(to right, #000, #0000ff)`;
  };
  return (
    <div className="space-y-1.5">
      {(["r", "g", "b"] as const).map((ch) => {
        const val = ch === "r" ? r : ch === "g" ? g : b;
        return (
          <div key={ch} className="flex items-center gap-2">
            <span
              className="w-3 text-[10px] font-mono uppercase font-bold"
              style={{ color: ch === "r" ? "#ff6666" : ch === "g" ? "#66ff66" : "#6699ff" }}
            >
              {ch}
            </span>
            <div className="relative flex-1 h-3 rounded-full overflow-hidden" style={{ background: t.border }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${(val / 255) * 100}%`, background: trackBg(ch) }}
              />
              <input
                type="range"
                min={0}
                max={255}
                value={val}
                onChange={(e) => ch === "r" ? ch === "r" && onChange(rgbToHex(+e.target.value, g, b))
                  : ch === "g" ? onChange(rgbToHex(r, +e.target.value, b))
                  : onChange(rgbToHex(r, g, +e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span
              className="w-7 text-right text-[10px] font-mono tabular-nums"
              style={{ color: t.textMuted }}
            >
              {val}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({
  open,
  onClose,
  theme,
  onThemeChange,
  themeOverrides,
  onThemeColorChange,
  onThemeReset,
  sequences,
  onColorChange,
  t,
}: {
  open: boolean;
  onClose: () => void;
  theme: string;
  onThemeChange: (key: string) => void;
  themeOverrides: Partial<Pick<Theme, ThemeColorKey>>;
  onThemeColorChange: (key: ThemeColorKey, color: string) => void;
  onThemeReset: () => void;
  sequences: CollatzSequence[];
  onColorChange: (id: number, hex: string) => void;
  t: Theme;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col w-80 shadow-2xl transition-transform duration-300"
        style={{
          background: t.bgPanel,
          borderLeft: `1px solid ${t.border}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <span className="text-sm font-mono font-semibold" style={{ color: t.text }}>
            Settings
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
          {/* Theme switcher */}
          <section>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-3"
              style={{ color: t.textMuted }}
            >
              Theme
            </p>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.key}
                  onClick={() => onThemeChange(th.key)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all border"
                  style={{
                    background: theme === th.key ? t.bgInput : "transparent",
                    borderColor: theme === th.key ? t.accent : t.border,
                    color: t.text,
                  }}
                >
                  {/* Mini palette swatch */}
                  <div className="flex gap-1 shrink-0">
                    <span
                      className="w-4 h-4 rounded-sm"
                      style={{ background: th.bg, border: `1px solid ${th.border}` }}
                    />
                    <span className="w-4 h-4 rounded-sm" style={{ background: th.accent }} />
                    <span className="w-4 h-4 rounded-sm" style={{ background: th.text + "55" }} />
                  </div>
                  <span className="text-xs font-mono">{th.name}</span>
                  {theme === th.key && (
                    <svg
                      viewBox="0 0 12 12"
                      className="w-3 h-3 ml-auto shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ color: t.accent }}
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Theme customizer */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: t.textMuted }}
                >
                  Theme customizer
                </p>
                <p className="text-[10px] font-mono mt-1" style={{ color: t.textDim }}>
                  Fine-tune the active preset.
                </p>
              </div>
              <button
                type="button"
                onClick={onThemeReset}
                disabled={Object.keys(themeOverrides).length === 0}
                className="text-[10px] font-mono px-2 py-1 rounded border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: t.borderAccent, color: t.textMuted }}
              >
                Reset
              </button>
            </div>

            <div className="space-y-2">
              {THEME_COLOR_FIELDS.map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer"
                  style={{ borderColor: t.border, background: t.bgInput }}
                >
                  <input
                    aria-label={`${label} color`}
                    type="color"
                    value={t[key]}
                    onChange={(event) => onThemeColorChange(key, event.target.value)}
                    className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-mono" style={{ color: t.text }}>
                      {label}
                    </span>
                    <span className="block text-[10px] font-mono" style={{ color: t.textDim }}>
                      {description}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono uppercase" style={{ color: t.textMuted }}>
                    {t[key]}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Line colors */}
          {sequences.length > 0 && (
            <section>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-3"
                style={{ color: t.textMuted }}
              >
                Line colors
              </p>
              <div className="space-y-5">
                {sequences.map((s) => (
                  <div key={s.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                      />
                      <span className="text-xs font-mono" style={{ color: t.text }}>
                        n = {s.startingNumber.toLocaleString()}
                      </span>
                      <span
                        className="ml-auto text-[10px] font-mono tabular-nums"
                        style={{ color: t.textMuted }}
                      >
                        {s.color.toUpperCase()}
                      </span>
                      {/* Native color picker fallback */}
                      <label className="relative cursor-pointer">
                        <input
                          type="color"
                          value={s.color}
                          onChange={(e) => onColorChange(s.id, e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <span
                          className="w-5 h-5 rounded border flex items-center justify-center text-[9px] font-mono"
                          style={{ borderColor: t.borderAccent, color: t.textMuted }}
                          title="Open color picker"
                        >
                          ⛉
                        </span>
                      </label>
                    </div>
                    <RgbSliders
                      color={s.color}
                      onChange={(hex) => onColorChange(s.id, hex)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {sequences.length === 0 && (
            <p className="text-xs font-mono" style={{ color: t.textDim }}>
              Add sequences to configure their line colors.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────

export default function App() {
  const [sequences, setSequences] = useState<CollatzSequence[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [inputError, setInputError] = useState("");
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeKey, setThemeKey] = useState("oscilloscope");
  const [themeOverrides, setThemeOverrides] = useState<Partial<Pick<Theme, ThemeColorKey>>>({});

  const chartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const baseTheme = useMemo(
    () => THEMES.find((th) => th.key === themeKey) ?? THEMES[0],
    [themeKey]
  );
  const t = useMemo(() => ({ ...baseTheme, ...themeOverrides }), [baseTheme, themeOverrides]);
  const CustomTooltip = useMemo(() => makeTooltip(t), [t]);

  const maxTerms = useMemo(
    () => Math.max(...sequences.map((s) => s.values.length), 0),
    [sequences]
  );
  const gridInterval = useMemo(() => getGridInterval(maxTerms), [maxTerms]);

  const xTicks = useMemo(() => {
    if (maxTerms === 0) return [];
    const ticks: number[] = [];
    for (let tick = 0; tick < maxTerms; tick += gridInterval) ticks.push(tick);
    if (ticks[ticks.length - 1] !== maxTerms - 1) ticks.push(maxTerms - 1);
    return ticks;
  }, [maxTerms, gridInterval]);

  const chartData = useMemo(() => {
    if (sequences.length === 0) return [];
    return Array.from({ length: maxTerms }, (_, i) => {
      const row: Record<string, number | undefined> = { term: i };
      sequences.forEach((s) => {
        if (i < s.values.length) row[`s${s.id}`] = s.values[i];
      });
      return row;
    });
  }, [sequences, maxTerms]);

  const addSequence = useCallback(() => {
    const n = parseInt(inputVal.trim(), 10);
    if (!Number.isInteger(n) || n <= 0) {
      setInputError("Enter a positive integer.");
      return;
    }
    if (sequences.some((s) => s.startingNumber === n)) {
      setInputError(`n=${n} is already shown.`);
      return;
    }
    setInputError("");
    const values = collatzSequence(n);
    const color = LINE_COLORS[sequences.length % LINE_COLORS.length];
    setSequences((prev) => [
      ...prev,
      { id: nextId++, startingNumber: n, name: `n=${n}`, color, values },
    ]);
    setInputVal("");
  }, [inputVal, sequences]);

  const removeSequence = (id: number) =>
    setSequences((prev) => prev.filter((s) => s.id !== id));

  const clearAll = () => setSequences([]);

  const updateColor = useCallback((id: number, hex: string) => {
    setSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color: hex } : s))
    );
  }, []);

  const chooseTheme = useCallback((key: string) => {
    setThemeKey(key);
    setThemeOverrides({});
  }, []);

  const updateThemeColor = useCallback((key: ThemeColorKey, color: string) => {
    setThemeOverrides((previous) => ({ ...previous, [key]: color }));
  }, []);

  const resetThemeCustomizer = useCallback(() => setThemeOverrides({}), []);

  const exportJSON = () => {
    const data: JSONExport = {
      version: 1,
      sequences: sequences.map((s) => ({
        startingNumber: s.startingNumber,
        color: s.color,
        name: s.name,
        values: s.values,
      })),
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `collatz-${sequences.map((s) => s.startingNumber).join("-")}.json`
    );
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data: JSONExport = JSON.parse(ev.target?.result as string);
        if (!data.sequences) throw new Error("Invalid format");
        const newSeqs: CollatzSequence[] = data.sequences.map((s, i) => ({
          id: nextId++,
          startingNumber: s.startingNumber,
          name: s.name || `n=${s.startingNumber}`,
          color: s.color || LINE_COLORS[i % LINE_COLORS.length],
          values: s.values,
        }));
        setSequences((prev) => {
          const merged = [...prev];
          newSeqs.forEach((ns) => {
            if (!merged.some((m) => m.startingNumber === ns.startingNumber))
              merged.push(ns);
          });
          return merged;
        });
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportSvg = async () => {
    if (!sequences.length) return;
    setIsExporting(true);
    try {
      const canvas = await renderStaticChart(sequences, 1400, 800);
      const pngDataUrl = canvas.toDataURL("image/png");
      const svgDoc = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1400" height="800" viewBox="0 0 1400 800">
  <rect width="1400" height="800" fill="#080b0f"/>
  <image href="${pngDataUrl}" x="0" y="0" width="1400" height="800"/>
</svg>`;
      downloadBlob(new Blob([svgDoc], { type: "image/svg+xml" }), "collatz-chart.svg");
    } finally {
      setIsExporting(false);
    }
  };

  const exportRaster = async (type: "png" | "jpg") => {
    if (!sequences.length) return;
    setIsExporting(true);
    try {
      const canvas = await renderStaticChart(sequences, 1400, 800);
      const mime = type === "jpg" ? "image/jpeg" : "image/png";
      await new Promise<void>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) downloadBlob(blob, `collatz-chart.${type}`);
            resolve();
          },
          mime,
          0.95
        );
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportMp4 = async () => {
    if (!sequences.length) return;
    setIsExporting(true);
    setVideoProgress(0);
    try {
      const blob = await exportVideo(sequences, (pct) => setVideoProgress(pct));
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      downloadBlob(blob, `collatz-animation.${ext}`);
    } finally {
      setIsExporting(false);
      setVideoProgress(null);
    }
  };

  const hasData = sequences.length > 0;

  return (
    <div
      className="min-h-full flex flex-col font-sans"
      style={{ background: t.bg, color: t.text }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center gap-4 shrink-0"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div className="flex-1">
          <h1 className="text-lg font-mono font-semibold tracking-tight" style={{ color: t.text }}>
            3x+1{" "}
            <span style={{ color: t.accent }}>Collatz</span> Explorer
          </h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: t.textMuted }}>
            Visualize Collatz sequences — multiple traces, smooth curves, export anywhere
          </p>
        </div>
        {/* Settings gear */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
          style={{
            borderColor: settingsOpen ? t.accent : t.border,
            color: settingsOpen ? t.accent : t.textMuted,
            background: settingsOpen ? t.bgInput : "transparent",
          }}
          title="Settings"
        >
          <svg viewBox="0 0 20 20" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="3" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </header>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside
          className="w-full lg:w-72 flex flex-col p-5 gap-5 shrink-0"
          style={{ borderRight: `1px solid ${t.border}` }}
        >
          {/* Add sequence */}
          <section>
            <label
              htmlFor={inputId}
              className="block text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: t.textMuted }}
            >
              Starting number
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                type="number"
                min="1"
                value={inputVal}
                onChange={(e) => { setInputVal(e.target.value); setInputError(""); }}
                onKeyDown={(e) => e.key === "Enter" && addSequence()}
                placeholder="e.g. 27"
                className="flex-1 rounded-md px-3 py-2 text-sm font-mono focus:outline-none transition-colors border"
                style={{
                  background: t.bgInput,
                  borderColor: t.borderAccent,
                  color: t.text,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = t.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = t.borderAccent)}
              />
              <button
                onClick={addSequence}
                className="px-3 py-2 rounded-md text-sm font-mono font-bold transition-colors"
                style={{ background: t.accent, color: t.accentText }}
              >
                Add
              </button>
            </div>
            {inputError && (
              <p className="text-xs font-mono mt-1" style={{ color: t.danger }}>
                {inputError}
              </p>
            )}
          </section>

          {/* Active sequences */}
          {sequences.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: t.textMuted }}
                >
                  Active traces
                </span>
                <button
                  onClick={clearAll}
                  className="text-[10px] font-mono transition-colors"
                  style={{ color: t.danger }}
                >
                  Clear all
                </button>
              </div>
              <ul className="space-y-1.5">
                {sequences.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 rounded-md px-3 py-2 border group transition-colors"
                    style={{ background: t.bgPanel, borderColor: t.border }}
                  >
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="w-3 h-3 rounded-full shrink-0 transition-transform hover:scale-125"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                      title="Edit color in settings"
                    />
                    <span className="flex-1 text-xs font-mono" style={{ color: t.text }}>
                      n = {s.startingNumber.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: t.textMuted }}>
                      {s.values.length} terms
                    </span>
                    <button
                      onClick={() => removeSequence(s.id)}
                      className="text-sm leading-none ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: t.danger }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Export / Import */}
          <section className="mt-auto">
            <span
              className="block text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: t.textMuted }}
            >
              Import
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 border rounded-md text-xs font-mono text-left transition-colors"
              style={{ borderColor: t.borderAccent, color: t.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderAccent; e.currentTarget.style.color = t.textMuted; }}
            >
              Upload JSON…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={importJSON}
            />

            <span
              className="block text-[10px] font-mono uppercase tracking-widest mt-4 mb-2"
              style={{ color: t.textMuted }}
            >
              Export chart
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["svg", "png", "jpg"] as const).map((fmt) => (
                <button
                  key={fmt}
                  disabled={!hasData || isExporting}
                  onClick={() => (fmt === "svg" ? exportSvg() : exportRaster(fmt))}
                  className="px-2 py-1.5 border rounded text-xs font-mono uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: t.borderAccent, color: t.textMuted }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderAccent; e.currentTarget.style.color = t.textMuted; }}
                >
                  .{fmt}
                </button>
              ))}
              <button
                disabled={!hasData || isExporting}
                onClick={exportJSON}
                className="px-2 py-1.5 border rounded text-xs font-mono uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: t.borderAccent, color: "#96e6a1" }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = "#96e6a1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderAccent; }}
              >
                .json
              </button>
            </div>

            <button
              disabled={!hasData || isExporting}
              onClick={exportMp4}
              className="mt-1.5 w-full px-3 py-2 border rounded-md text-xs font-mono transition-colors flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: t.borderAccent, color: "#ffd93d" }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = "#ffd93d"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderAccent; }}
            >
              <span>Export video (.mp4)</span>
              {videoProgress !== null && (
                <span style={{ color: "#ffd93d" }}>{Math.round(videoProgress * 100)}%</span>
              )}
            </button>
            {videoProgress !== null && (
              <div
                className="mt-1.5 h-1 rounded-full overflow-hidden"
                style={{ background: t.progressBg }}
              >
                <div
                  className="h-full transition-all"
                  style={{ width: `${videoProgress * 100}%`, background: "#ffd93d" }}
                />
              </div>
            )}
          </section>
        </aside>

        {/* Chart area */}
        <main className="flex-1 flex flex-col p-4 min-w-0">
          {!hasData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div
                className="w-16 h-16 rounded-full border flex items-center justify-center"
                style={{ borderColor: t.border }}
              >
                <svg
                  viewBox="0 0 40 40"
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ color: t.borderAccent }}
                >
                  <polyline points="2,30 10,10 18,22 26,6 34,18 38,14" />
                </svg>
              </div>
              <p className="font-mono text-sm max-w-xs" style={{ color: t.textDim }}>
                Enter a positive integer and click Add to plot its Collatz sequence.
              </p>
              <div className="flex gap-2 text-xs font-mono" style={{ color: t.textDim }}>
                {[27, 97, 871, 6171].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setInputVal(String(n)); setInputError(""); }}
                    className="px-2 py-1 border rounded transition-colors"
                    style={{ borderColor: t.border }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim; }}
                  >
                    n={n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={chartRef} className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 16, right: 32, bottom: 32, left: 16 }}
                >
                  <CartesianGrid stroke={t.grid} strokeDasharray="" />
                  <XAxis
                    dataKey="term"
                    ticks={xTicks}
                    tick={{ fill: t.axisTick, fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: t.axisLine }}
                    tickLine={{ stroke: t.axisLine }}
                    label={{
                      value: "Term",
                      position: "insideBottom",
                      offset: -16,
                      fill: t.textDim,
                      fontSize: 11,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                  <YAxis
                    tick={{ fill: t.axisTick, fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: t.axisLine }}
                    tickLine={{ stroke: t.axisLine }}
                    tickFormatter={(v) =>
                      v >= 1e6
                        ? `${(v / 1e6).toFixed(1)}M`
                        : v >= 1e3
                        ? `${(v / 1e3).toFixed(0)}K`
                        : v
                    }
                    width={64}
                    label={{
                      value: "Value",
                      angle: -90,
                      position: "insideLeft",
                      offset: 8,
                      fill: t.textDim,
                      fontSize: 11,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span
                        style={{
                          color: t.textMuted,
                          fontSize: 12,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                  {sequences.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={`s${s.id}`}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: s.color, stroke: t.bg, strokeWidth: 2 }}
                      connectNulls={false}
                      isAnimationActive={true}
                      animationDuration={600}
                      animationEasing="ease-out"
                      style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats bar */}
          {hasData && (
            <div className="mt-3 flex flex-wrap gap-4 px-1">
              {sequences.map((s) => {
                const peak = Math.max(...s.values);
                const peakAt = s.values.indexOf(peak);
                return (
                  <div key={s.id} className="flex items-center gap-2 text-[11px] font-mono">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }}
                    />
                    <span style={{ color: t.axisTick }}>n={s.startingNumber}</span>
                    <span style={{ color: t.textMuted }}>
                      {s.values.length} steps ·{" "}
                      <span style={{ color: t.text }}>peak {peak.toLocaleString()}</span>
                      {" "}at t={peakAt}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Settings panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={themeKey}
        onThemeChange={chooseTheme}
        themeOverrides={themeOverrides}
        onThemeColorChange={updateThemeColor}
        onThemeReset={resetThemeCustomizer}
        sequences={sequences}
        onColorChange={updateColor}
        t={t}
      />
    </div>
  );
}
