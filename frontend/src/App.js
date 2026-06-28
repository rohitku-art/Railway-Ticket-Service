import React, { useState } from 'react';
import axios from 'axios';
import { auth } from './firebase-config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import './App.css'; 

function App() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [query, setQuery] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [selectedClass, setSelectedClass] = useState("Sleeper"); 

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        setUser(res.user);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        setUser({ ...res.user, displayName: name });
      }
    } catch (e) { alert(e.message); }
  };

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/search?from=${query.from}&to=${query.to}`);
      setData(res.data);
    } catch (error) { alert("Error fetching data!"); }
  };

  const handleBook = async (trainId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/book', { trainId, selectedClass });
      if (response.data.success) {
        setTicket(response.data.ticket);
        handleSearch();
      } else {
        alert(response.data.message);
      }
    } catch (error) { alert("Booking failed!"); }
  };

  const handleCancel = async (trainId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/cancel', { trainId });
      alert(res.data.message);
      handleSearch();
    } catch (error) { alert("Cancellation failed!"); }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif' }}>
      {!user ? (
        <div style={{ textAlign: 'center' }}>
          <h1>{isLogin ? "Login to Smart Rail" : "Create Account"}</h1>
          {!isLogin && <input placeholder="Name" onChange={(e) => setName(e.target.value)} style={{ padding: '10px', marginBottom: '10px' }} />}
          <br/>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', marginBottom: '10px' }} /><br/>
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', marginBottom: '10px' }} /><br/>
          <button onClick={handleAuth} style={{ padding: '10px 20px', cursor: 'pointer' }}>{isLogin ? "Login" : "Sign Up"}</button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h1>Smart Rail Explorer</h1>
            <button onClick={() => setUser(null)}>Logout</button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="From" value={query.from} onChange={(e) => setQuery({...query, from: e.target.value})} style={{ flex: 1, padding: '10px' }} />
            <input placeholder="To" value={query.to} onChange={(e) => setQuery({...query, to: e.target.value})} style={{ flex: 1, padding: '10px' }} />
            <button onClick={handleSearch} style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', cursor: 'pointer' }}>Search</button>
          </div>
          
          {data && data.train && (
            <div style={{ padding: '15px', border: '1px solid #27ae60', borderRadius: '8px', backgroundColor: '#e8f6ef' }}>
              <h3>{data.message}</h3>
              <p><strong>Train Name:</strong> {data.train.trainName}</p>
              <p><strong>Seats Available:</strong> {data.train.seats}</p>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Select Class: </label>
                <select onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="Sleeper">Sleeper</option>
                  <option value="AC">AC</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Naye Styled Buttons */}
              <button className="book-btn" onClick={() => handleBook(data.train.id)}>Book Now</button>
              <button className="cancel-btn" onClick={() => handleCancel(data.train.id)}>Cancel</button>
            </div>
          )}

          {ticket && (
            <div className="ticket-card" style={{ marginTop: '20px', padding: '20px', border: '2px dashed #333378' }}>
              <h3>Confirmed Ticket</h3>
              <p><strong>Train:</strong> {ticket.trainName}</p>
              <p><strong>Class:</strong> {ticket.class}</p>
              <p><strong>Price Paid:</strong> ₹{ticket.price}</p>
              <p><strong>Seat:</strong> {ticket.seatNo}</p>
              <p><strong>Departure:</strong> {ticket.departure}</p>
              <p><strong>Arrival:</strong> {ticket.arrival}</p>
              <p><strong>PNR:</strong> {ticket.pnr}</p>
              
              {/* Naya Print Button */}
              <button className="print-btn" onClick={() => window.print()}>Print Ticket</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;