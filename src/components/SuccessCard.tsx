import React from 'react';

interface SuccessCardProps {
  firstName: string;
  email: string;
  onReset: () => void;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ firstName, email, onReset }) => (
  <div className="dg-form-box dg-success" id="waitlist-form-card">
    <h2 className="dg-form-title">You're on the list, {firstName}.</h2>
    <p className="dg-success-text">
      We'll email <strong>{email}</strong> when Deliva launches.
    </p>
    <button type="button" className="dg-link-btn" onClick={onReset}>
      Add another email
    </button>
  </div>
);
