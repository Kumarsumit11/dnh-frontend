import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { uploadDocument } from "../../api/document";
import { getMyDocuments } from "../../api/document";
import { getCompanyDashboard } from "../../api/dashboard";
import { getCompanyProfile } from "../../api/profile";
import {
  LayoutDashboard, TrendingUp, Users, FileText, ShieldCheck,
  Bell, User, Settings, ChevronRight, ArrowUpRight, ArrowDownRight,
  Briefcase, DollarSign, Activity, Eye, Download, Search,
  MoreHorizontal, Upload, CheckCircle, Clock, AlertCircle,
  Target, Shield, X, Lock, Zap, Mail, Sparkles, Sun, Moon,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const DARK = {
  teal:        "#00c9a7",
  tealDim:     "rgba(0,201,167,0.1)",
  tealBorder:  "rgba(0,201,167,0.16)",
  tealGlow:    "rgba(0,201,167,0.06)",
  blue:        "#38bdf8",
  blueDim:     "rgba(56,189,248,0.1)",
  indigo:      "#818cf8",
  bg:          "#060d18",
  surface:     "#0b1525",
  surfaceUp:   "#0f1d30",
  surfaceHigh: "#152235",
  border:      "rgba(255,255,255,0.06)",
  textPrimary: "#e2eaf5",
  textMuted:   "#4d6480",
  textDim:     "#2d4460",
};

const LIGHT = {
  teal:        "#00937a",
  tealDim:     "rgba(0,147,122,0.08)",
  tealBorder:  "rgba(0,147,122,0.22)",
  tealGlow:    "rgba(0,147,122,0.05)",
  blue:        "#0284c7",
  blueDim:     "rgba(2,132,199,0.08)",
  indigo:      "#6366f1",
  bg:          "#f3f5f8",
  surface:     "#ffffff",
  surfaceUp:   "#f4f6f9",
  surfaceHigh: "#e9edf3",
  border:      "rgba(15,23,42,0.08)",
  textPrimary: "#0f1b2d",
  textMuted:   "#5a6b82",
  textDim:     "#94a3b8",
};

type ThemeName = "dark" | "light";
type Palette = typeof DARK;

const ThemeContext = createContext<{ theme: ThemeName; colors: Palette; toggleTheme: () => void }>({
  theme: "dark",
  colors: DARK,
  toggleTheme: () => {},
});

function useTheme() {
  return useContext(ThemeContext);
}

// ─── Theme toggle button ───────────────────────────────────────────────────────
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, colors: C } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center rounded-full border transition-all duration-300 hover:scale-[1.03] active:scale-95"
      style={{
        width: compact ? 40 : 52,
        height: compact ? 22 : 28,
        padding: 2,
        borderColor: C.tealBorder,
        background: isDark ? C.surfaceUp : C.surfaceHigh,
      }}
    >
      <span
        className="absolute rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          width: compact ? 18 : 24,
          height: compact ? 18 : 24,
          left: isDark ? 2 : compact ? 20 : 26,
          background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`,
          boxShadow: `0 2px 8px rgba(0,201,167,0.35)`,
        }}
      >
        {isDark
          ? <Moon size={compact ? 10 : 13} style={{ color: C.bg }} />
          : <Sun  size={compact ? 10 : 13} style={{ color: C.bg }} />}
      </span>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser { name: string; email: string; company: string; role: string; }
interface UploadedDoc { name: string; size: string; type: string; status: "uploaded" | "processing" | "verified"; uploadedAt: string; }
interface KpiData { fundingRequired: string | null; fundingRaised: string | null; activeInvestors: number | null; verificationStatus: string | null; unreadNotifications: number | null; }
interface Proposal { id: string; investor: string; type: string; amount: string; instrument: string; status: string; submitted: string; valuation: string; ownership: string; }
interface Document { name: string; type: string; size: string; status: string; uploaded: string; views: number; }
interface Notification { id: string; type: string; message: string; time: string; read: boolean; }
interface ActivityItem { investor: string; action: string; time: string; }

const REQUIRED_DOCS = [
  { key: "pitch_deck",         label: "Pitch Deck",                 description: "Company presentation and investment thesis",    accept: ".pdf,.pptx", icon: Sparkles },
  { key: "financial_model",    label: "Financial Model",            description: "Revenue projections and financial statements",  accept: ".xlsx,.csv,.pdf", icon: TrendingUp },
  { key: "cap_table",          label: "Cap Table",                  description: "Current ownership and equity structure",        accept: ".xlsx,.pdf", icon: Users },
  { key: "incorporation",      label: "Articles of Incorporation",  description: "Company registration documents",               accept: ".pdf", icon: Shield },
  { key: "audited_financials", label: "Audited Financials",         description: "Last 2 years of audited accounts",             accept: ".pdf", icon: FileText },
];

const NAV_GROUPS = [
  { label: "Overview",    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Capital",     items: [{ id: "funding", label: "Funding", icon: TrendingUp }, { id: "proposals", label: "Investor Proposals", icon: Briefcase }, { id: "investments", label: "Investments", icon: DollarSign }] },
  { label: "Compliance",  items: [{ id: "documents", label: "Documents", icon: FileText }, { id: "verification", label: "Verification", icon: ShieldCheck }] },
  { label: "Account",     items: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "profile", label: "Profile", icon: User }, { id: "settings", label: "Settings", icon: Settings }] },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

// ─── Utility components ───────────────────────────────────────────────────────
function Panel({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <div
      className={`rounded-xl border relative overflow-hidden transition-colors duration-300 ${className}`}
      style={{
        background: C.surface,
        borderColor: glow ? C.tealBorder : C.border,
        boxShadow: glow ? `0 0 30px -8px rgba(0,201,167,0.15), inset 0 1px 0 rgba(255,255,255,0.04)` : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {glow && <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${C.teal}60 50%, transparent 100%)` }} />}
      {children}
    </div>
  );
}

function SectionHeader({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  const { colors: C } = useTheme();
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: C.textPrimary }}>{title}</h2>
        {sub && <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{sub}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider mt-0.5 transition-all hover:opacity-60 hover:gap-1.5" style={{ color: C.teal }}>
          {action} <ChevronRight size={9} />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:     { label: "Approved",     color: "#00c9a7", bg: "rgba(0,201,167,0.1)" },
    verified:     { label: "Verified",     color: "#00c9a7", bg: "rgba(0,201,167,0.1)" },
    under_review: { label: "Under Review", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
    processing:   { label: "Processing",   color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
    negotiating:  { label: "Negotiating",  color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    pending:      { label: "Pending",      color: "#64748b", bg: "rgba(100,116,139,0.1)" },
    uploaded:     { label: "Uploaded",     color: "#00c9a7", bg: "rgba(0,201,167,0.1)" },
    declined:     { label: "Declined",     color: "#f87171", bg: "rgba(248,113,113,0.08)" },
    missing:      { label: "Missing",      color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  };
  const s = map[status] || { label: status, color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest rounded-full transition-transform hover:scale-105" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function EmptyState({ message, sub, icon: Icon = Activity }: { message: string; sub?: string; icon?: React.ElementType }) {
  const { colors: C } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.surfaceUp, border: `1px solid ${C.border}` }}>
          <Icon size={18} style={{ color: C.textMuted }} />
        </div>
        <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 20px ${C.tealGlow}` }} />
      </div>
      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{message}</p>
      {sub && <p className="text-[10px] font-mono mt-1.5 max-w-xs leading-relaxed" style={{ color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

function Divider() {
  const { colors: C } = useTheme();
  return <div className="h-px my-1" style={{ background: C.border }} />;
}

function ChartTooltip({ active, payload, label }: any) {
  const { colors: C } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2.5 text-[10px] font-mono shadow-xl" style={{ background: C.surfaceHigh, borderColor: C.tealBorder }}>
      <p className="mb-1.5 font-semibold" style={{ color: C.textMuted }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || C.teal }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function DocumentOnboarding({ user, onComplete }: { user: AppUser | null; onComplete: (docs: UploadedDoc[]) => void }) {
  const { colors: C } = useTheme();
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc | null>>({});
  const [dragOver, setDragOver]         = useState<string | null>(null);
  const [step, setStep]                 = useState<"upload" | "processing">("upload");
  const fileInputRefs                   = useRef<Record<string, HTMLInputElement | null>>({});

  const total    = REQUIRED_DOCS.length;
  const done     = Object.values(uploadedDocs).filter(Boolean).length;
  const allDone  = done === total;
  const pct      = Math.round((done / total) * 100);

async function handleFile(key: string, file: File) {
  try {
    await uploadDocument(file, "OTHER");

    setUploadedDocs((prev) => ({
      ...prev,
      [key]: {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.name.split(".").pop()?.toUpperCase() || "FILE",
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
      },
    }));

    alert("Document uploaded successfully");
  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }
}

  function handleSubmit() {
    setStep("processing");
    setTimeout(() => { onComplete(Object.values(uploadedDocs).filter(Boolean) as UploadedDoc[]); }, 2200);
  }

  if (step === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300" style={{ background: C.bg }}>
        <div className="text-center max-w-xs">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke={C.surfaceUp} strokeWidth="3" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * 0.25}`} style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck size={24} style={{ color: C.teal }} />
            </div>
          </div>
          <h2 className="text-base font-semibold mb-2" style={{ color: C.textPrimary }}>Activating your dashboard</h2>
          <p className="text-[11px] font-mono leading-relaxed" style={{ color: C.textMuted }}>Securely uploading and verifying your documents. This takes just a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex transition-colors duration-300" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-r px-8 py-10 transition-colors duration-300" style={{ background: C.surface, borderColor: C.border }}>
        {/* Logo + toggle */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.surfaceUp }}>
  <img src="/logo.jpeg" alt="DNH Capital" className="w-full h-full object-cover" />
</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: C.textPrimary }}>DNH Capital</div>
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Investment Platform</div>
            </div>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Headline */}
        <div className="mb-10">
          <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: C.teal }}>Getting started</div>
          <h1 className="text-2xl font-semibold leading-snug mb-3" style={{ color: C.textPrimary }}>
            Set up your<br />
            <span style={{ color: C.teal }}>Company Profile</span>
          </h1>
          <p className="text-[11px] leading-relaxed" style={{ color: C.textMuted }}>
            Upload your core documents once. DNH Capital extracts verified financial data and makes it available to qualified investors in a secure, controlled environment.
          </p>
        </div>

        {/* Circular progress */}
        <div className="flex items-center gap-5 p-4 rounded-xl border mb-8 transition-colors duration-300" style={{ borderColor: C.tealBorder, background: C.tealGlow }}>
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke={C.surfaceUp} strokeWidth="3" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - done / total)}`}
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono" style={{ color: C.teal }}>{pct}%</div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{done} of {total} uploaded</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{total - done} document{total - done !== 1 ? "s" : ""} remaining</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-4 flex-1">
          {[
            { icon: ShieldCheck, label: "Institutional-grade verification", sub: "All documents reviewed by our compliance team" },
            { icon: Zap,         label: "Automatic data extraction",        sub: "KPIs and financials pulled directly from your files" },
            { icon: Lock,        label: "Bank-grade data room",             sub: "You control exactly which investors see what" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.surfaceUp }}>
                <Icon size={12} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: C.textPrimary }}>{label}</p>
                <p className="text-[10px] font-mono leading-relaxed mt-0.5" style={{ color: C.textMuted }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[9px] font-mono mt-8" style={{ color: C.textDim }}>© 2025 DNH Capital · Strictly Private & Confidential</p>
      </div>

      {/* Right: upload area */}
      <div className="flex-1 overflow-y-auto px-8 py-10 lg:px-14">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-1 lg:hidden">
            {user?.name && (
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Welcome back, {user.name}</p>
            )}
            <ThemeToggle compact />
          </div>
          {user?.name && (
            <p className="hidden lg:block text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Welcome back, {user.name}</p>
          )}
          <h2 className="text-xl font-semibold mb-1" style={{ color: C.textPrimary }}>Upload required documents</h2>
          <p className="text-[11px] leading-relaxed mb-8" style={{ color: C.textMuted }}>
            These documents are required to verify your company and activate your investor dashboard. All files are encrypted in transit and at rest.
          </p>

          <div className="space-y-3 mb-8">
            {REQUIRED_DOCS.map((doc, idx) => {
              const uploaded = uploadedDocs[doc.key];
              const isOver   = dragOver === doc.key;
              return (
                <div
                  key={doc.key}
                  className="rounded-xl border transition-all duration-200 hover:shadow-md"
                  style={{
                    borderColor: uploaded ? C.tealBorder : isOver ? C.tealBorder : C.border,
                    background:  uploaded ? C.tealGlow    : isOver ? "rgba(0,201,167,0.05)" : C.surface,
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(doc.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) handleFile(doc.key, f); }}
                >
                  {uploaded ? (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.tealDim }}>
                        <CheckCircle size={14} style={{ color: C.teal }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate" style={{ color: C.textPrimary }}>{uploaded.name}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{doc.label} · {uploaded.size} · {uploaded.type}</p>
                      </div>
                      <StatusBadge status="uploaded" />
                      <button onClick={() => setUploadedDocs((p) => ({ ...p, [doc.key]: null }))} className="ml-1 transition-all hover:opacity-60 hover:rotate-90" style={{ color: C.textMuted }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold font-mono" style={{ background: C.surfaceHigh, color: C.textMuted }}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold" style={{ color: C.textPrimary }}>{doc.label}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{doc.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOver
                          ? <span className="text-[10px] font-mono" style={{ color: C.teal }}>Drop here</span>
                          : <span className="text-[10px] font-mono hidden sm:block" style={{ color: C.textMuted }}>Drag & drop or</span>
                        }
                        <button
                          onClick={() => fileInputRefs.current[doc.key]?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all hover:opacity-80 hover:scale-[1.03] active:scale-95"
                          style={{ borderColor: C.tealBorder, color: C.teal, background: C.tealDim }}
                        >
                          <Upload size={10} /> Browse
                        </button>
                        <input ref={(el) => { fileInputRefs.current[doc.key] = el; }} type="file" accept={doc.accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(doc.key, f); }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: C.border }}>
            <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>
              {allDone ? "All documents ready · Proceed to activate your dashboard" : `${total - done} document${total - done !== 1 ? "s" : ""} still required`}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!allDone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{
                background: allDone ? `linear-gradient(135deg, ${C.teal}, ${C.blue})` : C.surfaceHigh,
                color: allDone ? C.bg : C.textMuted,
                cursor: allDone ? "pointer" : "not-allowed",
                boxShadow: allDone ? `0 4px 20px rgba(0,201,167,0.25)` : "none",
              }}
            >
              Activate Dashboard <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, kpi }: { active: string; setActive: (s: string) => void; user: AppUser | null; kpi: KpiData }) {
  const { colors: C } = useTheme();
  const unread = kpi.unreadNotifications ?? 0;
  return (
    <aside className="flex flex-col h-full w-[240px] shrink-0 transition-colors duration-300" style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.surfaceUp, boxShadow: `0 4px 12px rgba(0,201,167,0.3)` }}>
  <img src="/logo.jpeg" alt="DNH Capital" className="w-full h-full object-cover" />
</div>
        <div>
          <div className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>DNH Capital</div>
          <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Company Portal</div>
        </div>
      </div>

      {/* Entity card */}
      <div className="mx-3 mb-4 p-3 rounded-xl border transition-colors duration-300" style={{ background: C.surfaceUp, borderColor: C.border }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${C.teal}33, ${C.blue}33)`, color: C.teal }}>
            {user?.company?.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate" style={{ color: C.textPrimary }}>{user?.company || "—"}</p>
            <p className="text-[9px] font-mono" style={{ color: C.textMuted }}>Series A · Round Open</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.teal }} />
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: C.teal }}>Verified Entity</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textDim }}>{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive  = active === item.id;
                const hasBadge  = item.id === "notifications" && unread > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 hover:translate-x-0.5"
                    style={{
                      background: isActive ? C.tealDim : "transparent",
                      boxShadow: isActive ? `inset 0 0 0 1px ${C.tealBorder}` : "none",
                    }}
                  >
                    <item.icon size={13} style={{ color: isActive ? C.teal : C.textMuted }} className="shrink-0" />
                    <span className="text-[11px] font-medium flex-1" style={{ color: isActive ? C.teal : C.textMuted }}>{item.label}</span>
                    {hasBadge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: C.teal, color: C.bg }}>{unread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="mx-3 mb-3 flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors duration-300" style={{ background: C.surfaceUp, borderColor: C.border }}>
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Theme</span>
        <ThemeToggle compact />
      </div>

      {/* Funding bar */}
      <div className="mx-3 mb-3 p-3 rounded-xl border transition-colors duration-300" style={{ background: C.surfaceUp, borderColor: C.border }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Funding Round</span>
          <span className="text-[9px] font-mono font-semibold" style={{ color: C.teal }}>—%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: C.surfaceHigh }}>
          <div className="h-1 rounded-full w-0 transition-all duration-500" style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.blue})` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-mono" style={{ color: C.teal }}>{kpi.fundingRaised || "—"}</span>
          <span className="text-[9px] font-mono" style={{ color: C.textMuted }}>{kpi.fundingRequired || "—"}</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ section, user }: { section: string; user: AppUser | null }) {
  const { colors: C } = useTheme();
  const label = ALL_NAV.find((n) => n.id === section)?.label || "Dashboard";
  return (
    <header className="flex items-center justify-between px-6 py-3.5 shrink-0 transition-colors duration-300" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Company</span>
        <ChevronRight size={10} style={{ color: C.textDim }} />
        <span className="text-[10px] font-semibold" style={{ color: C.teal }}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
          <input
            placeholder="Search..."
            className="pl-8 pr-4 py-2 text-[11px] font-mono rounded-lg border bg-transparent focus:outline-none focus:ring-1 w-44 placeholder:text-current transition-all"
            style={{ borderColor: C.border, color: C.textPrimary, background: C.surfaceUp }}
          />
        </div>
        <div className="w-px h-5" style={{ background: C.border }} />
        <ThemeToggle compact />
        <div className="w-px h-5" style={{ background: C.border }} />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: C.bg }}>
            {user?.name?.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div>
            <p className="text-[11px] font-semibold leading-tight" style={{ color: C.textPrimary }}>{user?.name || "—"}</p>
            <p className="text-[9px] font-mono" style={{ color: C.textMuted }}>{user?.role || "—"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, deltaUp, icon: Icon, accent }: {
  label: string; value: string | null; sub?: string; deltaUp?: boolean; icon: React.ElementType; accent?: boolean;
}) {
  const { colors: C } = useTheme();
  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-xl border relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
      style={{
        background:  accent ? `linear-gradient(135deg, ${C.surfaceUp}, ${C.surface})` : C.surface,
        borderColor: accent ? C.tealBorder : C.border,
        boxShadow:   accent ? `0 0 24px -6px rgba(0,201,167,0.2), inset 0 1px 0 rgba(255,255,255,0.04)` : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {accent && <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.teal}80, transparent)` }} />}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style={{ background: accent ? C.tealDim : C.surfaceUp }}>
          <Icon size={12} style={{ color: accent ? C.teal : C.textMuted }} />
        </div>
      </div>
      <div>
        <div className="text-[22px] font-bold tracking-tight font-mono leading-none" style={{ color: value ? (accent ? C.teal : C.textPrimary) : C.textDim }}>
          {value || "—"}
        </div>
        {sub && <p className="text-[10px] font-mono mt-1.5" style={{ color: C.textMuted }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Table shell ──────────────────────────────────────────────────────────────
function TableHead({ cols }: { cols: string[] }) {
  const { colors: C } = useTheme();
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
        {cols.map((h) => (
          <th key={h} className="text-left py-2.5 px-4 text-[9px] font-mono uppercase tracking-widest font-normal whitespace-nowrap" style={{ color: C.textMuted }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Dashboard section ────────────────────────────────────────────────────────
function DashboardSection({ kpi, proposals, fundingChart, engagementChart, notifications, activityFeed }: {
  kpi: KpiData; proposals: Proposal[]; fundingChart: any[]; engagementChart: any[]; notifications: Notification[]; activityFeed: ActivityItem[];
}) {
  const { colors: C } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Executive Summary</p>
        <h1 className="text-lg font-semibold" style={{ color: C.textPrimary }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Funding Required"    value={kpi.fundingRequired}     sub="Series A target"    icon={Target}     accent />
        <KpiCard label="Funding Raised"      value={kpi.fundingRaised}       sub="To date"            icon={TrendingUp} />
        <KpiCard label="Active Investors"    value={kpi.activeInvestors !== null ? String(kpi.activeInvestors) : null} sub="In pipeline" icon={Users} />
        <KpiCard label="Verification"        value={kpi.verificationStatus}  sub="Document completion" icon={ShieldCheck} />
        <KpiCard label="Notifications"       value={kpi.unreadNotifications !== null ? String(kpi.unreadNotifications) : null} sub="Unread" icon={Bell} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <Panel className="col-span-2 p-5">
          <SectionHeader title="Funding Progress" sub="Monthly capital raised vs. round target" />
          {fundingChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={fundingChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.teal} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="raised" stroke={C.teal} strokeWidth={2} fill="url(#g1)" name="Raised" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No funding data yet" sub="Connect your API to populate this chart" icon={TrendingUp} />
          )}
        </Panel>

        <Panel className="p-5">
          <SectionHeader title="Investor Engagement" sub="Weekly views & submissions" />
          {engagementChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={engagementChart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="views"     name="Views"     fill={`${C.teal}30`} radius={[3, 3, 0, 0]} />
                <Bar dataKey="proposals" name="Proposals" fill={C.teal}        radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No engagement data" sub="Awaiting API" icon={Activity} />
          )}
        </Panel>
      </div>

      {/* Proposals table */}
      <Panel className="overflow-hidden">
        <div className="p-5 pb-0">
          <SectionHeader title="Recent Investor Proposals" sub="Latest investment proposals received" action="View All" />
        </div>
        {proposals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHead cols={["Ref ID", "Investor", "Type", "Amount", "Instrument", "Status", "Submitted", ""]} />
              <tbody>
                {proposals.slice(0, 5).map((p, i) => (
                  <tr
                    key={p.id}
                    className="transition-colors"
                    style={{ borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceUp)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="py-3 px-4"><span className="text-[10px] font-mono font-semibold" style={{ color: C.teal }}>{p.id}</span></td>
                    <td className="py-3 px-4"><span className="text-[11px] font-semibold" style={{ color: C.textPrimary }}>{p.investor}</span></td>
                    <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.type}</span></td>
                    <td className="py-3 px-4"><span className="text-[11px] font-mono font-semibold" style={{ color: C.textPrimary }}>{p.amount}</span></td>
                    <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.instrument}</span></td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.submitted}</span></td>
                    <td className="py-3 px-4"><button style={{ color: C.textMuted }}><MoreHorizontal size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pb-2"><EmptyState message="No proposals received yet" sub="Investor proposals will appear here once submitted" icon={Briefcase} /></div>
        )}
      </Panel>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        <Panel className="p-5">
          <SectionHeader title="Notifications" sub="Recent platform alerts" action="View All" />
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="flex gap-3 p-3 rounded-xl border transition-all hover:translate-x-0.5" style={{ borderColor: n.read ? C.border : C.tealBorder, background: n.read ? "transparent" : C.tealGlow }}>
                  <div className="mt-0.5 shrink-0">
                    {n.type === "proposal"     && <Briefcase  size={12} style={{ color: C.teal   }} />}
                    {n.type === "verification" && <ShieldCheck size={12} style={{ color: C.blue   }} />}
                    {n.type === "activity"     && <Activity    size={12} style={{ color: C.indigo }} />}
                    {n.type === "system"       && <Zap         size={12} style={{ color: C.textMuted }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: C.textPrimary }}>{n.message}</p>
                    <p className="text-[9px] font-mono mt-0.5" style={{ color: C.textMuted }}>{n.time}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: C.teal }} />}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No notifications" sub="You're all caught up" icon={Bell} />
          )}
        </Panel>

        <Panel className="p-5">
          <SectionHeader title="Investor Activity" sub="Real-time data room events" />
          {activityFeed.length > 0 ? (
            <div className="space-y-0.5">
              {activityFeed.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0 transition-colors hover:bg-black/5" style={{ borderColor: C.border }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.surfaceUp }}>
                    <Eye size={11} style={{ color: C.teal }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: C.textPrimary }}>{a.investor}</p>
                    <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>{a.action}</p>
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: C.textMuted }}>{a.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No recent activity" sub="Investor interactions will show here" icon={Activity} />
          )}
        </Panel>
      </div>
    </div>
  );
}

// ─── Funding section ──────────────────────────────────────────────────────────
function FundingSection({ kpi, fundingChart }: { kpi: KpiData; fundingChart: any[] }) {
  const { colors: C } = useTheme();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Funding Target"   value={kpi.fundingRequired} sub="Series A"      icon={Target}     accent />
        <KpiCard label="Capital Raised"   value={kpi.fundingRaised}   sub="To date"        icon={TrendingUp} />
        <KpiCard label="Active Investors" value={kpi.activeInvestors !== null ? String(kpi.activeInvestors) : null} sub="In pipeline" icon={Users} />
        <KpiCard label="Round Status"     value="Open"                sub="Accepting now"  icon={Activity}   />
      </div>
      <Panel className="p-5">
        <SectionHeader title="Funding Timeline" sub="Monthly capital raised — from API" />
        {fundingChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={fundingChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="raised" stroke={C.teal} strokeWidth={2} fill="url(#g2)" name="Raised" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="No funding data available" sub="Connect your API to populate funding timeline" icon={TrendingUp} />
        )}
      </Panel>
      <Panel className="p-5">
        <SectionHeader title="Round History" sub="All capital rounds — from API" />
        <EmptyState message="No rounds configured" sub="API will populate round history here" icon={DollarSign} />
      </Panel>
    </div>
  );
}

// ─── Proposals section ────────────────────────────────────────────────────────
function ProposalsSection({ proposals }: { proposals: Proposal[] }) {
  const { colors: C } = useTheme();
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? proposals : proposals.filter((p) => p.status === filter);
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-0">
        <SectionHeader title="Investor Proposals" sub="All investment proposals for this round" action="Export" />
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {["all", "approved", "under_review", "negotiating", "pending", "declined"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full border transition-all hover:scale-105"
              style={{ borderColor: filter === f ? C.teal : C.border, background: filter === f ? C.tealDim : "transparent", color: filter === f ? C.teal : C.textMuted }}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Ref ID", "Investor", "Type", "Amount", "Instrument", "Valuation", "Ownership", "Submitted", "Status", ""]} />
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceUp)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="py-3 px-4"><span className="text-[10px] font-mono font-semibold" style={{ color: C.teal }}>{p.id}</span></td>
                  <td className="py-3 px-4"><span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: C.textPrimary }}>{p.investor}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.type}</span></td>
                  <td className="py-3 px-4"><span className="text-[11px] font-mono font-semibold" style={{ color: C.textPrimary }}>{p.amount}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.instrument}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.valuation}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.ownership}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{p.submitted}</span></td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4"><button style={{ color: C.textMuted }}><MoreHorizontal size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No proposals found" sub="Proposals matching this filter will appear here" icon={Briefcase} />
      )}
    </Panel>
  );
}

// ─── Investments section ──────────────────────────────────────────────────────
function InvestmentsSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Total Committed", icon: DollarSign }, { label: "Investor Count", icon: Users }, { label: "Avg. Ticket Size", icon: Target }].map(({ label, icon }) => (
          <KpiCard key={label} label={label} value={null} sub="Awaiting API" icon={icon} />
        ))}
      </div>
      <Panel className="p-5">
        <SectionHeader title="Confirmed Investments" sub="Committed capital from verified investors" />
        <EmptyState message="No confirmed investments yet" sub="Committed investments will appear here once the API is connected" icon={DollarSign} />
      </Panel>
    </div>
  );
}

// ─── Documents section ────────────────────────────────────────────────────────
function DocumentsSection({ documents }: { documents: Document[] }) {
  const { colors: C } = useTheme();
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 pb-0">
        <SectionHeader title="Document Library" sub="All company documents in your data room" action="Upload" />
      </div>
      {documents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead cols={["Document", "Type", "Size", "Uploaded", "Views", "Status", ""]} />
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} style={{ borderBottom: i < documents.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceUp)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.surfaceUp }}>
                        <FileText size={11} style={{ color: C.textMuted }} />
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: C.textPrimary }}>{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className="text-[9px] font-mono font-semibold px-2 py-1 rounded-md" style={{ background: C.tealDim, color: C.teal }}>{doc.type}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{doc.size}</span></td>
                  <td className="py-3 px-4"><span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{doc.uploaded}</span></td>
                  <td className="py-3 px-4"><div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: C.textMuted }}><Eye size={10} />{doc.views}</div></td>
                  <td className="py-3 px-4"><StatusBadge status={doc.status} /></td>
                  <td className="py-3 px-4"><button style={{ color: C.textMuted }}><Download size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No documents in data room" sub="Upload documents to make them available for investor review" icon={FileText} />
      )}
    </Panel>
  );
}

// ─── Verification section ─────────────────────────────────────────────────────
function VerificationSection() {
  const { colors: C } = useTheme();
  const steps = [
    { label: "Identity Verification",  status: "verified",     desc: "Director and beneficial owner KYC complete" },
    { label: "Company Registration",   status: "verified",     desc: "Companies House registry confirmation received" },
    { label: "Document Review",        status: "under_review", desc: "Compliance team reviewing uploaded documents" },
    { label: "Financial Audit",        status: "pending",      desc: "Audited accounts under review by partner firm" },
    { label: "AML Screening",          status: "pending",      desc: "Anti-money laundering check in progress" },
    { label: "Platform Approval",      status: "pending",      desc: "Final sign-off by DNH Capital compliance" },
  ];
  return (
    <Panel className="p-5">
      <SectionHeader title="Verification Status" sub="KYC / KYB compliance progress" />
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:translate-x-0.5"
            style={{ borderColor: step.status === "verified" ? C.tealBorder : C.border, background: step.status === "verified" ? C.tealGlow : "transparent" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: step.status === "verified" ? C.tealDim : C.surfaceUp }}>
              {step.status === "verified"     && <CheckCircle size={15} style={{ color: C.teal }} />}
              {step.status === "under_review" && <Clock       size={15} style={{ color: C.blue }} />}
              {step.status === "pending"      && <AlertCircle size={15} style={{ color: C.textMuted }} />}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold" style={{ color: C.textPrimary }}>{step.label}</p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{step.desc}</p>
            </div>
            <StatusBadge status={step.status} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────
function NotificationsSection({ notifications }: { notifications: Notification[] }) {
  const { colors: C } = useTheme();
  return (
    <Panel className="p-5">
      <SectionHeader title="All Notifications" sub="Platform alerts and activity updates" />
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex gap-4 p-4 rounded-xl border transition-all hover:translate-x-0.5" style={{ borderColor: n.read ? C.border : C.tealBorder, background: n.read ? "transparent" : C.tealGlow }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.surfaceUp }}>
                {n.type === "proposal"     && <Briefcase  size={13} style={{ color: C.teal   }} />}
                {n.type === "verification" && <ShieldCheck size={13} style={{ color: C.blue   }} />}
                {n.type === "activity"     && <Activity    size={13} style={{ color: C.indigo }} />}
                {n.type === "system"       && <Zap         size={13} style={{ color: C.textMuted }} />}
              </div>
              <div className="flex-1">
                <p className="text-[11px] leading-relaxed" style={{ color: C.textPrimary }}>{n.message}</p>
                <p className="text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: C.teal }} />}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No notifications" sub="You're all caught up" icon={Bell} />
      )}
    </Panel>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────
function ProfileSection({ user }: { user: AppUser | null }) {
  const { colors: C } = useTheme();
  return (
    <div className="space-y-4">
      <Panel className="p-6" glow>
        <SectionHeader title="Company Profile" sub="Account credentials and company data" action="Edit" />
        <div className="flex items-center gap-5 pb-6 mb-6 border-b" style={{ borderColor: C.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: C.bg, boxShadow: `0 8px 24px rgba(0,201,167,0.25)` }}>
            {user?.company?.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: C.textPrimary }}>{user?.company || "—"}</h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>Financial Technology · Series A</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.teal }} />
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: C.teal }}>Active Round · Verified Entity</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Account Owner",  value: user?.name,  icon: User        },
            { label: "Email Address",  value: user?.email, icon: Mail        },
            { label: "Access Level",   value: user?.role,  icon: Shield      },
            { label: "Platform Status",value: "Active",    icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:translate-x-0.5" style={{ borderColor: C.border, background: C.surfaceUp }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.tealDim }}>
                <Icon size={13} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.textPrimary }}>{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: C.border, background: C.surfaceUp }}>
          <p className="text-[10px] font-mono mb-1.5 uppercase tracking-widest" style={{ color: C.textMuted }}>Additional data from API</p>
          <p className="text-[11px] leading-relaxed" style={{ color: C.textMuted }}>Fields like headquarters, website, sector, ARR, headcount, and legal registration will be populated here once your API endpoint is connected.</p>
        </div>
      </Panel>
    </div>
  );
}

// ─── Settings section ─────────────────────────────────────────────────────────
function SettingsSection() {
  const { colors: C } = useTheme();
  const groups = [
    { title: "Account Security", icon: Shield, items: ["Change Password", "Two-Factor Authentication", "Active Sessions"] },
    { title: "Notifications",    icon: Bell,   items: ["Email Notifications", "In-app Alerts", "Investor Activity Alerts"] },
    { title: "Data Room",        icon: Lock,   items: ["Investor Access Permissions", "Document Watermarking", "NDA Settings"] },
    { title: "Integrations",     icon: Zap,    items: ["API Keys", "Webhook Configuration", "CRM Integration"] },
  ];
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Panel key={group.title} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.tealDim }}>
              <group.icon size={12} style={{ color: C.teal }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>{group.title}</h3>
          </div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-all hover:translate-x-0.5"
                style={{ borderColor: C.border }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceUp)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="text-[11px] font-medium" style={{ color: C.textPrimary }}>{item}</span>
                <ChevronRight size={12} style={{ color: C.textMuted }} />
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppInner() {
  const { colors: C } = useTheme();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // TODO: replace with real API calls
  const [user]            = useState<AppUser>({ name: "", email: "", company: "", role: "" });
  const [kpi, setKpi]      = useState<KpiData>({ fundingRequired: null, fundingRaised: null, activeInvestors: null, verificationStatus: null, unreadNotifications: null });
  const [proposals, setProposals]       = useState<Proposal[]>([]);
  const [documents, setDocuments]       = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityFeed, setActivityFeed]   = useState<ActivityItem[]>([]);
  const [fundingChart, setFundingChart]   = useState<any[]>([]);
  const [engagementChart, setEngagementChart] = useState<any[]>([]);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profileData, setProfileData]     = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoadingDashboard(true);

      const dashboard = await getCompanyDashboard();

      console.log(dashboard);

      setDashboardData(dashboard);
      setProfileData(dashboard.profile);

      setKpi({
        fundingRequired: dashboard.dashboard.fundingRequired,
        fundingRaised: dashboard.dashboard.fundingRaised,
        activeInvestors: dashboard.dashboard.activeInvestors,
        verificationStatus: dashboard.dashboard.verificationStatus,
        unreadNotifications: dashboard.dashboard.unreadNotifications,
      });

      // Step 15: populate other dashboard data (if backend returns these fields)
      if (dashboard.proposals) setProposals(dashboard.proposals);
      if (dashboard.notifications) setNotifications(dashboard.notifications);
      if (dashboard.documents) setDocuments(dashboard.documents);
      if (dashboard.fundingChart) setFundingChart(dashboard.fundingChart);
      if (dashboard.engagementChart) setEngagementChart(dashboard.engagementChart);
      if (dashboard.activityFeed) setActivityFeed(dashboard.activityFeed);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => {
    checkDocuments();
  }, []);

  const checkDocuments = async () => {
    try {
      const documents = await getMyDocuments();

      setOnboardingComplete(documents.length > 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);

      // If the check fails, show onboarding rather than blocking the user.
      setOnboardingComplete(false);
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (loadingDashboard || loadingDocuments) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ background: C.bg, color: C.textMuted }}>
        Loading...
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <DocumentOnboarding
        user={user}
        onComplete={() => {
          checkDocuments();
        }}
      />
    );
  }

  function renderSection() {
    switch (activeNav) {
      case "dashboard":    return <DashboardSection kpi={kpi} proposals={proposals} fundingChart={fundingChart} engagementChart={engagementChart} notifications={notifications} activityFeed={activityFeed} />;
      case "funding":      return <FundingSection kpi={kpi} fundingChart={fundingChart} />;
      case "proposals":    return <ProposalsSection proposals={proposals} />;
      case "investments":  return <InvestmentsSection />;
      case "documents":    return <DocumentsSection documents={documents} />;
      case "verification": return <VerificationSection />;
      case "notifications":return <NotificationsSection notifications={notifications} />;
      case "profile":
        return (
          <ProfileSection
            user={{
              ...user,
              name: profileData?.companyName || user.name,
              company: profileData?.companyName || user.company,
            }}
          />
        );
      case "settings":     return <SettingsSection />;
      default:             return null;
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-300" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        active={activeNav}
        setActive={setActiveNav}
        user={{
          ...user,
          company: profileData?.companyName || user.company,
        }}
        kpi={kpi}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          section={activeNav}
          user={{
            ...user,
            name: profileData?.companyName || user.name,
            company: profileData?.companyName || user.company,
          }}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderSection()}
          <div className="flex items-center justify-between mt-8 pt-4 border-t text-[9px] font-mono" style={{ borderColor: C.border, color: C.textDim }}>
            <span>DNH Capital · Company Dashboard v2.5.0</span>
            <span>Last sync: {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC</span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.teal }} />
              All systems operational
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const colors = theme === "dark" ? DARK : LIGHT;
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      <AppInner />
    </ThemeContext.Provider>
  );
}