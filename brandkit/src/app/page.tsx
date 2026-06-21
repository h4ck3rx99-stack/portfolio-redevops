"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Palette,
  Layers,
  Type,
  Eye,
  Download,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Grid3X3,
  Square,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react";

type Harmony = "monochromatic" | "complementary" | "analogous" | "triadic" | "tetradic";
type GradientDir = "to right" | "to bottom" | "to bottom right" | "to bottom left";
type Tab = "palette" | "gradients" | "fonts" | "preview" | "export";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "palette", label: "Palette", icon: <Palette size={15} /> },
  { key: "gradients", label: "Gradients", icon: <Layers size={15} /> },
  { key: "fonts", label: "Fonts", icon: <Type size={15} /> },
  { key: "preview", label: "Preview", icon: <Eye size={15} /> },
  { key: "export", label: "Export", icon: <Download size={15} /> },
];

const FONT_PAIRS = [
  { heading: "Inter", body: "Source Serif Pro", hClass: "font-sans", bClass: "font-serif" },
  { heading: "Plus Jakarta Sans", body: "DM Sans", hClass: "font-sans", bClass: "font-sans" },
  { heading: "Playfair Display", body: "Source Sans Pro", hClass: "font-serif", bClass: "font-sans" },
  { heading: "Space Grotesk", body: "Inter", hClass: "font-sans", bClass: "font-sans" },
  { heading: "Syne", body: "Work Sans", hClass: "font-sans", bClass: "font-sans" },
  { heading: "Cabinet Grotesk", body: "Satoshi", hClass: "font-sans", bClass: "font-sans" },
];

const HARMONIES: { key: Harmony; label: string }[] = [
  { key: "monochromatic", label: "Mono" },
  { key: "complementary", label: "Complement" },
  { key: "analogous", label: "Analogous" },
  { key: "triadic", label: "Triadic" },
  { key: "tetradic", label: "Tetradic" },
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r = l, g = l, b = l;
  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function generatePalette(baseHex: string, harmony: Harmony): string[] {
  const { h, s, l } = hexToHsl(baseHex);
  const harm: Record<Harmony, [number, number, number][]> = {
    monochromatic: [
      [h, s, l],
      [h, s, Math.min(100, l + 20)],
      [h, s, Math.max(0, l - 20)],
      [h, Math.min(100, s + 15), Math.min(100, l + 10)],
      [h, Math.max(0, s - 15), Math.max(0, l - 10)],
    ],
    complementary: [
      [h, s, l],
      [(h + 180) % 360, s, l],
      [h, s, Math.min(100, l + 18)],
      [(h + 180) % 360, s, Math.max(0, l - 18)],
      [h, Math.min(100, s + 12), Math.min(100, l + 8)],
    ],
    analogous: [
      [h, s, l],
      [(h + 30) % 360, s, l],
      [(h + 330) % 360, s, l],
      [(h + 30) % 360, Math.min(100, s + 10), Math.min(100, l + 10)],
      [(h + 330) % 360, Math.min(100, s + 10), Math.max(0, l - 10)],
    ],
    triadic: [
      [h, s, l],
      [(h + 120) % 360, s, l],
      [(h + 240) % 360, s, l],
      [h, Math.min(100, s + 10), Math.min(100, l + 15)],
      [(h + 120) % 360, Math.min(100, s + 10), Math.max(0, l - 10)],
    ],
    tetradic: [
      [h, s, l],
      [(h + 90) % 360, s, l],
      [(h + 180) % 360, s, l],
      [(h + 270) % 360, s, l],
      [h, Math.min(100, s + 8), Math.min(100, l + 12)],
    ],
  };
  return harm[harmony].map(([hue, sat, lig]) => hslToHex(hue, sat, lig));
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTextColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 140 ? "#0a0a0a" : "#ffffff";
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(c1: string, c2: string) {
  const l1 = luminance(c1), l2 = luminance(c2);
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
}

function toCssVariables(colors: string[], name = "brand") {
  return colors.map((c, i) => `  --${name}-${i + 1}: ${c};`).join("\n");
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("palette");
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [harmony, setHarmony] = useState<Harmony>("monochromatic");
  const [gradColor1, setGradColor1] = useState("#0ad3ff");
  const [gradColor2, setGradColor2] = useState("#9b6dff");
  const [gradDir, setGradDir] = useState<GradientDir>("to right");
  const [fontIdx, setFontIdx] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedPalette, setCopiedPalette] = useState(false);
  const [previewText, setPreviewText] = useState("BrandKit Studio");
  const [darkMode, setDarkMode] = useState(true);

  const palette = useMemo(() => generatePalette(baseColor, harmony), [baseColor, harmony]);

  const handleCopy = useCallback(async (text: string, idx: number) => {
    await copyToClipboard(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const handleCopyCss = useCallback(() => {
    const css = `:root {\n${toCssVariables(palette)}\n}`;
    copyToClipboard(css);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  }, [palette]);

  const handleExportPalette = useCallback(() => {
    const json = JSON.stringify({ palette, harmony, baseColor }, null, 2);
    copyToClipboard(json);
    setCopiedPalette(true);
    setTimeout(() => setCopiedPalette(false), 2000);
  }, [palette, harmony, baseColor]);

  const bg = darkMode ? "#050508" : "#f5f7fa";
  const fg = darkMode ? "#f5f7fa" : "#0a0a0a";
  const cardBg = darkMode ? "rgba(14,15,29,0.65)" : "rgba(255,255,255,0.8)";
  const borderClr = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";

  return (
    <main className="min-h-screen" style={{ backgroundColor: bg, color: fg }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_${darkMode ? 'rgba(10,211,255,0.05)' : 'rgba(99,102,241,0.04)'}_0%,_transparent_60%)]`} />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="../index.html#project-brandkit-studio" className="p-2 rounded-lg" style={{ backgroundColor: darkMode ? "#141527" : "#f0f0f5", border: `1px solid ${borderClr}`, color: darkMode ? "#8087a3" : "#666" }} title="Back to Portfolio">
              <ArrowLeft size={16} />
            </a>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                  BK
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  BrandKit Studio
                </h1>
              </div>
              <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: darkMode ? "#8087a3" : "#888" }}>
                <Sparkles size={11} className="text-purple-400" />
                Brand identity toolkit
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: darkMode ? "#141527" : "#f0f0f5", border: `1px solid ${borderClr}`, color: darkMode ? "#8087a3" : "#666" }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8 overflow-x-auto" style={{ backgroundColor: darkMode ? "rgba(14,15,29,0.5)" : "rgba(0,0,0,0.04)", border: `1px solid ${borderClr}` }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? "shadow-sm" : ""}`}
              style={{
                backgroundColor: tab === t.key ? (darkMode ? "rgba(99,102,241,0.15)" : "white") : "transparent",
                color: tab === t.key ? (darkMode ? "#0ad3ff" : "#6366f1") : (darkMode ? "#8087a3" : "#888"),
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Palette */}
        {tab === "palette" && (
          <div className="space-y-6 animate-fade-up">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: cardBg, border: `1px solid ${borderClr}` }}>
              <h2 className="text-base font-bold mb-1">Color Palette</h2>
              <p className="text-xs mb-6" style={{ color: darkMode ? "#8087a3" : "#888" }}>Pick a base color and harmony type to generate a balanced palette.</p>

              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="w-14 h-14 rounded-xl border-0 cursor-pointer bg-transparent"
                      style={{ padding: 0 }}
                    />
                    <div className="absolute inset-0 rounded-xl border pointer-events-none" style={{ borderColor: borderClr }} />
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold">{baseColor}</div>
                    <div className="text-xs mt-0.5" style={{ color: darkMode ? "#8087a3" : "#888" }}>
                      {hexToRgb(baseColor).r}, {hexToRgb(baseColor).g}, {hexToRgb(baseColor).b}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {HARMONIES.map((h) => (
                    <button
                      key={h.key}
                      onClick={() => setHarmony(h.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: harmony === h.key ? (darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)") : "transparent",
                        color: harmony === h.key ? (darkMode ? "#0ad3ff" : "#6366f1") : (darkMode ? "#8087a3" : "#888"),
                        border: `1px solid ${harmony === h.key ? (darkMode ? "rgba(10,211,255,0.2)" : "rgba(99,102,241,0.2)") : "transparent"}`,
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {palette.map((c, i) => {
                  const tc = getTextColor(c);
                  const copied = copiedIdx === i;
                  return (
                    <div key={i} className="rounded-xl overflow-hidden animate-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="h-28 sm:h-36 flex items-end p-3 cursor-pointer transition-transform hover:scale-[1.03]" style={{ backgroundColor: c }} onClick={() => handleCopy(c, i)}>
                        <div className="flex items-center gap-1.5" style={{ color: tc }}>
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          <span className="text-xs font-mono font-bold">{c}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                <div className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: darkMode ? "#8087a3" : "#888" }}><Grid3X3 size={12} />Contrast Matrix</div>
                <div className="grid grid-cols-6 gap-1 text-[10px] font-mono">
                  <div />
                  {palette.map((c, i) => <div key={i} className="text-center font-bold" style={{ color: darkMode ? "#8087a3" : "#888" }}>{i + 1}</div>)}
                  {palette.map((c, i) => (
                    <>
                      <div className="font-bold" style={{ color: darkMode ? "#8087a3" : "#888" }}>{i + 1}</div>
                      {palette.map((d, j) => (
                        <div key={j} className="text-center px-1 py-0.5 rounded" style={{
                          backgroundColor: i === j ? (darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)") : "transparent",
                          color: i === j ? (darkMode ? "#555" : "#bbb") : (darkMode ? "#8087a3" : "#666"),
                        }}>
                          {i === j ? "-" : contrastRatio(c, d)}
                        </div>
                      ))}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Gradients */}
        {tab === "gradients" && (
          <div className="space-y-6 animate-fade-up">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: cardBg, border: `1px solid ${borderClr}` }}>
              <h2 className="text-base font-bold mb-1">Gradient Generator</h2>
              <p className="text-xs mb-6" style={{ color: darkMode ? "#8087a3" : "#888" }}>Create smooth gradients from two colors.</p>

              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex items-center gap-4">
                  {[gradColor1, gradColor2].map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={c}
                          onChange={(e) => i === 0 ? setGradColor1(e.target.value) : setGradColor2(e.target.value)}
                          className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                          style={{ padding: 0 }}
                        />
                        <div className="absolute inset-0 rounded-xl border pointer-events-none" style={{ borderColor: borderClr }} />
                      </div>
                      <span className="text-xs font-mono">{c}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { const t = gradColor1; setGradColor1(gradColor2); setGradColor2(t); }}
                    className="p-2 rounded-lg transition-all" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: darkMode ? "#8087a3" : "#888" }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["to right", "to bottom", "to bottom right", "to bottom left"] as GradientDir[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setGradDir(d)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: gradDir === d ? (darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)") : "transparent",
                        color: gradDir === d ? (darkMode ? "#0ad3ff" : "#6366f1") : (darkMode ? "#8087a3" : "#888"),
                        border: `1px solid ${gradDir === d ? (darkMode ? "rgba(10,211,255,0.2)" : "rgba(99,102,241,0.2)") : "transparent"}`,
                      }}
                    >
                      {d.replace("to ", "→ ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-48 sm:h-64 rounded-xl mb-6" style={{ background: `linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2})` }} />

              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-lg font-mono text-xs break-all" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.03)" }}>
                  background: linear-gradient({gradDir}, {gradColor1}, {gradColor2});
                </div>
                <button
                  onClick={() => { copyToClipboard(`background: linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2});`); setCopiedCss(true); setTimeout(() => setCopiedCss(false), 1500); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)", color: darkMode ? "#0ad3ff" : "#6366f1" }}
                >
                  {copiedCss ? "Copied!" : "Copy CSS"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Fonts */}
        {tab === "fonts" && (
          <div className="space-y-6 animate-fade-up">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: cardBg, border: `1px solid ${borderClr}` }}>
              <h2 className="text-base font-bold mb-1">Font Pairings</h2>
              <p className="text-xs mb-6" style={{ color: darkMode ? "#8087a3" : "#888" }}>Curated font combinations for your brand.</p>

              <div className="flex flex-wrap gap-1.5 mb-8">
                {FONT_PAIRS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFontIdx(i)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: fontIdx === i ? (darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)") : "transparent",
                      color: fontIdx === i ? (darkMode ? "#0ad3ff" : "#6366f1") : (darkMode ? "#8087a3" : "#888"),
                      border: `1px solid ${fontIdx === i ? (darkMode ? "rgba(10,211,255,0.2)" : "rgba(99,102,241,0.2)") : "transparent"}`,
                    }}
                  >
                    {FONT_PAIRS[i].heading} + {FONT_PAIRS[i].body}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: darkMode ? "#555" : "#aaa" }}>Heading</div>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold outline-none border-b" style={{ borderColor: borderClr, fontFamily: FONT_PAIRS[fontIdx].hClass === "font-serif" ? "Georgia, serif" : "Inter, system-ui, sans-serif" }}
                  />
                  <div className="text-xs mt-2" style={{ color: darkMode ? "#8087a3" : "#888" }}>{FONT_PAIRS[fontIdx].heading}</div>
                </div>
                <div className="p-6 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: darkMode ? "#555" : "#aaa" }}>Body</div>
                  <p className="text-sm leading-relaxed" style={{ fontFamily: FONT_PAIRS[fontIdx].bClass === "font-serif" ? "Georgia, serif" : "Inter, system-ui, sans-serif" }}>
                    {previewText || "BrandKit Studio"} is a brand identity toolkit for designers and developers. Generate cohesive color palettes, gradients, and typography systems in seconds.
                  </p>
                  <div className="text-xs mt-2" style={{ color: darkMode ? "#8087a3" : "#888" }}>{FONT_PAIRS[fontIdx].body}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Preview */}
        {tab === "preview" && (
          <div className="space-y-6 animate-fade-up">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: cardBg, border: `1px solid ${borderClr}` }}>
              <h2 className="text-base font-bold mb-1">Brand Preview</h2>
              <p className="text-xs mb-6" style={{ color: darkMode ? "#8087a3" : "#888" }}>See your brand identity applied to real-world materials.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {/* Business Card */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: darkMode ? "#555" : "#aaa" }}><Square size={10} />Business Card</div>
                  <div className="rounded-xl overflow-hidden shadow-2xl aspect-[1.6] flex flex-col relative" style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[2]})` }}>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="text-lg font-bold" style={{ color: getTextColor(palette[0]) }}>{previewText || "Brand"}</div>
                        <div className="text-xs mt-1 opacity-70" style={{ color: getTextColor(palette[0]) }}>Creative Studio</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette[3] }} />
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette[4] }} />
                        <div className="text-[10px] ml-auto opacity-60" style={{ color: getTextColor(palette[0]) }}>hello@brand.studio</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Banner */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: darkMode ? "#555" : "#aaa" }}><Monitor size={10} />Social Media Banner</div>
                  <div className="rounded-xl overflow-hidden shadow-2xl aspect-[2] flex flex-col relative" style={{ background: `linear-gradient(${gradDir}, ${gradColor1}, ${gradColor2})` }}>
                    <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
                      <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: getTextColor(gradColor1) }}>{previewText || "BrandKit Studio"}</div>
                      <div className="text-xs opacity-70 max-w-xs" style={{ color: getTextColor(gradColor1) }}>Design your brand identity — colors, typography, and previews in one place.</div>
                      <button className="mt-4 px-5 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: getTextColor(gradColor1) === "#ffffff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", color: getTextColor(gradColor1), backdropFilter: "blur(8px)" }}>
                        Get Started
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Preview */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                <div className="text-[10px] uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: darkMode ? "#555" : "#aaa" }}><Globe size={10} />Website Preview</div>
                <div className="rounded-xl overflow-hidden shadow-2xl border" style={{ borderColor: borderClr }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: darkMode ? "#0a0a0f" : "#f0f0f5" }}>
                    <div className="flex gap-1.5">
                      {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (<div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />))}
                    </div>
                    <div className="flex-1 max-w-md mx-auto">
                      <div className="text-[10px] py-1 px-3 rounded-md text-center" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: darkMode ? "#555" : "#aaa" }}>brand.preview</div>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8" style={{ backgroundColor: darkMode ? "#050508" : "white" }}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg" style={{ backgroundColor: palette[0] }} />
                        <span className="text-sm font-bold" style={{ color: darkMode ? "#f5f7fa" : "#0a0a0a" }}>{previewText || "Brand"}</span>
                      </div>
                      <div className="flex gap-4 text-xs" style={{ color: darkMode ? "#8087a3" : "#888" }}>
                        <span>Work</span>
                        <span>About</span>
                        <span>Contact</span>
                      </div>
                    </div>
                    <div className="max-w-lg">
                      <div className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: darkMode ? "#f5f7fa" : "#0a0a0a" }}>We build digital experiences.</div>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: darkMode ? "#8087a3" : "#666" }}>A brand identity toolkit for modern teams. Generate cohesive systems that scale.</p>
                      <div className="flex gap-2">
                        <div className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: palette[0] }}>Get Started</div>
                        <div className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: darkMode ? "#8087a3" : "#666" }}>Learn More</div>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-lg" style={{ backgroundColor: palette[(i * 2) % palette.length] }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Export */}
        {tab === "export" && (
          <div className="space-y-6 animate-fade-up">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: cardBg, border: `1px solid ${borderClr}` }}>
              <h2 className="text-base font-bold mb-1">Export</h2>
              <p className="text-xs mb-6" style={{ color: darkMode ? "#8087a3" : "#888" }}>Export your brand kit as CSS variables or JSON.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* CSS Variables */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold">CSS Variables</div>
                    <button
                      onClick={handleCopyCss}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)", color: darkMode ? "#0ad3ff" : "#6366f1" }}
                    >
                      {copiedCss ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCss ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto" style={{ backgroundColor: darkMode ? "#050508" : "#f5f5f5", color: darkMode ? "#8087a3" : "#666" }}>
                    <span style={{ color: darkMode ? "#0ad3ff" : "#6366f1" }}>:root</span> {"{"}
                    {"\n"}{toCssVariables(palette)}
                    {"\n}"}
                  </pre>
                </div>

                {/* JSON Export */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold">JSON Palette</div>
                    <button
                      onClick={handleExportPalette}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)", color: darkMode ? "#0ad3ff" : "#6366f1" }}
                    >
                      {copiedPalette ? <Check size={12} /> : <Download size={12} />}
                      {copiedPalette ? "Copied" : "Copy JSON"}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto" style={{ backgroundColor: darkMode ? "#050508" : "#f5f5f5", color: darkMode ? "#8087a3" : "#666" }}>
{"{"}
  {"\""}palette{"\""}: [{palette.map((c) => `"${c}"`).join(", ")}],
  {"\""}harmony{"\""}: {"\""}{harmony}{"\""},
  {"\""}baseColor{"\""}: {"\""}{baseColor}{"\""}
{"}"}
                  </pre>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.02)" }}>
                <div>
                  <div className="text-sm font-bold">Color Usage</div>
                  <div className="text-xs mt-0.5" style={{ color: darkMode ? "#8087a3" : "#888" }}>{palette.length} colors ready for design systems.</div>
                </div>
                <div className="flex gap-1">
                  {palette.map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg cursor-pointer transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                      onClick={() => handleCopy(c, 99)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: darkMode ? "rgba(128,131,163,0.3)" : "rgba(0,0,0,0.15)" }}>
            BrandKit Studio — All tools run locally. No data leaves your browser.
          </p>
        </div>
      </div>
    </main>
  );
}
