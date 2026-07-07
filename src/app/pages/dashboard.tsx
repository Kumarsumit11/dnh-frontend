import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Menu, X, TrendingUp, Shield, Globe, Users, BarChart2,
  Briefcase, ChevronRight, Linkedin, Twitter, Mail, Phone, MapPin,
  CheckCircle, Zap, Award, Lock, Target, Building2, Cpu, HeartPulse,
  Truck, ShoppingBag, Factory, Leaf, Home, GraduationCap, Cookie,
  Network, Clock, Star, ArrowUpRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getMarketHome } from "../../api/market";


// ─── Helpers ─────────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, inView: boolean, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return count;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(22px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    scroll-behavior: smooth;

    /* Brand Colors */
    --primary: #044575;
    --secondary: #005F6B;
    --accent: #006B2E;

    --primary-hover: #03517F;
    --text-dark: #0A1A2F;
    --white: #FFFFFF;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--white);
  }

  ::-webkit-scrollbar { width: 5px; }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 10px;
  }

  .btn-primary {
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--white);
    background: linear-gradient(
      90deg,
      var(--primary) 0%,
      var(--secondary) 50%,
      var(--accent) 100%
    );
    border: none;
    border-radius: 6px;
    padding: 12px 28px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary:hover {
    filter: brightness(1.08);
  }

  .btn-primary:active {
    transform: scale(0.98);
  }

  .btn-outline {
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--primary);
    background: transparent;
    border: 1.5px solid var(--primary);
    border-radius: 6px;
    padding: 12px 28px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-outline:hover {
    background: rgba(4, 69, 117, 0.08);
  }

  .btn-outline:active {
    transform: scale(0.98);
  }

  .nav-link {
    background: none;
    border: none;
    cursor: pointer;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-dark);
    padding: 4px 0;
    position: relative;
    letter-spacing: 0.01em;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: var(--primary);
    transition: width 0.25s ease;
  }

  .nav-link:hover::after {
    width: 100%;
  }

  .card-hover {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: default;
  }

  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 48px -12px rgba(4, 69, 117, 0.18) !important;
}
  @keyframes progress {
  0% {
    transform: scaleX(0);
  }

  100% {
    transform: scaleX(1);
  }
}
  .loading-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;

  background: #000;

  display: flex;
  align-items: center;
  justify-content: center;

  animation: bgFade 0.8s ease forwards;
}

.loading-content {
  text-align: center;
}

.loading-logo {
  width: 240px;
  height: auto;

  opacity: 0;
  transform: scale(0.7);

  animation: logoReveal 1s ease forwards;
  animation-delay: 0.3s;
}

.loading-title {
  margin-top: 24px;

  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;

  color: white;

  opacity: 0;

  animation: textReveal 0.8s ease forwards;
  animation-delay: 0.8s;
}

.loading-bar {
  width: 260px;
  height: 4px;

  margin: 30px auto 0;

  background: rgba(255,255,255,0.12);
  border-radius: 999px;
  overflow: hidden;

  opacity: 0;

  animation: textReveal 0.6s ease forwards;
  animation-delay: 1s;
}

.loading-bar-fill {
  height: 100%;
  width: 100%;

  transform-origin: left;

  background: linear-gradient(
    90deg,
    #044575 0%,
    #00AEEF 50%,
    #00D66F 100%
  );

  animation: progressFill 1.8s ease forwards;
}

@keyframes bgFade {
  from {
    background: #011741;
  }
  to {
    background: #002873;
  }
}

@keyframes logoReveal {
  from {
    opacity: 0;
    transform: scale(0.7);
    filter: blur(10px);
  }

  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

@keyframes textReveal {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressFill {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

  @media (max-width: 900px) {
    .hidden-mobile { display: none !important; }
    .show-mobile { display: flex !important; }
  }
`;
// ─── Loading Screen ───────────────────────────────────────────────────────────
// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <img
          src="/logo.jpeg"
          alt="DNH Fintech"
          className="loading-logo"
        />

        <h1 className="loading-title">
          DnH Fintech
        </h1>

        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      </div>
    </div>
  );
}
// ─── Cookie Banner ────────────────────────────────────────────────────────────

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("dnh_cookies");
    if (!accepted) setTimeout(() => setVisible(true), 2500);
  }, []);

  const accept = () => {
    localStorage.setItem("dnh_cookies", "1");
    setVisible(false);
  };

  const decline = () => setVisible(false);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        right: 24,
        zIndex: 1000,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(90deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: "0 20px 60px -10px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <Cookie
          size={20}
          color="#FFFFFF"
          style={{ flexShrink: 0, marginTop: 2 }}
        />

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              margin: "0 0 6px",
            }}
          >
            We use cookies
          </p>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            To improve your experience and analyze usage. No data is sold to
            third parties.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          <button
            onClick={decline}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 5,
              padding: "7px 14px",
              color: "rgba(255,255,255,0.85)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Decline
          </button>

          <button
            onClick={accept}
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 5,
              padding: "7px 14px",
              color: "#044575",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Accept
          </button>

          <button
            onClick={accept}
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 5,
              padding: "7px 14px",
              color: "#044575",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Accept essential
          </button>
        </div>
      </div>
    </div>
  );
}



type StockData = {
  symbol: string;
  price: string;
  change: string;
  color: string;
};

function MarketTicker() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [marketStatus, setMarketStatus] = useState<{
    status: string;
    isOpen: boolean;
    lastUpdated: string;
  } | null>(null);

  // Fetch live stock data
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const data = await getMarketHome();

        setStockData(data.ticker);

        setMarketStatus(data.market);
      } catch (error) {
        console.error("Ticker Error:", error);
      }
    };

    fetchTickerData();

    const interval = setInterval(fetchTickerData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Existing animation
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    let animationId: number;
    let startTime = 0;
    const duration = 30000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const progress = (timestamp - startTime) / duration;

      if (!isPaused) {
        const translateX = -(progress * 50) % 50;
        ticker.style.transform = `translateX(${translateX}%)`;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  return (
    <section
      style={{
        background: "#0A1A2F",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 0",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={tickerRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {stockData.length > 0 ? (
          [...stockData, ...stockData].map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  letterSpacing: "0.03em",
                }}
              >
                {stock.symbol}
              </span>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#94A3B8",
                }}
              >
                {stock.price}
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: stock.color,
                  background: `${stock.color}15`,
                  padding: "2px 10px",
                  borderRadius: 4,
                }}
              >
                {stock.change}
              </span>

              <span
                style={{
                  width: 1,
                  height: 20,
                  background: "rgba(255,255,255,0.08)",
                  marginLeft: 8,
                }}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              color: "#94A3B8",
              fontSize: 13,
              paddingLeft: 20,
            }}
          >
            Loading market data...
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 80,
          height: "100%",
          background:
            "linear-gradient(90deg, #0A1A2F 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: "100%",
          background:
            "linear-gradient(270deg, #0A1A2F 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 16,
          transform: "translateY(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(10,26,47,0.95)",
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 12,
          fontWeight: 600,
          color: marketStatus?.isOpen ? "#10B981" : "#EF4444",
        }}
      >
        <span>
          {marketStatus?.isOpen ? "🟢 Market Open" : "🔴 Market Closed"}
        </span>
      </div>
    </section>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Services", "Why DnH", "Verticals", "Success Stories",  "Insights", "Contact"];
function Navbar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const scrollY = useScrollY();
  const solid = scrollY > 80;

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(
      id.toLowerCase().replace(/\s+/g, "-")
    );
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: solid ? "rgba(255,255,255,0.97)" : "transparent",
          boxShadow: solid ? "0 1px 0 #E2E8F0" : "none",
          backdropFilter: solid ? "blur(12px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
      
      <div
  style={{
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 32px",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    height: 68,
    gap: "32px",
  }}
>
  {/* Logo - Left */}
  <button
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <img
      src="/logo.jpeg"
      alt="DNH Fintech"
      style={{
        height: 52,
        width: "auto",
        objectFit: "contain",
      }}
    />
  </button>

  {/* Navigation Links - Centered */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 40,
    }}
    className="hidden-mobile"
  >
    {NAV_LINKS.map((l) => (
      <button
        key={l}
        onClick={() => scrollTo(l)}
        className="nav-link"
        style={{
          whiteSpace: "nowrap", // Prevents text wrapping
        }}
      >
        {l}
      </button>
    ))}
  </div>

  {/* Right side buttons */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      justifyContent: "flex-end",
    }}
    className="hidden-mobile"
  >
    <button
      onClick={() => scrollTo("Contact")}
      className="btn-outline"
      style={{ padding: "9px 16px", fontSize: 13, whiteSpace: "nowrap" }}
    >
      Book a Meeting
    </button>

    <button
      onClick={() => scrollTo("Contact")}
      className="btn-primary"
      style={{ padding: "9px 16px", fontSize: 13, whiteSpace: "nowrap" }}
    >
      Request Funding
    </button>
  </div>

  {/* Mobile menu button */}
  <button
    className="show-mobile"
    onClick={() => setMobileOpen(!mobileOpen)}
    style={{
      marginLeft: "auto",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#044575",
      display: "none",
    }}
  >
    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
  </button>
</div>
      </nav>

      {/* Mobile Menu - stays the same */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 200,
          width: "80%",
          maxWidth: 340,
          background:
            "linear-gradient(180deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
          transform: mobileOpen
            ? "translateX(0)"
            : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          padding: "80px 36px 40px",
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#FFFFFF",
          }}
        >
          <X size={22} />
        </button>

        {NAV_LINKS.map((l) => (
          <button
            key={l}
            onClick={() => scrollTo(l)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 500,
              color: "#FFFFFF",
              textAlign: "left",
              padding: "14px 0",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {l}
          </button>
        ))}

        <button
          onClick={() => scrollTo("Contact")}
          className="btn-primary"
          style={{ marginTop: 32 }}
        >
          Request Funding
        </button>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 199,
            background: "rgba(4,69,117,0.45)",
          }}
        />
      )}
    </>
  );
}
// Hero Section
function StatItem({
  value,
  prefix = "",
  suffix = "",
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const { ref, inView } = useInView();
  const count = useCountUp(value, inView);

  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        padding: "24px 16px",
        borderRight: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 36,
          fontWeight: 700,
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        {prefix}
        {count}
        {suffix}
      </div>

      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.75)",
          marginTop: 8,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
        paddingTop: 140,
        paddingBottom: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px 72px",
        }}
      >
        <Reveal>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#FFFFFF",
              }}
            />

            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.9)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Capital Advisory &amp; Investment Banking
            </span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(42px, 5.5vw, 72px)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginBottom: 24,
              maxWidth: 800,
            }}
          >
            Capital Raising.
            <br />
            <span
              style={{
                color: "#CFFAFE",
                fontStyle: "italic",
              }}
            >
              Strategically
            </span>{" "}
            Executed.
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.75,
              maxWidth: 540,
              marginBottom: 40,
            }}
          >
            Strategic capital advisory for companies seeking debt, equity, or
            hybrid funding — with discretion and institutional precision.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            
            <Link
  to="/get-started"
  className="btn-outline"
  style={{
    fontSize: 15,
    padding: "14px 32px",
    color: "#FFFFFF",
    borderColor: "rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.08)",
    display: "inline-block", // important for links to behave like buttons
    textDecoration: "none",  // remove underline
    borderRadius: "inherit",  // match your button's border radius
  }}
>
  GET STARTED
</Link>

<button
  onClick={() => scrollTo("contact")}
  className="btn-outline"
  style={{
    fontSize: 15,
    padding: "14px 32px",
    color: "#FFFFFF",
    borderColor: "rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.08)",
  }}
>
  Contact Us <ArrowUpRight size={16} />
</button>

            <button
              onClick={() => scrollTo("services")}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "14px 8px",
              }}
            >
              View Services <ChevronRight size={15} />
            </button>
          </div>
        </Reveal>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
          }}
          className="stats-grid"
        >
          <StatItem
            prefix="$"
            value={2.5}
            suffix="B+"
            label="Capital Raised"
          />

          <StatItem
            value={150}
            suffix="+"
            label="Transactions"
          />

          <StatItem
            value={25}
            suffix="+"
            label="Countries"
          />

          <StatItem
            value={4000}
            suffix="+"
            label="Active Investors"
          />
        </div>
      </div>

      <style>{`
        .stats-grid > div:last-child {
          border-right: none !important;
        }

        @media (max-width: 700px) {
          .stats-grid {
            grid-template-columns: repeat(2,1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
const TRUSTED = [
  "Goldman Sachs",
  "BlackRock",
  "Sequoia Capital",
  "Temasek",
  "KKR",
  "Warburg Pincus",
  "Carlyle Group",
  "HDFC Bank",
];
//Trusted By
function TrustedBy() {
  return (
    <section
      style={{
        background: "#FFFFFF",
        padding: "40px 32px",
        borderBottom: "1px solid rgba(4,69,117,0.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "#005F6B",
              textTransform: "uppercase",
              flexShrink: 0,
              fontWeight: 600,
            }}
          >
            Trusted by
          </span>

          {TRUSTED.map((n) => (
            <span
              key={n}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#94A3B8",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                transition: "color 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLSpanElement).style.color = "#044575";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLSpanElement).style.color = "#94A3B8";
              }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

//trust-by-ribbon

// ─── Combined Trust Ribbon ────────────────────────────────────────────────────
// ─── Combined Trust Ribbon with Logos ───────────────────────────────────────

const ALL_PARTNERS = [
  // Fund Houses
  { 
    name: "SBI", 
    type: "Fund House", 
    logo: "/logos/sbi.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "LIC", 
    type: "Fund House", 
    logo: "/logos/lic.svg",
    fallbackColor: "#E31E24"
  },
  { 
    name: "UTI", 
    type: "Fund House", 
    logo: "/logos/uti.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "HDFC", 
    type: "Fund House", 
    logo: "/logos/hdfc.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "ICICI Prudential", 
    type: "Fund House", 
    logo: "/logos/icici-prudential.svg",
    fallbackColor: "#E31E24"
  },
  { 
    name: "NUVAMA", 
    type: "Fund House", 
    logo: "/logos/nuvama.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Incred", 
    type: "Fund House", 
    logo: "/logos/incred.svg",
    fallbackColor: "#ED1B24"
  },
  { 
    name: "Neo Assets", 
    type: "Fund House", 
    logo: "/logos/neo-assets.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "Capri Global", 
    type: "Fund House", 
    logo: "/logos/capri-global.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Maxlife", 
    type: "Fund House", 
    logo: "/logos/maxlife.svg",
    fallbackColor: "#E31E24"
  },
  { 
    name: "Bajaj Finserv", 
    type: "Fund House", 
    logo: "/logos/bajaj-finserv.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "Apollo Global", 
    type: "Fund House", 
    logo: "/logos/apollo-global.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Edelweiss", 
    type: "Fund House", 
    logo: "/logos/edelweiss.svg",
    fallbackColor: "#004B87"
  },
  // Family Offices
  { 
    name: "Lloyds", 
    type: "Family Office", 
    logo: "/logos/lloyds.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Rolex", 
    type: "Family Office", 
    logo: "/logos/rolex.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "Halidaram", 
    type: "Family Office", 
    logo: "/logos/halidaram.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "DLF", 
    type: "Family Office", 
    logo: "/logos/dlf.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "Patni", 
    type: "Family Office", 
    logo: "/logos/patni.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Hiranandani", 
    type: "Family Office", 
    logo: "/logos/hiranandani.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "Oberoi", 
    type: "Family Office", 
    logo: "/logos/oberoi.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "JSW", 
    type: "Family Office", 
    logo: "/logos/jsw.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "JK Lakshmi", 
    type: "Family Office", 
    logo: "/logos/jk-lakshmi.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "Samco", 
    type: "Family Office", 
    logo: "/logos/samco.svg",
    fallbackColor: "#004B87"
  },
  { 
    name: "SMC", 
    type: "Family Office", 
    logo: "/logos/smc.svg",
    fallbackColor: "#1B369F"
  },
  { 
    name: "ShareIndia", 
    type: "Family Office", 
    logo: "/logos/shareindia.svg",
    fallbackColor: "#004B87"
  },
];

// Logo Component with Fallback
function PartnerLogo({ 
  src, 
  name, 
  fallbackColor,
  size = 28 
}: { 
  src: string; 
  name: string; 
  fallbackColor: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `${fallbackColor}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.45,
          fontWeight: 700,
          color: fallbackColor,
          flexShrink: 0,
          fontFamily: "Inter, sans-serif",
          border: `1px solid ${fallbackColor}20`,
        }}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{
        height: size,
        width: "auto",
        maxWidth: 60,
        objectFit: "contain",
        flexShrink: 0,
        filter: "brightness(0.9) contrast(1.1)",
        transition: "filter 0.3s ease",
      }}
      onError={() => setError(true)}
    />
  );
}

function CombinedTrustRibbon() {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const ribbon = ribbonRef.current;
    if (!ribbon) return;

    let animationId: number;
    let startTime: number;
    const duration = 45000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;
      
      if (!isPaused) {
        const translateX = -(progress * 100) % 100;
        ribbon.style.transform = `translateX(${translateX}%)`;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  return (
    <section
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        borderBottom: "1px solid #E2E8F0",
        padding: "24px 0",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Header */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px 14px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#044575",
                letterSpacing: "-0.02em",
              }}
            >
              Partner Network
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 9,
                color: "#CBD5E1",
                fontWeight: 300,
              }}
            >
              |
            </span>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ 
                  width: 5, 
                  height: 5, 
                  borderRadius: "50%", 
                  background: "#044575",
                  display: "inline-block"
                }} />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    fontWeight: 500,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Funds
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ 
                  width: 5, 
                  height: 5, 
                  borderRadius: "50%", 
                  background: "#006B2E",
                  display: "inline-block"
                }} />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    fontWeight: 500,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Family
                </span>
              </div>
            </div>
          </div>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
              color: "#CBD5E1",
              letterSpacing: "0.06em",
            }}
          >
            ● Hover to pause
          </span>
        </div>
      </div>

      {/* Scrolling Ribbon with Logos */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          whiteSpace: "nowrap",
          willChange: "transform",
          padding: "12px 0",
        }}
        ref={ribbonRef}
      >
        {[...ALL_PARTNERS, ...ALL_PARTNERS, ...ALL_PARTNERS].map((partner, index) => {
          const isFund = partner.type === "Fund House";
          const color = isFund ? "#044575" : "#006B2E";
          
          return (
            <div
              key={`${partner.name}-${index}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#F8FAFC",
                padding: "8px 18px 8px 12px",
                borderRadius: 6,
                border: "1px solid #E2E8F0",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = "#FFFFFF";
                el.style.borderColor = color;
                el.style.transform = "translateY(-2px) scale(1.02)";
                el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "#F8FAFC";
                el.style.borderColor = "#E2E8F0";
                el.style.transform = "translateY(0) scale(1)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Logo or Fallback */}
              <PartnerLogo 
                src={partner.logo} 
                name={partner.name}
                fallbackColor={partner.fallbackColor}
                size={28}
              />

              {/* Name */}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#1E293B",
                  letterSpacing: "0.01em",
                }}
              >
                {partner.name}
              </span>

              {/* Type Badge */}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 8,
                  fontWeight: 600,
                  color: color,
                  background: isFund ? "rgba(4,69,117,0.06)" : "rgba(0,107,46,0.06)",
                  padding: "2px 8px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {isFund ? "Fund" : "Family"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Gradient overlays */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 80,
          height: "100%",
          background: "linear-gradient(90deg, #FFFFFF 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: "100%",
          background: "linear-gradient(270deg, #FFFFFF 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @media (max-width: 768px) {
          .partner-item {
            padding: 6px 12px 6px 8px !important;
            gap: 6px !important;
          }
          .partner-name {
            font-size: 10px !important;
          }
          .partner-logo {
            height: 20px !important;
            max-width: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}


// Add this component after your TrustedBy component and before Services

// ─── Stock Market Ticker ──────────────────────────────────────────────────────


// ─── Services ─────────────────────────────────────────────────────────────────



const SERVICES = [
  {
    icon: <TrendingUp size={20} />,
    title: "Debt Funding",
    desc: "Structured debt — senior secured to sub notes.",
    expandedDesc:
      "We design bespoke debt solutions tailored to your risk profile and capital needs, from senior secured loans to subordinated notes, ensuring optimal leverage while preserving operational flexibility.",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Equity Capital",
    desc: "Growth and late-stage placements with institutions.",
    expandedDesc:
      "We facilitate growth and late-stage equity placements with institutional investors, structuring deals that align with your valuation expectations and long-term strategic goals.",
  },
  {
    icon: <Globe size={20} />,
    title: "Project Finance",
    desc: "Long-tenor, asset-backed infrastructure financing.",
    expandedDesc:
      "Our project finance team structures long-tenor, asset-backed infrastructure financing solutions, managing risk allocation and capital structuring for large-scale projects across sectors.",
  },
  {
    icon: <Briefcase size={20} />,
    title: "Working Capital",
    desc: "Short-cycle liquidity for operational continuity.",
    expandedDesc:
      "We provide short-cycle working capital solutions to maintain operational continuity, optimize cash conversion cycles, and support day-to-day business needs.",
  },
  {
    icon: <Users size={20} />,
    title: "IPO",
    desc: "SME/MAIN BOARD",
    expandedDesc:
      "We help you build and execute investor relations strategies, manage roadshows, and communicate effectively with the capital markets to enhance valuation and investor confidence.",
  },
  {
    icon: <Shield size={20} />,
    title: "Growth Capital",
    desc: "Expansion-stage capital for scaling companies.",
    expandedDesc:
      "We provide expansion-stage growth capital to help scaling companies accelerate market penetration, product development, and operational scaling while maintaining strategic alignment.",
  },
];

function Services() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const openModal = (index) => {
    setExpandedIndex(index);
  };

  const closeModal = () => {
    setExpandedIndex(null);
  };

  return (
    <section
      id="services"
      style={{
        background: "#F7FAFC",
        padding: "72px 32px",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#005F6B",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Our Services
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 700,
                color: "#044575",
                lineHeight: 1.2,
                marginTop: 10,
                marginBottom: 12,
              }}
            >
              Advisory Across Every Capital Structure
            </h2>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "#64748B",
                lineHeight: 1.7,
                maxWidth: 500,
              }}
            >
              From early-stage growth to complex cross-border transactions —
              we structure the right capital at the right terms.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
          }}
          className="services-grid"
        >
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <div
                className="card-hover"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 10,
                  padding: "28px 24px",
                  border: "1px solid rgba(4,69,117,0.12)",
                  boxShadow: "0 4px 16px -4px rgba(4,69,117,0.08)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, rgba(4,69,117,0.12) 0%, rgba(0,95,107,0.12) 50%, rgba(0,107,46,0.12) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    color: "#005F6B",
                  }}
                >
                  {s.icon}
                </div>

                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#044575",
                    marginBottom: 8,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#64748B",
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>

                <button
                  onClick={() => openModal(i)}
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#006B2E",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Learn more <ChevronRight size={13} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Modal overlay */}
      {expandedIndex !== null && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "32px 28px",
              border: "1px solid rgba(4,69,117,0.12)",
              boxShadow: "0 8px 32px -8px rgba(4,69,117,0.16)",
              maxWidth: 500,
              width: "100%",
              position: "relative",
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 20,
                color: "#64748B",
                cursor: "pointer",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(4,69,117,0.12) 0%, rgba(0,95,107,0.12) 50%, rgba(0,107,46,0.12) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                color: "#005F6B",
              }}
            >
              {SERVICES[expandedIndex].icon}
            </div>

            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 600,
                color: "#044575",
                marginBottom: 8,
              }}
            >
              {SERVICES[expandedIndex].title}
            </h3>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              {SERVICES[expandedIndex].desc}
            </p>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {SERVICES[expandedIndex].expandedDesc}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){
          .services-grid{
            grid-template-columns:repeat(2,1fr)!important;
          }
        }

        @media(max-width:580px){
          .services-grid{
            grid-template-columns:1fr!important;
          }
        }

        .modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          animation: scaleIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}

// ─── Why DNH — Diagrammatic ───────────────────────────────────────────────────

const WHY_ITEMS = [
  { icon: <Network size={28} />, stat: "4000+", label: "Investors", title: "Deep Network", desc: "Direct access to PE, VC, family offices." },
  { icon: <Clock size={28} />, stat: "6 Weeks", label: "Avg close", title: "Speed to Close", desc: "Fastest placement in our category." },
  { icon: <Award size={28} />, stat: "$2.5B+", label: "Deployed", title: "Proven Results", desc: "150+ closed transactions across 25 countries." },
  { icon: <Lock size={28} />, stat: "100%", label: "Confidential", title: "Full Discretion", desc: "Signed NDAs. Your mandate is never shopped." },
  { icon: <Target size={28} />, stat: "End-to-End", label: "Service", title: "Full Advisory", desc: "Structure → Docs → Placement → Close." },
  { icon: <Star size={28} />, stat: "Since 2010", label: "Years", title: "Track Record", desc: "Institutional discipline, entrepreneurial speed." },
];

function WhyDNH() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
    
      id="why-dnh"
      style={{
        background: "#FFFFFF",
        padding: "72px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div
            style={{
              textAlign: "center",
              marginBottom: 52,
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#005F6B",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Why DnH
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 700,
                color: "#044575",
                lineHeight: 1.2,
                marginTop: 10,
                marginBottom: 12,
              }}
            >
              Built for Capital That Demands Excellence
            </h2>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "#64748B",
                lineHeight: 1.7,
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Hover any metric to understand what it means for your mandate.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
            maxWidth: 900,
            margin: "0 auto",
          }}
          className="why-grid"
        >
          {WHY_ITEMS.map((w, i) => (
            <Reveal key={w.title} delay={i * 55}>
              <div
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{
                  padding: "36px 28px",
                  textAlign: "center",
                  cursor: "default",
                  background:
                    active === i
                      ? "linear-gradient(135deg, #044575 0%, #005F6B 50%, #006B2E 100%)"
                      : "#F7FAFC",
                  border: "2px solid",
                  borderColor:
                    active === i
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(4,69,117,0.12)",
                  borderRadius: 12,
                  transition: "all 0.28s ease",
                  transform: active === i ? "scale(1.03)" : "scale(1)",
                  zIndex: active === i ? 2 : 1,
                  position: "relative",
                  boxShadow:
                    active === i
                      ? "0 20px 40px -12px rgba(4,69,117,0.25)"
                      : "0 4px 16px -4px rgba(4,69,117,0.06)",
                }}
              >
                <div
                  style={{
                    color: active === i ? "#FFFFFF" : "#005F6B",
                    marginBottom: 16,
                    transition: "color 0.28s",
                  }}
                >
                  {w.icon}
                </div>

                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: active === i ? "#FFFFFF" : "#044575",
                    lineHeight: 1,
                    marginBottom: 4,
                    transition: "color 0.28s",
                  }}
                >
                  {w.stat}
                </div>

                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: active === i ? "#CFFAFE" : "#006B2E",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 12,
                    transition: "color 0.28s",
                  }}
                >
                  {w.label}
                </div>

                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: active === i ? "#FFFFFF" : "#044575",
                    marginBottom: 8,
                    transition: "color 0.28s",
                  }}
                >
                  {w.title}
                </div>

                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color:
                      active === i
                        ? "rgba(255,255,255,0.8)"
                        : "#64748B",
                    lineHeight: 1.55,
                    transition: "color 0.28s",
                  }}
                >
                  {w.desc}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:700px){
          .why-grid{
            grid-template-columns:repeat(2,1fr)!important;
          }
        }

        @media(max-width:450px){
          .why-grid{
            grid-template-columns:1fr!important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Industry Verticals ───────────────────────────────────────────────────────

const VERTICALS = [
  { icon: <Cpu size={24} />, name: "Technology", deals: "8 deals" },
  { icon: <HeartPulse size={24} />, name: "Healthcare", deals: "15 deals" },
  { icon: <Truck size={24} />, name: "Financial Services", deals: "3 deals" },
  { icon: <ShoppingBag size={24} />, name: "NPA Mandates", deals: "8 deals" },
  { icon: <Factory size={24} />, name: "Manufacturing", deals: "22 deals" },
  { icon: <Leaf size={24} />, name: "Energy", deals: "20 deals" },
  { icon: <Home size={24} />, name: "Real Estate", deals: "28 deals" },
  { icon: <GraduationCap size={24} />, name: "IPO", deals: "16 deals" },
];

function IndustryVerticals() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="verticals"
      style={{
        background: "#F7FAFC",
        padding: "72px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 48,
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "#005F6B",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Industry Verticals
              </span>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(28px,4vw,40px)",
                  fontWeight: 700,
                  color: "#044575",
                  lineHeight: 1.2,
                  marginTop: 10,
                }}
              >
                Sector-Specific Capital Expertise
              </h2>
            </div>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#64748B",
                maxWidth: 340,
                lineHeight: 1.7,
              }}
            >
              Deep domain knowledge across eight high-growth verticals —
              enabling precise investor matching and credible positioning.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
          className="vert-grid"
        >
          {VERTICALS.map((v, i) => (
            <Reveal key={v.name} delay={i * 50}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:
                    hovered === i
                      ? "linear-gradient(135deg, #044575 0%, #005F6B 50%, #006B2E 100%)"
                      : "#FFFFFF",
                  border: `1.5px solid ${
                    hovered === i
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(4,69,117,0.12)"
                  }`,
                  borderRadius: 10,
                  padding: "28px 20px",
                  transition: "all 0.25s ease",
                  transform:
                    hovered === i ? "translateY(-4px)" : "translateY(0)",
                  boxShadow:
                    hovered === i
                      ? "0 16px 40px -8px rgba(4,69,117,0.25)"
                      : "0 2px 8px rgba(4,69,117,0.06)",
                  cursor: "default",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: hovered === i ? "#FFFFFF" : "#005F6B",
                    marginBottom: 14,
                    transition: "color 0.25s",
                  }}
                >
                  {v.icon}
                </div>

                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: hovered === i ? "#FFFFFF" : "#044575",
                    marginBottom: 6,
                    transition: "color 0.25s",
                  }}
                >
                  {v.name}
                </div>

                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color:
                      hovered === i
                        ? "rgba(255,255,255,0.8)"
                        : "#006B2E",
                    letterSpacing: "0.06em",
                    transition: "color 0.25s",
                  }}
                >
                  {v.deals}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .vert-grid{
            grid-template-columns:repeat(3,1fr)!important;
          }
        }

        @media(max-width:600px){
          .vert-grid{
            grid-template-columns:repeat(2,1fr)!important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Success Stories ─────────────────────────────────────────────────────────



const STORIES = [
  {
    company: "Steel Plant Manufacturer",
    industry: "Manufacturing",
    raised: "₹235 Cr",
    structure: "Asset-Backed Financing",
    outcome:
      "Limited access to traditional lending due to nonprofit structure and collateral constraints. Secured asset-backed financing through a customised consortium structure.",
  },
  {
    company: "Non-Profit Turnaround Real Estate",
    industry: "Real Estate",
    raised: "₹570 Cr",
    structure: "Structured Debt",
    outcome:
      "High-value assets remained illiquid, restricting large-scale refinancing. Structured debt against hospitality and commercial assets to unlock capital.",
  },
  {
    company: "OEM Manufacturer",
    industry: "Manufacturing",
    raised: "₹340 Cr",
    structure: "Brownfield Financing",
    outcome:
      "Expansion plans faced delays due to conservative project finance norms. Arranged collateral-backed brownfield financing for faster disbursement.",
  },
  {
    company: "Solar Industry Restructuring",
    industry: "Renewable Energy",
    raised: "₹2,800 Cr @ 7.5%",
    structure: "Debt Refinancing",
    outcome:
      "High-cost legacy debt across SPVs reduced project returns and growth capacity. Refinanced and restructured debt, lowering borrowing costs to 7.5%.",
  },
];

function SuccessStories() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % STORIES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
  };

  return (
    <section
      id="success-stories"
      style={{
        background: "#FFFFFF",
        padding: "72px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#005F6B",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Success Stories
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 700,
                color: "#044575",
                lineHeight: 1.2,
                marginTop: 10,
              }}
            >
              Featured Transactions
            </h2>
          </div>
        </Reveal>

        {/* Carousel wrapper */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="stories-carousel"
            style={{
              display: "flex",
              transition: "transform 0.3s ease",
              transform: `translateX(-${currentIndex * (100 / 3)}%)`,
            }}
          >
            {STORIES.map((s, i) => (
              <div
                key={s.company}
                style={{
                  flex: "0 0 calc(100% / 3)",
                  minWidth: 0,
                  padding: "0 10px",
                }}
              >
                <Reveal delay={i * 80}>
                  <div
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(4,69,117,0.12)",
                      boxShadow:
                        hovered === i
                          ? "0 24px 48px -12px rgba(4,69,117,0.18)"
                          : "0 4px 16px -4px rgba(4,69,117,0.08)",
                      transform:
                        hovered === i ? "translateY(-5px)" : "translateY(0)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
                        padding: "28px 24px 22px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 10,
                          letterSpacing: "0.18em",
                          color: "rgba(255,255,255,0.8)",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {s.industry}
                      </span>

                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 20,
                          fontWeight: 600,
                          color: "#FFFFFF",
                          marginTop: 6,
                          lineHeight: 1.2,
                          marginBottom: 14,
                        }}
                      >
                        {s.company}
                      </h3>

                      <div
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 6,
                          display: "inline-block",
                          padding: "4px 14px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#FFFFFF",
                          }}
                        >
                          {s.raised}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#FFFFFF",
                        padding: "22px 24px",
                      }}
                    >
                      <div style={{ marginBottom: 14 }}>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 10,
                            color: "#006B2E",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          Structure
                        </span>

                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#044575",
                            marginTop: 4,
                          }}
                        >
                          {s.structure}
                        </p>
                      </div>

                      <div>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 10,
                            color: "#006B2E",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          Outcome
                        </span>

                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            color: "#475569",
                            lineHeight: 1.6,
                            marginTop: 4,
                          }}
                        >
                          {s.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>

          {/* Left arrow */}
          <button
            onClick={prevSlide}
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              background: "#FFFFFF",
              border: "1px solid rgba(4,69,117,0.12)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(4,69,117,0.1)",
              zIndex: 10,
            }}
          >
            <ChevronLeft size={16} color="#044575" />
          </button>

          {/* Right arrow */}
          <button
            onClick={nextSlide}
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              background: "#FFFFFF",
              border: "1px solid rgba(4,69,117,0.12)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(4,69,117,0.1)",
              zIndex: 10,
            }}
          >
            <ChevronRight size={16} color="#044575" />
          </button>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .stories-carousel > div {
            flex: 0 0 calc(100% / 2) !important;
          }
        }

        @media(max-width:580px){
          .stories-carousel > div {
            flex: 0 0 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
// ─── Leadership ───────────────────────────────────────────────────────────────

// ─── Investor Network ─────────────────────────────────────────────────────────
const INVESTORS = [
  "Sequoia Capital",
  "Tiger Global",
  "SoftBank Vision",
  "HDFC Bank",
  "Kotak PE",
  "Blackstone",
  "KKR",
  "Temasek",
  "Motilal Oswal",
  "IIFL Finance",
  "L&T Finance",
  "Bajaj Finserv",
  "Warburg Pincus",
  "Carlyle Group",
  "True North",
];

function InvestorNetwork() {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
        padding: "72px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <Reveal>
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#CFFAFE",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Investor Network
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
                marginTop: 10,
                marginBottom: 12,
              }}
            >
              Direct Access to 4000+ Investors
            </h2>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.8)",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              VCs, PE Funds, Banks, NBFCs, Family Offices — all within our
              proprietary network.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {INVESTORS.map((name, i) => (
            <Reveal key={name} delay={i * 35}>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  padding: "10px 20px",
                  background: "rgba(255,255,255,0.08)",
                  cursor: "default",
                  transition: "all 0.25s ease",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "#CFFAFE";
                  el.style.background = "rgba(255,255,255,0.18)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                  el.style.background = "rgba(255,255,255,0.08)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.9)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
// ─── Insights ─────────────────────────────────────────────────────────────────


function Insights() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const data = await getMarketHome();
        setInsights(data.insights);
      } catch (err) {
        console.error(err);
      }
    };

    loadInsights();
  }, []);

  return (
    <section
      id="insights"
      style={{
        background: "#FFFFFF",
        padding: "72px 32px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#005F6B",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Insights
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 700,
                color: "#044575",
                lineHeight: 1.2,
                marginTop: 10,
              }}
            >
              Market Intelligence
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
          }}
          className="insights-grid"
        >
          {insights.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 10,
                  border: `1.5px solid ${
                    hovered === i ? "#005F6B" : "#E2E8F0"
                  }`,
                  padding: "28px",
                  boxShadow:
                    hovered === i
                      ? "0 20px 40px -10px rgba(4,69,117,0.12)"
                      : "0 4px 16px -4px rgba(0,0,0,0.06)",
                  transform:
                    hovered === i ? "translateY(-4px)" : "translateY(0)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "#006B2E",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  {item.sentiment?.toUpperCase() ?? "MARKET UPDATE"}
                </span>

                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 19,
                    fontWeight: 600,
                    color: "#044575",
                    lineHeight: 1.3,
                    marginBottom: 12,
                    flex: 1,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#64748B",
                    lineHeight: 1.65,
                    marginBottom: 20,
                  }}
                >
                  {item.source}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #E2E8F0",
                    paddingTop: 18,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: hovered === i ? "#006B2E" : "#005F6B",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "none",
                    }}
                  >
                    Read more
                    <ChevronRight size={13} />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .insights-grid{
            grid-template-columns:1fr!important;
          }
        }
      `}</style>
    </section>
  );
}
// ─── Contact ─────────────────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    funding: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputBase: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    color: "#044575",
    border: "1.5px solid #DCE7EE",
    borderRadius: 7,
    padding: "11px 14px",
    background: "#F7FAFC",
    outline: "none",
    width: "100%",
    transition: "all 0.2s ease",
  };

  return (
    <section
      id="contact"
      style={{
        background: "#F7FAFC",
        padding: "72px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "start",
        }}
        className="contact-grid"
      >
        <Reveal>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "#005F6B",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Contact Us
          </span>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px,4vw,40px)",
              fontWeight: 700,
              color: "#044575",
              lineHeight: 1.2,
              marginTop: 10,
              marginBottom: 16,
            }}
          >
            Begin Your Capital Journey
          </h2>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              color: "#64748B",
              lineHeight: 1.75,
              marginBottom: 36,
            }}
          >
            All inquiries are held in strict confidence. Our team responds
            within 24 hours.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {[
              {
                icon: <MapPin size={16} color="#005F6B" />,
                label: "Head quaters",
                val: "New Delhi",
              },
              {
                icon: <Mail size={16} color="#005F6B" />,
                label: "Email",
                val: "info@dnhfintech.com",
              },
              {
                icon: <Phone size={16} color="#005F6B" />,
                label: "Phone",
                val: "+91 11 4123 4567",
              },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(0,95,107,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {r.icon}
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      color: "#94A3B8",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    {r.label}
                  </div>

                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: "#044575",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "36px 32px",
              border: "1px solid #DCE7EE",
              boxShadow: "0 8px 32px -8px rgba(4,69,117,0.08)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(0,107,46,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <CheckCircle size={28} color="#006B2E" />
                </div>

                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#044575",
                    marginBottom: 10,
                  }}
                >
                  Message Received
                </h3>

                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: "#64748B",
                    lineHeight: 1.7,
                  }}
                >
                  Our advisory team will review your inquiry and respond within
                  one business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Name</label>

                    <input
                      style={inputBase}
                      placeholder="Vikram Rajan"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#005F6B";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#DCE7EE";
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>

                    <input
                      style={inputBase}
                      type="email"
                      placeholder="vikram@company.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#005F6B";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#DCE7EE";
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Company</label>

                  <input
                    style={inputBase}
                    placeholder="Acme Industries Ltd."
                    value={form.company}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, company: e.target.value }))
                    }
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#005F6B";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#DCE7EE";
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Funding Need</label>

                  <select
                    style={{
                      ...inputBase,
                      appearance:
                        "none" as React.CSSProperties["appearance"],
                    }}
                    value={form.funding}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, funding: e.target.value }))
                    }
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#005F6B";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#DCE7EE";
                    }}
                  >
                    <option value="">Select funding type</option>
                    <option>Debt Funding</option>
                    <option>Equity Capital</option>
                    <option>Project Finance</option>
                    <option>Working Capital</option>
                    <option>Growth Capital</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message</label>

                  <textarea
                    style={{
                      ...inputBase,
                      resize: "vertical" as React.CSSProperties["resize"],
                      minHeight: 100,
                    }}
                    placeholder="Brief description of your mandate, ticket size, and timeline..."
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#005F6B";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#DCE7EE";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    justifyContent: "center",
                    padding: "13px",
                    marginTop: 4,
                    fontSize: 14,
                    background:
                      "linear-gradient(90deg, #044575 0%, #005F6B 50%, #006B2E 100%)",
                    border: "none",
                  }}
                >
                  Submit Inquiry <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>

      <style>{`
        @media(max-width:900px){
          .contact-grid{
            grid-template-columns:1fr!important;
            gap:40px!important;
          }
        }
      `}</style>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const scrollTo = (id: string) => { const el = document.getElementById(id.toLowerCase().replace(/\s+/g, "-")); if (el) el.scrollIntoView({ behavior: "smooth" }); };
  const linkStyle: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 10, textDecoration: "none", cursor: "pointer", background: "none", border: "none", padding: 0, textAlign: "left", transition: "color 0.2s" };

  return (
  <footer
    style={{
      background: "#08111F",
      borderTop: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {/* CTA Section */}

    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "100px 32px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#60A5FA",
          marginBottom: 20,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Capital Advisory
      </p>

      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(36px,5vw,56px)",
          color: "#fff",
          marginBottom: 20,
          fontWeight: 700,
        }}
      >
        Ready to Raise Capital?
      </h2>

      <p
        style={{
          maxWidth: 700,
          margin: "0 auto 40px",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.8,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Access our network of investors, family offices and
        strategic funding partners.
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            background: "#2563EB",
            color: "#fff",
            border: "none",
            padding: "14px 28px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
        >
          Book a Meeting
        </button>

        <button
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "14px 28px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
        >
          Request Funding
        </button>
      </div>
    </div>

    {/* Footer */}

    <div
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "80px 32px 40px",
      }}
    >
      <div
        className="footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 60,
        }}
      >
        {/* Brand */}

        <div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 30,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            DNH Fintech
          </h3>

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.9,
              fontSize: 14,
              maxWidth: 320,
              marginBottom: 24,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Connecting businesses with capital, strategic investors and growth
            opportunities across debt, equity and structured finance.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            {[Linkedin, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                style={{
                  width: 38,
                  height: 38,
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Company */}

        <div>
          <h4
            style={{
              color: "#fff",
              marginBottom: 20,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Company
          </h4>

          {[
            "About Us",
            "Services",
            "Industries",
            "Leadership",
            "Insights",
          ].map((item) => (
            <p
              key={item}
              style={{
                color: "rgba(255,255,255,0.55)",
                marginBottom: 12,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {item}
            </p>
          ))}
        </div>

        {/* Services */}

        <div>
          <h4
            style={{
              color: "#fff",
              marginBottom: 20,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Services
          </h4>

          {[
            "Debt Funding",
            "Equity Capital",
            "Project Finance",
            "Working Capital",
            "Growth Capital",
          ].map((item) => (
            <p
              key={item}
              style={{
                color: "rgba(255,255,255,0.55)",
                marginBottom: 12,
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {item}
            </p>
          ))}
        </div>

        {/* Contact */}

        <div>
          <h4
            style={{
              color: "#fff",
              marginBottom: 20,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Contact
          </h4>

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              marginBottom: 14,
              fontFamily: "Inter, sans-serif",
            }}
          >
            info@dnhfintech.com
          </p>

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              marginBottom: 14,
              fontFamily: "Inter, sans-serif",
            }}
          >
            +91 7042997771
          </p>

          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.8,
              fontFamily: "Inter, sans-serif",
            }}
          >
            New Delhi
            <br />
            <br />
          </p>
        </div>
      </div>

      {/* Bottom Bar */}

      <div
        style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
          }}
        >
          © 2025 DNH Fintech Pvt. Ltd. All rights reserved.
        </p>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Disclaimer</span>
          <span>SEBI Compliance</span>
        </div>
      </div>
    </div>

    <style>{`
      @media (max-width: 900px) {
        .footer-grid {
          grid-template-columns: 1fr 1fr !important;
        }
      }

      @media (max-width: 600px) {
        .footer-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
  </footer>
);

}
// ─── App ───────────────────────────────────────────────────────
export default function dashboard() {
    const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoaded(true);
    }, 1800);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
  if (window.location.hash) {
    const id = window.location.hash.substring(1);

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  }
}, []);

  if (!loaded) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <CookieBanner />
      
      <Navbar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
 <div style={{ height: "68px" }} />

  <MarketTicker />
      <Hero />
      <CombinedTrustRibbon />
      
       
      <Services />
      <WhyDNH />
      <IndustryVerticals />
      <SuccessStories />
      <InvestorNetwork />
      <Insights />
      <Contact />
      <Footer />
    </>
  );
}