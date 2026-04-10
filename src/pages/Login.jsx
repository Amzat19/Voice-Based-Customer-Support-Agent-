import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email for the magic link.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard',
      }
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <img src="/relaypay-logo.png" alt="RelayPay Logo" style={{ height: '92px' }} />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Support Dashboard
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {magicLinkSent ? (
          <div style={{
            background: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            Check your email — we sent a login link to <strong>{email}</strong>
          </div>
        ) : (
          <>
            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'var(--brand-navy)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'inherit'
                }}
              >
                Sign in
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ padding: '0 12px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button
              onClick={handleMagicLink}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'var(--surface)',
                color: 'var(--brand-navy)',
                border: '1px solid var(--brand-navy)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit'
              }}
            >
              Send magic link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
