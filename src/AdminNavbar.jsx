
import { FaHome } from "react-icons/fa";
import { FaListAlt } from "react-icons/fa";
import { IoWallet } from "react-icons/io5";
import { IoReorderThreeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function AdminNavbar() {
  const navigate = useNavigate();
  const [open, setopen] = useState(false);
  
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
              <p onClick={() => navigate("/")} className="paragraph1">
                Logout
              </p>
            </div>
          )}
        </div>
        
        <div className="admin-nav-icons">
          <FaHome
            onClick={() => navigate("/slotbook")}
            className="bookpage"
            title="Home"
          />
          <FaListAlt
            onClick={() => navigate("/bookingdetails")}
            className="bookdetailspage"
            title="Booking Details"
          />
          <IoWallet
            onClick={() => navigate("/changeupi")}
            className="upipage"
            title="Payment Settings"
          />
        </div>
      </nav>
    </div>
  );
}

export default AdminNavbar;
