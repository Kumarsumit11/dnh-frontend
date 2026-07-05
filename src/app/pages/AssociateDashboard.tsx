import { useState, useMemo } from "react";
import {
  LayoutDashboard, Briefcase, Users, Building2, Calendar,
  ClipboardCheck, DollarSign, Activity, Settings, Bell,
  Sun, Moon, Search, ChevronRight, TrendingUp, Filter,
  ArrowUpRight, ArrowDownRight, Eye, X, FileText, Upload,
  CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown,
  BarChart3, PieChart, LogOut, User, Menu, ChevronLeft,
  Mail, Phone, MapPin, Plus, Download, SortAsc, Banknote,
  Target, Award, Layers, AlertTriangle, RefreshCw, MoreHorizontal
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart as RPieChart,
  Pie, Cell, AreaChart, Area
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | "Initial Documents" | "Call with Client" | "Mandate"
  | "Meeting with Fund House" | "Fund House Visit" | "Term Sheet"
  | "DD - Legal" | "DD - Finance" | "DD - Title" | "DD - Valuation"
  | "IC" | "Sanction" | "Disbursement" | "Fees Received";

type Status = "completed" | "active" | "pending" | "delayed";

interface Deal {
  id: string;
  client: string;
  company: string;
  amountAsked: number;
  currentStage: Stage;
  termSheetAmount: number | null;
  sanctionAmount: number | null;
  irr: number | null;
  fundHouse: string;
  lastUpdated: string;
  status: Status;
  sector: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  notes: string[];
  documents: string[];
  meetings: { date: string; with: string; summary: string }[];
  ddChecklist: { item: string; done: boolean; category: string }[];
  activityLog: { date: string; action: string; by: string }[];
  nextAction: string;
  stageHistory: { stage: Stage; date: string; status: Status }[];
}

type View = "dashboard" | "deals" | "clients" | "fundHouses" | "meetings"
  | "dueDiligence" | "fees" | "activity" | "settings" | "dealDetail";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { label: string; key: string; isDD?: boolean; subStages?: string[] }[] = [
  { label: "Initial Documents", key: "Initial Documents" },
  { label: "Call with Client", key: "Call with Client" },
  { label: "Mandate", key: "Mandate" },
  { label: "Meeting with Fund House", key: "Meeting with Fund House" },
  { label: "Fund House Visit", key: "Fund House Visit" },
  { label: "Term Sheet", key: "Term Sheet" },
  { label: "DD", key: "DD", isDD: true, subStages: ["Legal", "Finance", "Title", "Valuation"] },
  { label: "IC", key: "IC" },
  { label: "Sanction", key: "Sanction" },
  { label: "Disbursement", key: "Disbursement" },
  { label: "Fees Received", key: "Fees Received" },
];

const FUND_HOUSES = ["Axis Finance", "Tata Capital", "Aditya Birla Finance", "HDFC Capital", "Piramal Finance", "Kotak Mahindra"];
const SECTORS = ["Real Estate", "Manufacturing", "Healthcare", "Logistics", "FMCG", "Technology"];

const DEALS: Deal[] = [
  {
    id: "D001", client: "Rajesh Mehta", company: "Mehta Infrastructure Pvt Ltd",
    amountAsked: 120, currentStage: "DD - Finance", termSheetAmount: 110, sanctionAmount: null,
    irr: 14.5, fundHouse: "Axis Finance", lastUpdated: "2026-06-28", status: "active",
    sector: "Real Estate", city: "Mumbai", contactEmail: "r.mehta@mehtainfra.com",
    contactPhone: "+91 98765 43210",
    notes: ["Client has strong balance sheet", "Property valuation pending from CBRE"],
    documents: ["CIM.pdf", "Audited Financials FY25.pdf", "Property Title Deed.pdf", "LOI.pdf"],
    meetings: [
      { date: "2026-06-15", with: "Axis Finance Credit Team", summary: "Discussed project details and financial projections" },
      { date: "2026-06-01", with: "Rajesh Mehta", summary: "Initial mandate discussion, terms agreed" },
    ],
    ddChecklist: [
      { item: "Legal entity verification", done: true, category: "Legal" },
      { item: "Title search report", done: false, category: "Legal" },
      { item: "Audited financials review", done: true, category: "Finance" },
      { item: "Cash flow analysis", done: true, category: "Finance" },
      { item: "Property valuation", done: false, category: "Valuation" },
      { item: "Encumbrance certificate", done: false, category: "Title" },
    ],
    activityLog: [
      { date: "2026-06-28", action: "DD Finance stage initiated", by: "Priya Sharma" },
      { date: "2026-06-20", action: "Term sheet signed by client", by: "Priya Sharma" },
      { date: "2026-06-15", action: "Fund house meeting completed", by: "Amit Verma" },
    ],
    nextAction: "Obtain valuation report from CBRE by July 10",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-04-01", status: "completed" },
      { stage: "Call with Client", date: "2026-04-10", status: "completed" },
      { stage: "Mandate", date: "2026-04-20", status: "completed" },
      { stage: "Meeting with Fund House", date: "2026-05-05", status: "completed" },
      { stage: "Fund House Visit", date: "2026-05-20", status: "completed" },
      { stage: "Term Sheet", date: "2026-06-10", status: "completed" },
      { stage: "DD - Legal", date: "2026-06-20", status: "active" },
      { stage: "DD - Finance", date: "2026-06-22", status: "active" },
      { stage: "DD - Title", date: "2026-06-25", status: "pending" },
      { stage: "DD - Valuation", date: "2026-06-25", status: "pending" },
      { stage: "IC", date: "", status: "pending" },
      { stage: "Sanction", date: "", status: "pending" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D002", client: "Sunita Agarwal", company: "Agarwal Logistics Ltd",
    amountAsked: 75, currentStage: "Term Sheet", termSheetAmount: 70, sanctionAmount: null,
    irr: 13.2, fundHouse: "Tata Capital", lastUpdated: "2026-06-25", status: "active",
    sector: "Logistics", city: "Delhi", contactEmail: "s.agarwal@agarwallog.com",
    contactPhone: "+91 98112 33445",
    notes: ["Strong fleet operations", "Needs refinancing for warehouse expansion"],
    documents: ["CIM.pdf", "Fleet List.pdf", "Financials FY24-25.pdf"],
    meetings: [{ date: "2026-06-20", with: "Tata Capital", summary: "Term sheet terms negotiated" }],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-25", action: "Term sheet issued", by: "Amit Verma" }],
    nextAction: "Client to sign term sheet by July 5",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-04-15", status: "completed" },
      { stage: "Call with Client", date: "2026-04-22", status: "completed" },
      { stage: "Mandate", date: "2026-05-01", status: "completed" },
      { stage: "Meeting with Fund House", date: "2026-05-18", status: "completed" },
      { stage: "Fund House Visit", date: "2026-06-02", status: "completed" },
      { stage: "Term Sheet", date: "2026-06-20", status: "active" },
      { stage: "DD - Legal", date: "", status: "pending" },
      { stage: "DD - Finance", date: "", status: "pending" },
      { stage: "DD - Title", date: "", status: "pending" },
      { stage: "DD - Valuation", date: "", status: "pending" },
      { stage: "IC", date: "", status: "pending" },
      { stage: "Sanction", date: "", status: "pending" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D003", client: "Vikram Singh", company: "Singh Healthcare Systems",
    amountAsked: 200, currentStage: "Sanction", termSheetAmount: 185, sanctionAmount: 180,
    irr: 15.0, fundHouse: "HDFC Capital", lastUpdated: "2026-06-30", status: "active",
    sector: "Healthcare", city: "Bangalore", contactEmail: "v.singh@singhhealth.com",
    contactPhone: "+91 99001 23456",
    notes: ["Sanction letter received", "Disbursement expected July 15"],
    documents: ["Sanction Letter.pdf", "CIM.pdf", "Financials.pdf"],
    meetings: [{ date: "2026-06-28", with: "HDFC Capital IC", summary: "IC approval received" }],
    ddChecklist: [
      { item: "Legal entity verification", done: true, category: "Legal" },
      { item: "Title search report", done: true, category: "Legal" },
      { item: "Audited financials review", done: true, category: "Finance" },
      { item: "Property valuation", done: true, category: "Valuation" },
    ],
    activityLog: [{ date: "2026-06-30", action: "Sanction received from HDFC Capital", by: "Priya Sharma" }],
    nextAction: "Coordinate disbursement documentation",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-02-01", status: "completed" },
      { stage: "Call with Client", date: "2026-02-10", status: "completed" },
      { stage: "Mandate", date: "2026-02-20", status: "completed" },
      { stage: "Meeting with Fund House", date: "2026-03-05", status: "completed" },
      { stage: "Fund House Visit", date: "2026-03-20", status: "completed" },
      { stage: "Term Sheet", date: "2026-04-10", status: "completed" },
      { stage: "DD - Legal", date: "2026-04-20", status: "completed" },
      { stage: "DD - Finance", date: "2026-04-25", status: "completed" },
      { stage: "DD - Title", date: "2026-05-01", status: "completed" },
      { stage: "DD - Valuation", date: "2026-05-10", status: "completed" },
      { stage: "IC", date: "2026-06-01", status: "completed" },
      { stage: "Sanction", date: "2026-06-28", status: "active" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D004", client: "Neha Kapoor", company: "Kapoor Real Estate Dev",
    amountAsked: 95, currentStage: "Meeting with Fund House", termSheetAmount: null, sanctionAmount: null,
    irr: null, fundHouse: "Piramal Finance", lastUpdated: "2026-06-22", status: "pending",
    sector: "Real Estate", city: "Pune", contactEmail: "n.kapoor@kapoordev.com",
    contactPhone: "+91 97654 32109",
    notes: ["Residential project in Baner, Pune"],
    documents: ["CIM.pdf", "Project Plan.pdf"],
    meetings: [{ date: "2026-06-22", with: "Piramal Finance", summary: "Initial credit discussion" }],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-22", action: "Meeting with Piramal Finance scheduled", by: "Rahul Joshi" }],
    nextAction: "Share additional project details with Piramal",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-05-15", status: "completed" },
      { stage: "Call with Client", date: "2026-05-22", status: "completed" },
      { stage: "Mandate", date: "2026-06-01", status: "completed" },
      { stage: "Meeting with Fund House", date: "2026-06-22", status: "active" },
      { stage: "Fund House Visit", date: "", status: "pending" },
      { stage: "Term Sheet", date: "", status: "pending" },
      { stage: "DD - Legal", date: "", status: "pending" },
      { stage: "DD - Finance", date: "", status: "pending" },
      { stage: "DD - Title", date: "", status: "pending" },
      { stage: "DD - Valuation", date: "", status: "pending" },
      { stage: "IC", date: "", status: "pending" },
      { stage: "Sanction", date: "", status: "pending" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D005", client: "Arvind Sharma", company: "Sharma Manufacturing Co",
    amountAsked: 55, currentStage: "Mandate", termSheetAmount: null, sanctionAmount: null,
    irr: null, fundHouse: "Aditya Birla Finance", lastUpdated: "2026-06-18", status: "delayed",
    sector: "Manufacturing", city: "Ahmedabad", contactEmail: "a.sharma@sharmamc.com",
    contactPhone: "+91 98234 56789",
    notes: ["Client delayed submitting GSTIN docs", "Follow up needed"],
    documents: ["CIM.pdf"],
    meetings: [],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-18", action: "Mandate signed but docs pending", by: "Amit Verma" }],
    nextAction: "Chase client for pending documents",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-05-20", status: "completed" },
      { stage: "Call with Client", date: "2026-05-28", status: "completed" },
      { stage: "Mandate", date: "2026-06-10", status: "delayed" },
      { stage: "Meeting with Fund House", date: "", status: "pending" },
      { stage: "Fund House Visit", date: "", status: "pending" },
      { stage: "Term Sheet", date: "", status: "pending" },
      { stage: "DD - Legal", date: "", status: "pending" },
      { stage: "DD - Finance", date: "", status: "pending" },
      { stage: "DD - Title", date: "", status: "pending" },
      { stage: "DD - Valuation", date: "", status: "pending" },
      { stage: "IC", date: "", status: "pending" },
      { stage: "Sanction", date: "", status: "pending" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D006", client: "Pooja Nair", company: "Nair Hospitality Group",
    amountAsked: 150, currentStage: "Disbursement", termSheetAmount: 145, sanctionAmount: 140,
    irr: 16.0, fundHouse: "Kotak Mahindra", lastUpdated: "2026-06-29", status: "active",
    sector: "Real Estate", city: "Kochi", contactEmail: "p.nair@nairhospitality.com",
    contactPhone: "+91 99876 54321",
    notes: ["Hotel project - first tranche disbursement pending"],
    documents: ["Disbursement Request.pdf", "Sanction Letter.pdf"],
    meetings: [],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-29", action: "Disbursement request submitted", by: "Priya Sharma" }],
    nextAction: "Confirm bank account details for disbursement",
    stageHistory: [
      { stage: "Initial Documents", date: "2025-12-01", status: "completed" },
      { stage: "Call with Client", date: "2025-12-10", status: "completed" },
      { stage: "Mandate", date: "2025-12-20", status: "completed" },
      { stage: "Meeting with Fund House", date: "2026-01-10", status: "completed" },
      { stage: "Fund House Visit", date: "2026-01-25", status: "completed" },
      { stage: "Term Sheet", date: "2026-02-15", status: "completed" },
      { stage: "DD - Legal", date: "2026-03-01", status: "completed" },
      { stage: "DD - Finance", date: "2026-03-05", status: "completed" },
      { stage: "DD - Title", date: "2026-03-08", status: "completed" },
      { stage: "DD - Valuation", date: "2026-03-15", status: "completed" },
      { stage: "IC", date: "2026-04-10", status: "completed" },
      { stage: "Sanction", date: "2026-05-01", status: "completed" },
      { stage: "Disbursement", date: "2026-06-29", status: "active" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D007", client: "Kiran Reddy", company: "Reddy FMCG Ventures",
    amountAsked: 40, currentStage: "Call with Client", termSheetAmount: null, sanctionAmount: null,
    irr: null, fundHouse: "Axis Finance", lastUpdated: "2026-06-26", status: "pending",
    sector: "FMCG", city: "Hyderabad", contactEmail: "k.reddy@reddyfmcg.com",
    contactPhone: "+91 98765 01234",
    notes: ["Early stage - discovery call done"],
    documents: ["Initial Deck.pdf"],
    meetings: [{ date: "2026-06-26", with: "Kiran Reddy", summary: "Discovery call, requirements understood" }],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-26", action: "Discovery call completed", by: "Rahul Joshi" }],
    nextAction: "Send mandate agreement to client",
    stageHistory: [
      { stage: "Initial Documents", date: "2026-06-20", status: "completed" },
      { stage: "Call with Client", date: "2026-06-26", status: "active" },
      { stage: "Mandate", date: "", status: "pending" },
      { stage: "Meeting with Fund House", date: "", status: "pending" },
      { stage: "Fund House Visit", date: "", status: "pending" },
      { stage: "Term Sheet", date: "", status: "pending" },
      { stage: "DD - Legal", date: "", status: "pending" },
      { stage: "DD - Finance", date: "", status: "pending" },
      { stage: "DD - Title", date: "", status: "pending" },
      { stage: "DD - Valuation", date: "", status: "pending" },
      { stage: "IC", date: "", status: "pending" },
      { stage: "Sanction", date: "", status: "pending" },
      { stage: "Disbursement", date: "", status: "pending" },
      { stage: "Fees Received", date: "", status: "pending" },
    ]
  },
  {
    id: "D008", client: "Deepak Joshi", company: "Joshi Tech Park Developers",
    amountAsked: 300, currentStage: "Fees Received", termSheetAmount: 280, sanctionAmount: 275,
    irr: 14.0, fundHouse: "HDFC Capital", lastUpdated: "2026-06-15", status: "completed",
    sector: "Real Estate", city: "Chennai", contactEmail: "d.joshi@joshitechpark.com",
    contactPhone: "+91 99123 45678",
    notes: ["Deal closed successfully - fees collected"],
    documents: ["Fee Receipt.pdf", "Closure Report.pdf"],
    meetings: [],
    ddChecklist: [],
    activityLog: [{ date: "2026-06-15", action: "Fees received - deal closed", by: "Priya Sharma" }],
    nextAction: "Archive deal documents",
    stageHistory: [
      { stage: "Initial Documents", date: "2025-09-01", status: "completed" },
      { stage: "Call with Client", date: "2025-09-10", status: "completed" },
      { stage: "Mandate", date: "2025-09-20", status: "completed" },
      { stage: "Meeting with Fund House", date: "2025-10-05", status: "completed" },
      { stage: "Fund House Visit", date: "2025-10-20", status: "completed" },
      { stage: "Term Sheet", date: "2025-11-10", status: "completed" },
      { stage: "DD - Legal", date: "2025-11-20", status: "completed" },
      { stage: "DD - Finance", date: "2025-11-25", status: "completed" },
      { stage: "DD - Title", date: "2025-11-28", status: "completed" },
      { stage: "DD - Valuation", date: "2025-12-05", status: "completed" },
      { stage: "IC", date: "2026-01-10", status: "completed" },
      { stage: "Sanction", date: "2026-02-01", status: "completed" },
      { stage: "Disbursement", date: "2026-03-15", status: "completed" },
      { stage: "Fees Received", date: "2026-06-15", status: "completed" },
    ]
  },
];

const CHART_STAGE_DATA = [
  { stage: "Init Docs", count: 8 },
  { stage: "Call", count: 7 },
  { stage: "Mandate", count: 6 },
  { stage: "FH Meeting", count: 5 },
  { stage: "FH Visit", count: 5 },
  { stage: "Term Sheet", count: 4 },
  { stage: "DD", count: 3 },
  { stage: "IC", count: 2 },
  { stage: "Sanction", count: 2 },
  { stage: "Disburse", count: 2 },
  { stage: "Fees", count: 1 },
];

const AMOUNT_CHART_DATA = [
  { name: "Mehta Infra", asked: 120, termSheet: 110, sanction: 0 },
  { name: "Singh Health", asked: 200, termSheet: 185, sanction: 180 },
  { name: "Nair Hosp", asked: 150, termSheet: 145, sanction: 140 },
  { name: "Joshi Tech", asked: 300, termSheet: 280, sanction: 275 },
  { name: "Agarwal Log", asked: 75, termSheet: 70, sanction: 0 },
];

const MONTHLY_DISBURSEMENT = [
  { month: "Jan", amount: 45 },
  { month: "Feb", amount: 80 },
  { month: "Mar", amount: 155 },
  { month: "Apr", amount: 60 },
  { month: "May", amount: 120 },
  { month: "Jun", amount: 275 },
];

const FEES_DATA = [
  { month: "Jan", fees: 1.8 },
  { month: "Feb", fees: 2.4 },
  { month: "Mar", fees: 4.65 },
  { month: "Apr", fees: 1.2 },
  { month: "May", fees: 3.6 },
  { month: "Jun", fees: 5.5 },
];

const PIE_DATA = [
  { name: "Real Estate", value: 4, color: "#1D4ED8" },
  { name: "Healthcare", value: 1, color: "#06b6d4" },
  { name: "Logistics", value: 1, color: "#10b981" },
  { name: "Manufacturing", value: 1, color: "#f59e0b" },
  { name: "FMCG", value: 1, color: "#8b5cf6" },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; bg: string; text: string; dot: string; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", icon: CheckCircle2 },
  active: { label: "Active", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", icon: Activity },
  pending: { label: "Pending", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", icon: Clock },
  delayed: { label: "Delayed", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", icon: AlertCircle },
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatCr(n: number | null) {
  if (n === null) return "—";
  return `₹${n} Cr`;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "deals", label: "Deals / Cases", icon: Briefcase },
  { key: "clients", label: "Clients", icon: Users },
  { key: "fundHouses", label: "Fund Houses", icon: Building2 },
  { key: "meetings", label: "Meetings", icon: Calendar },
  { key: "dueDiligence", label: "Due Diligence", icon: ClipboardCheck },
  { key: "fees", label: "Fees", icon: DollarSign },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ active, onNav, collapsed, onToggle }: {
  active: View; onNav: (v: View) => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <aside className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"} shrink-0`}>
      <div className={`flex items-center h-14 border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">CapitalBridge</span>
          </div>
        )}
        {collapsed && (
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="text-muted-foreground hover:text-sidebar-foreground transition-colors p-1 rounded">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key || (active === "dealDetail" && key === "deals");
          return (
            <button
              key={key}
              onClick={() => onNav(key as View)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-border/40 hover:text-sidebar-foreground"
                } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className={isActive ? "text-primary" : ""} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && <ChevronRight size={14} className="ml-auto text-primary opacity-60" />}
            </button>
          );
        })}
      </nav>

      <div className={`p-3 border-t border-sidebar-border`}>
        {collapsed ? (
          <button onClick={onToggle} className="w-full flex justify-center text-muted-foreground hover:text-sidebar-foreground transition-colors p-2 rounded-lg hover:bg-sidebar-border/40">
            <ChevronRight size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">Priya Sharma</p>
              <p className="text-[10px] text-muted-foreground">Associate</p>
            </div>
            <button className="text-muted-foreground hover:text-sidebar-foreground transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ dark, onThemeToggle, onSearch, searchQuery, notifCount }: {
  dark: boolean; onThemeToggle: () => void; onSearch: (q: string) => void; searchQuery: string; notifCount: number;
}) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const NOTIFS = [
    { text: "DD completed for Singh Healthcare", time: "2h ago", type: "success" },
    { text: "Term sheet pending signature - Agarwal Logistics", time: "4h ago", type: "warning" },
    { text: "Sharma Manufacturing docs delayed", time: "1d ago", type: "alert" },
  ];

  return (
    <header className="h-14 flex items-center px-5 gap-4 bg-card border-b border-border shrink-0">
      <div className="flex-1 relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search deals, clients..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title={dark ? "Switch to Light" : "Switch to Dark"}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all relative"
          >
            <Bell size={17} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={() => setShowNotif(false)}><X size={14} className="text-muted-foreground" /></button>
              </div>
              {NOTIFS.map((n, i) => (
                <div key={i} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <p className="text-xs text-foreground">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-all"
          >
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <span className="text-sm font-medium hidden sm:block">Priya Sharma</span>
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>
{showProfile && (
  <div className="absolute right-0 top-10 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
    <div className="px-4 py-3 border-b border-border">
      <p className="text-sm font-semibold">Priya Sharma</p>
      <p className="text-xs text-muted-foreground">
        priya@capitalbridge.in
      </p>
    </div>

    {[
      { label: "Profile", Icon: User },
      { label: "Settings", Icon: Settings },
      { label: "Sign Out", Icon: LogOut },
    ].map(({ label, Icon }) => (
      <button
        key={label}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
      >
        <Icon size={14} className="text-muted-foreground" />
        {label}
      </button>
    ))}
  </div>
)}
          
        </div>
      </div>
    </header>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub?: string; icon: typeof TrendingUp; trend?: number; color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Deal Pipeline ────────────────────────────────────────────────────────────

function DealPipeline({ deals }: { deals: Deal[] }) {
  const stageCounts = useMemo(() => {
    const counts: Record<string, { completed: number; active: number; pending: number; delayed: number }> = {};
    PIPELINE_STAGES.forEach(s => {
      counts[s.key] = { completed: 0, active: 0, pending: 0, delayed: 0 };
      if (s.isDD && s.subStages) {
        s.subStages.forEach(sub => {
          counts[`DD - ${sub}`] = { completed: 0, active: 0, pending: 0, delayed: 0 };
        });
      }
    });
    deals.forEach(d => {
      const k = d.currentStage;
      const baseKey = k.startsWith("DD - ") ? "DD" : k;
      if (counts[baseKey]) counts[baseKey][d.status]++;
    });
    return counts;
  }, [deals]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Deal Pipeline</h3>
        <span className="text-xs text-muted-foreground">{deals.length} total deals</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-max">
          {PIPELINE_STAGES.map((stage, idx) => {
            const counts = stageCounts[stage.key] || { completed: 0, active: 0, pending: 0, delayed: 0 };
            const total = counts.completed + counts.active + counts.pending + counts.delayed;
            const isLast = idx === PIPELINE_STAGES.length - 1;
            const isDD = stage.isDD;

            return (
              <div key={stage.key} className="flex items-center">
                <div className={`flex flex-col rounded-lg border ${isDD ? "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20" : "border-border bg-muted/30"} p-3 min-w-[120px]`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${isDD ? "text-primary" : "text-muted-foreground"}`}>
                    {stage.label}
                  </p>
                  <p className="text-xl font-bold font-mono text-foreground mb-2">{total}</p>
                  <div className="space-y-1">
                    {isDD && stage.subStages && (
                      <div className="mb-2 space-y-0.5">
                        {stage.subStages.map(sub => {
                          const sc = stageCounts[`DD - ${sub}`] || { completed: 0, active: 0, pending: 0, delayed: 0 };
                          const stot = sc.completed + sc.active + sc.pending + sc.delayed;
                          return (
                            <div key={sub} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">{sub}</span>
                              <span className="font-mono font-medium text-foreground">{stot}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {counts.active > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">{counts.active} active</span>
                      </div>
                    )}
                    {counts.completed > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">{counts.completed} done</span>
                      </div>
                    )}
                    {counts.pending > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">{counts.pending} pending</span>
                      </div>
                    )}
                    {counts.delayed > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">{counts.delayed} delayed</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="flex items-center px-1">
                    <ChevronRight size={14} className="text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Deals Table ──────────────────────────────────────────────────────────────

function DealsTable({ deals, onView }: { deals: Deal[]; onView: (d: Deal) => void }) {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fundFilter, setFundFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("lastUpdated");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allStages = Array.from(new Set(deals.map(d => d.currentStage)));

  const filtered = useMemo(() => {
    return deals
      .filter(d =>
        (stageFilter === "all" || d.currentStage === stageFilter) &&
        (statusFilter === "all" || d.status === statusFilter) &&
        (fundFilter === "all" || d.fundHouse === fundFilter) &&
        (!search || d.client.toLowerCase().includes(search.toLowerCase()) || d.company.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        if (sortKey === "amountAsked") return b.amountAsked - a.amountAsked;
        if (sortKey === "lastUpdated") return b.lastUpdated.localeCompare(a.lastUpdated);
        return 0;
      });
  }, [deals, stageFilter, statusFilter, fundFilter, sortKey, search]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-foreground mr-auto">My Active Deals</h3>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-xs bg-muted rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/20 w-40"
          />
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showFilters ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
          <Filter size={12} />
          Filters
        </button>

        <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="px-3 py-1.5 text-xs bg-muted border border-border rounded-lg outline-none">
          <option value="lastUpdated">Sort: Last Updated</option>
          <option value="amountAsked">Sort: Amount</option>
        </select>
      </div>

      {showFilters && (
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex flex-wrap gap-3">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg outline-none">
            <option value="all">All Stages</option>
            {allStages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="delayed">Delayed</option>
          </select>
          <select value={fundFilter} onChange={e => setFundFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg outline-none">
            <option value="all">All Fund Houses</option>
            {FUND_HOUSES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Client / Company", "Amount Asked", "Stage", "Term Sheet", "Sanction", "IRR", "Fund House", "Last Updated", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal, i) => (
              <tr key={deal.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{deal.client}</p>
                  <p className="text-muted-foreground text-[10px]">{deal.company}</p>
                </td>
                <td className="px-4 py-3 font-mono font-medium text-foreground">{formatCr(deal.amountAsked)}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-medium whitespace-nowrap">
                    {deal.currentStage}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-foreground">{formatCr(deal.termSheetAmount)}</td>
                <td className="px-4 py-3 font-mono text-foreground">{formatCr(deal.sanctionAmount)}</td>
                <td className="px-4 py-3 font-mono text-foreground">{deal.irr ? `${deal.irr}%` : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{deal.fundHouse}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{deal.lastUpdated}</td>
                <td className="px-4 py-3"><StatusBadge status={deal.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => onView(deal)} className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors">
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center text-muted-foreground py-10 text-sm">No deals match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const CHART_COLORS = { primary: "#1D4ED8", cyan: "#06b6d4", green: "#10b981", amber: "#f59e0b", red: "#ef4444" };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Deals by Stage">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={CHART_STAGE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="stage" tick={{ fontSize: 9 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
            <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Amount Asked vs Term Sheet vs Sanction (₹ Cr)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={AMOUNT_CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="asked" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Asked" />
            <Bar dataKey="termSheet" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} name="Term Sheet" />
            <Bar dataKey="sanction" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="Sanction" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Disbursement (₹ Cr)">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={MONTHLY_DISBURSEMENT} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
            <Area type="monotone" dataKey="amount" stroke={CHART_COLORS.primary} fill="url(#disbGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Fees Received (₹ Cr)">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={FEES_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="feesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
            <Area type="monotone" dataKey="fees" stroke={CHART_COLORS.green} fill="url(#feesGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ deals, onView }: { deals: Deal[]; onView: (d: Deal) => void }) {
  const totalAmountAsked = deals.reduce((s, d) => s + d.amountAsked, 0);
  const termSheetTotal = deals.filter(d => d.termSheetAmount).reduce((s, d) => s + (d.termSheetAmount || 0), 0);
  const sanctionTotal = deals.filter(d => d.sanctionAmount).reduce((s, d) => s + (d.sanctionAmount || 0), 0);
  const activeDeals = deals.filter(d => d.status === "active" || d.status === "pending" || d.status === "delayed");

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Thursday, 3 July 2026</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={13} /> New Deal
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard label="Total Active Deals" value={String(activeDeals.length)} icon={Briefcase} trend={12} color="bg-blue-600" sub="Across all stages" />
        <KPICard label="Total Amount Asked" value={`₹${totalAmountAsked} Cr`} icon={Banknote} trend={8} color="bg-violet-600" />
        <KPICard label="Term Sheet Amount" value={`₹${termSheetTotal} Cr`} icon={FileText} trend={5} color="bg-cyan-600" />
        <KPICard label="Sanction Amount" value={`₹${sanctionTotal} Cr`} icon={CheckCircle2} trend={15} color="bg-emerald-600" />
        <KPICard label="Fees Received" value="₹19.15 Cr" icon={Award} trend={22} color="bg-amber-600" sub="FY 2025-26" />
      </div>

      <DealPipeline deals={deals} />
      <DealsTable deals={deals} onView={onView} />
      <DashboardCharts />
    </div>
  );
}

// ─── Deal Detail View ─────────────────────────────────────────────────────────

const ALL_STAGES_ORDERED: Stage[] = [
  "Initial Documents", "Call with Client", "Mandate", "Meeting with Fund House",
  "Fund House Visit", "Term Sheet",
  "DD - Legal", "DD - Finance", "DD - Title", "DD - Valuation",
  "IC", "Sanction", "Disbursement", "Fees Received"
];

function StageTracker({ history, currentStage }: { history: Deal["stageHistory"]; currentStage: Stage }) {
  const stageMap = Object.fromEntries(history.map(h => [h.stage, h]));
  const ddGroup = ["DD - Legal", "DD - Finance", "DD - Title", "DD - Valuation"];

  const mainStages: Stage[] = [
    "Initial Documents", "Call with Client", "Mandate", "Meeting with Fund House",
    "Fund House Visit", "Term Sheet", "IC", "Sanction", "Disbursement", "Fees Received"
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Process Tracker</h3>
      <div className="space-y-2">
        {mainStages.map((stage, idx) => {
          const info = stageMap[stage];
          const cfg = info ? statusConfig[info.status] : statusConfig.pending;
          const isCurrentOrPast = ALL_STAGES_ORDERED.indexOf(stage) <= ALL_STAGES_ORDERED.indexOf(currentStage);
          const insertDD = stage === "IC";

          return (
            <>
              {insertDD && (
                <div key="dd-group" className="ml-5 border-l-2 border-border pl-4 my-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">Due Diligence Sub-stages</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ddGroup.map(sub => {
                      const dinfo = stageMap[sub as Stage];
                      const dcfg = dinfo ? statusConfig[dinfo.status] : statusConfig.pending;
                      return (
                        <div key={sub} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${dcfg.bg} border-current/10`}>
                          <span className={`size-1.5 rounded-full ${dcfg.dot}`} />
                          <span className={`text-[11px] font-medium ${dcfg.text}`}>{sub.replace("DD - ", "")}</span>
                          {dinfo?.date && <span className="text-[9px] text-muted-foreground ml-auto">{dinfo.date}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div key={stage} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isCurrentOrPast && info ? cfg.bg : "border-border bg-muted/20"}`}>
                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${info && info.status === "completed" ? "bg-emerald-500" : info && info.status === "active" ? "bg-blue-500" : info && info.status === "delayed" ? "bg-red-500" : "bg-border"}`}>
                  {info && info.status === "completed" ? <CheckCircle2 size={12} className="text-white" /> :
                    info && info.status === "active" ? <Activity size={12} className="text-white" /> :
                      info && info.status === "delayed" ? <AlertTriangle size={12} className="text-white" /> :
                        <span className="size-1.5 rounded-full bg-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${info ? cfg.text : "text-muted-foreground"}`}>{stage}</p>
                  {info?.date && <p className="text-[10px] text-muted-foreground">{info.date}</p>}
                </div>
                {info && <StatusBadge status={info.status} />}
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}

function DealDetailView({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "docs" | "meetings" | "dd" | "activity">("overview");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "notes", label: "Notes" },
    { key: "docs", label: "Documents" },
    { key: "meetings", label: "Meetings" },
    { key: "dd", label: "DD Checklist" },
    { key: "activity", label: "Activity Log" },
  ] as const;

  const ddByCategory = deal.ddChecklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof deal.ddChecklist>);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="w-px h-4 bg-border" />
        <h1 className="text-base font-semibold text-foreground">{deal.company}</h1>
        <StatusBadge status={deal.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Amount Asked</p>
          <p className="text-xl font-bold font-mono text-foreground mt-1">{formatCr(deal.amountAsked)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Term Sheet</p>
          <p className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">{formatCr(deal.termSheetAmount)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Sanction Amount</p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatCr(deal.sanctionAmount)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">IRR</p>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{deal.irr ? `${deal.irr}%` : "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Client Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Client Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <User size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium text-foreground">{deal.client}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">Company</p><p className="font-medium text-foreground">{deal.company}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{deal.contactEmail}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{deal.contactPhone}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">City</p><p className="font-medium text-foreground">{deal.city}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-muted-foreground shrink-0" />
                <div><p className="text-muted-foreground">Fund House</p><p className="font-medium text-foreground">{deal.fundHouse}</p></div>
              </div>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Target size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Next Action Required</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">{deal.nextAction}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="border-b border-border flex overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === t.key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "overview" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Deal ID: <span className="font-mono font-medium text-foreground">{deal.id}</span></p>
                  <p className="text-xs text-muted-foreground">Sector: <span className="font-medium text-foreground">{deal.sector}</span></p>
                  <p className="text-xs text-muted-foreground">Current Stage: <span className="font-medium text-foreground">{deal.currentStage}</span></p>
                  <p className="text-xs text-muted-foreground">Last Updated: <span className="font-medium text-foreground">{deal.lastUpdated}</span></p>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-2">
                  {deal.notes.length === 0 && <p className="text-xs text-muted-foreground">No notes added.</p>}
                  {deal.notes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
                      <FileText size={12} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground">{n}</p>
                    </div>
                  ))}
                  <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1">
                    <Plus size={12} /> Add Note
                  </button>
                </div>
              )}

              {activeTab === "docs" && (
                <div className="space-y-2">
                  {deal.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-primary" />
                        <span className="text-xs text-foreground font-medium">{d}</span>
                      </div>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <Download size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 border border-dashed border-primary/40 rounded-lg px-3 py-2 w-full justify-center">
                    <Upload size={12} /> Upload Document
                  </button>
                </div>
              )}

              {activeTab === "meetings" && (
                <div className="space-y-2">
                  {deal.meetings.length === 0 && <p className="text-xs text-muted-foreground">No meetings recorded.</p>}
                  {deal.meetings.map((m, i) => (
                    <div key={i} className="p-3 bg-muted/40 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{m.with}</span>
                        <span className="text-[10px] text-muted-foreground">{m.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.summary}</p>
                    </div>
                  ))}
                  <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1">
                    <Plus size={12} /> Log Meeting
                  </button>
                </div>
              )}

              {activeTab === "dd" && (
                <div className="space-y-3">
                  {Object.keys(ddByCategory).length === 0 && <p className="text-xs text-muted-foreground">DD checklist not yet started.</p>}
                  {Object.entries(ddByCategory).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">{cat}</p>
                      <div className="space-y-1.5">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-500 border-emerald-500" : "border-border"}`}>
                              {item.done && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <span className={`text-xs ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-2">
                  {deal.activityLog.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity size={10} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-foreground">{a.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.by} · {a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <StageTracker history={deal.stageHistory} currentStage={deal.currentStage} />
        </div>
      </div>
    </div>
  );
}

// ─── Simple placeholder views ─────────────────────────────────────────────────

function PlaceholderView({ title, icon: Icon }: { title: string; icon: typeof LayoutDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <Icon size={28} className="text-primary" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">This section is under construction.</p>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function AssociateDashboard() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleThemeToggle = () => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setView("dealDetail");
  };

  const handleBack = () => {
    setSelectedDeal(null);
    setView("deals");
  };

  const handleNav = (v: View) => {
    setView(v);
    if (v !== "dealDetail") setSelectedDeal(null);
  };

  const filteredDeals = useMemo(() =>
    searchQuery
      ? DEALS.filter(d =>
        d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.currentStage.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : DEALS,
    [searchQuery]
  );

  const renderView = () => {
    if (view === "dealDetail" && selectedDeal) return <DealDetailView deal={selectedDeal} onBack={handleBack} />;
    if (view === "dashboard") return <DashboardView deals={filteredDeals} onView={handleViewDeal} />;
    if (view === "deals") return (
      <div className="p-5 space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Deals / Cases</h1>
        <DealsTable deals={filteredDeals} onView={handleViewDeal} />
      </div>
    );
    if (view === "clients") return <PlaceholderView title="Clients" icon={Users} />;
    if (view === "fundHouses") return <PlaceholderView title="Fund Houses" icon={Building2} />;
    if (view === "meetings") return <PlaceholderView title="Meetings" icon={Calendar} />;
    if (view === "dueDiligence") return <PlaceholderView title="Due Diligence" icon={ClipboardCheck} />;
    if (view === "fees") return <PlaceholderView title="Fees" icon={DollarSign} />;
    if (view === "activity") return <PlaceholderView title="Activity" icon={Activity} />;
    if (view === "settings") return <PlaceholderView title="Settings" icon={Settings} />;
    return null;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      <Sidebar
        active={view}
        onNav={handleNav}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          dark={dark}
          onThemeToggle={handleThemeToggle}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          notifCount={3}
        />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
