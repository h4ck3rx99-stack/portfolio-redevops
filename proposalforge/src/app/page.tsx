"use client";

import React, { useState, useEffect } from "react";

interface Item {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface DocumentData {
  type: "proposal" | "invoice";
  template: "gold" | "dark" | "light";
  currency: "INR" | "USD" | "EUR" | "GBP";
  logo: string;
  
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
  gstEnabled: boolean;
  gstRate: number;
  
  // Proposal Info
  proposalTitle: string;
  proposalScope: string;
  proposalTerms: string;
}

const initialData: DocumentData = {
  type: "invoice",
  template: "gold",
  currency: "INR",
  logo: "",
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
  gstEnabled: true,
  gstRate: 18,
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

export default function Home() {
  const [data, setData] = useState<DocumentData>(initialData);
  const [activeTab, setActiveTab] = useState<"general" | "parties" | "content" | "taxes">("general");

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("proposalforge_doc_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error("Failed to load saved document data", e);
      }
    }
  }, []);

  // Save to LocalStorage
  const handleSave = () => {
    localStorage.setItem("proposalforge_doc_data", JSON.stringify(data));
    alert("Project saved successfully to local browser storage!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all inputs to defaults?")) {
      setData(initialData);
      localStorage.removeItem("proposalforge_doc_data");
    }
  };

  // Logo uploader
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

  // Item helpers
  const updateItem = (id: string, field: keyof Item, value: any) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      description: "New Service Line Item",
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

  // Math Calculations
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const discountAmount = subtotal * (data.discount / 100);
  const gstAmount = data.gstEnabled ? (subtotal - discountAmount) * (data.gstRate / 100) : 0;
  const grandTotal = subtotal - discountAmount + gstAmount + data.shipping;

  const symbol = currencySymbols[data.currency];

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#080808]">
      {/* Editor Panel - Left */}
      <section className="w-full md:w-[480px] shrink-0 border-r border-[#221e12]/30 bg-[#0d0d0d] flex flex-col h-screen overflow-y-auto no-print">
        {/* Header */}
        <div className="p-6 border-b border-[#221e12]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#aa7c11] to-[#f3e5ab] flex items-center justify-center font-bold text-[#0a0a0a]">PF</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#f3e5ab] via-[#d4af37] to-[#aa7c11] bg-clip-text text-transparent">ProposalForge</h1>
          </div>
          <span className="text-xs text-[#a0a0a0] font-medium uppercase tracking-wider bg-[#171717] px-2 py-1 rounded">Local-Only</span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#221e12]/20 text-xs px-2 pt-2 gap-1 bg-[#0b0b0b]">
          {(["general", "parties", "content", "taxes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-1 rounded-t-lg font-semibold capitalize tracking-wide transition-all ${
                activeTab === tab
                  ? "bg-[#141414] text-[#d4af37] border-t border-x border-[#221e12]/30"
                  : "text-[#808080] hover:text-[#f5f5f5]"
              }`}
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">Template</label>
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
          )}

          {/* PARTIES TAB */}
          {activeTab === "parties" && (
            <div className="space-y-6">
              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider border-b border-[#221e12]/20 pb-1">Sender (Your Details)</h3>
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
                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider border-b border-[#221e12]/20 pb-1">Recipient (Client Details)</h3>
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
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {data.type === "proposal" ? (
                // Proposal content editors
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
                // Invoice item editor
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#221e12]/20 pb-2">
                    <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">Line Items</h3>
                    <button onClick={addItem} className="text-xs bg-[#d4af37] text-[#0a0a0a] font-bold px-3 py-1.5 rounded-lg hover:bg-white transition-all flex items-center gap-1">Add Line Item</button>
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
                <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider border-b border-[#221e12]/20 pb-1">Taxation & Additional Rates</h3>
                
                <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#221e12]/20 rounded-lg">
                  <div>
                    <label className="text-sm font-semibold text-[#f5f5f5]">GST Tax Support</label>
                    <p className="text-[10px] text-[#808080]">Apply Goods & Services Tax (GST)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.gstEnabled}
                    onChange={(e) => setData((prev) => ({ ...prev, gstEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#d4af37] focus:ring-[#d4af37] accent-[#d4af37]"
                  />
                </div>

                {data.gstEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-[#808080] uppercase tracking-wider mb-2">GST Rate (%)</label>
                    <input
                      type="number"
                      value={data.gstRate}
                      onChange={(e) => setData((prev) => ({ ...prev, gstRate: Number(e.target.value) }))}
                      className="w-full bg-[#141414] border border-[#221e12]/25 text-[#f5f5f5] text-sm rounded-lg p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
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
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF / Print
          </button>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={handleSave}
              className="py-2.5 bg-[#141414] text-[#f5f5f5] font-semibold rounded-lg border border-[#221e12]/30 hover:bg-[#1f1f1f] transition-all"
            >
              Save Project
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
        <a href="/" className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-[#0d0d0d] border border-[#221e12]/20 text-xs font-semibold text-[#a0a0a0] hover:text-[#d4af37] hover:border-[#d4af37]/40 transition-all flex items-center gap-1.5 no-print">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Portfolio
        </a>

        {/* Paper Sheet Preview container */}
        <div 
          className={`print-container w-full max-w-[800px] min-h-[1130px] rounded-xl shadow-2xl p-12 flex flex-col justify-between transition-all duration-300 border ${
            data.template === "gold" 
              ? "bg-[#0c0c0c] border-[#d4af37]/25 text-[#f5f5f5]" 
              : data.template === "dark"
                ? "bg-[#090909] border-[#222] text-[#f5f5f5]"
                : "bg-white border-[#ddd] text-black shadow-md"
          }`}
        >
          {/* Main Top Content */}
          <div className="space-y-12">
            {/* Template Header / Logo */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div>
                {data.logo ? (
                  <img src={data.logo} alt="Company Logo" className="h-14 max-w-[180px] object-contain mb-4" />
                ) : (
                  <div className={`text-2xl font-bold tracking-tight mb-4 ${data.template === "light" ? "text-black" : "gold-gradient"}`}>
                    {data.companyName}
                  </div>
                )}
                <div className={`text-xs space-y-1 ${data.template === "light" ? "text-[#555]" : "text-[#a0a0a0]"}`}>
                  <p className="font-semibold text-sm text-[#f5f5f5] dark:text-black">{data.companyName}</p>
                  <p>{data.companyEmail} · {data.companyPhone}</p>
                  <p className="whitespace-pre-line">{data.companyAddress}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-extrabold uppercase tracking-wider mb-2 ${
                  data.type === "proposal" 
                    ? data.template === "light" ? "text-[#888]" : "text-[#d4af37]"
                    : data.template === "light" ? "text-black" : "text-[#f5f5f5]"
                }`}>
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
            <div className={`grid grid-cols-2 gap-8 border-t border-b py-6 ${
              data.template === "gold"
                ? "border-[#d4af37]/20"
                : data.template === "dark"
                  ? "border-[#222]"
                  : "border-[#ddd]"
            }`}>
              <div>
                <span className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${
                  data.template === "light" ? "text-[#777]" : "text-[#d4af37]"
                }`}>Prepared For</span>
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
                    <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      data.template === "light" ? "text-[#777]" : "text-[#d4af37]"
                    }`}>Total Due</span>
                    <p className={`text-2xl font-black ${
                      data.template === "light" ? "text-black" : "text-[#f5f5f5]"
                    }`}>{symbol}{grandTotal.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Body: Proposal Content vs Invoice Items */}
            {data.type === "proposal" ? (
              // PROPOSAL CONTENT
              <div className="space-y-6">
                <div>
                  <h3 className={`text-2xl font-bold tracking-tight mb-4 ${
                    data.template === "light" ? "text-black" : "text-[#f5f5f5]"
                  }`}>{data.proposalTitle}</h3>
                  <div className={`h-[2px] w-12 mb-6 ${
                    data.template === "light" ? "bg-black" : "bg-gradient-to-r from-[#d4af37] to-transparent"
                  }`}></div>
                </div>
                
                <div className={`text-sm leading-relaxed whitespace-pre-line space-y-4 ${
                  data.template === "light" ? "text-[#333]" : "text-[#d0d0d0]"
                }`}>
                  <p className="font-bold uppercase tracking-wider text-[11px] text-[#d4af37] dark:text-[#888] mb-1">Scope of Work & Strategy</p>
                  {data.proposalScope}
                </div>

                {/* Proposal Cost Estimate Table */}
                {data.items.length > 0 && (
                  <div className="pt-8 space-y-4 print-avoid-break">
                    <p className="font-bold uppercase tracking-wider text-[11px] text-[#d4af37] dark:text-[#888] mb-1">Estimated Cost Breakdown</p>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                          data.template === "gold" 
                            ? "border-[#d4af37]/20 text-[#d4af37]" 
                            : data.template === "dark" 
                              ? "border-[#222] text-[#888]" 
                              : "border-[#ddd] text-[#555]"
                        }`}>
                          <th className="py-2.5">Service Description</th>
                          <th className="py-2.5 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item) => (
                          <tr key={item.id} className={`border-b ${
                            data.template === "gold" 
                              ? "border-[#d4af37]/10" 
                              : data.template === "dark" 
                                ? "border-[#222]" 
                                : "border-[#ddd]"
                          }`}>
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
                    <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                      data.template === "gold" 
                        ? "border-[#d4af37]/20 text-[#d4af37]" 
                        : data.template === "dark" 
                          ? "border-[#222] text-[#888]" 
                          : "border-[#ddd] text-[#555]"
                    }`}>
                      <th className="py-2.5 w-8">#</th>
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-right w-16">Qty</th>
                      <th className="py-2.5 text-right w-24">Unit Price</th>
                      <th className="py-2.5 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={item.id} className={`border-b ${
                        data.template === "gold" 
                          ? "border-[#d4af37]/10" 
                          : data.template === "dark" 
                            ? "border-[#222]" 
                            : "border-[#ddd]"
                      }`}>
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
                  <div className="w-64 space-y-2.5 text-xs">
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
                    {data.gstEnabled && (
                      <div className="flex justify-between text-[#808080]">
                        <span>GST ({data.gstRate}%):</span>
                        <span className="font-mono font-semibold">+{symbol}{gstAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {data.shipping > 0 && (
                      <div className="flex justify-between text-[#808080]">
                        <span>Shipping:</span>
                        <span className="font-mono font-semibold">+{symbol}{data.shipping.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className={`flex justify-between border-t pt-2.5 font-bold ${
                      data.template === "gold" 
                        ? "border-[#d4af37]/25 text-[#f5f5f5]" 
                        : data.template === "dark" 
                          ? "border-[#222] text-[#f5f5f5]" 
                          : "border-black text-black"
                    }`}>
                      <span className="text-sm">Total Due:</span>
                      <span className="font-mono text-base">{symbol}{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Area - Terms, signature */}
          <div className="space-y-8 pt-12 print-avoid-break">
            {data.proposalTerms && (
              <div className="space-y-1.5">
                <span className={`block text-[9px] font-bold uppercase tracking-wider ${
                  data.template === "light" ? "text-[#777]" : "text-[#d4af37]"
                }`}>Terms & Conditions</span>
                <p className={`text-[10px] leading-relaxed whitespace-pre-line ${
                  data.template === "light" ? "text-[#666]" : "text-[#808080]"
                }`}>
                  {data.proposalTerms}
                </p>
              </div>
            )}

            <div className="flex justify-between items-end pt-6 border-t border-dashed border-[#808080]/20 text-[10px]">
              <div>
                <p className="font-bold">{data.companyName}</p>
                <p className="text-[#808080] mt-0.5">Thank you for your business.</p>
              </div>
              <div className="text-right w-40">
                <div className={`h-8 border-b ${
                  data.template === "light" ? "border-black" : "border-[#808080]/30"
                }`}></div>
                <p className="text-[#808080] mt-1.5 uppercase tracking-wide font-bold">Authorized Signee</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
