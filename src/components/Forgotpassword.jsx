import { useState } from "react";
import { API_URL } from "../config";

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-card">
        <div className="auth-logo">G</div>
        <h1>Check your email</h1>
        <p className="auth-subtitle">
          If an account with that email exists, we've sent a password reset
          link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>

        <p className="auth-switch">
          <button type="button" onClick={onBackToLogin}>
            Back to login
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">G</div>
      <h1>Forgot password?</h1>
      <p className="auth-subtitle">
        Enter your email and we'll send you a reset link.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="auth-switch">
        Remembered your password?{" "}
        <button type="button" onClick={onBackToLogin}>
          Back to login
        </button>
      </p>
    </div>
  );
}

export default ForgotPassword;