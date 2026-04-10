import React from 'react';

export default function StatCard({ label, value, type }) {
  // type is used for color: 'open', 'in-progress', 'closed' or default empty
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-number ${type || ''}`}>{value}</div>
    </div>
  );
}
