import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import API from './api';
import Dashboard from './Dashboard';

function LiveAnalyticsView() {
  return (
    <div style={{ padding: '2.5rem', fontFamily: 'system-ui, sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h3>Live System Diagnostics</h3>
      <p style={{ color: '#555' }}>
        Monitoring background workers, dynamic byte authentication masks, and Keras tensor pipelines.
      </p>
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState('xavier_test1@example.com');
  const [userPassword, setUserPassword] = useState('securepassword123');

  const executeLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await API.post('/auth/login', { email: userEmail, password: userPassword });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setAuthToken(token);
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    }
  };

  const executeLogout = () => {
    localStorage.removeItem('token');
    setAuthToken('');
  };

  return (
    <Router>
      <nav style={{ padding: '1rem 2rem', background: '#1e1e24', color: '#fff', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <strong style={{ color: '#61dafb' }}>Analytics Engine</strong>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Control Panel</Link>
        <Link to="/diagnostics" style={{ color: '#fff', textDecoration: 'none' }}>System Telemetry</Link>
      </nav>

      <Routes>
        <Route 
          path="/" 
          element={
            authToken ? (
              <Dashboard onLogout={executeLogout} />
            ) : (
              <div style={{ padding: '4rem 1rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <h2>Analytics Control Center</h2>
                <form onSubmit={executeLogin} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1rem', width: '320px', marginTop: '1rem' }}>
                  <input 
                    type="email" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)} 
                    placeholder="User Email" 
                    required 
                    style={{ padding: '0.6rem' }}
                  />
                  <input 
                    type="password" 
                    value={userPassword} 
                    onChange={(e) => setUserPassword(e.target.value)} 
                    placeholder="Password" 
                    required 
                    style={{ padding: '0.6rem' }}
                  />
                  <button type="submit" style={{ padding: '0.6rem', cursor: 'pointer', fontWeight: 'bold' }}>Sign In</button>
                </form>
              </div>
            )
          } 
        />
        <Route path="/diagnostics" element={authToken ? <LiveAnalyticsView /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}