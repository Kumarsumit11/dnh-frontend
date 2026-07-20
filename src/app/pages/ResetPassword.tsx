import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resetPassword } from "../../api/auth";
import {
  ArrowLeft,
  Mail,
  Lock,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email] = useState(location.state?.email || "");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(email, otp, newPassword);

      alert("Password reset successfully.");

      navigate("/get-started");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px 14px 45px",
    borderRadius: 10,
    border: "1px solid #CBD5E1",
    background: "#F8FAFC",
    fontSize: 14,
    outline: "none",
    transition: "all .25s ease",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg,#F8FBFF 0%,#EEF6FF 45%,#E0F2FE 100%)",
        padding: 20,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
        }}
      >
        {/* Back */}

        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#475569",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "40px",
            boxShadow: "0 20px 60px rgba(15,23,42,.12)",
            border: "1px solid rgba(226,232,240,.9)",
          }}
        >
          {/* Header */}

          <div
            style={{
              textAlign: "center",
              marginBottom: 35,
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                margin: "0 auto 18px",
                background:
                  "linear-gradient(135deg,#044575,#0EA5E9)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ShieldCheck
                size={34}
                color="#fff"
              />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Reset Password
            </h2>

            <p
              style={{
                marginTop: 12,
                color: "#64748B",
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              Enter the OTP sent to your email and choose a secure new password.
            </p>
          </div>

          {/* Email */}

          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 8,
              display: "block",
              textTransform: "uppercase",
            }}
          >
            Email Address
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 22,
            }}
          >
            <Mail
              size={17}
              color="#94A3B8"
              style={{
                position: "absolute",
                top: "50%",
                left: 15,
                transform: "translateY(-50%)",
              }}
            />

            <input
              type="email"
              value={email}
              readOnly
              style={inputStyle}
            />
          </div>

          {/* OTP */}

          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 8,
              display: "block",
              textTransform: "uppercase",
            }}
          >
            Verification Code
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 22,
            }}
          >
            <KeyRound
              size={17}
              color="#94A3B8"
              style={{
                position: "absolute",
                top: "50%",
                left: 15,
                transform: "translateY(-50%)",
              }}
            />

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Password */}

          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 8,
              display: "block",
              textTransform: "uppercase",
            }}
          >
            New Password
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 22,
            }}
          >
            <Lock
              size={17}
              color="#94A3B8"
              style={{
                position: "absolute",
                top: "50%",
                left: 15,
                transform: "translateY(-50%)",
              }}
            />

            <input
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Confirm */}

          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 8,
              display: "block",
              textTransform: "uppercase",
            }}
          >
            Confirm Password
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 10,
            }}
          >
            <Lock
              size={17}
              color="#94A3B8"
              style={{
                position: "absolute",
                top: "50%",
                left: 15,
                transform: "translateY(-50%)",
              }}
            />

            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
              style={inputStyle}
            />
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#64748B",
              marginBottom: 26,
            }}
          >
            Password should contain at least 8 characters with a combination of uppercase, lowercase, number and symbol.
          </p>

          {/* Button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 15,
              borderRadius: 10,
              border: "none",
              background: loading
                ? "#94A3B8"
                : "linear-gradient(135deg,#044575,#0EA5E9)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              transition: ".3s",
              boxShadow: "0 10px 25px rgba(14,165,233,.25)",
            }}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 14,
              color: "#64748B",
            }}
          >
            Remember your password?{" "}
            <span
              onClick={() => navigate("/get-started")}
              style={{
                color: "#044575",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}