export default function EscalationForm({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit(Object.fromEntries(formData.entries()));
  };

  return (
    <div className="escalation-container">
      <div>
        <h3 className="escalation-title">Requires Human Support</h3>
        <p className="escalation-desc">This query requires specific account verification. Please provide details for a secure callback.</p>
      </div>
      <form className="escalation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Work Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="time">Preferred Callback Time</label>
          <input type="text" id="time" name="time" placeholder="e.g. Tomorrow morning GMT" required />
        </div>
        <button type="submit" className="submit-btn">Request Secure Callback</button>
      </form>
    </div>
  );
}
