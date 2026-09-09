import React, { useState } from 'react';
import API from './api';
import Dashboard from './Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('xavier_test1@example.com');
  const [password, setPassword] = useState('securepassword123');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  if (token) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div style={{ padding: '4rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Analytics System Engine</h2>
      <form onSubmit={handleLogin} style={{ display: 'inline-flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email" 
          required 
          style={{ padding: '0.5rem' }}
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Password" 
          required 
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Login</button>
      </form>
    </div>
  );
}