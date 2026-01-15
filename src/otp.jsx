import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Otp() {
  const [otp, setotp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ UPDATED: Single function to verify OTP and go to booking
  const gotobooking = async () => {
    const mobile = localStorage.getItem("mobile");

    // Check if mobile exists
    if (!mobile) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    // Validate OTP
    if (! otp || otp.length !== 6) {
      alert("Enter 6 digit OTP");
      return;
    }

    setLoading(true);

    try {
      console.log('[OTP] Verifying:', { mobile, otp });

      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type":  "application/json" },
        body: JSON.stringify({ mobile, otp })
      });

      const result = await response.json();
      console.log('[OTP] Response:', result);

      // ✅ Check for success and handle both sessionId and session_id
      if (response.ok && result.success) {
        const sessionId = result. sessionId || result.session_id;
        
        if (! sessionId) {
          alert("Session ID not received from server");
          return;
        }

        // ✅ Save session_id to localStorage
        localStorage.setItem("session_id", sessionId);
        console.log('[OTP] ✅ Session saved:', sessionId);

        // ✅ Clear redirect flag if exists
        localStorage.removeItem("redirect_after_login");

        // ✅ Navigate to booking page
        navigate("/booking", {
          state: {
            userId:  result.userId,
            mobile: result.mobile
          }
        });
      } else {
        // ❌ Show error message
        alert(result. message || "Invalid OTP");
        setotp(""); // Clear OTP input on error
      }
    } catch (err) {
      console.error('[OTP] Error:', err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP function
  const resendOtp = async () => {
    const mobile = localStorage.getItem("mobile");

    if (!mobile) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message + (result.otp ? ` (OTP: ${result.otp})` : ""));
        setotp(""); // Clear current OTP
      } else {
        alert(result. message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error('[Resend OTP] Error:', err);
      alert("Failed to resend OTP");
    }
  };

  return (
    <div className="turf">
      <div className="otppage">
        <h2 style={{color: '#0B3D2E', fontSize: '1.8rem', marginBottom: '8px', fontWeight: '700', textAlign: 'center'}}>Verify OTP</h2>
        <p style={{color: '#1B5E20', fontSize: '0.9rem', marginBottom: '35px', textAlign: 'center'}}>Enter the 6-digit code sent to your mobile</p>
        <input
          value={otp}
          onChange={(e) => setotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="enterotp"
          type="text"
          placeholder="------"
          maxLength={6}
          disabled={loading}
        />
        <p className="resend" onClick={resendOtp}>
          Didn't receive? <span style={{fontWeight: '600'}}>Resend OTP</span>
        </p>
        <button onClick={gotobooking} className="verify" disabled={loading}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
}

export default Otp;