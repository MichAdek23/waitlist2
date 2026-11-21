import React, { useState, useEffect } from 'react';
import { agentLogin, getAgentSession } from '../lib/supportService';

interface AgentLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AgentLoginPage: React.FC<AgentLoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existing = getAgentSession();
    if (existing?.token && existing?.user?.is_support_agent) {
      onNavigate('/dashboard');
    }
  }, [onNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter your @delivaglobe.com email and mail password.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@delivaglobe.com`;
    }
    if (!cleanEmail.endsWith('@delivaglobe.com')) {
      setError('Only @delivaglobe.com mail accounts can sign in to the Agent Portal.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await agentLogin(cleanEmail, password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Incorrect mail address or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ds-page">
      <div className="ds-auth-container">
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="dg-link-btn"
            onClick={() => onNavigate('/help')}
          >
            &larr; Back to Help &amp; Support
          </button>
        </div>

        <form className="dg-form-box" onSubmit={handleLogin} noValidate>
          <div>
            <h1 className="dg-form-title">Agent sign in</h1>
            <p className="dg-hero-subheading" style={{ fontSize: '0.92rem', marginTop: 6 }}>
              Sign in with your @delivaglobe.com mail address and mail password.
            </p>
          </div>

          {error && (
            <p className="dg-error" role="alert">
              {error}
            </p>
          )}

          <div className="dg-field">
            <label className="dg-label" htmlFor="agent-email">
              Deliva Mail address <span className="dg-req">*</span>
            </label>
            <input
              id="agent-email"
              type="email"
              className="dg-input"
              placeholder="name@delivaglobe.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="dg-field">
            <label className="dg-label" htmlFor="agent-password">
              Mail password <span className="dg-req">*</span>
            </label>
            <input
              id="agent-password"
              type="password"
              className="dg-input"
              placeholder="Enter your mail password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="dg-submit-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
};
