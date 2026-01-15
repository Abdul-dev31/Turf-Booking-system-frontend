import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { IoMailOutline, IoLockClosedOutline, IoKeyOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

function Signin() {
  const location = useLocation();
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [repassword, setrepassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Get email from OTP page if passed
  const userEmail = location.state?.email || email;

  const gotologin = async () => {
    if (!userEmail || !password || !repassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== repassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await axios.put("http://localhost:5000/api/resetpassword", {
        email: userEmail,
        password,
        repassword,
      });

      alert(response.data.message);
      console.log("Password updated successfully, navigating now...");
      navigate("/slotbook"); // ✅ Make sure this route exists
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server not responding");
      }
    }
  };

  return (
    <div className="turf admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <IoKeyOutline className="admin-shield-icon" />
          <h1 className="admin-login-title">Reset Password</h1>
          <p className="admin-login-subtitle">Create a new secure password</p>
        </div>

        <div className="admin-form">
          <div className="admin-input-group">
            <IoMailOutline className="admin-input-icon" />
            <input
              value={userEmail}
              onChange={(k) => setemail(k.target.value)}
              type="text"
              placeholder="Email address"
              className="admin-input"
              readOnly={location.state?.email}
            />
          </div>

          <div className="admin-input-group">
            <IoLockClosedOutline className="admin-input-icon" />
            <input
              value={password}
              onChange={(d) => setpassword(d.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className="admin-input"
            />
            {password && (
              <div className="admin-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </div>
            )}
          </div>

          <div className="admin-input-group">
            <IoLockClosedOutline className="admin-input-icon" />
            <input
              value={repassword}
              onChange={(e) => setrepassword(e.target.value)}
              type={showRePassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="admin-input"
            />
            {repassword && (
              <div className="admin-password-toggle" onClick={() => setShowRePassword(!showRePassword)}>
                {showRePassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </div>
            )}
          </div>

          <button onClick={gotologin} className="admin-login-button">
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signin;