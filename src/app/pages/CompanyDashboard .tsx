import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { uploadDocument, getMyDocuments } from "../../api/document";
import { getCompanyDashboard } from "../../api/dashboard";
import { getCompanyProfile, updateCompanyProfile } from "../../api/profile";
import { createFundingOpportunity } from "../../api/funding";
import {
  getCompanyUpdates, createCompanyUpdate, editCompanyUpdate, deleteCompanyUpdate,
  type CompanyUpdate, type UpdateAuthorRole, type UpdateCategory,
} from "../../api/company-update";
import {
  LayoutDashboard, TrendingUp, Users, FileText, ShieldCheck,
  Bell, User, Settings, ChevronRight, ArrowUpRight,
  Briefcase, DollarSign, Activity, Eye, Download, Search,
  MoreHorizontal, Upload, CheckCircle, Clock, AlertCircle,
  Target, Shield, X, Lock, Zap, Mail, Sparkles, Sun, Moon,
  MessageSquare, Pencil, Trash2, Loader2, Send, Megaphone,
  BarChart2, Rocket, AlertTriangle, ChevronLeft, Check,
  FileSpreadsheet, RefreshCw, TrendingDown, Wallet, Landmark, PieChart, Scale,
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
  teal:        "#0d9488",
  tealDim:     "rgba(13,148,136,0.08)",
  tealBorder:  "rgba(13,148,136,0.22)",
  tealGlow:    "rgba(13,148,136,0.05)",
  blue:        "#2563eb",
  blueDim:     "rgba(37,99,235,0.08)",
  indigo:      "#7c3aed",
  bg:          "#f1f5f9",
  surface:     "#ffffff",
  surfaceUp:   "#f8fafc",
  surfaceHigh: "#e2e8f0",
  border:      "rgba(15,23,42,0.09)",
  textPrimary: "#0f172a",
  textMuted:   "#64748b",
  textDim:     "#94a3b8",
};

type ThemeName = "dark" | "light";
type Palette = typeof DARK;

const ThemeContext = createContext<{ theme: ThemeName; colors: Palette; toggleTheme: () => void }>({
  theme: "light",
  colors: LIGHT,
  toggleTheme: () => {},
});

function useTheme() {
  return useContext(ThemeContext);
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
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
          boxShadow: `0 2px 8px rgba(0,0,0,0.18)`,
        }}
      >
        {isDark
          ? <Moon size={compact ? 10 : 13} style={{ color: "#fff" }} />
          : <Sun  size={compact ? 10 : 13} style={{ color: "#fff" }} />}
      </span>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser { name: string; email: string; company: string; role: string; }
interface UploadedDoc { name: string; size: string; type: string; status: "uploaded" | "processing" | "verified"; uploadedAt: string; }
interface KpiData { fundingRequired: string | null; fundingRaised: string | null; activeInvestors: number | null; verificationStatus: string | null; unreadNotifications: number | null; }
interface Proposal { id: string; investor: string; type: string; amount: string; instrument: string; status: string; submitted: string; valuation: string; ownership: string; }
interface DocumentRow { name: string; type: string; size: string; status: string; uploaded: string; views: number; }
interface Notification { id: string; type: string; message: string; time: string; read: boolean; }
interface ActivityItem { investor: string; action: string; time: string; }

// ─── CEO / CFO Dashboard: Tally Sheet types ────────────────────────────────────
// Mirrors the "Data" sheet structure of CEO Dashboard.xlsx / CFO Dashboard.xlsx:
// each indicator has 12 months of Actual / Target / Last Year values plus a YTD total.
const FISCAL_MONTHS = ["JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

interface IndicatorSeries {
  name: string;
  actual: (number | null)[];
  target: (number | null)[];
  lastYear: (number | null)[];
  actualYTD: number | null;
  targetYTD: number | null;
  lastYearYTD: number | null;
}

interface ProductSeries {
  name: string;
  actual: (number | null)[];
  target: (number | null)[];
  actualYTD: number | null;
  targetYTD: number | null;
}

interface ParsedFinancialData {
  fileName: string;
  uploadedAt: string;
  fiscalYear: string | null;
  selectedMonthIndex: number;
  indicators: Record<string, IndicatorSeries>;
  products: ProductSeries[];
}

/** Coerces a raw cell value into a finite number, or null if it isn't one. */
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

/** Finds a value in an indicator map by trying several likely label variants. */
function pickIndicator(indicators: Record<string, IndicatorSeries>, candidates: string[]): IndicatorSeries | null {
  for (const c of candidates) {
    const hit = Object.keys(indicators).find((k) => k.trim().toLowerCase() === c.trim().toLowerCase());
    if (hit) return indicators[hit];
  }
  return null;
}

/**
 * Parses an uploaded .xlsx/.csv "Tally Sheet" (matching the structure of
 * CEO Dashboard.xlsx / CFO Dashboard.xlsx) into a ParsedFinancialData object.
 * Reads the "Data" sheet (falls back to the first sheet for a plain CSV export)
 * and, where present, the fiscal-year cell from the "Indicators" sheet.
 */
function parseFinancialWorkbook(workbook: XLSX.WorkBook, fileName: string): ParsedFinancialData {
  const dataSheetName =
    workbook.SheetNames.find((n) => n.trim().toLowerCase() === "data") || workbook.SheetNames[0];
  const sheet = workbook.Sheets[dataSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });

  // Locate the header row (contains "Indicator Name" and "Actual/Target").
  let headerRowIdx = -1;
  let nameCol = -1, typeCol = -1, calcTypeCol = -1, ytdCol = -1;
  const monthCols: number[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const idx = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase() === "indicator name");
    if (idx >= 0) {
      headerRowIdx = r;
      nameCol = idx;
      typeCol = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase().startsWith("actual/target"));
      calcTypeCol = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase() === "calculation type");
      ytdCol = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase() === "ytd");
      for (let c = 0; c < row.length; c++) {
        if (typeof row[c] === "string" && FISCAL_MONTHS.includes(row[c].trim().toUpperCase())) {
          monthCols.push(c);
        }
      }
      break;
    }
  }

  const indicators: Record<string, IndicatorSeries> = {};
  let currentName: string | null = null;

  if (headerRowIdx >= 0 && nameCol >= 0 && typeCol >= 0 && monthCols.length === 12) {
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const nameCell = row[nameCol];
      if (typeof nameCell === "string" && nameCell.trim()) currentName = nameCell.trim();
      if (!currentName) continue;

      const typeCell = row[typeCol];
      const rowType = typeof typeCell === "string" ? typeCell.trim().toLowerCase() : "";
      if (!["actual", "target", "last year"].includes(rowType)) continue;

      if (!indicators[currentName]) {
        indicators[currentName] = {
          name: currentName,
          actual: Array(12).fill(null),
          target: Array(12).fill(null),
          lastYear: Array(12).fill(null),
          actualYTD: null, targetYTD: null, lastYearYTD: null,
        };
      }
      const series = indicators[currentName];
      const monthValues = monthCols.map((c) => toFiniteNumber(row[c]));
      const ytdValue = ytdCol >= 0 ? toFiniteNumber(row[ytdCol]) : null;

      if (rowType === "actual") { series.actual = monthValues; series.actualYTD = ytdValue; }
      else if (rowType === "target") { series.target = monthValues; series.targetYTD = ytdValue; }
      else if (rowType === "last year") { series.lastYear = monthValues; series.lastYearYTD = ytdValue; }
    }
  }

  // Products: rows named "Product 1".."Product 5" (CEO sheet only).
  const products: ProductSeries[] = Object.values(indicators)
    .filter((s) => /^product\s*\d+$/i.test(s.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((s) => ({ name: s.name, actual: s.actual, target: s.target, actualYTD: s.actualYTD, targetYTD: s.targetYTD }));

  // Selected month = latest month with actual data on the primary revenue indicator.
  const revenueSeries = pickIndicator(indicators, ["Total Revenue", "Revenue"]);
  let selectedMonthIndex = 0;
  const probeSeries = revenueSeries || Object.values(indicators)[0];
  if (probeSeries) {
    for (let i = 11; i >= 0; i--) {
      if (probeSeries.actual[i] !== null) { selectedMonthIndex = i; break; }
    }
  }

  // Fiscal year label, if present on the Indicators sheet.
  let fiscalYear: string | null = null;
  const indicatorsSheet = workbook.Sheets[workbook.SheetNames.find((n) => n.trim().toLowerCase() === "indicators") || ""];
  if (indicatorsSheet) {
    const indRows: any[][] = XLSX.utils.sheet_to_json(indicatorsSheet, { header: 1, defval: null, blankrows: false });
    for (const row of indRows) {
      if (!row) continue;
      const idx = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase().startsWith("fiscal year") || (typeof c === "string" && c.trim().toLowerCase() === "current year:"));
      if (idx >= 0 && typeof row[idx + 1] === "string") { fiscalYear = row[idx + 1]; break; }
    }
  }

  return { fileName, uploadedAt: new Date().toISOString(), fiscalYear, selectedMonthIndex, indicators, products };
}

/** Target-achievement traffic light, matching the workbook's own rule (>=100% green, 90-99% amber, <90% red). */
function achievementTone(ratio: number | null): "good" | "warn" | "bad" | "flat" {
  if (ratio === null || !Number.isFinite(ratio)) return "flat";
  if (ratio >= 1) return "good";
  if (ratio >= 0.9) return "warn";
  return "bad";
}

/** Placeholder for backend persistence of a parsed CEO tally sheet. Assumes a
 *  POST /api/dashboard/ceo (or similar) endpoint will be wired up server-side. */
async function saveCEOData(data: ParsedFinancialData): Promise<void> {
  console.log("saveCEOData (placeholder) — would persist to backend:", data.fileName);
}

/** Placeholder for backend persistence of a parsed CFO tally sheet. Assumes a
 *  POST /api/dashboard/cfo (or similar) endpoint will be wired up server-side. */
async function saveCFOData(data: ParsedFinancialData): Promise<void> {
  console.log("saveCFOData (placeholder) — would persist to backend:", data.fileName);
}

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
  { label: "Leadership",  items: [
    { id: "updates", label: "CEO / CFO Updates", icon: MessageSquare },
    { id: "ceo-dashboard", label: "CEO Dashboard", icon: LayoutDashboard },
    { id: "cfo-dashboard", label: "CFO Dashboard", icon: LayoutDashboard },
  ] },
  { label: "Compliance",  items: [{ id: "documents", label: "Documents", icon: FileText }, { id: "verification", label: "Verification", icon: ShieldCheck }] },
  { label: "Account",     items: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "profile", label: "Profile", icon: User }, { id: "settings", label: "Settings", icon: Settings }] },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

const UPDATE_CATEGORIES: { value: UpdateCategory; label: string; icon: React.ElementType }[] = [
  { value: "GENERAL",   label: "General",   icon: Megaphone },
  { value: "FINANCIAL", label: "Financial", icon: BarChart2 },
  { value: "PRODUCT",   label: "Product",   icon: Rocket },
  { value: "MILESTONE", label: "Milestone", icon: Target },
  { value: "RISK",      label: "Risk",      icon: AlertTriangle },
];

// ─── Utility components ───────────────────────────────────────────────────────
function Panel({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className={`rounded-xl border relative overflow-hidden transition-colors duration-300 ${className}`}
      style={{
        background: C.surface,
        borderColor: glow ? C.tealBorder : C.border,
        boxShadow: isLight
          ? glow
            ? `0 4px 24px rgba(13,148,136,0.1), 0 1px 3px rgba(0,0,0,0.06)`
            : `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)`
          : glow
            ? `0 0 30px -8px rgba(0,201,167,0.15), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `inset 0 1px 0 rgba(255,255,255,0.03)`,
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
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
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
    approved:     { label: "Approved",     color: "#059669", bg: "rgba(5,150,105,0.1)" },
    verified:     { label: "Verified",     color: "#059669", bg: "rgba(5,150,105,0.1)" },
    under_review: { label: "Under Review", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
    processing:   { label: "Processing",   color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
    negotiating:  { label: "Negotiating",  color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
    pending:      { label: "Pending",      color: "#92400e", bg: "rgba(245,158,11,0.1)" },
    uploaded:     { label: "Uploaded",     color: "#059669", bg: "rgba(5,150,105,0.1)" },
    declined:     { label: "Declined",     color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
    missing:      { label: "Missing",      color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  };
  const s = map[status] || { label: status, color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest rounded-full transition-transform hover:scale-105" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

function RoleBadge({ role }: { role: UpdateAuthorRole }) {
  const { colors: C } = useTheme();
  const isCEO = role === "CEO";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
      style={{ color: isCEO ? C.teal : C.indigo, background: isCEO ? C.tealDim : `${C.indigo}18` }}
    >
      {role}
    </span>
  );
}

function CategoryBadge({ category }: { category: UpdateCategory }) {
  const { colors: C } = useTheme();
  const meta = UPDATE_CATEGORIES.find((c) => c.value === category) ?? UPDATE_CATEGORIES[0];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: C.surfaceUp, color: C.textMuted }}>
      <meta.icon size={9} /> {meta.label}
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
      </div>
      <p className="text-sm font-medium" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{message}</p>
      {sub && <p className="text-[10px] font-mono mt-1.5 max-w-xs leading-relaxed" style={{ color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  const { colors: C } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2.5 text-[10px] font-mono shadow-xl" style={{ background: C.surface, borderColor: C.tealBorder }}>
      <p className="mb-1.5 font-semibold" style={{ color: C.textMuted }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || C.teal }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  const { colors: C } = useTheme();
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceUp }}>
        {cols.map((h) => (
          <th key={h} className="text-left py-2.5 px-4 text-[9px] font-mono uppercase tracking-widest font-normal whitespace-nowrap" style={{ color: C.textMuted }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Information Memo: types & config ─────────────────────────────────────────
interface InformationMemo {
  borrower: string;
  promoters: string;
  coBorrowerGuarantor: string;
  aboutBorrowingEntity: string;
  registeredAddress: string;
  corporateOffice: string;
  aboutGroup: string;
  aboutPromoter: string;
  shareholdingPattern: string;
  directorsProfile: string;
  financials: Record<string, Record<string, string>>;
  repaymentHistory: string;
  expansionPlan: string;
  employeeStrength: string;
  industryOverview: string;
  topCustomers: string;
  currentBankingArrangement: string;
  proposedTransaction: string;
  proposedBankingArrangement: string;
  collateralSecurity: string;
  otherSecurity: string;
  swotAnalysis: string;
}

type MemoFieldType = "input" | "textarea";
interface MemoField { key: keyof InformationMemo; label: string; type: MemoFieldType; placeholder?: string; required?: boolean; }
interface MemoSection { id: string; title: string; sub: string; icon: React.ElementType; fields: MemoField[]; }

const FINANCIAL_ROWS: { key: string; label: string }[] = [
  { key: "netSales",         label: "Net Sales" },
  { key: "ebitda",           label: "EBITDA" },
  { key: "ebitdaMargin",     label: "EBITDA Margin" },
  { key: "std",              label: "STD" },
  { key: "ltd",              label: "LTD" },
  { key: "totalDebt",        label: "Total Debt" },
  { key: "tnw",              label: "TNW" },
  { key: "nwc",              label: "NWC" },
  { key: "totalDebtEbitda",  label: "Total Debt / EBITDA" },
  { key: "currentRatio",     label: "Current Ratio" },
];

const FINANCIAL_YEARS: { key: string; label: string; tag: string }[] = [
  { key: "fy2023", label: "FY 2023", tag: "Audited" },
  { key: "fy2024", label: "FY 2024", tag: "Audited" },
  { key: "fy2025", label: "FY 2025", tag: "Audited" },
  { key: "fy2026", label: "FY 2026", tag: "Provisional" },
];

const MEMO_SECTIONS: MemoSection[] = [
  {
    id: "entity", title: "Entity Overview", sub: "Borrower and legal identity", icon: Briefcase,
    fields: [
      { key: "borrower", label: "Borrower", type: "input", required: true, placeholder: "Legal entity name" },
      { key: "promoters", label: "Promoters", type: "input", placeholder: "Names of promoters" },
      { key: "coBorrowerGuarantor", label: "Co-borrower / Guarantor", type: "input", placeholder: "Co-borrower or guarantor, if any" },
      { key: "aboutBorrowingEntity", label: "About Borrowing Entity", type: "textarea", placeholder: "Vintage, business model, major competition, debtors and creditors cycle" },
      { key: "registeredAddress", label: "Registered Address", type: "textarea", placeholder: "Registered office address" },
      { key: "corporateOffice", label: "Corporate Office", type: "textarea", placeholder: "Corporate office address" },
    ],
  },
  {
    id: "group", title: "Group & Promoters", sub: "Ownership and leadership background", icon: Users,
    fields: [
      { key: "aboutGroup", label: "About Group", type: "textarea" },
      { key: "aboutPromoter", label: "About the Promoter", type: "textarea" },
      { key: "shareholdingPattern", label: "Shareholding Pattern & Profile", type: "textarea" },
      { key: "directorsProfile", label: "Brief Profile of the Directors", type: "textarea" },
    ],
  },
  {
    id: "financials", title: "Financials", sub: "Key financial indicators, in ₹ Crores", icon: TrendingUp,
    fields: [],
  },
  {
    id: "business", title: "Business Outlook", sub: "Growth plans and market position", icon: Rocket,
    fields: [
      { key: "expansionPlan", label: "Expansion Plan (FY 2026-27 & beyond)", type: "textarea" },
      { key: "employeeStrength", label: "Employee Strength", type: "input", placeholder: "e.g. 120 employees" },
      { key: "industryOverview", label: "Industry Overview", type: "textarea" },
      { key: "topCustomers", label: "Top Customers", type: "textarea" },
    ],
  },
  {
    id: "banking", title: "Banking & Security", sub: "Facilities and collateral", icon: ShieldCheck,
    fields: [
      { key: "currentBankingArrangement", label: "Current Banking Arrangement", type: "textarea" },
      { key: "proposedTransaction", label: "Proposed Transaction", type: "textarea" },
      { key: "proposedBankingArrangement", label: "Proposed Banking Arrangement", type: "textarea" },
      { key: "collateralSecurity", label: "Collateral Security", type: "textarea" },
      { key: "otherSecurity", label: "Other Security", type: "textarea" },
    ],
  },
  {
    id: "swot", title: "SWOT Analysis", sub: "Strengths, weaknesses, opportunities, threats", icon: Target,
    fields: [
      { key: "swotAnalysis", label: "SWOT Analysis", type: "textarea", placeholder: "Summarize strengths, weaknesses, opportunities and threats" },
    ],
  },
];

const EMPTY_MEMO: InformationMemo = {
  borrower: "", promoters: "", coBorrowerGuarantor: "", aboutBorrowingEntity: "",
  registeredAddress: "", corporateOffice: "", aboutGroup: "", aboutPromoter: "",
  shareholdingPattern: "", directorsProfile: "",
  financials: Object.fromEntries(FINANCIAL_ROWS.map((r) => [r.key, Object.fromEntries(FINANCIAL_YEARS.map((y) => [y.key, ""]))])),
  repaymentHistory: "", expansionPlan: "", employeeStrength: "", industryOverview: "",
  topCustomers: "", currentBankingArrangement: "", proposedTransaction: "",
  proposedBankingArrangement: "", collateralSecurity: "", otherSecurity: "", swotAnalysis: "",
};

// ─── Styled form primitives ───────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <label className="text-[11px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
      {children}{required && <span className="ml-0.5" style={{ color: C.teal }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 text-[13px] rounded-lg border transition-all focus:outline-none focus:ring-2 ${className}`}
      style={{
        borderColor: C.border,
        color: C.textPrimary,
        background: isLight ? "#ffffff" : C.surfaceUp,
        fontFamily: "'Inter', sans-serif",
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
      }}
      onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-[13px] leading-relaxed rounded-lg border transition-all focus:outline-none resize-none"
      style={{
        borderColor: C.border,
        color: C.textPrimary,
        background: isLight ? "#ffffff" : C.surfaceUp,
        fontFamily: "'Inter', sans-serif",
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
      }}
      onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
    />
  );
}

// ─── Onboarding Step 1: Information Memo ─────────────────────────────────────
function InformationMemoStep({ onBack, onSubmit }: { onBack: () => void; onSubmit: (memo: InformationMemo) => Promise<void> }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [memo, setMemo]           = useState<InformationMemo>(EMPTY_MEMO);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const section = MEMO_SECTIONS[sectionIdx];
  const isLast  = sectionIdx === MEMO_SECTIONS.length - 1;
  const isFirst = sectionIdx === 0;

  function update(key: keyof InformationMemo, value: string) {
    setMemo((m) => ({ ...m, [key]: value }));
  }

  function updateFinancial(rowKey: string, yearKey: string, value: string) {
    setMemo((m) => ({
      ...m,
      financials: { ...m.financials, [rowKey]: { ...m.financials[rowKey], [yearKey]: value } },
    }));
  }

  const requiredOk = memo.borrower.trim().length > 0;

  async function handleSubmit() {
    if (!requiredOk) { setSectionIdx(0); setError("Borrower is required before you can continue."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(memo);
    } catch (err) {
      console.error(err);
      setError("Failed to save the information memo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (isLast) { handleSubmit(); return; }
    setSectionIdx((i) => i + 1);
  }

  function goBack() {
    if (isFirst) { onBack(); return; }
    setSectionIdx((i) => i - 1);
  }

  return (
    <div className="w-full max-w-4xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest mb-2" style={{ color: C.teal }}>Step 1 of 2</p>
        <h1 className="text-2xl font-bold mb-1.5" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Information Memorandum
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
          This memo powers your credit profile and is shared with investors once verified. Complete all sections carefully.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
        {MEMO_SECTIONS.map((s, i) => {
          const isActive = i === sectionIdx;
          const isDone   = i < sectionIdx;
          const isLast_  = i === MEMO_SECTIONS.length - 1;
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => setSectionIdx(i)}
                className="flex flex-col items-center gap-1.5 group relative"
                style={{ minWidth: 72 }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 group-hover:scale-105"
                  style={{
                    borderColor: isActive ? C.teal : isDone ? C.teal : C.border,
                    background:  isDone ? C.teal : isActive ? C.tealDim : isLight ? "#ffffff" : C.surfaceUp,
                    boxShadow:   isActive ? `0 0 0 4px ${C.tealDim}` : "none",
                  }}
                >
                  {isDone
                    ? <Check size={14} color="#ffffff" strokeWidth={2.5} />
                    : <span className="text-[11px] font-bold" style={{ color: isActive ? C.teal : C.textMuted }}>{i + 1}</span>
                  }
                </div>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider text-center leading-tight whitespace-nowrap"
                  style={{ color: isActive ? C.teal : isDone ? C.textMuted : C.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {s.title}
                </span>
              </button>
              {!isLast_ && (
                <div
                  className="flex-1 h-0.5 mx-1 transition-all duration-300"
                  style={{
                    background: isDone ? C.teal : C.border,
                    width: 28,
                    minWidth: 20,
                    marginBottom: 18,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Section card */}
      <div
        className="rounded-2xl border mb-6 overflow-hidden"
        style={{
          background: isLight ? "#ffffff" : C.surface,
          borderColor: C.tealBorder,
          boxShadow: isLight ? "0 4px 24px rgba(13,148,136,0.08), 0 1px 3px rgba(0,0,0,0.06)" : `0 0 24px rgba(0,201,167,0.08)`,
        }}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-4 px-7 py-5 border-b"
          style={{
            borderColor: C.border,
            background: isLight ? "linear-gradient(135deg, #f0fdfa, #f8fafc)" : C.surfaceUp,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
          >
            <section.icon size={18} style={{ color: C.teal }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{section.title}</h2>
            <p className="text-[11px]" style={{ color: C.textMuted }}>{section.sub}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{sectionIdx + 1} / {MEMO_SECTIONS.length}</span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-7 py-6">
          {section.id === "financials" ? (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: C.border, boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.05)" : "none" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: isLight ? "#f8fafc" : C.surfaceUp }}>
                      <th className="text-left py-3 px-4 text-[9px] font-mono uppercase tracking-widest font-semibold" style={{ color: C.textMuted }}>Particulars (₹ Cr.)</th>
                      {FINANCIAL_YEARS.map((y) => (
                        <th key={y.key} className="text-left py-3 px-4 text-[9px] font-mono uppercase tracking-widest font-semibold whitespace-nowrap" style={{ color: C.textMuted }}>
                          {y.label}
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[8px]" style={{ background: C.tealDim, color: C.teal }}>{y.tag}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FINANCIAL_ROWS.map((row, ri) => (
                      <tr
                        key={row.key}
                        className="transition-colors"
                        style={{ borderBottom: ri < FINANCIAL_ROWS.length - 1 ? `1px solid ${C.border}` : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? "#f8fafc" : C.surfaceUp)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="py-2.5 px-4 text-[11px] font-semibold whitespace-nowrap" style={{ color: C.textPrimary }}>{row.label}</td>
                        {FINANCIAL_YEARS.map((y) => (
                          <td key={y.key} className="py-1.5 px-2">
                            <input
                              value={memo.financials[row.key]?.[y.key] ?? ""}
                              onChange={(e) => updateFinancial(row.key, y.key, e.target.value)}
                              placeholder="—"
                              className="w-28 px-2.5 py-1.5 text-[12px] font-mono rounded-lg border transition-all focus:outline-none"
                              style={{ borderColor: C.border, color: C.textPrimary, background: isLight ? "#ffffff" : C.surfaceUp, boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none" }}
                              onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
                              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <FieldLabel>Repayment History / Concerns</FieldLabel>
                <TextArea
                  value={memo.repaymentHistory}
                  onChange={(v) => update("repaymentHistory", v)}
                  placeholder="Any repayment concerns or notable history"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {section.fields.map((f) => (
                <div key={f.key}>
                  <FieldLabel required={f.required}>{f.label}</FieldLabel>
                  {f.type === "textarea" ? (
                    <TextArea
                      value={memo[f.key] as string}
                      onChange={(v) => update(f.key, v)}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : (
                    <TextInput
                      value={memo[f.key] as string}
                      onChange={(v) => update(f.key, v)}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
          <AlertCircle size={13} color="#dc2626" />
          <p className="text-[11px] font-medium" style={{ color: "#dc2626" }}>{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all hover:opacity-80"
          style={{ borderColor: C.border, color: C.textMuted, background: isLight ? "#ffffff" : C.surfaceUp }}
        >
          <ChevronLeft size={14} /> {isFirst ? "Cancel" : "Previous"}
        </button>

        <button
          onClick={goNext}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`,
            color: "#ffffff",
            boxShadow: `0 4px 16px rgba(13,148,136,0.3)`,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          {isLast ? (saving ? "Saving..." : "Continue to Documents") : "Next Section"}
          {!saving && <ChevronRight size={13} />}
        </button>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function DocumentOnboarding({ user, onComplete }: { user: AppUser | null; onComplete: (docs: UploadedDoc[]) => void }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc | null>>({});
  const [dragOver, setDragOver]         = useState<string | null>(null);
  const [step, setStep]                 = useState<"memo" | "upload" | "processing">("memo");
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
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  }

  function finishOnboarding() {
    setStep("processing");
    setTimeout(() => { onComplete(Object.values(uploadedDocs).filter(Boolean) as UploadedDoc[]); }, 2200);
  }

  async function handleMemoSubmit(memo: InformationMemo) {
  await updateCompanyProfile({
    companyName: memo.borrower || undefined,
    informationMemo: memo,
  }); // no more `as any`
  setStep("upload");
}

  // ── Processing screen ──────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300"
        style={{ background: isLight ? "#f8fafc" : C.bg }}
      >
        <div className="text-center max-w-xs">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke={isLight ? "#e2e8f0" : C.surfaceUp} strokeWidth="4" />
              <circle
                cx="48" cy="48" r="40" fill="none" stroke={C.teal} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: C.tealDim }}
            >
              <ShieldCheck size={28} style={{ color: C.teal }} />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Activating your dashboard
          </h2>
          <p className="text-[12px] leading-relaxed" style={{ color: C.textMuted, fontFamily: "'Inter', sans-serif" }}>
            Securely uploading and verifying your documents. This takes just a moment.
          </p>
        </div>
      </div>
    );
  }

  // ── Information Memo screen ────────────────────────────────────────────────
  if (step === "memo") {
    return (
      <div
        className="min-h-screen transition-colors duration-300"
        style={{ background: isLight ? "#f1f5f9" : C.bg, fontFamily: "'Inter', sans-serif" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b"
          style={{
            background: isLight ? "rgba(255,255,255,0.92)" : C.surface,
            backdropFilter: "blur(12px)",
            borderColor: C.border,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
            >
              <img src="/logo.png" alt="DNH Capital" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[13px] font-semibold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNH Capital</span>
              <span className="text-[10px] font-mono ml-2" style={{ color: C.textMuted }}>· Onboarding</span>
            </div>
          </div>
          <ThemeToggle compact />
        </header>

        <div className="max-w-4xl mx-auto px-8 py-10">
          <InformationMemoStep onBack={() => {}} onSubmit={handleMemoSubmit} />
        </div>
      </div>
    );
  }

  // ── Upload screen ──────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex transition-colors duration-300"
      style={{ background: isLight ? "#f1f5f9" : C.bg, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-[320px] shrink-0"
        style={{
          background: isLight ? "#ffffff" : C.surface,
          borderRight: `1px solid ${C.border}`,
          boxShadow: isLight ? "1px 0 20px rgba(0,0,0,0.04)" : "none",
        }}
      >
        {/* Brand mark */}
        <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
              >
                <img src="/logo.png" alt="DNH Capital" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-[13px] font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNH Capital</div>
                <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Investment Platform</div>
              </div>
            </div>
            <ThemeToggle compact />
          </div>

          <div className="mb-1">
            <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: C.teal }}>Getting started · Step 2 of 2</p>
            <h1 className="text-xl font-bold leading-snug" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Upload Required<br />
              <span style={{ color: C.teal }}>Documents</span>
            </h1>
          </div>
        </div>

        {/* Progress ring */}
        <div className="px-8 py-6 border-b" style={{ borderColor: C.border }}>
          <div
            className="flex items-center gap-4 p-4 rounded-xl border"
            style={{
              borderColor: C.tealBorder,
              background: isLight ? "linear-gradient(135deg, #f0fdfa, #f8fafc)" : C.tealGlow,
            }}
          >
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke={isLight ? "#e2e8f0" : C.surfaceUp} strokeWidth="3.5" />
                <circle
                  cx="32" cy="32" r="26" fill="none" stroke={C.teal} strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - done / total)}`}
                  style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold font-mono" style={{ color: C.teal }}>{pct}%</span>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {done} of {total} uploaded
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                {allDone ? "All documents ready" : `${total - done} remaining`}
              </p>
              {allDone && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle size={10} style={{ color: C.teal }} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider font-mono" style={{ color: C.teal }}>Ready to activate</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trust features */}
        <div className="px-8 py-6 flex-1">
          <p className="text-[9px] font-mono uppercase tracking-widest mb-4" style={{ color: C.textDim }}>Why we need these</p>
          <div className="space-y-5">
            {[
              { icon: ShieldCheck, label: "Institutional-grade verification", sub: "All documents reviewed by our compliance team" },
              { icon: Zap,         label: "Automatic data extraction",        sub: "KPIs and financials pulled directly from your files" },
              { icon: Lock,        label: "Bank-grade data room",             sub: "You control exactly which investors see what" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: isLight ? "#f0fdfa" : C.surfaceUp,
                    border: `1px solid ${C.tealBorder}`,
                  }}
                >
                  <Icon size={13} style={{ color: C.teal }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>{label}</p>
                  <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: C.textMuted }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pb-6">
          <p className="text-[9px] font-mono" style={{ color: C.textDim }}>© 2025 DNH Capital · Strictly Private & Confidential</p>
        </div>
      </aside>

      {/* ── Right: upload area ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: isLight ? "rgba(255,255,255,0.92)" : C.surface, backdropFilter: "blur(12px)", borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ background: C.tealDim }}>
              <img src="/logo.png" alt="DNH Capital" className="w-full h-full object-cover" />
            </div>
            <span className="text-[13px] font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNH Capital</span>
          </div>
          <ThemeToggle compact />
        </div>

        <div className="max-w-2xl mx-auto px-8 py-10">
          {/* Welcome */}
          {user?.name && (
            <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>
              Welcome back, {user.name}
            </p>
          )}

          <button
            onClick={() => setStep("memo")}
            className="flex items-center gap-1.5 text-[11px] font-mono mb-4 hover:opacity-70 transition-opacity"
            style={{ color: C.textMuted }}
          >
            <ChevronLeft size={12} /> Back to Information Memo
          </button>

          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Upload required documents
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: C.textMuted }}>
            These documents are required to verify your company and activate your investor dashboard. All files are encrypted in transit and at rest.
          </p>

          {/* Document cards */}
          <div className="space-y-3 mb-8">
            {REQUIRED_DOCS.map((doc, idx) => {
              const uploaded = uploadedDocs[doc.key];
              const isOver   = dragOver === doc.key;

              if (uploaded) {
                return (
                  <div
                    key={doc.key}
                    className="rounded-xl border transition-all duration-200"
                    style={{
                      borderColor: C.tealBorder,
                      background: isLight ? "linear-gradient(135deg, #f0fdfa, #f8fffe)" : C.tealGlow,
                      boxShadow: isLight ? "0 2px 12px rgba(13,148,136,0.08)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
                      >
                        <CheckCircle size={16} style={{ color: C.teal }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: C.textPrimary }}>{uploaded.name}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>
                          {doc.label} · {uploaded.size} · {uploaded.type}
                        </p>
                      </div>
                      <StatusBadge status="uploaded" />
                      <button
                        onClick={() => setUploadedDocs((p) => ({ ...p, [doc.key]: null }))}
                        className="ml-1 transition-all hover:opacity-60 hover:rotate-90 p-1.5 rounded-lg"
                        style={{ color: C.textMuted }}
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={doc.key}
                  className="rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: isOver ? C.teal : C.border,
                    borderStyle: isOver ? "solid" : "dashed",
                    background: isOver
                      ? (isLight ? "#f0fdfa" : C.tealGlow)
                      : (isLight ? "#ffffff" : C.surface),
                    boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(doc.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f) handleFile(doc.key, f); }}
                  onClick={() => fileInputRefs.current[doc.key]?.click()}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold font-mono"
                      style={{ background: isLight ? "#f1f5f9" : C.surfaceHigh, color: C.textMuted, border: `1px solid ${C.border}` }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{doc.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{doc.description}</p>
                      <p className="text-[9px] font-mono mt-0.5" style={{ color: C.textDim }}>Accepts: {doc.accept}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isOver ? (
                        <span className="text-[11px] font-semibold" style={{ color: C.teal }}>Drop here</span>
                      ) : (
                        <>
                          <span className="text-[10px] hidden sm:block" style={{ color: C.textMuted }}>Drag & drop or</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); fileInputRefs.current[doc.key]?.click(); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80 hover:scale-[1.03] active:scale-95"
                            style={{
                              borderColor: C.tealBorder,
                              color: C.teal,
                              background: C.tealDim,
                            }}
                          >
                            <Upload size={11} /> Browse
                          </button>
                        </>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                        type="file"
                        accept={doc.accept}
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(doc.key, f); }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          {done > 0 && (
            <div className="mb-6">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{done} of {total} documents uploaded</span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: C.teal }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isLight ? "#e2e8f0" : C.surfaceHigh }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.blue})` }}
                />
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div
            className="flex items-center justify-between pt-5 border-t"
            style={{ borderColor: C.border }}
          >
            <div>
              <p className="text-[11px] font-medium" style={{ color: C.textMuted }}>
                {allDone
                  ? "All documents ready — activate your dashboard"
                  : `${total - done} document${total - done !== 1 ? "s" : ""} still required`}
              </p>
            </div>
            <button
              onClick={finishOnboarding}
              disabled={!allDone}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: allDone ? `linear-gradient(135deg, ${C.teal}, ${C.blue})` : (isLight ? "#e2e8f0" : C.surfaceHigh),
                color: allDone ? "#ffffff" : C.textMuted,
                boxShadow: allDone ? `0 4px 20px rgba(13,148,136,0.3)` : "none",
              }}
            >
              Activate Dashboard <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, kpi }: { active: string; setActive: (s: string) => void; user: AppUser | null; kpi: KpiData }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const unread = kpi.unreadNotifications ?? 0;
  return (
    <aside
      className="flex flex-col h-full w-[240px] shrink-0 transition-colors duration-300"
      style={{
        background: isLight ? "#ffffff" : C.surface,
        borderRight: `1px solid ${C.border}`,
        boxShadow: isLight ? "1px 0 12px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}>
          <img src="/logo.png" alt="DNH Capital" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNH Capital</div>
          <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Company Portal</div>
        </div>
      </div>

      <div className="mx-3 mb-4 p-3 rounded-xl border transition-colors duration-300" style={{ background: C.surfaceUp, borderColor: C.border }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${C.teal}22, ${C.blue}22)`, color: C.teal, border: `1px solid ${C.tealBorder}` }}
          >
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
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: C.teal, color: "#fff" }}>{unread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-3 flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors duration-300" style={{ background: C.surfaceUp, borderColor: C.border }}>
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Theme</span>
        <ThemeToggle compact />
      </div>

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
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const label = ALL_NAV.find((n) => n.id === section)?.label || "Dashboard";
  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 shrink-0 transition-colors duration-300"
      style={{
        background: isLight ? "rgba(255,255,255,0.9)" : C.surface,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
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
            className="pl-8 pr-4 py-2 text-[11px] font-mono rounded-lg border focus:outline-none w-44 transition-all"
            style={{
              borderColor: C.border,
              color: C.textPrimary,
              background: C.surfaceUp,
              boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
          />
        </div>
        <div className="w-px h-5" style={{ background: C.border }} />
        <ThemeToggle compact />
        <div className="w-px h-5" style={{ background: C.border }} />
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: "#fff" }}
          >
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
function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | null; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-xl border relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: accent
          ? (isLight ? "linear-gradient(135deg, #f0fdfa, #ffffff)" : `linear-gradient(135deg, ${C.surfaceUp}, ${C.surface})`)
          : (isLight ? "#ffffff" : C.surface),
        borderColor: accent ? C.tealBorder : C.border,
        boxShadow: isLight
          ? accent
            ? `0 4px 20px rgba(13,148,136,0.12), 0 1px 3px rgba(0,0,0,0.06)`
            : `0 1px 3px rgba(0,0,0,0.05)`
          : accent
            ? `0 0 24px -6px rgba(0,201,167,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {accent && <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.teal}80, transparent)` }} />}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accent ? C.tealDim : C.surfaceUp, border: `1px solid ${accent ? C.tealBorder : C.border}` }}>
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

// ─── Dashboard section ────────────────────────────────────────────────────────
function DashboardSection({ kpi, proposals, fundingChart, engagementChart, notifications, activityFeed }: {
  kpi: KpiData; proposals: Proposal[]; fundingChart: any[]; engagementChart: any[]; notifications: Notification[]; activityFeed: ActivityItem[];
}) {
  const { colors: C } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Executive Summary</p>
        <h1 className="text-lg font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h1>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Funding Required"    value={kpi.fundingRequired}     sub="Series A target"    icon={Target}     accent />
        <KpiCard label="Funding Raised"      value={kpi.fundingRaised}       sub="To date"            icon={TrendingUp} />
        <KpiCard label="Active Investors"    value={kpi.activeInvestors !== null ? String(kpi.activeInvestors) : null} sub="In pipeline" icon={Users} />
        <KpiCard label="Verification"        value={kpi.verificationStatus}  sub="Document completion" icon={ShieldCheck} />
        <KpiCard label="Notifications"       value={kpi.unreadNotifications !== null ? String(kpi.unreadNotifications) : null} sub="Unread" icon={Bell} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="col-span-2 p-5">
          <SectionHeader title="Funding Progress" sub="Monthly capital raised vs. round target" />
          {fundingChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={fundingChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.teal} stopOpacity={0.2} />
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
                <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0 transition-colors" style={{ borderColor: C.border }}>
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

// ─── CEO / CFO Dashboard: Data Upload (Tally Sheet) ────────────────────────────
function DataUpload({ kind, data, onParsed }: {
  kind: "ceo" | "cfo";
  data: ParsedFinancialData | null;
  onParsed: (data: ParsedFinancialData) => void;
}) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "parsing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv" && ext !== "xls") {
      setStatus("error");
      setErrorMsg("Unsupported file type — please upload an .xlsx or .csv tally sheet.");
      return;
    }
    setStatus("parsing");
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const parsed = parseFinancialWorkbook(workbook, file.name);
      if (Object.keys(parsed.indicators).length === 0) {
        throw new Error("No recognizable indicators found. Make sure this file matches the Tally Sheet template (Data sheet with Indicator Name / Actual-Target-Last Year rows).");
      }
      onParsed(parsed);
      try {
        if (kind === "ceo") await saveCEOData(parsed); else await saveCFOData(parsed);
      } catch (persistErr) {
        console.error(`Failed to persist ${kind} dashboard data:`, persistErr);
      }
      setStatus("idle");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "Could not parse this file. Please check its structure and try again.");
    }
  }

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Tally Sheet"
        sub={`Upload the ${kind.toUpperCase()} Dashboard workbook (.xlsx or .csv) to populate the metrics below`}
      />
      <div
        className="rounded-xl border-2 transition-all duration-200 cursor-pointer"
        style={{
          borderColor: dragOver ? C.teal : C.border,
          borderStyle: dragOver ? "solid" : "dashed",
          background: dragOver ? (isLight ? "#f0fdfa" : C.tealGlow) : (isLight ? "#ffffff" : C.surfaceUp),
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
          >
            {status === "parsing"
              ? <Loader2 size={16} className="animate-spin" style={{ color: C.teal }} />
              : <FileSpreadsheet size={16} style={{ color: C.teal }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>
              {status === "parsing" ? "Parsing workbook…" : data ? data.fileName : `Drop your ${kind.toUpperCase()} Dashboard.xlsx here`}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>
              {data
                ? `Loaded ${Object.keys(data.indicators).length} indicators${data.fiscalYear ? ` · FY ${data.fiscalYear}` : ""} · updated ${new Date(data.uploadedAt).toLocaleString("en-IN")}`
                : "Reads the Data / Indicators sheets · .xlsx, .xls, .csv"}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {!dragOver && (
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80 hover:scale-[1.03] active:scale-95"
                style={{ borderColor: C.tealBorder, color: C.teal, background: C.tealDim }}
              >
                {data ? <RefreshCw size={11} /> : <Upload size={11} />}
                {data ? "Replace" : "Browse"}
              </button>
            )}
            {dragOver && <span className="text-[11px] font-semibold" style={{ color: C.teal }}>Drop here</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>
        </div>
      </div>
      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(220,38,38,0.08)" }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#dc2626" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "#dc2626" }}>{errorMsg}</p>
        </div>
      )}
    </Panel>
  );
}

// ─── CEO / CFO Dashboard: shared metric + chart primitives ─────────────────────
function toneColor(tone: "good" | "warn" | "bad" | "flat", C: Palette): string {
  if (tone === "good") return C.teal;
  if (tone === "warn") return "#d97706";
  if (tone === "bad") return "#dc2626";
  return C.textMuted;
}

function pct(v: number | null, digits = 1): string {
  return v === null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;
}

function fmtNum(v: number | null, digits = 1): string {
  return v === null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

/** KPI card for a financial indicator: value + target-achievement + YoY change, matching the workbook's Monthly/YTD Dashboard cards. */
function FinancialMetricCard({ label, value, unit, targetAchievement, changeYoY, icon: Icon }: {
  label: string; value: number | null; unit?: string;
  targetAchievement: number | null; changeYoY: number | null; icon: React.ElementType;
}) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const taTone = achievementTone(targetAchievement);
  const taColor = toneColor(taTone, C);
  const changeTone: "good" | "bad" | "flat" = changeYoY === null ? "flat" : changeYoY >= 0 ? "good" : "bad";
  const changeColor = toneColor(changeTone, C);
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl border relative overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: isLight ? "#ffffff" : C.surface,
        borderColor: C.border,
        boxShadow: isLight ? `0 1px 3px rgba(0,0,0,0.05)` : `inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.surfaceUp, border: `1px solid ${C.border}` }}>
          <Icon size={12} style={{ color: C.textMuted }} />
        </div>
      </div>
      <div className="text-[22px] font-bold tracking-tight font-mono leading-none" style={{ color: value !== null ? C.textPrimary : C.textDim }}>
        {value !== null ? `${unit === "%" ? "" : unit || ""}${fmtNum(value)}${unit === "%" ? "%" : ""}` : "—"}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: taColor }} />
          <span className="text-[9px] font-mono" style={{ color: C.textMuted }}>Target</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: taColor }}>{pct(targetAchievement)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {changeTone === "good" ? <TrendingUp size={10} style={{ color: changeColor }} /> : <TrendingDown size={10} style={{ color: changeColor }} />}
          <span className="text-[9px] font-mono" style={{ color: C.textMuted }}>YoY</span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: changeColor }}>{pct(changeYoY)}</span>
        </div>
      </div>
    </div>
  );
}

/** Simple KPI card for a point-in-time balance-sheet style figure (no target/YoY). */
function SnapshotMetricCard({ label, value, icon: Icon, accent }: { label: string; value: number | null; icon: React.ElementType; accent?: boolean }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: accent ? (isLight ? "linear-gradient(135deg, #f0fdfa, #ffffff)" : `linear-gradient(135deg, ${C.surfaceUp}, ${C.surface})`) : (isLight ? "#ffffff" : C.surface),
        borderColor: accent ? C.tealBorder : C.border,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>{label}</span>
        <Icon size={12} style={{ color: accent ? C.teal : C.textMuted }} />
      </div>
      <div className="text-[17px] font-bold font-mono leading-none" style={{ color: value !== null ? (accent ? C.teal : C.textPrimary) : C.textDim }}>
        {fmtNum(value)}
      </div>
    </div>
  );
}

/** Builds a stacked-bar "waterfall" dataset the same way the workbook's Cal sheet does: an invisible base plus a positive/negative delta bar per line item. */
function buildWaterfallData(steps: { label: string; delta: number }[], startLabel: string, startValue: number) {
  let running = startValue;
  const rows: { label: string; base: number; positive: number; negative: number; value: number }[] = [
    { label: startLabel, base: 0, positive: startValue, negative: 0, value: startValue },
  ];
  for (const step of steps) {
    const isPositive = step.delta >= 0;
    const base = isPositive ? running : running + step.delta;
    rows.push({ label: step.label, base: Math.max(base, 0), positive: isPositive ? step.delta : 0, negative: isPositive ? 0 : -step.delta, value: step.delta });
    running += step.delta;
  }
  rows.push({ label: "Result", base: 0, positive: running, negative: 0, value: running });
  return rows;
}

function WaterfallChart({ data, positiveColor, negativeColor, resultColor }: {
  data: { label: string; base: number; positive: number; negative: number; value: number }[];
  positiveColor: string; negativeColor: string; resultColor: string;
}) {
  const { colors: C } = useTheme();
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="positive" stackId="wf" radius={[3, 3, 0, 0]} name="Increase">
          {data.map((d, i) => (
            <Cell key={i} fill={i === 0 || i === data.length - 1 ? resultColor : positiveColor} />
          ))}
        </Bar>
        <Bar dataKey="negative" stackId="wf" fill={negativeColor} radius={[3, 3, 0, 0]} name="Decrease" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── CEO Dashboard ──────────────────────────────────────────────────────────────
function CeoDashboard({ data, onParsed }: { data: ParsedFinancialData | null; onParsed: (d: ParsedFinancialData) => void }) {
  const { colors: C } = useTheme();

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Leadership · Executive</p>
          <h1 className="text-lg font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CEO Dashboard</h1>
        </div>
        <DataUpload kind="ceo" data={data} onParsed={onParsed} />
        <Panel className="p-5">
          <EmptyState
            message="No CEO tally sheet uploaded yet"
            sub="Upload your CEO Dashboard.xlsx above to populate sales KPIs, product mix, and profitability charts"
            icon={LayoutDashboard}
          />
        </Panel>
      </div>
    );
  }

  const { indicators, products, selectedMonthIndex } = data;
  const month = FISCAL_MONTHS[selectedMonthIndex];

  const sales = pickIndicator(indicators, ["Total Revenue", "Sales"]);
  const grossProfit = pickIndicator(indicators, ["Gross Profit"]);
  const operatingProfit = pickIndicator(indicators, ["Operating Profit (EBIT)", "Operating Profit"]);
  const netProfit = pickIndicator(indicators, ["Net Profit Before Tax", "Net Profit"]);
  const cogs = pickIndicator(indicators, ["Cost of Goods Sold"]);
  const opex = pickIndicator(indicators, ["Total Operating Expenses"]);
  const otherIncome = pickIndicator(indicators, ["Other Non-Operating Income/(Expense)"]);
  const financeExpense = pickIndicator(indicators, ["Finance Expense"]);

  function ratioAt(series: IndicatorSeries | null, i: number) {
    if (!series) return null;
    const a = series.actual[i], t = series.target[i];
    return a !== null && t !== null && t !== 0 ? a / t : null;
  }
  function yoyAt(series: IndicatorSeries | null, i: number) {
    if (!series) return null;
    const a = series.actual[i], l = series.lastYear[i];
    return a !== null && l !== null && l !== 0 ? a / l - 1 : null;
  }

  const productChartData = FISCAL_MONTHS.map((m, i) => {
    const row: Record<string, any> = { month: m };
    products.forEach((p) => { row[p.name] = p.actual[i]; });
    return row;
  });
  const productColors = [C.teal, C.blue, C.indigo, "#f59e0b", "#ec4899"];

  const waterfallSteps = [
    { label: "COGS", delta: -(cogs?.actual[selectedMonthIndex] ?? 0) },
    { label: "Opex", delta: -(opex?.actual[selectedMonthIndex] ?? 0) },
    { label: "Other Inc.", delta: otherIncome?.actual[selectedMonthIndex] ?? 0 },
    { label: "Finance Exp.", delta: -(financeExpense?.actual[selectedMonthIndex] ?? 0) },
  ];
  const waterfallData = buildWaterfallData(waterfallSteps, "Revenue", sales?.actual[selectedMonthIndex] ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Leadership · Executive</p>
          <h1 className="text-lg font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CEO Dashboard</h1>
        </div>
        {data.fiscalYear && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ background: C.tealDim, color: C.teal }}>
            FY {data.fiscalYear} · {month}
          </span>
        )}
      </div>

      <DataUpload kind="ceo" data={data} onParsed={onParsed} />

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Sales — {month}</p>
        <div className="grid grid-cols-4 gap-3">
          <FinancialMetricCard label="Total Sales" value={sales?.actual[selectedMonthIndex] ?? null} targetAchievement={ratioAt(sales, selectedMonthIndex)} changeYoY={yoyAt(sales, selectedMonthIndex)} icon={DollarSign} />
          <SnapshotMetricCard label="Target" value={sales?.target[selectedMonthIndex] ?? null} icon={Target} />
          <SnapshotMetricCard label="% of Target" value={ratioAt(sales, selectedMonthIndex) !== null ? (ratioAt(sales, selectedMonthIndex)! * 100) : null} icon={PieChart} accent />
          <SnapshotMetricCard label="Difference" value={sales ? (sales.actual[selectedMonthIndex] ?? 0) - (sales.target[selectedMonthIndex] ?? 0) : null} icon={Scale} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="col-span-2 p-5">
          <SectionHeader title="Sales by Product" sub="Monthly actuals across the fiscal year" />
          {products.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={productChartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
                {products.map((p, i) => (
                  <Bar key={p.name} dataKey={p.name} stackId="prod" fill={productColors[i % productColors.length]} radius={i === products.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No product breakdown found" sub="Add up to 5 products under 'Sales by Product' in the Data sheet" icon={BarChart2} />
          )}
        </Panel>

        <Panel className="p-5">
          <SectionHeader title={`Revenue → Net Profit`} sub={`Waterfall for ${month}`} />
          <WaterfallChart data={waterfallData} positiveColor={C.blue} negativeColor="#dc2626" resultColor={C.teal} />
        </Panel>
      </div>

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Profitability — {month}</p>
        <div className="grid grid-cols-3 gap-3">
          <FinancialMetricCard label="Gross Profit" value={grossProfit?.actual[selectedMonthIndex] ?? null} targetAchievement={ratioAt(grossProfit, selectedMonthIndex)} changeYoY={yoyAt(grossProfit, selectedMonthIndex)} icon={TrendingUp} />
          <FinancialMetricCard label="Operating Profit" value={operatingProfit?.actual[selectedMonthIndex] ?? null} targetAchievement={ratioAt(operatingProfit, selectedMonthIndex)} changeYoY={yoyAt(operatingProfit, selectedMonthIndex)} icon={Activity} />
          <FinancialMetricCard label="Net Profit" value={netProfit?.actual[selectedMonthIndex] ?? null} targetAchievement={ratioAt(netProfit, selectedMonthIndex)} changeYoY={yoyAt(netProfit, selectedMonthIndex)} icon={Wallet} />
        </div>
      </div>
    </div>
  );
}

// ─── CFO Dashboard ──────────────────────────────────────────────────────────────
function CfoDashboard({ data, onParsed }: { data: ParsedFinancialData | null; onParsed: (d: ParsedFinancialData) => void }) {
  const { colors: C } = useTheme();

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Leadership · Finance</p>
          <h1 className="text-lg font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CFO Dashboard</h1>
        </div>
        <DataUpload kind="cfo" data={data} onParsed={onParsed} />
        <Panel className="p-5">
          <EmptyState
            message="No CFO tally sheet uploaded yet"
            sub="Upload your CFO Dashboard.xlsx above to populate P&L, balance sheet, and liquidity ratios"
            icon={LayoutDashboard}
          />
        </Panel>
      </div>
    );
  }

  const { indicators, selectedMonthIndex } = data;
  const month = FISCAL_MONTHS[selectedMonthIndex];

  const revenue = pickIndicator(indicators, ["Revenue", "Total Revenue"]);
  const cogs = pickIndicator(indicators, ["Cost of Goods Sold"]);
  const grossProfit = pickIndicator(indicators, ["Gross Profit"]);
  const opex = pickIndicator(indicators, ["Total Operating Expenses"]);
  const operatingProfit = pickIndicator(indicators, ["Operating Profit (EBIT)", "Operating Profit"]);
  const otherIncome = pickIndicator(indicators, ["Other Non-Operating Income/(Expense)"]);
  const financeExpense = pickIndicator(indicators, ["Finance Expense"]);
  const netProfit = pickIndicator(indicators, ["Net Profit Before Tax", "Net Profit"]);

  const fixedAssets = pickIndicator(indicators, ["Fixed Assets"]);
  const currentAssets = pickIndicator(indicators, ["Current Assets"]);
  const otherAssets = pickIndicator(indicators, ["Other Assets"]);
  const totalAssets = pickIndicator(indicators, ["Total Assets"]);
  const currentLiabilities = pickIndicator(indicators, ["Current Liabilities"]);
  const longTermLiabilities = pickIndicator(indicators, ["Long Term Liabilities"]);
  const equity = pickIndicator(indicators, ["Equity"]);

  const currentRatio = pickIndicator(indicators, ["Current Ratio"]);
  const quickRatio = pickIndicator(indicators, ["Quick Ratio"]);
  const debtEquity = pickIndicator(indicators, ["Debt : Equity Ratio", "Debt:Equity Ratio"]);

  function ratioAt(series: IndicatorSeries | null, i: number) {
    if (!series) return null;
    const a = series.actual[i], t = series.target[i];
    return a !== null && t !== null && t !== 0 ? a / t : null;
  }
  function yoyAt(series: IndicatorSeries | null, i: number) {
    if (!series) return null;
    const a = series.actual[i], l = series.lastYear[i];
    return a !== null && l !== null && l !== 0 ? a / l - 1 : null;
  }
  function at(series: IndicatorSeries | null, i: number) {
    return series ? series.actual[i] : null;
  }

  const waterfallSteps = [
    { label: "COGS", delta: -(cogs?.actual[selectedMonthIndex] ?? 0) },
    { label: "Opex", delta: -(opex?.actual[selectedMonthIndex] ?? 0) },
    { label: "Other Inc.", delta: otherIncome?.actual[selectedMonthIndex] ?? 0 },
    { label: "Finance Exp.", delta: -(financeExpense?.actual[selectedMonthIndex] ?? 0) },
  ];
  const waterfallData = buildWaterfallData(waterfallSteps, "Revenue", revenue?.actual[selectedMonthIndex] ?? 0);

  const balanceSheetData = [
    { label: "Fixed Assets", value: at(fixedAssets, selectedMonthIndex) ?? 0, group: "Assets" },
    { label: "Current Assets", value: at(currentAssets, selectedMonthIndex) ?? 0, group: "Assets" },
    { label: "Other Assets", value: at(otherAssets, selectedMonthIndex) ?? 0, group: "Assets" },
    { label: "Current Liab.", value: at(currentLiabilities, selectedMonthIndex) ?? 0, group: "Liabilities & Equity" },
    { label: "LT Liab.", value: at(longTermLiabilities, selectedMonthIndex) ?? 0, group: "Liabilities & Equity" },
    { label: "Equity", value: at(equity, selectedMonthIndex) ?? 0, group: "Liabilities & Equity" },
  ];

  const ratioChartData = FISCAL_MONTHS.map((m, i) => ({
    month: m,
    "Current Ratio": at(currentRatio, i),
    "Quick Ratio": at(quickRatio, i),
    "Debt:Equity": at(debtEquity, i),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>Leadership · Finance</p>
          <h1 className="text-lg font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>CFO Dashboard</h1>
        </div>
        {data.fiscalYear && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full" style={{ background: C.tealDim, color: C.teal }}>
            FY {data.fiscalYear} · {month}
          </span>
        )}
      </div>

      <DataUpload kind="cfo" data={data} onParsed={onParsed} />

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>P&amp;L — {month}</p>
        <div className="grid grid-cols-3 gap-3">
          <FinancialMetricCard label="Revenue" value={at(revenue, selectedMonthIndex)} targetAchievement={ratioAt(revenue, selectedMonthIndex)} changeYoY={yoyAt(revenue, selectedMonthIndex)} icon={DollarSign} />
          <SnapshotMetricCard label="Cost of Goods Sold" value={at(cogs, selectedMonthIndex)} icon={Briefcase} />
          <FinancialMetricCard label="Gross Profit" value={at(grossProfit, selectedMonthIndex)} targetAchievement={ratioAt(grossProfit, selectedMonthIndex)} changeYoY={yoyAt(grossProfit, selectedMonthIndex)} icon={TrendingUp} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FinancialMetricCard label="Operating Profit" value={at(operatingProfit, selectedMonthIndex)} targetAchievement={ratioAt(operatingProfit, selectedMonthIndex)} changeYoY={yoyAt(operatingProfit, selectedMonthIndex)} icon={Activity} />
        <FinancialMetricCard label="Net Profit" value={at(netProfit, selectedMonthIndex)} targetAchievement={ratioAt(netProfit, selectedMonthIndex)} changeYoY={yoyAt(netProfit, selectedMonthIndex)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel className="p-5">
          <SectionHeader title="Revenue → Net Profit" sub={`Waterfall for ${month}`} />
          <WaterfallChart data={waterfallData} positiveColor={C.blue} negativeColor="#dc2626" resultColor={C.teal} />
        </Panel>

        <Panel className="p-5">
          <SectionHeader title="Balance Sheet" sub={`Snapshot as of ${month}`} />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={balanceSheetData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} name="Amount">
                {balanceSheetData.map((d, i) => (
                  <Cell key={i} fill={d.group === "Assets" ? C.blue : C.teal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-5">
          <SectionHeader title="Financial Ratios" sub="Current, Quick & Debt:Equity across the year" />
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={ratioChartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
              <Line type="monotone" dataKey="Current Ratio" stroke={C.teal} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Quick Ratio" stroke={C.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Debt:Equity" stroke={C.indigo} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Balance Sheet Detail — {month}</p>
        <div className="grid grid-cols-4 gap-3">
          <SnapshotMetricCard label="Total Assets" value={at(totalAssets, selectedMonthIndex)} icon={Landmark} accent />
          <SnapshotMetricCard label="Current Liabilities" value={at(currentLiabilities, selectedMonthIndex)} icon={Briefcase} />
          <SnapshotMetricCard label="Long Term Liabilities" value={at(longTermLiabilities, selectedMonthIndex)} icon={Lock} />
          <SnapshotMetricCard label="Equity" value={at(equity, selectedMonthIndex)} icon={Scale} accent />
        </div>
      </div>
    </div>
  );
}

// ─── Funding request modal ─────────────────────────────────────────────────────
function FundingRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [form, setForm] = useState({
    title: "", description: "", fundNeeded: "", fundPurpose: "",
    valuation: "", minimumTicket: "", equityOfferedPct: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = form.title.trim() && form.description.trim() && form.fundNeeded.trim() && form.fundPurpose.trim();

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await createFundingOpportunity({
        title: form.title,
        description: form.description,
        fundNeeded: Number(form.fundNeeded),
        fundPurpose: form.fundPurpose,
        valuation: form.valuation ? Number(form.valuation) : undefined,
        minimumTicket: form.minimumTicket ? Number(form.minimumTicket) : undefined,
        equityOfferedPct: form.equityOfferedPct ? Number(form.equityOfferedPct) : undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to submit funding request. Please check your details and try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    borderColor: C.border,
    color: C.textPrimary,
    background: isLight ? "#ffffff" : C.surfaceUp,
    boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div
        className="rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: isLight ? "#ffffff" : C.surface,
          borderColor: C.border,
          boxShadow: isLight ? "0 24px 60px rgba(0,0,0,0.15)" : "0 24px 48px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
          <h3 className="text-sm font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Request Funding</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: C.textMuted }}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <FieldLabel required>Round Title</FieldLabel>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Series A Growth Round"
              className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
            />
          </div>
          <div>
            <FieldLabel required>Description</FieldLabel>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="What this round is for and your growth plan"
              className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none resize-none transition-all"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "fundNeeded", label: "Amount Needed (₹)", placeholder: "10000000", required: true, type: "number" },
              { key: "valuation", label: "Valuation (₹)", placeholder: "100000000", type: "number" },
              { key: "minimumTicket", label: "Min. Ticket (₹)", placeholder: "500000", type: "number" },
              { key: "equityOfferedPct", label: "Equity Offered (%)", placeholder: "10", type: "number" },
            ].map(({ key, label, placeholder, required, type }) => (
              <div key={key}>
                <FieldLabel required={required}>{label}</FieldLabel>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key as keyof typeof form, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
                  onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
                />
              </div>
            ))}
          </div>
          <div>
            <FieldLabel required>Purpose of Funds</FieldLabel>
            <input value={form.fundPurpose} onChange={(e) => update("fundPurpose", e.target.value)} placeholder="Product development, hiring, market expansion"
              className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = isLight ? "0 1px 2px rgba(0,0,0,0.04)" : "none"; }}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
              <AlertCircle size={13} color="#dc2626" />
              <p className="text-[10px]" style={{ color: "#dc2626" }}>{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSubmit} disabled={!isValid || saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: "#fff", boxShadow: `0 4px 16px rgba(13,148,136,0.25)` }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {saving ? "Submitting..." : "Submit Request"}
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold border transition-all hover:opacity-80" style={{ borderColor: C.border, color: C.textPrimary, background: C.surfaceUp }}>
              Cancel
            </button>
          </div>
          <p className="text-[9px] font-mono leading-relaxed" style={{ color: C.textDim }}>
            Requests go to PENDING_APPROVAL until reviewed by a DNH Capital associate partner. Your company must be verified before this can go live to investors.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Funding section ──────────────────────────────────────────────────────────
function FundingSection({ kpi, fundingChart, onRefresh }: { kpi: KpiData; fundingChart: any[]; onRefresh: () => void }) {
  const { colors: C } = useTheme();
  const [showRequestModal, setShowRequestModal] = useState(false);
  return (
    <div className="space-y-5">
      {showRequestModal && <FundingRequestModal onClose={() => setShowRequestModal(false)} onCreated={onRefresh} />}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: "#fff", boxShadow: `0 4px 16px rgba(13,148,136,0.25)` }}
        >
          <Plus size={13} /> Request Funding
        </button>
      </div>
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
                  <stop offset="0%"   stopColor={C.teal} stopOpacity={0.2} />
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

// ─── CEO/CFO Updates ──────────────────────────────────────────────────────────
function UpdateComposer({ ceoName, cfoName, editing, onCancelEdit, onSave }: {
  ceoName?: string; cfoName?: string;
  editing: CompanyUpdate | null;
  onCancelEdit: () => void;
  onSave: (payload: { authorRole: UpdateAuthorRole; authorName: string; title: string; content: string; category: UpdateCategory }) => Promise<void>;
}) {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [authorRole, setAuthorRole] = useState<UpdateAuthorRole>(editing?.authorRole ?? "CEO");
  const [authorName, setAuthorName] = useState(editing?.authorName ?? ceoName ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [category, setCategory] = useState<UpdateCategory>(editing?.category ?? "GENERAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setAuthorRole(editing.authorRole); setAuthorName(editing.authorName);
      setTitle(editing.title); setContent(editing.content); setCategory(editing.category);
    }
  }, [editing]);

  function switchRole(role: UpdateAuthorRole) {
    setAuthorRole(role);
    if (!editing) setAuthorName(role === "CEO" ? (ceoName ?? "") : (cfoName ?? ""));
  }

  const isValid = authorName.trim() && title.trim() && content.trim();

  async function handleSave() {
    if (!isValid) return;
    setSaving(true); setError(null);
    try {
      await onSave({ authorRole, authorName: authorName.trim(), title: title.trim(), content: content.trim(), category });
      if (!editing) { setTitle(""); setContent(""); setCategory("GENERAL"); }
    } catch (err) {
      console.error(err);
      setError("Couldn't save this update. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    borderColor: C.border,
    color: C.textPrimary,
    background: isLight ? "#ffffff" : C.surfaceUp,
  };

  return (
    <Panel className="p-5" glow>
      <SectionHeader title={editing ? "Edit Update" : "Post a Company Update"} sub="Visible to investors who have proposed to or invested in your company" />
      <div className="flex items-center gap-2 mb-4">
        {(["CEO", "CFO"] as UpdateAuthorRole[]).map((role) => (
          <button key={role} onClick={() => switchRole(role)}
            className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all"
            style={{ borderColor: authorRole === role ? C.tealBorder : C.border, background: authorRole === role ? C.tealDim : "transparent", color: authorRole === role ? C.teal : C.textMuted }}>
            Posting as {role}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <FieldLabel>Author Name</FieldLabel>
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder={authorRole === "CEO" ? "CEO full name" : "CFO full name"}
            className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <select value={category} onChange={(e) => setCategory(e.target.value as UpdateCategory)}
            className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all" style={inputStyle}>
            {UPDATE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <FieldLabel>Title</FieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 revenue update, new hire, product launch"
          className="w-full px-3.5 py-2.5 text-[12px] rounded-lg border focus:outline-none transition-all" style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
      </div>
      <div className="mb-4">
        <FieldLabel>{"What's happening at the company"}</FieldLabel>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
          placeholder="Share progress, numbers, wins, or risks investors should know about..."
          className="w-full px-3.5 py-2.5 text-[12px] leading-relaxed rounded-lg border focus:outline-none resize-none transition-all" style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = `0 0 0 3px ${C.tealDim}`; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
      </div>
      {error && <p className="text-[10px] font-mono mb-3" style={{ color: "#dc2626" }}>{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={!isValid || saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: "#fff", boxShadow: `0 4px 16px rgba(13,148,136,0.25)` }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {saving ? "Saving..." : editing ? "Save Changes" : "Post Update"}
        </button>
        {editing && (
          <button onClick={onCancelEdit} className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Cancel</button>
        )}
      </div>
    </Panel>
  );
}

function UpdatesFeed({ updates, onEdit, onDelete, deletingId }: {
  updates: CompanyUpdate[]; onEdit: (u: CompanyUpdate) => void; onDelete: (id: string) => void; deletingId: string | null;
}) {
  const { colors: C } = useTheme();
  if (updates.length === 0) {
    return <Panel className="p-5"><EmptyState message="No updates posted yet" sub="Updates you post here become visible to your investors" icon={MessageSquare} /></Panel>;
  }
  return (
    <div className="space-y-3">
      {updates.map((u) => (
        <Panel key={u.id} className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={u.authorRole} />
              <CategoryBadge category={u.category} />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(u)} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: C.textMuted }} title="Edit"><Pencil size={12} /></button>
              <button onClick={() => onDelete(u.id)} disabled={deletingId === u.id} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: C.textMuted }} title="Delete">
                {deletingId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          </div>
          <h3 className="text-[13px] font-semibold mb-1.5" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{u.title}</h3>
          <p className="text-[11px] leading-relaxed whitespace-pre-wrap mb-3" style={{ color: C.textMuted }}>{u.content}</p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: C.textDim }}>
            <span>{u.authorName}</span>
            <span>·</span>
            <span>{new Date(u.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
            {u.updatedAt !== u.createdAt && <span className="italic">· edited</span>}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function UpdatesSection({ ceoName, cfoName }: { ceoName?: string; cfoName?: string }) {
  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CompanyUpdate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try { setLoading(true); const list = await getCompanyUpdates(); setUpdates(list); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(payload: { authorRole: UpdateAuthorRole; authorName: string; title: string; content: string; category: UpdateCategory }) {
    if (editing) {
      const updated = await editCompanyUpdate(editing.id, payload);
      setUpdates((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } else {
      const created = await createCompanyUpdate(payload);
      setUpdates((prev) => [created, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this update? Investors will no longer see it.")) return;
    setDeletingId(id);
    try {
      await deleteCompanyUpdate(id);
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (err) { console.error(err); alert("Failed to delete update."); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-5">
      <UpdateComposer ceoName={ceoName} cfoName={cfoName} editing={editing} onCancelEdit={() => setEditing(null)} onSave={handleSave} />
      {loading ? (
        <Panel className="p-8 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: "#64748b" }} /></Panel>
      ) : (
        <UpdatesFeed updates={updates} onEdit={setEditing} onDelete={handleDelete} deletingId={deletingId} />
      )}
    </div>
  );
}

// ─── Documents section ────────────────────────────────────────────────────────
function DocumentsSection({ documents }: { documents: DocumentRow[] }) {
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
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.surfaceUp, border: `1px solid ${C.border}` }}>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: step.status === "verified" ? C.tealDim : C.surfaceUp, border: `1px solid ${step.status === "verified" ? C.tealBorder : C.border}` }}>
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
function ProfileSection({ user, profileData }: { user: AppUser | null; profileData: any }) {
  const { colors: C } = useTheme();
  return (
    <div className="space-y-4">
      <Panel className="p-6" glow>
        <SectionHeader title="Company Profile" sub="Account credentials and company data" action="Edit" />
        <div className="flex items-center gap-5 pb-6 mb-6 border-b" style={{ borderColor: C.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: "#fff", boxShadow: `0 8px 24px rgba(13,148,136,0.25)` }}>
            {user?.company?.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.company || "—"}</h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{profileData?.industry || "Industry not set"} · Series A</p>
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
            { label: "CEO",            value: profileData?.ceoName, icon: User },
            { label: "CFO",            value: profileData?.cfoName, icon: User },
            { label: "GSTIN",          value: profileData?.gstin, icon: FileText },
            { label: "Monthly Revenue",value: profileData?.monthlyRevenue ? `₹${Number(profileData.monthlyRevenue).toLocaleString("en-IN")}` : null, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:translate-x-0.5" style={{ borderColor: C.border, background: C.surfaceUp }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}>
                <Icon size={13} style={{ color: C.teal }} />
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.textPrimary }}>{value || "—"}</p>
              </div>
            </div>
          ))}
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}>
              <group.icon size={12} style={{ color: C.teal }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.title}</h3>
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

// ─── Plus icon shim ───────────────────────────────────────────────────────────
function Plus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppInner() {
  const { colors: C, theme } = useTheme();
  const isLight = theme === "light";
  const [activeNav, setActiveNav] = useState("dashboard");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const [user]            = useState<AppUser>({ name: "", email: "", company: "", role: "" });
  const [kpi, setKpi]      = useState<KpiData>({ fundingRequired: null, fundingRaised: null, activeInvestors: null, verificationStatus: null, unreadNotifications: null });
  const [proposals, setProposals]       = useState<Proposal[]>([]);
  const [documents, setDocuments]       = useState<DocumentRow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityFeed, setActivityFeed]   = useState<ActivityItem[]>([]);
  const [fundingChart, setFundingChart]   = useState<any[]>([]);
  const [engagementChart, setEngagementChart] = useState<any[]>([]);
  const [profileData, setProfileData]     = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [ceoData, setCeoData] = useState<ParsedFinancialData | null>(null);
  const [cfoData, setCfoData] = useState<ParsedFinancialData | null>(null);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      setLoadingDashboard(true);
      const dashboard = await getCompanyDashboard();
      setProfileData(dashboard.profile);
      setKpi({
        fundingRequired: dashboard.dashboard?.fundingRequired ?? null,
        fundingRaised: dashboard.dashboard?.fundingRaised ?? null,
        activeInvestors: dashboard.dashboard?.activeInvestors ?? null,
        verificationStatus: dashboard.dashboard?.verificationStatus ?? null,
        unreadNotifications: dashboard.dashboard?.unreadNotifications ?? null,
      });
      if (dashboard.proposals) {
        setProposals(dashboard.proposals.map((p: any) => ({
          id: p.id,
          investor: p.investor?.fullName || p.investor?.account?.email || "Unknown investor",
          type: p.sharesRequested ? "Share Purchase" : "Investment",
          amount: `₹${Number(p.proposedAmount).toLocaleString("en-IN")}`,
          instrument: p.sharesRequested ? `${p.sharesRequested} shares` : p.fundingOpportunity?.equityOfferedPct ? `${p.fundingOpportunity.equityOfferedPct}% Equity` : "Direct Investment",
          status: p.status,
          submitted: new Date(p.createdAt).toLocaleDateString("en-IN"),
          valuation: p.fundingOpportunity?.valuation ? `₹${Number(p.fundingOpportunity.valuation).toLocaleString("en-IN")}` : "-",
          ownership: p.fundingOpportunity?.equityOfferedPct ? `${p.fundingOpportunity.equityOfferedPct}%` : "-",
        })));
      }
      if (dashboard.notifications) {
        setNotifications(dashboard.notifications.map((n: any) => ({
          id: n.id, type: (n.type || "system").toLowerCase(), message: n.message,
          time: new Date(n.createdAt).toLocaleString("en-IN"), read: n.isRead,
        })));
      }
      if (dashboard.documents) {
        setDocuments(dashboard.documents.map((d: any) => ({
          name: d.fileName, type: d.type,
          size: d.sizeBytes ? `${(d.sizeBytes / 1024).toFixed(0)} KB` : "-",
          status: (d.status || "pending").toLowerCase(),
          uploaded: new Date(d.createdAt).toLocaleDateString("en-IN"), views: 0,
        })));
      }
      if (dashboard.fundingChart) setFundingChart(dashboard.fundingChart);
      if (dashboard.engagementChart) setEngagementChart(dashboard.engagementChart);
      if (dashboard.activityFeed) setActivityFeed(dashboard.activityFeed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => { checkDocuments(); }, []);

  const checkDocuments = async () => {
    try {
      const docs = await getMyDocuments();
      setOnboardingComplete(docs.length > 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setOnboardingComplete(false);
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (loadingDashboard || loadingDocuments) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: isLight ? "#f1f5f9" : C.bg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: C.tealDim, border: `1px solid ${C.tealBorder}` }}
          >
            <Loader2 size={20} className="animate-spin" style={{ color: C.teal }} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <DocumentOnboarding
        user={user}
        onComplete={() => { checkDocuments(); loadDashboard(); }}
      />
    );
  }

  function renderSection() {
    switch (activeNav) {
      case "dashboard":    return <DashboardSection kpi={kpi} proposals={proposals} fundingChart={fundingChart} engagementChart={engagementChart} notifications={notifications} activityFeed={activityFeed} />;
      case "funding":      return <FundingSection kpi={kpi} fundingChart={fundingChart} onRefresh={loadDashboard} />;
      case "proposals":    return <ProposalsSection proposals={proposals} />;
      case "investments":  return <InvestmentsSection />;
      case "updates":      return <UpdatesSection ceoName={profileData?.ceoName} cfoName={profileData?.cfoName} />;
      case "ceo-dashboard":return <CeoDashboard data={ceoData} onParsed={setCeoData} />;
      case "cfo-dashboard":return <CfoDashboard data={cfoData} onParsed={setCfoData} />;
      case "documents":    return <DocumentsSection documents={documents} />;
      case "verification": return <VerificationSection />;
      case "notifications":return <NotificationsSection notifications={notifications} />;
      case "profile":
        return (
          <ProfileSection
            user={{ ...user, name: profileData?.companyName || user.name, company: profileData?.companyName || user.company }}
            profileData={profileData}
          />
        );
      case "settings":     return <SettingsSection />;
      default:             return null;
    }
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden transition-colors duration-300"
      style={{ background: isLight ? "#f1f5f9" : C.bg, fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar
        active={activeNav}
        setActive={setActiveNav}
        user={{ ...user, company: profileData?.companyName || user.company }}
        kpi={kpi}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          section={activeNav}
          user={{ ...user, name: profileData?.companyName || user.name, company: profileData?.companyName || user.company }}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderSection()}
          <div
            className="flex items-center justify-between mt-8 pt-4 border-t text-[9px] font-mono"
            style={{ borderColor: C.border, color: C.textDim }}
          >
            <span>DNH Capital · Company Dashboard v2.6.0</span>
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
  const [theme, setTheme] = useState<ThemeName>("light");
  const colors = theme === "dark" ? DARK : LIGHT;
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      <AppInner />
    </ThemeContext.Provider>
  );
}