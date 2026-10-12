import React, { useState } from 'react';
import { submitToWaitlist } from '../lib/supabase';
import { SuccessCard } from './SuccessCard';
import type { SingleWaitlistFormData } from '../types';

const BUSINESS_TYPES = [
  'E-commerce & Online Retail',
  'Food, Bakery & Restaurant',
  'Fashion, Beauty & Apparel',
  'Groceries & FMCG Supermarket',
  'Pharmacy & Healthcare',
  'Electronics & Gadgets',
  'Corporate & Professional Services',
  'Logistics & Fleet Operations',
  'Other',
];

const DELIVERY_FREQUENCIES = [
  'Daily',
  'Several times a week',
  'Weekly',
  'Occasionally',
];

const EMPTY: SingleWaitlistFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  businessName: '',
  businessType: '',
  otherBusinessType: '',
  deliveryFrequency: '',
  businessLocation: '',
  marketingConsent: true,
};

export const SingleWaitlistForm: React.FC = () => {
  const [form, setForm] = useState<SingleWaitlistFormData>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? 'First name is required' : null;
      case 'lastName':
        return !value.trim() ? 'Last name is required' : null;
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;
      case 'otherBusinessType':
        if (form.businessType === 'Other' && !value.trim()) {
          return 'Please specify your business type';
        }
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) {
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    // Clear error for this field as the user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'businessType' && value !== 'Other' && fieldErrors.otherBusinessType) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.otherBusinessType;
        return next;
      });
    }

    if (name === 'phone') {
      const cleaned = value.replace(/^\+234\s*/, '0').replace(/^\+/, '');
      setForm((prev) => ({
        ...prev,
        phone: cleaned,
      }));
      setError(null);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (form.businessType === 'Other' && !form.otherBusinessType?.trim()) {
      newErrors.otherBusinessType = 'Please specify your business type';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Please fill in all required fields highlighted in red.');
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstKey);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await submitToWaitlist(form);
      if (res.success) setDone(true);
      else setError(res.message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SuccessCard
        firstName={form.firstName.trim()}
        email={form.email.trim()}
        onReset={() => {
          setForm(EMPTY);
          setDone(false);
        }}
      />
    );
  }

  return (
    <form className="dg-form-box" id="waitlist-form-card" onSubmit={handleSubmit} noValidate>
      <h2 className="dg-form-title">Join the waitlist</h2>

      {error && <p className="dg-error" role="alert">{error}</p>}

      {/* Row 1: First Name & Last Name */}
      <div className="dg-name-grid">
        <div className="dg-field">
          <label htmlFor="firstName" className="dg-label">
            First name <span className="dg-req">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className={`dg-input ${fieldErrors.firstName ? 'dg-input-error' : ''}`}
            value={form.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Chukwuma"
            autoComplete="given-name"
            required
            aria-invalid={!!fieldErrors.firstName}
          />
          {fieldErrors.firstName && (
            <span className="dg-field-error-msg">{fieldErrors.firstName}</span>
          )}
        </div>
        <div className="dg-field">
          <label htmlFor="lastName" className="dg-label">
            Last name <span className="dg-req">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className={`dg-input ${fieldErrors.lastName ? 'dg-input-error' : ''}`}
            value={form.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Adeyemi"
            autoComplete="family-name"
            required
            aria-invalid={!!fieldErrors.lastName}
          />
          {fieldErrors.lastName && (
            <span className="dg-field-error-msg">{fieldErrors.lastName}</span>
          )}
        </div>
      </div>

      {/* Row 2: Email & Phone Number */}
      <div className="dg-name-grid">
        <div className="dg-field">
          <label htmlFor="email" className="dg-label">
            Email address <span className="dg-req">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`dg-input ${fieldErrors.email ? 'dg-input-error' : ''}`}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. chukwuma@example.com"
            autoComplete="email"
            required
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <span className="dg-field-error-msg">{fieldErrors.email}</span>
          )}
        </div>
        <div className="dg-field">
          <label htmlFor="phone" className="dg-label">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="dg-input"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. 08123456789"
            autoComplete="tel-national"
          />
        </div>
      </div>

      {/* Row 3: Business Name & Business Type Dropdown */}
      <div className="dg-name-grid">
        <div className="dg-field">
          <label htmlFor="businessName" className="dg-label">
            Business name
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            className="dg-input"
            value={form.businessName}
            onChange={handleChange}
            placeholder="e.g. Apex Global Stores"
          />
        </div>

        <div className="dg-field">
          <label htmlFor="businessType" className="dg-label">
            Business type
          </label>
          <div className="dg-select-wrap">
            <select
              id="businessType"
              name="businessType"
              className="dg-select"
              value={form.businessType}
              onChange={handleChange}
            >
              <option value="">Select your business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conditional Row: Other Business Type Input if "Other" is selected */}
      {form.businessType === 'Other' && (
        <div className="dg-field dg-other-field">
          <label htmlFor="otherBusinessType" className="dg-label">
            Specify business type <span className="dg-req">*</span>
          </label>
          <input
            id="otherBusinessType"
            name="otherBusinessType"
            type="text"
            className={`dg-input ${fieldErrors.otherBusinessType ? 'dg-input-error' : ''}`}
            value={form.otherBusinessType}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Real Estate & Interior Design"
            required
            aria-invalid={!!fieldErrors.otherBusinessType}
          />
          {fieldErrors.otherBusinessType && (
            <span className="dg-field-error-msg">{fieldErrors.otherBusinessType}</span>
          )}
        </div>
      )}

      {/* Row 4: Business Location & Delivery Frequency */}
      <div className="dg-name-grid">
        <div className="dg-field">
          <label htmlFor="businessLocation" className="dg-label">
            Business location
          </label>
          <input
            id="businessLocation"
            name="businessLocation"
            type="text"
            className="dg-input"
            value={form.businessLocation || ''}
            onChange={handleChange}
            placeholder="e.g. Ikeja, Lagos"
            autoComplete="address-level2"
          />
        </div>

        <div className="dg-field">
          <label htmlFor="deliveryFrequency" className="dg-label">
            How often do you make deliveries?
          </label>
          <div className="dg-select-wrap">
            <select
              id="deliveryFrequency"
              name="deliveryFrequency"
              className="dg-select"
              value={form.deliveryFrequency || ''}
              onChange={handleChange}
            >
              <option value="">Select delivery frequency</option>
              {DELIVERY_FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Custom Promotional Email Checkbox */}
      <label htmlFor="marketingConsent" className="dg-checkbox">
        <input
          id="marketingConsent"
          name="marketingConsent"
          type="checkbox"
          checked={form.marketingConsent}
          onChange={handleChange}
          className="dg-checkbox-input"
        />
        <span
          className={`dg-checkbox-custom ${form.marketingConsent ? 'dg-checkbox-custom-checked' : ''}`}
          aria-hidden="true"
        >
          {form.marketingConsent && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <div className="dg-checkbox-text-wrap">
          <span className="dg-checkbox-label-text">
            Send me promotional emails & launch updates
          </span>
          <span className="dg-checkbox-hint-text">
            Get early beta access, launch discounts, and special delivery promo codes.
          </span>
        </div>
      </label>

      {/* Submit Button */}
      <button type="submit" className="dg-submit-btn" id="join-waitlist-btn" disabled={loading}>
        {loading ? 'Joining…' : 'Join waitlist'}
      </button>
    </form>
  );
};
