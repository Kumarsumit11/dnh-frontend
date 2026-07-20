import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { forgotPassword } from "../../api/auth";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await forgotPassword(email);
      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          margin: "0 20px",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#475569",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            background: "#fff",
            padding: "40px 36px",
            borderRadius: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            border: "1px solid rgba(226,232,240,0.6)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}
            >
              Forgot Password
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#64748B",
                lineHeight: 1.5,
                maxWidth: 300,
                margin: "0 auto",
              }}
            >
              Enter your email and we’ll send you an OTP to reset your password.
            </p>
          </div>

          {/* Email input */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 14px 14px 42px",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontSize: 14,
                color: "#0f172a",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3B82F6";
                e.target.style.background = "#fff";
                e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E2E8F0";
                e.target.style.background = "#F8FAFC";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: loading
                ? "#94A3B8"
                : "linear-gradient(135deg, #1D4ED8, #3B82F6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: loading
                ? "none"
                : "0 4px 12px rgba(29,78,216,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(29,78,216,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(29,78,216,0.25)";
              }
            }}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#94A3B8",
            marginTop: 20,
          }}
        >
          Secure • Encrypted • RBI Compliant
        </p>
      </div>
    </div>
  );
}