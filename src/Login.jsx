import React,{useState} from "react";
import {useNavigate} from "react-router-dom";

function Login(){

const [mobile, setmobile] = useState("");   // ✅ start as empty string

    const navigate=useNavigate();
    
   const gotootp = async () => {
  if (!mobile || mobile.length !== 10) {
    alert("Enter valid mobile");
    return;
  }

  localStorage.setItem("mobile", mobile);

 await fetch("http://localhost:5000/api/send-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mobile })
});

  navigate("/otp");
};


    return(
        <div className="turf">
        <div className="loginpage">
            <h2 style={{color: '#0B3D2E', fontSize: '1.8rem', marginBottom: '8px', fontWeight: '700', textAlign: 'center'}}>Welcome Back</h2>
            <p style={{color: '#1B5E20', fontSize: '0.9rem', marginBottom: '35px', textAlign: 'center'}}>Enter your mobile number to continue</p>
            <input 
              value={mobile} 
              onChange={(k)=>setmobile(k.target.value.replace(/\D/g, '').slice(0, 10))} 
              className="phonenumber" 
              type="text" 
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
            />
            <button onClick={gotootp} className="sendotp">Send OTP</button>
        </div>
        </div>
    )
}
export default Login