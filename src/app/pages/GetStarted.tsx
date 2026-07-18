import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  login,
  registerInvestor,
  registerCompany,
  verifyEmail,
} from "../../api/auth";
import { saveToken, saveUser } from "../../utils/storage";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Shield,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Phone,
  User,
  RefreshCw,
  ArrowLeft,
  Wallet,
  ChevronRight,
  ArrowRight,
  Zap,
  BarChart2,
  Globe,
  GlobeIcon,
} from "lucide-react";

// Bounds are defined separately per unit so switching between Cr and Lakh
// doesn't produce a nonsensical range (previously both units shared the
// same 0.1–50 bounds, which only made sense for Crore).
const MIN_LOAN_CR = 0.1; // 10L
const MAX_LOAN_CR = 50;  // 50Cr
const LOAN_STEP_CR = 0.1;

const MIN_LOAN_L = MIN_LOAN_CR * 100; // 10L
const MAX_LOAN_L = MAX_LOAN_CR * 100; // 5000L (=50Cr)
const LOAN_STEP_L = 1;

function fmtCr(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function DonutMini({ principal, interest, emi }: { principal: number; interest: number; emi: number }) {
  const r = 68; // enlarged radius for better visibility
  const circ = 2 * Math.PI * r;
  const total = principal + interest;
  const pDash = total > 0 ? (principal / total) * circ : 0;
  const iDash = total > 0 ? (interest / total) * circ : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-xs">—</span>
        </div>
        <p className="text-white/30 text-[11px]">Adjust inputs</p>
      </div>
    );
  }

  const pPct = Math.round((principal / total) * 100);
  const iPct = 100 - pPct;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="15" />
          <circle cx="80" cy="80" r={r} fill="none" stroke="#3b82f6" strokeWidth="15"
            strokeDasharray={`${pDash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
          <circle cx="80" cy="80" r={r} fill="none" stroke="#f59e0b" strokeWidth="15"
            strokeDasharray={`${iDash} ${circ}`} strokeDashoffset={-pDash} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-white/40 uppercase tracking-wider">EMI / mo</span>
          <span className="text-lg font-bold text-white leading-tight text-center px-2" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMoney(emi)}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2.5">
        {[
          { label: "Principal", color: "#3b82f6", value: principal, pct: pPct },
          { label: "Interest", color: "#f59e0b", value: interest, pct: iPct },
        ].map(({ label, color, value, pct }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-white/60">{label}</span>
              </div>
              <span className="text-xs font-semibold text-white/90" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCr(value)} · {pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/8">
          <span className="text-[11px] text-white/40">Total outflow</span>
          <span className="text-xs font-bold text-white/80" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCr(principal + interest)}</span>
        </div>
      </div>
    </div>
  );
}

type UserType = "investor" | "company";
type AuthMode = "login" | "signup";
type SignupStep = 1 | 2 | 3;

const STATS = [
  { value: "₹2.5B+", label: "CAPITAL RAISED", icon: TrendingUp },
  { value: "150+", label: "TRANSACTION", icon: User },
  { value: "25+", label: "COUNTRIES", icon: GlobeIcon },
  { value: "4000+", label: "Deals Closed", icon: Zap },
];

function getPasswordStrength(p: string) {
  if (!p) return { score: 0, label: "", color: "#e5e7eb" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (s <= 3) return { score: 2, label: "Fair", color: "#f59e0b" };
  return { score: 3, label: "Strong", color: "#10b981" };
}

function StepDots({ current }: { current: SignupStep }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {([1, 2, 3] as SignupStep[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
            style={{
              width: current === s ? 28 : 22,
              height: current === s ? 28 : 22,
              background: current > s ? "#10b981" : current === s ? "#1d4ed8" : "#e2e8f0",
              color: current >= s ? "#fff" : "#94a3b8",
            }}
          >
            {current > s ? <Check size={10} strokeWidth={3} /> : s}
          </div>
          {s < 3 && (
            <div className="w-8 h-px rounded-full transition-all duration-500"
              style={{ background: current > s ? "#10b981" : "#e2e8f0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function GetStarted() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<UserType>("investor");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  // EMI calculator state
  const [loanAmountCr, setLoanAmountCr] = useState(1); // value in whatever unit is currently selected
  const [loanUnit, setLoanUnit] = useState<"cr" | "l">("cr");
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [emi, setEmi] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [interest, setInterest] = useState(0);

  // Bounds/step depend on which unit is currently active, so the input
  // limits always make sense for the unit being displayed.
  const currentMin = loanUnit === "cr" ? MIN_LOAN_CR : MIN_LOAN_L;
  const currentMax = loanUnit === "cr" ? MAX_LOAN_CR : MAX_LOAN_L;
  const currentStep = loanUnit === "cr" ? LOAN_STEP_CR : LOAN_STEP_L;

  // Convert typed value + unit to actual loan amount in rupees
  const loanAmount = loanUnit === "cr"
    ? loanAmountCr * 1_00_00_000
    : loanAmountCr * 1_00_000;

  // When the unit toggle changes, convert the existing entered value so the
  // actual loan amount is preserved instead of silently changing by 100x
  // (e.g. "1" in Cr mode becoming "1" in Lakh mode, which is 100x smaller).
  const handleUnitChange = (newUnit: "cr" | "l") => {
    if (newUnit === loanUnit) return;
    let convertedValue = loanAmountCr;
    if (newUnit === "l" && loanUnit === "cr") {
      convertedValue = loanAmountCr * 100; // Cr -> Lakh
    } else if (newUnit === "cr" && loanUnit === "l") {
      convertedValue = loanAmountCr / 100; // Lakh -> Cr
    }
    const min = newUnit === "cr" ? MIN_LOAN_CR : MIN_LOAN_L;
    const max = newUnit === "cr" ? MAX_LOAN_CR : MAX_LOAN_L;
    setLoanAmountCr(Math.max(min, Math.min(max, convertedValue)));
    setLoanUnit(newUnit);
  };

  useEffect(() => {
    const r = interestRate / 12 / 100;
    const n = loanTenure * 12;
    if (r === 0 || n === 0 || loanAmount === 0) {
      setEmi(0);
      setPrincipal(0);
      setInterest(0);
      return;
    }
    const e = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const calculatedEmi = isFinite(e) ? e : 0;
    const totalPayment = calculatedEmi * n;
    const totalInterest = totalPayment - loanAmount;
    setEmi(calculatedEmi);
    setPrincipal(loanAmount);
    setInterest(totalInterest > 0 ? totalInterest : 0);
  }, [loanAmount, interestRate, loanTenure]);

  const pwStrength = getPasswordStrength(signupPassword);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await login({ email, password });
      saveToken(result.accessToken);
      saveUser(result.account);
      toast.success("Welcome back!");
      if (result.account.role === "INVESTOR") navigate("/investor/dashboard");
      else if (result.account.role === "COMPANY") navigate("/company/dashboard");
      else navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      if (userType === "investor") {
        await registerInvestor({ email, password: signupPassword, fullName, phone, address: "" });
      } else {
        await registerCompany({ email, password: signupPassword, companyName: orgName, phone, address: "" });
      }
      toast.success("OTP sent to your email");
      setSignupStep(3);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await verifyEmail({ email, otp: otp.join("") });
      toast.success("Email verified!");
      if (userType === "investor") navigate("/investor/dashboard");
      else navigate("/company/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };

  const inputBase =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-200";

  // ── LEFT HERO PANEL ────────────────────────────────────────────────────────
  const heroPanel = (
    <div
      className="hidden lg:flex flex-col h-full overflow-y-auto"
      style={{
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        scrollbarWidth: "none",
      }}
    >
      {/* Top nav strip */}
      <div className="flex items-center justify-between px-10 pt-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DnH fintech" className="w-9 h-9 rounded-xl object-contain" />
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none">DnH fintech</div>
            <div className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Fintech Platform</div>
          </div>
        </div>
        <button
          onClick={() => navigate("/associate/dashboard")}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          Associate portal <ChevronRight size={12} />
        </button>
      </div>

      {/* Hero copy */}
      <div className="px-10 pt-16 pb-10 flex-shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(29,78,216,0.2)", border: "1px solid rgba(29,78,216,0.3)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-300 text-[11px] font-semibold tracking-wide uppercase">Live · RBI Compliant</span>
        </div>

        <h1 className="text-white font-bold leading-[1.15] mb-5"
          style={{ fontSize: "clamp(28px, 3vw, 42px)", letterSpacing: "-0.03em" }}>
          Where capital meets<br />
          <span style={{ background: "linear-gradient(90deg, #60a5fa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            opportunity
          </span>
        </h1>

        <p className="text-white/50 text-sm leading-relaxed max-w-sm">
          A verified marketplace connecting serious investors with high-potential companies — backed by due diligence and end-to-end security.
        </p>
      </div>

      {/* Stats grid */}
      <div className="px-10 pb-8 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label}
              className="rounded-2xl p-4 group cursor-default transition-all duration-200 hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon size={16} className="mb-3 text-blue-400 opacity-80" />
              <div className="text-white font-bold text-xl leading-none mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div className="text-white/40 text-[11px]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EMI Calculator */}
      <div className="px-10 pb-8 flex-shrink-0">
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">EMI Calculator</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-blue-300"
              style={{ background: "rgba(59,130,246,0.15)" }}>Interactive</span>
          </div>

          <div className="flex gap-4">
            {/* Inputs */}
            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Loan Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={currentMin}
                    max={currentMax}
                    step={currentStep}
                    value={loanAmountCr}
                    onChange={(e) => setLoanAmountCr(Math.max(currentMin, Math.min(currentMax, Number(e.target.value) || 0)))}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="1"
                  />
                  <select
                    value={loanUnit}
                    onChange={(e) => handleUnitChange(e.target.value as "cr" | "l")}
                    className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  >
                    <option value="cr">Cr</option>
                    <option value="l">Lakh</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Interest Rate</label>
                <input
                  type="number"
                  min={5}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(5, Math.min(20, Number(e.target.value) || 0)))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  placeholder="8.5%"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">Tenure</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Math.max(1, Math.min(30, Number(e.target.value) || 0)))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  placeholder="20 yrs"
                />
              </div>
            </div>

            {/* Pie chart */}
            <div className="flex-shrink-0">
              <DonutMini principal={principal} interest={interest} emi={emi} />
            </div>
          </div>

          {/* EMI summary below */}
          {emi > 0 && (
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Monthly EMI</span>
                <span className="text-sm font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtMoney(emi)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom globe decoration */}
      <div className="mt-auto px-10 pb-8 flex items-center gap-2 opacity-30">
        <Globe size={13} className="text-white" />
        <span className="text-white text-[11px]">Operating across India</span>
      </div>
    </div>
  );

  // ── AUTH FORMS ────────────────────────────────────────────────────────────
  const loginForm = (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
          {userType === "investor" ? "Investor login" : "Company login"}
        </h2>
        <p className="text-slate-400 text-sm mt-1">Good to see you again.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputBase + " pl-10"} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
            <button onClick={() => navigate("/forgot-password")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputBase + " pl-10 pr-10"} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
        <div onClick={() => setRememberMe(!rememberMe)}
          className="w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0"
          style={rememberMe ? { background: "#1d4ed8", borderColor: "#1d4ed8" } : { borderColor: "#e2e8f0", background: "#fff" }}>
          {rememberMe && <Check size={9} className="text-white" strokeWidth={3.5} />}
        </div>
        <span className="text-sm text-slate-500">Keep me signed in</span>
      </label>

      <button onClick={handleLogin} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", boxShadow: "0 4px 20px rgba(29,78,216,0.3)" }}>
        {loading ? "Signing in…" : (<>Sign in <ArrowRight size={15} /></>)}
      </button>

      <p className="text-center text-sm text-slate-400">
        New here?{" "}
        <button onClick={() => { setAuthMode("signup"); setSignupStep(1); }}
          className="text-blue-600 font-semibold hover:underline">
          Create an account
        </button>
      </p>
    </div>
  );

  const signupStep1 = (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
          Create your account
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Joining as {userType === "investor" ? "an investor" : "a company"}.
        </p>
      </div>
      <StepDots current={signupStep} />

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" className={inputBase + " pl-10"} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showSignupPassword ? "text" : "password"} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="Min. 8 characters" className={inputBase + " pl-10 pr-10"} />
            <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {signupPassword && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((bar) => (
                  <div key={bar} className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: pwStrength.score >= bar ? pwStrength.color : "#e2e8f0" }} />
                ))}
              </div>
              <p className="text-[11px] font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setSignupStep(2)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", boxShadow: "0 4px 20px rgba(29,78,216,0.3)" }}>
        Continue <ArrowRight size={15} />
      </button>

      <p className="text-center text-sm text-slate-400">
        Already registered?{" "}
        <button onClick={() => setAuthMode("login")} className="text-blue-600 font-semibold hover:underline">Sign in</button>
      </p>
    </div>
  );

  const signupStep2 = (
    <div className="space-y-5">
      <button onClick={() => setSignupStep(1)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-1">
        <ArrowLeft size={13} /> Back
      </button>
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>Your details</h2>
        <p className="text-slate-400 text-sm mt-1">Almost there — just a few more things.</p>
      </div>
      <StepDots current={signupStep} />

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Arjun Sharma" className={inputBase + " pl-10"} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210" className={inputBase + " pl-10"} />
          </div>
        </div>

        {userType === "company" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Company Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                placeholder="Nexus Technologies Pvt. Ltd." className={inputBase + " pl-10"} />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Investor Type</label>
            <div className="relative">
              <Wallet size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select className={inputBase + " pl-10 appearance-none cursor-pointer"}>
                <option value="">Select type</option>
                <option>Angel Investor</option>
                <option>Venture Capital</option>
                <option>Family Office</option>
                <option>HNI / UHNI</option>
                <option>Institutional Investor</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <button onClick={handleRegister} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", boxShadow: "0 4px 20px rgba(29,78,216,0.3)" }}>
        {loading ? "Registering…" : (<>Register <ArrowRight size={15} /></>)}
      </button>

      <p className="text-center text-[11px] text-slate-400 leading-relaxed">
        By registering you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );

  const signupStep3 = (
    <div className="space-y-5">
      <button onClick={() => setSignupStep(2)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-1">
        <ArrowLeft size={13} /> Back
      </button>
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>Check your inbox</h2>
        <p className="text-slate-400 text-sm mt-1">
          We sent a 6-digit code to <span className="text-slate-700 font-medium">{email || "your email"}</span>.
        </p>
      </div>
      <StepDots current={signupStep} />

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Verification Code</label>
        <div className="flex gap-1.5">
          {otp.map((digit, i) => (
            <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKey(i, e)}
              className="flex-1 h-10 text-center text-base font-bold rounded-lg border-2 transition-all duration-150 focus:outline-none bg-slate-50 focus:bg-white"
              style={{
                borderColor: digit ? "#1d4ed8" : "#e2e8f0",
                color: "#0f172a",
                transform: digit ? "scale(1.04)" : "scale(1)",
                boxShadow: digit ? "0 0 0 3px rgba(29,78,216,0.12)" : "none",
              }}
            />
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-3 font-medium transition-colors">
          <RefreshCw size={11} /> Resend code
        </button>
      </div>

      <button onClick={handleVerifyOtp} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)", boxShadow: "0 4px 20px rgba(29,78,216,0.3)" }}>
        {loading ? "Verifying…" : (<>Verify & Continue <ArrowRight size={15} /></>)}
      </button>
    </div>
  );

  // ── RIGHT AUTH PANEL ──────────────────────────────────────────────────────
  const authPanel = (
    <div className="flex flex-col h-full overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-2">
        <img src="/logo.png" alt="DnH fintech" className="w-8 h-8 rounded-xl object-contain" />
        <span className="font-bold text-slate-900 text-sm">DnH fintech</span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-10 max-w-sm mx-auto w-full">

        {/* Investor / Company toggle */}
        <div className="flex rounded-2xl p-1 mb-8 relative" style={{ background: "#f1f5f9" }}>
          <div className="absolute top-1 bottom-1 rounded-xl transition-all duration-300"
            style={{
              left: userType === "investor" ? "4px" : "calc(50%)",
              width: "calc(50% - 4px)",
              background: "#fff",
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            }} />
          {(["investor", "company"] as UserType[]).map((tp) => (
            <button key={tp}
              onClick={() => { setUserType(tp); setAuthMode("login"); setSignupStep(1); }}
              className="flex-1 py-2.5 text-sm font-semibold z-10 relative transition-colors duration-200 rounded-xl flex items-center justify-center gap-2"
              style={{ color: userType === tp ? "#0f172a" : "#94a3b8" }}>
              {tp === "investor" ? <TrendingUp size={14} /> : <Building2 size={14} />}
              {tp === "investor" ? "Investor" : "Company"}
            </button>
          ))}
        </div>

        {/* Form content */}
        <div>
          {authMode === "login" && loginForm}
          {authMode === "signup" && signupStep === 1 && signupStep1}
          {authMode === "signup" && signupStep === 2 && signupStep2}
          {authMode === "signup" && signupStep === 3 && signupStep3}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 pb-8 flex flex-col items-center gap-3">
        <button
          onClick={() => navigate("/associate/dashboard")}
          className="lg:hidden text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Associate portal →
        </button>
        <div className="flex items-center gap-2">
          <Shield size={11} className="text-slate-300" />
          <span className="text-[11px] text-slate-300">256-bit SSL · RBI compliant · ISO 27001</span>
        </div>
      </div>
    </div>
  );

  // ── ROOT ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Left — hero (60%) */}
      <div className="hidden lg:block" style={{ width: "58%" }}>
        {heroPanel}
      </div>

      {/* Right — auth (40%) */}
      <div style={{ width: "42%", minWidth: 340 }} className="flex-shrink-0 w-full lg:w-auto border-l border-slate-100">
        {authPanel}
      </div>
    </div>
  );
}