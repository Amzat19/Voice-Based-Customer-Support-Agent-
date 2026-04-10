import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BarChart3 } from 'lucide-react';
import { supabase } from './supabase';
import './dashboard.css';
import Escalations from './views/Escalations';
import SessionLogs from './views/SessionLogs';
import Analytics from './views/Analytics';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLive, setIsLive] = useState(false);
  const [lastSync, setLastSync] = useState('just now');
  const [unreadEscalations, setUnreadEscalations] = useState(0);

  useEffect(() => {
    // Check initial connection
    const checkConn = setInterval(() => {
      // In a real app we might check the websocket state
      // For now, if supabase channel establishes, we assume live.
    }, 5000);

    // Minimal realtime setup just to set live status
    const channel = supabase.channel('system_status')
      .on('presence', { event: 'sync' }, () => {
        setIsLive(true);
        setLastSync('just now');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      clearInterval(checkConn);
    };
  }, []);

  // Update sync timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSync(prev => {
        if (prev === 'just now') return '1 min ago';
        if (prev === '1 min ago') return '2 mins ago';
        const mins = parseInt(prev) || 2;
        return `${mins + 1} mins ago`;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentPath = location.pathname;

  return (
    <div className="dashboard-layout">
      {/* Mobile Block */}
      <div className="mobile-warning">
        <LayoutDashboard size={48} color="var(--brand-teal)" />
        <h2>Desktop Optimised</h2>
        <p>This dashboard is optimised for desktop viewing.<br />Please open on a larger screen (1024px+).</p>
      </div>

      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src="/relaypay-logo.png" alt="RelayPay" style={{ height: '92px', width: '90px', marginRight: '8px' }} />
          <span className="dashboard-pill" style={{ marginLeft: 0 }}>Support Dashboard</span>
        </div>
        <div className="dashboard-header-right">
          {unreadEscalations > 0 && (
            <span className="badge">{unreadEscalations} new</span>
          )}
          <div className="status-indicator">
            <div className={`status-dot ${isLive ? 'live' : 'offline'}`} />
            {isLive ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '5px 12px',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--surface-raised)'}
            onMouseOut={(e) => e.target.style.background = 'none'}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div
              className={`nav-item ${currentPath === '/dashboard' || currentPath === '/dashboard/escalations' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/escalations')}
            >
              <LayoutDashboard size={18} />
              <span>Escalations</span>
            </div>
            <div
              className={`nav-item ${currentPath.includes('/session-logs') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/session-logs')}
            >
              <MessageSquare size={18} />
              <span>Session Logs</span>
            </div>
            <div
              className={`nav-item ${currentPath.includes('/analytics') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard/analytics')}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </div>
          </nav>
          <div className="sidebar-footer">
            Last updated: {lastSync}
          </div>
        </aside>

        <main className="dashboard-content">
          <Routes>
            <Route path="/" element={<Escalations />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/session-logs" element={<SessionLogs />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
