import Book from "./Book"
import Cards from "./Cards"
import { useNavigate } from "react-router-dom"
import { IoReorderThreeOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { CgProfile } from "react-icons/cg";
import { FaInstagram, FaLinkedin, FaFacebook, FaStar, FaCheckCircle } from "react-icons/fa";
import { IoCallOutline, IoMailOutline, IoTrophyOutline, IoTimeOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { MdSportsSoccer } from "react-icons/md";
import bgImage from "./assets/Turf.png";

function Home() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMobile, setUserMobile] = useState("");
  const [prices, setPrices] = useState({
    weekdayMorning: "", weekdayEvening: "", weekendMorning: "", weekendEvening: ""
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/get-prices");
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.log("Price fetch error:", err);
      }
    };
    fetchPrices();
    
    checkSession();
  }, []);

  const checkSession = async () => {
    const sessionId = localStorage.getItem("session_id");
    
    if (!sessionId) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/session-user", {
        method: "GET",
        headers: { "x-session-id": sessionId }
      });

      const data = await res.json();
      
      if (data.loggedIn) {
        setIsLoggedIn(true);
        setUserMobile(data.mobile || "");
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem("session_id");
      }
    } catch (err) {
      console.error("Session check error:", err);
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("session_id");
    localStorage.removeItem("mobile");
    setIsLoggedIn(false);
    setUserMobile("");
    setProfileOpen(false);
    alert("Logged out successfully!");
  };

  const handleBookNow = async () => {
    const sessionId = localStorage.getItem("session_id");

    console.log('[Book Now] Session ID:', sessionId);

    if (!sessionId) {
      console.log('[Book Now] No session, redirecting to login');
      localStorage.setItem("redirect_after_login", "booking");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/session-user", {
        method: "GET",
        headers: { "x-session-id": sessionId }
      });

      const data = await res.json();
      console.log('[Book Now] Session check result:', data);

      if (data.loggedIn) {
        console.log('[Book Now] ✅ Session valid, going to booking');
        navigate("/booking", {
          state: {
            userId: data.userId,
            mobile: data.mobile
          }
        });
      } else {
        console.log('[Book Now] ❌ Session expired, redirecting to login');
        localStorage.removeItem("session_id");
        localStorage.setItem("redirect_after_login", "booking");
        navigate("/login");
      }
    } catch (err) {
      console.error('[Book Now] Session check error:', err);
      localStorage.removeItem("session_id");
      localStorage.setItem("redirect_after_login", "booking");
      navigate("/login");
    }
  };

  return (
    <div className="turf home-page" style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      {/* ✅ Overlay for better text visibility */}
      <div className="overlay"></div>

      <div className="Home">
        <div className="head">
          <div className="navigation">
            {open && (
              <div className="nav-dropdown">
                <p
                  onClick={() => {
                    setOpen(false);
                    navigate("/adminlogin");
                  }}
                  className="nav-dropdown-item"
                >
                  Admin Login
                </p>
              </div>
            )}
            <nav className="Nav">
              <IoReorderThreeOutline
                onClick={() => setOpen(!open)}
                className="navbar"
              />
              <h2>Kumbakonam Turf</h2>
              <CgProfile 
                className="pro" 
                onClick={() => setProfileOpen(!profileOpen)}
              />
            </nav>
          </div>
        </div>

        {/* Profile Dropdown */}
        {profileOpen && (
          <div className="profile-dropdown">
            {isLoggedIn ? (
              <>
                <p className="profile-mobile">{userMobile}</p>
                <p onClick={handleLogout} className="profile-option logout">
                  Logout
                </p>
              </>
            ) : (
              <p onClick={() => navigate("/login")} className="profile-option">
                Login
              </p>
            )}
          </div>
        )}

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Kumbakonam Turf</h1>
            <p className="hero-subtitle">
              Embark on a sporting journey with premium turf facilities.
              Book your ideal playing ground today!
            </p>
            <button onClick={handleBookNow} className="hero-cta-button">
              <MdSportsSoccer className="cta-icon" />
              Book Your Slot Now
            </button>
          </div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <IoTrophyOutline className="feature-icon" />
              <h3>Premium Quality</h3>
              <p>World-class artificial turf with excellent drainage</p>
            </div>
            <div className="feature-card">
              <IoTimeOutline className="feature-icon" />
              <h3>Flexible Timings</h3>
              <p>Available from 6 AM to 6 AM next day, 7 days a week</p>
            </div>
            <div className="feature-card">
              <IoShieldCheckmarkOutline className="feature-icon" />
              <h3>Easy Booking</h3>
              <p>Quick online booking with instant confirmation</p>
            </div>
            <div className="feature-card">
              <FaStar className="feature-icon" />
              <h3>Best Rates</h3>
              <p>Competitive pricing with special weekend offers</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-section">
          <h2 className="section-title">Our Pricing</h2>
          <p className="pricing-note">All prices are per hour</p>
          <div className="cards-container">
            <Cards title="Weekday" daynight="Morning" time="6am to 6pm" price={prices.weekdayMorning} />
            <Cards title="Weekday" daynight="Evening" time="6pm to 6am" price={prices.weekdayEvening} />
            <Cards title="Weekend" daynight="Morning" time="6am to 6pm" price={prices.weekendMorning} />
            <Cards title="Weekend" daynight="Evening" time="6pm to 6am" price={prices.weekendEvening} />
          </div>
          <center>
            <button onClick={handleBookNow} className="Book-button">
              Book Now
            </button>
          </center>
        </section>
      </div>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-left">
            <h2 className="footer-title">Turf Booking</h2>
            <p className="footer-description">
              Embark on a sporting journey across cities with our diverse turf selection. Find
              your ideal playing ground and book your game today!
            </p>
            <div className="footer-contact">
              <h3 className="contact-title">Contact us</h3>
              <div className="contact-info">
                <a href="tel:+919238764656" className="contact-link">
                  <IoCallOutline className="contact-icon" />
                  +91 9238764656
                </a>
                <a href="mailto:info@turfbooking.in" className="contact-link">
                  <IoMailOutline className="contact-icon" />
                  info@turfbooking.in
                </a>
              </div>
            </div>
          </div>

          <div className="footer-right">
            <h2 className="footer-title">Important links</h2>
            <div className="footer-links">
              <a href="#about" className="footer-link">About ↗</a>
              <a href="#privacy" className="footer-link">Privacy Policy ↗</a>
              <a href="#terms" className="footer-link">Terms & Conditions ↗</a>
            </div>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">Turf Booking © 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;