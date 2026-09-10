import { useState } from "react";
import { API_URL } from "../config";

function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-card">
        <div className="auth-logo">G</div>
        <h1>Password reset!</h1>
        <p className="auth-subtitle">
          Your password has been changed successfully.
        </p>

        <button type="button" onClick={onDone}>
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">G</div>
      <h1>Set a new password</h1>
      <p className="auth-subtitle">
        Choose a new password for your G-GPT account.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>New password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label>Confirm new password</label>
        <input
          type="password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;