"use client";

// Premium ProposalForge - Local Client-Side Invoice & Proposal Generator
import React, { useState, useEffect, useRef } from "react";

interface Item {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface TaxItem {
  id: string;
  label: string;
  rate: number;
  enabled: boolean;
}

interface DocumentData {
  id: string;
  title: string;
  type: "proposal" | "invoice";
  template: "gold" | "dark" | "light";
  currency: "INR" | "USD" | "EUR" | "GBP";
  logo: string;
  accentColor: string;
  signature: string;
  
  // Company Info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  
  // Client Info
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  
  // Document Metadata
  docNumber: string;
  docDate: string;
  docDueDate: string;
  
  // Invoice Items & Taxes
  items: Item[];
  discount: number;
  shipping: number;
  taxes: TaxItem[];
  
  // Proposal Info
  proposalTitle: string;
  proposalScope: string;
  proposalTerms: string;
}

const initialData: DocumentData = {
  id: "default-doc",
  title: "RE Dev Ops Project Invoice",
  type: "invoice",
  template: "gold",
  currency: "INR",
  logo: "",
  accentColor: "#d4af37", // Default Gold
  signature: "",
  companyName: "RE Dev Ops",
  companyEmail: "hello@redevops.in",
  companyPhone: "+91 8734000403",
  companyAddress: "Ahmedabad, India · Remote",
  clientName: "Acme Corporation",
  clientEmail: "billing@acme.com",
  clientPhone: "+1 (555) 019-2834",
  clientAddress: "123 Business Rd, Suite 100\nSan Francisco, CA 94107",
  docNumber: "INV-2026-001",
  docDate: new Date().toISOString().split("T")[0],
  docDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  items: [
    { id: "1", description: "Premium UI/UX Design & Wireframing", quantity: 1, price: 45000 },
    { id: "2", description: "Next.js 15 Frontend Development", quantity: 1, price: 80000 },
    { id: "3", description: "AWS Serverless Cloud Deployment Setup", quantity: 1, price: 35000 }
  ],
  discount: 10,
  shipping: 0,
  taxes: [
    { id: "gst", label: "GST", rate: 18, enabled: true }
  ],
  proposalTitle: "E-Commerce Re-platform & Performance Optimization",
  proposalScope: "We will re-engineer your existing Activewear storefront using Next.js 15, custom Tailwind CSS, and a serverless AWS setup.\n\nProject Phases:\n1. Discovery & Design System Creation (7 Days)\n2. High-Performance Front-end Engineering (14 Days)\n3. Stripe Checkout Integration & Serverless Deployment (7 Days)\n\nKey Deliverables:\n- 99+ PageSpeed / Core Web Vitals rating.\n- Automated CI/CD pipeline.\n- Hand-off documents & post-launch support.",
  proposalTerms: "1. 50% Upfront payment, 50% upon deployment.\n2. Proposals are valid for 30 days from document date.\n3. Custom feature scope extensions will be billed hourly."
};

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£"
};

const accentPresets = [
  { name: "Premium Gold", value: "#d4af37" },
  { name: "Emerald Green", value: "#10b981" },
  { name: "Sapphire Blue", value: "#3b82f6" },
  { name: "Rose Gold", value: "#b76e79" },
  { name: "Ruby Red", value: "#ef4444" },
  { name: "Amethyst Purple", value: "#8b5cf6" }
];

export default function Home() {
  const [data, setData] = useState<DocumentData>(initialData);
  const [docList, setDocList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "parties" | "content" | "taxes">("general");
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Ready">("Ready");
  const [isClient, setIsClient] = useState(false);

  // Canvas Drawing Pad Ref & State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(380);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Mark client hydration complete
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Responsive canvas width
  useEffect(() => {
    const updateWidth = () => {
      if (canvasContainerRef.current) {
        setCanvasWidth(Math.min(380, canvasContainerRef.current.clientWidth - 16));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Initial Load from LocalStorage
  useEffect(() => {
    if (!isClient) return;

    // Load document list
    const savedList = localStorage.getItem("proposalforge_doc_list");
    let currentList: any[] = [];
    if (savedList) {
      try {
        currentList = JSON.parse(savedList);
      } catch (e) {
        console.error(e);
      }
    }

    if (currentList.length === 0) {
      // Initialize default list
      const defaultMeta = {
        id: "default-doc",
        title: "RE Dev Ops Project Invoice",
        type: "invoice",
        docNumber: "INV-2026-001",
        lastModified: new Date().toISOString()
      };
      currentList = [defaultMeta];
      localStorage.setItem("proposalforge_doc_list", JSON.stringify(currentList));
      localStorage.setItem("proposalforge_doc_default-doc", JSON.stringify(initialData));
    }
    setDocList(currentList);

    // Load active doc id
    const activeId = localStorage.getItem("proposalforge_active_doc_id") || "default-doc";
    const activeDoc = localStorage.getItem(`proposalforge_doc_${activeId}`);
    if (activeDoc) {
      try {
        setData(JSON.parse(activeDoc));
      } catch (e) {
        setData(initialData);
      }
    } else {
      setData(initialData);
    }
  }, [isClient]);

  // Debounced Auto-Saving
  useEffect(() => {
    if (!isClient) return;
    if (data.id === "default-doc" && data.title === "RE Dev Ops Project Invoice" && data.items.length === 3 && data.companyName === "RE Dev Ops" && data.signature === "") {
      // Prevent overwriting initialized localStorage settings on first render cycle
      return;
    }

    setSaveStatus("Saving...");
    const timer = setTimeout(() => {
      // Save active document state
      localStorage.setItem(`proposalforge_doc_${data.id}`, JSON.stringify(data));
      localStorage.setItem("proposalforge_active_doc_id", data.id);

      // Update document list metadata
      const savedList = localStorage.getItem("proposalforge_doc_list");
      let currentList: any[] = [];
      if (savedList) {
        try {
          currentList = JSON.parse(savedList);
        } catch (e) {}
      }

      const index = currentList.findIndex((item) => item.id === data.id);
      const title = data.type === "proposal" ? data.proposalTitle || "Untitled Proposal" : `Invoice ${data.docNumber || "Untitled"}`;
      const metadata = {
        id: data.id,
        title: data.title || title,
        type: data.type,
        docNumber: data.docNumber,
        lastModified: new Date().toISOString()
      };

      if (index >= 0) {
        currentList[index] = metadata;
      } else {
        currentList.push(metadata);
      }

      localStorage.setItem("proposalforge_doc_list", JSON.stringify(currentList));
      setDocList(currentList);
      setSaveStatus("Saved");

      const readyTimer = setTimeout(() => setSaveStatus("Ready"), 1500);
      return () => clearTimeout(readyTimer);
    }, 800);

    return () => clearTimeout(timer);
  }, [data, isClient]);

  // Document Management Methods
  const loadDocument = (id: string) => {
    const saved = localStorage.getItem(`proposalforge_doc_${id}`);
    if (saved) {
      try {
        setData(JSON.parse(saved));
        localStorage.setItem("proposalforge_active_doc_id", id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const createNewDoc = (type: "invoice" | "proposal") => {
    const newId = `doc_${Date.now()}`;
    const prefix = type === "proposal" ? "PROP" : "INV";
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newDoc: DocumentData = {
      ...initialData,
      id: newId,
      title: type === "proposal" ? "New Project Proposal" : "New Client Invoice",
      type,
      docNumber: `${prefix}-${new Date().getFullYear()}-${randomNum}`,
      items: [],
      taxes: [{ id: "gst", label: "GST", rate: 18, enabled: true }],
      docDate: new Date().toISOString().split("T")[0],
      docDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      proposalTitle: type === "proposal" ? "New Consulting Proposal" : "",
      proposalScope: "",
      proposalTerms: "1. 50% upfront payment.\n2. Valid for 30 days."
    };
    setData(newDoc);
  };

  const deleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (docList.length <= 1) {
      alert("You must keep at least one document template in your records.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this document?")) return;

    localStorage.removeItem(`proposalforge_doc_${id}`);
    const updatedList = docList.filter((item) => item.id !== id);
    localStorage.setItem("proposalforge_doc_list", JSON.stringify(updatedList));
    setDocList(updatedList);

    if (data.id === id) {
      loadDocument(updatedList[0].id);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the active inputs to defaults?")) {
      setData({
        ...initialData,
        id: data.id,
        title: data.title
      });
    }
  };

  // Logo Uploader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setData((prev) => ({ ...prev, logo: "" }));
  };

  // Line Item Helpers
  const updateItem = (id: string, field: keyof Item, value: any) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      description: "New Service Description",
      quantity: 1,
      price: 0
    };
    setData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const deleteItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
  };

  // Canvas Signature Methods
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = data.accentColor || "#d4af37";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setData((prev) => ({ ...prev, signature: "" }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Check if the canvas is blank by inspecting pixel data
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    if (!buffer.some(color => color !== 0)) {
      alert("Please draw your signature on the canvas first before saving.");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    setData((prev) => ({ ...prev, signature: dataUrl }));
  };

  // Math Calculations
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const discountAmount = subtotal * (data.discount / 100);
  const taxableAmount = subtotal - discountAmount;

  // Multi-tax mapping
  const activeTaxes = data.taxes ? data.taxes.filter((t) => t.enabled) : [];
  const taxDetails = activeTaxes.map((tax) => {
    const amount = taxableAmount * (tax.rate / 100);
    return {
      ...tax,
      amount
    };
  });
  const totalTax = taxDetails.reduce((sum, t) => sum + t.amount, 0);
  const grandTotal = taxableAmount + totalTax + data.shipping;

  const symbol = currencySymbols[data.currency] || "₹";

  const handlePrint = () => {
    window.print();
  };

  // CSS custom styling injectors for preview sheet
  const accentBorder = (opacityHex = "33") => ({ borderColor: `${data.accentColor}${opacityHex}` });
  const accentText = { color: data.accentColor };
  const accentBackground = { backgroundColor: data.accentColor };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#080808]">
      {/* Editor Panel - Left */}
      <section className="w-full md:w-[480px] shrink-0 border-r border-[#221e12]/30 bg-[#0d0d0d] flex flex-col h-screen overflow-y-auto no-print">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#221e12]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#aa7c11] to-[#f3e5ab] flex items-center justify-center font-bold text-[#0a0a0a]" style={accentBackground}>
              PF
            </span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] bg-clip-text text-transparent">
              ProposalForge
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus !== "Ready" && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 transition-all duration-300 ${
                saveStatus === "Saved" 
                  ? "bg-green-950/40 text-green-400 border border-green-800/30" 
                  : "bg-amber-950/40 text-amber-400 border border-amber-800/30 animate-pulse"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === "Saved" ? "bg-green-400" : "bg-amber-400"
                }`}></span>
                {saveStatus}
              </span>
            )}
            <span className="text-[10px] text-[#a0a0a0] font-medium uppercase tracking-wider bg-[#171717] px-2 py-1 rounded">Local-Only</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="no-print flex border-b border-[#221e12]/20 text-xs px-2 pt-2 gap-1 bg-[#0b0b0b]">
          {(["general", "parties", "content", "taxes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-1 rounded-t-lg font-semibold capitalize tracking-wide transition-all ${
                activeTab === tab
                  ? "bg-[#141414] border-t border-x border-[#221e12]/30"
                  : "text-[#808080] hover:text-[#f5f5f5]"
              }`}
              style={activeTab === tab ? { color: data.accentColor, borderTopColor: `${data.accentColor}aa` } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-6">
              
              {/* Saved Documents Manager Panel */}
              <div className="p-4 bg-[#141414] border border-[#221e12]/20 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-[#221e12]/20 pb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#d4af37]" style={accentText}>My Documents</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => createNewDoc("invoice")}
                      className="text-[10px] bg-[#d4af37] text-[#0a0a0a] font-bold px-2.5 py-1 rounded hover:bg-white transition-all"
                      style={accentBackground}
                    >
                      + Invoice
                    </button>
                    <button
                      onClick={() => createNewDoc("proposal")}
                      className="text-[10px] bg-[#d4af37] text-[#0a0a0a] font-bold px-2.5 py-1 rounded hover:bg-white transition-all"
                      style={accentBackground}
                    >
                      + Proposal
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] text-[#808080] uppercase">Select Active Draft</label>
                  <select
                    value={data.id}
                    onChange={(e) => loadDocument(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                  >
                    {docList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => {
                      const newId = `doc_${Date.now()}`;
                      const dupDoc = {
                        ...data,
                        id: newId,
                        title: `${data.title} (Copy)`,
                        docNumber: `${data.docNumber}-COPY`
                      };
                      setData(dupDoc);
                    }}
                    className="flex-1 py-1.5 bg-[#0a0a0a] border border-[#221e12]/30 text-xs font-semibold rounded text-[#a0a0a0] hover:text-[#f5f5f5] transition-all"
                  >
                    Duplicate Draft
                  </button>
                  <button
                    onClick={(e) => deleteDoc(data.id, e)}
                    className="py-1.5 px-4 bg-[#1c1414] border border-red-900/30 text-xs font-semibold rounded text-red-400 hover:bg-red-950/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Document Info Edit */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Document Title</label>
                  <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    placeholder="Rename this document..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Doc Type</label>
                    <select
                      value={data.type}
                      onChange={(e) => setData((prev) => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    >
                      <option value="invoice">Invoice</option>
                      <option value="proposal">Proposal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Template Layout</label>
                    <select
                      value={data.template}
                      onChange={(e) => setData((prev) => ({ ...prev, template: e.target.value as any }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    >
                      <option value="gold">Premium Gold</option>
                      <option value="dark">Minimal Dark</option>
                      <option value="light">Executive Light</option>
                    </select>
                  </div>
                </div>

                {/* Theme Customizer */}
                <div>
                  <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Theme Accent Color</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {accentPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setData((prev) => ({ ...prev, accentColor: preset.value }))}
                        className="w-7 h-7 rounded-full transition-all border-2 relative"
                        style={{
                          backgroundColor: preset.value,
                          borderColor: data.accentColor === preset.value ? "#ffffff" : "transparent"
                        }}
                        title={preset.name}
                      >
                        {data.accentColor === preset.value && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#0a0a0a] font-bold">✓</span>
                        )}
                      </button>
                    ))}
                    
                    {/* Custom Color Input */}
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#221e12]/30 flex items-center justify-center bg-[#141414]" title="Custom color picker">
                      <input
                        type="color"
                        value={data.accentColor || "#d4af37"}
                        onChange={(e) => setData((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Doc Number</label>
                    <input
                      type="text"
                      value={data.docNumber}
                      onChange={(e) => setData((prev) => ({ ...prev, docNumber: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Currency</label>
                    <select
                      value={data.currency}
                      onChange={(e) => setData((prev) => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Issue Date</label>
                    <input
                      type="date"
                      value={data.docDate}
                      onChange={(e) => setData((prev) => ({ ...prev, docDate: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Due Date</label>
                    <input
                      type="date"
                      value={data.docDueDate}
                      onChange={(e) => setData((prev) => ({ ...prev, docDueDate: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-[#221e12]/20 pt-4">
                  <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Company Logo</label>
                  {data.logo ? (
                    <div className="flex items-center gap-4 bg-[#141414] p-3 rounded-lg border border-[#221e12]/25">
                      <img src={data.logo} alt="Logo preview" className="h-10 max-w-[120px] object-contain rounded" />
                      <button onClick={removeLogo} className="text-xs text-red-400 hover:text-red-300 font-semibold">Remove logo</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#221e12]/30 rounded-lg cursor-pointer bg-[#141414] hover:bg-[#1a1a1a] transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-6 h-6 mb-2 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="text-xs text-[#808080]"><span className="font-semibold text-[#d4af37]">Upload Logo Image</span></p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PARTIES TAB */}
          {activeTab === "parties" && (
            <div className="space-y-6">
              
              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-[#221e12]/20 pb-1 text-[#d4af37]" style={accentText}>Sender (Your Details)</h3>
                <div>
                  <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => setData((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={data.companyEmail}
                      onChange={(e) => setData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={data.companyPhone}
                      onChange={(e) => setData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={data.companyAddress}
                    onChange={(e) => setData((prev) => ({ ...prev, companyAddress: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4 pt-4 border-t border-[#221e12]/20">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b border-[#221e12]/20 pb-1 text-[#d4af37]" style={accentText}>Recipient (Client Details)</h3>
                <div>
                  <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    value={data.clientName}
                    onChange={(e) => setData((prev) => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={data.clientEmail}
                      onChange={(e) => setData((prev) => ({ ...prev, clientEmail: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={data.clientPhone}
                      onChange={(e) => setData((prev) => ({ ...prev, clientPhone: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#808080] uppercase mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={data.clientAddress}
                    onChange={(e) => setData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                    className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2 focus:border-[#d4af37] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Signature Management Pad */}
              <div className="border-t border-[#221e12]/20 pt-4 space-y-4">
                <div className="flex justify-between items-center border-b border-[#221e12]/20 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]" style={accentText}>Authorized Signature</h3>
                  {data.signature && (
                    <button
                      onClick={() => setData((prev) => ({ ...prev, signature: "" }))}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {data.signature ? (
                    <div className="bg-[#141414] p-3 rounded-lg border border-[#221e12]/20 flex items-center justify-between">
                      <img src={data.signature} alt="Saved Signature" className="h-10 max-h-12 object-contain bg-white rounded p-1" />
                      <span className="text-xs text-green-400 font-semibold">Active Signature Linked</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Upload Option */}
                      <div>
                        <label className="block text-[9px] font-semibold text-[#808080] uppercase mb-1.5">Option A: Upload Signature Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setData((prev) => ({ ...prev, signature: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs text-[#808080] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#141414] file:text-[#d4af37] file:hover:bg-[#1f1f1f] cursor-pointer"
                        />
                      </div>

                      {/* Canvas Drawing option */}
                      <div className="space-y-2">
                        <label className="block text-[9px] font-semibold text-[#808080] uppercase">Option B: Draw Signature on Pad</label>
                        <div ref={canvasContainerRef} className="bg-[#0a0a0a] border border-[#221e12]/30 rounded-lg p-2.5 flex flex-col items-center">
                          <canvas
                            ref={canvasRef}
                            width={canvasWidth}
                            height={100}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="bg-white cursor-crosshair max-w-full h-[100px] border border-[#221e12]/20 rounded"
                          />
                          <div className="flex gap-4 w-full mt-2.5 justify-end text-xs">
                            <button
                              onClick={clearSignature}
                              className="px-2.5 py-1 bg-[#141414] border border-[#221e12]/30 font-semibold rounded text-[#808080] hover:text-[#f5f5f5] transition-all"
                            >
                              Clear Pad
                            </button>
                            <button
                              onClick={saveSignature}
                              className="px-3 py-1 bg-[#d4af37] text-[#0a0a0a] font-bold rounded hover:bg-white transition-all"
                              style={accentBackground}
                            >
                              Save Signature
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {data.type === "proposal" ? (
                // Proposal editors
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Proposal Title</label>
                    <input
                      type="text"
                      value={data.proposalTitle}
                      onChange={(e) => setData((prev) => ({ ...prev, proposalTitle: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                      placeholder="e.g. Website Development Project"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Scope of Work</label>
                    <textarea
                      rows={8}
                      value={data.proposalScope}
                      onChange={(e) => setData((prev) => ({ ...prev, proposalScope: e.target.value }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                      placeholder="Detail project phases, deliverables..."
                    />
                  </div>
                </div>
              ) : (
                // Invoice item lists
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#221e12]/20 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]" style={accentText}>Line Items</h3>
                    <button onClick={addItem} className="text-xs bg-[#d4af37] text-[#0a0a0a] font-bold px-3 py-1.5 rounded-lg hover:bg-white transition-all flex items-center gap-1" style={accentBackground}>
                      Add Line Item
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {data.items.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-[#141414] border border-[#221e12]/20 rounded-lg space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-[#808080] font-bold">Item #{idx + 1}</span>
                          <button onClick={() => deleteItem(item.id)} className="text-[10px] text-red-400 hover:text-red-300 font-bold">Remove</button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#221e12]/15 text-[#f5f5f5] text-xs rounded p-1.5 focus:border-[#d4af37] outline-none"
                            placeholder="Description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-[#808080] mb-0.5">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                              className="w-full bg-[#0a0a0a] border border-[#221e12]/15 text-[#f5f5f5] text-xs rounded p-1.5 focus:border-[#d4af37] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-[#808080] mb-0.5">Unit Price</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                              className="w-full bg-[#0a0a0a] border border-[#221e12]/15 text-[#f5f5f5] text-xs rounded p-1.5 focus:border-[#d4af37] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.items.length === 0 && (
                      <p className="text-xs text-[#808080] text-center py-4">No items added. Click Add Line Item above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Shared Terms & Conditions */}
              <div className="pt-4 border-t border-[#221e12]/20">
                <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={data.proposalTerms}
                  onChange={(e) => setData((prev) => ({ ...prev, proposalTerms: e.target.value }))}
                  className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                  placeholder="Terms of payment, document validity..."
                />
              </div>
            </div>
          )}

          {/* TAXES TAB */}
          {activeTab === "taxes" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#221e12]/20 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]" style={accentText}>Taxation & Additional Rates</h3>
                  <button
                    onClick={() => {
                      const newTax: TaxItem = {
                        id: `tax_${Date.now()}`,
                        label: "Tax",
                        rate: 5,
                        enabled: true
                      };
                      setData(prev => ({
                        ...prev,
                        taxes: [...(prev.taxes || []), newTax]
                      }));
                    }}
                    className="text-[10px] bg-[#141414] text-[#d4af37] border border-[#221e12]/30 font-bold px-2 py-1 rounded hover:bg-[#1f1f1f] transition-all"
                  >
                    + Add Custom Tax
                  </button>
                </div>
                
                {/* Taxes List */}
                <div className="space-y-3">
                  {(data.taxes || []).map((tax) => (
                    <div key={tax.id} className="p-3 bg-[#141414] border border-[#221e12]/20 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tax.enabled}
                            onChange={(e) => {
                              const updated = data.taxes.map(t => t.id === tax.id ? { ...t, enabled: e.target.checked } : t);
                              setData(prev => ({ ...prev, taxes: updated }));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[#d4af37] focus:ring-[#d4af37] accent-[#d4af37]"
                          />
                          <input
                            type="text"
                            value={tax.label}
                            onChange={(e) => {
                              const updated = data.taxes.map(t => t.id === tax.id ? { ...t, label: e.target.value } : t);
                              setData(prev => ({ ...prev, taxes: updated }));
                            }}
                            className="bg-transparent text-sm font-semibold text-[#f5f5f5] focus:border-b focus:border-[#d4af37] outline-none max-w-[120px]"
                            placeholder="Tax Label"
                          />
                        </div>
                        {tax.id !== "gst" && (
                          <button
                            onClick={() => {
                              const updated = data.taxes.filter(t => t.id !== tax.id);
                              setData(prev => ({ ...prev, taxes: updated }));
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      {tax.enabled && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#808080]">Rate (%)</label>
                          <input
                            type="number"
                            value={tax.rate}
                            onChange={(e) => {
                              const updated = data.taxes.map(t => t.id === tax.id ? { ...t, rate: Number(e.target.value) } : t);
                              setData(prev => ({ ...prev, taxes: updated }));
                            }}
                            className="w-20 bg-[#0a0a0a] border border-[#221e12]/15 text-[#f5f5f5] text-xs rounded p-1 focus:border-[#d4af37] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#221e12]/20">
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Discount (%)</label>
                    <input
                      type="number"
                      value={data.discount}
                      onChange={(e) => setData((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Shipping ({symbol})</label>
                    <input
                      type="number"
                      value={data.shipping}
                      onChange={(e) => setData((prev) => ({ ...prev, shipping: Number(e.target.value) }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-6 border-t border-[#221e12]/30 bg-[#0a0a0a] space-y-3">
          <button
            onClick={handlePrint}
            className="w-full py-3 bg-gradient-to-r from-[#aa7c11] via-[#d4af37] to-[#f3e5ab] text-[#0a0a0a] font-bold rounded-lg shadow-lg hover:shadow-[#d4af37]/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            style={accentBackground}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF / Print
          </button>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => {
                localStorage.setItem(`proposalforge_doc_${data.id}`, JSON.stringify(data));
                alert("Force saved current project successfully to local storage!");
              }}
              className="py-2.5 bg-[#141414] text-[#f5f5f5] font-semibold rounded-lg border border-[#221e12]/30 hover:bg-[#1f1f1f] transition-all"
            >
              Manual Sync
            </button>
            <button
              onClick={handleReset}
              className="py-2.5 bg-[#141414] text-[#808080] hover:text-red-400 font-semibold rounded-lg border border-[#221e12]/30 hover:bg-[#1c1414] transition-all"
            >
              Reset Inputs
            </button>
          </div>
        </div>
      </section>

      {/* Preview Screen - Right */}
      <section className="flex-1 bg-[#050505] overflow-y-auto flex justify-center p-8 md:p-12 relative min-h-screen">
        {/* Floating Portfolio Back Button */}
        <a href="../index.html#project-proposal-forge" className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-[#0d0d0d] border border-[#221e12]/20 text-xs font-semibold text-[#a0a0a0] hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-all flex items-center gap-1.5 no-print">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Portfolio
        </a>

        {/* Paper Sheet Preview Container */}
        <div 
          className={`print-container w-full max-w-[800px] min-h-0 sm:min-h-[1130px] rounded-xl shadow-2xl p-4 sm:p-12 flex flex-col justify-between transition-all duration-300 border ${
            data.template === "gold" 
              ? "bg-[#0c0c0c] text-[#f5f5f5]" 
              : data.template === "dark"
                ? "bg-[#090909] border-[#222] text-[#f5f5f5]"
                : "bg-white border-[#ddd] text-black shadow-md"
          }`}
          style={data.template === "gold" ? accentBorder("40") : {}}
        >
          {/* Main Top Content */}
          <div className="space-y-12">
            
            {/* Template Header / Logo */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                {data.logo ? (
                  <img src={data.logo} alt="Company Logo" className="h-14 max-w-[180px] object-contain mb-4" />
                ) : (
                  <div 
                    className="text-2xl font-bold tracking-tight mb-4" 
                    style={data.template === "light" ? { color: "#000000" } : accentText}
                  >
                    {data.companyName}
                  </div>
                )}
                <div className={`text-xs space-y-1 ${data.template === "light" ? "text-[#555]" : "text-[#a0a0a0]"}`}>
                  <p className={`font-semibold text-sm ${data.template === "light" ? "text-black" : "text-[#f5f5f5]"}`}>{data.companyName}</p>
                  <p>{data.companyEmail} · {data.companyPhone}</p>
                  <p className="whitespace-pre-line">{data.companyAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <div 
                  className="text-3xl font-extrabold uppercase tracking-wider mb-2"
                  style={data.type === "proposal" ? (data.template === "light" ? { color: "#888" } : accentText) : (data.template === "light" ? { color: "#000" } : { color: "#f5f5f5" })}
                >
                  {data.type}
                </div>
                <div className={`text-xs space-y-1.5 ${data.template === "light" ? "text-[#555]" : "text-[#a0a0a0]"}`}>
                  <p className="font-mono text-sm font-bold">{data.docNumber}</p>
                  <p><span className="font-semibold uppercase tracking-wider text-[10px]">Date:</span> {data.docDate}</p>
                  {data.docDueDate && <p><span className="font-semibold uppercase tracking-wider text-[10px]">Due Date:</span> {data.docDueDate}</p>}
                </div>
              </div>
            </div>

            {/* Document Split Info: Client details */}
            <div 
              className="grid grid-cols-2 gap-8 border-t border-b py-6"
              style={data.template === "gold" ? accentBorder("25") : data.template === "dark" ? { borderColor: "#222" } : { borderColor: "#ddd" }}
            >
              <div>
                <span 
                  className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={data.template === "light" ? { color: "#777" } : accentText}
                >
                  Prepared For
                </span>
                <div className="text-sm space-y-1.5">
                  <p className="font-bold text-base">{data.clientName}</p>
                  <p className={data.template === "light" ? "text-[#555]" : "text-[#a0a0a0]"}>{data.clientEmail}</p>
                  <p className={data.template === "light" ? "text-[#555]" : "text-[#a0a0a0]"}>{data.clientPhone}</p>
                  <p className={`whitespace-pre-line text-xs ${data.template === "light" ? "text-[#666]" : "text-[#808080]"}`}>{data.clientAddress}</p>
                </div>
              </div>
              <div className="text-right flex flex-col justify-end">
                {data.type === "invoice" && (
                  <div className="space-y-1.5">
                    <span 
                      className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={data.template === "light" ? { color: "#777" } : accentText}
                    >
                      Total Due
                    </span>
                    <p className={`text-2xl font-black ${data.template === "light" ? "text-black" : "text-[#f5f5f5]"}`}>
                      {symbol}{grandTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Body: Proposal Content vs Invoice Items */}
            {data.type === "proposal" ? (
              // PROPOSAL CONTENT
              <div className="space-y-6">
                <div>
                  <h3 className={`text-2xl font-bold tracking-tight mb-4 ${data.template === "light" ? "text-black" : "text-[#f5f5f5]"}`}>
                    {data.proposalTitle}
                  </h3>
                  <div 
                    className="h-[2px] w-12 mb-6"
                    style={data.template === "light" ? { backgroundColor: "#000" } : { background: `linear-gradient(90deg, ${data.accentColor}, transparent)` }}
                  ></div>
                </div>
                
                <div className={`text-sm leading-relaxed whitespace-pre-line space-y-4 ${data.template === "light" ? "text-[#333]" : "text-[#d0d0d0]"}`}>
                  <p 
                    className="font-bold uppercase tracking-wider text-[11px] mb-1"
                    style={data.template === "light" ? { color: "#888" } : accentText}
                  >
                    Scope of Work & Strategy
                  </p>
                  {data.proposalScope}
                </div>

                {/* Proposal Cost Estimate Table */}
                {data.items.length > 0 && (
                  <div className="pt-8 space-y-4 print-avoid-break">
                    <p 
                      className="font-bold uppercase tracking-wider text-[11px] mb-1"
                      style={data.template === "light" ? { color: "#888" } : accentText}
                    >
                      Estimated Cost Breakdown
                    </p>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr 
                          className="border-b text-[10px] font-bold uppercase tracking-wider"
                          style={data.template === "gold" ? { ...accentBorder("25"), ...accentText } : data.template === "dark" ? { borderColor: "#222", color: "#888" } : { borderColor: "#ddd", color: "#555" }}
                        >
                          <th className="py-2.5">Service Description</th>
                          <th className="py-2.5 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item) => (
                          <tr 
                            key={item.id} 
                            className="border-b"
                            style={data.template === "gold" ? accentBorder("15") : data.template === "dark" ? { borderColor: "#222" } : { borderColor: "#ddd" }}
                          >
                            <td className="py-3 font-medium">{item.description}</td>
                            <td className="py-3 text-right font-semibold font-mono">{symbol}{item.price.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              // INVOICE LINE ITEMS TABLE
              <div className="space-y-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr 
                      className="border-b text-[10px] font-bold uppercase tracking-wider"
                      style={data.template === "gold" ? { ...accentBorder("25"), ...accentText } : data.template === "dark" ? { borderColor: "#222", color: "#888" } : { borderColor: "#ddd", color: "#555" }}
                    >
                      <th className="py-2.5 w-8">#</th>
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-right w-16">Qty</th>
                      <th className="py-2.5 text-right w-24">Unit Price</th>
                      <th className="py-2.5 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className="border-b"
                        style={data.template === "gold" ? accentBorder("15") : data.template === "dark" ? { borderColor: "#222" } : { borderColor: "#ddd" }}
                      >
                        <td className="py-3 font-mono text-[#808080]">{idx + 1}</td>
                        <td className="py-3 font-medium whitespace-pre-line">{item.description}</td>
                        <td className="py-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">{symbol}{item.price.toLocaleString("en-IN")}</td>
                        <td className="py-3 text-right font-semibold font-mono">{symbol}{(item.quantity * item.price).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    {data.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#808080] italic">No items listed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Subtotals & Taxes */}
                <div className="flex justify-end print-avoid-break">
                  <div className="w-full sm:w-64 space-y-2.5 text-xs">
                    <div className="flex justify-between text-[#808080]">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold">{symbol}{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    {data.discount > 0 && (
                      <div className="flex justify-between text-[#808080]">
                        <span>Discount ({data.discount}%):</span>
                        <span className="font-mono text-green-400 font-semibold">-{symbol}{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    
                    {/* Render active taxes list */}
                    {taxDetails.map((tax) => (
                      <div key={tax.id} className="flex justify-between text-[#808080]">
                        <span>{tax.label} ({tax.rate}%):</span>
                        <span className="font-mono font-semibold">+{symbol}{tax.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}

                    {data.shipping > 0 && (
                      <div className="flex justify-between text-[#808080]">
                        <span>Shipping:</span>
                        <span className="font-mono font-semibold">+{symbol}{data.shipping.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div 
                      className="flex justify-between border-t pt-2.5 font-bold"
                      style={data.template === "gold" ? { ...accentBorder("35"), color: "#f5f5f5" } : data.template === "dark" ? { borderColor: "#222", color: "#f5f5f5" } : { borderColor: "#000", color: "#000" }}
                    >
                      <span className="text-sm">Total Due:</span>
                      <span className="font-mono text-base" style={data.template === "light" ? { color: "#000" } : accentText}>
                        {symbol}{grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Area - Terms, Signature */}
          <div className="space-y-8 pt-12 print-avoid-break">
            {data.proposalTerms && (
              <div className="space-y-1.5">
                <span 
                  className="block text-[9px] font-bold uppercase tracking-wider"
                  style={data.template === "light" ? { color: "#777" } : accentText}
                >
                  Terms & Conditions
                </span>
                <p className={`text-[10px] leading-relaxed whitespace-pre-line ${data.template === "light" ? "text-[#666]" : "text-[#808080]"}`}>
                  {data.proposalTerms}
                </p>
              </div>
            )}

            <div className="flex justify-between items-end pt-6 border-t border-dashed border-[#808080]/20 text-[10px]">
              <div>
                <p className="font-bold">{data.companyName}</p>
                <p className="text-[#808080] mt-0.5">Thank you for your business.</p>
              </div>
              <div className="text-right w-40 flex flex-col items-center justify-end">
                {data.signature ? (
                  <img src={data.signature} alt="Signature" className="h-10 max-h-12 object-contain mb-1" />
                ) : (
                  <div className={`h-8 border-b w-full ${data.template === "light" ? "border-black" : "border-[#808080]/30"}`}></div>
                )}
                <p className="text-[#808080] mt-1.5 uppercase tracking-wide font-bold">Authorized Signee</p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
