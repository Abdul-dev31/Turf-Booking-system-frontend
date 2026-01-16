import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoIosRadioButtonOn, IoIosRadioButtonOff } from "react-icons/io";
import logo1 from './assets/OIP.jpg';

// API base
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function Paymentinfo() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Get bookingId from Booking.jsx
  const bookingId = location.state?.bookingId;
  const bookingIds = location.state?.bookingIds;
  const userId = location.state?.userId;

  // UI state
  const [selectFull, setSelectFull] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bundles, setBundles] = useState([]);

  const normalizedBookingIds = Array.isArray(bookingIds)
    ? bookingIds.filter(Boolean)
    : bookingId
      ? [bookingId]
      : [];

  console.log('[Paymentinfo] Received:', { bookingId, bookingIds: normalizedBookingIds, userId });

  // 🔒 Safety check
  useEffect(() => {
    if (normalizedBookingIds.length === 0) {
      alert("Booking ID missing.  Please create a booking first.");
      navigate("/booking");
    }
  }, [normalizedBookingIds.length, navigate]);

  // ✅ Load payment info AND booking details
  useEffect(() => {
    const loadData = async () => {
      if (normalizedBookingIds.length === 0) return;

      try {
        const results = await Promise.all(
          normalizedBookingIds.map(async (id) => {
            const [payRes, bookRes] = await Promise.all([
              fetch(`${API_BASE}/api/payment/info/${id}`),
              fetch(`${API_BASE}/api/booking/details/${id}`),
            ]);

            const payData = await payRes.json();
            const bookData = await bookRes.json();

            return { bookingId: id, paymentInfo: payData, bookingDetails: bookData };
          })
        );

        setBundles(results);
        console.log('[Paymentinfo] Bundles:', results);

      } catch (err) {
        console.error("Failed to load data:", err);
        alert("Failed to load booking details");
      }
    };

    loadData();
  }, [normalizedBookingIds.join("|")]);

  // Load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(false);
      document.body.appendChild(script);
    });
  };

  // 🟢 PROCEED TO PAY
  const handleProceed = async () => {
    try {
      setLoading(true);

      await loadRazorpayScript();

      const paymentType = selectFull ? "Full" : "Advance";

      const payOneBooking = async (singleBookingId) => {
        console.log('[Payment] Creating order:', { bookingId: singleBookingId, paymentType });

        // 1️⃣ CREATE RAZORPAY ORDER
        const res = await fetch(`${API_BASE}/api/payment/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: singleBookingId,
            paymentType
          })
        });

        const data = await res.json();
        console.log('[Payment] Order response:', data);

        if (!data.success) {
          throw new Error("Failed to create payment order");
        }

        // 2️⃣ OPEN RAZORPAY (wrap in Promise so we can pay multiple bookings sequentially)
        return await new Promise((resolve, reject) => {
          let settled = false;

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.order.amount,
            currency: "INR",
            order_id: data.order.id,
            name: "Kumbakonam Turf",
            description: "Slot Booking Payment",

            handler: async function (response) {
              if (settled) return;
              console.log('[Payment] Razorpay response:', response);

              try {
                // 3️⃣ VERIFY PAYMENT
                const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    bookingId: singleBookingId,
                    amountPaid: data.amountToPay
                  })
                });

                const verifyData = await verifyRes.json();
                console.log('[Payment] Verify response:', verifyData);

                if (verifyData.success) {
                  settled = true;
                  resolve({ bookingId: singleBookingId, paymentId: response.razorpay_payment_id });
                } else {
                  settled = true;
                  reject(new Error("Payment verification failed"));
                }
              } catch (e) {
                settled = true;
                reject(e);
              }
            },

            prefill: {
              contact: userId || "",
            },

            theme: { color: "#3399cc" }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();

          // Handle payment failure
          rzp.on("payment.failed", function (response) {
            if (settled) return;
            settled = true;
            console.error("Payment failed:", response);
            reject(new Error(response?.error?.description || "Please try again"));
          });
        });
      };

      const paymentResults = [];
      for (const id of normalizedBookingIds) {
        const paid = await payOneBooking(id);
        paymentResults.push(paid);
      }

      navigate("/bookinginfo", {
        state: {
          bookingId: normalizedBookingIds[0],
          bookingIds: normalizedBookingIds,
          payments: paymentResults
        }
      });

    } catch (err) {
      console.error('[Payment] Error:', err);
      alert("Payment failed:  " + (err?.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  // Helper:  Format date
  const prettyDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  // Helper:  Get day name
  const getDayName = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { weekday: "long" });
    } catch {
      return "";
    }
  };

  // ⏳ Loading state
  if (!bundles || bundles.length === 0) {
    return (
      <div className="turf">
        <h3 style={{ textAlign: "center", marginTop: "50px" }}>
          Loading payment details...
        </h3>
      </div>
    );
  }

  const total = bundles.reduce((sum, b) => sum + (Number(b.paymentInfo?.TotalAmount) || 0), 0);
  const advance = Math.round(total * 0.2);

  const allSlots = bundles.flatMap((b) => b.bookingDetails?.slots || []);
  const durationHours = allSlots.length || 0;

  // Calculate per-hour prices (unique)
  const perHourPrices = allSlots.length
    ? [...new Set(allSlots.map(s => s.Price))]
    : [];
  
  const perHourDisplayText = perHourPrices.length === 1
    ? `₹${perHourPrices[0]}`
    : perHourPrices.map(p => `₹${p}`).join(" / ");

  return (
    <div className='turf'>
      <div className='text1'>
        <center><h2 className='text1'>Select Payment Mode</h2></center>
      </div>

      <div className="fullcontainer">
        {/* LEFT CONTAINER - Booking Details */}
        <div className="leftcontainer">
          <div className='logobox'>
            <img src={logo1} className='logo' alt="turf logo" />
            <div className="turfdetail">
              <div className='text'>Kumbakonam Turf</div>
              <div className='text'>Tamil Nadu</div>
              <div className='text2'>12:00am to 11:59pm</div>
            </div>
          </div>

          <div className="details">
            {bundles.map((b) => (
              <div key={b.bookingId} style={{ marginBottom: 12 }}>
                <h4 className='texts'>
                  {prettyDate(b.bookingDetails?.bookingDate)} &nbsp;
                  {b.bookingDetails?.slots?.map(s => s.Timing).join(", ")}
                </h4>
                <h5 className='texts'>Day: {getDayName(b.bookingDetails?.bookingDate)}</h5>
              </div>
            ))}
            <br/>
            <h4 className='texts'>
              Duration:  {durationHours} {durationHours === 1 ? "hour" :  "hours"}
            </h4>
            <br/>
            <h4 className='texts'>(Per hour {perHourDisplayText})</h4>

            {/* Per-slot breakdown */}
            {allSlots && allSlots.length > 0 && (
              <div style={{ fontSize: 13, marginTop: 10 }}>
                {allSlots.map((s) => (
                  <div key={s.SlotId}>
                    {s.Timing} — ₹{s.Price}
                  </div>
                ))}
              </div>
            )}
          </div>

          <h4 className='amount3'>Total &nbsp;&nbsp;&nbsp; ₹{total}</h4>
        </div>

        {/* RIGHT CONTAINER - Payment Options */}
        <div className='rightcontainer'>
          <h4 className='paymentSummaryTitle'>Payment Summary</h4>
          <h4 className='totalamount'>Total Amount</h4>
          <h4 className='tax'>(included all taxes)</h4>
          <h4 className='amount'>₹{total}</h4>

          {/* Full Payment Option */}
          <div className='fullbox'>
            <span className='onbutton' onClick={() => setSelectFull(true)}>
              {selectFull ? <IoIosRadioButtonOn className='radio' /> : <IoIosRadioButtonOff className='radiooff' />}
            </span>
            <div className='full'>
              <h4 className='fullpayment'>Full Payment</h4>
              <h4 className='fullamount'>₹{total}</h4>
            </div>
          </div>

          {/* Advance Payment Option */}
          <div className='halfbox'>
            <span className='onbutton' onClick={() => setSelectFull(false)}>
              {!selectFull ? <IoIosRadioButtonOn className='radio' /> : <IoIosRadioButtonOff className='radiooff' />}
            </span>
            <div className='half'>
              <h4 className='halfpayment'>Advance Payment (20%)</h4>
              <h4 className='halfamount'>₹{advance}</h4>
            </div>
          </div>

          <h4 className='selectedamount'>Selected Amount</h4>
          <h4 className='finalamount'>₹{selectFull ? total : advance}</h4>

          {/* Proceed Button */}
          <div className='proceed'>
            <h4 className='lastamount'>₹{selectFull ? total :  advance}</h4>
            <button 
              onClick={handleProceed} 
              className='proceedbutton' 
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed To Pay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Paymentinfo;