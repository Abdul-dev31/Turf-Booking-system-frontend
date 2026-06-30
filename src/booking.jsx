// Booking.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "./api";


const toLocalIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDaysIso = (iso, days) => {
  if (!iso) return iso;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
};

// Generate next 7 dates dynamically
const generateDates = () => {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDate();
    const weekday = d.toLocaleString("en-US", { weekday: "short" });
    const iso = toLocalIsoDate(d);
    days.push({ display: `${day}-${weekday}`, iso, day, weekday });
  }
  return days;
};
const dateList = generateDates();

const mrngslot = [
  "6am - 7am","7am - 8am","8am - 9am","9am - 10am","10am - 11am","11am - 12pm",
  "12pm - 1pm","1pm -2pm","2pm-3pm","3pm - 4pm","4pm - 5pm","5pm - 6pm"
];

const evngslot = [
  "6pm - 7pm","7pm - 8pm","8pm - 9pm","9pm - 10pm","10pm - 11pm","11pm - 12am",
  "12am - 1am","1am - 2am","2am - 3am","3am - 4am","4am - 5am","5am - 6am"
];

const parseTimeTokenToMinutes = (token) => {
  const match = String(token).match(/(\d{1,2})\s*(am|pm)/i);
  if (!match) return null;

  const hour12 = Number(match[1]);
  const meridiem = match[2].toLowerCase();
  if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return null;

  let hour24 = hour12;
  if (meridiem === "am") {
    if (hour12 === 12) hour24 = 0;
  } else {
    if (hour12 !== 12) hour24 = hour12 + 12;
  }

  return hour24 * 60;
};

const normalizeTimingKey = (value) => {
  const parts = String(value || "").replace(/\s/g, "").split("-");
  if (parts.length !== 2) return String(value || "").replace(/\s/g, "").toUpperCase();

  const fmt = (token) => {
    const match = token.match(/^(\d{1,2})(am|pm)$/i);
    if (!match) return token.toUpperCase();
    return `${match[1].padStart(2, "0")}${match[2].toUpperCase()}`;
  };

  return `${fmt(parts[0])}-${fmt(parts[1])}`;
};

// Business rule: late-night slots are considered part of the *next day*
// for booking/blocking/time-over.
// This avoids splitting a continuous late-night booking across two dates
// (e.g., selecting 11pm-12am + 12am-1am should be treated as the next day).
const getEffectiveDateIsoForSlot = ({ selectedDateIso, slotLabel }) => {
  if (!selectedDateIso) return selectedDateIso;

  const startTokenMatch = String(slotLabel).match(/\d{1,2}\s*(am|pm)/i);
  const startMinutes = parseTimeTokenToMinutes(startTokenMatch?.[0]);
  if (startMinutes == null) return selectedDateIso;

  // Treat 11:00 PM -> 6:00 AM as "next day" slots.
  if (startMinutes >= 23 * 60 || (startMinutes >= 0 && startMinutes < 6 * 60)) {
    return addDaysIso(selectedDateIso, 1);
  }

  return selectedDateIso;
};

const isSlotInPast = ({ slotLabel, selectedDateIso, now }) => {
  if (!selectedDateIso) return false;

  const effectiveDateIso = getEffectiveDateIsoForSlot({
    selectedDateIso,
    slotLabel,
  });

  const todayIso = toLocalIsoDate(now);
  if (effectiveDateIso < todayIso) return true;
  if (effectiveDateIso > todayIso) return false;

  const startTokenMatch = String(slotLabel).match(/\d{1,2}\s*(am|pm)/i);
  const startMinutes = parseTimeTokenToMinutes(startTokenMatch?.[0]);
  if (startMinutes == null) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return startMinutes <= nowMinutes;
};

// After 6:00 PM today, tomorrow morning slots are locked.
const isTomorrowMorningLocked = ({ selectedDateIso, now }) => {
  if (!selectedDateIso) return false;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = toLocalIsoDate(tomorrow);
  if (selectedDateIso !== tomorrowIso) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= 18 * 60;
};




function Booking() {
  const navigate = useNavigate();

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // SESSION PROTECTION
  useEffect(() => {
    const sessionId = localStorage.getItem("session_id");

    if (!sessionId) {
      navigate("/login");
      return;
    }

    apiFetch("/api/session-user", {
      method: "GET",
      headers: { "x-session-id": sessionId }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.loggedIn) {
          navigate("/login");
        } else {
          console.log("Session OK, user:", data.user);
        }
      })
      .catch(err => {
        console.log("Session check error:", err);
        navigate("/login");
      });
  }, [navigate]);


  const location = useLocation();

  // If OTP navigated here with mobile/userId
  const mobile = location.state?.mobile || null;
  const userIdFromOtp = location.state?.userId || null;
  console.log("[Booking] mobile,userId:", mobile, userIdFromOtp);

  // UI selections
  const [selectedDateIso, setSelectedDateIso] = useState(null);
  const [selectedMrngslot, setSelectedMrngslot] = useState([]);
  const [selectedEvngslot, setSelectedEvngslot] = useState([]);

  // If cutoff time passes while page is open, clear tomorrow-morning selections.
  useEffect(() => {
    if (!selectedDateIso) return;
    const now = new Date(nowTick);
    if (!isTomorrowMorningLocked({ selectedDateIso, now })) return;
    setSelectedMrngslot((prev) => (prev.length ? [] : prev));
  }, [nowTick, selectedDateIso]);

  // backend data
  const [slotMap, setSlotMap] = useState({});     // { "06AM-07AM": "SID010", ... }
  const [blockedMap, setBlockedMap] = useState({});// { "2025-12-01": ["03PM-04PM","SID010"], ... }

  const fromDate = dateList[0].iso;
  const toDate = dateList[dateList.length - 1].iso;
  const toDateForFetch = addDaysIso(toDate, 1);

  // load slot mapping + blocked slots, and expose reload for debug
  useEffect(() => {
    let mounted = true;

    const loadBlockedAndSlots = async () => {
      try {
        // 1) fetch slot list
        console.log("[Booking] fetching slots from:", `${API_BASE}/api/slots`);
        const sRes = await apiFetch(`/api/slots`);
        const sJson = sRes.ok ? await sRes.json() : [];
        const map = {};
        (sJson || []).forEach(s => {
          const key = normalizeTimingKey(s.Timing); // "06AM-07AM"
          if (key && s.SlotId) map[key] = s.SlotId;
        });

        // 2) fetch blocked slots for 7-day range
        console.log("[Booking] fetching booked-slots from:", `${API_BASE}/api/booked-slots?from=${fromDate}&to=${toDateForFetch}`);
        const bRes = await apiFetch(`/api/booked-slots?from=${fromDate}&to=${toDateForFetch}`);
        const bJson = bRes.ok ? await bRes.json() : { blocked: [] };

        // DEBUG: show raw server response
        console.log("[Booking] raw blocked from server:", bJson.blocked);

        // normalize to blocked map keyed by YYYY-MM-DD
        const bmap = {};
        (bJson.blocked || []).forEach(b => {
          const dt = (b.date || "").slice(0, 10);
          // prefer normalized timingKey, then timing, then slotId
          const rawTiming = (b.timingKey || b.timing || b.SlotId || b.slotId || "").toString();
          const t = normalizeTimingKey(rawTiming); // e.g. "03PM-04PM" or "SID010"
          if (!bmap[dt]) bmap[dt] = [];
          if (!bmap[dt].includes(t)) bmap[dt].push(t);
        });

        // DEBUG: show normalized map
        console.log("[Booking] normalized blockedMap:", bmap);

        if (mounted) {
          setSlotMap(map);
          setBlockedMap(bmap);
        }
      } catch (err) {
        console.error("[Booking] loadBlockedAndSlots error:", err);
        if (mounted) {
          setSlotMap({});
          setBlockedMap({});
        }
      }
    };

    loadBlockedAndSlots();

    // expose reload for console debugging
    window.reloadBlocked = loadBlockedAndSlots;

    return () => { mounted = false; };
  }, [fromDate, toDateForFetch]);

  // convert "6am - 7am" -> "06AM-07AM"
  const toDbTimingKey = (label) => {
    return normalizeTimingKey(label);
  };

  // robust blocked check
  const isBlocked = (dateIso, label) => {
    if (!dateIso) return false;

    const effectiveDateIso = getEffectiveDateIsoForSlot({
      selectedDateIso: dateIso,
      slotLabel: label,
    });
    const key1 = toDbTimingKey(label).replace(/\s/g,"").toUpperCase(); // "06AM-07AM"
    const key2 = (label || "").replace(/\s/g,"").toUpperCase();       // "6am-7am"
    const arr = blockedMap[effectiveDateIso] || [];

    // direct matches
    if (arr.includes(key1) || arr.includes(key2)) return true;

    // if blocked entries are slotIds like "SID010", map slotId -> timingKey
    const rev = {};
    Object.keys(slotMap).forEach(k => { rev[slotMap[k]] = k; }); // rev["SID010"]="06AM-07AM"
    for (const be of arr) {
      const mappedTiming = rev[be]; // if be is slotId
      if (mappedTiming && mappedTiming.replace(/\s/g,"").toUpperCase() === key1) return true;
    }

    return false;
  };

  // handlers
  const chooseDate = (iso) => {
    console.log("[Booking] date clicked:", iso);
    setSelectedDateIso(prev => (prev === iso ? null : iso));
    setSelectedMrngslot([]);
    setSelectedEvngslot([]);

    // immediately reload blocked map to ensure freshest state (helps debugging)
    if (window.reloadBlocked) window.reloadBlocked().catch(e => console.error(e));
  };

  const chooseMrngslot = (c) => {
    if (!selectedDateIso) { alert("Please select a date first"); return; }
    if (isBlocked(selectedDateIso, c)) { alert("This slot is booked"); return; }

    const now = new Date(nowTick);
    if (isTomorrowMorningLocked({ selectedDateIso, now })) {
      alert("Tomorrow morning slots are locked after 6:00 PM");
      return;
    }
    if (isSlotInPast({ slotLabel: c, selectedDateIso, now })) {
      alert("Slot time over");
      return;
    }

    if (selectedMrngslot.includes(c)) setSelectedMrngslot(selectedMrngslot.filter(d => d !== c));
    else setSelectedMrngslot([...selectedMrngslot, c]);
  };

  const chooseEvngslot = (e) => {
    if (!selectedDateIso) { alert("Please select a date first"); return; }
    if (isBlocked(selectedDateIso, e)) { alert("This slot is booked"); return; }

    const now = new Date(nowTick);
    if (isSlotInPast({ slotLabel: e, selectedDateIso, now })) {
      alert("Slot time over");
      return;
    }

    if (selectedEvngslot.includes(e)) setSelectedEvngslot(selectedEvngslot.filter(f => f !== e));
    else setSelectedEvngslot([...selectedEvngslot, e]);
  };

 // ...  (keep all existing imports and code until goToPayment function)

// ... keep all existing code until goToPayment function ...

const goToPayment = async () => {
  if (! selectedDateIso) { 
    alert("Please select at least one date! "); 
    return; 
  }
  if (selectedMrngslot. length === 0 && selectedEvngslot.length === 0) { 
    alert("Please select at least one time slot!"); 
    return; 
  }

  // Build slotIds grouped by effective booking date (supports cross-midnight)
  const allLabels = [... selectedMrngslot, ...selectedEvngslot];
  const labelsByDate = {};
  for (const lbl of allLabels) {
    const effective = getEffectiveDateIsoForSlot({ selectedDateIso, slotLabel: lbl });
    if (!effective) continue;
    if (!labelsByDate[effective]) labelsByDate[effective] = [];
    labelsByDate[effective].push(lbl);
  }

  const bookingDates = Object.keys(labelsByDate).sort();

  const finalUser = userIdFromOtp || mobile;

  try {
    const created = [];
    for (const bookingDate of bookingDates) {
      const slotIds = (labelsByDate[bookingDate] || [])
        .map((lbl) => {
          const key = toDbTimingKey(lbl).replace(/\s/g, "").toUpperCase();
          return slotMap[key];
        })
        .filter(Boolean);

      if (slotIds.length === 0) continue;

      console.log('[Booking] Creating booking... ', { finalUser, bookingDate, slotIds });

      // ✅ CREATE BOOKING BEFORE NAVIGATING
      const response = await apiFetch(`/api/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUser,
          bookingDate,
          slotIds
        })
      });

      const data = await response.json();
      console.log('[Booking] Response:', data);

      if (!response.ok) {
        alert(data.error || 'Failed to create booking');
        return;
      }

      created.push({ bookingId: data.bookingId, bookingDate, slotIds });
    }

    if (created.length === 0) {
      alert('Failed to create booking (no valid slots)');
      return;
    }

    // Save to localStorage
    if (finalUser) {
      localStorage.setItem("userId", finalUser);
    }

    const bookingIds = created.map((b) => b.bookingId);
    console.log('[Booking] Navigating to payment with bookingIds:', bookingIds);

    navigate("/Paymentinfo", {
      state: {
        bookingId: bookingIds[0],
        bookingIds,
        userId: finalUser
      }
    });

  } catch (err) {
    console.error('[Booking] Error:', err);
    alert('Failed to create booking.  Please try again.');
  }
};
  // UI (keeps original layout)
  return (
    <div className="turf">
      <div className="fullbookingbox">
        
        <div className="mrngevngbox">
          <h2 className="calendar">📅 Choose Date</h2>
          <div className="slotbookingdate">
            {dateList.map((d) => (
              <div
                key={d.iso}
                onClick={() => chooseDate(d.iso)}
                className="date-slot"
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  backgroundColor: selectedDateIso === d.iso ? "#2e7d32" : "#ffffff",
                  color: selectedDateIso === d.iso ? "#ffffff" : "#0B3D2E",
                  border: selectedDateIso === d.iso ? "2px solid #2e7d32" : "2px solid #c8e6c9",
                  boxShadow: selectedDateIso === d.iso 
                    ? "0 4px 15px rgba(46, 125, 50, 0.3)" 
                    : "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.2s ease",
                  minWidth: "75px",
                }}
              >
                <div style={{fontSize: "1.2rem", fontWeight: "700"}}>{d.day}</div>
                <div style={{fontSize: "0.8rem", opacity: 0.8}}>{d.weekday}</div>
              </div>
            ))}
          </div>

          <center><h2 className="mrng">☀️ Morning Slots</h2></center>
          <div className="slotmrng">
            {mrngslot.map((c) => {
              const now = new Date(nowTick);
              const blocked = isBlocked(selectedDateIso, c);
              const selected = selectedMrngslot.includes(c);
              const timeOver = isSlotInPast({ slotLabel: c, selectedDateIso, now });
              const cutoffLocked = isTomorrowMorningLocked({ selectedDateIso, now });
              const disabled = !selectedDateIso || blocked || timeOver || cutoffLocked;
              return (
                <div
                  key={c}
                  onClick={() => !disabled && chooseMrngslot(c)}
                  className="time-slot"
                  style={{
                    padding: "14px 10px",
                    borderRadius: "10px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    textAlign: "center",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    minWidth: "110px",
                    backgroundColor: selected ? "#43a047" : disabled ? "#f5f5f5" : "#ffffff",
                    color: selected ? "#ffffff" : disabled ? "#bdbdbd" : "#0B3D2E",
                    border: selected ? "2px solid #2e7d32" : disabled ? "2px solid #e0e0e0" : "2px solid #c8e6c9",
                    boxShadow: selected 
                      ? "0 4px 12px rgba(67, 160, 71, 0.3)" 
                      : "0 2px 6px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <div>{c}</div>
                  {blocked && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: "#e53935" }}>BOOKED</div>}
                  {!blocked && cutoffLocked && selectedDateIso && (
                    <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: "#fb8c00" }}>LOCKED</div>
                  )}
                  {!blocked && !cutoffLocked && timeOver && selectedDateIso && (
                    <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: "#757575" }}>TIME OVER</div>
                  )}
                </div>
              );
            })}
          </div>

          <center><h2 className="evng">🌙 Evening Slots</h2></center>
          <div className="slotevng">
            {evngslot.map((e) => {
              const now = new Date(nowTick);
              const blocked = isBlocked(selectedDateIso, e);
              const selected = selectedEvngslot.includes(e);
              const timeOver = isSlotInPast({ slotLabel: e, selectedDateIso, now });
              const disabled = !selectedDateIso || blocked || timeOver;
              return (
                <div
                  key={e}
                  onClick={() => !disabled && chooseEvngslot(e)}
                  className="time-slot"
                  style={{
                    padding: "14px 10px",
                    borderRadius: "10px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    textAlign: "center",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    minWidth: "110px",
                    backgroundColor: selected ? "#1565c0" : disabled ? "#f5f5f5" : "#ffffff",
                    color: selected ? "#ffffff" : disabled ? "#bdbdbd" : "#0B3D2E",
                    border: selected ? "2px solid #0d47a1" : disabled ? "2px solid #e0e0e0" : "2px solid #bbdefb",
                    boxShadow: selected 
                      ? "0 4px 12px rgba(21, 101, 192, 0.3)" 
                      : "0 2px 6px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <div>{e}</div>
                  {blocked && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: "#e53935" }}>BOOKED</div>}
                  {!blocked && timeOver && selectedDateIso && (
                    <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: "#757575" }}>TIME OVER</div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={goToPayment} 
            className="bookproceed"
            style={{
              background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
              color: "#ffffff",
              border: "none",
              padding: "16px 40px",
              fontSize: "1.1rem",
              fontWeight: "700",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(46, 125, 50, 0.4)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              margin: "30px auto",
              textTransform: "uppercase",
              letterSpacing: "1px",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px) scale(1.02)";
              e.target.style.boxShadow = "0 10px 30px rgba(46, 125, 50, 0.5)";
              e.target.style.background = "linear-gradient(135deg, #43a047 0%, #2e7d32 100%)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 6px 20px rgba(46, 125, 50, 0.4)";
              e.target.style.background = "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)";
            }}
            onMouseDown={(e) => {
              e.target.style.transform = "translateY(1px) scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.target.style.transform = "translateY(-3px) scale(1.02)";
            }}
          >
            <span>Proceed to Payment</span>
            <span style={{ fontSize: "1.3rem" }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Booking;

