import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import "./Otp.css";

function Otp() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [backendOtp, setBackendOtp] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [ballAnimation, setBallAnimation] = useState(null);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const otp = digits.join("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleInput = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit) {
      setBallAnimation(index);
      setTimeout(() => setBallAnimation(null), 600);
    }

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      gotobooking();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setDigits(newDigits);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  };

  const gotobooking = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      navigate("/login");
      return;
    }
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const response = await apiFetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        const sessionId = result.sessionId || result.session_id;
        if (sessionId) localStorage.setItem("session_id", sessionId);
        localStorage.removeItem("redirect_after_login");
        setVerified(true);
        setTimeout(() => navigate("/booking", { state: { userId: result.userId, email: result.email } }), 800);
      } else {
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        const cards = document.querySelectorAll(".football-ball-modern");
        cards.forEach((c) => { c.classList.add("shake-error"); setTimeout(() => c.classList.remove("shake-error"), 500); });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    const email = localStorage.getItem("email");
    if (!email) { navigate("/login"); return; }
    try {
      const res = await apiFetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (result.success) {
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendCooldown(30);
        if (result.otp) setBackendOtp(result.otp);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      apiFetch(`/api/get-otp?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => { if (data && data.otp) setBackendOtp(data.otp); })
        .catch(() => {});
    }
  }, []);

  return (
    <div className="clean-otp-layout">
      {/* Background elements matches Login */}
      <div className="bg-shape shape-top-left"></div>
      <div className="bg-shape shape-bottom-right"></div>

      <div className={`otp-card-modern ${verified ? "verified-state" : ""}`}>
        <div className="otp-icon-container">
          <div className="icon-circle">
            <span className="icon-emoji">🛡️</span>
          </div>
        </div>

        <h1 className="otp-heading">Verify it's you</h1>
        <p className="otp-subheading">
          We've sent a code back of the net to<br />
          <strong className="text-dark">{localStorage.getItem("email") || "you@example.com"}</strong>
        </p>

        {backendOtp && (
          <div className="dev-otp-pill" onClick={() => {
            const d = backendOtp.toString().split("").concat(Array(6).fill("")).slice(0, 6);
            setDigits(d);
          }}>
            <span>Dev OTP: <strong>{backendOtp}</strong></span> (Tap to fill)
          </div>
        )}

        <div className="football-row-modern" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <div
              key={idx}
              className={`football-ball-modern ${digit ? "filled" : "empty"} ${ballAnimation === idx ? "ping" : ""} ${verified ? "success-bounce" : ""}`}
              onClick={() => inputRefs.current[idx]?.focus()}
            >
              <svg className="ball-svg-modern" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {digit ? (
                  <>
                    <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    <circle cx="50" cy="50" r="48" fill="url(#ballShade)" />
                    {/* Dark patches, leaving absolute center white */}
                    <polygon points="50,2 64,12 58,26 42,26 36,12" fill="#0f172a" />
                    <polygon points="16,65 26,55 40,60 38,76 22,78" fill="#0f172a" />
                    <polygon points="84,65 74,55 60,60 62,76 78,78" fill="#0f172a" />
                    <polygon points="2,35 15,30 22,42 12,52 0,45" fill="#0f172a" />
                    <polygon points="98,35 85,30 78,42 88,52 100,45" fill="#0f172a" />
                    <defs>
                      <radialGradient id="ballShade" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                      </radialGradient>
                    </defs>
                  </>
                ) : (
                  <>
                    <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="6" y1="50" x2="94" y2="50" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="50" y1="6" x2="50" y2="94" stroke="#e2e8f0" strokeWidth="1" />
                  </>
                )}
              </svg>

              {digit && <span className="ball-digit-modern">{digit}</span>}

              <input
                ref={(el) => (inputRefs.current[idx] = el)}
                className="hidden-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
              />
            </div>
          ))}
        </div>

        <button
          className={`primary-btn ${otp.length === 6 ? "btn-active" : ""} ${loading ? "btn-loading" : ""} ${verified ? "btn-success" : ""}`}
          onClick={gotobooking}
          disabled={loading || otp.length !== 6}
        >
          {verified ? (
            "✅ Verified!"
          ) : loading ? (
            <span className="btn-loader-modern"></span>
          ) : (
            "Verify & Continue"
          )}
        </button>

        <div className="otp-footer">
          {resendCooldown > 0 ? (
            <span className="resend-wait">Resend code in {resendCooldown}s</span>
          ) : (
            <span>Didn't receive it? <button className="text-btn" onClick={resendOtp}>Resend code</button></span>
          )}
        </div>

        <div className="back-link-modern" onClick={() => navigate("/login")}>
          ← Change email ID
        </div>
      </div>
    </div>
  );
}

export default Otp;
