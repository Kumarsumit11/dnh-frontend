import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Building2, Lightbulb, FileText, TrendingUp,
  Bell, User, Settings, ChevronLeft, ChevronRight, Sun, Moon,
  Search, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  CheckCircle2, Clock, Bookmark, Download, Upload, Shield,
  Globe, Activity, ExternalLink, DollarSign, Users, BarChart3,
  Calendar, X, Menu, Plus, RefreshCw, AlertCircle, Loader2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number };

export type KPIData = {
  portfolioValue: string;
  portfolioChange: number;
  activeInvestments: number;
  investmentsChange: number;
  openProposals: number;
  proposalsChange: number;
  unreadNotifications: number;
  notificationsChange: number;
};

export type PortfolioPoint = { month: string; value: number; benchmark: number };

export type SectorSlice = { name: string; value: number; color: string };

export type ActivityBar = { month: string; deals: number; exits: number };

export type Company = {
  id: number;
  name: string;
  sector: string;
  stage: string;
  valuation: string;
  raised: string;
  growth: number;
  location: string;
  match: number;
  logo: string;
  color: string;
  description: string;
  founded: string;
  employees: string;
  revenue: string;
  website: string;
};

export type Investment = {
  id: number;
  company: string;
  sector: string;
  invested: string;
  currentValue: string;
  roi: number;
  stage: string;
  date: string;
  status: "active" | "exited" | "monitoring";
  logo: string;
  color: string;
};

export type Notification = {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  iconType: "opportunity" | "update" | "document" | "meeting" | "alert";
  color: string;
};

export type Proposal = {
  id: number;
  company: string;
  amount: string;
  stage: string;
  status: string;
  date: string;
  priority: "high" | "medium" | "low";
};

export type Document = {
  name: string;
  type: string;
  date: string;
  status: "ready" | "pending" | "signed";
};

export type TimelineEvent = {
  date: string;
  event: string;
  type: "report" | "proposal" | "deal" | "diligence" | "investment";
};

export type InvestorProfile = {
  initials: string;
  name: string;
  title: string;
  firm: string;
  verified: boolean;
  focus: string;
  checkSize: string;
  stagePreference: string;
  aum: string;
  profileComplete: number;
  profileItems: { label: string; done: boolean }[];
};

// ─── API Hooks ────────────────────────────────────────────────────────────────
// Replace each `fetch` URL with your real backend endpoint.
// All hooks return { data, loading, error, refetch }.

function useApi<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ── REPLACE URL WITH YOUR API ENDPOINT ──────────────────────────────
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Individual hooks — swap the URL strings for your real endpoints
const useKPIs       = () => useApi<KPIData>("/api/investor/kpis");
const usePortfolio  = () => useApi<PortfolioPoint[]>("/api/investor/portfolio/performance");
const useSectors    = () => useApi<SectorSlice[]>("/api/investor/portfolio/sectors");
const useActivity   = () => useApi<ActivityBar[]>("/api/investor/portfolio/activity");
const useCompanies  = () => useApi<Company[]>("/api/companies");
const useInvestments = () => useApi<Investment[]>("/api/investor/investments");
const useNotifications = () => useApi<Notification[]>("/api/investor/notifications");
const useProposals  = () => useApi<Proposal[]>("/api/investor/proposals");
const useDocuments  = () => useApi<Document[]>("/api/investor/documents");
const useTimeline   = () => useApi<TimelineEvent[]>("/api/investor/timeline");
const useProfile    = () => useApi<InvestorProfile>("/api/investor/profile");

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
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
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
    <div className="flex flex-col items-center justify-center py-12 gap-2">
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
    signed: "bg-blue-500/15 text-blue-500",
    "Term Sheet": "bg-emerald-500/15 text-emerald-500",
    "Under Review": "bg-blue-500/15 text-blue-500",
    "Due Diligence": "bg-purple-500/15 text-purple-500",
    "Initial Review": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ title, value, change, changeLabel, icon: Icon, color, dark }: {
  title: string; value: string | number; change: number; changeLabel: string;
  icon: React.ElementType; color: string; dark: boolean;
}) {
  const isPos = change >= 0;
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
      <div className="flex items-center gap-1.5">
        {isPos ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
        <span className={`text-xs font-semibold ${isPos ? "text-emerald-500" : "text-red-500"}`}>{isPos ? "+" : ""}{change}%</span>
        <span className="text-xs text-muted-foreground">{changeLabel}</span>
      </div>
    </Card>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, dark }: { active?: boolean; payload?: any[]; label?: string; dark: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${dark ? "bg-card border-border" : "bg-white border-border"}`}
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
      <div className="font-semibold text-foreground mb-1.5">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-foreground">{typeof p.value === "number" ? `$${p.value}M` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Company Card & Modal ─────────────────────────────────────────────────────

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
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${company.color}18`, color: company.color }}>
          {company.match}% match
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed" onClick={onClick}>{company.description}</p>
      <div className="grid grid-cols-3 gap-2 mb-3" onClick={onClick}>
        {[
          { label: "Valuation", value: company.valuation },
          { label: "Raised", value: company.raised },
          { label: "Growth", value: `+${company.growth}%`, green: true },
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
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
            <Bookmark size={13} className="text-muted-foreground" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={e => { e.stopPropagation(); onClick(); }}>
            <ExternalLink size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function CompanyModal({ company, dark, onClose }: { company: Company; dark: boolean; onClose: () => void }) {
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
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
              { label: "Growth Rate", value: `+${company.growth}% YoY` },
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
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: company.color }}>
              Submit Proposal
            </button>
            <button className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${dark ? "border-border text-foreground hover:bg-muted" : "border-border text-foreground hover:bg-gray-50"}`}>
              Save to Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ dark }: { dark: boolean }) {
  const kpis = useKPIs();
  const portfolio = usePortfolio();
  const sectors = useSectors();
  const investments = useInvestments();
  const notifications = useNotifications();
  const proposals = useProposals();
  const timeline = useTimeline();
  const documents = useDocuments();
  const profile = useProfile();
  const companies = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const iconMap: Record<Notification["iconType"], React.ElementType> = {
    opportunity: Lightbulb, update: TrendingUp, document: FileText,
    meeting: Calendar, alert: AlertCircle,
  };

  return (
    <div className="space-y-6">
      {selectedCompany && <CompanyModal company={selectedCompany} dark={dark} onClose={() => setSelectedCompany(null)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} dark={dark} className="p-5 h-28 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-20 bg-muted rounded" />
            </Card>
          ))
        ) : kpis.error ? (
          <div className="col-span-4"><ErrorState message={kpis.error} onRetry={kpis.refetch} /></div>
        ) : kpis.data ? (
          <>
            <KPICard title="Portfolio Value" value={kpis.data.portfolioValue} change={kpis.data.portfolioChange} changeLabel="vs last quarter" icon={DollarSign} color="#10b981" dark={dark} />
            <KPICard title="Active Investments" value={kpis.data.activeInvestments} change={kpis.data.investmentsChange} changeLabel="vs last year" icon={TrendingUp} color="#3b82f6" dark={dark} />
            <KPICard title="Open Proposals" value={kpis.data.openProposals} change={kpis.data.proposalsChange} changeLabel="vs last month" icon={FileText} color="#8b5cf6" dark={dark} />
            <KPICard title="Notifications" value={kpis.data.unreadNotifications} change={kpis.data.notificationsChange} changeLabel="this week" icon={Bell} color="#f59e0b" dark={dark} />
          </>
        ) : null}
      </div>

      {/* Portfolio Chart + Sector Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card dark={dark} className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground">Portfolio Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total value vs benchmark</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-primary inline-block" />Portfolio</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-accent inline-block" />Benchmark</span>
            </div>
          </div>
          {portfolio.loading ? <Spinner /> : portfolio.error ? <ErrorState message={portfolio.error} onRetry={portfolio.refetch} /> : portfolio.data && portfolio.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={portfolio.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#ffffff08" : "#00000008"} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7f9a" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7f9a" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                <Tooltip content={(props) => <ChartTooltip {...props} dark={dark} />} />
                <Area type="monotone" dataKey="value" name="Portfolio" stroke="#10b981" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                <Area type="monotone" dataKey="benchmark" name="Benchmark" stroke="#3b82f6" strokeWidth={1.5} fill="url(#benchGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No performance data available" />}
        </Card>

        <Card dark={dark} className="p-5">
          <h3 className="font-semibold text-foreground mb-1">Sector Allocation</h3>
          <p className="text-xs text-muted-foreground mb-4">By portfolio value</p>
          {sectors.loading ? <Spinner /> : sectors.error ? <ErrorState message={sectors.error} onRetry={sectors.refetch} /> : sectors.data && sectors.data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <RechartsPie>
                  <Pie data={sectors.data} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0} paddingAngle={2}>
                    {sectors.data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sectors.data.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState label="No sector data available" />}
        </Card>
      </div>

      {/* Investments Table + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card dark={dark} className="xl:col-span-2 overflow-hidden">
          <SectionHeader title="My Investments" subtitle="Active portfolio positions" action={
            <button className="text-xs text-primary font-medium hover:underline">View all</button>
          } />
          {investments.loading ? <Spinner /> : investments.error ? <ErrorState message={investments.error} onRetry={investments.refetch} /> : investments.data && investments.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${dark ? "bg-muted/30" : "bg-gray-50"}`}>
                    <th className="px-5 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-right">Invested</th>
                    <th className="px-4 py-3 text-right">Current Value</th>
                    <th className="px-4 py-3 text-right">ROI</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.data.map(inv => (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: inv.color }}>{inv.logo}</div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{inv.company}</div>
                            <div className="text-[10px] text-muted-foreground">{inv.sector} · {inv.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{inv.invested}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{inv.currentValue}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-sm font-semibold ${inv.roi >= 0 ? "text-emerald-500" : "text-red-500"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {inv.roi >= 0 ? "+" : ""}{inv.roi}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState label="No investments yet" />}
        </Card>

        <Card dark={dark}>
          <SectionHeader title="Notifications" action={
            notifications.data && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
              {notifications.data.filter(n => !n.read).length} new
            </span>
          } />
          {notifications.loading ? <Spinner /> : notifications.error ? <ErrorState message={notifications.error} onRetry={notifications.refetch} /> : notifications.data && notifications.data.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.data.slice(0, 4).map(n => {
                const Icon = iconMap[n.iconType] ?? Bell;
                return (
                  <div key={n.id} className={`px-4 py-3.5 hover:bg-muted/30 transition-colors ${n.read ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ background: `${n.color}18` }}>
                        <Icon size={12} style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-foreground truncate">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.desc}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState label="No notifications" />}
        </Card>
      </div>

      {/* Proposals + Timeline + Documents/Profile */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card dark={dark}>
          <SectionHeader title="Recent Proposals" action={<button className="text-xs text-primary font-medium hover:underline">View all</button>} />
          {proposals.loading ? <Spinner /> : proposals.error ? <ErrorState message={proposals.error} onRetry={proposals.refetch} /> : proposals.data && proposals.data.length > 0 ? (
            <div className="divide-y divide-border">
              {proposals.data.slice(0, 4).map(p => (
                <div key={p.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{p.company}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p.priority === "high" ? "bg-red-500/15 text-red-500" : p.priority === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                      {p.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{p.amount} · {p.stage}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1">{p.date}</div>
                </div>
              ))}
            </div>
          ) : <EmptyState label="No proposals yet" />}
        </Card>

        <Card dark={dark}>
          <SectionHeader title="Activity Timeline" />
          {timeline.loading ? <Spinner /> : timeline.error ? <ErrorState message={timeline.error} onRetry={timeline.refetch} /> : timeline.data && timeline.data.length > 0 ? (
            <div className="px-5 py-4 space-y-4">
              {timeline.data.map((t, i) => {
                const colors: Record<TimelineEvent["type"], string> = {
                  investment: "#10b981", deal: "#3b82f6", proposal: "#8b5cf6",
                  diligence: "#f59e0b", report: "#6b7f9a",
                };
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: colors[t.type] }} />
                      {i < timeline.data!.length - 1 && <div className="w-px flex-1 mt-1 min-h-[20px]" style={{ background: "var(--border)" }} />}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs text-foreground font-medium leading-relaxed">{t.event}</p>
                      <span className="text-[10px] text-muted-foreground">{t.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState label="No activity yet" />}
        </Card>

        <div className="space-y-4">
          <Card dark={dark}>
            <SectionHeader title="Documents" />
            {documents.loading ? <Spinner /> : documents.error ? <ErrorState message={documents.error} onRetry={documents.refetch} /> : documents.data && documents.data.length > 0 ? (
              <div className="divide-y divide-border">
                {documents.data.slice(0, 3).map(d => (
                  <div key={d.name} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Investor Profile</h3>
              {profile.data && <span className="text-xs text-primary font-semibold">{profile.data.profileComplete}%</span>}
            </div>
            {profile.loading ? <Spinner /> : profile.error ? <ErrorState message={profile.error} onRetry={profile.refetch} /> : profile.data ? (
              <>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: dark ? "#ffffff10" : "#e2e8f0" }}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${profile.data.profileComplete}%` }} />
                </div>
                <div className="space-y-1.5">
                  {profile.data.profileItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-[10px]">
                      {item.done ? <CheckCircle2 size={11} className="text-primary flex-shrink-0" /> : <Clock size={11} className="text-muted-foreground/50 flex-shrink-0" />}
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Recommended Companies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Recommended Companies</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your investment thesis</p>
          </div>
          <button className="text-xs text-primary font-medium hover:underline">Explore all</button>
        </div>
        {companies.loading ? <Spinner /> : companies.error ? <ErrorState message={companies.error} onRetry={companies.refetch} /> : companies.data && companies.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.data.slice(0, 3).map(c => (
              <CompanyCard key={c.id} company={c} dark={dark} onClick={() => setSelectedCompany(c)} />
            ))}
          </div>
        ) : <EmptyState label="No company recommendations yet" />}
      </div>
    </div>
  );
}

// ─── Explore View ─────────────────────────────────────────────────────────────

function ExploreView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useCompanies();
  const [selected, setSelected] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");

  const sectors = ["All", ...Array.from(new Set((data ?? []).map(c => c.sector)))];

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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies, sectors..."
            className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none flex-1 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {sectors.map(s => (
            <button key={s} onClick={() => setSector(s)}
              className={`text-xs px-3 py-2 rounded-xl font-medium transition-colors border ${sector === s ? "bg-primary text-white border-primary" : dark ? "bg-card border-border text-muted-foreground hover:border-primary/40" : "bg-white border-border text-muted-foreground hover:border-primary/40"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : filtered.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">{filtered.length} companies found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => <CompanyCard key={c.id} company={c} dark={dark} onClick={() => setSelected(c)} />)}
          </div>
        </>
      ) : <EmptyState label="No companies match your search" />}
    </div>
  );
}

// ─── Investments View ─────────────────────────────────────────────────────────

function InvestmentsView({ dark }: { dark: boolean }) {
  const investments = useInvestments();
  const activity = useActivity();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {investments.loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} dark={dark} className="p-5 h-28 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-20 bg-muted rounded" />
            </Card>
          ))
        ) : investments.data ? (
          <>
            <KPICard title="Total Invested" value="—" change={0} changeLabel="from API" icon={DollarSign} color="#10b981" dark={dark} />
            <KPICard title="Current Value" value="—" change={0} changeLabel="from API" icon={TrendingUp} color="#3b82f6" dark={dark} />
            <KPICard title="Realized Gains" value="—" change={0} changeLabel="from API" icon={BarChart3} color="#8b5cf6" dark={dark} />
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
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-right">Invested</th>
                  <th className="px-4 py-3 text-right">Current Value</th>
                  <th className="px-4 py-3 text-right">ROI</th>
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
                    <td className="px-4 py-4 text-right text-sm font-medium text-foreground" style={{ fontFamily: "JetBrains Mono, monospace" }}>{inv.currentValue}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-emerald-500" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {inv.roi >= 0 ? "+" : ""}{inv.roi}%
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-4 text-center"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState label="No investments yet" />}
      </Card>

      <Card dark={dark} className="p-5">
        <h3 className="font-semibold text-foreground mb-4">Monthly Deal Activity</h3>
        {activity.loading ? <Spinner /> : activity.error ? <ErrorState message={activity.error} onRetry={activity.refetch} /> : activity.data && activity.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activity.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#ffffff08" : "#00000008"} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7f9a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7f9a" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }} />
              <Bar dataKey="deals" name="New Deals" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exits" name="Exits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState label="No activity data" />}
      </Card>
    </div>
  );
}

// ─── Proposals View ───────────────────────────────────────────────────────────

function ProposalsView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useProposals();
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{data ? `${data.length} proposals in progress` : ""}</p>
        <button className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity">
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
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.priority === "high" ? "bg-red-500/15 text-red-500" : p.priority === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                  {p.priority} priority
                </span>
                <StatusBadge status={p.status} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">View Details</button>
              <button className="text-xs px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">Edit</button>
              <button className="text-xs px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">Withdraw</button>
            </div>
          </Card>
        ))
      ) : <EmptyState label="No proposals submitted yet" />}
    </div>
  );
}

// ─── Documents View ───────────────────────────────────────────────────────────

function DocumentsView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useDocuments();
  return (
    <div className="space-y-4">
      <Card dark={dark} className="overflow-hidden">
        <SectionHeader title="All Documents" action={
          <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
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
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.name} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{d.name}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{d.type}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{d.date}</td>
                    <td className="px-4 py-4 text-center"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-4 text-center">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Download size={13} className="text-muted-foreground" />
                      </button>
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

function NotificationsView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useNotifications();
  const iconMap: Record<Notification["iconType"], React.ElementType> = {
    opportunity: Lightbulb, update: TrendingUp, document: FileText,
    meeting: Calendar, alert: AlertCircle,
  };
  return (
    <div className="space-y-3">
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data && data.length > 0 ? (
        data.map(n => {
          const Icon = iconMap[n.iconType] ?? Bell;
          return (
            <Card key={n.id} dark={dark} className={`p-4 transition-opacity ${n.read ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${n.color}18` }}>
                  <Icon size={16} style={{ color: n.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.desc}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1.5 block">{n.time}</span>
                </div>
              </div>
            </Card>
          );
        })
      ) : <EmptyState label="No notifications" />}
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({ dark }: { dark: boolean }) {
  const { data, loading, error, refetch } = useProfile();
  return (
    <div className="space-y-5 max-w-2xl">
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={refetch} /> : data ? (
        <>
          <Card dark={dark} className="p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold">
                {data.initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{data.name}</h2>
                <p className="text-sm text-muted-foreground">{data.title} · {data.firm}</p>
                {data.verified && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield size={12} className="text-primary" />
                    <span className="text-xs text-primary font-medium">Verified Accredited Investor</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Investment Focus", value: data.focus },
                { label: "Check Size", value: data.checkSize },
                { label: "Stage Preference", value: data.stagePreference },
                { label: "AUM", value: data.aum },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="text-sm text-foreground">{f.value}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card dark={dark} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Profile Completion</h3>
              <span className="text-xs text-primary font-semibold">{data.profileComplete}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: dark ? "#ffffff10" : "#e2e8f0" }}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${data.profileComplete}%` }} />
            </div>
            <div className="space-y-2">
              {data.profileItems.map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.done ? <CheckCircle2 size={14} className="text-primary" /> : <Clock size={14} className="text-muted-foreground/50" />}
                  <span className={`text-xs ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { id: "dashboard",      label: "Dashboard",               icon: LayoutDashboard },
  { id: "explore",        label: "Explore Companies",        icon: Building2 },
  { id: "opportunities",  label: "Opportunities",            icon: Lightbulb },
  { id: "proposals",      label: "My Proposals",             icon: FileText },
  { id: "investments",    label: "My Investments",           icon: TrendingUp },
  { id: "documents",      label: "Documents",                icon: Download },
  { id: "notifications",  label: "Notifications",            icon: Bell },
  { id: "profile",        label: "Profile",                  icon: User },
  { id: "settings",       label: "Settings",                 icon: Settings },
];

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard", explore: "Explore Companies",
  opportunities: "Investment Opportunities", proposals: "My Proposals",
  investments: "My Investments", documents: "Documents",
  notifications: "Notifications", profile: "Profile", settings: "Settings",
};

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Badge counts — fetched independently so sidebar stays live
  const notifications = useNotifications();
  const proposals = useProposals();

  const badgeFor = (id: string): number | undefined => {
    if (id === "notifications") return notifications.data?.filter(n => !n.read).length || undefined;
    if (id === "proposals") return proposals.data?.filter(p => p.status === "Under Review" || p.status === "Initial Review").length || undefined;
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
  <img
    src="/logo.png"
    alt="DnH FINTECH"
    className="w-full h-full object-cover"
  />
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
            className="w-full hidden lg:flex items-center justify-center p-2 rounded-xl hover:bg-sidebar-accent/50 text-muted-foreground transition-colors">
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex-shrink-0 flex items-center px-5 gap-4 border-b border-border bg-card"
          style={{ boxShadow: dark ? "0 1px 0 rgba(255,255,255,0.04)" : "0 1px 0 rgba(0,0,0,0.05)" }}>
          <button onClick={() => setMobileSidebar(!mobileSidebar)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-200 border-border hover:border-primary/40"
            style={{ background: dark ? "#ffffff08" : "#f0f4f8" }}>
            {dark
              ? <><Sun size={13} className="text-amber-400" /><span className="text-foreground hidden sm:inline">Light</span></>
              : <><Moon size={13} className="text-blue-500" /><span className="text-foreground hidden sm:inline">Dark</span></>
            }
          </button>
          <button onClick={() => setActiveNav("notifications")}
            className="relative p-2 rounded-xl hover:bg-muted transition-colors border border-border">
            <Bell size={15} className="text-muted-foreground" />
            {notifications.data && notifications.data.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
          <button onClick={() => setActiveNav("profile")}
            className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:opacity-90 transition-opacity">
            {/* Initials rendered from profile API once loaded */}
            {/* Replace with: profile.data?.initials ?? "—" */}
            —
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {activeNav === "dashboard"     && <DashboardView dark={dark} />}
          {activeNav === "explore"       && <ExploreView dark={dark} />}
          {activeNav === "opportunities" && <ExploreView dark={dark} />}
          {activeNav === "proposals"     && <ProposalsView dark={dark} />}
          {activeNav === "investments"   && <InvestmentsView dark={dark} />}
          {activeNav === "documents"     && <DocumentsView dark={dark} />}
          {activeNav === "notifications" && <NotificationsView dark={dark} />}
          {activeNav === "profile"       && <ProfileView dark={dark} />}
          {activeNav === "settings"      && (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Settings panel — connect your API
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
