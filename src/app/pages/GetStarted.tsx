import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  login,
  registerInvestor,
  registerCompany,
  verifyEmail,
} from "../../api/auth";
import { useEffect } from "react";
import { getMyDocuments } from "../../api/document";
import { saveToken, saveUser } from "../../utils/storage";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Shield,
  Users,
  Building2,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Phone,
  User,
  RefreshCw,
  Menu,
  X,
  ArrowLeft,
  ArrowUpRight,
  Wallet,
  Briefcase,
  Sun,
  Moon,
} from "lucide-react";

type UserType = "investor" | "company";
type AuthMode = "login" | "signup";
type SignupStep = 1 | 2 | 3;

const NAV_ITEMS = [
  { id: "investor-access", label: "Investor Access", icon: TrendingUp },
  { id: "company-access", label: "Company Access", icon: Building2 },
  { id: "associate-dashboard", label: "Associate Dashboard", icon: Briefcase },

  // Landing Page Sections
  { id: "why-dnh", label: "About DnH", icon: Users },
  { id: "services", label: "How It Works", icon: BarChart3 },
  { id: "security", label: "Security", icon: Shield },
  { id: "contact", label: "Contact Us", icon: Mail },
];

const TRUST_ITEMS = [
  "Verified Investors",
  "Verified Companies",
  "End-to-End Security",
  "Due Diligence Process",
];

const ACTIVITY = [
  { company: "TechVenture Alpha", action: "New Series A round opened", amount: "₹2.4Cr", time: "2h ago", color: " #1d4ed8 ", initial: "T" },
  { company: "GreenBridge Capital", action: "Due diligence docs shared", amount: null, time: "5h ago", color: "#00C853", initial: "G" },
  { company: "Nexus Fintech", action: "Pre-money valuation updated", amount: "₹18Cr", time: "1d ago", color: "#F59E0B", initial: "N" },
  { company: "UrbanMobility Co.", action: "Investment confirmed", amount: "₹75L", time: "2d ago", color: " #1d4ed8 ", initial: "U" },
];

// EMI slider bounds — 1 crore to 500 crore
const MIN_LOAN = 1_00_00_000; // ₹1 Cr
const MAX_LOAN = 500_00_00_000; // ₹500 Cr
const LOAN_STEP = 50_00_000; // ₹50L increments

// ── Theme tokens ──────────────────────────────────────────────────────
const THEME = {
  light: {
    pageBg: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFC",
    surfaceMuted: "#F1F5F9",
    border: "#E5E7EB",
    borderSoft: "#F1F5F9",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    textFaint: "#94A3B8",
    inputBg: "#F8FAFC",
    accentSoft: "#EFF6FF",
    shadow: "0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)",
    shadowSm: "0 4px 16px -4px rgba(0,0,0,0.06)",
  },
  dark: {
    pageBg: "#0B1220",
    surface: "#111A2B",
    surfaceAlt: "#0E1626",
    surfaceMuted: "#182236",
    border: "#232F45",
    borderSoft: "#1B2438",
    textPrimary: "#F1F5F9",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    textFaint: "#64748B",
    inputBg: "#0E1626",
    accentSoft: "#16223B",
    shadow: "0 4px 24px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3)",
    shadowSm: "0 4px 16px -4px rgba(0,0,0,0.35)",
  },
};

function Logo({ t }: { t: typeof THEME.light }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="DNH Capital"
        className="h-10 w-auto object-contain"
      />

      <div>
        <div className="font-bold text-base" style={{ color: t.textPrimary }}>
          DNH
        </div>

        <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: t.textFaint }}>
          FINTECH
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({
  darkMode,
  onToggle,
  t,
}: {
  darkMode: boolean;
  onToggle: () => void;
  t: typeof THEME.light;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      className="relative flex items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/40"
      style={{
        width: 52,
        height: 28,
        background: darkMode
          ? "linear-gradient(135deg,#1d4ed8,#1e293b)"
          : "linear-gradient(135deg,#e0edff,#f1f5f9)",
        border: `1px solid ${t.border}`,
        padding: 3,
      }}
    >
      <div
        className="absolute rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
        style={{
          width: 22,
          height: 22,
          background: darkMode ? "#0B1220" : "#FFFFFF",
          transform: darkMode ? "translateX(24px)" : "translateX(0px)",
        }}
      >
        {darkMode ? (
          <Moon size={12} className="text-[#93C5FD]" />
        ) : (
          <Sun size={12} className="text-[#F59E0B]" />
        )}
      </div>
    </button>
  );
}

function StepIndicator({ current, t }: { current: SignupStep; t: typeof THEME.light }) {
  return (
    <div className="flex items-center gap-1.5">
      {([1, 2, 3] as SignupStep[]).map((s) => (
        <div key={s} className="flex items-center gap-1.5 flex-1">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold flex-shrink-0 transition-all duration-300"
            style={
              current > s
                ? { background: "#00E676", color: "#fff" }
                : current === s
                ? { background: " #1d4ed8 ", color: "#fff" }
                : { background: t.surfaceMuted, color: t.textFaint }
            }
          >
            {current > s ? <Check size={10} strokeWidth={3} /> : s}
          </div>
          {s < 3 && (
            <div
              className="h-px flex-1 transition-all duration-300"
              style={{ background: current > s ? "#00E676" : t.border }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Simple password strength scoring for the interactive strength meter
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "#E5E7EB" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#EF4444" };
  if (score <= 3) return { score: 2, label: "Medium", color: "#F59E0B" };
  return { score: 3, label: "Strong", color: "#00C853" };
}

export default function GetStarted() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("investor-access");
  const [userType, setUserType] = useState<UserType>("investor");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Theme state — light/dark toggle
  const [darkMode, setDarkMode] = useState(false);
  const t = darkMode ? THEME.dark : THEME.light;

  // EMI calculator state — range now 1 Cr to 500 Cr
  const [loanAmount, setLoanAmount] = useState(MIN_LOAN);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [emi, setEmi] = useState(0);

  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(signupPassword);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const result = await login({
        email,
        password,
      });

      saveToken(result.accessToken);
      saveUser(result.account);

      toast.success("Login Successful");

      if (result.account.role === "INVESTOR") {
        navigate("/investor/dashboard");
      } else if (result.account.role === "COMPANY") {
        navigate("/company/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async () => {
  try {
    setLoading(true);

    if (userType === "investor") {
      await registerInvestor({
        email,
        password: signupPassword,
        fullName,
        phone,
        address: "",
      });
    } else {
      await registerCompany({
        email,
        password: signupPassword,
        companyName: orgName,
        phone,
        address: "",
      });
    }

    toast.success("OTP sent to your email");

    // Go to OTP screen
    setSignupStep(2);

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Registration failed"
    );
  } finally {
    setLoading(false);
  }
};

const handleVerifyOtp = async () => {
  try {
    setLoading(true);

    const result = await verifyEmail({
      email,
      otp: otp.join(""),
    });

    toast.success("Email verified successfully");

    if (userType === "investor") {
      navigate("/investor/dashboard");
    } else {
      navigate("/company/dashboard");
    }

  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Invalid OTP"
    );
  } finally {
    setLoading(false);
  }
};

const handleNavClick = (id: string) => {
  setActiveNav(id);

  // Investor Login
  if (id === "investor-access") {
    setUserType("investor");
    setAuthMode("login");
    setSignupStep(1);
    setMobileMenuOpen(false);
    return;
  }

  // Company Login
  if (id === "company-access") {
    setUserType("company");
    setAuthMode("login");
    setSignupStep(1);
    setMobileMenuOpen(false);
    return;
  }

  // Associate Dashboard
  if (id === "associate-dashboard") {
    navigate("/associate/dashboard");
    return;
  }

  // Landing Page Sections
  navigate(`/#${id}`);
  setMobileMenuOpen(false);
};

  const handleUserTypeSwitch = (type: UserType) => {
    setUserType(type);
    setAuthMode("login");
    setSignupStep(1);
    setActiveNav(type === "investor" ? "investor-access" : "company-access");
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  // EMI calculation
  const calculateEmi = () => {
    const monthlyRate = interestRate / 12 / 100;
    const months = loanTenure * 12;
    const emiValue =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    setEmi(isFinite(emiValue) ? emiValue : 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format big loan values as ₹XCr for compact display
  const formatCrore = (amount: number) => {
    const crores = amount / 1_00_00_000;
    return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1)}Cr`;
  };

  const inputCls =
    "w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/25 transition-all duration-150 focus:shadow-sm";

  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    color: t.textPrimary,
  };

  const labelCls = "block text-[10px] font-semibold mb-1.5 uppercase tracking-widest";

  const primaryBtn =
    "w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/40";

  // ── Sidebar ──────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className="px-5 py-5 border-b flex items-center justify-between"
        style={{ borderColor: t.border }}
      >
        <Logo t={t} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left ${
                active ? "text-white font-semibold shadow-sm" : "font-medium"
              }`}
              style={
                active
                  ? { background: "linear-gradient(135deg,  #1d4ed8  0%,  #1d4ed8 100%)" }
                  : { color: t.textSecondary }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = t.surfaceMuted;
                  (e.currentTarget as HTMLButtonElement).style.color = t.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = t.textSecondary;
                }
              }}
            >
              <Icon size={15} className={active ? "text-white/90" : ""} style={active ? {} : { color: t.textFaint }} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 px-1">
        <div className="flex items-center justify-between px-2 py-2 rounded-lg" style={{ background: t.surfaceMuted }}>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: t.textFaint }}>
            {darkMode ? "Dark mode" : "Light mode"}
          </span>
          <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((d) => !d)} t={t} />
        </div>
      </div>

      <div
        className="mx-3 mb-4 p-4 rounded-xl"
        style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: t.textFaint }}>
          Trusted Platform
        </p>
        <div className="space-y-2">
          {TRUST_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#00E676" }}
              >
                <Check size={9} className="text-white" strokeWidth={3.5} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Center dashboard preview ──────────────────────────────────────────
  const centerContent = (
    <div className="flex flex-col h-full px-8 xl:px-10 py-8 overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#00C853] uppercase tracking-wider">
            Live Platform
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-6">
        <h1
          className="text-[26px] xl:text-[28px] font-bold leading-tight mb-2.5"
          style={{ letterSpacing: "-0.02em", color: t.textPrimary }}
        >
          Calculate Your EMI
        </h1>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: t.textMuted }}>
          Adjust loan amount, interest rate, and tenure to see your monthly EMI.
        </p>
      </div>

      {/* EMI Calculator Card */}
      <div
        className="rounded-xl p-4 mb-5 transition-shadow hover:shadow-md"
        style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: t.textPrimary }}>EMI Calculator</h3>
          <ArrowUpRight size={14} style={{ color: t.textFaint }} />
        </div>

        <div className="space-y-3">
          {/* Loan Amount — now 1Cr to 500Cr */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>
                Loan Amount
              </label>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textPrimary, background: t.accentSoft }}
              >
                {formatCrore(loanAmount)}
              </span>
            </div>
            <input
              type="range"
              min={MIN_LOAN}
              max={MAX_LOAN}
              step={LOAN_STEP}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right,  #1d4ed8  0%,  #1d4ed8  ${((loanAmount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100}%, ${t.border} ${((loanAmount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100}%, ${t.border} 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: t.textFaint }}>
              <span>₹1Cr</span>
              <span>₹125Cr</span>
              <span>₹250Cr</span>
              <span>₹375Cr</span>
              <span>₹500Cr</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>
                Interest Rate
              </label>
              <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                {interestRate.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right,  #1d4ed8  0%,  #1d4ed8 ${((interestRate - 5) / (20 - 5)) * 100}%, ${t.border} ${((interestRate - 5) / (20 - 5)) * 100}%, ${t.border} 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: t.textFaint }}>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>
                Loan Tenure
              </label>
              <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                {loanTenure} years
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={loanTenure}
              onChange={(e) => setLoanTenure(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right,  #1d4ed8  0%,  #1d4ed8  ${((loanTenure - 1) / (30 - 1)) * 100}%, ${t.border} ${((loanTenure - 1) / (30 - 1)) * 100}%, ${t.border} 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: t.textFaint }}>
              <span>1 yr</span>
              <span>10 yrs</span>
              <span>20 yrs</span>
              <span>30 yrs</span>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateEmi}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/40"
            style={{ background: "linear-gradient(135deg,  #1d4ed8  0%, #1d4ed8 100%)" }}
          >
            Calculate EMI
          </button>

          {/* Result */}
          {emi > 0 && (
            <div className="pt-2 border-t animate-[fadeIn_0.25s_ease-out]" style={{ borderColor: t.borderSoft }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>
                  Monthly EMI
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textPrimary }}
                >
                  {formatCurrency(emi)}
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>
                For {loanTenure * 12} months at {interestRate.toFixed(1)}% p.a. on {formatCrore(loanAmount)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl flex-1 flex flex-col overflow-hidden"
        style={{ background: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadowSm }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: t.borderSoft }}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: t.textPrimary }}>Recent Activity</h3>
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: t.accentSoft, color: "#1D8CF8" }}
            >
              {ACTIVITY.length}
            </span>
          </div>
          <button className="text-[11px] text-[#1D8CF8] font-semibold hover:underline">
            View all →
          </button>
        </div>
        <div className="divide-y overflow-y-auto" style={{ borderColor: t.borderSoft }}>
          {ACTIVITY.map(({ company, action, amount, time, color, initial }, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-5 py-3 transition-colors cursor-default"
              style={{ borderColor: t.borderSoft }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = t.surfaceAlt)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: color + "18", color }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-none mb-0.5" style={{ color: t.textPrimary }}>
                  {company}
                </p>
                <p className="text-[11px] truncate" style={{ color: t.textFaint }}>{action}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {amount && (
                  <p
                    className="text-xs font-semibold leading-none mb-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textPrimary }}
                  >
                    {amount}
                  </p>
                )}
                <p className="text-[10px]" style={{ color: t.textFaint }}>{time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Auth card forms ────────────────────────────────────────────────────
  const loginForm = (
    <div className="space-y-4">
      <div>
        <p className="text-xl font-bold mb-1" style={{ letterSpacing: "-0.02em", color: t.textPrimary }}>
          Welcome back
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          Sign in to your {userType === "investor" ? "investor" : "company"} account
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Email Address</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Password</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/25 transition-all duration-150 focus:shadow-sm"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: t.textFaint }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-4 h-4 rounded flex items-center justify-center transition-all border ${
              rememberMe ? "border-[#1D8CF8]" : ""
            }`}
            style={rememberMe ? { background: " #1d4ed8 " } : { borderColor: t.border }}
          >
            {rememberMe && <Check size={9} className="text-white" strokeWidth={3.5} />}
          </div>
          <span className="text-xs" style={{ color: t.textSecondary }}>Remember me</span>
        </label>
        <button
  onClick={() => navigate("/forgot-password")}
  className="text-xs text-[#1D8CF8] font-semibold hover:underline"
>
  Forgot password?
</button>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className={primaryBtn}
        style={{ background: "linear-gradient(135deg,  #1d4ed8  0%,  #1d4ed8  100%)" }}
      >
        {loading ? "Signing In..." : "Continue"}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: t.border }} />
        <span className="text-[11px] font-medium" style={{ color: t.textFaint }}>or</span>
        <div className="flex-1 h-px" style={{ background: t.border }} />
      </div>

      <p className="text-center text-xs" style={{ color: t.textFaint }}>
        Don&apos;t have an account?{" "}
        <button
          onClick={() => { setAuthMode("signup"); setSignupStep(1); }}
          className="text-[#1D8CF8] font-semibold hover:underline"
        >
          Create Account
        </button>
      </p>
    </div>
  );

  const signupStep1Form = (
    <div className="space-y-4">
      <div>
        <p className="text-xl font-bold mb-1" style={{ letterSpacing: "-0.02em", color: t.textPrimary }}>
          Create your account
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          Join as {userType === "investor" ? "an investor" : "a company"}
        </p>
      </div>

      <StepIndicator current={signupStep} t={t} />

      <div className="space-y-3">
        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Email Address</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Password</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type={showSignupPassword ? "text" : "password"}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/25 transition-all duration-150 focus:shadow-sm"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: t.textFaint }}
            >
              {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Interactive password strength meter */}
          {signupPassword && (
            <div className="mt-2 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex gap-1">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: passwordStrength.score >= bar ? passwordStrength.color : t.border,
                    }}
                  />
                ))}
              </div>
              <p
                className="text-[10px] font-semibold mt-1 transition-colors duration-200"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.label} password
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: t.textFaint }}>
        We&apos;ll send a 6-digit OTP to verify your email address.
      </p>

      <button
        onClick={() => setSignupStep(3)}
        className={primaryBtn}
        style={{ background: "linear-gradient(135deg,  #1d4ed8  0%, #1d4ed8 100%)" }}
      >
        Send Verification Code →
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: t.border }} />
        <span className="text-[11px] font-medium" style={{ color: t.textFaint }}>or</span>
        <div className="flex-1 h-px" style={{ background: t.border }} />
      </div>

      <p className="text-center text-xs" style={{ color: t.textFaint }}>
        Already have an account?{" "}
        <button onClick={() => setAuthMode("login")} className="text-[#1D8CF8] font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );

  const signupStep2Form = (
    <div className="space-y-4">
      <button
        onClick={() => setSignupStep(1)}
        className="flex items-center gap-1.5 text-xs transition-colors"
        style={{ color: t.textMuted }}
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div>
        <p className="text-xl font-bold mb-1" style={{ letterSpacing: "-0.02em", color: t.textPrimary }}>
          Verify your email
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold" style={{ color: t.textPrimary }}>{email || "your email"}</span>
        </p>
      </div>

      <StepIndicator current={signupStep} t={t} />

      <div>
        <label className={labelCls} style={{ color: t.textFaint }}>Verification Code</label>
        <div className="flex gap-2 justify-between mt-1">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKey(i, e)}
              className="w-10 h-11 text-center text-base font-bold rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/25"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: t.textPrimary,
                borderColor: digit ? "#1D8CF8" : t.border,
                background: digit ? t.accentSoft : t.inputBg,
                transform: digit ? "scale(1.05)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-[11px] text-[#1D8CF8] mt-2.5 hover:underline font-medium">
          <RefreshCw size={10} /> Resend code
        </button>
      </div>

      <button
        onClick={handleVerifyOtp}
        className={primaryBtn}
        style={{ background: "linear-gradient(135deg, #1D8CF8 0%, #0EA5E9 100%)" }}
      >
        Verify & Continue →
      </button>
    </div>
  );

  const signupStep3Form = (
    <div className="space-y-4">
      <button
        onClick={() => setSignupStep(2)}
        className="flex items-center gap-1.5 text-xs transition-colors"
        style={{ color: t.textMuted }}
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div>
        <p className="text-xl font-bold mb-1" style={{ letterSpacing: "-0.02em", color: t.textPrimary }}>
          Complete your profile
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          {userType === "investor"
            ? "Tell us about yourself as an investor"
            : "Tell us about your company"}
        </p>
      </div>

      <StepIndicator current={signupStep} t={t} />

      <div className="space-y-3">
        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Full Name</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Arjun Sharma"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: t.textFaint }}>Phone Number</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        {userType === "company" ? (
          <div>
            <label className={labelCls} style={{ color: t.textFaint }}>Company Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Nexus Technologies Pvt. Ltd."
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className={labelCls} style={{ color: t.textFaint }}>Investor Type</label>
            <div className="relative">
              <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textFaint }} />
              <select
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D8CF8]/25 transition-all duration-150 appearance-none cursor-pointer"
                style={inputStyle}
              >
                <option value="">Select investor type</option>
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

      <button
         onClick={handleRegister}
        className={primaryBtn}
        style={{ background: "linear-gradient(135deg,  #1d4ed8  0%,  #1d4ed8  100%)" }}
      >
        Complete Registration
      </button>

      <p className="text-[10px] text-center leading-relaxed px-1" style={{ color: t.textFaint }}>
        By registering, you agree to our Terms of Service and Privacy Policy. Your data is protected with end-to-end encryption.
      </p>
    </div>
  );

  // ── Auth Card ─────────────────────────────────────────────────────────
  const authCard = (
    <div
      className="w-full p-6 transition-colors duration-300"
      style={{
        borderRadius: "20px",
        background: t.surface,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      {/* User type toggle */}
      <div className="relative flex rounded-xl p-1 mb-6" style={{ background: t.surfaceMuted }}>
        <div
          className="absolute top-1 bottom-1 rounded-[10px] transition-all duration-250"
          style={{
            left: userType === "investor" ? "4px" : "calc(50%)",
            width: "calc(50% - 4px)",
            background: "linear-gradient(135deg,  #1d4ed8  0%, #1d4ed8  100%)",
          }}
        />
        {(["investor", "company"] as UserType[]).map((tp) => (
          <button
            key={tp}
            onClick={() => handleUserTypeSwitch(tp)}
            className="flex-1 py-2 text-sm font-semibold rounded-[10px] z-10 relative transition-colors duration-200 capitalize"
            style={{ color: userType === tp ? "#FFFFFF" : t.textMuted }}
          >
            {tp === "investor" ? "Investor" : "Company"}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="transition-all duration-200">
        {authMode === "login" && loginForm}
        {authMode === "signup" && signupStep === 1 && signupStep1Form}
        {authMode === "signup" && signupStep === 2 && signupStep2Form}
        {authMode === "signup" && signupStep === 3 && signupStep3Form}
      </div>
    </div>
  );

  // ── Mobile center snippet ─────────────────────────────────────────────
  const mobileCenterSnippet = (
    <div className="lg:hidden px-4 pt-3 pb-1">
      <h2
        className="text-lg font-bold mb-1"
        style={{ letterSpacing: "-0.02em", color: t.textPrimary }}
      >
        Calculate Your EMI
      </h2>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: t.textMuted }}>
        Adjust loan amount, interest rate, and tenure to see your monthly EMI.
      </p>
      {/* Mini metrics row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: "Loan Amount", value: formatCrore(loanAmount) },
          { label: "Interest Rate", value: `${interestRate.toFixed(1)}%` },
          { label: "Loan Tenure", value: `${loanTenure} yrs` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex-shrink-0 rounded-xl px-3.5 py-2.5"
            style={{ background: t.surface, border: `1px solid ${t.border}` }}
          >
            <p
              className="text-sm font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: t.textPrimary }}
            >
              {value}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Root layout ───────────────────────────────────────────────────────
  return (
    <div
      className="h-screen w-full flex overflow-hidden transition-colors duration-300"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: t.pageBg }}
    >
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b px-4 h-14 flex items-center justify-between transition-colors duration-300"
        style={{ background: t.surface, borderColor: t.border }}
      >
        <Logo t={t} />
        <div className="flex items-center gap-2">
          <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((d) => !d)} t={t} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: t.textPrimary }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 pt-14 overflow-y-auto transition-colors duration-300"
          style={{ background: t.surface }}
        >
          {sidebarContent}
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className="hidden lg:flex flex-col w-[220px] xl:w-[240px] flex-shrink-0 border-r transition-colors duration-300"
        style={{ background: t.surface, borderColor: t.border }}
      >
        {sidebarContent}
      </aside>

      {/* CENTER */}
      <main className="hidden lg:flex flex-1 flex-col overflow-hidden min-w-0">
        {centerContent}
      </main>

      {/* RIGHT AUTH PANEL */}
      <div
        className="flex-1 lg:flex-none lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col lg:items-center lg:justify-center overflow-y-auto border-l transition-colors duration-300"
        style={{ background: t.pageBg, borderColor: t.border }}
      >
        <div className="w-full pt-16 lg:pt-0 lg:p-6 flex flex-col gap-0">
          {mobileCenterSnippet}
          <div className="p-4 lg:p-0">
            {authCard}
          </div>
        </div>
      </div>
    </div>
  );
}