import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../supabase';
import StatCard from '../components/StatCard';
import DetailPanel from '../components/DetailPanel';

export default function Escalations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [newRowIds, setNewRowIds] = useState(new Set());

  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: records, error: fetchErr } = await supabase
        .from('Escalations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchErr) throw fetchErr;
      setData(records || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('escalations_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Escalations' }, payload => {
        setData(prev => [payload.new, ...prev]);
        setNewRowIds(prev => new Set(prev).add(payload.new.id));
        setTimeout(() => {
          setNewRowIds(prev => {
            const next = new Set(prev);
            next.delete(payload.new.id);
            return next;
          });
        }, 2000); // Remove animation class after 2s
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Escalations' }, payload => {
        setData(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
        // Update selected row if it's the one that changed
        setSelectedRow(prev => prev?.id === payload.new.id ? payload.new : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Stats
  const totalEscalations = data.length;
  const openEscalations = data.filter(d => d.status === 'open').length;
  const inProgressEscalations = data.filter(d => d.status === 'in_progress').length;

  const today = new Date().toDateString();
  const closedToday = data.filter(d => d.status === 'closed' && new Date(d.resolved_at || d.created_at).toDateString() === today).length;

  // Filtering
  const filteredData = data.filter(item => {
    // Tab filter
    if (activeTab === 'Open' && item.status !== 'open') return false;
    if (activeTab === 'In Progress' && item.status !== 'in_progress') return false;
    if (activeTab === 'Closed' && item.status !== 'closed') return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchReason = item.escalation_reason?.toLowerCase().includes(q);
      const matchId = item.call_id?.toLowerCase().includes(q);
      if (!matchReason && !matchId) return false;
    }

    // Category filter
    if (categoryFilter !== 'All' && item.category !== categoryFilter.toLowerCase()) return false;

    return true;
  });

  const handleUpdateStatus = async (id, newStatus) => {
    const changes = { status: newStatus };
    if (newStatus === 'closed') changes.resolved_at = new Date().toISOString();

    // Optimistic update
    setData(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item));
    if (selectedRow?.id === id) {
      setSelectedRow(prev => ({ ...prev, ...changes }));
    }

    await supabase.from('Escalations').update(changes).eq('id', id);
  };

  const formatShortTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {error && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error} <button onClick={fetchData} className="btn btn-secondary" style={{ marginLeft: 12, padding: '4px 8px' }}>Retry</button>
        </div>
      )}

      <div className="stat-cards-row">
        <StatCard label="Total escalations" value={totalEscalations} />
        <StatCard label="Open" value={openEscalations} type="open" />
        <StatCard label="In progress" value={inProgressEscalations} type="in-progress" />
        <StatCard label="Closed today" value={closedToday} type="closed" />
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {['All', 'Open', 'In Progress', 'Closed'].map(tab => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="dropdown-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            <option value="Account">Account</option>
            <option value="Compliance">Compliance</option>
            <option value="Dispute">Dispute</option>
            <option value="Payment">Payment</option>
            <option value="General">General</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by reason or call ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Customer</th>
              <th scope="col">Category</th>
              <th scope="col">Reason</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row" style={{ display: 'table-row' }}>
                  <td colSpan="6" style={{ padding: '0' }}>
                    <div style={{ display: 'flex', gap: 16, padding: '16px' }}>
                      <div className="skeleton-bar" style={{ width: i % 2 === 0 ? '60%' : '80%' }}></div>
                      <div className="skeleton-bar" style={{ width: '45%' }}></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3>No escalations found</h3>
                    <p>Escalations from the voice agent will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr
                  key={item.id}
                  className={`${selectedRow?.id === item.id ? 'selected' : ''} ${newRowIds.has(item.id) ? 'new-row' : ''}`}
                  onClick={() => setSelectedRow(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ whiteSpace: 'nowrap' }}>{formatShortTime(item.created_at)}</td>
                  <td className="customer-cell">
                    <div className="name">{item.user_name || 'Anonymous'}</div>
                    {item.user_email && <div className="email">{item.user_email}</div>}
                  </td>
                  <td>
                    <span className={`category-pill ${item.category || 'general'}`}>
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <div className="truncate-reason" title={item.escalation_reason || ''}>
                      {item.escalation_reason || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${item.status || 'open'}`}>
                      {(item.status || 'open').replace('_', ' ')}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary" onClick={() => setSelectedRow(item)}>View</button>
                      {item.status === 'open' && (
                        <button className="btn btn-info" onClick={() => handleUpdateStatus(item.id, 'in_progress')}>Start</button>
                      )}
                      {item.status === 'in_progress' && (
                        <button className="btn btn-success" onClick={() => handleUpdateStatus(item.id, 'closed')}>Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DetailPanel
        escalation={selectedRow}
        onClose={() => setSelectedRow(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
