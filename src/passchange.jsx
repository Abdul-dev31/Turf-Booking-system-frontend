import {useNavigate} from "react-router-dom";
import React,{useState} from "react";
import axios from "axios";
import { IoMailOutline, IoKeyOutline } from "react-icons/io5";

function Passchange() {
  const [email, setemail] = useState("");
  const navigate = useNavigate();

  const gotoadminotp = async () => {
    if (!email) {
      alert("Enter your Email ID");
      return;
    }
    try {
      const response = await axios.post("/api/sendotp", { email });
      alert(response.data.message);
      navigate("/adminotp", { state: { email } });
 // pass email to next page
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server not responding");
      }
    }
  };

    return(
        <div className="turf admin-login-page">
          <div className="admin-login-container">
            <div className="admin-login-header">
              <IoKeyOutline className="admin-shield-icon" />
              <h1 className="admin-login-title">Forgot Password</h1>
              <p className="admin-login-subtitle">Enter your email to receive OTP</p>
            </div>

            <div className="admin-form">
              <div className="admin-input-group">
                <IoMailOutline className="admin-input-icon" />
                <input 
                  value={email} 
                  onChange={(k)=>setemail(k.target.value)} 
                  type="email"
                  placeholder="Enter your email address"
                  className="admin-input"
                />
              </div>

              <button onClick={gotoadminotp} className="admin-login-button">
                Send OTP
              </button>
            </div>
          </div>
        </div>
    )
}
export default Passchange
