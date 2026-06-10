"use client";

import { useMemo, useState, useRef, useEffect } from "react";

type Transaction = {
  date: string;
  merchant: string;
  amount: number;
};

const AVATAR_COLORS = [
  "bg-[rgba(79,110,247,0.15)] text-[#7b9bff]",
  "bg-[rgba(139,92,246,0.15)] text-[#c4b5fd]",
  "bg-[rgba(52,211,153,0.12)] text-[#6ee7b7]",
  "bg-[rgba(251,191,36,0.12)] text-[#fbbf24]",
  "bg-[rgba(244,63,94,0.12)] text-[#fb7185]",
];

const NAV_ITEMS = ["Overview", "Transactions", "Analytics", "Reports"];
const FILTER_ITEMS = ["All", "Alerts", "Large"];

const AI_PROMPTS = [
  "Summarise my top spending categories",
  "Flag any unusual spending patterns",
  "How can I reduce my expenses?",
];

function categorise(merchant: string): string {
  const m = (merchant || "").toLowerCase();
  if (/swiggy|zomato|food|restaurant|domino|pizza|mcd|kfc|starbucks|cafe|blinkit|zepto|bigbasket/.test(m)) return "Food";
  if (/uber|ola|rapido|irctc|rail|indigo|flight|petrol|fuel/.test(m)) return "Travel";
  if (/amazon|flipkart|myntra|nykaa|ajio|mall|shop/.test(m)) return "Shopping";
  if (/electricity|bill|emi|recharge|airtel|jio|broadband|rent/.test(m)) return "Bills";
  if (/netflix|spotify|hotstar|prime|youtube|subscription/.test(m)) return "Entertainment";
  if (/zerodha|groww|sip|mutual|lic|insurance/.test(m)) return "Investment";
  if (/apollo|hospital|pharmacy|medplus|doctor/.test(m)) return "Healthcare";
  return "Other";
}

export default function Home() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [activeNav, setActiveNav] = useState("Overview");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isDragging, setIsDragging] = useState(false);

  // AI Insight state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].toLowerCase();
    const hasHeader = headers.includes("date") || headers.includes("merchant") || headers.includes("amount");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const parsed = dataLines
      .filter(l => l.trim())
      .map((line) => {
        const cols = line.split(",");
        return {
          date: cols[0]?.trim() ?? "",
          merchant: cols[1]?.trim() ?? "Unknown",
          amount: Math.abs(parseFloat((cols[2]?.trim() ?? "0").replace(/[₹,\s()]/g, "")) || 0),
        };
      })
      .filter(r => r.amount > 0 || r.merchant !== "Unknown");
    setRows(parsed);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseCSV(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (event) => parseCSV(event.target?.result as string);
    reader.readAsText(file);
  };

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);
  const alerts = useMemo(() => rows.filter((r) => r.amount > 1000), [rows]);

  const filteredRows = useMemo(() => {
    if (activeFilter === "Alerts") return rows.filter((r) => r.amount > 1000);
    if (activeFilter === "Large") return rows.filter((r) => r.amount > 500);
    return rows;
  }, [rows, activeFilter]);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  // Category totals for Analytics
  const catTotals = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach(r => {
      const cat = categorise(r.merchant);
      m[cat] = (m[cat] || 0) + r.amount;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  // AI Insight call
  const runAI = async (prompt: string) => {
    setAiPrompt(prompt);
    setAiResult("");
    setAiLoading(true);

    const context = rows.length > 0
      ? `Here are the user's transactions (merchant, amount):\n${rows.slice(0, 60).map(r => `${r.merchant}: ₹${r.amount}`).join("\n")}\n\nTotal spend: ₹${formatAmount(total)}. Number of transactions: ${rows.length}.`
      : "The user has not uploaded any transactions yet.";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a smart financial advisor AI inside a finance dashboard. Be concise, friendly, and actionable. Use bullet points. Keep replies under 120 words.",
          messages: [
            { role: "user", content: `${context}\n\nUser question: ${prompt}` }
          ],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text ?? "No response received.";
      setAiResult(text);
    } catch {
      setAiResult("Unable to connect to AI. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const initials = profileName
    ? profileName.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <main className="finance-bg min-h-screen text-white">

      {/* ── NAV ── */}
      <nav className="nav-glass sticky top-0 z-50 flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="logo-mark">₹</div>
          <span className="text-[17px] font-medium tracking-[-0.3px]">Finance AI</span>
        </div>

        <div className="nav-pills-wrap">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`nav-pill ${activeNav === item ? "active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Avatar with dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-semibold transition-all"
            style={{
              background: initials ? "linear-gradient(135deg,#4f6ef7,#8b5cf6)" : "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.12)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {initials ?? <i className="ti ti-user text-[15px] text-white/40" />}
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 260, background: "#0d1117",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 200,
            }}>
              {/* Header */}
              <div style={{ padding: "16px 16px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 10,
                  background: initials ? "linear-gradient(135deg,#4f6ef7,#8b5cf6)" : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 600, color: "#fff",
                }}>
                  {initials ?? <i className="ti ti-user" style={{ color: "rgba(255,255,255,0.3)" }} />}
                </div>
                {profileSaved ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{profileName}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{profileEmail || "No email"}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No profile set up</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>Fill in your details below</div>
                  </>
                )}
              </div>

              {/* Edit fields */}
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 6 }}>YOUR NAME</div>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 8, marginBottom: 10,
                    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 6 }}>EMAIL (OPTIONAL)</div>
                <input
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  placeholder="e.g. priya@email.com"
                  type="email"
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => { setProfileSaved(true); setProfileOpen(false); }}
                  style={{
                    marginTop: 10, width: "100%", padding: "8px",
                    background: "rgba(79,110,247,0.8)", border: "none", borderRadius: 8,
                    color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Save Profile
                </button>
              </div>

              {/* Sign out */}
              <div
                onClick={() => { setProfileSaved(false); setProfileName(""); setProfileEmail(""); setProfileOpen(false); }}
                style={{
                  padding: "11px 16px", fontSize: 13,
                  color: "rgba(244,63,94,0.75)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,63,94,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <i className="ti ti-logout" /> Sign out
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-[1280px] px-10">

        {/* ══════════════════════════════════════════
            PAGE: OVERVIEW
        ══════════════════════════════════════════ */}
        {activeNav === "Overview" && (
          <>
            <header className="py-14">
              <div className="eyebrow mb-6">
                <span className="eyebrow-dot" />
                AI-Powered · Live
              </div>
              <h1
                className="font-serif text-[58px] font-normal leading-[1.08] tracking-[-2px]"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your finances,{" "}
                <em className="text-gradient" style={{ fontStyle: "italic" }}>intelligently</em>{" "}
                simplified.
              </h1>
              <p className="mt-5 text-[18px] text-white/40">
                Upload a bank statement and let AI handle the heavy lifting.
              </p>
            </header>

            {/* ── KPI CARDS — fixed spacing ── */}
            <section className="grid grid-cols-3 gap-5 mb-6">
              <div className="metric-card metric-card-blue" style={{ padding: "26px 28px" }}>
                <div className="metric-icon metric-icon-blue" style={{ marginBottom: 18 }}>₹</div>
                <p className="text-[11px] text-white/35 mb-3 tracking-wide uppercase">Total Spending</p>
                <p className="text-[36px] font-semibold tracking-[-1.5px] leading-none">
                  ₹{rows.length > 0 ? formatAmount(total) : "0"}
                </p>
                <div style={{ marginTop: 14, minHeight: 22 }}>
                  {rows.length > 0 && <span className="badge badge-warn">↑ from last month</span>}
                </div>
              </div>

              <div className="metric-card metric-card-purple" style={{ padding: "26px 28px" }}>
                <div className="metric-icon metric-icon-purple" style={{ marginBottom: 18 }}>
                  <i className="ti ti-arrows-left-right" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-white/35 mb-3 tracking-wide uppercase">Transactions</p>
                <p className="text-[36px] font-semibold tracking-[-1.5px] leading-none">
                  {rows.length}
                </p>
                <div style={{ marginTop: 14, minHeight: 22 }}>
                  {rows.length > 0 && <span className="badge badge-ok">✓ Loaded</span>}
                </div>
              </div>

              <div className="metric-card metric-card-green" style={{ padding: "26px 28px" }}>
                <div className="metric-icon metric-icon-green" style={{ marginBottom: 18 }}>
                  <i className="ti ti-bell" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-white/35 mb-3 tracking-wide uppercase">High-value Alerts</p>
                <p className="text-[36px] font-semibold tracking-[-1.5px] leading-none">
                  {alerts.length}
                </p>
                <div style={{ marginTop: 14, minHeight: 22 }}>
                  {alerts.length > 0
                    ? <span className="badge badge-alert">⚠ Needs review</span>
                    : rows.length > 0 && <span className="badge badge-ok">✓ All clear</span>}
                </div>
              </div>
            </section>

            {/* ── MAIN TWO-COL GRID ── */}
            <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 340px" }}>

              {/* LEFT */}
              <div className="flex flex-col gap-5">
                {/* Upload */}
                <div>
                  <p className="section-label mb-3">Upload Statement</p>
                  <label>
                    <div
                      className={`upload-zone text-center ${isDragging ? "border-[rgba(79,110,247,0.7)] bg-[rgba(79,110,247,0.1)]" : ""}`}
                      style={{ padding: "36px 28px" }}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <div className="upload-icon-wrap mb-4">
                        <i className="ti ti-cloud-upload text-[#7b9bff] text-[22px]" aria-hidden="true" />
                      </div>
                      <p className="text-[15px] font-medium text-white/80 mb-2">Drop your CSV file here</p>
                      <p className="text-[13px] text-white/30 mb-5">Supports HDFC · ICICI · SBI · Axis bank formats</p>
                      <span className="inline-block px-5 py-2 rounded-xl bg-[rgba(79,110,247,0.15)] border border-[rgba(79,110,247,0.35)] text-[13px] font-medium text-[#7b9bff] hover:bg-[rgba(79,110,247,0.25)] transition-all cursor-pointer">
                        Browse files
                      </span>
                      <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
                    </div>
                  </label>
                </div>

                {/* Transactions list */}
                {rows.length > 0 && (
                  <div className="glass-card">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
                      <span className="text-[15px] font-medium text-white/90">Recent Transactions</span>
                      <div className="flex gap-2">
                        {FILTER_ITEMS.map((f) => (
                          <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`filter-pill ${activeFilter === f ? "active" : ""}`}
                          >{f}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ maxHeight: 420, overflowY: "auto" }}>
                      {filteredRows.map((row, i) => (
                        <div key={i} className="tx-row">
                          <div className="flex items-center gap-4">
                            <div className={`tx-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {row.merchant?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-white/85">{row.merchant}</p>
                              <p className="text-[12px] text-white/30 mt-0.5">{row.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[15px] font-medium text-white/90 tabular-nums">₹{formatAmount(row.amount)}</p>
                            <span className={`badge mt-1 ${row.amount > 1000 ? "badge-alert" : "badge-ok"}`}>
                              {row.amount > 1000 ? "⚠ High value" : "✓ Normal"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredRows.length === 0 && (
                        <div className="py-10 text-center text-white/30 text-[14px]">
                          No transactions match this filter.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {rows.length === 0 && (
                  <div className="glass-card" style={{ padding: "40px 28px", textAlign: "center" }}>
                    <div className="text-[32px] mb-4">📊</div>
                    <p className="text-[16px] font-medium text-white/50 mb-2">No data yet</p>
                    <p className="text-[13px] text-white/25">Upload a CSV statement above to see your transactions</p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="flex flex-col gap-5">

                {/* Spending Breakdown */}
                <div className="glass-card" style={{ padding: "22px 24px" }}>
                  <p className="section-label mb-5">Spending Breakdown</p>
                  <div className="flex items-center gap-5">
                    <svg width="76" height="76" viewBox="0 0 88 88" aria-hidden="true">
                      <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <circle cx="44" cy="44" r="34" fill="none" stroke="#4f6ef7" strokeWidth="12" strokeDasharray="107 107" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 44 44)" />
                      <circle cx="44" cy="44" r="34" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeDasharray="64 150" strokeDashoffset="-107" strokeLinecap="round" transform="rotate(-90 44 44)" />
                      <circle cx="44" cy="44" r="34" fill="none" stroke="#34d399" strokeWidth="12" strokeDasharray="43 171" strokeDashoffset="-171" strokeLinecap="round" transform="rotate(-90 44 44)" />
                    </svg>
                    <div className="flex-1">
                      {[
                        { color: "#4f6ef7", label: "Shopping", val: "₹41k" },
                        { color: "#8b5cf6", label: "Food", val: "₹26k" },
                        { color: "#34d399", label: "Travel", val: "₹17k" },
                      ].map(({ color, label, val }) => (
                        <div key={label} className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[12px] text-white/45 flex-1">{label}</span>
                          <span className="text-[12px] font-medium text-white/80">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weekly Trend */}
                <div className="glass-card" style={{ padding: "22px 24px" }}>
                  <p className="section-label mb-5">Weekly Trend</p>
                  <div className="flex items-end gap-2" style={{ height: "80px" }}>
                    {[
                      { day: "Mon", h: 42 }, { day: "Tue", h: 67 }, { day: "Wed", h: 35 },
                      { day: "Thu", h: 90, highlight: true }, { day: "Fri", h: 55 },
                      { day: "Sat", h: 28 }, { day: "Sun", h: 48 },
                    ].map(({ day, h, highlight }) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-[5px] rounded-b-[3px] transition-all hover:opacity-80"
                          style={{
                            height: `${h}px`,
                            background: highlight ? "rgba(79,110,247,0.55)" : "rgba(79,110,247,0.2)",
                            border: `0.5px solid ${highlight ? "rgba(79,110,247,0.7)" : "rgba(79,110,247,0.3)"}`,
                          }}
                        />
                        <span className="text-[10px] text-white/25">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights — WORKING */}
                <div className="glass-card" style={{ padding: "22px 24px" }}>
                  <p className="section-label mb-4">AI Insights</p>

                  {AI_PROMPTS.map((prompt) => (
                    <div
                      key={prompt}
                      className="ai-chip"
                      style={{ marginBottom: 10 }}
                      onClick={() => runAI(prompt)}
                    >
                      <span className="text-[#7b9bff] text-[14px] flex-shrink-0">✦</span>
                      <span className="text-[13px] text-white/55">{prompt}</span>
                    </div>
                  ))}

                  {/* Result box */}
                  {(aiLoading || aiResult) && (
                    <div style={{
                      marginTop: 14,
                      background: "rgba(79,110,247,0.07)",
                      border: "0.5px solid rgba(79,110,247,0.2)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}>
                      {aiLoading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: "50%",
                            border: "2px solid rgba(79,110,247,0.3)",
                            borderTopColor: "#7b9bff",
                            animation: "spin 0.7s linear infinite",
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                            Analysing your transactions…
                          </span>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 10, color: "rgba(79,110,247,0.8)", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                            ✦ {aiPrompt}
                          </p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                            {aiResult}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                {rows.length > 0 && (
                  <div className="glass-card" style={{ padding: "22px 24px" }}>
                    <p className="section-label mb-4">Quick Stats</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/40">Avg. transaction</span>
                        <span className="text-[13px] font-medium text-white/85 tabular-nums">₹{formatAmount(total / rows.length)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/40">Largest transaction</span>
                        <span className="text-[13px] font-medium text-white/85 tabular-nums">₹{formatAmount(Math.max(...rows.map(r => r.amount)))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white/40">Alert rate</span>
                        <span className="text-[13px] font-medium text-[#fb7185] tabular-nums">{Math.round((alerts.length / rows.length) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            PAGE: TRANSACTIONS
        ══════════════════════════════════════════ */}
        {activeNav === "Transactions" && (
          <div style={{ paddingTop: 40 }}>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, fontWeight: 400, letterSpacing: -1, marginBottom: 6 }}>
              All Transactions
            </h2>
            <p className="text-white/35 text-[14px] mb-8">Your full transaction history</p>

            {rows.length === 0 ? (
              <div className="glass-card" style={{ padding: "60px 28px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>📂</div>
                <p className="text-[16px] font-medium text-white/50 mb-2">No transactions loaded</p>
                <p className="text-[13px] text-white/25">Go to Overview and upload a CSV file first</p>
              </div>
            ) : (
              <div className="glass-card">
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
                  <span className="text-[15px] font-medium text-white/90">{rows.length} transactions</span>
                  <div className="flex gap-2">
                    {FILTER_ITEMS.map(f => (
                      <button key={f} onClick={() => setActiveFilter(f)} className={`filter-pill ${activeFilter === f ? "active" : ""}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                  {filteredRows.map((row, i) => (
                    <div key={i} className="tx-row">
                      <div className="flex items-center gap-4">
                        <div className={`tx-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {row.merchant?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-white/85">{row.merchant}</p>
                          <p className="text-[12px] text-white/30 mt-0.5">{row.date} · <span style={{ color: "#7b9bff", fontSize: 11 }}>{categorise(row.merchant)}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-medium text-white/90 tabular-nums">₹{formatAmount(row.amount)}</p>
                        <span className={`badge mt-1 ${row.amount > 1000 ? "badge-alert" : "badge-ok"}`}>
                          {row.amount > 1000 ? "⚠ High value" : "✓ Normal"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            PAGE: ANALYTICS
        ══════════════════════════════════════════ */}
        {activeNav === "Analytics" && (
          <div style={{ paddingTop: 40 }}>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, fontWeight: 400, letterSpacing: -1, marginBottom: 6 }}>
              Analytics
            </h2>
            <p className="text-white/35 text-[14px] mb-8">AI-powered breakdown of your spending</p>

            {rows.length === 0 ? (
              <div className="glass-card" style={{ padding: "60px 28px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
                <p className="text-[16px] font-medium text-white/50 mb-2">No data to analyse</p>
                <p className="text-[13px] text-white/25">Upload a CSV on the Overview page to see analytics</p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-5 mb-6">
                  {[
                    { label: "Total Spend", value: `₹${formatAmount(total)}` },
                    { label: "Avg Transaction", value: `₹${formatAmount(total / rows.length)}` },
                    { label: "High-value", value: `${alerts.length} txns` },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-card" style={{ padding: "20px 24px" }}>
                      <p className="text-[11px] text-white/35 uppercase tracking-wide mb-2">{label}</p>
                      <p style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Category breakdown */}
                <div className="glass-card" style={{ padding: "24px 28px", marginBottom: 20 }}>
                  <p className="section-label mb-5">Spending by Category</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {catTotals.map(([cat, amt]) => {
                      const pct = Math.round((amt / total) * 100);
                      const colors: Record<string, string> = {
                        Food: "#f59e0b", Travel: "#34d399", Shopping: "#4f6ef7",
                        Bills: "#8b5cf6", Entertainment: "#ec4899",
                        Investment: "#22c55e", Healthcare: "#ef4444", Other: "#6b7280",
                      };
                      return (
                        <div key={cat}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[13px] text-white/70">{cat}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] text-white/35">{pct}%</span>
                              <span className="text-[13px] font-medium text-white/85 tabular-nums">₹{formatAmount(amt)}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
                            <div style={{ height: 5, borderRadius: 4, width: `${pct}%`, background: colors[cat] || "#6b7280" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            PAGE: REPORTS
        ══════════════════════════════════════════ */}
        {activeNav === "Reports" && (
          <div style={{ paddingTop: 40 }}>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, fontWeight: 400, letterSpacing: -1, marginBottom: 6 }}>
              Reports
            </h2>
            <p className="text-white/35 text-[14px] mb-8">Download and share your financial data</p>

            <div className="glass-card">
              {[
                { icon: "ti-file-analytics", color: "#7b9bff", bg: "rgba(79,110,247,0.15)", name: "Monthly Spending Summary", meta: "Auto-generated · PDF" },
                { icon: "ti-chart-pie", color: "#c4b5fd", bg: "rgba(139,92,246,0.15)", name: "Category Analysis Report", meta: "Breakdown by category · PDF" },
                { icon: "ti-alert-triangle", color: "#fb7185", bg: "rgba(244,63,94,0.12)", name: "Anomaly & Fraud Alert Report", meta: `${alerts.length} alerts flagged` },
                { icon: "ti-download", color: "#6ee7b7", bg: "rgba(52,211,153,0.1)", name: "Export Transactions (CSV)", meta: `${rows.length} transactions ready` },
              ].map(({ icon, color, bg, name, meta }) => (
                <div
                  key={name}
                  className="flex items-center gap-5 border-b border-white/[0.05] transition-all cursor-pointer hover:bg-white/[0.02]"
                  style={{ padding: "20px 28px" }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, color }}>
                    <i className={`ti ${icon}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-white/85">{name}</p>
                    <p className="text-[12px] text-white/30 mt-1">{meta}</p>
                  </div>
                  <span className="badge badge-ok">Ready</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}