import { useState } from "react"

function Bookinginfo(){
    const [open, setopen] = useState(false);

    return(
        <div className="turf">
            <div className="fullinfobox">
                <div style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    borderRadius: '25px',
                    padding: '40px',
                    maxWidth: '850px',
                    width: '100%',
                    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                    <h2 style={{
                        textAlign: 'center',
                        color: '#0B3D2E',
                        fontSize: '1.6rem',
                        fontWeight: '700',
                        marginBottom: '30px'
                    }}>🎫 Booking Confirmation</h2>

                    <div className="info">
                        <div className="leftside">
                            <h4 className="turfname">Turf Name</h4>
                            <h4 className="turfaddress">🏟️ Kumbakonam Turf</h4>
                            
                            <h4 className="slottime">Slot Time</h4>
                            <h4 className="timing">7:00 PM - 10:00 PM</h4>
                            
                            <h4 className="slotduration">Duration</h4>
                            <h4 className="duration">3 Hours</h4>
                            
                            <h4 className="totalamount">Total Amount</h4>
                            <h4 className="amounttotal">₹3,000</h4>
                            
                            <h4 className="amountpaid">Amount Paid</h4>
                            <h4 className="paidamount">₹3,000</h4>
                            
                            <h4 className="balance">Balance Amount</h4>
                            <span className="balancestatus">✓ Nil</span>
                        </div>

                        <div className="rightside">
                            <h4 className="slotdate">Slot Date</h4>
                            <h4 className="date">📅 02 Sep 2025</h4>
                            
                            <h4 className="bookid">Booking ID</h4>
                            <h4 className="id">#T1234567</h4>
                            
                            <h4 className="bookingnum">Phone Number</h4>
                            <h4 className="number">📞 9999988888</h4>

                            <div style={{
                                marginTop: '30px',
                                padding: '15px',
                                background: '#fff8e1',
                                borderRadius: '12px',
                                borderLeft: '4px solid #ffa000'
                            }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    color: '#e65100',
                                    fontWeight: '500'
                                }}>📌 Note: Balance amount to be paid at venue</p>
                            </div>
                        </div>
                    </div>

                    <div className="buttons">
                        <button onClick={() => setopen(true)} className="share">
                            📤 Share Booking
                        </button>
                        <button className="download">
                            📥 Download
                        </button>
                    </div>

                    {open && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }} onClick={() => setopen(false)}>
                            <div style={{
                                background: 'white',
                                padding: '30px',
                                borderRadius: '20px',
                                textAlign: 'center',
                                maxWidth: '400px'
                            }} onClick={(e) => e.stopPropagation()}>
                                <h3 style={{color: '#0B3D2E', marginBottom: '20px'}}>Share Booking</h3>
                                <p style={{color: '#757575'}}>Share options coming soon!</p>
                                <button 
                                    onClick={() => setopen(false)}
                                    style={{
                                        marginTop: '20px',
                                        padding: '10px 25px',
                                        background: '#43a047',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Bookinginfo