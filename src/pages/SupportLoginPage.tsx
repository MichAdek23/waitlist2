import React, { useState } from 'react';
import { supportLogin, supportQuickRegister } from '../lib/supportService';

interface SupportLoginPageProps {
  onNavigate: (path: string) => void;
}

export const SupportLoginPage: React.FC<SupportLoginPageProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getRedirectTarget = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || '/help';
    } catch {
      return '/help';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await supportLogin(email, password);
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          setErrorMsg('Please enter your first and last name.');
          setLoading(false);
          return;
        }
        await supportQuickRegister({
          firstName,
          lastName,
          email,
          phone,
          password,
        });
      }
      onNavigate(getRedirectTarget());
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to authenticate. Please try again.');
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

        <form className="dg-form-box" onSubmit={handleSubmit} noValidate>
          <div>
            <h1 className="dg-form-title">
              {mode === 'login' ? 'Sign in to support' : 'Create support account'}
            </h1>
            <p className="dg-hero-subheading" style={{ fontSize: '0.92rem', marginTop: 6 }}>
              {mode === 'login'
                ? 'Sign in with your Deliva account to view tickets and chat with support.'
                : 'Create an account to track your support tickets and live replies.'}
            </p>
          </div>

          <div className="ds-tabs" style={{ marginBottom: 4 }}>
            <button
              type="button"
              className={`ds-tab ${mode === 'login' ? 'ds-tab-active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`ds-tab ${mode === 'register' ? 'ds-tab-active' : ''}`}
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
            >
              Create account
            </button>
          </div>

          {errorMsg && (
            <p className="dg-error" role="alert">
              {errorMsg}
            </p>
          )}

          {mode === 'register' && (
            <div className="dg-name-grid">
              <div className="dg-field">
                <label className="dg-label" htmlFor="sup-first">
                  First name <span className="dg-req">*</span>
                </label>
                <input
                  id="sup-first"
                  type="text"
                  className="dg-input"
                  placeholder="e.g. Chukwuma"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="dg-field">
                <label className="dg-label" htmlFor="sup-last">
                  Last name <span className="dg-req">*</span>
                </label>
                <input
                  id="sup-last"
                  type="text"
                  className="dg-input"
                  placeholder="e.g. Adeyemi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="dg-field">
            <label className="dg-label" htmlFor="sup-email">
              Email address <span className="dg-req">*</span>
            </label>
            <input
              id="sup-email"
              type="email"
              className="dg-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="dg-field">
              <label className="dg-label" htmlFor="sup-phone">
                Phone number
              </label>
              <input
                id="sup-phone"
                type="tel"
                className="dg-input"
                placeholder="e.g. 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <div className="dg-field">
            <label className="dg-label" htmlFor="sup-pass">
              Password <span className="dg-req">*</span>
            </label>
            <input
              id="sup-pass"
              type="password"
              className="dg-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="dg-submit-btn" disabled={loading}>
            {loading
              ? 'Signing in…'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>

          <p className="dg-form-legal-note">
            Support team member?{' '}
            <button
              type="button"
              className="dg-inline-link"
              onClick={() => onNavigate('/agent-login')}
            >
              Agent sign in
            </button>
          </p>
        </form>
      </div>
    </main>
  );
};
