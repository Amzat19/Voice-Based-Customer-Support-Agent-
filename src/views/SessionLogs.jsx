import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../supabase';

export default function SessionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filters
  const [searchCallId, setSearchCallId] = useState('');
  const [filterType, setFilterType] = useState('All'); // All | Escalated | Context | No Context
  const [dateRange, setDateRange] = useState('All time');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('session_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr) throw fetchErr;
      setLogs(data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLogs = logs.filter(log => {
    // Call ID Search
    if (searchCallId && !log.call_id?.toLowerCase().includes(searchCallId.toLowerCase())) return false;

    // Type Filter
    if (filterType === 'Escalated' && !log.was_escalated) return false;
    if (filterType === 'Context' && !log.pinecone_found_context) return false;
    if (filterType === 'No Context' && log.pinecone_found_context) return false;

    // Date Filter (simple check)
    if (dateRange === 'Today') {
      const today = new Date().toDateString();
      if (new Date(log.created_at).toDateString() !== today) return false;
    } else if (dateRange === 'Last 7 days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date(log.created_at) < sevenDaysAgo) return false;
    }

    return true;
  });

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {error && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error} <button onClick={fetchLogs} className="btn btn-secondary" style={{ marginLeft: 12, padding: '4px 8px' }}>Retry</button>
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-tabs">
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search Call ID..."
              value={searchCallId}
              onChange={e => setSearchCallId(e.target.value)}
              style={{ paddingLeft: 34, width: 200 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="dropdown-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">All logs</option>
            <option value="Escalated">Escalated only</option>
            <option value="Context">With context</option>
            <option value="No Context">Without context</option>
          </select>
          <select
            className="dropdown-select"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="All time">All time</option>
          </select>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 140 }}>Time</th>
              <th scope="col" style={{ width: 120 }}>Call ID</th>
              <th scope="col">Summary</th>
              <th scope="col" style={{ width: 90 }}>Escalated</th>
              <th scope="col" style={{ width: 120 }}>Context found</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row" style={{ display: 'table-row' }}>
                  <td colSpan="6" style={{ padding: '0' }}>
                    <div style={{ display: 'flex', gap: 16, padding: '16px' }}>
                      <div className="skeleton-bar" style={{ width: '10%' }}></div>
                      <div className="skeleton-bar" style={{ width: '35%' }}></div>
                      <div className="skeleton-bar" style={{ width: '35%' }}></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3>No session logs yet</h3>
                    <p>Conversation turns will be logged here automatically.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const isExpanded = expandedRows.has(log.id);
                return (
                  <tr
                    key={log.id}
                    onClick={() => toggleRow(log.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>{formatTime(log.created_at)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{log.call_id?.substring(0, 12)}</td>
                    <td>
                      <div className={isExpanded ? '' : 'truncate-reason'} style={isExpanded ? { whiteSpace: 'pre-wrap' } : undefined}>
                        {log.summary || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {log.was_escalated ? <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span> : <span style={{ color: 'var(--text-muted)' }}>X</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={`status-dot ${log.pinecone_found_context ? 'live' : 'offline'}`} style={{ display: 'inline-block' }} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Load more button placeholder for infinite scroll alternative */}
        {!loading && filteredLogs.length > 0 && (
          <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary">Load more logs</button>
          </div>
        )}
      </div>
    </div>
  );
}
