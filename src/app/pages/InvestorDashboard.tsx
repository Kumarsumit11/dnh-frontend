import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Building2, Lightbulb, FileText, TrendingUp,
  Bell, User, Settings, ChevronLeft, ChevronRight, Sun, Moon,
  Search, ArrowUpRight, MoreHorizontal,
  CheckCircle2, Clock, Bookmark, Download, Upload, Shield,
  Globe, ExternalLink, DollarSign, BarChart3,
  X, Menu, Plus, RefreshCw, AlertCircle, Loader2, Send,
  Save, Trash2,
} from "lucide-react";

import { getCompanyUpdatesForCompany, type CompanyUpdate } from "../../api/company-update";
import { Megaphone } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// NOTE ON IMPORT PATHS
// Adjust the relative paths below ("./axios", "./investment", etc.) so they
// match wherever those files actually live in your project.
// ─────────────────────────────────────────────────────────────────────────────
import {
  getMyProposals,
  getMyInvestments,
  createProposal,
  type Proposal as ApiProposal,
  type Investment as ApiInvestment,
} from "../../api/investment";
import {
  getActiveFundingOpportunities,
  type FundingOpportunity,
} from "../../api/funding";
import { getMyDocuments, uploadDocument, deleteDocument } from "../../api/document";
import {
  getInvestorProfile,
  updateInvestorProfile,
  uploadInvestorAvatar,
  type UpdateInvestorProfileData,
} from "../../api/profile";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationData,
} from "../../api/notification";

// ─── UI Types (what the dashboard renders) ────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number };

export type Company = {
  id: string;
  fundingOpportunityId: string;
  name: string;
  sector: string;
  stage: string;
  valuation: string;
  raised: string;
  growth?: number;
  location: string;
  match?: number;
  logo: string;
  color: string;
  description: string;
  founded: string;
  employees: string;
  revenue: string;
  website: string;
};

export type InvestmentRow = {
  id: string;
  company: string;
  sector: string;
  invested: string;
  currentValue: string;
  roi?: number;
  stage: string;
  date: string;
  status: "active" | "exited" | "monitoring";
  logo: string;
  color: string;
};

export type ProposalRow = {
  id: string;
  company: string;
  amount: string;
  stage: string;
  status: string;
  date: string;
};

export type DocumentRow = {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "ready" | "pending" | "rejected";
  fileUrl?: string;
};

// Mirrors the InvestorProfile Prisma model — no invented fields.
export type InvestorProfile = {
  initials: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string | null;
  investmentRangeMin?: number | null;
  investmentRangeMax?: number | null;
  preferredIndustries: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

const PALETTE = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name: string) {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}

function fmtMoney(n: unknown) {
  const num = Number(n);
  if (!n || Number.isNaN(num)) return "—";
  return `$${num.toLocaleString()}`;
}

function fmtDate(d: unknown) {
  if (!d) return "—";
  const date = new Date(d as string);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function extractErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.message || anyErr?.message || "Something went wrong. Please try again.";
}

// ─── Generic data-fetching hook (backed by the real API) ─────────────────────

function useApiCall<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ─── Real data hooks ───────────────────────────────────────────────────────────

function mapCompany(fo: FundingOpportunity & { company?: any }): Company {
  const companyInfo = (fo as any).company ?? {};
  const name = companyInfo.name ?? fo.title ?? "Unnamed Opportunity";
  const sharesSold = (fo as any).sharesSold ?? 0;
  const pricePerShare = fo.pricePerShare ?? 0;
  const raisedSoFar = sharesSold && pricePerShare ? sharesSold * pricePerShare : undefined;

  return {
    id: fo.id,
    fundingOpportunityId: fo.id,
    name,
    sector: companyInfo.sector ?? "—",
    stage: fo.status ?? "—",
    valuation: fo.valuation ? fmtMoney(fo.valuation) : "—",
    raised: raisedSoFar !== undefined ? fmtMoney(raisedSoFar) : fmtMoney(fo.fundNeeded),
    location: companyInfo.location ?? companyInfo.city ?? "—",
    logo: initialsFor(name),
    color: colorFor(fo.id),
    description: fo.description ?? "No description provided.",
    founded: companyInfo.foundedYear ? String(companyInfo.foundedYear) : "—",
    employees: companyInfo.employeeCount ? String(companyInfo.employeeCount) : "—",
    revenue: companyInfo.revenue ? fmtMoney(companyInfo.revenue) : "—",
    website: companyInfo.website ?? "—",
  };
}

function useFundingOpportunities() {
  return useApiCall<Company[]>(async () => {
    const list = await getActiveFundingOpportunities();
    return (list ?? []).map(mapCompany);
  }, []);
}

function mapInvestmentStatus(status: ApiInvestment["status"]): InvestmentRow["status"] {
  if (status === "COMPLETED") return "exited";
  if (status === "CONFIRMED") return "active";
  return "monitoring"; // PENDING / CANCELLED fall back here rather than being hidden
}

function mapInvestment(inv: ApiInvestment): InvestmentRow {
  const fo: any = inv.fundingOpportunity ?? {};
  const companyInfo = fo.company ?? {};
  const name = companyInfo.name ?? fo.title ?? "Unknown company";
  const amount = Number(inv.amount) || 0;
  return {
    id: inv.id,
    company: name,
    sector: companyInfo.sector ?? "—",
    invested: fmtMoney(amount),
    // The backend doesn't yet track live valuation changes, so current value
    // mirrors the invested amount until that data exists.
    currentValue: fmtMoney(amount),
    stage: fo.status ?? "—",
    date: fmtDate(inv.createdAt),
    status: mapInvestmentStatus(inv.status),
    logo: initialsFor(name),
    color: colorFor(inv.id),
  };
}

function useMyInvestments() {
  return useApiCall<InvestmentRow[]>(async () => {
    const list = await getMyInvestments();
    return (list ?? []).map(mapInvestment);
  }, []);
}

function mapProposalStatus(status: ApiProposal["status"]): string {
  switch (status) {
    case "PENDING": return "Under Review";
    case "ACCEPTED": return "Term Sheet";
    case "REJECTED": return "Rejected";
    case "WITHDRAWN": return "Withdrawn";
    default: return status;
  }
}

function mapProposal(p: ApiProposal): ProposalRow {
  const fo: any = p.fundingOpportunity ?? {};
  const companyInfo = fo.company ?? {};
  return {
    id: p.id,
    company: companyInfo.name ?? fo.title ?? "Unknown company",
    amount: fmtMoney(p.proposedAmount),
    stage: fo.status ?? "—",
    status: mapProposalStatus(p.status),
    date: fmtDate(p.createdAt),
  };
}

function useMyProposals() {
  return useApiCall<ProposalRow[]>(async () => {
    const list = await getMyProposals();
    return (list ?? []).map(mapProposal);
  }, []);
}

// DocumentStatus enum is PENDING | VERIFIED | REJECTED — there is no
// "APPROVED" status in the schema, which is why documents never showed
// as ready before.
function mapDocumentStatus(status: string): DocumentRow["status"] {
  const s = (status || "").toUpperCase();
  if (s === "VERIFIED") return "ready";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

function useMyDocuments() {
  return useApiCall<DocumentRow[]>(async () => {
    const list = await getMyDocuments();
    return (list ?? []).map((d: any) => ({
      id: d.id,
      // Document model stores this as `fileName`, not `name`/`filename`.
      name: d.fileName ?? "Document",
      type: d.type ?? "—",
      date: fmtDate(d.createdAt),
      status: mapDocumentStatus(d.status),
      fileUrl: d.fileUrl,
    }));
  }, []);
}

function useInvestorProfile() {
  return useApiCall<InvestorProfile>(async () => {
    const raw = await getInvestorProfile();
    return {
      initials: initialsFor(raw.fullName),
      fullName: raw.fullName,
      email: raw.account?.email ?? "—",
      phone: raw.account?.phone ?? undefined,
      address: raw.address,
      investmentRangeMin: raw.investmentRangeMin,
      investmentRangeMax: raw.investmentRangeMax,
      preferredIndustries: raw.preferredIndustries ?? [],
      bio: raw.bio,
      avatarUrl: raw.avatarUrl,
      verificationStatus: raw.verificationStatus,
    };
  }, []);
}

function useNotifications() {
  return useApiCall<NotificationData[]>(async () => {
    const list = await getNotifications();
    return list ?? [];
  }, []);
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={20} className="animate-spin text-primary" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
      <AlertCircle size={20} className="text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
        <RefreshCw size={12} />Retry
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 px-4 text-center">
      <MoreHorizontal size={20} className="text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({ children, className = "", dark }: { children: React.ReactNode; className?: string; dark: boolean }) {
  return (
    <div className={`rounded-xl border ${dark ? "bg-card border-border" : "bg-white border-border"} ${className}`}
      style={{ boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.06)" }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-500",
    exited: "bg-blue-500/15 text-blue-500",
    monitoring: "bg-amber-500/15 text-amber-500",
    ready: "bg-emerald-500/15 text-emerald-500",
    pending: "bg-amber-500/15 text-amber-500",
    rejected: "bg-red-500/15 text-red-500",
    "Term Sheet": "bg-emerald-500/15 text-emerald-500",
    "Under Review": "bg-blue-500/15 text-blue-500",
    "Rejected": "bg-red-500/15 text-red-500",
    "Withdrawn": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── KPI Card (no fake trend arrows — only shows a % change when we have one) ─

function KPICard({ title, value, caption, icon: Icon, color, dark }: {
  title: string; value: string | number; caption: string;
  icon: React.ElementType; color: string; dark: boolean;
}) {
  return (
    <Card dark={dark} className="p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</span>
        </div>
        <div className="p-2.5 rounded-lg" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </Card>
  );
}

// ─── Company Card & Modal (with a real, wired-up proposal form) ──────────────

function CompanyCard({ company, dark, onClick }: { company: Company; dark: boolean; onClick: () => void }) {
  return (
    <Card dark={dark} className="p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 hover:border-primary/30">
      <div className="flex items-start justify-between mb-3" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: company.color }}>{company.logo}</div>
          <div>
            <div className="font-semibold text-sm text-foreground">{company.name}</div>
            <div className="text-xs text-muted-foreground">{company.sector} · {company.location}</div>
          </div>
        </div>
        {company.match !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${company.color}18`, color: company.color }}>
            {company.match}% match
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed" onClick={onClick}>{company.description}</p>
      <div className="grid grid-cols-3 gap-2 mb-3" onClick={onClick}>
        {[
          { label: "Valuation", value: company.valuation },
          { label: "Raised", value: company.raised },
          { label: "Growth", value: company.growth !== undefined ? `+${company.growth}%` : "—", green: true },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-lg" style={{ background: dark ? "#ffffff08" : "#f8fafc" }}>
            <div className={`text-xs font-bold ${stat.green ? "text-emerald-500" : "text-foreground"}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#3b82f620", color: "#3b82f6" }}>{company.stage}</span>
        <div className="flex items-center gap-1">
          <button title="Save for later" aria-label="Save for later" className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
            <Bookmark size={13} className="text-muted-foreground" />
          </button>
          <button title="View details" aria-label="View details" className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={e => { e.stopPropagation(); onClick(); }}>
            <ExternalLink size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function CompanyModal({ company, dark, onClose }: { company: Company; dark: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
const [updatesLoading, setUpdatesLoading] = useState(true);

useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      const list = await getCompanyUpdatesForCompany(company.id);

      if (!cancelled) {
        setUpdates(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!cancelled) {
        setUpdatesLoading(false);
      }
    }
  })();

  return () => {
    cancelled = true;
  };
}, [company.id]);

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setResult({ ok: false, text: "Enter a valid proposed amount." });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await createProposal({
        fundingOpportunityId: company.fundingOpportunityId,
        proposedAmount: numericAmount,
        message: message || undefined,
      });
      setResult({ ok: true, text: "Proposal submitted successfully." });
      setAmount("");
      setMessage("");
    } catch (err) {
      setResult({ ok: false, text: extractErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className={`rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${dark ? "bg-card border-border" : "bg-white border-border"}`}
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-base font-bold"
              style={{ background: company.color }}>{company.logo}</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{company.sector} · {company.stage} · {company.location}</p>
            </div>
          </div>
          <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-foreground leading-relaxed">{company.description}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Valuation", value: company.valuation },
              { label: "Total Raised", value: company.raised },
              { label: "Revenue", value: company.revenue },
              { label: "Employees", value: company.employees },
              { label: "Founded", value: company.founded },
              { label: "Growth Rate", value: company.growth !== undefined ? `+${company.growth}% YoY` : "—" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: dark ? "#ffffff08" : "#f8fafc" }}>
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe size={12} /><span>{company.website}</span>
          </div>

          <div className="pt-2 border-t border-border">
  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
    <Megaphone size={14} />
    Company Updates
  </h3>

  {updatesLoading ? (
    <div className="py-6 flex justify-center">
      <Loader2
        size={16}
        className="animate-spin text-muted-foreground"
      />
    </div>
  ) : updates.length > 0 ? (
    <div className="space-y-3">
      {updates.map((u) => (
        <div
          key={u.id}
          className="p-3 rounded-xl border border-border"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {u.authorRole}
            </span>

            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {u.category}
            </span>
          </div>

          <p className="text-sm font-medium text-foreground">
            {u.title}
          </p>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
            {u.content}
          </p>

          <p className="text-[10px] text-muted-foreground/70 mt-2">
            {u.authorName} · {new Date(u.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground">
      No updates posted by this company yet.
    </p>
  )}
</div>

          <div className="pt-2 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Submit a Proposal</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Proposed amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Add any context for the company..."
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`}
                />
              </div>
              {result && (
                <p className={`text-xs font-medium ${result.ok ? "text-emerald-500" : "text-red-500"}`}>{result.text}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: company.color }}>
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? "Submitting..." : "Submit Proposal"}
                </button>
                <button onClick={onClose}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${dark ? "border-border text-foreground hover:bg-muted" : "border-border text-foreground hover:bg-gray-50"}`}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Document Upload Modal ─────────────────────────────────────────────────────

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "KYC", label: "KYC / Identity Verification" },
  { value: "FINANCIAL_STATEMENT", label: "Financial Statement" },
  { value: "AVATAR", label: "Avatar" },
  { value: "OTHER", label: "Other" },
];

function DocumentUploadModal({ dark, onClose, onUploaded }: {
  dark: boolean; onClose: () => void; onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("KYC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) { setError("Please choose a file to upload."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await uploadDocument(file, type);
      onUploaded();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className={`rounded-2xl border w-full max-w-md ${dark ? "bg-card border-border" : "bg-white border-border"}`}
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Upload Document</h3>
          <button onClick={onClose} title="Close" aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Document type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`}>
              {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">File</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {submitting ? "Uploading..." : "Upload"}
            </button>
            <button onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${dark ? "border-border text-foreground hover:bg-muted" : "border-border text-foreground hover:bg-gray-50"}`}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ dark }: { dark: boolean }) {
  const investments = useMyInvestments();
  const proposals = useMyProposals();
  const documents = useMyDocuments();
  const profile = useInvestorProfile();
  const companies = useFundingOpportunities();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const portfolioValue = investments.data
    ? investments.data.reduce((sum, inv) => sum + (Number(inv.invested.replace(/[$,]/g, "")) || 0), 0)
    : null;
  const activeCount = investments.data?.filter(i => i.status === "active").length;
  const openProposalCount = proposals.data?.filter(p => p.status === "Under Review").length;
  const documentCount = documents.data?.length;

  return (
    <div className="space-y-6">
      {selectedCompany && <CompanyModal company={selectedCompany} dark={dark} onClose={() => setSelectedCompany(null)} />}

      {/* KPI Cards — all computed from real data, no invented trend %s */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {investments.loading || proposals.loading || documents.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} dark={dark} className="p-5 h-28 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-20 bg-muted rounded" />
            </Card>
          ))
        ) : (
          <>
            <KPICard title="Portfolio Value" value={portfolioValue !== null ? fmtMoney(portfolioValue) : "—"} caption="sum of your investments" icon={DollarSign} color="#10b981" dark={dark} />
            <KPICard title="Active Investments" value={activeCount ?? "—"} caption="currently confirmed" icon={TrendingUp} color="#3b82f6" dark={dark} />
            <KPICard title="Open Proposals" value={openProposalCount ?? "—"} caption="awaiting response" icon={FileText} color="#8b5cf6" dark={dark} />
            <KPICard title="Documents" value={documentCount ?? "—"} caption="uploaded to your account" icon={Upload} color="#f59e0b" dark={dark} />
          </>
        )}
      </div>

      {/* Investments + Proposals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card dark={dark} className="xl:col-span-2 overflow-hidden">
          <SectionHeader title="My Investments" subtitle="Active portfolio positions" />
          {investments.loading ? <Spinner /> : investments.error ? <ErrorState message={investments.error} onRetry={investments.refetch} /> : investments.data && investments.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${dark ? "bg-muted/30" : "bg-gray-50"}`}>
                    <th className="px-5 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-right">Invested</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.data.slice(0, 6).map(inv => (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: inv.color }}>{inv.logo}</div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{inv.company}</div>
                            <div className="text-[10px] text-muted-foreground">{inv.sector}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{inv.invested}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{inv.date}</td>
                      <td className="px-4 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState label="No investments yet" />}
        </Card>

        <Card dark={dark}>
          <SectionHeader title="Recent Proposals" />
          {proposals.loading ? <Spinner /> : proposals.error ? <ErrorState message={proposals.error} onRetry={proposals.refetch} /> : proposals.data && proposals.data.length > 0 ? (
            <div className="divide-y divide-border">
              {proposals.data.slice(0, 4).map(p => (
                <div key={p.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{p.company}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{p.amount} · {p.date}</div>
                </div>
              ))}
            </div>
          ) : <EmptyState label="No proposals yet" />}
        </Card>
      </div>

      {/* Documents + Profile */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card dark={dark} className="xl:col-span-2">
          <SectionHeader title="Documents" />
          {documents.loading ? <Spinner /> : documents.error ? <ErrorState message={documents.error} onRetry={documents.refetch} /> : documents.data && documents.data.length > 0 ? (
            <div className="divide-y divide-border">
              {documents.data.slice(0, 4).map(d => (
                <div key={d.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.type} · {d.date}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState label="No documents" />}
        </Card>

        <Card dark={dark} className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Investor Profile</h3>
          {profile.loading ? <Spinner /> : profile.error ? <ErrorState message={profile.error} onRetry={profile.refetch} /> : profile.data ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                {profile.data.avatarUrl ? <img src={profile.data.avatarUrl} alt="" className="w-full h-full object-cover" /> : profile.data.initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{profile.data.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{profile.data.email}</div>
                {profile.data.verificationStatus === "VERIFIED" && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield size={11} className="text-primary" />
                    <span className="text-[10px] text-primary font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      {/* Open Funding Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Open Funding Opportunities</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Active rounds you can submit a proposal on</p>
          </div>
        </div>
        {companies.loading ? <Spinner /> : companies.error ? <ErrorState message={companies.error} onRetry={companies.refetch} /> : companies.data && companies.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.data.slice(0, 3).map(c => (
              <CompanyCard key={c.id} company={c} dark={dark} onClick={() => setSelectedCompany(c)} />
            ))}
          </div>
        ) : <EmptyState label="No open funding opportunities right now" />}
      </div>
    </div>
  );
}

// ─── Explore View ─────────────────────────────────────────────────────────────

function ExploreView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useFundingOpportunities();
  const [selected, setSelected] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");

  const sectors = ["All", ...Array.from(new Set((data ?? []).map(c => c.sector).filter(s => s && s !== "—")))];

  const filtered = (data ?? []).filter(c =>
    (sector === "All" || c.sector === sector) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.sector.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {selected && <CompanyModal company={selected} dark={dark} onClose={() => setSelected(null)} />}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border text-sm ${dark ? "bg-muted/50 border-border" : "bg-white border-border"}`}>
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities, sectors..."
            className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none flex-1 text-sm" />
        </div>
        {sectors.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {sectors.map(s => (
              <button key={s} onClick={() => setSector(s)}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-colors border ${sector === s ? "bg-primary text-white border-primary" : dark ? "bg-card border-border text-muted-foreground hover:border-primary/40" : "bg-white border-border text-muted-foreground hover:border-primary/40"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : filtered.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} opportunities found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => <CompanyCard key={c.id} company={c} dark={dark} onClick={() => setSelected(c)} />)}
          </div>
        </>
      ) : <EmptyState label="No opportunities match your search" />}
    </div>
  );
}

// ─── Investments View ─────────────────────────────────────────────────────────

function InvestmentsView({ dark }: { dark: boolean }) {
  const investments = useMyInvestments();

  const totalInvested = investments.data?.reduce((sum, inv) => sum + (Number(inv.invested.replace(/[$,]/g, "")) || 0), 0);
  const exitedCount = investments.data?.filter(i => i.status === "exited").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {investments.loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} dark={dark} className="p-5 h-28 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-20 bg-muted rounded" />
            </Card>
          ))
        ) : investments.data ? (
          <>
            <KPICard title="Total Invested" value={totalInvested !== undefined ? fmtMoney(totalInvested) : "—"} caption="across all positions" icon={DollarSign} color="#10b981" dark={dark} />
            <KPICard title="Active Positions" value={investments.data.filter(i => i.status === "active").length} caption="currently confirmed" icon={TrendingUp} color="#3b82f6" dark={dark} />
            <KPICard title="Exited" value={exitedCount ?? 0} caption="completed positions" icon={BarChart3} color="#8b5cf6" dark={dark} />
          </>
        ) : null}
      </div>

      <Card dark={dark} className="overflow-hidden">
        <SectionHeader title="All Positions" />
        {investments.loading ? <Spinner /> : investments.error ? <ErrorState message={investments.error} onRetry={investments.refetch} /> : investments.data && investments.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${dark ? "bg-muted/30" : "bg-gray-50"}`}>
                  <th className="px-5 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Round Status</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {investments.data.map(inv => (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: inv.color }}>{inv.logo}</div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{inv.company}</div>
                          <div className="text-[10px] text-muted-foreground">{inv.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{inv.stage}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{inv.invested}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-4 text-center"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState label="No investments yet" />}
      </Card>
    </div>
  );
}

// ─── Proposals View ───────────────────────────────────────────────────────────

function ProposalsView({ dark, onNavigate }: { dark: boolean; onNavigate: (id: string) => void }) {
  const { data, loading, error, refetch } = useMyProposals();
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data ? `${data.length} proposals submitted` : ""}</p>
        {/* Previously an alert(); now actually takes the investor somewhere useful. */}
        <button
          onClick={() => onNavigate("explore")}
          className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity">
          <Plus size={13} />New Proposal
        </button>
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data && data.length > 0 ? (
        data.map(p => (
          <Card key={p.id} dark={dark} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{p.company}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">{p.stage} · {p.amount} · Submitted {p.date}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          </Card>
        ))
      ) : <EmptyState label="No proposals submitted yet" />}
    </div>
  );
}

// ─── Documents View ───────────────────────────────────────────────────────────

function DocumentsView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useMyDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      refetch();
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {showUpload && (
        <DocumentUploadModal dark={dark} onClose={() => setShowUpload(false)} onUploaded={refetch} />
      )}
      <Card dark={dark} className="overflow-hidden">
        <SectionHeader title="All Documents" action={
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:opacity-90 transition-opacity">
            <Upload size={12} />Upload
          </button>
        } />
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${dark ? "bg-muted/30" : "bg-gray-50"}`}>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{d.name}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{d.type}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{d.date}</td>
                    <td className="px-4 py-4 text-center"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => d.fileUrl && window.open(d.fileUrl, "_blank")}
                          disabled={!d.fileUrl}
                          title="Download"
                          aria-label="Download document"
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40">
                          <Download size={13} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          title="Delete"
                          aria-label="Delete document"
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40">
                          {deletingId === d.id
                            ? <Loader2 size={13} className="animate-spin text-muted-foreground" />
                            : <Trash2 size={13} className="text-muted-foreground" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState label="No documents uploaded" />}
      </Card>
    </div>
  );
}

// ─── Notifications View ───────────────────────────────────────────────────────

function notifIcon(type: NotificationData["type"]) {
  switch (type) {
    case "PROPOSAL":
      return FileText;

    case "INVESTMENT":
      return TrendingUp;

    case "FUNDING":
      return Building2;

    case "DOCUMENT":
      return Upload;

    case "ACCOUNT":
      return User;

    case "SYSTEM":
      return Bell;

    default:
      return Bell;
  }
}

function NotificationsView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      refetch();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (n: NotificationData) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n.id);
      refetch();
    } catch {
      // silent — user can just click again
    }
  };

  const unreadCount = data?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium disabled:opacity-50">
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark all read
          </button>
        )}
      </div>
      <Card dark={dark} className="overflow-hidden">
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data && data.length > 0 ? (
          <div className="divide-y divide-border">
            {data.map(n => {
              const Icon = notifIcon(n.type);
              return (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-muted/30 transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}>
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: "#3b82f618" }}>
                    <Icon size={14} style={{ color: "#3b82f6" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{fmtDate(n.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : <EmptyState label="No notifications yet" />}
      </Card>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({ dark, onNavigate }: { dark: boolean; onNavigate: (id: string) => void }) {
  const { data, loading, error, refetch } = useInvestorProfile();
  return (
    <div className="space-y-5 max-w-2xl">
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data ? (
        <Card dark={dark} className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {data.avatarUrl ? <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" /> : data.initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{data.fullName}</h2>
                <p className="text-sm text-muted-foreground">{data.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={12} className={data.verificationStatus === "VERIFIED" ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-xs font-medium ${data.verificationStatus === "VERIFIED" ? "text-primary" : "text-muted-foreground"}`}>
                    {data.verificationStatus === "VERIFIED" ? "Verified Accredited Investor" : data.verificationStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => onNavigate("settings")}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:opacity-90 transition-opacity flex-shrink-0">
              <Settings size={12} />Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Address", value: data.address || "—" },
              { label: "Ticket Size", value: data.investmentRangeMin != null && data.investmentRangeMax != null ? `${fmtMoney(data.investmentRangeMin)} – ${fmtMoney(data.investmentRangeMax)}` : "—" },
              { label: "Preferred Industries", value: data.preferredIndustries.length > 0 ? data.preferredIndustries.join(", ") : "—" },
              { label: "Phone", value: data.phone || "—" },
            ].map(f => (
              <div key={f.label}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</div>
                <div className="text-sm text-foreground">{f.value}</div>
              </div>
            ))}
          </div>
          {data.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bio</div>
              <p className="text-sm text-foreground leading-relaxed">{data.bio}</p>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

// ─── Settings View (profile editing + avatar — this is where full name /
// address live, since that's what the InvestorProfile model actually stores) ─

function SettingsView({ dark }: { dark: boolean }) {
  const profile = useInvestorProfile();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [minTicket, setMinTicket] = useState("");
  const [maxTicket, setMaxTicket] = useState("");
  const [industries, setIndustries] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.fullName ?? "");
      setAddress(profile.data.address ?? "");
      setBio(profile.data.bio ?? "");
      setMinTicket(profile.data.investmentRangeMin != null ? String(profile.data.investmentRangeMin) : "");
      setMaxTicket(profile.data.investmentRangeMax != null ? String(profile.data.investmentRangeMax) : "");
      setIndustries((profile.data.preferredIndustries ?? []).join(", "));
    }
  }, [profile.data]);

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const payload: UpdateInvestorProfileData = {
        fullName: fullName || undefined,
        address: address || undefined,
        bio: bio || undefined,
        investmentRangeMin: minTicket ? Number(minTicket) : undefined,
        investmentRangeMax: maxTicket ? Number(maxTicket) : undefined,
        preferredIndustries: industries
          ? industries.split(",").map(s => s.trim()).filter(Boolean)
          : undefined,
      };
      await updateInvestorProfile(payload);
      setSaveResult({ ok: true, text: "Profile updated successfully." });
      profile.refetch();
    } catch (err) {
      setSaveResult({ ok: false, text: extractErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      await uploadInvestorAvatar(avatarFile);
      setAvatarFile(null);
      profile.refetch();
    } catch (err) {
      setSaveResult({ ok: false, text: extractErrorMessage(err) });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (profile.loading) return <Spinner />;
  if (profile.error) return <ErrorState message={profile.error} onRetry={profile.refetch} />;

  return (
    <div className="max-w-2xl space-y-5">
      <Card dark={dark} className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Avatar</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
            {profile.data?.avatarUrl
              ? <img src={profile.data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : initialsFor(profile.data?.fullName ?? "?")}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
            className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary"
          />
          <button onClick={handleAvatarUpload} disabled={!avatarFile || uploadingAvatar}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium disabled:opacity-50 flex-shrink-0">
            {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploadingAvatar ? "Uploading..." : "Upload"}
          </button>
        </div>
      </Card>

      <Card dark={dark} className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Profile Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Min ticket size (USD)</label>
            <input type="number" min="0" value={minTicket} onChange={e => setMinTicket(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Max ticket size (USD)</label>
            <input type="number" min="0" value={maxTicket} onChange={e => setMaxTicket(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Preferred industries (comma-separated)</label>
            <input value={industries} onChange={e => setIndustries(e.target.value)} placeholder="Fintech, Healthtech, SaaS"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none ${dark ? "bg-muted/50 border-border text-foreground" : "bg-white border-border text-foreground"}`} />
          </div>
        </div>
        {saveResult && <p className={`text-xs font-medium ${saveResult.ok ? "text-emerald-500" : "text-red-500"}`}>{saveResult.text}</p>}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </Card>
    </div>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { id: "dashboard",      label: "Dashboard",               icon: LayoutDashboard },
  { id: "explore",        label: "Explore Opportunities",    icon: Building2 },
  { id: "proposals",      label: "My Proposals",             icon: FileText },
  { id: "investments",    label: "My Investments",           icon: TrendingUp },
  { id: "documents",      label: "Documents",                icon: Download },
  { id: "notifications",  label: "Notifications",            icon: Bell },
  { id: "profile",        label: "Profile",                  icon: User },
  { id: "settings",       label: "Settings",                 icon: Settings },
];

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard", explore: "Explore Opportunities",
  proposals: "My Proposals",
  investments: "My Investments", documents: "Documents",
  notifications: "Notifications", profile: "Profile", settings: "Settings",
};

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const proposals = useMyProposals();
  const profile = useInvestorProfile();
  const notifications = useNotifications();

  const badgeFor = (id: string): number | undefined => {
    if (id === "proposals") {
      const count = proposals.data?.filter(p => p.status === "Under Review").length || 0;
      return count > 0 ? count : undefined;
    }
    if (id === "notifications") {
      const count = notifications.data?.filter(n => !n.isRead).length || 0;
      return count > 0 ? count : undefined;
    }
    return undefined;
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-background ${dark ? "dark" : ""}`}>
      {mobileSidebar && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileSidebar(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border
        transition-all duration-300 ease-in-out flex-shrink-0
        ${mobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarOpen ? "w-56" : "w-16"}
        bg-sidebar
      `}
        style={{ boxShadow: dark ? "1px 0 0 rgba(255,255,255,0.04)" : "1px 0 0 rgba(0,0,0,0.06)" }}>
        <div className={`flex items-center h-14 px-4 border-b border-sidebar-border flex-shrink-0 ${sidebarOpen ? "gap-3" : "justify-center"}`}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-primary">
            <img src="/logo.png" alt="DnH FINTECH" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-bold text-sidebar-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DnH FINTECH</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Investor Portal</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            const badge = badgeFor(item.id);
            return (
              <button key={item.id}
                onClick={() => { setActiveNav(item.id); setMobileSidebar(false); }}
                className={`
                  relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150
                  ${sidebarOpen ? "px-3 py-2.5 gap-3" : "justify-center p-2.5"}
                  ${isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"}
                `}
                title={!sidebarOpen ? item.label : undefined}>
                <item.icon size={16} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-xs">{item.label}</span>
                    {badge !== undefined && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold">{badge}</span>
                    )}
                  </>
                )}
                {!sidebarOpen && badge !== undefined && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-full hidden lg:flex items-center justify-center p-2 rounded-xl hover:bg-sidebar-accent/50 text-muted-foreground transition-colors">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex-shrink-0 flex items-center px-5 gap-4 border-b border-border bg-card"
          style={{ boxShadow: dark ? "0 1px 0 rgba(255,255,255,0.04)" : "0 1px 0 rgba(0,0,0,0.05)" }}>
          <button onClick={() => setMobileSidebar(!mobileSidebar)} title="Open menu" aria-label="Open menu" className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu size={16} className="text-muted-foreground" />
          </button>
          <h1 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {pageTitles[activeNav]}
          </h1>
          <div className="flex-1" />
          <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${dark ? "bg-muted/50 border-border" : "bg-muted border-border"}`}>
            <Search size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground">Search...</span>
          </div>
          <button onClick={() => setDark(!dark)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 border-border hover:border-primary/40"
            style={{ background: dark ? "#ffffff08" : "#f0f4f8" }}>
            {dark
              ? <><Sun size={13} className="text-amber-400" /><span className="text-foreground hidden sm:inline">Light</span></>
              : <><Moon size={13} className="text-blue-500" /><span className="text-foreground hidden sm:inline">Dark</span></>
            }
          </button>
          <button onClick={() => setActiveNav("notifications")}
            title="Notifications" aria-label="Notifications"
            className="relative p-2 rounded-xl hover:bg-muted transition-colors border border-border">
            <Bell size={15} className="text-muted-foreground" />
            {(notifications.data?.filter(n => !n.isRead).length ?? 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button onClick={() => setActiveNav("profile")}
            title="Profile" aria-label="Profile"
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:opacity-90 transition-opacity overflow-hidden">
            {profile.data?.avatarUrl ? <img src={profile.data.avatarUrl} alt="" className="w-full h-full object-cover" /> : (profile.data?.initials ?? "—")}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {activeNav === "dashboard"     && <DashboardView dark={dark} />}
          {activeNav === "explore"       && <ExploreView dark={dark} />}
          {activeNav === "proposals"     && <ProposalsView dark={dark} onNavigate={setActiveNav} />}
          {activeNav === "investments"   && <InvestmentsView dark={dark} />}
          {activeNav === "documents"     && <DocumentsView dark={dark} />}
          {activeNav === "notifications" && <NotificationsView dark={dark} />}
          {activeNav === "profile"       && <ProfileView dark={dark} onNavigate={setActiveNav} />}
          {activeNav === "settings"      && <SettingsView dark={dark} />}
        </main>
      </div>
    </div>
  );
}