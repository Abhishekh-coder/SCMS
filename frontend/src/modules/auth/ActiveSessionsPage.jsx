import React, { useState, useEffect } from 'react';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([
    {
      sessionUuid: 'sess_948271',
      deviceName: 'Windows PC (Chrome)',
      browser: 'Chrome 124.0',
      ipAddress: '192.168.1.45',
      country: 'India',
      city: 'Mumbai',
      trustedDevice: true,
      lastSeen: new Date().toISOString()
    }
  ]);

  const handleRevokeSession = (sessionUuid) => {
    setSessions(sessions.filter(s => s.sessionUuid !== sessionUuid));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Active Security Sessions</h2>
      
      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Recognized Devices & Logins</h3>
        {sessions.map(s => (
          <div key={s.sessionUuid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontWeight: '600' }}>{s.deviceName} {s.trustedDevice && <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>✔ Trusted</span>}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.browser} • {s.ipAddress} ({s.city}, {s.country})</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Last Seen: {new Date(s.lastSeen).toLocaleString()}</div>
            </div>
            <button 
              onClick={() => handleRevokeSession(s.sessionUuid)}
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
