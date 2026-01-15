import { useState, useEffect } from "react";
import { MdNightlight } from "react-icons/md";
import { TiAdjustBrightness } from "react-icons/ti";
import { IoWalletOutline, IoCardOutline } from "react-icons/io5";
import AdminNavbar from "./AdminNavbar";

function Upi() {
  // Store values
  const [settings, setSettings] = useState({
    upi: "",
    weekdayMorning: "",
    weekdayEvening: "",
    weekendMorning: "",
    weekendEvening: ""
  });

  // Load values on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get UPI
        const upiRes = await fetch("http://localhost:5000/api/get-upi");
        const upiData = await upiRes.json();

        // Get prices
        const priceRes = await fetch("http://localhost:5000/api/get-prices");
        const priceData = await priceRes.json();

        // Update React state
        setSettings({
          upi: upiData.upi,
          weekdayMorning: priceData.weekdayMorning,
          weekdayEvening: priceData.weekdayEvening,
          weekendMorning: priceData.weekendMorning,
          weekendEvening: priceData.weekendEvening
        });

      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };

    fetchData();
  }, []);

  // Update UPI
  const updateUpi = async () => {
    const response = await fetch("http://localhost:5000/api/update-upi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upi: settings.upi })
    });

    const result = await response.json();
    alert(result.message);
  };

  // Update Prices
  const updatePrices = async () => {
    const response = await fetch("http://localhost:5000/api/update-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    const result = await response.json();
    alert(result.message);
  };

  return (
    <div className="turf">
      <AdminNavbar />

      <div className="settings-page">
        <div className="settings-container">
          
          {/* UPI Section */}
          <div className="settings-section">
            <div className="section-header">
              <IoWalletOutline className="section-header-icon" />
              <h2 className="section-title">UPI Payment Settings</h2>
            </div>
            
            <div className="upi-input-group">
              <input
                className="settings-input"
                placeholder="example@upi"
                value={settings.upi}
                onChange={(e) => setSettings({ ...settings, upi: e.target.value })}
              />
              <button className="settings-btn" onClick={updateUpi}>Save UPI</button>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="settings-section">
            <div className="section-header">
              <IoCardOutline className="section-header-icon" />
              <h2 className="section-title">Pricing Settings</h2>
            </div>

            {/* WEEKDAY */}
            <h3 className="subsection-title">Weekday Pricing (Mon - Fri)</h3>
            <div className="price-grid">
              <div className="price-card">
                <div className="price-card-header">
                  <TiAdjustBrightness className="price-icon morning" />
                  <span>Morning Slot</span>
                </div>
                <input
                  className="price-input"
                  placeholder="₹ Price"
                  value={settings.weekdayMorning}
                  onChange={(e) =>
                    setSettings({ ...settings, weekdayMorning: e.target.value })
                  }
                />
              </div>

              <div className="price-card">
                <div className="price-card-header">
                  <MdNightlight className="price-icon evening" />
                  <span>Evening Slot</span>
                </div>
                <input
                  className="price-input"
                  placeholder="₹ Price"
                  value={settings.weekdayEvening}
                  onChange={(e) =>
                    setSettings({ ...settings, weekdayEvening: e.target.value })
                  }
                />
              </div>
            </div>

            {/* WEEKEND */}
            <h3 className="subsection-title">Weekend Pricing (Sat - Sun)</h3>
            <div className="price-grid">
              <div className="price-card">
                <div className="price-card-header">
                  <TiAdjustBrightness className="price-icon morning" />
                  <span>Morning Slot</span>
                </div>
                <input
                  className="price-input"
                  placeholder="₹ Price"
                  value={settings.weekendMorning}
                  onChange={(e) =>
                    setSettings({ ...settings, weekendMorning: e.target.value })
                  }
                />
              </div>

              <div className="price-card">
                <div className="price-card-header">
                  <MdNightlight className="price-icon evening" />
                  <span>Evening Slot</span>
                </div>
                <input
                  className="price-input"
                  placeholder="₹ Price"
                  value={settings.weekendEvening}
                  onChange={(e) =>
                    setSettings({ ...settings, weekendEvening: e.target.value })
                  }
                />
              </div>
            </div>

            <button className="settings-btn confirm-btn" onClick={updatePrices}>
              Save All Prices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upi;