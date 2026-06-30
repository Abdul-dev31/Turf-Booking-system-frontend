
import { FaHome } from "react-icons/fa";
import { FaListAlt } from "react-icons/fa";
import { IoWallet } from "react-icons/io5";
import { IoReorderThreeOutline } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setopen] = useState(false);

  const go = (path) => {
    setopen(false);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="adminnavigation">
      <nav className="adminnav">
        <div className="admin-nav-left">
          <IoReorderThreeOutline
            onClick={() => setopen(!open)}
            className="navbar1"
          />
          {open && (
            <div className="dropdown1">
              <p onClick={() => go("/adminlogin")} className="paragraph1">
                Admin Login
              </p>
              <p onClick={() => go("/")} className="paragraph1">
                Logout
              </p>
            </div>
          )}
        </div>
        
        <div className="admin-nav-icons">
          <FaHome
            onClick={() => navigate("/slotbook")}
            className={`bookpage ${isActive("/slotbook") ? "active" : ""}`}
            title="Home"
          />
          <FaListAlt
            onClick={() => navigate("/bookingdetails")}
            className={`bookdetailspage ${isActive("/bookingdetails") ? "active" : ""}`}
            title="Booking Details"
          />
          <IoWallet
            onClick={() => navigate("/changeupi")}
            className={`upipage ${isActive("/changeupi") ? "active" : ""}`}
            title="Payment Settings"
          />
        </div>
      </nav>
    </div>
  );
}

export default AdminNavbar;
