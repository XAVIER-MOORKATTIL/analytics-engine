import React, { useState, useEffect } from 'react';
import API from './api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Dashboard({ onLogout }) {
  const [metrics, setMetrics] = useState([]);
  const [metricName, setMetricName] = useState('CPU_Usage');
  const [value, setValue] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await API.get('/analytics');
      const formattedData = res.data.data.map(m => ({
        ...m,
        time: new Date(m.timestamp).toLocaleTimeString()
      })).reverse();
      setMetrics(formattedData);
    } catch (err) {
      console.error(err.response?.data?.message || 'Failed to fetch metrics');
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleLogMetric = async (e) => {
    e.preventDefault();
    if (!value) return;
    try {
      await API.post('/analytics', {
        metricName,
        value: parseFloat(value),
        tags: ['frontend', 'live']
      });
      setValue('');
      fetchMetrics();
    } catch (err) {
      console.error(err.response?.data?.message || 'Log failed');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Telemetry Analytics Dashboard</h2>
        <button onClick={onLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Logout</button>
      </div>

      <form onSubmit={handleLogMetric} style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
        <input 
          type="text" 
          value={metricName} 
          onChange={(e) => setMetricName(e.target.value)} 
          placeholder="Metric Name" 
          required 
          style={{ padding: '0.5rem' }}
        />
        <input 
          type="number" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          placeholder="Value (e.g., 65.4)" 
          step="0.1" 
          required 
          style={{ padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Submit Metric</button>
      </form>

      <h3>Real-Time Metrics Visualization</h3>
      <div style={{ width: '100%', height: 300, background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
        <ResponsiveContainer>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}