import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: 'var(--bg)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        height: '64px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/relaypay-logo.png" alt="RelayPay Logo" style={{ height: '92px' }} />
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent',
            border: '1px solid var(--brand-navy)',
            color: 'var(--brand-navy)',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Agent login
        </button>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'var(--surface)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--brand-teal)',
          fontWeight: '500',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          AI-Powered Support
        </div>
        <h1 style={{
          fontSize: '40px',
          fontWeight: '600',
          color: 'var(--brand-navy)',
          letterSpacing: '-0.5px',
          maxWidth: '560px',
          margin: '0 0 16px 0',
          lineHeight: '1.1'
        }}>
          Customer support that never sleeps
        </h1>
        <p style={{
          fontSize: '17px',
          fontWeight: '400',
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          margin: 0,
          lineHeight: '1.6'
        }}>
          Ask questions about payments, invoicing, compliance, and more — in your voice, in real time.
        </p>
        <button
          onClick={() => navigate('/voice')}
          style={{
            background: 'var(--brand-teal)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '32px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Start a conversation
        </button>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '12px'
        }}>
          No account needed. Speak naturally.
        </div>
      </section>

      {/* Features Row */}
      <section style={{
        flex: 1,
        padding: '80px 24px',
        background: 'var(--bg)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {[{
            title: 'Instant answers',
            body: 'Get accurate responses about fees, timelines, and policies — grounded in RelayPay\'s knowledge base.'
          }, {
            title: 'Smart escalation',
            body: 'When your issue needs a human, the agent collects your details and notifies our support team immediately.'
          }, {
            title: 'Always available',
            body: 'Available 24/7 for common support questions. No hold music, no wait times.'
          }].map((feature, i) => (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '0 0 8px 0'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '13px',
                fontWeight: '400',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                margin: 0
              }}>
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface)',
        fontSize: '12px'
      }}>
        <div style={{ color: 'var(--text-muted)' }}>
          © 2026 RelayPay. Internal use only.
        </div>
        <a
          href="/login"
          onClick={(e) => { e.preventDefault(); navigate('/login'); }}
          style={{
            color: 'var(--brand-teal)',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Support agent? Sign in →
        </a>
      </footer>
    </div>
  );
}
