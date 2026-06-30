import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import AdminNavbar from "./AdminNavbar";
import { apiFetch } from "./api";

function Bookingdetails() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/booking")
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const filtered = bookings.filter(b =>
    (b.Mobile_Number || "").includes(search)
  );

  const getStatusStyle = (status) => {
    const base = {
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    };
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "paid":
        return { ...base, backgroundColor: "#e8f5e9", color: "#2e7d32" };
      case "pending":
        return { ...base, backgroundColor: "#fff3e0", color: "#ef6c00" };
      case "cancelled":
        return { ...base, backgroundColor: "#ffebee", color: "#c62828" };
      default:
        return { ...base, backgroundColor: "#f5f5f5", color: "#616161" };
    }
  };

  return (
    <div className="turf">
      <AdminNavbar />

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
      }}>
        <h2 style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#0B3D2E",
          fontSize: "1.8rem",
          fontWeight: "700",
          marginBottom: "25px",
        }}>
          📋 Booking Details
        </h2>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "#ffffff",
          padding: "12px 20px",
          borderRadius: "50px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          border: "2px solid #c8e6c9",
          maxWidth: "350px",
          marginBottom: "30px",
        }}>
          <FaSearch style={{ color: "#2e7d32", fontSize: "1.1rem" }} />
          <input
            placeholder="Search by phone number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: "1rem",
              width: "100%",
              backgroundColor: "transparent",
              color: "#0B3D2E",
            }}
          />
        </div>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 6px 25px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
          }}>
            <thead>
              <tr style={{
                background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
              }}>
                {["Booking ID", "Phone", "Date", "Slots", "Total", "Balance", "Status"].map(header => (
                  <th key={header} style={{
                    padding: "18px 16px",
                    textAlign: "left",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#9e9e9e",
                    fontSize: "1.1rem",
                  }}>
                    No bookings found
                  </td>
                </tr>
              ) : (
                filtered.map((b, index) => (
                  <tr 
                    key={b.BookingId}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fdf8",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e8f5e9";
                      e.currentTarget.style.transform = "scale(1.01)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8fdf8";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <td style={{
                      padding: "16px",
                      color: "#0B3D2E",
                      fontWeight: "600",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      {b.BookingId}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: "#424242",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      {b.Mobile_Number}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: "#424242",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      {b.BookingDate?.slice(0,10)}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: "#424242",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      {b.Slots}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: "#2e7d32",
                      fontWeight: "700",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      ₹{b.TotalAmount}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: b.BalanceAmount > 0 ? "#ef6c00" : "#2e7d32",
                      fontWeight: "600",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      ₹{b.BalanceAmount}
                    </td>
                    <td style={{
                      padding: "16px",
                      borderBottom: "1px solid #e8f5e9",
                    }}>
                      <span style={getStatusStyle(b.Status)}>
                        {b.Status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: "20px",
          textAlign: "right",
          color: "#757575",
          fontSize: "0.9rem",
        }}>
          Total Bookings: <strong style={{ color: "#2e7d32" }}>{filtered.length}</strong>
        </div>
      </div>
    </div>
  );
}

export default Bookingdetails;

