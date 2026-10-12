import React, { useState } from 'react';

const FOOTER_LINKS = {
  Navigations: ['Our Features', 'Apply as Rider', 'Download App'],
  Product: ['About Product', 'Advert Placement', 'Work With Us'],
  Legal: ['Privacy Policy', 'Terms & Conditions', 'Request Account Deletion'],
  Contact: ['support@delivaglobe.com', '+234 704 delivaglobe'],
};

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'none' | 'privacy' | 'terms' | 'deletion' | 'advert'>('none');
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);
  const [advertName, setAdvertName] = useState('');
  const [advertEmail, setAdvertEmail] = useState('');
  const [advertCompany, setAdvertCompany] = useState('');
  const [advertSubmitted, setAdvertSubmitted] = useState(false);

  const closeModal = () => {
    setActiveModal('none');
    setDeletionEmail('');
    setDeletionSubmitted(false);
    setAdvertName('');
    setAdvertEmail('');
    setAdvertCompany('');
    setAdvertSubmitted(false);
  };

  const handleLinkClick = (link: string) => {
    if (link === 'Our Features') {
      document.getElementById('cores-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (link === 'Download App') {
      document.getElementById('download-banner')?.scrollIntoView({ behavior: 'smooth' });
    } else if (link === 'Apply as Rider') {
      document.getElementById('waitlist-form-card')?.scrollIntoView({ behavior: 'smooth' });
    } else if (link === 'About Product') {
      document.getElementById('cores-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (link === 'Work With Us') {
      window.location.href = 'mailto:careers@delivaglobe.com';
    } else if (link === 'Advert Placement') {
      setActiveModal('advert');
    } else if (link === 'Privacy Policy') {
      setActiveModal('privacy');
    } else if (link === 'Terms & Conditions') {
      setActiveModal('terms');
    } else if (link === 'Request Account Deletion') {
      setActiveModal('deletion');
    } else if (link === 'support@delivaglobe.com') {
      window.location.href = 'mailto:support@delivaglobe.com';
    } else if (link === '+234 704 delivaglobe') {
      window.location.href = 'tel:+23470433548245623';
    }
  };

  return (
    <>
      {/* App Download Banner matching delivaglobe.com */}
      <section className="dg-download-wrapper" id="download-banner">
        <div className="dg-download-banner">
          {/* Mockups Container */}
          <div className="dg-mockups-box">
            <img
              src="/download.webp"
              alt="Deliva Mobile App Mockup Back"
              className="dg-phone-mockup dg-phone-back"
            />
            <img
              src="/dowmload_1.webp"
              alt="Deliva Mobile App Mockup Front"
              className="dg-phone-mockup dg-phone-front"
            />
          </div>

          {/* Download Text Copy */}
          <div className="dg-download-content">
            <h2 className="dg-download-heading">
              Download Our App<br />Now
            </h2>
            <p className="dg-download-sub">
              Get Deliva on your phone today and enjoy fast, secure, and hassle-free deliveries right at your fingertips.
            </p>
            <div className="dg-store-badges">
              <a
                href="#waitlist-form-card"
                className="dg-store-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('waitlist-form-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <img
                  src="/apple_download_icon.webp"
                  alt="Download on the App Store"
                  className="dg-badge-img"
                />
              </a>
              <a
                href="#waitlist-form-card"
                className="dg-store-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('waitlist-form-card')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <img
                  src="/google_download_icon.webp"
                  alt="Get it on Google Play"
                  className="dg-badge-img"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer matching delivaglobe.com */}
      <footer className="dg-footer">
        <div className="dg-footer-container">
          <div className="dg-footer-grid">
            {/* Brand Column */}
            <div className="dg-footer-brand-col">
              <a href="/" className="dg-footer-logo" aria-label="Deliva home">
                <span role="img" aria-label="Deliva" className="dg-logo-mark dg-footer-logo-img" />
              </a>
              <p className="dg-brand-tagline">Beyond deliveries</p>
            </div>

            {/* Links Columns */}
            <div className="dg-footer-links-grid">
              {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                <div key={category} className="dg-footer-col">
                  <h4 className="dg-footer-category">{category}</h4>
                  <ul className="dg-footer-ul">
                    {links.map((link) => (
                      <li key={link}>
                        <button
                          type="button"
                          className="dg-footer-link-btn"
                          onClick={() => handleLinkClick(link)}
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="dg-footer-divider" />

          {/* Bottom Copyright & Social */}
          <div className="dg-footer-bottom">
            <p className="dg-copyright">
              © {new Date().getFullYear()} Deliva Globe LTD. All rights reserved.
            </p>
            <div className="dg-social-links">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="dg-social-link"
              >
                Twitter
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="dg-social-link"
              >
                LinkedIn
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="dg-social-link"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="dg-social-link"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Exact Interactive Modals from delivaglobe.com */}
      {activeModal !== 'none' && (
        <div className="dg-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="dg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dg-modal-head">
              <h3 className="dg-modal-title">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms & Conditions'}
                {activeModal === 'deletion' && 'Request Account Deletion'}
                {activeModal === 'advert' && 'Advert Placement Request'}
              </h3>
              <button type="button" className="dg-modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="dg-modal-body">
              {activeModal === 'privacy' && (
                <div className="dg-legal-text">
                  <p><strong>Last updated: July 15, 2026</strong></p>
                  <p>
                    At Deliva Globe, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and protect your personal information when you use our website, mobile applications, and services.
                  </p>
                  <h4>1. Information We Collect</h4>
                  <p>
                    We collect information you provide directly to us, such as when you create an account, request logistics services, contact support, or interact with our platform. This includes contact details, profile photo, location details (to compute logistics distances), payment preferences, and support correspondence.
                  </p>
                  <h4>2. How We Use Information</h4>
                  <p>
                    We use the information we collect to provide and maintain our services, match delivery riders with merchants and consumers, coordinate pickups and dropoffs, process payments, verify identities, and send safety alerts.
                  </p>
                  <h4>3. Sharing & Disclosures</h4>
                  <p>
                    We only share your information with dispatchers, drivers, and merchant partners as needed to execute deliveries. We do not sell your personal data to third parties.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="dg-legal-text">
                  <p><strong>Last updated: July 15, 2026</strong></p>
                  <p>
                    Welcome to Deliva! By accessing or using our platform, you agree to comply with and be bound by these Terms & Conditions. Please read them carefully.
                  </p>
                  <h4>1. Service Agreement</h4>
                  <p>
                    Deliva Globe provides an on-demand marketplace connecting consumers with independent third-party delivery riders, drivers, and merchant stores. Deliva does not operate logistics vehicles directly; we act as a secure facilitator.
                  </p>
                  <h4>2. User Account Security</h4>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use or security breaches.
                  </p>
                  <h4>3. Pricing & Billing</h4>
                  <p>
                    Fees for deliveries and rides are computed dynamically based on distance, traffic, and vehicle type. Transparent flat pricing is guaranteed with zero hidden fees.
                  </p>
                </div>
              )}

              {activeModal === 'deletion' && (
                <div className="dg-form-modal">
                  {deletionSubmitted ? (
                    <div className="dg-modal-success">
                      <p className="dg-success-msg">Deletion Request Submitted Successfully</p>
                      <p className="dg-success-sub">
                        We have received your request for account deletion associated with <strong>{deletionEmail}</strong>. A verification email has been sent to confirm this action.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="dg-modal-info">
                        Enter the email address associated with your Deliva account below. We will send you a verification link to confirm account deletion. This process is irreversible.
                      </p>
                      <div className="dg-field" style={{ marginTop: 14 }}>
                        <label className="dg-label">Email Address</label>
                        <input
                          type="email"
                          className="dg-input"
                          placeholder="name@example.com"
                          value={deletionEmail}
                          onChange={(e) => setDeletionEmail(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="dg-submit-btn"
                        style={{ marginTop: 16 }}
                        disabled={!deletionEmail.trim()}
                        onClick={() => setDeletionSubmitted(true)}
                      >
                        Submit Request
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeModal === 'advert' && (
                <div className="dg-form-modal">
                  {advertSubmitted ? (
                    <div className="dg-modal-success">
                      <p className="dg-success-msg">Advert Request Submitted!</p>
                      <p className="dg-success-sub">
                        Thank you, <strong>{advertName}</strong>. Our brand partnership team will review your advertisement inquiry for <strong>{advertCompany}</strong> and contact you via <strong>{advertEmail}</strong> within 2 business days.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="dg-modal-info">
                        Partner with Deliva Globe to promote your brand to thousands of users. Fill in your details below to request ad placements.
                      </p>
                      <div className="dg-field" style={{ marginTop: 12 }}>
                        <label className="dg-label">Full Name</label>
                        <input
                          type="text"
                          className="dg-input"
                          placeholder="John Doe"
                          value={advertName}
                          onChange={(e) => setAdvertName(e.target.value)}
                        />
                      </div>
                      <div className="dg-field" style={{ marginTop: 12 }}>
                        <label className="dg-label">Work Email</label>
                        <input
                          type="email"
                          className="dg-input"
                          placeholder="john@company.com"
                          value={advertEmail}
                          onChange={(e) => setAdvertEmail(e.target.value)}
                        />
                      </div>
                      <div className="dg-field" style={{ marginTop: 12 }}>
                        <label className="dg-label">Company Name</label>
                        <input
                          type="text"
                          className="dg-input"
                          placeholder="Company Ltd"
                          value={advertCompany}
                          onChange={(e) => setAdvertCompany(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="dg-submit-btn"
                        style={{ marginTop: 18 }}
                        disabled={!advertName.trim() || !advertEmail.trim() || !advertCompany.trim()}
                        onClick={() => setAdvertSubmitted(true)}
                      >
                        Submit Inquiry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
