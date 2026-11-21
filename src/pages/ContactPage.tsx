import React, { useState } from 'react';
import {
  getSupportSession,
  submitGuestSupportTicket,
} from '../lib/supportService';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

const DEPARTMENTS = [
  {
    id: 'general',
    label: 'General Inquiries',
    email: 'support@delivaglobe.com',
    phone: '+234 704 delivaglobe',
    hours: '24/7 Operations Support',
  },
  {
    id: 'enterprise',
    label: 'Corporate Partnerships',
    email: 'partners@delivaglobe.com',
    phone: '+234 704 delivaglobe',
    hours: 'Mon - Fri, 8:00 AM - 6:00 PM',
  },
  {
    id: 'fleet',
    label: 'Driver & Rider Hub',
    email: 'riders@delivaglobe.com',
    phone: '+234 704 delivaglobe',
    hours: 'Mon - Sat, 7:00 AM - 8:00 PM',
  },
  {
    id: 'billing',
    label: 'Billing & Refunds',
    email: 'finance@delivaglobe.com',
    phone: '+234 704 delivaglobe',
    hours: '24/7 Live Desk',
  },
];

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const session = getSupportSession();
  const [selectedDeptId, setSelectedDeptId] = useState(DEPARTMENTS[0].id);
  const selectedDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];

  const [guestName, setGuestName] = useState(
    session?.user ? `${session.user.first_name} ${session.user.last_name}`.trim() : ''
  );
  const [guestEmail, setGuestEmail] = useState(session?.user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please enter both a subject and message.');
      return;
    }
    if (!session?.user && (!guestName.trim() || !guestEmail.trim())) {
      setErrorMsg('Please enter your name and email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedSubject = `[${selectedDept.label}] ${subject.trim()}`;
      const res = await submitGuestSupportTicket({
        name: guestName.trim(),
        email: guestEmail.trim(),
        subject: formattedSubject,
        message: message.trim(),
        priority: selectedDept.id === 'billing' ? 'high' : 'medium',
        category: selectedDept.id,
        department: selectedDept.label,
      });

      const ticketId = res?.ticket?.id || Math.random().toString(36).substring(2, 10);
      setSubmittedRef(ticketId.slice(0, 8).toUpperCase());
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to submit message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="dg-hero-section">
      <div className="dg-hero-container">
        <div className="dg-hero-grid" style={{ alignItems: 'start' }}>
          {/* Left Column: Simple Contact Info */}
          <div className="dg-hero-text">
            <p className="ds-eyebrow">Contact</p>
            <h1 className="dg-hero-heading">Contact our operations team</h1>
            <p className="dg-hero-subheading">
              Reach the right desk for deliveries, fleet partnerships, rider onboarding, or
              billing inquiries.
            </p>

            <div className="ds-contact-meta">
              <div className="ds-contact-row">
                <span className="ds-contact-label">Email</span>
                <a href={`mailto:${selectedDept.email}`} className="ds-contact-value">
                  {selectedDept.email}
                </a>
              </div>
              <div className="ds-contact-row">
                <span className="ds-contact-label">Phone</span>
                <span className="ds-contact-value">{selectedDept.phone}</span>
              </div>
              <div className="ds-contact-row">
                <span className="ds-contact-label">Availability</span>
                <span className="ds-contact-value">{selectedDept.hours}</span>
              </div>
              <div className="ds-contact-row">
                <span className="ds-contact-label">Office</span>
                <span className="ds-contact-value">
                  Plot 22, Admiralty Way, Lekki Phase 1, Lagos
                </span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="dg-link-btn"
                onClick={() => onNavigate('/help')}
              >
                Looking for quick answers? Visit Help &amp; FAQ &rarr;
              </button>
            </div>
          </div>

          {/* Right Column: Simple Waitlist-style Form */}
          <div>
            {submittedRef ? (
              <div className="ds-alert-success">
                <p style={{ fontWeight: 700, marginBottom: 6 }}>
                  Message received — #TKT-{submittedRef}
                </p>
                <p style={{ marginBottom: 16 }}>
                  Our {selectedDept.label} desk has logged your inquiry and will reply shortly.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="dg-inline-link"
                    onClick={() => setSubmittedRef(null)}
                  >
                    Send another message
                  </button>
                  <button
                    type="button"
                    className="dg-inline-link"
                    onClick={() => onNavigate('/help?chat=open')}
                  >
                    Open live support chat
                  </button>
                </div>
              </div>
            ) : (
              <form className="dg-form-box" onSubmit={handleSubmit} noValidate>
                <h2 className="dg-form-title">Send us a message</h2>

                {errorMsg && (
                  <p className="dg-error" role="alert">
                    {errorMsg}
                  </p>
                )}

                <div className="dg-field">
                  <label className="dg-label" htmlFor="contact-dept">
                    Department
                  </label>
                  <div className="dg-select-wrap">
                    <select
                      id="contact-dept"
                      className="dg-select"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="dg-name-grid">
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="contact-name">
                      Your name <span className="dg-req">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="dg-input"
                      placeholder="e.g. Adaeze Okafor"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="contact-email">
                      Email address <span className="dg-req">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="dg-input"
                      placeholder="name@company.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="dg-field">
                  <label className="dg-label" htmlFor="contact-subject">
                    Subject <span className="dg-req">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    className="dg-input"
                    placeholder="How can we help?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="dg-field">
                  <label className="dg-label" htmlFor="contact-message">
                    Message <span className="dg-req">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    className="dg-input"
                    placeholder="Share tracking numbers, account email, or inquiry details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>

                <button type="submit" className="dg-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </button>

                {!session?.user && (
                  <p className="dg-form-legal-note">
                    Have a Deliva account?{' '}
                    <button
                      type="button"
                      className="dg-inline-link"
                      onClick={() => onNavigate('/support-login?redirect=/contact')}
                    >
                      Sign in
                    </button>{' '}
                    to track replies in live chat.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
