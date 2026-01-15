import React, { useEffect, useMemo, useState } from "react";
import AdminNavbar from "./AdminNavbar";
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

const isSlotInPast = ({ slotLabel, selectedDateIso, now }) => {
  if (!selectedDateIso) return false;

  const todayIso = toLocalIsoDate(now);
  if (selectedDateIso < todayIso) return true;
  if (selectedDateIso > todayIso) return false;

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
  const [selectedMrngslot, setSelectedMrngslot] = useState([]);
  const [selectedEvngslot, setSelectedEvngslot] = useState([]);

  // If cutoff time passes while page is open, clear tomorrow-morning selections.
  useEffect(() => {
    if (!selectedDate) return;

    const now = new Date(nowTick);
    if (!isTomorrowMorningLocked({ selectedDateIso: selectedDate, now })) return;

    setSelectedMrngslot((prev) => (prev.length ? [] : prev));
  }, [nowTick, selectedDate]);

  const chooseDate = (iso) => {
    setSelectedDate(iso);
    setSelectedMrngslot([]);
    setSelectedEvngslot([]);
  };

  const toggleSlot = (slot, type) => {
    if (type === "morning") {
      setSelectedMrngslot((prev) =>
        prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
      );
      return;
    }

    setSelectedEvngslot((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const selectedSlotIds = useMemo(() => {
    return [...selectedMrngslot, ...selectedEvngslot]
      .map((s) => slotMap[s])
      .filter(Boolean);
  }, [selectedMrngslot, selectedEvngslot]);

  const lockSlots = async () => {
    if (!selectedDate) {
      alert("Please choose a date first");
      return;
    }
    if (selectedSlotIds.length === 0) {
      alert("Please select at least one slot");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/lock-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          slotIds: selectedSlotIds,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      alert("Slots locked");
    } catch (err) {
      alert(`Failed to lock slots: ${err?.message || err}`);
    }
  };

  const unlockSlots = async () => {
    if (!selectedDate) {
      alert("Please choose a date first");
      return;
    }
    if (selectedSlotIds.length === 0) {
      alert("Please select at least one slot");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin/unlock-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          slotIds: selectedSlotIds,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      alert("Slots unlocked");
    } catch (err) {
      alert(`Failed to unlock slots: ${err?.message || err}`);
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
              const selected = selectedMrngslot.includes(s);
              const tomorrowMorningLocked = isTomorrowMorningLocked({
                selectedDateIso: selectedDate,
                now: new Date(nowTick),
              });
              const disabled =
                isSlotInPast({
                slotLabel: s,
                selectedDateIso: selectedDate,
                now: new Date(nowTick),
                }) || tomorrowMorningLocked;
              return (
                <div
                  key={s}
                  onClick={disabled ? undefined : () => toggleSlot(s, "morning")}
                  aria-disabled={disabled}
                  title={
                    !selectedDate
                      ? "Choose a date first"
                      : disabled
                        ? tomorrowMorningLocked
                          ? "Tomorrow morning slots are locked after 6:00 PM"
                          : "Slot time over"
                        : ""
                  }
                  className={`slotbook-slot-chip ${
                    selected
                      ? "slotbook-slot-chip--morning-selected"
                      : "slotbook-slot-chip--morning-default"
                  }`}
                  style={
                    disabled
                      ? {
                          opacity: 0.45,
                          cursor: "not-allowed",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  {s}
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
              const selected = selectedEvngslot.includes(s);
              const disabled = isSlotInPast({
                slotLabel: s,
                selectedDateIso: selectedDate,
                now: new Date(nowTick),
              });
              return (
                <div
                  key={s}
                  onClick={disabled ? undefined : () => toggleSlot(s, "evening")}
                  aria-disabled={disabled}
                  title={
                    !selectedDate
                      ? "Choose a date first"
                      : disabled
                        ? "Slot time over"
                        : ""
                  }
                  className={`slotbook-slot-chip ${
                    selected
                      ? "slotbook-slot-chip--evening-selected"
                      : "slotbook-slot-chip--evening-default"
                  }`}
                  style={
                    disabled
                      ? {
                          opacity: 0.45,
                          cursor: "not-allowed",
                          pointerEvents: "none",
                        }
                      : undefined
                  }
                >
                  {s}
                </div>
              );
            })}
          </div>

          <div className="slotbook-actions">
            <button
              onClick={lockSlots}
              className="slotbook-action-btn slotbook-action-btn--lock"
              disabled={!selectedDate || selectedSlotIds.length === 0}
              title={
                !selectedDate
                  ? "Choose a date"
                  : selectedSlotIds.length === 0
                    ? "Select at least one slot"
                    : ""
              }
            >
              🔒 Lock Slots
            </button>
            <button
              onClick={unlockSlots}
              className="slotbook-action-btn slotbook-action-btn--unlock"
              disabled={!selectedDate || selectedSlotIds.length === 0}
              title={
                !selectedDate
                  ? "Choose a date"
                  : selectedSlotIds.length === 0
                    ? "Select at least one slot"
                    : ""
              }
            >
              🔓 Unlock Slots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bookings;