import React, { useState } from 'react';
import { submitAccountDeletionRequest } from '../lib/deletionService';

interface DeleteAccountPageProps {
  onNavigate: (path: string) => void;
}

export const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'consumer' | 'rider' | 'merchant'>('consumer');
  const [reason, setReason] = useState('No longer using the service');
  const [customReason, setCustomReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid account email address.');
      return;
    }

    if (!acknowledged) {
      setErrorMessage('Please confirm your understanding by checking the acknowledgment box.');
      return;
    }

    setLoading(true);
    try {
      const response = await submitAccountDeletionRequest({
        email: cleanEmail,
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        accountType,
        reason: reason === 'Other' ? customReason.trim() || 'Other' : reason,
      });

      if (response.success) {
        setSubmittedReference(response.referenceId);
      } else {
        setErrorMessage(response.error || 'Failed to submit request. Please try again or contact support.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dg-legal-page">
      {/* Top Hero Banner */}
      <section className="dg-legal-hero">
        <div className="dg-legal-hero-inner">
          <div className="dg-legal-hero-badge" style={{ marginBottom: 12 }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              DATA SAFETY &amp; PRIVACY COMPLIANCE
            </span>
          </div>
          <h1 className="dg-legal-main-title">Account &amp; Data Deletion Request</h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '1rem',
            marginTop: 8,
            maxWidth: 720,
            lineHeight: 1.5,
          }}>
            In compliance with Google Play Store policies, Apple App Store Review Guideline 5.1.1(v),
            and the Nigeria Data Protection Act (NDPA 2023), you may request permanent deletion of your
            Deliva user account and personal information at any time.
          </p>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="dg-legal-nav-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: '0.86rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              &larr; Back to Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/privacy-policy')}
              className="dg-legal-nav-btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: '0.86rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/terms')}
              className="dg-legal-nav-btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: 24,
                padding: '8px 18px',
                fontSize: '0.86rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Terms &amp; Conditions
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="dg-legal-container">
        <div className="dg-legal-layout" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
          {/* Left Column: Official Disclosure & Information */}
          <article className="dg-legal-article">
            <div className="dg-legal-intro-card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dg-primary)', marginBottom: 8 }}>
                How Account Deletion Works
              </h2>
              <p className="dg-legal-section-body">
                We believe in total data sovereignty. When you submit an account deletion request,
                our systems initiate an automated erasure workflow across all live customer-facing
                services, dispatch engines, and notification queues.
              </p>
            </div>

            {/* Section 1: Data That Will Be Deleted */}
            <section className="dg-legal-section" style={{ marginTop: 24 }}>
              <h3 className="dg-legal-section-heading">1. Personal Data That Will Be Permanently Deleted</h3>
              <div className="dg-legal-section-body">
                <p>Upon verification of your request, the following information is permanently erased:</p>
                <ul className="dg-legal-list">
                  <li>
                    <strong>Profile Identification:</strong> Your full name, profile photo, verified email address, and registered telephone number.
                  </li>
                  <li>
                    <strong>Authentication &amp; Credentials:</strong> Password hashes, OAuth tokens (Google Sign-In), biometric links, and active session tokens.
                  </li>
                  <li>
                    <strong>Saved Locations:</strong> Frequently used pickup/drop-off addresses, favorite landmarks, and custom geolocations.
                  </li>
                  <li>
                    <strong>Device &amp; Push Identifiers:</strong> Firebase Cloud Messaging (FCM) tokens, Apple Push Notification service (APNs) device tokens, and advertising identifiers.
                  </li>
                  <li>
                    <strong>Payment References:</strong> Saved card tokens, virtual wallet references, and bank account metadata.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2: Data Retained for Legal Compliance */}
            <section className="dg-legal-section">
              <h3 className="dg-legal-section-heading">2. Data Retained for Legal &amp; Regulatory Compliance</h3>
              <div className="dg-legal-section-body">
                <p>
                  In accordance with the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and applicable
                  financial and anti-fraud regulations, certain limited records cannot be immediately destroyed:
                </p>
                <ul className="dg-legal-list">
                  <li>
                    <strong>Completed Transaction Receipts:</strong> Financial payment logs and delivery fulfillment invoices must be retained for the statutory period required by tax authorities (FIRS) and anti-money laundering regulations.
                  </li>
                  <li>
                    <strong>Security &amp; Fraud Prevention:</strong> Anonymized dispute logs and safety incident records may be retained strictly to resolve ongoing disputes, detect fraud, or comply with lawful law enforcement subpoenas.
                  </li>
                </ul>
                <p style={{ fontSize: '0.85rem', color: 'var(--dg-text-secondary)', marginTop: 8 }}>
                  <em>Note: All retained historical records are permanently dissociated from your personal identity and stored in an encrypted, pseudo-anonymized state. They are never used for marketing or operational purposes.</em>
                </p>
              </div>
            </section>

            {/* Section 3: Processing Timeframe */}
            <section className="dg-legal-section">
              <h3 className="dg-legal-section-heading">3. Processing Timeframe</h3>
              <div className="dg-legal-section-body">
                <p>
                  <strong>Immediate Effect:</strong> Your account is locked immediately upon verification to prevent further access or charges.
                </p>
                <p>
                  <strong>Purge Window:</strong> Active operational databases are expunged within <strong>14 business days</strong>.
                  Encrypted rotational system backups are overwritten in line with our standard 30-day data retention cycle.
                </p>
              </div>
            </section>

            {/* Direct Support Contact */}
            <div className="dg-legal-contact-card" style={{ marginTop: 24 }}>
              <h4 style={{ fontWeight: 700, color: 'var(--dg-primary)', marginBottom: 6 }}>
                Need Help or Direct Inquiries?
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--dg-text-secondary)', lineHeight: 1.5 }}>
                You can also request data deletion or inquire about your personal data by emailing our Data Protection Officer directly at{' '}
                <a href="mailto:privacy@delivaglobe.com" style={{ color: 'var(--dg-primary)', fontWeight: 600 }}>
                  privacy@delivaglobe.com
                </a>{' '}
                or contacting customer support at{' '}
                <a href="mailto:support@delivaglobe.com" style={{ color: 'var(--dg-primary)', fontWeight: 600 }}>
                  support@delivaglobe.com
                </a>.
              </p>
            </div>
          </article>

          {/* Right Column: Deletion Request Form */}
          <aside>
            <div className="dg-legal-toc-card" style={{ padding: '28px 24px' }}>
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dg-primary)', marginBottom: 4 }}>
                  Submit Deletion Request
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--dg-text-secondary)', lineHeight: 1.5 }}>
                  Enter your Deliva account details. We will process your deletion request in accordance with our data safety policy.
                </p>
              </div>

              {submittedReference ? (
                <div style={{
                  padding: '24px 16px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 14,
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: '#22C55E',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    margin: '0 auto 12px',
                  }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D', marginBottom: 6 }}>
                    Request Submitted Successfully
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5, marginBottom: 12 }}>
                    Your request has been logged. A confirmation email has been dispatched to <strong>{email}</strong>.
                  </p>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px dashed #86EFAC',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#14532D',
                    fontFamily: 'monospace',
                    marginBottom: 16,
                  }}>
                    Reference: <strong>{submittedReference}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReference(null);
                      setEmail('');
                      setFullName('');
                      setPhone('');
                      setAcknowledged(false);
                      onNavigate('/');
                    }}
                    className="dg-btn-primary"
                    style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}
                  >
                    Return to Home
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {errorMessage && (
                    <div style={{
                      padding: '10px 14px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: 10,
                      color: '#B91C1C',
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Registered Email */}
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="del-email">
                      Account Email Address <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      id="del-email"
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      className="dg-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Full Name */}
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="del-name">
                      Full Name on Account
                    </label>
                    <input
                      id="del-name"
                      type="text"
                      placeholder="e.g. Samuel Adebayo"
                      className="dg-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="del-phone">
                      Registered Phone Number
                    </label>
                    <input
                      id="del-phone"
                      type="tel"
                      placeholder="e.g. 0801 234 5678"
                      className="dg-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Account Type */}
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="del-type">
                      Account Type
                    </label>
                    <select
                      id="del-type"
                      className="dg-input"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                    >
                      <option value="consumer">Consumer (Sender / Receiver)</option>
                      <option value="rider">Delivery Rider / Courier Partner</option>
                      <option value="merchant">Merchant / Business Store</option>
                    </select>
                  </div>

                  {/* Reason for Deletion */}
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="del-reason">
                      Primary Reason for Leaving
                    </label>
                    <select
                      id="del-reason"
                      className="dg-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="No longer using the service">No longer using the service</option>
                      <option value="Privacy or data concerns">Privacy or data concerns</option>
                      <option value="Switching to an alternative service">Switching to an alternative service</option>
                      <option value="Created duplicate account">Created duplicate account</option>
                      <option value="Experiencing technical difficulties">Experiencing technical difficulties</option>
                      <option value="Other">Other reason</option>
                    </select>
                  </div>

                  {reason === 'Other' && (
                    <div className="dg-field">
                      <label className="dg-label" htmlFor="del-other-reason">
                        Please specify reason
                      </label>
                      <input
                        id="del-other-reason"
                        type="text"
                        placeholder="Tell us what we can improve..."
                        className="dg-input"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Acknowledgment Checkbox */}
                  <div style={{ marginTop: 6 }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'var(--dg-text-secondary)',
                      lineHeight: 1.45,
                    }}>
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        style={{ marginTop: 2, accentColor: 'var(--dg-primary)' }}
                      />
                      <span>
                        I understand that requesting account deletion is <strong>permanent and irreversible</strong>.
                        Once processed, all my personal details, saved addresses, and active authorizations will be destroyed.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !acknowledged}
                    className="dg-btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      background: acknowledged ? '#DC2626' : 'var(--dg-border)',
                      borderColor: acknowledged ? '#DC2626' : 'var(--dg-border)',
                      color: '#FFFFFF',
                      cursor: acknowledged && !loading ? 'pointer' : 'not-allowed',
                      marginTop: 6,
                    }}
                  >
                    {loading ? 'Submitting Request...' : 'Submit Deletion Request'}
                  </button>

                  <p style={{
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    color: 'var(--dg-text-muted)',
                    marginTop: 4,
                  }}>
                    Guaranteed secure &amp; processed in compliance with NDPA 2023.
                  </p>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
