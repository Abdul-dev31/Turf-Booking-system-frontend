import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { IoMailOutline, IoKeyOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { API_BASE } from "./api";

axios.defaults.baseURL = API_BASE;

function Adminotp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ get email from previous page (Passchange.js)
  const email = location.state?.email;

  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }

    try {
      const response = await axios.post("/api/verify-otp", {
        email,
        otp,
      });

      alert(response.data.message);
      navigate("/signin", { state: { email } }); // ✅ Go to next page
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server not responding");
      }
    }
  };

  // ✅ Resend OTP Function
  const resendOtp = async () => {
    if (!email) {
      alert("Email not found. Please go back and enter your email again.");
      navigate("/passchange");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/send-otp", {
        email,
      });
      alert(response.data.message + " (New OTP generated)");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server not responding");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="turf admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <IoKeyOutline className="admin-shield-icon" />
          <h1 className="admin-login-title">Verify OTP</h1>
          <p className="admin-login-subtitle">
            Enter the code sent to {email}
          </p>
        </div>

        <div className="admin-form">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="enterotp"
            type="text"
            placeholder="000000"
            maxLength="6"
          />

          <div
            className="admin-forgot-link"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
            onClick={!loading ? resendOtp : undefined}
          >
            {loading ? "Resending..." : "Resend OTP"}
          </div>

          <button onClick={verifyOtp} className="admin-login-button">
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default Adminotp;
