import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const gotootp = async () => {
    if (!isValidEmail) {
      const input = document.getElementById("email-input");
      input.classList.add("shake-error");
      setTimeout(() => input.classList.remove("shake-error"), 500);
      return;
    }

    setLoading(true);
    localStorage.setItem("email", email.trim().toLowerCase());
    localStorage.removeItem("mobile");

    try {
      const response = await apiFetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        alert(result.message || "Failed to send OTP. Please try again.");
        return;
      }

      if (result.deliveryError) {
        alert(`OTP was created, but email was not sent: ${result.deliveryError}`);
        return;
      }

      navigate("/otp");
    } catch (err) {
      console.error(err);
      alert("Could not connect to the server. Please start the backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") gotootp();
  };

  return (
    <div className="clean-login-layout">
      {/* Dynamic Background Orbs */}
      <div className="bg-shape shape-top-left"></div>
      <div className="bg-shape shape-bottom-right"></div>
      
      <div className="login-card-modern">
        <div className="login-logo-container">
          <div className="logo-circle">
            <span className="logo-emoji">⚽</span>
          </div>
        </div>
        
        <h1 className="login-heading">Welcome to Turf</h1>
        <p className="login-subheading">Enter your email ID to receive your login OTP.</p>

        <div className="input-group-modern">
          <label className="input-label-modern">Email ID</label>
          <div className={`input-field-wrapper ${focused ? "focused" : ""} ${isValidEmail ? "valid" : ""}`}>
            <div className="country-code">✉️</div>
            <div className="divider-vert"></div>
            <input
              id="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              className="phone-input-modern"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            {isValidEmail && (
              <div className="valid-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
          </div>
        </div>

        <button
          className={`primary-btn ${loading ? "btn-loading" : ""} ${isValidEmail ? "btn-active" : ""}`}
          onClick={gotootp}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loader-modern"></span>
          ) : (
            "Get OTP →"
          )}
        </button>

        <p className="terms-text">
          By continuing, you confirm that you agree to our <br/><a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

export default Login;
