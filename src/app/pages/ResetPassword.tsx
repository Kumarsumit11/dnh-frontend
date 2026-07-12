import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resetPassword } from "../../api/auth";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F8FAFC",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 430,
          background: "#fff",
          padding: 40,
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 30,
            color: "#044575",
          }}
        >
          Reset Password
        </h2>

        <input
          type="email"
          value={email}
          readOnly
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            background: "#F8FAFC",
          }}
        />

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #CBD5E1",
          }}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #CBD5E1",
          }}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 24,
            borderRadius: 8,
            border: "1px solid #CBD5E1",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: "#044575",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}