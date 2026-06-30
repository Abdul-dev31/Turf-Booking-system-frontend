import {useNavigate} from "react-router-dom"
import { useState } from "react";
import { IoMailOutline, IoLockClosedOutline, IoShieldCheckmarkOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { apiFetch } from "./api";

function AdLogin() {
  const navigate = useNavigate();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const gotoslotbook = async () => {
    if (!email || !password) {
      alert("Enter Your Email ID and Password");
      return;
    }

    try {
      const response = await apiFetch("/api/adminlogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Mail_ID: email,
          Password_: password
        })
      });

      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();
      const data = contentType.includes("application/json")
        ? JSON.parse(rawText)
        : { success: false, message: rawText };

      if (response.ok && data.success) {
        alert("Login Successful");
        navigate("/slotbook");
      } else {
        alert(data?.message || "Invalid Email or Password");
      }
    } catch (error) {
      const msg = String(error?.message || error);
      if (msg.toLowerCase().includes("failed to fetch")) {
        alert(
          "Failed to reach server. Please check backend is running and CORS/proxy is configured."
        );
        return;
      }
      alert("Server Error: " + msg);
    }
  };

    return(
    <div className="turf admin-login-page">
      <div className="admin-login-container"> 
        <div className="admin-login-header">
          <IoShieldCheckmarkOutline className="admin-shield-icon" />
          <h1 className="admin-login-title">Admin Login</h1>
          <p className="admin-login-subtitle">Secure access to management portal</p>
        </div>

        <div className="admin-form">
          <div className="admin-input-group">
            <IoMailOutline className="admin-input-icon" />
            <input 
              value={email} 
              onChange={(w)=>setemail(w.target.value)} 
              type="email" 
              placeholder="Enter your email address"
              className="admin-input" 
            />
          </div>

          <div className="admin-input-group">
            <IoLockClosedOutline className="admin-input-icon" />
            <input  
              value={password} 
              onChange={(e)=>setpassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="admin-input"
            />
            {password && (
              <div className="admin-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </div>
            )}
          </div>

          <div className="admin-forgot-link" onClick={()=>navigate("/passchange")}>Forgot Password?</div>

          <button onClick={gotoslotbook} className="admin-login-button">
            Login to Dashboard
          </button>
        </div>
      </div>
    </div>)
}
export default AdLogin
