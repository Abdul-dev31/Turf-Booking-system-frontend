import { useCallback, useEffect, useState } from "react";
import { MdNightlight } from "react-icons/md";
import { TiAdjustBrightness } from "react-icons/ti";
import { apiFetch } from "./api";
import {
  IoAlertCircleOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoSaveOutline,
  IoWalletOutline,
} from "react-icons/io5";
import AdminNavbar from "./AdminNavbar";

function Upi() {
  const [settings, setSettings] = useState({
    upi: "",
    weekdayMorning: "",
    weekdayEvening: "",
    weekendMorning: "",
    weekendEvening: ""
  });
  const [loading, setLoading] = useState(true);
  const [savingUpi, setSavingUpi] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(window.__settingsNoticeTimer);
    window.__settingsNoticeTimer = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [upiRes, priceRes] = await Promise.all([
        apiFetch("/api/get-upi"),
        apiFetch("/api/get-prices"),
      ]);

      const upiData = await upiRes.json();
      const priceData = await priceRes.json();

      setSettings({
        upi: upiData.upi || "",
        weekdayMorning: priceData.weekdayMorning ?? "",
        weekdayEvening: priceData.weekdayEvening ?? "",
        weekendMorning: priceData.weekendMorning ?? "",
        weekendEvening: priceData.weekendEvening ?? ""
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      showNotice("error", "Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateUpi = async () => {
    if (!settings.upi.trim()) {
      showNotice("error", "Enter a valid UPI ID");
      return;
    }

    try {
      setSavingUpi(true);
      const response = await apiFetch("/api/update-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi: settings.upi.trim() })
      });

      const result = await response.json();
      showNotice(response.ok ? "success" : "error", result.message || "UPI update failed");
    } catch (err) {
      console.error("UPI Update Error:", err);
      showNotice("error", "UPI update failed");
    } finally {
      setSavingUpi(false);
    }
  };

  const updatePrices = async () => {
    const priceValues = [
      settings.weekdayMorning,
      settings.weekdayEvening,
      settings.weekendMorning,
      settings.weekendEvening,
    ];

    const hasInvalidPrice = priceValues.some((value) => value === "" || Number(value) < 0);
    if (hasInvalidPrice) {
      showNotice("error", "Enter valid prices for all slots");
      return;
    }

    try {
      setSavingPrices(true);
      const response = await apiFetch("/api/update-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      showNotice(response.ok ? "success" : "error", result.message || "Price update failed");
    } catch (err) {
      console.error("Price Update Error:", err);
      showNotice("error", "Price update failed");
    } finally {
      setSavingPrices(false);
    }
  };

  const priceGroups = [
    {
      title: "Weekday",
      subtitle: "Monday to Friday",
      items: [
        { key: "weekdayMorning", label: "Morning", time: "6am - 6pm", icon: TiAdjustBrightness, tone: "morning" },
        { key: "weekdayEvening", label: "Evening", time: "6pm - 6am", icon: MdNightlight, tone: "evening" },
      ],
    },
    {
      title: "Weekend",
      subtitle: "Saturday and Sunday",
      items: [
        { key: "weekendMorning", label: "Morning", time: "6am - 6pm", icon: TiAdjustBrightness, tone: "morning" },
        { key: "weekendEvening", label: "Evening", time: "6pm - 6am", icon: MdNightlight, tone: "evening" },
      ],
    },
  ];

  return (
    <div className="turf">
      <AdminNavbar />

      <div className="settings-page">
        <div className="settings-container">
          <div className="settings-hero">
            <div>
              <p className="settings-kicker">Admin Settings</p>
              <h1 className="settings-heading">Payment Controls</h1>
              <p className="settings-subtitle">Manage collection UPI and slot pricing from one place.</p>
            </div>
            <button className="settings-ghost-btn" onClick={fetchData} disabled={loading}>
              <IoRefreshOutline />
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>

          {notice && (
            <div className={`settings-notice settings-notice--${notice.type}`}>
              {notice.type === "success" ? <IoCheckmarkCircleOutline /> : <IoAlertCircleOutline />}
              <span>{notice.message}</span>
            </div>
          )}

          <div className="settings-summary-grid">
            <div className="settings-summary-card">
              <span>Current UPI</span>
              <strong>{settings.upi || "Not set"}</strong>
            </div>
            <div className="settings-summary-card">
              <span>Weekday Range</span>
              <strong>Rs {settings.weekdayMorning || 0} - Rs {settings.weekdayEvening || 0}</strong>
            </div>
            <div className="settings-summary-card">
              <span>Weekend Range</span>
              <strong>Rs {settings.weekendMorning || 0} - Rs {settings.weekendEvening || 0}</strong>
            </div>
          </div>

          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-icon">
                <IoWalletOutline />
              </div>
              <div>
                <h2>UPI Payment Settings</h2>
                <p>Payments will be collected to this UPI ID.</p>
              </div>
            </div>

            <label className="settings-field">
              <span>UPI ID</span>
              <div className="settings-inline-control">
                <input
                  className="settings-input"
                  placeholder="example@upi"
                  value={settings.upi}
                  disabled={loading || savingUpi}
                  onChange={(e) => updateSetting("upi", e.target.value)}
                />
                <button className="settings-btn" onClick={updateUpi} disabled={loading || savingUpi}>
                  <IoSaveOutline />
                  {savingUpi ? "Saving" : "Save UPI"}
                </button>
              </div>
            </label>
          </section>

          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-icon">
                <IoCardOutline />
              </div>
              <div>
                <h2>Pricing Settings</h2>
                <p>Set the hourly rate used when customers book slots.</p>
              </div>
            </div>

            <div className="settings-price-groups">
              {priceGroups.map((group) => (
                <div className="settings-price-group" key={group.title}>
                  <div className="settings-price-group-head">
                    <h3>{group.title}</h3>
                    <span>{group.subtitle}</span>
                  </div>

                  <div className="settings-price-grid">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <label className="settings-price-card" key={item.key}>
                          <div className="settings-price-card-head">
                            <span className={`settings-price-icon settings-price-icon--${item.tone}`}>
                              <Icon />
                            </span>
                            <div>
                              <strong>{item.label}</strong>
                              <span>{item.time}</span>
                            </div>
                          </div>
                          <div className="settings-price-input-wrap">
                            <span>Rs</span>
                            <input
                              className="settings-price-input"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={settings[item.key]}
                              disabled={loading || savingPrices}
                              onChange={(e) => updateSetting(item.key, e.target.value)}
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button className="settings-btn settings-save-all" onClick={updatePrices} disabled={loading || savingPrices}>
              <IoSaveOutline />
              {savingPrices ? "Saving Prices" : "Save All Prices"}
            </button>
          </section>
          </div>
      </div>
    </div>
  );
}

export default Upi;
