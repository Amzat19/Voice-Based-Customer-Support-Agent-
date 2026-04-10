import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import StatCard from '../components/StatCard';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data State
  const [escalationData, setEscalationData] = useState([]);
  const [sessionData, setSessionData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch escalations for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [resEsc, resSes] = await Promise.all([
        supabase.from('Escalations').select('*').gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('session_logs').select('*').gte('created_at', sevenDaysAgo.toISOString())
      ]);

      if (resEsc.error) throw resEsc.error;
      if (resSes.error) throw resSes.error;

      setEscalationData(resEsc.data || []);
      setSessionData(resSes.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="stat-cards-row">
          {[1, 2, 3, 4].map(i => <div key={i} className="stat-card skeleton-bar" style={{ height: 80 }}></div>)}
        </div>
      </div>
    );
  }

  // Pre-calculations
  const totalCallsThisWeek = sessionData.length > 0 ? (new Set(sessionData.map(s => s.call_id))).size : 0;
  const escalationRate = totalCallsThisWeek > 0 ? ((escalationData.length / totalCallsThisWeek) * 100).toFixed(1) : 0;
  const avgCallsPerDay = (totalCallsThisWeek / 7).toFixed(1);

  // Category breakdown
  const categoryCounts = escalationData.reduce((acc, curr) => {
    const cat = curr.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  let mostCommonCategory = 'N/A';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) { maxCount = count; mostCommonCategory = cat; }
  }

  // Bar chart categories
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);
  const categories = ['account', 'compliance', 'dispute', 'payment', 'general'].map(c => ({
    name: c,
    count: categoryCounts[c] || 0,
    percent: maxCategoryCount > 0 ? ((categoryCounts[c] || 0) / maxCategoryCount) * 100 : 0,
    color: `var(--${c === 'account' ? 'danger' : c === 'compliance' ? 'info' : c === 'dispute' ? 'warning' : c === 'payment' ? 'brand-teal' : 'text-secondary'})`
  }));

  // Daily escalations logic
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const dailyCounts = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayName = i === 6 ? 'Today' : daysOfWeek[d.getDay()];
    // count escalations for this day
    const count = escalationData.filter(e => new Date(e.created_at).toDateString() === d.toDateString()).length;
    return { dayName, count, isToday: i === 6 };
  });
  const maxDailyCount = Math.max(...dailyCounts.map(d => d.count), 1);

  // Context hit rate
  const callsWithContext = sessionData.filter(s => s.pinecone_found_context).length;
  const callsWithoutContext = sessionData.filter(s => s.pinecone_found_context === false).length;
  const totalContextChecks = callsWithContext + callsWithoutContext;
  const hitRate = totalContextChecks > 0 ? Math.round((callsWithContext / totalContextChecks) * 100) : 0;
  const missRate = totalContextChecks > 0 ? Math.round((callsWithoutContext / totalContextChecks) * 100) : 0;

  if (escalationData.length === 0 && sessionData.length === 0) {
    return (
      <div className="empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3>Not enough data yet</h3>
        <p>Analytics will appear after your first few calls.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="stat-cards-row">
        <StatCard label="Total calls (7d)" value={totalCallsThisWeek} />
        <StatCard label="Escalation rate" value={`${escalationRate}%`} />
        <StatCard label="Avg calls / day" value={avgCallsPerDay} />
        <div className="stat-card">
          <div className="stat-label">Most common category</div>
          <div className="stat-number" style={{ fontSize: 20, marginTop: 8, textTransform: 'capitalize' }}>{mostCommonCategory}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="stat-card">
          <h3 style={{ fontSize: 14, margin: '0 0 16px 0' }}>Escalations by Category</h3>
          <div>
            {categories.map(c => (
              <div key={c.name} className="css-chart-bar-container">
                <div className="css-chart-label">{c.name}</div>
                <div className="css-chart-track">
                  <div className="css-chart-fill" style={{ width: `${c.percent}%`, background: c.color }}></div>
                </div>
                <div className="css-chart-value">{c.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 style={{ fontSize: 14, margin: '0 0 16px 0' }}>Daily Escalations (7d)</h3>
          <div className="vertical-chart">
            {dailyCounts.map((d, i) => (
              <div key={i} className="vertical-bar-group">
                <div className="vertical-value" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.count}</div>
                <div className={`vertical-bar ${d.isToday ? 'today' : ''}`} style={{ height: `${Math.max((d.count / maxDailyCount) * 100, 2)}%` }}></div>
                <div className="vertical-label">{d.dayName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 style={{ fontSize: 14, margin: '0 0 16px 0' }}>Context Hit Rate</h3>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'var(--surface-raised)', padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calls with RAG context found</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--success)', marginTop: 4 }}>{hitRate}% <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({callsWithContext})</span></div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface-raised)', padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calls without context</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{missRate}% <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({callsWithoutContext})</span></div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Context hit rate indicates how often the knowledge base retrieved relevant information for customer queries.
        </p>
      </div>
    </div>
  );
}
