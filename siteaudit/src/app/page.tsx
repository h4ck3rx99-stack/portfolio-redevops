"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
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
  Award,
  BarChart3,
  Lightbulb,
  X,
  ChevronDown,
  ExternalLink,
  Clock,
  FileText,
  Layers,
  Server,
  Palette,
  Tag,
} from "lucide-react";


type ScoreCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "mobile"
  | "security";

interface Finding {
  label: string;
  passed: boolean;
  weight: number;
  detail?: string;
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
  findings: Record<ScoreCategory, Finding[]>;
  suggestions: Suggestion[];
  pagesize?: string;
  resources?: number;
  fetchSuccess: boolean;
}

const CATEGORIES: {
  key: ScoreCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "seo", label: "SEO", icon: <Search size={16} />, color: "#0ad3ff" },
  { key: "performance", label: "Performance", icon: <Zap size={16} />, color: "#22d65e" },
  { key: "accessibility", label: "Accessibility", icon: <Eye size={16} />, color: "#f5a623" },
  { key: "mobile", label: "Mobile", icon: <Smartphone size={16} />, color: "#9b6dff" },
  { key: "security", label: "Security", icon: <Shield size={16} />, color: "#ff4d6a" },
];

const SEVERITY_STYLES = {
  critical: { icon: <AlertTriangle size={14} />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Critical" },
  warning: { icon: <Info size={14} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15", label: "Warning" },
  info: { icon: <CheckCircle size={14} />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/15", label: "Info" },
};

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;
const PROXIES = [
  (u: string) => u,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

function formatUrl(input: string): string {
  let u = input.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  try {
    const p = new URL(u);
    return p.hostname + (p.pathname !== "/" ? p.pathname.replace(/\/$/, "") : "");
  } catch { return u; }
}

function getScoreColor(s: number): string {
  return s >= 85 ? "#22d65e" : s >= 65 ? "#f5a623" : s >= 45 ? "#ff8533" : "#ff4d6a";
}

function getScoreLabel(s: number): string {
  return s >= 85 ? "Excellent" : s >= 70 ? "Good" : s >= 55 ? "Fair" : s >= 40 ? "Poor" : "Critical";
}

function estimatePageSize(html: string): string {
  const bytes = new TextEncoder().encode(html).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function countOccurrences(html: string, tag: string): number {
  const regex = new RegExp(`<${tag}[\\s>]`, "gi");
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

async function fetchUrl(url: string): Promise<{ html: string; headers: Record<string, string>; timing: number } | null> {
  const start = performance.now();
  for (const proxyFn of PROXIES) {
    try {
      const res = await fetch(proxyFn(url), { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const html = await res.text();
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      return { html, headers, timing: Math.round(performance.now() - start) };
    } catch { continue; }
  }
  return null;
}

function analyzeByURL(url: string): AuditResult {
  const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const tld = domain.split(".").pop() || "";
  const pathDepth = (url.match(/\//g) || []).length - 2;
  const hasQuery = url.includes("?");
  const hasHTTPS = url.startsWith("https://");
  const hasWWW = url.includes("www.");
  const hasHyphen = domain.includes("-");
  const pathStr = domain.includes("/") ? domain.substring(domain.indexOf("/")) : "";

  const allFindings: Record<ScoreCategory, Finding[]> = { seo: [], performance: [], accessibility: [], mobile: [], security: [] };
  const allSuggestions: Suggestion[] = [];

  function addFinding(cat: ScoreCategory, label: string, passed: boolean, weight: number) {
    allFindings[cat].push({ label, passed, weight });
  }
  function addSuggestion(cat: ScoreCategory, severity: "critical" | "warning" | "info", title: string, description: string) {
    allSuggestions.push({ category: cat, severity, title, description });
  }

  // SEO
  addFinding("seo", "URL uses HTTPS", hasHTTPS, 14);
  addFinding("seo", "No www prefix (canonical)", !hasWWW, 8);
  addFinding("seo", "Short clean URL", domain.length < 25, 10);
  addFinding("seo", "No hyphens in domain", !hasHyphen, 6);
  addFinding("seo", "Trusted TLD (.com/.org/.io)", ["com", "org", "io", "gov", "edu"].includes(tld), 8);
  addFinding("seo", "Shallow URL path", pathDepth <= 2, 8);
  addFinding("seo", "No query parameters", !hasQuery, 6);
  addFinding("seo", "Descriptive URL structure", pathStr.length < 50 || pathStr === "", 6);

  if (!hasHTTPS) addSuggestion("seo", "critical", "URL not using HTTPS", "Switch to HTTPS for security and better SEO rankings.");
  if (hasWWW) addSuggestion("seo", "warning", "WWW subdomain detected", "Canonicalize to non-www or www — pick one and redirect.");
  if (hasHyphen) addSuggestion("seo", "info", "Hyphens in domain name", "Hyphens can reduce domain memorability and trust.");
  if (!["com", "org", "io", "gov", "edu"].includes(tld)) addSuggestion("seo", "info", `Uncommon TLD (.${tld})`, "Consider using .com/.org/.io for better credibility.");
  if (pathDepth > 3) addSuggestion("seo", "warning", "Deep URL nesting", "Keep URLs shallow (ideally 2-3 levels) for SEO.");
  if (hasQuery) addSuggestion("seo", "warning", "Query parameters in URL", "Static URLs are preferred; use URL rewrites for dynamic content.");

  // Performance
  addFinding("performance", "HTTPS with HTTP/2 support", hasHTTPS, 12);
  addFinding("performance", "No query strings (cache-friendly)", !hasQuery, 10);
  addFinding("performance", "Short domain (fast DNS)", domain.length < 20, 8);
  addFinding("performance", "Standard TLD (fast resolver)", ["com", "org", "net", "io"].includes(tld), 8);
  addFinding("performance", "Simple URL structure", pathDepth <= 3, 8);
  addFinding("performance", "No URL fragments", !url.includes("#"), 6);

  if (!hasHTTPS) addSuggestion("performance", "warning", "HTTP instead of HTTPS", "HTTPS enables HTTP/2 which improves performance.");
  if (hasQuery) addSuggestion("performance", "info", "Query parameters reduce cacheability", "Use URL parameters sparingly to improve CDN caching.");

  // Accessibility
  addFinding("accessibility", "No www (easier to type)", !hasWWW, 6);
  addFinding("accessibility", "Short, memorable URL", domain.length < 20, 8);
  addFinding("accessibility", "No special characters", !hasHyphen, 6);
  addFinding("accessibility", "Clear URL structure", pathStr.length < 40 || pathStr === "", 6);
  addFinding("accessibility", "HTTPS (accessibility-safe)", hasHTTPS, 6);

  // Mobile
  addFinding("mobile", "Short URL (mobile-friendly)", domain.length < 20, 8);
  addFinding("mobile", "No query parameters", !hasQuery, 6);
  addFinding("mobile", "Simple path structure", pathDepth <= 2, 8);
  addFinding("mobile", "Standard TLD", ["com", "org", "net", "io"].includes(tld), 6);
  if (hasQuery) addSuggestion("mobile", "info", "Query parameters may affect mobile UX", "Clean URLs are easier to share on mobile.");

  // Security
  addFinding("security", "HTTPS enforced", hasHTTPS, 20);
  addFinding("security", "No query strings (fewer attack vectors)", !hasQuery, 8);
  addFinding("security", "Standard TLD (trusted zone)", !["tk", "ml", "ga", "cf", "gq"].includes(tld), 8);
  if (!hasHTTPS) addSuggestion("security", "critical", "No HTTPS detected", "HTTPS is mandatory for modern web security. Install a TLS certificate.");
  if (["tk", "ml", "ga", "cf", "gq"].includes(tld)) addSuggestion("security", "warning", "Uncommon free TLD", "Free TLDs are often associated with spam. Consider a paid domain.");

  function calc(findings: Finding[]): number {
    if (findings.length === 0) return 50;
    const tw = findings.reduce((a, f) => a + f.weight, 0);
    const pw = findings.filter((f) => f.passed).reduce((a, f) => a + f.weight, 0);
    return Math.round((pw / tw) * 100);
  }

  return {
    url,
    overall: Math.round((calc(allFindings.seo) + calc(allFindings.performance) + calc(allFindings.accessibility) + calc(allFindings.mobile) + calc(allFindings.security)) / 5),
    scores: {
      seo: calc(allFindings.seo),
      performance: calc(allFindings.performance),
      accessibility: calc(allFindings.accessibility),
      mobile: calc(allFindings.mobile),
      security: calc(allFindings.security),
    },
    findings: allFindings,
    suggestions: allSuggestions.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }),
    fetchSuccess: false,
  };
}

function runFullAudit(url: string, html: string, headers: Record<string, string>, timing: number): AuditResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const baseScores = { seo: 50, performance: 50, accessibility: 50, mobile: 50, security: 50 };
  const allFindings: Record<ScoreCategory, Finding[]> = { seo: [], performance: [], accessibility: [], mobile: [], security: [] };
  const allSuggestions: Suggestion[] = [];

  function addFinding(cat: ScoreCategory, label: string, passed: boolean, weight: number, detail?: string) {
    allFindings[cat].push({ label, passed, weight, detail });
  }

  function addSuggestion(cat: ScoreCategory, severity: "critical" | "warning" | "info", title: string, description: string) {
    allSuggestions.push({ category: cat, severity, title, description });
  }

  // ─── SEO ───
  const title = doc.querySelector("title")?.textContent?.trim() || "";
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "";
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
  const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href");
  const h1s = doc.querySelectorAll("h1");
  const h2s = doc.querySelectorAll("h2");
  const imgs = doc.querySelectorAll("img");
  const structured = doc.querySelector('script[type="application/ld+json"]');
  const viewport = doc.querySelector('meta[name="viewport"]');
  const hasSitemap = html.toLowerCase().includes("sitemap");
  const hasRobots = html.toLowerCase().includes("robots.txt");
  const links = doc.querySelectorAll("a[href]");
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  links.forEach((a) => {
    const h = a.getAttribute("href") || "";
    if (h.startsWith("http") && !h.includes(url.split("/")[0])) externalLinks.push(h);
    else if (!h.startsWith("#") && !h.startsWith("javascript:")) internalLinks.push(h);
  });

  addFinding("seo", "Meta title present", title.length > 0, 12, title.length > 0 ? `${title.length} chars` : undefined);
  if (title.length === 0) addSuggestion("seo", "critical", "Missing <title> tag", "Add a descriptive title tag (50-60 chars) to every page.");
  else if (title.length > 70) addSuggestion("seo", "warning", "Title too long (" + title.length + " chars)", "Keep titles under 60 characters for optimal SERP display.");

  addFinding("seo", "Meta description present", metaDesc.length > 0, 10, metaDesc.length > 0 ? `${metaDesc.length} chars` : undefined);
  if (metaDesc.length === 0) addSuggestion("seo", "critical", "Missing meta description", "Add <meta name='description'> (120-160 chars) for search snippets.");
  else if (metaDesc.length > 170) addSuggestion("seo", "warning", "Meta description too long", "Keep meta descriptions under 160 characters.");

  addFinding("seo", "Open Graph tags", !!ogTitle, 8);
  if (!ogTitle) addSuggestion("seo", "warning", "Missing og:title", "Open Graph tags improve social sharing appearance.");
  if (ogTitle && !ogImg) addSuggestion("seo", "info", "Missing og:image", "Add og:image for rich social media previews.");

  addFinding("seo", "Canonical URL", !!canonical, 8);
  if (!canonical) addSuggestion("seo", "warning", "No canonical URL", "Add <link rel='canonical'> to prevent duplicate content issues.");

  const h1Count = h1s.length;
  addFinding("seo", "Heading structure (H1)", h1Count === 1, 10, `${h1Count} H1 found`);
  if (h1Count === 0) addSuggestion("seo", "critical", "No H1 heading", "Every page needs exactly one H1 for semantic structure.");
  else if (h1Count > 1) addSuggestion("seo", "warning", `${h1Count} H1 tags found`, "Use exactly one H1 per page for proper heading hierarchy.");

  const h2Count = h2s.length;
  if (h2Count === 0 && h1Count > 0) addSuggestion("seo", "info", "No H2 headings", "Use H2 subheadings to structure content sections.");

  const noAltImgs = Array.from(imgs).filter((img) => !img.getAttribute("alt")).length;
  const altPass = noAltImgs === 0;
  addFinding("seo", "Image alt attributes", altPass, 8, imgs.length > 0 ? `${noAltImgs}/${imgs.length} missing alt` : undefined);
  if (noAltImgs > 0) addSuggestion("seo", "warning", `${noAltImgs} images missing alt text`, "All <img> elements need descriptive alt attributes for accessibility and SEO.");

  addFinding("seo", "Structured data (JSON-LD)", !!structured, 8);
  if (!structured) addSuggestion("seo", "info", "No structured data", "Add Schema.org JSON-LD for rich search results.");

  addFinding("seo", "Viewport meta tag", !!viewport, 6);
  addFinding("seo", "XML Sitemap reference", hasSitemap, 5);
  addFinding("seo", "Internal links found", internalLinks.length > 0, 5, `${internalLinks.length} internal links`);
  if (internalLinks.length === 0) addSuggestion("seo", "info", "No internal links detected", "Internal linking helps search engines discover content.");

  // ─── PERFORMANCE ───
  const scripts = doc.querySelectorAll("script[src]");
  const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
  const totalImages = imgs.length;
  const lazyImgs = doc.querySelectorAll("img[loading='lazy']");
  const deferScripts = doc.querySelectorAll("script[defer], script[async]");
  const inlineStyles = doc.querySelectorAll("style:not([scoped])");
  const resourceCount = scripts.length + stylesheets.length + totalImages;
  const pageSize = estimatePageSize(html);
  const pageSizeKB = parseFloat(pageSize);

  addFinding("performance", "Page HTML size", pageSizeKB < 100, 15, pageSize);
  if (pageSizeKB > 200) addSuggestion("performance", "warning", `Large page size (${pageSize})`, "Minify HTML, CSS, and JavaScript to reduce page weight.");
  else if (pageSizeKB > 100) addSuggestion("performance", "info", `Page size ${pageSize} could be optimized`, "Consider further compression and resource optimization.");

  addFinding("performance", "Total resources", resourceCount < 50, 12, `${resourceCount} resources`);
  if (resourceCount > 80) addSuggestion("performance", "critical", `${resourceCount} resource requests`, "Reduce the number of HTTP requests by bundling and lazy-loading.");
  else if (resourceCount > 40) addSuggestion("performance", "warning", `${resourceCount} resource requests`, "Aim for under 40 requests for optimal performance.");

  const lazyRatio = totalImages > 0 ? lazyImgs.length / totalImages : 1;
  addFinding("performance", "Lazy loading on images", lazyRatio > 0.3 || totalImages === 0, 10, totalImages > 0 ? `${lazyImgs.length}/${totalImages} lazy` : "no images");
  if (totalImages > 5 && lazyRatio < 0.2) addSuggestion("performance", "warning", "Images missing lazy loading", "Add loading='lazy' to below-the-fold images.");

  addFinding("performance", "Async/defer scripts", deferScripts.length > 0 || scripts.length === 0, 10, `${deferScripts.length}/${scripts.length} async/defer`);
  if (scripts.length > 0 && deferScripts.length < scripts.length * 0.5) addSuggestion("performance", "warning", "Render-blocking scripts detected", "Use async or defer on non-critical scripts.");

  addFinding("performance", "CSS minified/external", stylesheets.length < 5 || inlineStyles.length === 0, 8);
  if (inlineStyles.length > 3) addSuggestion("performance", "info", `${inlineStyles.length} inline style blocks`, "Move inline CSS to external stylesheets for caching.");

  addFinding("performance", "No excessive inline CSS", inlineStyles.length < 10, 8);

  if (timing > 0) {
    addFinding("performance", "Proxy response time", timing < 3000, 12, `${timing}ms`);
    if (timing > 4000) addSuggestion("performance", "warning", `Slow response time (${timing}ms)`, "Server response time affects Largest Contentful Paint (LCP).");
  }

  // ─── ACCESSIBILITY ───
  const hasLang = doc.documentElement.hasAttribute("lang");
  const inputs = doc.querySelectorAll("input:not([type='hidden']), textarea, select");
  const labeledInputs = doc.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])");
  const labels = doc.querySelectorAll("label, [aria-label], [aria-labelledby]");
  const ariaLandmarks = doc.querySelectorAll("[role='navigation'], [role='main'], [role='banner'], [role='contentinfo'], [role='complementary'], [role='form']");
  const focusable = doc.querySelectorAll("a[href], button, input, textarea, select, [tabindex]:not([tabindex='-1'])");
  const hasSkipLink = html.includes("skip") && html.includes("content");
  const hasAria = doc.querySelectorAll("[aria-]").length > 0;

  addFinding("accessibility", "Document language (lang attr)", hasLang, 12, hasLang ? (doc.documentElement.getAttribute("lang") || undefined) : undefined);
  if (!hasLang) addSuggestion("accessibility", "critical", "Missing lang attribute on <html>", "Add lang='en' (or correct locale) for screen readers.");

  const inputsNeedLabel = labeledInputs.length;
  const inputsLabelled = labels.length;
  const labelRatio = inputsNeedLabel > 0 ? Math.min(labels.length / inputsNeedLabel, 1) : 1;
  addFinding("accessibility", "Form inputs have labels", labelRatio > 0.5, 12, inputsNeedLabel > 0 ? `${labels.length} labels for ${inputsNeedLabel} inputs` : "no inputs");
  if (inputsNeedLabel > 0 && labelRatio < 0.3) addSuggestion("accessibility", "critical", "Form inputs missing labels", "Associate every <input> with a <label> or aria-label.");

  addFinding("accessibility", "ARIA landmarks present", ariaLandmarks.length > 0, 10, `${ariaLandmarks.length} landmarks`);
  if (ariaLandmarks.length === 0) addSuggestion("accessibility", "warning", "No ARIA landmarks", "Add role='navigation', 'main', 'banner' to key page sections.");

  addFinding("accessibility", "Focusable elements exist", focusable.length > 0, 8, `${focusable.length} interactive elements`);

  const altIssues = noAltImgs;
  addFinding("accessibility", "Images have alt text", altIssues === 0, 10, imgs.length > 0 ? `${noAltImgs}/${imgs.length} missing alt` : undefined);

  addFinding("accessibility", "Heading hierarchy", h1Count <= 1, 8);
  if (h1Count === 0) addSuggestion("accessibility", "critical", "Missing page heading", "Screen readers rely on heading hierarchy for navigation.");
  if (h1Count > 1) addSuggestion("accessibility", "warning", `${h1Count} H1 elements`, "Screen readers expect a single H1 per page.");

  addFinding("accessibility", "Skip navigation link", hasSkipLink, 6);
  if (!hasSkipLink) addSuggestion("accessibility", "info", "No skip-to-content link", "Add a 'Skip to content' link for keyboard users.");

  const hasRoleAttributes = doc.querySelectorAll("[role]").length > 0;
  addFinding("accessibility", "ARIA attributes used", hasAria || hasRoleAttributes, 8);

  // ─── MOBILE ───
  const hasViewport = !!viewport;
  const vpContent = viewport?.getAttribute("content") || "";
  const hasWidthDeviceWidth = vpContent.includes("width=device-width");
  const hasInitialScale = vpContent.includes("initial-scale");
  const hasTouchAction = html.includes("touch-action");
  const bodyFontSize = doc.querySelector("[style*='font-size']");

  addFinding("mobile", "Viewport meta configured", hasViewport, 18);
  addFinding("mobile", "width=device-width set", hasWidthDeviceWidth, 16);
  addFinding("mobile", "initial-scale defined", hasInitialScale, 12);
  if (!hasViewport) addSuggestion("mobile", "critical", "Missing viewport meta tag", "Add <meta name='viewport' content='width=device-width, initial-scale=1'> for mobile rendering.");
  if (hasViewport && !hasWidthDeviceWidth) addSuggestion("mobile", "warning", "Viewport missing width=device-width", "This is required for proper mobile scaling.");

  const fontSizes = doc.querySelectorAll("[style*='font-size']");
  let smallFonts = 0;
  fontSizes.forEach((el) => {
    const s = el.getAttribute("style") || "";
    const m = s.match(/font-size:\s*(\d+)px/);
    if (m && parseInt(m[1]) < 12) smallFonts++;
  });
  addFinding("mobile", "Font size ≥ 12px", smallFonts === 0, 10, smallFonts > 0 ? `${smallFonts} elements < 12px` : undefined);
  if (smallFonts > 3) addSuggestion("mobile", "warning", `${smallFonts} elements use small font sizes`, "Body text should be at least 16px for mobile readability.");

  addFinding("mobile", "Touch-action support", hasTouchAction, 6);
  addFinding("mobile", "Responsive images", totalImages > 0, 6);
  addFinding("mobile", "Horizontal overflow check", !html.includes("overflow-x"), 6);

  const mediaQueries = html.match(/@media/g);
  const hasMQ = (mediaQueries ? mediaQueries.length : 0) > 0;
  addFinding("mobile", "CSS media queries present", hasMQ, 10);
  if (!hasMQ) addSuggestion("mobile", "warning", "No responsive media queries", "Use CSS media queries to adapt layout for mobile screens.");

  addFinding("mobile", "Scalable content", !vpContent.includes("user-scalable=no"), 6);
  if (vpContent.includes("user-scalable=no")) addSuggestion("mobile", "warning", "Pinch zoom disabled", "Avoid user-scalable=no — it prevents users from zooming.");

  // ─── SECURITY ───
  const isHTTPS = url.startsWith("https://");
  const csp = headers["content-security-policy"] || "";
  const xframe = headers["x-frame-options"] || "";
  const xss = headers["x-xss-protection"] || "";
  const hsts = headers["strict-transport-security"] || "";
  const referrer = headers["referrer-policy"] || "";
  const ctype = headers["x-content-type-options"] || "";
  const hasMixedContent = html.includes("http://") && isHTTPS;

  addFinding("security", "HTTPS enforced", isHTTPS, 16);
  if (!isHTTPS) addSuggestion("security", "critical", "No HTTPS detected", "Enable HTTPS with a valid TLS certificate and redirect HTTP to HTTPS.");

  addFinding("security", "Content Security Policy", !!csp, 14);
  if (!csp) addSuggestion("security", "warning", "Missing Content-Security-Policy", "CSP mitigates XSS and data injection attacks.");

  addFinding("security", "X-Frame-Options", !!xframe, 10);
  if (!xframe) addSuggestion("security", "warning", "Clickjacking protection missing", "Set X-Frame-Options: DENY or SAMEORIGIN.");

  addFinding("security", "X-XSS-Protection", !!xss, 8);

  addFinding("security", "HSTS header", !!hsts, 10);
  if (!hsts) addSuggestion("security", "info", "HSTS not configured", "HTTP Strict-Transport-Security enforces secure connections.");

  addFinding("security", "No mixed content", !hasMixedContent, 10);
  if (hasMixedContent) addSuggestion("security", "warning", "Mixed content detected", "Serve all resources over HTTPS to avoid browser warnings.");

  addFinding("security", "Referrer-Policy", !!referrer, 8);
  if (!referrer) addSuggestion("security", "info", "Referrer-Policy not set", "Set Referrer-Policy: strict-origin-when-cross-origin for privacy.");

  addFinding("security", "X-Content-Type-Options", !!ctype, 8);

  const hasForm = inputs.length > 0;
  if (hasForm) {
    const secureForms = doc.querySelectorAll("form[action^='https://']");
    addFinding("security", "Forms submit to HTTPS", secureForms.length > 0, 6);
    if (secureForms.length === 0) addSuggestion("security", "warning", "Forms not using HTTPS", "Ensure all forms submit to HTTPS endpoints to protect data.");
  } else {
    addFinding("security", "Forms submit to HTTPS", true, 6);
  }

  // ─── WEIGHTED SCORES ───
  function weightedScore(findings: Finding[], base: number): number {
    if (findings.length === 0) return base;
    const totalWeight = findings.reduce((a, f) => a + f.weight, 0);
    const passedWeight = findings.filter((f) => f.passed).reduce((a, f) => a + f.weight, 0);
    const raw = (passedWeight / totalWeight) * 100;
    return Math.round(raw * 0.6 + base * 0.4);
  }

  const finalScores: Record<ScoreCategory, number> = {
    seo: Math.min(99, Math.max(10, weightedScore(allFindings.seo, baseScores.seo))),
    performance: Math.min(99, Math.max(10, weightedScore(allFindings.performance, baseScores.performance))),
    accessibility: Math.min(99, Math.max(10, weightedScore(allFindings.accessibility, baseScores.accessibility))),
    mobile: Math.min(99, Math.max(10, weightedScore(allFindings.mobile, baseScores.mobile))),
    security: Math.min(99, Math.max(10, weightedScore(allFindings.security, baseScores.security))),
  };

  const overall = Math.round(
    (finalScores.seo + finalScores.performance + finalScores.accessibility + finalScores.mobile + finalScores.security) / 5
  );

  return {
    url,
    overall,
    scores: finalScores,
    findings: allFindings,
    suggestions: allSuggestions.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }),
    pagesize: pageSize,
    resources: resourceCount,
    fetchSuccess: true,
  };
}

async function runAudit(url: string): Promise<AuditResult> {
  const cleanUrl = formatUrl(url);
  const estimated = analyzeByURL(cleanUrl);

  const fetched = await fetchUrl(cleanUrl);
  if (!fetched) return { ...estimated, pagesize: "—", resources: 0, fetchSuccess: false };

  try {
    const live = runFullAudit(cleanUrl, fetched.html, fetched.headers, fetched.timing);
    return { ...live, fetchSuccess: true };
  } catch {
    return { ...estimated, pagesize: estimatePageSize(fetched.html), fetchSuccess: false };
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("siteaudit_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const handleAudit = useCallback(async () => {
    const input = url.trim();
    if (!input || !URL_REGEX.test(input)) { setError("Enter a valid domain"); return; }
    setError("");
    setLoading(true);
    setShowResults(false);
    setResult(null);
    setProgress(0);

    const phases = [
      "Resolving domain...",
      "Fetching page content...",
      "Analyzing HTML structure...",
      "Evaluating SEO factors...",
      "Measuring performance metrics...",
      "Checking accessibility...",
      "Testing mobile readiness...",
      "Scanning security headers...",
      "Compiling report...",
    ];

    for (let i = 0; i < phases.length; i++) {
      setPhase(phases[i]);
      setProgress(Math.round(((i + 1) / phases.length) * 100));
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 250));
    }

    try {
      const auditResult = await runAudit(url);
      setResult(auditResult);
      setLoading(false);
      setPhase("");

      const historyItem = formatUrl(url);
      const updated = [historyItem, ...history.filter((h) => h !== historyItem)].slice(0, 5);
      setHistory(updated);
      try { localStorage.setItem("siteaudit_history", JSON.stringify(updated)); } catch {}

      requestAnimationFrame(() => setShowResults(true));
    } catch {
      setError("Audit failed. Try a different URL.");
      setLoading(false);
    }
  }, [url, history]);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const isValid = URL_REGEX.test(url.trim());

  return (
    <main className="min-h-screen bg-[#050508] text-[#f5f7fa] font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none no-print">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(10,211,255,0.05)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(155,109,255,0.03)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header bar */}
        <header className="flex items-center justify-between mb-8 sm:mb-12 no-print">
          <div className="flex items-center gap-3">
            <a href="../index.html#project-siteaudit-pro" className="p-2 rounded-lg bg-[#141527] border border-white/5 text-[#8087a3] hover:text-[#f5f7fa] transition-all" title="Back to Portfolio">
              <ArrowLeft size={16} />
            </a>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-black font-bold text-sm">
                  SA
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  SiteAudit Pro
                </h1>
              </div>
              <p className="text-[11px] text-[#8087a3] mt-0.5 flex items-center gap-1.5">
                <BarChart3 size={11} className="text-cyan-400" />
                Real-time website analysis engine
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#8087a3]">
            <Clock size={12} />
            <span>Client-side · No backend</span>
          </div>
        </header>

        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14 no-print">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] uppercase tracking-[0.15em] text-[#8087a3] mb-5">
            <Zap size={11} className="text-cyan-400" />
            Real HTML Analysis
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 leading-tight">
            Audit any website<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">in seconds</span>
          </h2>
          <p className="text-sm text-[#8087a3] max-w-md mx-auto">
            Enter a URL to analyze real HTML structure, security headers, SEO factors, and more — all in your browser.
          </p>
        </div>

        {/* URL Input */}
        <div className="max-w-2xl mx-auto mb-10 sm:mb-16 no-print">
          <div className="bg-[#0e0f1d] border border-white/[0.06] rounded-2xl p-1.5 flex items-center gap-2 shadow-lg shadow-black/20">
            <div className="flex-1 flex items-center gap-2.5 pl-4">
              <Globe size={15} className="text-[#8087a3] shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                placeholder="Enter website URL (e.g., example.com)"
                className="w-full bg-transparent text-sm text-[#f5f7fa] placeholder-[#8087a3]/50 outline-none py-2.5"
              />
            </div>
            <button
              onClick={handleAudit}
              disabled={!isValid || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shrink-0 shadow-lg shadow-cyan-500/10"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? "Scanning" : "Run Audit"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400/80 mt-2 pl-4">{error}</p>}
          {!isValid && url.length > 0 && !error && <p className="text-xs text-[#8087a3] mt-2 pl-4">Enter a valid domain (e.g., example.com)</p>}

          {/* History */}
          {history.length > 0 && !loading && !showResults && (
            <div className="mt-3 flex items-center gap-2 flex-wrap no-print">
              <span className="text-[10px] text-[#8087a3] uppercase tracking-wider">Recent:</span>
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setUrl(h)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#141527] border border-white/5 text-[#8087a3] hover:text-[#f5f7fa] hover:border-white/10 transition-all"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="max-w-lg mx-auto mb-16 animate-fade-up no-print">
            <div className="bg-[#0e0f1d] border border-white/[0.06] rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                {[0, 150, 300].map((d) => (
                  <div
                    key={d}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-bounce"
                    style={{ animationDelay: `${d}ms`, opacity: 0.8 }}
                  />
                ))}
              </div>
              <p className="text-sm text-[#8087a3] mb-4 font-medium">{phase}</p>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && showResults && (
          <div ref={reportRef} className="space-y-5 animate-fade-up print-container">
            {/* Overall + Quick Stats */}
            <div className="bg-[#0e0f1d] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                <div className="relative shrink-0">
                  <svg width="120" height="120" className="transform -rotate-90 w-20 sm:w-[120px] h-20 sm:h-[120px]">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={getScoreColor(result.overall)} strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.overall / 100) * 326.7} 326.7`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight" style={{ color: getScoreColor(result.overall) }}>{result.overall}</span>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#8087a3] mt-0.5">Score</span>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <Award size={16} style={{ color: getScoreColor(result.overall) }} />
                    <span className="text-lg font-semibold" style={{ color: getScoreColor(result.overall) }}>{getScoreLabel(result.overall)}</span>
                  </div>
                  <p className="text-sm text-[#8087a3]">
                    Report for <span className="text-[#f5f7fa] font-medium">{result.url}</span>
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                    {result.pagesize && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8087a3] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04]">
                        <FileText size={11} /> {result.pagesize}
                      </div>
                    )}
                    {result.resources !== undefined && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8087a3] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04]">
                        <Layers size={11} /> {result.resources} resources
                      </div>
                    )}
                    {!result.fetchSuccess && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/70 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10">
                        <Info size={11} /> URL-based analysis only
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8087a3] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04]">
                      <FileText size={11} /> {result.suggestions.length} issues
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat, idx) => {
                const score = result.scores[cat.key];
                const color = getScoreColor(score);
                const findings = result.findings[cat.key] || [];
                const passed = findings.filter((f) => f.passed).length;
                const total = findings.length;
                return (
                  <div
                    key={cat.key}
                    className="bg-[#0e0f1d] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:border-white/[0.10]"
                    style={{ animation: `fade-up 0.4s ease-out ${idx * 0.08}s forwards`, opacity: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <span className="text-sm font-semibold">{cat.label}</span>
                      </div>
                      <span className="text-xl font-bold tabular-nums" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${score}%`, background: `linear-gradient(90deg, ${cat.color}66, ${cat.color})` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: `${color}cc` }}>{getScoreLabel(score)}</span>
                      {total > 0 && <span className="text-[11px] text-[#8087a3]">{passed}/{total} checks passed</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-[#0e0f1d] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <Lightbulb size={17} className="text-amber-400" />
                  <h2 className="text-base font-bold">Recommendations</h2>
                  <span className="text-xs text-[#8087a3] ml-auto">{result.suggestions.length} items</span>
                </div>
                <div className="space-y-2.5">
                  {result.suggestions.map((s, i) => {
                    const sev = SEVERITY_STYLES[s.severity];
                    const catInfo = CATEGORIES.find((c) => c.key === s.category);
                    return (
                      <div
                        key={i}
                        className={`${sev.bg} ${sev.border} border rounded-xl p-4 transition-all hover:brightness-110`}
                        style={{ animation: `fade-up 0.3s ease-out ${i * 0.03}s forwards`, opacity: 0 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{sev.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-bold">{s.title}</span>
                              {catInfo && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${catInfo.color}18`, color: catInfo.color }}>
                                  {catInfo.label}
                                </span>
                              )}
                              <span className={`text-[9px] uppercase tracking-wider ${sev.color}`}>{sev.label}</span>
                            </div>
                            <p className="text-xs text-[#8087a3] leading-relaxed">{s.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Findings detail per category */}
            {result.findings.seo.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CATEGORIES.map((cat, idx) => {
                  const findings = result.findings[cat.key] || [];
                  if (findings.length === 0) return null;
                  return (
                    <div
                      key={cat.key}
                      className="bg-[#0e0f1d] border border-white/[0.06] rounded-xl p-5"
                      style={{ animation: `fade-up 0.4s ease-out ${(idx + 5) * 0.08}s forwards`, opacity: 0 }}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <span className="text-sm font-semibold">{cat.label} Checks</span>
                      </div>
                      <div className="space-y-1.5">
                        {findings.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 py-1">
                            {f.passed ? <CheckCircle size={11} className="text-green-400/70 shrink-0" /> : <X size={11} className="text-red-400/50 shrink-0" />}
                            <span className={`text-xs ${f.passed ? "text-[#8087a3]" : "text-[#8087a3]/60"}`}>{f.label}</span>
                            {f.detail && <span className="text-[10px] text-[#8087a3]/40 ml-auto shrink-0">{f.detail}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between bg-[#0e0f1d] border border-white/[0.06] rounded-2xl p-4 sm:p-5 no-print">
              <button
                onClick={() => { setResult(null); setShowResults(false); setUrl(""); setError(""); }}
                className="flex items-center gap-2 text-sm text-[#8087a3] hover:text-[#f5f7fa] transition-colors"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">New Audit</span>
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-cyan-500/10"
              >
                <Download size={14} />
                Export Report (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !showResults && !result && (
          <div className="max-w-3xl mx-auto mt-8 sm:mt-12 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Search size={20} />, title: "Real Analysis", desc: "Fetches and parses actual HTML, headers, and structure from the target URL." },
                { icon: <Shield size={20} />, title: "5 Categories", desc: "SEO, Performance, Accessibility, Mobile, and Security — scored with weighted checks." },
                { icon: <Download size={20} />, title: "PDF Export", desc: "Export professional audit reports as print-ready PDF documents." },
              ].map((item, i) => (
                <div key={i} className="bg-[#0e0f1d] border border-white/[0.06] rounded-xl p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-cyan-400/10 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#8087a3] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8 no-print">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#8087a3]/30">
            SiteAudit Pro — All analysis runs client-side via CORS proxy. No data stored on servers.
          </p>
        </div>
      </div>
    </main>
  );
}
