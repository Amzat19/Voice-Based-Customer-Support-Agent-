import { useEffect, useRef, useState } from 'react';

export default function VoiceCard({ 
  callState, 
  transcript, 
  error, 
  onStart, 
  onEnd,
  showEscalation,
  onEscalationSubmit 
}) {
  const scrollRef = useRef(null);
  const [escalationSubmitted, setEscalationSubmitted] = useState(false);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Reset escalation success state when it hides
  useEffect(() => {
    if (!showEscalation) {
      setEscalationSubmitted(false);
    }
  }, [showEscalation]);

  const handleEscalation = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onEscalationSubmit(Object.fromEntries(formData.entries()));
    setEscalationSubmitted(true);
  };

  const getStatusText = () => {
    switch(callState) {
      case 'idle': return 'Press to speak';
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening...';
      case 'speaking': return 'Assistant responding...';
      case 'error': return 'Something went wrong';
      default: return 'Press to speak';
    }
  };

  const getMicIcon = () => {
    if (callState === 'connecting' || callState === 'listening' || callState === 'speaking') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
          <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
        </svg>
      );
    }
    
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
      </svg>
    );
  };

  return (
    <div className="voice-card">
      <div className="vc-eyebrow">AI Support</div>
      <h1 className="vc-heading">How can we help you today?</h1>
      <p className="vc-subtitle">
        Press the button and speak. Our assistant handles general questions about payments, invoicing, fees, and onboarding. For account-specific issues, we will connect you with a specialist.
      </p>

      <div className="vc-status-container">
        <div className={`vc-status-text state-${callState}`} aria-live="polite">
          {getStatusText()}
        </div>
      </div>

      <button 
        className={`mic-button state-${callState}`}
        onClick={callState === 'idle' || callState === 'error' ? onStart : onEnd}
        aria-label={callState === 'idle' ? 'Start secure call' : 'End call'}
      >
        {getMicIcon()}
      </button>

      {/* TRANSCRIPT */}
      {(transcript.length > 0 || callState !== 'idle' || showEscalation) && (
        <div 
          id="transcript" 
          className="transcript-container" 
          ref={scrollRef} 
          role="log" 
          aria-label="Conversation transcript" 
          aria-live="polite"
        >
          {transcript.length === 0 ? (
            <div className="transcript-placeholder">Your conversation will appear here...</div>
          ) : (
            transcript.map((entry, i) => (
              <div key={i} className="msg">
                <div className={`msg-label ${entry.role}`}>
                  {entry.role === 'user' ? 'YOU' : 'ASSISTANT'}
                </div>
                <div className="msg-text">{entry.text}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ESCALATION FORM */}
      {showEscalation && (
        <div className="escalation-container">
          {!escalationSubmitted ? (
            <>
              <h3 className="escalation-title">Connect with a specialist</h3>
              <p className="escalation-desc">Please share a few details and we will have someone reach out.</p>
              <form className="escalation-form" onSubmit={handleEscalation}>
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input type="text" id="name" name="name" placeholder="Your name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input type="email" id="email" name="email" placeholder="you@company.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Preferred callback time</label>
                  <input type="text" id="time" name="time" placeholder="e.g. Wednesday 10am Lagos time" required />
                </div>
                <button type="submit" className="submit-btn" disabled={escalationSubmitted}>Request callback</button>
              </form>
            </>
          ) : (
            <div className="escalation-success">
              Thank you. A specialist will be in touch at the time you specified.
            </div>
          )}
        </div>
      )}

      {/* ERROR BANNER */}
      {error && callState === 'error' && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {/* END CALL BUTTON */}
      {callState !== 'idle' && (
        <button className="end-call-btn" onClick={onEnd}>
          End conversation
        </button>
      )}

      {/* CONNECTION INDICATOR */}
      {callState !== 'idle' && (
        <div className="vc-connection-indicator">
          <span className={`vc-dot ${callState === 'error' ? 'error' : callState === 'connecting' ? 'connecting' : 'connected'}`}></span>
          {callState === 'error' ? 'Disconnected' : callState === 'connecting' ? 'Reconnecting...' : 'Connected'}
        </div>
      )}
    </div>
  );
}
