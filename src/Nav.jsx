import { IoReorderThreeOutline } from "react-icons/io5";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Nav() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="head" >
            <div className="navigation">
                {open && (
                    <div className="nav-dropdown">
                        <p onClick={() => navigate("/adminlogin")} className="nav-dropdown-item">
                            Admin Login
                        </p>
                    </div>
                )}
                <nav className="Nav">
                    <IoReorderThreeOutline 
                        className="navbar" 
                        onClick={() => setOpen(!open)}
                    />
                    <h2>Kumbakonam Turf</h2>
                </nav>
            </div>
        </div>
    )
}
export default Nav