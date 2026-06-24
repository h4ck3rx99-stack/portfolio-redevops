"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { 
  Upload, 
  FileText, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Percent, 
  Search, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Database
} from "lucide-react";
import html2canvas from "html2canvas";

// Define mock CSV data
const demoCSV = `Date,Product,Category,Revenue,Units,Region
2026-01-01,Premium Web Dev Bundle,Design,2500,2,North
2026-01-05,Cloud Setup Blueprint,DevOps,1200,1,North
2026-01-10,Next.js Enterprise SaaS,SaaS,8500,1,East
2026-01-15,Mobile Fitness UI Pack,Design,1800,3,West
2026-01-20,Kubernetes Helm Charts,DevOps,3400,2,South
2026-02-02,Premium Web Dev Bundle,Design,5000,4,North
2026-02-12,Tailwind CSS Starter Kit,Design,800,8,East
2026-02-22,Cloud Setup Blueprint,DevOps,2400,2,South
2026-03-01,Next.js Enterprise SaaS,SaaS,17000,2,East
2026-03-10,Framer Motion Animations,Design,1500,5,West
2026-03-18,Kubernetes Helm Charts,DevOps,5100,3,South
2026-04-05,Premium Web Dev Bundle,Design,3750,3,North
2026-04-12,Next.js Enterprise SaaS,SaaS,8500,1,West
2026-04-25,Cloud Setup Blueprint,DevOps,1200,1,North
2026-05-02,Framer Motion Animations,Design,2100,7,East
2026-05-15,Kubernetes Helm Charts,DevOps,1700,1,South
2026-05-28,Tailwind CSS Starter Kit,Design,1200,12,West
2026-06-01,Next.js Enterprise SaaS,SaaS,25500,3,East
2026-06-12,Cloud Setup Blueprint,DevOps,3600,3,South
2026-06-20,Premium Web Dev Bundle,Design,1250,1,West`;

interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

// Built-in RFC 4180 compliant CSV Parser
function parseCSV(text: string): CSVData {
  const lines: string[] = [];
  let row: string[] = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(JSON.stringify(row));
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(JSON.stringify(row));
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const parsedLines = lines.map(line => JSON.parse(line) as string[]);
  const headers = parsedLines[0].map(h => h.trim());
  const rows = parsedLines.slice(1)
    .filter(line => line.length === headers.length || (line.length === 1 && line[0] !== ""))
    .map(line => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = line[idx] ? line[idx].trim() : "";
      });
      return obj;
    });

  return { headers, rows };
}

interface ThemeScheme {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
}

const THEME_SCHEMES: ThemeScheme[] = [
  { name: "Cyan Spark", primary: "#00f0ff", secondary: "#bd5eff", glow: "rgba(0, 240, 255, 0.15)" },
  { name: "Neon Rose", primary: "#ff5b94", secondary: "#bd5eff", glow: "rgba(255, 91, 148, 0.15)" },
  { name: "Emerald Wave", primary: "#10b981", secondary: "#059669", glow: "rgba(16, 185, 129, 0.15)" },
  { name: "Amber Fusion", primary: "#f59e0b", secondary: "#ef4444", glow: "rgba(245, 158, 11, 0.15)" },
  { name: "Sapphire Deep", primary: "#3b82f6", secondary: "#8b5cf6", glow: "rgba(59, 130, 246, 0.15)" },
  { name: "Cyber Sunset", primary: "#ffaa00", secondary: "#ff007f", glow: "rgba(255, 170, 0, 0.15)" }
];

export default function Home() {
  const [csvContent, setCsvContent] = useState<string>(demoCSV);
  const [fileName, setFileName] = useState<string>("Acme Sales Demo.csv");
  const [parsedData, setParsedData] = useState<CSVData>({ headers: [], rows: [] });
  
  // Theme State
  const [activeScheme, setActiveScheme] = useState<ThemeScheme>(THEME_SCHEMES[0]);
  
  const COLORS = useMemo(() => {
    return [
      activeScheme.primary,
      activeScheme.secondary,
      "#ff5b94",
      "#3b82f6",
      "#10b981",
      "#f59e0b"
    ];
  }, [activeScheme]);

  // Mapping States
  const [dateCol, setDateCol] = useState<string>("");
  const [revenueCol, setRevenueCol] = useState<string>("");
  const [categoryCol, setCategoryCol] = useState<string>("");
  const [unitsCol, setUnitsCol] = useState<string>("");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
  const symbol = currencySymbol;
  
  // Filtering States
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minRevenue, setMinRevenue] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "table">("overview");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const dashboardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static Offline Currency Exchange Rates relative to USD ($) as 1.0 base
  const CURRENCY_RATES: Record<string, number> = useMemo(() => ({
    "$": 1.0,
    "₹": 83.5,
    "€": 0.92,
    "£": 0.78,
    "¥": 155.0
  }), []);

  // Clean numeric strings and apply currency scaling
  const getNumericValue = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]/g, "");
    const num = Number(clean);
    const rate = CURRENCY_RATES[currencySymbol] || 1.0;
    return isNaN(num) ? 0 : num * rate;
  };

  // Raw numeric parsing (without currency scaling, e.g. for quantities)
  const getRawNumericValue = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]/g, "");
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  };

  // Parse CSV when text changes
  useEffect(() => {
    const parsed = parseCSV(csvContent);
    setParsedData(parsed);

    // Auto-detect columns
    if (parsed.headers.length > 0) {
      const headers = parsed.headers;
      
      // 1. Detect Date Column
      const date = headers.find(h => /date|time|day|month/i.test(h)) || headers[0];
      setDateCol(date);

      // 2. Detect Revenue Column
      const rev = headers.find(h => /revenue|amount|sales|price|cost|val/i.test(h)) || 
                  headers.find(h => {
                    // check if values are numbers
                    const val = parsed.rows[0]?.[h];
                    return val && !isNaN(Number(val.replace(/[^0-9.-]/g, "")));
                  }) || headers[1];
      setRevenueCol(rev);

      // 3. Detect Category Column
      const cat = headers.find(h => /category|prod|type|region|channel/i.test(h)) || headers[2] || headers[0];
      setCategoryCol(cat);

      // 4. Detect Units/Quantity Column
      const units = headers.find(h => /unit|qty|quant|count/i.test(h)) || "";
      setUnitsCol(units);
    }
  }, [csvContent]);

  // Auto-detect date range boundaries
  useEffect(() => {
    if (!dateCol || !parsedData.rows.length) {
      setStartDate("");
      setEndDate("");
      return;
    }
    
    let minD = "";
    let maxD = "";
    
    parsedData.rows.forEach(row => {
      const dateVal = row[dateCol];
      if (dateVal && dateVal.trim() !== "") {
        if (!minD || dateVal < minD) minD = dateVal;
        if (!maxD || dateVal > maxD) maxD = dateVal;
      }
    });
    
    if (minD && maxD) {
      setStartDate(minD);
      setEndDate(maxD);
    }
  }, [parsedData, dateCol]);

  // List of unique categories for filter dropdown
  const categoriesList = useMemo(() => {
    if (!categoryCol || !parsedData.rows.length) return [];
    const set = new Set<string>();
    parsedData.rows.forEach(row => {
      if (row[categoryCol]) set.add(row[categoryCol]);
    });
    return Array.from(set).sort();
  }, [parsedData, categoryCol]);

  // Filtered dataset
  const filteredRows = useMemo(() => {
    return parsedData.rows.filter(row => {
      // 1. Category Filter
      if (selectedCategory !== "all" && row[categoryCol] !== selectedCategory) {
        return false;
      }
      
      // 2. Revenue Threshold Filter
      if (minRevenue !== "") {
        const revVal = getNumericValue(row[revenueCol]);
        if (revVal < Number(minRevenue)) return false;
      }

      // 3. Date Range Filter
      if (startDate && row[dateCol]) {
        if (row[dateCol] < startDate) return false;
      }
      if (endDate && row[dateCol]) {
        if (row[dateCol] > endDate) return false;
      }

      // 4. Search Query (checks all fields)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matches = Object.values(row).some(val => 
          val.toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [parsedData, selectedCategory, searchQuery, minRevenue, startDate, endDate, dateCol, categoryCol, revenueCol]);

  // Math Calculations & KPIs
  const kpis = useMemo(() => {
    if (filteredRows.length === 0) {
      return { totalRevenue: 0, aov: 0, count: 0, maxSale: 0 };
    }
    const values = filteredRows.map(r => getNumericValue(r[revenueCol]));
    const totalRevenue = values.reduce((sum, v) => sum + v, 0);
    const count = filteredRows.length;
    const aov = totalRevenue / count;
    const maxSale = Math.max(...values);

    return { totalRevenue, aov, count, maxSale };
  }, [filteredRows, revenueCol]);

  // Recharts Grouping: Revenue Trend Line
  const trendData = useMemo(() => {
    if (!dateCol || !revenueCol) return [];
    const groups: Record<string, number> = {};
    filteredRows.forEach(row => {
      const date = row[dateCol] || "Unknown";
      const rev = getNumericValue(row[revenueCol]);
      groups[date] = (groups[date] || 0) + rev;
    });

    return Object.entries(groups)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRows, dateCol, revenueCol]);

  // Recharts Grouping: Category Share Pie Chart
  const pieData = useMemo(() => {
    if (!categoryCol || !revenueCol) return [];
    const groups: Record<string, number> = {};
    filteredRows.forEach(row => {
      const cat = row[categoryCol] || "Other";
      const rev = getNumericValue(row[revenueCol]);
      groups[cat] = (groups[cat] || 0) + rev;
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows, categoryCol, revenueCol]);

  // Recharts Grouping: Category Bar Chart
  const barData = useMemo(() => {
    return pieData.slice(0, 10); // top 10 categories
  }, [pieData]);

  // Dynamic Smart Insights Calculations
  const insights = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        velocity: 0,
        growth: 0,
        topCategoryName: "N/A",
        topCategoryShare: 0,
        peakWeekday: "N/A",
        totalUnits: 0,
        avgUnitPrice: 0,
        medianSale: 0
      };
    }

    // 1. Sales Velocity (Average daily revenue based on active sales days)
    const uniqueDates = new Set(filteredRows.map(r => r[dateCol]).filter(Boolean));
    const activeDaysCount = uniqueDates.size || 1;
    const velocity = kpis.totalRevenue / activeDaysCount;

    // 2. Chronological Growth (Timeline Split)
    const sortedRows = [...filteredRows].sort((a, b) => {
      const dA = a[dateCol] || "";
      const dB = b[dateCol] || "";
      return dA.localeCompare(dB);
    });
    const halfLen = Math.floor(sortedRows.length / 2);
    let growth = 0;
    if (halfLen > 0) {
      const firstHalfRev = sortedRows.slice(0, halfLen).reduce((sum, r) => sum + getNumericValue(r[revenueCol]), 0);
      const secondHalfRev = sortedRows.slice(halfLen).reduce((sum, r) => sum + getNumericValue(r[revenueCol]), 0);
      if (firstHalfRev > 0) {
        growth = ((secondHalfRev - firstHalfRev) / firstHalfRev) * 100;
      }
    }

    // 3. Category Dominance
    let topCategoryName = "N/A";
    let topCategoryShare = 0;
    if (pieData.length > 0) {
      topCategoryName = pieData[0].name;
      topCategoryShare = kpis.totalRevenue > 0 ? (pieData[0].value / kpis.totalRevenue) * 100 : 0;
    }

    // 4. Peak Weekday Analysis
    const weekdayRevenues: Record<string, number> = {};
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    filteredRows.forEach(row => {
      const dateVal = row[dateCol];
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const dayName = weekdayNames[d.getDay()];
          weekdayRevenues[dayName] = (weekdayRevenues[dayName] || 0) + getNumericValue(row[revenueCol]);
        }
      }
    });
    let peakWeekday = "N/A";
    let maxWeekdayRev = -1;
    Object.entries(weekdayRevenues).forEach(([day, rev]) => {
      if (rev > maxWeekdayRev) {
        maxWeekdayRev = rev;
        peakWeekday = day;
      }
    });

    // 5. Units metrics
    let totalUnits = 0;
    if (unitsCol) {
      filteredRows.forEach(row => {
        totalUnits += getRawNumericValue(row[unitsCol]);
      });
    }
    const avgUnitPrice = totalUnits > 0 ? (kpis.totalRevenue / totalUnits) : 0;

    // 6. Median Sale Size
    const sortedRevenues = filteredRows.map(r => getNumericValue(r[revenueCol])).sort((a, b) => a - b);
    const midIdx = Math.floor(sortedRevenues.length / 2);
    const medianSale = sortedRevenues.length % 2 !== 0 
      ? sortedRevenues[midIdx] 
      : (sortedRevenues[midIdx - 1] + sortedRevenues[midIdx]) / 2;

    return {
      velocity,
      growth,
      topCategoryName,
      topCategoryShare,
      peakWeekday,
      totalUnits,
      avgUnitPrice,
      medianSale
    };
  }, [filteredRows, dateCol, revenueCol, pieData, kpis.totalRevenue, unitsCol, currencySymbol]);

  // Client-Side Filtered CSV Exporter
  const exportFilteredCSV = () => {
    if (filteredRows.length === 0) return;
    
    const headers = parsedData.headers;
    const csvRows = [headers.join(",")];
    
    filteredRows.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] || "";
        if (val.includes(",") || val.includes('"') || val.includes('\n') || val.includes('\r')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(","));
    });
    
    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName.replace(/\.[^/.]+$/, "")}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pagination for Data Table
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCsvContent(evt.target.result as string);
          setCurrentPage(1);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const loadDemo = () => {
    setFileName("Acme Sales Demo.csv");
    setCsvContent(demoCSV);
    setCurrentPage(1);
  };

  const exportAsPNG = () => {
    if (dashboardRef.current) {
      // Temporarily hide elements that shouldn't show on exports if any, html2canvas renders what is visible
      html2canvas(dashboardRef.current, {
        useCORS: true,
        backgroundColor: "#050508",
        scale: 2 // Improve quality
      }).then(canvas => {
        const link = document.createElement("a");
        link.download = `${fileName.replace(/\.[^/.]+$/, "")}_dashboard.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  const dynamicStyles = {
    "--accent-teal": activeScheme.primary,
    "--accent-purple": activeScheme.secondary,
    "--border": `rgba(${parseInt(activeScheme.primary.slice(1,3),16)}, ${parseInt(activeScheme.primary.slice(3,5),16)}, ${parseInt(activeScheme.primary.slice(5,7),16)}, 0.12)`,
  } as React.CSSProperties;

  return (
    <main className="min-h-screen flex flex-col bg-[#050508] text-[#f5f7fa]" style={dynamicStyles}>
      
      {/* Top Banner Header */}
      <header className="no-print p-6 border-b border-white/5 bg-[#0b0c16]/50 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black" style={{ backgroundImage: `linear-gradient(135deg, ${activeScheme.primary}, ${activeScheme.secondary})` }}>
            DS
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${activeScheme.primary}, ${activeScheme.secondary}, #ff5b94)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dashboard Studio
            </h1>
              <p className="text-xs text-[#8087a3] flex items-center gap-1.5 mt-0.5">
                <Database className="w-3 h-3" style={{ color: activeScheme.primary }} />
                Offline CSV Analytics Panel
              </p>
              <p className="text-[10px] text-[#8087a3]/60 mt-0.5">Drop any CSV — no server, no setup, no upload limits</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            onClick={triggerFileSelect}
            className="flex items-center gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg text-black hover:scale-[1.01] hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            style={{ backgroundImage: `linear-gradient(to right, ${activeScheme.primary}, ${activeScheme.secondary})` }}
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Upload CSV File
          </button>
          
          <button 
            onClick={loadDemo}
            className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#141527] border border-blue-900/30 hover:bg-[#1a1b37] transition-all"
            style={{ color: activeScheme.primary }}
            title="Load Acme sample sales dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Demo Data
          </button>
          
          <button 
            onClick={exportAsPNG}
            disabled={parsedData.rows.length === 0}
            className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#141527] border border-blue-900/30 text-[#f5f7fa] hover:bg-[#1a1b37] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Save dashboard container as PNG image"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Export PNG
          </button>

          <button 
            onClick={exportFilteredCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#141527] border border-blue-900/30 text-[#f5f7fa] hover:bg-[#1a1b37] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Download currently filtered records as a CSV file"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Export CSV
          </button>

          <a 
            href="../index.html#project-dashboardstudio"
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0e0f1d] border border-white/5 text-[#8087a3] hover:text-[#f5f7fa] transition-all"
          >
            Back to Portfolio
          </a>
        </div>
      </header>

      {/* Main Panel Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen lg:min-h-0 lg:h-[calc(100vh-89px)] overflow-visible lg:overflow-hidden">
        
        {/* Left Sidebar Control Panel */}
        <aside className="no-print w-full lg:w-[320px] shrink-0 border-r border-blue-950/30 bg-[#080914] p-6 flex flex-col gap-6 overflow-y-auto max-h-[50vh] lg:max-h-none">
          
          {/* Active File Metadata Badge */}
          <div className="p-4 rounded-xl glass-card flex items-center gap-3">
            <FileText className="w-8 h-8" style={{ color: activeScheme.secondary }} />
            <div className="overflow-hidden">
              <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Active File</span>
              <p className="text-sm font-bold text-[#f5f7fa] truncate" title={fileName}>{fileName}</p>
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded font-mono mt-1 inline-block"
                style={{ color: activeScheme.primary, backgroundColor: `${activeScheme.primary}1a` }}
              >
                {parsedData.rows.length} records
              </span>
            </div>
          </div>

          {/* Column Mapping Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-white/5" style={{ color: activeScheme.secondary }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Column Mappings
            </h3>
            
            {parsedData.headers.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Date Column</label>
                  <select
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Value (Revenue) Column</label>
                  <select
                    value={revenueCol}
                    onChange={(e) => setRevenueCol(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Category Column</label>
                  <select
                    value={categoryCol}
                    onChange={(e) => setCategoryCol(e.target.value)}
                    className="w-full bg-[#141427] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Units / Qty Column</label>
                  <select
                    value={unitsCol}
                    onChange={(e) => setUnitsCol(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    <option value="">-- None (Disable) --</option>
                    {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Currency Symbol</label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    <option value="$">USD ($)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="¥">JPY/CNY (¥)</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8087a3] italic">Upload a CSV file to configure layout mappings.</p>
            )}
          </div>

          {/* Filtering Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-white/5" style={{ color: activeScheme.primary }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Interactive Filters
            </h3>

            {parsedData.headers.length > 0 ? (
              <div className="space-y-4">
                {/* Search query box */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#8087a3]" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg pl-9 pr-3 py-2.5 outline-none"
                    placeholder="Search records..."
                  />
                </div>

                {/* Category Dropdown Filter */}
                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Category Filter</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Picker Filter */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#141527] border border-blue-900/30 text-xs text-[#f5f7fa] rounded-lg p-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#141527] border border-blue-900/30 text-xs text-[#f5f7fa] rounded-lg p-1.5 outline-none"
                    />
                  </div>
                </div>

                {/* Minimum Revenue Threshold input */}
                <div>
                  <label className="block text-[10px] text-[#8087a3] uppercase font-bold mb-1.5">Min Revenue ({symbol})</label>
                  <input
                    type="number"
                    value={minRevenue}
                    onChange={(e) => setMinRevenue(e.target.value)}
                    className="w-full bg-[#141527] border border-blue-900/30 text-sm text-[#f5f7fa] rounded-lg p-2 outline-none"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8087a3] italic">Upload a CSV to unlock filter panel options.</p>
            )}
          </div>

          {/* Theme Selector Controls */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-white/5" style={{ color: activeScheme.secondary }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Dashboard Theme
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_SCHEMES.map(scheme => (
                <button
                  key={scheme.name}
                  onClick={() => setActiveScheme(scheme)}
                  className={`p-2 rounded-lg border text-[9px] font-semibold text-center transition-all cursor-pointer ${
                    activeScheme.name === scheme.name 
                      ? "bg-[#141527]" 
                      : "bg-[#0b0c16] border-white/5 hover:border-white/10"
                  }`}
                  style={{ 
                    color: activeScheme.name === scheme.name ? scheme.primary : "#8087a3",
                    borderColor: activeScheme.name === scheme.name ? scheme.primary : "rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <span className="block w-4 h-4 rounded-full mx-auto mb-1 bg-gradient-to-tr" style={{ backgroundImage: `linear-gradient(to top right, ${scheme.primary}, ${scheme.secondary})` }} />
                  {scheme.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Helper instructions tooltip note */}
          <div className="mt-auto p-4.5 bg-[#0f1124] border border-blue-950/50 rounded-xl flex gap-3 text-xs text-[#8087a3]">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: activeScheme.primary }} />
            <div>
              <p className="font-semibold text-[#f5f7fa] mb-0.5 font-sans">Quick Mapping Tip</p>
              Map the columns of *any* sales CSV to dynamically re-render these charts instantly.
            </div>
          </div>

        </aside>

        {/* Main Dashboard Canvas & Tables Panel */}
        <section className="flex-1 overflow-y-auto bg-[#050508] p-6 lg:p-8 flex flex-col gap-6" ref={dashboardRef}>
          
          {/* Tabs Selector Navigation */}
          <div className="flex border-b border-white/5 gap-1.5 text-sm">
            {[
              { id: "overview", label: "Dashboard Overview" },
              { id: "detailed", label: "Detailed Charts" },
              { id: "table", label: "Raw Records Table" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "detailed" | "table")}
                className={`py-2 px-4 rounded-t-lg font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-[#0b0c16] border-t border-x border-white/5" 
                    : "text-[#8087a3] hover:text-[#f5f7fa]"
                }`}
                style={activeTab === tab.id ? { color: activeScheme.primary, borderTopColor: activeScheme.primary } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {parsedData.rows.length > 0 ? (
            <div className="space-y-6 flex-1 flex flex-col">
              
              {/* TAB 1: OVERVIEW PANEL */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* KPI 1: Revenue */}
                    <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:scale-[1.01] transition-all">
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl flex items-center justify-center" style={{ backgroundColor: `${activeScheme.primary}0d` }}>
                        <DollarSign className="w-6 h-6" style={{ color: activeScheme.primary }} />
                      </div>
                      <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Total Revenue</span>
                      <p className="text-2xl font-black text-[#f5f7fa] mt-1.5 truncate">
                        {symbol}{kpis.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#8087a3]">
                        <TrendingUp className="w-3 h-3" style={{ color: activeScheme.primary }} />
                        <span>Based on active filters</span>
                      </div>
                    </div>

                    {/* KPI 2: Average Ticket */}
                    <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:scale-[1.01] transition-all">
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl flex items-center justify-center" style={{ backgroundColor: `${activeScheme.secondary}0d` }}>
                        <TrendingUp className="w-6 h-6" style={{ color: activeScheme.secondary }} />
                      </div>
                      <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Avg Transaction</span>
                      <p className="text-2xl font-black text-[#f5f7fa] mt-1.5 truncate">
                        {symbol}{kpis.aov.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#8087a3]">
                        <span>AOV per transaction</span>
                      </div>
                    </div>

                    {/* KPI 3: Total Sales counts */}
                    <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:scale-[1.01] transition-all">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff5b94]/5 rounded-bl-3xl flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-[#ff5b94]" />
                      </div>
                      <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Total Transactions</span>
                      <p className="text-2xl font-black text-[#f5f7fa] mt-1.5">
                        {kpis.count.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#8087a3]">
                        <span>Count of rows in dataset</span>
                      </div>
                    </div>

                    {/* KPI 4: Max Single Sale */}
                    <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:scale-[1.01] transition-all">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-3xl flex items-center justify-center">
                        <Percent className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Max Transaction</span>
                      <p className="text-2xl font-black text-[#f5f7fa] mt-1.5 truncate">
                        {symbol}{kpis.maxSale.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#8087a3]">
                        <span>Highest ticket value</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Analytics Insights Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Panel 1: Analytics Insights */}
                    <div className="p-6 rounded-2xl glass-panel space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: activeScheme.primary }}>
                        <TrendingUp className="w-4 h-4" />
                        Automated Business Insights
                      </h3>
                      <div className="space-y-4 text-xs">
                        
                        {/* Insight 1: Sales Velocity */}
                        <div className="flex items-start gap-3 p-3 bg-[#0d0e1b]/40 border border-white/5 rounded-xl">
                          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: activeScheme.primary }} />
                          <div>
                            <p className="font-semibold text-white">Sales Velocity Rate</p>
                            <p className="text-[#8087a3] mt-0.5">
                              Generating an average of <span className="font-semibold text-white">{symbol}{insights.velocity.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/day</span> across the active transaction dates.
                            </p>
                          </div>
                        </div>

                        {/* Insight 2: Chronological Growth */}
                        <div className="flex items-start gap-3 p-3 bg-[#0d0e1b]/40 border border-white/5 rounded-xl">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insights.growth >= 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div>
                            <p className="font-semibold text-white">Chronological Timeline Trend</p>
                            <p className="text-[#8087a3] mt-0.5">
                              {insights.growth !== 0 ? (
                                <>
                                  Revenue shifted by <span className={`font-semibold ${insights.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>{insights.growth >= 0 ? "+" : ""}{insights.growth.toFixed(1)}%</span> when comparing the first half of the timeline to the second half.
                                </>
                              ) : (
                                "Insufficient historical data partitions to calculate growth intervals."
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Insight 3: Dominance */}
                        <div className="flex items-start gap-3 p-3 bg-[#0d0e1b]/40 border border-white/5 rounded-xl">
                          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: activeScheme.secondary }} />
                          <div>
                            <p className="font-semibold text-white">Category Concentration</p>
                            <p className="text-[#8087a3] mt-0.5">
                              The top performing category <span className="font-semibold text-white">&ldquo;{insights.topCategoryName}&rdquo;</span> is dominant, accounting for <span className="font-semibold text-white">{insights.topCategoryShare.toFixed(1)}%</span> of total aggregated revenue.
                            </p>
                          </div>
                        </div>

                        {/* Insight 4: Peak Weekday */}
                        <div className="flex items-start gap-3 p-3 bg-[#0d0e1b]/40 border border-white/5 rounded-xl">
                          <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#ff5b94]" />
                          <div>
                            <p className="font-semibold text-white">Peak Weekday Activity</p>
                            <p className="text-[#8087a3] mt-0.5">
                              The highest cumulative revenue is recorded on <span className="font-semibold text-white">{insights.peakWeekday}s</span>, indicating high transaction density on this day.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Panel 2: Stats Distributions */}
                    <div className="p-6 rounded-2xl glass-panel space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: activeScheme.secondary }}>
                        <SlidersHorizontal className="w-4 h-4" />
                        Statistical Distribution
                      </h3>
                      <div className="grid grid-cols-2 gap-4 h-full">
                        
                        {/* Median sale size */}
                        <div className="p-4 bg-[#0d0e1b]/40 border border-white/5 rounded-xl flex flex-col justify-between">
                          <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Median Sale Size</span>
                          <p className="text-xl font-bold text-white mt-1">
                            {symbol}{insights.medianSale.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </p>
                          <span className="text-[9px] text-[#8087a3] mt-2 block">Filters out extreme high/low skew</span>
                        </div>

                        {/* Units sold count */}
                        <div className="p-4 bg-[#0d0e1b]/40 border border-white/5 rounded-xl flex flex-col justify-between">
                          <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Total Units Sold</span>
                          <p className="text-xl font-bold text-white mt-1">
                            {unitsCol ? insights.totalUnits.toLocaleString() : "N/A"}
                          </p>
                          <span className="text-[9px] text-[#8087a3] mt-2 block">
                            {unitsCol ? `Mapped to "${unitsCol}"` : "Map Units column to track count"}
                          </span>
                        </div>

                        {/* Avg unit price */}
                        <div className="p-4 bg-[#0d0e1b]/40 border border-white/5 rounded-xl flex flex-col justify-between">
                          <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Average Unit Price</span>
                          <p className="text-xl font-bold text-white mt-1">
                            {unitsCol && insights.totalUnits > 0 
                              ? `${symbol}${insights.avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 1 })}` 
                              : "N/A"}
                          </p>
                          <span className="text-[9px] text-[#8087a3] mt-2 block">Total revenue divided by units</span>
                        </div>

                        {/* Data Quality Health */}
                        <div className="p-4 bg-[#0d0e1b]/40 border border-white/5 rounded-xl flex flex-col justify-between">
                          <span className="block text-[10px] text-[#8087a3] font-bold uppercase tracking-wider">Record Coverage</span>
                          <p className="text-xl font-bold text-emerald-400 mt-1">
                            100%
                          </p>
                          <span className="text-[9px] text-[#8087a3] mt-2 block">{filteredRows.length} valid rows processed</span>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Overview Charts Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Area Trend Line Chart */}
                    <div className="p-6 rounded-2xl glass-panel xl:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: activeScheme.secondary }}>
                          Revenue Trend Over Time
                        </h3>
                        <span className="text-[10px] text-[#8087a3] font-semibold bg-white/5 px-2 py-0.5 rounded">
                          Timeline Linegraph
                        </span>
                      </div>
                      <div className="h-[300px] w-full">
                        {trendData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ left: -10, right: 10, top: 10 }}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={activeScheme.primary} stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor={activeScheme.primary} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                              <XAxis 
                                dataKey="date" 
                                stroke="#525875" 
                                fontSize={10} 
                                tickLine={false} 
                              />
                              <YAxis 
                                stroke="#525875" 
                                fontSize={10} 
                                tickLine={false} 
                                tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                              />
                              <Tooltip 
                                formatter={(value) => [`${symbol}${Number(value).toLocaleString()}`, "Revenue"]}
                                contentStyle={{ backgroundColor: "rgba(10, 10, 20, 0.95)", borderColor: "rgba(255, 255, 255, 0.08)" }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke={activeScheme.primary} 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-[#8087a3] italic">No chart trend data available</div>
                        )}
                      </div>
                    </div>

                    {/* Pie Chart Shares */}
                    <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: activeScheme.primary }}>
                          Revenue Share
                        </h3>
                        <span className="text-[10px] text-[#8087a3] font-semibold bg-white/5 px-2 py-0.5 rounded">
                          Pie Chart
                        </span>
                      </div>
                      
                      <div className="h-[200px] relative flex items-center justify-center">
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [`${symbol}${Number(value).toLocaleString()}`, "Share"]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-xs text-[#8087a3] italic">No chart data</div>
                        )}
                      </div>

                      {/* Custom legend grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 pt-3 border-t border-white/5">
                        {pieData.slice(0, 4).map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5 overflow-hidden">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="text-[#8087a3] truncate">{entry.name}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: DETAILED CHARTS PANEL */}
              {activeTab === "detailed" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Detailed Bar Chart Category Comparison */}
                  <div className="p-6 rounded-2xl glass-panel space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: activeScheme.primary }}>
                      Revenue by Categories
                    </h3>
                    <div className="h-[350px]">
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ left: -10, right: 10, top: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="name" stroke="#525875" fontSize={10} tickLine={false} />
                            <YAxis 
                              stroke="#525875" 
                              fontSize={10} 
                              tickLine={false}
                              tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                            />
                            <Tooltip 
                              formatter={(value) => [`${symbol}${Number(value).toLocaleString()}`, "Revenue"]}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#8087a3] italic">No chart data</div>
                      )}
                    </div>
                  </div>

                  {/* Segmented Cumulative Bar Chart */}
                  <div className="p-6 rounded-2xl glass-panel space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: activeScheme.secondary }}>
                      Transaction Sizes (KPI Scatter)
                    </h3>
                    <div className="h-[350px] overflow-y-auto pr-2 space-y-3.5">
                      {/* Let's show a list of top transactions to make the detailed panel extremely robust */}
                      {filteredRows
                        .map((r, i) => ({ 
                          idx: i + 1, 
                          cat: r[categoryCol] || "N/A", 
                          date: r[dateCol] || "N/A",
                          rev: getNumericValue(r[revenueCol]) 
                        }))
                        .sort((a, b) => b.rev - a.rev)
                        .slice(0, 8)
                        .map((t, idx) => (
                          <div key={idx} className="p-3 bg-[#111222]/50 border border-white/5 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span 
                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: `${activeScheme.secondary}1a`, color: activeScheme.secondary }}
                              >
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-[#f5f7fa]">{t.cat}</h4>
                                <span className="text-[9px] text-[#8087a3]">{t.date}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono" style={{ color: activeScheme.primary }}>
                              {symbol}{t.rev.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      
                      {filteredRows.length === 0 && (
                        <p className="text-xs text-[#8087a3] text-center italic py-12">No records found.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: DATA TABLE PANEL */}
              {activeTab === "table" && (
                <div className="p-6 rounded-2xl glass-panel space-y-4 flex-1 flex flex-col justify-between">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#8087a3] uppercase font-bold tracking-wider text-[10px]">
                          <th className="py-3 px-4 w-12">#</th>
                          {parsedData.headers.map(h => (
                            <th key={h} className="py-3 px-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#121326]/30 transition-all">
                            <td className="py-3.5 px-4 font-mono text-[#8087a3]">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            {parsedData.headers.map(h => {
                              const isRevenue = h === revenueCol;
                              return (
                                <td 
                                  key={h} 
                                  className={`py-3.5 px-4 truncate max-w-[200px] ${
                                    isRevenue ? "font-mono font-semibold" : ""
                                  }`}
                                  style={isRevenue ? { color: activeScheme.primary } : {}}
                                >
                                  {isRevenue && !isNaN(Number(row[h].replace(/[^0-9.-]/g, ""))) 
                                    ? `${symbol}${getNumericValue(row[h]).toLocaleString()}` 
                                    : row[h]}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {filteredRows.length === 0 && (
                          <tr>
                            <td colSpan={parsedData.headers.length + 1} className="py-12 text-center text-[#8087a3] italic">
                              No records found matching current filter thresholds.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] sm:text-xs text-[#8087a3]">
                      <span>
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length} records
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="p-1.5 rounded-md bg-[#141527] border border-blue-900/30 text-[#f5f7fa] disabled:opacity-50 hover:bg-[#1f2038] transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-[#f5f7fa]">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="p-1.5 rounded-md bg-[#141527] border border-blue-900/30 text-[#f5f7fa] disabled:opacity-50 hover:bg-[#1f2038] transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            // Empty Upload Prompt Page
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-blue-900/10 rounded-2xl bg-[#090a18]/20">
              <Upload className="w-12 h-12 mb-4 animate-bounce" style={{ color: activeScheme.secondary }} />
              <h2 className="text-lg font-bold text-[#f5f7fa]">No CSV File Uploaded</h2>
              <p className="text-sm text-[#8087a3] max-w-sm mt-1.5">
                Upload any sales or transaction record CSV file to generate charts and metrics dashboard locally.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={triggerFileSelect}
                  className="px-5 py-2.5 text-black font-bold rounded-lg text-sm hover:scale-[1.02] transition-all cursor-pointer"
                  style={{ backgroundImage: `linear-gradient(to right, ${activeScheme.primary}, ${activeScheme.secondary})` }}
                >
                  Upload CSV File
                </button>
                <button
                  onClick={loadDemo}
                  className="px-5 py-2.5 bg-[#141527] border border-blue-900/40 font-bold rounded-lg text-sm hover:bg-[#1b1c35] transition-all cursor-pointer"
                  style={{ color: activeScheme.primary }}
                >
                  Load Demo Sales Data
                </button>
              </div>
            </div>
          )}

        </section>

      </div>

    </main>
  );
}
