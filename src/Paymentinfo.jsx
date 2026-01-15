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
  const userId = location.state?.userId;

  // UI state
  const [selectFull, setSelectFull] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  console.log('[Paymentinfo] Received:', { bookingId, userId });

  // 🔒 Safety check
  useEffect(() => {
    if (!bookingId) {
      alert("Booking ID missing.  Please create a booking first.");
      navigate("/booking");
    }
  }, [bookingId, navigate]);

  // ✅ Load payment info AND booking details
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId) return;

      try {
        // 1. Get payment info
        const payRes = await fetch(`${API_BASE}/api/payment/info/${bookingId}`);
        const payData = await payRes.json();
        setPaymentInfo(payData);
        console.log('[Paymentinfo] Payment info:', payData);

        // 2. Get booking details (date, slots, etc.)
        const bookRes = await fetch(`${API_BASE}/api/booking/details/${bookingId}`);
        const bookData = await bookRes.json();
        setBookingDetails(bookData);
        console.log('[Paymentinfo] Booking details:', bookData);

      } catch (err) {
        console.error("Failed to load data:", err);
        alert("Failed to load booking details");
      }
    };

    loadData();
  }, [bookingId]);

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

      console.log('[Payment] Creating order:', { bookingId, paymentType });

      // 1️⃣ CREATE RAZORPAY ORDER
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType
        })
      });

      const data = await res.json();
      console.log('[Payment] Order response:', data);

      if (!data.success) {
        alert("Failed to create payment order");
        return;
      }

      // 2️⃣ OPEN RAZORPAY
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,
        name: "Kumbakonam Turf",
        description: "Slot Booking Payment",

        handler: async function (response) {
          console.log('[Payment] Razorpay response:', response);

          // 3️⃣ VERIFY PAYMENT
          const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
              amountPaid: data.amountToPay
            })
          });

          const verifyData = await verifyRes.json();
          console.log('[Payment] Verify response:', verifyData);

          if (verifyData.success) {
            navigate("/bookinginfo", {
              state: { 
                bookingId,
                paymentId: response.razorpay_payment_id
              }
            });
          } else {
            alert("Payment verification failed");
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
        console.error("Payment failed:", response);
        alert("Payment failed:  " + (response.error?.description || "Please try again"));
      });

    } catch (err) {
      console.error('[Payment] Error:', err);
      alert("Payment failed");
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
  if (!paymentInfo || !bookingDetails) {
    return (
      <div className="turf">
        <h3 style={{ textAlign: "center", marginTop: "50px" }}>
          Loading payment details...
        </h3>
      </div>
    );
  }

  const total = paymentInfo.TotalAmount;
  const advance = Math.round(total * 0.2);
  const durationHours = bookingDetails.slots?.length || 0;

  // Calculate per-hour prices (unique)
  const perHourPrices = bookingDetails.slots
    ? [...new Set(bookingDetails.slots.map(s => s.Price))]
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
            <h4 className='texts'>
              {prettyDate(bookingDetails.bookingDate)} &nbsp; 
              {bookingDetails.slots?.map(s => s.Timing).join(", ")}
            </h4>
            <h5 className='texts'>Day: {getDayName(bookingDetails.bookingDate)}</h5>
            <br/>
            <h4 className='texts'>
              Duration:  {durationHours} {durationHours === 1 ? "hour" :  "hours"}
            </h4>
            <br/>
            <h4 className='texts'>(Per hour {perHourDisplayText})</h4>

            {/* Per-slot breakdown */}
            {bookingDetails.slots && bookingDetails.slots.length > 0 && (
              <div style={{ fontSize: 13, marginTop: 10 }}>
                {bookingDetails.slots.map((s) => (
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