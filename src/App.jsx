import Bookinginfo from './bookinginfo';
import Home from './Home';
import Login from './Login';
import Otp from './otp';
import Paymentinfo from './Paymentinfo';
import Booking from './booking';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signin from './Sign in';
import Passchange from './passchange';
import Bookings from './slotbook';
import Bookingdetails from './bookingdetails';
import Upi from './changeupi';
import AdLogin from './Adminlogin';
import Adminotp from './adminotp';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/paymentinfo" element={<Paymentinfo />} />
          <Route path="/bookinginfo" element={<Bookinginfo />} />
          <Route path="/adminlogin" element={<AdLogin />} />
          <Route path="/passchange" element={<Passchange />} />
          <Route path="/adminotp" element={<Adminotp />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/slotbook" element={<Bookings />} />
          <Route path="/bookingdetails" element={<Bookingdetails />} />
          <Route path="/changeupi" element={<Upi />} />
        </Routes>
      </Router>
    </div>
  );
}


export default App;
