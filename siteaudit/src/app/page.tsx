"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
  FileText,
  Download,
  Globe,
  Zap,
  Eye,
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Award,
  BarChart3,
  Lightbulb,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";

type ScoreCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "mobile"
  | "security";

interface ScoreDetail {
  label: string;
  passed: boolean;
  weight: number;
}

interface Suggestion {
  category: ScoreCategory;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
}

interface AuditResult {
  url: string;
  overall: number;
  scores: Record<ScoreCategory, number>;
  details: Record<ScoreCategory, ScoreDetail[]>;
  suggestions: Suggestion[];
}

const CATEGORIES: {
  key: ScoreCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}[] = [
  {
    key: "seo",
    label: "SEO",
    icon: <Search size={18} />,
    color: "#0ad3ff",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    key: "performance",
    label: "Performance",
    icon: <Zap size={18} />,
    color: "#22d65e",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    icon: <Eye size={18} />,
    color: "#f5a623",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    key: "mobile",
    label: "Mobile",
    icon: <Smartphone size={18} />,
    color: "#9b6dff",
    gradient: "from-purple-400 to-violet-500",
  },
  {
    key: "security",
    label: "Security",
    icon: <Shield size={18} />,
    color: "#ff4d6a",
    gradient: "from-rose-400 to-red-500",
  },
];

const SEVERITY_CONFIG = {
  critical: { icon: <AlertTriangle size={14} />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { icon: <Info size={14} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  info: { icon: <CheckCircle size={14} />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;

function hashUrl(url: string): number {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * (index + 1) + index) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number, i: number): T {
  return arr[Math.floor(seededRandom(seed, i) * arr.length)];
}

function simulateAudit(url: string): AuditResult {
  const seed = hashUrl(url);
  const base = (catIdx: number) =>
    Math.floor(42 + seededRandom(seed, catIdx) * 52);

  const scores: Record<ScoreCategory, number> = {
    seo: base(0),
    performance: base(1),
    accessibility: base(2),
    mobile: base(3),
    security: base(4),
  };

  const allDetails: Record<ScoreCategory, ScoreDetail[]> = {
    seo: [],
    performance: [],
    accessibility: [],
    mobile: [],
    security: [],
  };

  const allSuggestions: Suggestion[] = [];

  const checks: Record<
    ScoreCategory,
    { label: string; check: (s: number) => boolean; weight: number; failMsg: string; fixMsg: string }[]
  > = {
    seo: [
      { label: "Meta title & description", check: (s) => s > 70, weight: 20, failMsg: "Missing or duplicate meta tags", fixMsg: "Add unique <title> and <meta name='description'> to every page" },
      { label: "Heading structure (H1-H6)", check: (s) => s > 60, weight: 15, failMsg: "Poor heading hierarchy", fixMsg: "Use exactly one H1 per page and nest headings sequentially" },
      { label: "Image alt attributes", check: (s) => s > 55, weight: 15, failMsg: "Missing alt text on images", fixMsg: "Add descriptive alt attributes to all <img> elements" },
      { label: "Canonical URL", check: (s) => s > 50, weight: 10, failMsg: "No canonical tag", fixMsg: "Add <link rel='canonical'> to prevent duplicate content issues" },
      { label: "Open Graph tags", check: (s) => s > 65, weight: 10, failMsg: "Missing OG meta tags", fixMsg: "Add og:title, og:description, og:image for social sharing" },
      { label: "Structured data", check: (s) => s > 60, weight: 10, failMsg: "No JSON-LD structured data", fixMsg: "Add Schema.org structured data (e.g., Organization, WebPage)" },
      { label: "XML Sitemap", check: (s) => s > 45, weight: 10, failMsg: "Sitemap not detected", fixMsg: "Submit an XML sitemap to Google Search Console" },
      { label: "Robots.txt", check: (s) => s > 40, weight: 10, failMsg: "robots.txt not found", fixMsg: "Create a robots.txt allowing search crawlers" },
    ],
    performance: [
      { label: "First Contentful Paint", check: (s) => s > 70, weight: 20, failMsg: "FCP exceeds 2.5s", fixMsg: "Eliminate render-blocking resources and optimize CSS delivery" },
      { label: "Largest Contentful Paint", check: (s) => s > 65, weight: 20, failMsg: "LCP exceeds 4.0s", fixMsg: "Optimize largest image/text element; use lazy loading" },
      { label: "JavaScript bundle size", check: (s) => s > 60, weight: 15, failMsg: "JS bundle too large", fixMsg: "Implement code splitting and tree-shaking" },
      { label: "Image optimization", check: (s) => s > 55, weight: 15, failMsg: "Unoptimized images detected", fixMsg: "Use modern formats (WebP/AVIF) and serve responsive sizes" },
      { label: "Caching strategy", check: (s) => s > 50, weight: 10, failMsg: "Weak cache headers", fixMsg: "Set Cache-Control and ETag headers for static assets" },
      { label: "Server response time", check: (s) => s > 60, weight: 10, failMsg: "TTFB > 800ms", fixMsg: "Use CDN, optimize server, enable compression" },
      { label: "Minification", check: (s) => s > 45, weight: 10, failMsg: "CSS/JS not minified", fixMsg: "Enable minification in your build toolchain" },
    ],
    accessibility: [
      { label: "Color contrast", check: (s) => s > 70, weight: 20, failMsg: "Insufficient contrast ratio", fixMsg: "Ensure text meets WCAG AA (4.5:1) contrast minimum" },
      { label: "ARIA attributes", check: (s) => s > 60, weight: 15, failMsg: "Missing ARIA landmarks", fixMsg: "Add role='navigation', 'main', 'banner' to key sections" },
      { label: "Keyboard navigation", check: (s) => s > 65, weight: 15, failMsg: "Tab order issues", fixMsg: "Ensure all interactive elements are reachable via Tab" },
      { label: "Form labels", check: (s) => s > 55, weight: 15, failMsg: "Inputs missing labels", fixMsg: "Associate every <input> with a <label> element" },
      { label: "Alt text on images", check: (s) => s > 50, weight: 10, failMsg: "Decorative images lack alt=''", fixMsg: "Set alt='' for decorative images, descriptive alt for content" },
      { label: "Focus indicators", check: (s) => s > 60, weight: 10, failMsg: "Focus styles removed", fixMsg: "Never set outline: none without providing focus-visible styles" },
      { label: "Document language", check: (s) => s > 45, weight: 10, failMsg: "Missing lang attribute", fixMsg: "Add lang='en' (or correct locale) to <html>" },
      { label: "Video captions", check: (s) => s > 40, weight: 5, failMsg: "No captions on media", fixMsg: "Provide captions or transcripts for video/audio content" },
    ],
    mobile: [
      { label: "Viewport meta tag", check: (s) => s > 75, weight: 20, failMsg: "Missing viewport tag", fixMsg: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>" },
      { label: "Touch target sizes", check: (s) => s > 65, weight: 15, failMsg: "Small touch targets", fixMsg: "Ensure buttons/links are at least 48x48px" },
      { label: "Responsive layout", check: (s) => s > 70, weight: 20, failMsg: "Layout breaks on mobile", fixMsg: "Use CSS Grid/Flexbox with relative units (rem, %)" },
      { label: "Font size readability", check: (s) => s > 55, weight: 10, failMsg: "Body text below 16px", fixMsg: "Set base font-size to at least 16px" },
      { label: "Horizontal overflow", check: (s) => s > 60, weight: 15, failMsg: "Content exceeds viewport", fixMsg: "Apply overflow-x: hidden and use max-width: 100% on elements" },
      { label: "Tap delay", check: (s) => s > 50, weight: 10, failMsg: "300ms tap delay present", fixMsg: "Set touch-action: manipulation on interactive elements" },
      { label: "Content sizing", check: (s) => s > 45, weight: 10, failMsg: "Content not fluid", fixMsg: "Use clamp() and container queries for fluid typography" },
    ],
    security: [
      { label: "HTTPS enforcement", check: (s) => s > 80, weight: 20, failMsg: "No HTTPS redirect", fixMsg: "Redirect HTTP to HTTPS with a 301 and enable HSTS" },
      { label: "Content Security Policy", check: (s) => s > 65, weight: 15, failMsg: "Missing CSP header", fixMsg: "Add Content-Security-Policy header to prevent XSS" },
      { label: "X-Frame-Options", check: (s) => s > 55, weight: 12, failMsg: "Clickjacking risk", fixMsg: "Set X-Frame-Options: DENY or SAMEORIGIN" },
      { label: "XSS Protection", check: (s) => s > 60, weight: 12, failMsg: "Reflected XSS possible", fixMsg: "Set X-XSS-Protection: 1; mode=block and sanitize inputs" },
      { label: "Secure cookies", check: (s) => s > 50, weight: 10, failMsg: "Cookies missing flags", fixMsg: "Set Secure, HttpOnly, and SameSite=Lax on all cookies" },
      { label: "Subresource Integrity", check: (s) => s > 45, weight: 10, failMsg: "No SRI on CDN resources", fixMsg: "Add integrity hashes to external <script>/<link> tags" },
      { label: "Referrer Policy", check: (s) => s > 40, weight: 8, failMsg: "Referrer leakage", fixMsg: "Set Referrer-Policy: strict-origin-when-cross-origin" },
      { label: "Permissions Policy", check: (s) => s > 35, weight: 8, failMsg: "No permissions policy", fixMsg: "Restrict camera/mic/geolocation with Permissions-Policy header" },
      { label: "CORS configuration", check: (s) => s > 40, weight: 5, failMsg: "Permissive CORS", fixMsg: "Restrict Access-Control-Allow-Origin to specific origins" },
    ],
  };

  for (const cat of Object.keys(checks) as ScoreCategory[]) {
    const catScore = scores[cat];
    const catChecks = checks[cat];
    let detailPassCount = 0;

    for (let i = 0; i < catChecks.length; i++) {
      const c = catChecks[i];
      const passed = c.check(catScore + seededRandom(seed, cat.charCodeAt(0) + i) * 15 - 7.5);
      if (passed) detailPassCount++;
      allDetails[cat].push({ label: c.label, passed, weight: c.weight });
      if (!passed) {
        const sevIdx = seededRandom(seed, 100 + cat.charCodeAt(0) + i);
        const severity: "critical" | "warning" | "info" =
          sevIdx < 0.3 ? "critical" : sevIdx < 0.65 ? "warning" : "info";
        allSuggestions.push({
          category: cat,
          severity,
          title: c.failMsg,
          description: c.fixMsg,
        });
      }
    }

    const passRate = detailPassCount / catChecks.length;
    const adjusted = Math.round(catScore * (0.5 + passRate * 0.5));
    scores[cat] = Math.min(99, Math.max(18, adjusted));
  }

  const overall = Math.round(
    (scores.seo + scores.performance + scores.accessibility + scores.mobile + scores.security) / 5
  );

  return { url, overall, scores, details: allDetails, suggestions: allSuggestions };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "#22d65e";
  if (score >= 65) return "#f5a623";
  if (score >= 45) return "#ff8533";
  return "#ff4d6a";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

function formatUrl(input: string): string {
  let u = input.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  try {
    const parsed = new URL(u);
    return parsed.hostname + parsed.pathname.replace(/\/$/, "");
  } catch {
    return u;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const runAudit = useCallback(async () => {
    if (!url.trim() || !URL_REGEX.test(url.trim())) return;

    setLoading(true);
    setShowResults(false);
    setResult(null);
    setProgress(0);

    const phases = [
      "Connecting to server...",
      "Analyzing HTML structure...",
      "Evaluating performance metrics...",
      "Checking accessibility...",
      "Testing mobile responsiveness...",
      "Scanning security headers...",
      "Generating report...",
    ];

    for (let i = 0; i < phases.length; i++) {
      setPhase(phases[i]);
      setProgress(Math.round(((i + 1) / phases.length) * 100));
      await new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
    }

    const formatted = formatUrl(url);
    const auditResult = simulateAudit(formatted);

    setResult(auditResult);
    setLoading(false);
    setPhase("");

    requestAnimationFrame(() => {
      setShowResults(true);
    });
  }, [url]);

  const exportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#050508",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const w = window.open("");
      if (w) {
        w.document.write(`
          <html>
          <head><title>SiteAudit Pro Report</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; background: #050508; }
            img { max-width: 100%; height: auto; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print();" />
          </body>
          </html>
        `);
        w.document.close();
      }
    } catch {
      alert("Could not export PDF. Try downloading the report image.");
    }
    setExporting(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runAudit();
  };

  const isValid = URL_REGEX.test(url.trim());

  useEffect(() => {
    const hashes = window.location.hash.replace("#", "");
    if (hashes) {
      setUrl(hashes);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#e8edf5] font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(10,211,255,0.06)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(155,109,255,0.04)_0%,_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Back link */}
        <a
          href="../index.html#project-siteaudit-pro"
          className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Portfolio
        </a>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] uppercase tracking-[0.2em] text-white/40 mb-5">
            <BarChart3 size={12} className="text-cyan-400" />
            Audit Tool
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3">
            Site<span className="text-gradient">Audit</span> Pro
          </h1>
          <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto">
            Enter any website URL to get a professional-grade audit report with actionable recommendations.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-2xl mx-auto mb-12 sm:mb-20">
          <div className="glass-panel rounded-2xl p-2 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 pl-4">
              <Globe size={16} className="text-white/20 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="example.com"
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/20 outline-none py-2.5"
              />
            </div>
            <button
              onClick={runAudit}
              disabled={!isValid || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {loading ? "Scanning..." : "Run Audit"}
            </button>
          </div>

          {!isValid && url.length > 0 && (
            <p className="text-xs text-red-400/70 mt-2 pl-4">
              Enter a valid domain (e.g., example.com)
            </p>
          )}
        </div>

        {/* Loading phase */}
        {loading && (
          <div className="max-w-xl mx-auto mb-16 text-center animate-fade-up">
            <div className="glass-panel rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-sm text-white/50 mb-4">{phase}</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && showResults && (
          <div ref={reportRef} className="space-y-6 animate-fade-up">
            {/* Overall score */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <div className="relative shrink-0">
                  <svg width="120" height="120" className="transform -rotate-90">
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke={getScoreColor(result.overall)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.overall / 100) * 326.7} 326.7`}
                      className="transition-all duration-1000 ease-out"
                      style={{ strokeDasharray: `${(result.overall / 100) * 326.7} 326.7` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight" style={{ color: getScoreColor(result.overall) }}>
                      {result.overall}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 mt-0.5">SCORE</span>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <Award size={16} style={{ color: getScoreColor(result.overall) }} />
                    <span className="text-lg font-semibold" style={{ color: getScoreColor(result.overall) }}>
                      {getScoreLabel(result.overall)}
                  </span>
                  </div>
                  <p className="text-white/40 text-sm">
                    Audit report for <span className="text-white/70 font-medium">{result.url}</span>
                  </p>
                  <p className="text-white/25 text-xs mt-1">
                    {result.suggestions.length} issues found across 5 categories
                  </p>
                </div>
              </div>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat, idx) => {
                const score = result.scores[cat.key];
                const color = getScoreColor(score);
                return (
                  <div
                    key={cat.key}
                    className="glass-card rounded-xl p-5 animate-fade-up"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                      <span
                        className="text-lg font-bold tabular-nums"
                        style={{ color }}
                      >
                        {score}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full animate-progress"
                        style={{
                          width: `${score}%`,
                          background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-white/25 uppercase tracking-wider">
                        {getScoreLabel(score)}
                      </span>
                      <span className="text-[11px] text-white/20">
                        {result.details[cat.key].filter((d) => d.passed).length}/{result.details[cat.key].length} passed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <Lightbulb size={18} className="text-amber-400" />
                  <h2 className="text-lg font-semibold">
                    Recommendations
                  </h2>
                  <span className="text-xs text-white/30 ml-auto">
                    {result.suggestions.length} items
                  </span>
                </div>
                <div className="space-y-3">
                  {result.suggestions.map((s, i) => {
                    const sev = SEVERITY_CONFIG[s.severity];
                    const catInfo = CATEGORIES.find((c) => c.key === s.category);
                    return (
                      <div
                        key={i}
                        className={`${sev.bg} ${sev.color} ${sev.border === "border-red-500/20" ? "border-red-500/15" : sev.border === "border-amber-500/20" ? "border-amber-500/15" : "border-cyan-500/15"} border rounded-xl p-4 animate-fade-up`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{sev.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium">{s.title}</span>
                              {catInfo && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${catInfo.color}15`,
                                    color: catInfo.color,
                                  }}
                                >
                                  {catInfo.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/40">{s.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details per category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((cat, idx) => {
                const details = result.details[cat.key];
                return (
                  <div
                    key={cat.key}
                    className="glass-card rounded-xl p-5 animate-fade-up"
                    style={{ animationDelay: `${(idx + 5) * 80}ms` }}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-sm font-medium">{cat.label} Checks</span>
                    </div>
                    <div className="space-y-2">
                      {details.map((d, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          {d.passed ? (
                            <CheckCircle size={12} className="text-green-400 shrink-0" />
                          ) : (
                            <X size={12} className="text-red-400/60 shrink-0" />
                          )}
                          <span className={`text-xs ${d.passed ? "text-white/50" : "text-white/35"}`}>
                            {d.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between glass-panel rounded-2xl p-5">
              <button
                onClick={() => {
                  setResult(null);
                  setShowResults(false);
                  setUrl("");
                }}
                className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <RefreshCw size={14} />
                New Audit
              </button>
              <button
                onClick={exportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {exporting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {exporting ? "Preparing..." : "Export Report (PDF)"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 sm:mt-24 pb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/15">
            SiteAudit Pro — All analysis is simulated client-side. No data is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
