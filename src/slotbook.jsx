import React, { useEffect, useMemo, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import { apiFetch } from "./api";
import {
  IoCalendarOutline,
  IoMoonOutline,
  IoSunnyOutline,
} from "react-icons/io5";

const mrngslot = [
  "6am - 7am",
  "7am - 8am",
  "8am - 9am",
  "9am - 10am",
  "10am - 11am",
  "11am - 12pm",
  "12pm - 1pm",
  "1pm -2pm",
  "2pm-3pm",
  "3pm - 4pm",
  "4pm - 5pm",
  "5pm - 6pm",
];

const evngslot = [
  "6pm - 7pm",
  "7pm - 8pm",
  "8pm - 9pm",
  "9pm - 10pm",
  "10pm - 11pm",
  "11pm - 12am",
  "12am - 1am",
  "1am - 2am",
  "2am - 3am",
  "3am - 4am",
  "4am - 5am",
  "5am - 6am",
];

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

// Map UI slot text to database SlotId
const slotMap = {
  "6am - 7am": "SID001",
  "7am - 8am": "SID002",
  "8am - 9am": "SID003",
  "9am - 10am": "SID004",
  "10am - 11am": "SID005",
  "11am - 12pm": "SID006",
  "12pm - 1pm": "SID007",
  "1pm -2pm": "SID008",
  "2pm-3pm": "SID009",
  "3pm - 4pm": "SID010",
  "4pm - 5pm": "SID011",
  "5pm - 6pm": "SID012",

  "6pm - 7pm": "SID013",
  "7pm - 8pm": "SID014",
  "8pm - 9pm": "SID015",
  "9pm - 10pm": "SID016",
  "10pm - 11pm": "SID017",
  "11pm - 12am": "SID018",
  "12am - 1am": "SID019",
  "1am - 2am": "SID020",
  "2am - 3am": "SID021",
  "3am - 4am": "SID022",
  "4am - 5am": "SID023",
  "5am - 6am": "SID024",
};

// Generate next 7 days
const generateDates = () => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: `${d.getDate()}-${d.toLocaleString("en-US", { weekday: "short" })}`,
      iso: toLocalIsoDate(d),
    });
  }

  return days;
};

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

// Business rule: late-night slots are considered part of the *next day*
// for booking/blocking/time-over.
// This avoids splitting a continuous late-night selection across two dates
// (e.g., 11pm-12am + 12am-1am should be treated as the next day).
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

// Business rule: after 6:00 PM today, tomorrow's morning slots can't be selected.
const isTomorrowMorningLocked = ({ selectedDateIso, now }) => {
  if (!selectedDateIso) return false;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = toLocalIsoDate(tomorrow);

  if (selectedDateIso !== tomorrowIso) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= 18 * 60;
};

function Bookings() {
  const dates = useMemo(() => generateDates(), []);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slotData, setSlotData] = useState({});

  // If cutoff time passes while page is open, do nothing special.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const chooseDate = (iso) => {
    setSelectedDate(iso);
    fetchSlotData(iso);
  };

  const fetchSlotData = async (dateIso) => {
    try {
      const nextDateIso = addDaysIso(dateIso, 1);
      const datesToLoad = [...new Set([dateIso, nextDateIso].filter(Boolean))];

      const responses = await Promise.all(
        datesToLoad.map(async (date) => {
          const res = await apiFetch(`/api/admin/slots?date=${date}`);
          if (!res.ok) return {};
          return res.json();
        })
      );

      setSlotData(Object.assign({}, ...responses));
    } catch (err) {
      console.error("Failed to fetch slot data:", err);
    }
  };

  const getSlotInfo = (slotLabel) => {
    const effectiveDate = getEffectiveDateIsoForSlot({
      selectedDateIso: selectedDate,
      slotLabel,
    });
    const slotId = slotMap[slotLabel];
    const key = `${slotId}_${effectiveDate}`;
    return slotData[key] || null;
  };

  const viewSlotDetails = (slotLabel) => {
    const info = getSlotInfo(slotLabel);
    if (info && info.isBooked) {
      alert(`Booking Details:\n\nUser Name: ${info.userName || 'N/A'}\nMobile Number: ${info.mobileNumber || 'N/A'}`);
    } else if (info && info.isLocked) {
      alert(`Slot Details:\n\nUser Name: ${info.userName || 'N/A'}\nMobile Number: ${info.mobileNumber || 'N/A'}`);
    } else {
      alert("This slot is available for booking.");
    }
  };

  const lockSlot = async (slotLabel) => {
    const effectiveDate = getEffectiveDateIsoForSlot({
      selectedDateIso: selectedDate,
      slotLabel,
    });

    const slotId = slotMap[slotLabel];

    if (!slotId) {
      alert("Invalid slot");
      return;
    }

    // Get user details from session/localStorage (modify based on your auth setup)
    const adminDetails = {
      adminName: localStorage.getItem("adminName") || "Admin",
      adminId: localStorage.getItem("adminId") || "Unknown",
    };

    try {
      const res = await apiFetch("/api/admin/lock-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slotId,
          date: effectiveDate,
          lockedBy: adminDetails.adminName,
          adminId: adminDetails.adminId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      alert(`Slot ${slotLabel} locked successfully`);
      fetchSlotData(selectedDate); // Refresh slot data
    } catch (err) {
      alert(`Failed to lock slot: ${err?.message || err}`);
    }
  };

  const unlockSlot = async (slotLabel) => {
    const effectiveDate = getEffectiveDateIsoForSlot({
      selectedDateIso: selectedDate,
      slotLabel,
    });

    const slotId = slotMap[slotLabel];

    if (!slotId) {
      alert("Invalid slot");
      return;
    }

    // Prompt for unlock reason
    const reason = prompt("Please enter the reason for unlocking this slot:");
    if (!reason || reason.trim() === "") {
      alert("Reason is required to unlock a slot");
      return;
    }

    // Get user details from session/localStorage (modify based on your auth setup)
    const adminDetails = {
      adminName: localStorage.getItem("adminName") || "Admin",
      adminId: localStorage.getItem("adminId") || "Unknown",
    };

    try {
      const res = await apiFetch("/api/admin/unlock-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slotId,
          date: effectiveDate,
          reason: reason.trim(),
          unlockedBy: adminDetails.adminName,
          adminId: adminDetails.adminId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      alert(`Slot ${slotLabel} unlocked successfully\nReason: ${reason}`);
      fetchSlotData(selectedDate); // Refresh slot data
    } catch (err) {
      alert(`Failed to unlock slot: ${err?.message || err}`);
    }
  };

  return (
    <div className="turf slotbook-page">
      <AdminNavbar />

      <div className="slotbook-wrapper">
        <h1 className="slotbook-title">
          <IoCalendarOutline style={{ fontSize: "2rem" }} />
          Slot Booking Management
        </h1>

        <div className="slotbook-card">
          <h2 className="slotbook-section-title">
            <IoCalendarOutline style={{ color: "#2e7d32" }} /> Choose Date
          </h2>

          <div className="slotbook-date-list">
            {dates.map((d) => {
              const isSelected = selectedDate === d.iso;
              const [day, weekday] = d.label.split("-");
              return (
                <div
                  key={d.iso}
                  onClick={() => chooseDate(d.iso)}
                  className={`slotbook-date-chip ${
                    isSelected
                      ? "slotbook-date-chip-selected"
                      : "slotbook-date-chip-default"
                  }`}
                >
                  <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{day}</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{weekday}</div>
                </div>
              );
            })}
          </div>

          <h2 className="slotbook-section-title">
            <IoSunnyOutline style={{ color: "#ff9800", fontSize: "1.4rem" }} />
            Morning Slots
          </h2>

          <div className="slotbook-slot-grid">
            {mrngslot.map((s) => {
              const tomorrowMorningLocked = isTomorrowMorningLocked({
                selectedDateIso: selectedDate,
                now: new Date(nowTick),
              });
              const disabled =
                !selectedDate ||
                isSlotInPast({
                  slotLabel: s,
                  selectedDateIso: selectedDate,
                  now: new Date(nowTick),
                }) ||
                tomorrowMorningLocked;
              const slotInfo = getSlotInfo(s);
              const isLocked = slotInfo?.isLocked || false;
              const isBooked = slotInfo?.isBooked || false;
              const isUnavailable = isLocked || isBooked;
              return (
                <div key={s} className="slotbook-slot-actions">
                  <div 
                    className="slotbook-slot-label" 
                    onClick={() => selectedDate && viewSlotDetails(s)}
                    style={{ 
                      cursor: selectedDate ? 'pointer' : 'default',
                      backgroundColor: isBooked ? '#fff3e0' : isLocked ? '#ffebee' : 'transparent',
                      padding: '8px',
                      borderRadius: '4px',
                      fontWeight: isUnavailable ? 'bold' : 'normal'
                    }}
                    title={isUnavailable ? 'Click to view details' : 'Click to view slot info'}
                  >
                    {s} {isBooked ? '📌 BOOKED' : isLocked ? '🔒 LOCKED' : ''}
                  </div>
                  <div className="slotbook-slot-buttons">
                    <button
                      onClick={() => lockSlot(s)}
                      disabled={disabled || isUnavailable}
                      className="slotbook-slot-btn slotbook-slot-btn--lock"
                      title={
                        !selectedDate
                          ? "Choose a date first"
                          : isBooked
                          ? "Slot is already booked by customer"
                          : isLocked
                          ? "Slot is already locked"
                          : disabled
                          ? tomorrowMorningLocked
                            ? "Tomorrow morning slots are locked after 6:00 PM"
                            : "Slot time over"
                          : "Lock this slot"
                      }
                    >
                      🔒 Lock
                    </button>
                    <button
                      onClick={() => unlockSlot(s)}
                      disabled={disabled || !isLocked || isBooked}
                      className="slotbook-slot-btn slotbook-slot-btn--unlock"
                      title={
                        !selectedDate
                          ? "Choose a date first"
                          : isBooked
                          ? "Customer booked slots cannot be unlocked here"
                          : !isLocked
                          ? "Slot is not locked"
                          : disabled
                          ? "Slot time over"
                          : "Unlock this slot"
                      }
                    >
                      🔓 Unlock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="slotbook-section-title">
            <IoMoonOutline style={{ color: "#5c6bc0", fontSize: "1.4rem" }} />
            Evening Slots
          </h2>

          <div className="slotbook-slot-grid">
            {evngslot.map((s) => {
              const disabled =
                !selectedDate ||
                isSlotInPast({
                  slotLabel: s,
                  selectedDateIso: selectedDate,
                  now: new Date(nowTick),
                });
              const slotInfo = getSlotInfo(s);
              const isLocked = slotInfo?.isLocked || false;
              const isBooked = slotInfo?.isBooked || false;
              const isUnavailable = isLocked || isBooked;
              return (
                <div key={s} className="slotbook-slot-actions">
                  <div 
                    className="slotbook-slot-label" 
                    onClick={() => selectedDate && viewSlotDetails(s)}
                    style={{ 
                      cursor: selectedDate ? 'pointer' : 'default',
                      backgroundColor: isBooked ? '#fff3e0' : isLocked ? '#ffebee' : 'transparent',
                      padding: '8px',
                      borderRadius: '4px',
                      fontWeight: isUnavailable ? 'bold' : 'normal'
                    }}
                    title={isUnavailable ? 'Click to view details' : 'Click to view slot info'}
                  >
                    {s} {isBooked ? '📌 BOOKED' : isLocked ? '🔒 LOCKED' : ''}
                  </div>
                  <div className="slotbook-slot-buttons">
                    <button
                      onClick={() => lockSlot(s)}
                      disabled={disabled || isUnavailable}
                      className="slotbook-slot-btn slotbook-slot-btn--lock"
                      title={
                        !selectedDate
                          ? "Choose a date first"
                          : isBooked
                          ? "Slot is already booked by customer"
                          : isLocked
                          ? "Slot is already locked"
                          : disabled
                          ? "Slot time over"
                          : "Lock this slot"
                      }
                    >
                      🔒 Lock
                    </button>
                    <button
                      onClick={() => unlockSlot(s)}
                      disabled={disabled || !isLocked || isBooked}
                      className="slotbook-slot-btn slotbook-slot-btn--unlock"
                      title={
                        !selectedDate
                          ? "Choose a date first"
                          : isBooked
                          ? "Customer booked slots cannot be unlocked here"
                          : !isLocked
                          ? "Slot is not locked"
                          : disabled
                          ? "Slot time over"
                          : "Unlock this slot"
                      }
                    >
                      🔓 Unlock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bookings;
