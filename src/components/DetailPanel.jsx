import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';

export default function DetailPanel({ escalation, onClose, onUpdateStatus }) {
  const [notes, setNotes] = useState(escalation?.agent_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // If no escalation selected, visually hidden via CSS or render null
  if (!escalation) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Check if real supabase query should be made, safe fallback:
    if (escalation.id && !escalation.id.startsWith('mock')) {
      const { error } = await supabase
        .from('Escalations')
        .update({ agent_notes: notes })
        .eq('id', escalation.id);

      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } else {
      // Mock mode
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    onUpdateStatus(escalation.id, newStatus);
  };

  const formatTime = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={`detail-panel ${escalation ? 'open' : ''}`}>
      <div className="detail-header">
        <h2>Escalation detail</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close detail panel">
          <X size={20} />
        </button>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Customer Info</h3>
          <div className="data-grid">
            <div className="data-row">
              <span className="data-label">Name</span>
              <span className="data-value">{escalation.user_name || 'Anonymous'}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Email</span>
              <span className="data-value">{escalation.user_email || '—'}</span>
            </div>
            {escalation.call_booked && (
              <div className="data-row">
                <span className="data-label">Callback Time</span>
                <span className="data-value">{escalation.appointment_time || '—'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>Call Details</h3>
          <div className="data-grid">
            <div className="data-row">
              <span className="data-label">Call ID</span>
              <span className="data-value" style={{ fontFamily: 'monospace' }}>{escalation.call_id?.substring(0, 8) || '—'}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Created At</span>
              <span className="data-value">{formatTime(escalation.created_at)}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Category</span>
              <span className={`category-pill ${escalation.category || 'general'}`}>
                {escalation.category || 'General'}
              </span>
            </div>
            <div className="data-row" style={{ alignItems: 'center' }}>
              <span className="data-label">Status</span>
              <select
                className="dropdown-select"
                value={escalation.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ padding: '4px 8px' }}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Reason for Escalation</h3>
          <div className="text-box">
            {escalation.escalation_reason || 'No reason provided.'}
          </div>
        </div>

        {escalation.call_summary && (
          <div className="detail-section">
            <h3>AI Call Summary</h3>
            <div className="text-box">
              {escalation.call_summary}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3>Agent Notes</h3>
          <textarea
            className="notes-textarea"
            placeholder="Add internal notes about this escalation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleSaveNotes}
            disabled={isSaving}
            style={{ marginTop: 8 }}
          >
            {isSaving ? 'Saving...' : 'Save notes'}
          </button>
          {saveSuccess && <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--success)' }}>Saved.</span>}
        </div>

        <div className="detail-actions">
          {escalation.status === 'open' && (
            <button
              className="btn btn-info"
              onClick={() => handleStatusChange('in_progress')}
            >
              Mark in progress
            </button>
          )}
          {escalation.status !== 'closed' && (
            <button
              className="btn btn-success"
              onClick={() => handleStatusChange('closed')}
            >
              Mark resolved
            </button>
          )}
        </div>

        <a
          href={`/dashboard/session-logs?call_id=${escalation.call_id}`}
          className="link-text"
          onClick={(e) => {
            // Because we are using React Router, we should ideally use navigate, but
            // for simplicity an href will cause a reload and navigate to the right place.
            // In a strict SPA context we'd pass navigate here.
          }}
        >
          View session log for this call
        </a>
      </div>
    </div>
  );
}
