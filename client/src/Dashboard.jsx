import React, { useState } from 'react';
import API from './api';

export default function Dashboard({ onLogout }) {
  const [metricName, setMetricName] = useState('CPU_Usage');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Dispatching payload to Node.js backend...');

    try {
      const res = await API.post('/api/telemetry', {
        metricName,
        value: parseFloat(value),
      });

      if (res.data.success) {
        setStatus(`Payload queued in Redis queue! Job ID: ${res.data.id}`);
        setValue('');
      } else {
        setStatus(`Submission failed: ${res.data.error}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Telemetry Control Center</h2>
        <button onClick={onLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      
      <p style={{ color: '#666' }}>Connected to Multi-Service ML & Async Analytics Engine</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Metric</label>
          <select 
            value={metricName} 
            onChange={(e) => setMetricName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="CPU_Usage">CPU_Usage</option>
            <option value="Memory_Pressure">Memory_Pressure</option>
            <option value="Network_I/O">Network_I/O</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Metric Value</label>
          <input 
            type="number" 
            step="0.01" 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            required 
            placeholder="e.g. 92.4"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Processing...' : 'Send Telemetry Metric'}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f4f4f4', borderRadius: '4px', borderLeft: '4px solid #007bff' }}>
          <strong>System Log:</strong> {status}
        </div>
      )}
    </div>
  );
}