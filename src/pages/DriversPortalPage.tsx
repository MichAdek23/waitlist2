import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Car,
  CheckCircle2,
  FileText,
  Landmark,
  Lock,
  LogOut,
  Receipt,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  completeDriverPortal,
  fetchDriverPortalProfile,
  fetchSupportedBanks,
  getStoredPortalToken,
  loginDriverPortal,
  setStoredPortalToken,
  verifyNubanAccount,
} from '../lib/driverPortalService';
import type {
  BankOption,
  CompleteDriverPortalPayload,
  DriverPortalProfile,
} from '../types';

interface DriversPortalPageProps {
  onNavigate: (path: string) => void;
}

const SUPPORT_UPDATE_NOTICE = 'To update, please contact our support team via the app';

function maskNin(nin?: string): string {
  if (!nin) return 'Not on file';
  const clean = nin.trim();
  if (clean.length <= 4) return clean;
  return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
}

export const DriversPortalPage: React.FC<DriversPortalPageProps> = ({ onNavigate }) => {
  const [token, setToken] = useState<string | null>(() => getStoredPortalToken());
  const [profile, setProfile] = useState<DriverPortalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!!getStoredPortalToken());
  const [banks, setBanks] = useState<BankOption[]>([]);

  // Login state
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      return q.get('email') || '';
    } catch {
      return '';
    }
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Portal editable form state (NIN/registration fields stay immutable)
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleSeats, setVehicleSeats] = useState('1');

  const [billingCompanyName, setBillingCompanyName] = useState('');
  const [billingCompanyEmail, setBillingCompanyEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingRegCode, setBillingRegCode] = useState('');
  const [billingVatNumber, setBillingVatNumber] = useState('');

  const [invoiceIssuerType, setInvoiceIssuerType] = useState<'Private' | 'Company'>('Private');
  const [invoiceIssuerName, setInvoiceIssuerName] = useState('');
  const [invoiceIssuerAddress, setInvoiceIssuerAddress] = useState('');
  const [invoiceIssuerRegCode, setInvoiceIssuerRegCode] = useState('');
  const [invoiceIssuerVatNumber, setInvoiceIssuerVatNumber] = useState('');

  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [transitNumber, setTransitNumber] = useState('');

  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankVerifyMsg, setBankVerifyMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [justActivated, setJustActivated] = useState(false);

  const populateForm = (p: DriverPortalProfile) => {
    setPhone(p.phone || '');
    setDisplayName(
      p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
    );
    setLicenseNumber(p.license_number || '');
    setLicenseExpiry(p.license_expiry || '');
    const vType = (p.vehicle_type || 'bike').toLowerCase();
    setVehicleType(vType);
    setVehicleModel(p.vehicle_model || p.vehicle_make || '');
    setVehicleYear(p.vehicle_year ? String(p.vehicle_year) : '');
    setVehiclePlate(p.vehicle_plate || '');
    setVehicleSeats(
      p.vehicle_seats ? String(p.vehicle_seats) : vType === 'bike' ? '1' : '4'
    );

    setBillingCompanyName(p.billing_company_name || '');
    setBillingCompanyEmail(p.billing_company_email || '');
    setBillingAddress(p.billing_address || '');
    setBillingRegCode(p.billing_reg_code || '');
    setBillingVatNumber(p.billing_vat_number || '');

    setInvoiceIssuerType(p.invoice_issuer_type === 'Company' ? 'Company' : 'Private');
    setInvoiceIssuerName(p.invoice_issuer_name || '');
    setInvoiceIssuerAddress(p.invoice_issuer_address || '');
    setInvoiceIssuerRegCode(p.invoice_issuer_reg_code || '');
    setInvoiceIssuerVatNumber(p.invoice_issuer_vat_number || '');

    setAccountName(p.account_name || '');
    setAccountNumber(p.account_number || '');
    setBankName(p.bank_name || '');
    setBankCode(p.bank_code || '');
    setTransitNumber(p.transit_number || '');
  };

  useEffect(() => {
    if (!token) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);
    Promise.all([fetchDriverPortalProfile(token), fetchSupportedBanks(token)])
      .then(([p, bankList]) => {
        if (cancelled) return;
        setProfile(p);
        populateForm(p);
        setBanks(bankList);
      })
      .catch((err: any) => {
        if (cancelled) return;
        if (err?.message === 'SESSION_EXPIRED') {
          setToken(null);
          setProfile(null);
        } else {
          setLoginError(err?.message || 'Unable to load portal session');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await loginDriverPortal(loginEmail, loginPassword);
      setToken(res.token);
      if (res.profile) {
        setProfile(res.profile);
        populateForm(res.profile);
      }
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    setStoredPortalToken(null);
    setToken(null);
    setProfile(null);
    setJustActivated(false);
    setSubmitError('');
    setBankVerifyMsg('');
  };

  const handleFillBillingFromProfile = () => {
    if (!profile) return;
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    if (!billingCompanyName.trim()) setBillingCompanyName(fullName);
    if (!billingCompanyEmail.trim()) setBillingCompanyEmail(profile.email || '');
    if (!invoiceIssuerName.trim()) setInvoiceIssuerName(fullName);
    if (!invoiceIssuerAddress.trim() && billingAddress.trim()) {
      setInvoiceIssuerAddress(billingAddress.trim());
    }
    if (!accountName.trim()) setAccountName(fullName);
  };

  const handleVerifyNuban = async () => {
    if (!token || !bankCode || accountNumber.trim().length < 10) return;
    setVerifyingBank(true);
    setBankVerifyMsg('');
    try {
      const verified = await verifyNubanAccount(token, accountNumber.trim(), bankCode);
      if (verified.account_name) {
        setAccountName(verified.account_name);
        setBankVerifyMsg(`Verified: ${verified.account_name}`);
      }
    } catch (err: any) {
      setBankVerifyMsg(err?.message || 'Could not auto-verify NUBAN; please check account number & bank.');
    } finally {
      setVerifyingBank(false);
    }
  };

  const validatePortalForm = (): string | null => {
    if (phone.trim().length < 7) return 'Please enter a valid phone number.';
    if (!displayName.trim()) return 'Please enter your display name.';
    if (!licenseNumber.trim()) return 'Driver license number is required.';
    if (!licenseExpiry.trim()) return 'Driver licence expiry date is required.';
    const todayIso = new Date().toISOString().split('T')[0];
    if (licenseExpiry < todayIso) {
      return 'Driver licence expiry date cannot be in the past.';
    }
    if (!vehicleModel.trim()) return 'Vehicle model is required.';
    const yr = Number(vehicleYear);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(yr) || yr < 1980 || yr > maxYear) {
      return `Vehicle year must be between 1980 and ${maxYear}.`;
    }
    if (!vehiclePlate.trim()) return 'Vehicle number plate is required.';
    const seats = Number(vehicleSeats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 60) {
      return 'Vehicle seats must be between 1 and 60.';
    }
    if (!billingCompanyName.trim()) return 'Billing company name is required.';
    if (!billingCompanyEmail.includes('@') || !billingCompanyEmail.includes('.')) {
      return 'Please enter a valid billing company email.';
    }
    if (!billingAddress.trim()) return 'Billing address is required.';
    if (!invoiceIssuerName.trim()) return 'Invoice issuer name is required.';
    if (!invoiceIssuerAddress.trim()) return 'Invoice issuer address is required.';
    if (invoiceIssuerType === 'Company' && !invoiceIssuerRegCode.trim()) {
      return 'Invoice issuer registration code is required for Company type.';
    }
    if (!accountName.trim()) return 'Bank Account Holder Name is required.';
    const cleanAccNum = accountNumber.replace(/\s+/g, '');
    if (cleanAccNum.length < 8) return 'A valid NUBAN / account number is required.';
    if (!bankName.trim()) return 'Bank Name or BIC/SWIFT is required.';
    return null;
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitError('');

    const validationErr = validatePortalForm();
    if (validationErr) {
      setSubmitError(validationErr);
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CompleteDriverPortalPayload = {
        phone: phone.trim(),
        display_name: displayName.trim(),
        license_number: licenseNumber.trim(),
        license_expiry: licenseExpiry.trim(),
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        vehicle_year: Number(vehicleYear),
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        vehicle_seats: Number(vehicleSeats),
        billing_company_name: billingCompanyName.trim(),
        billing_company_email: billingCompanyEmail.trim(),
        billing_address: billingAddress.trim(),
        billing_reg_code: billingRegCode.trim(),
        billing_vat_number: billingVatNumber.trim(),
        invoice_issuer_type: invoiceIssuerType,
        invoice_issuer_name: invoiceIssuerName.trim(),
        invoice_issuer_address: invoiceIssuerAddress.trim(),
        invoice_issuer_reg_code: invoiceIssuerRegCode.trim(),
        invoice_issuer_vat_number: invoiceIssuerVatNumber.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.replace(/\s+/g, ''),
        bank_name: bankName.trim(),
        bank_code: bankCode.trim(),
        transit_number: transitNumber.trim(),
      };

      const updated = await completeDriverPortal(token, payload);
      setProfile(updated);
      populateForm(updated);
      setJustActivated(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not complete Driver Portal onboarding.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const isLockedActive = Boolean(profile?.portal_completed && profile?.is_activated);
  const todayMinDate = new Date().toISOString().split('T')[0];

  const renderLockedRow = (label: string, value: string | number | undefined | null) => (
    <div className="dg-portal-locked-item">
      <div className="dg-portal-locked-top">
        <span className="dg-portal-locked-label">{label}</span>
        <span className="dg-portal-locked-val">{value || '—'}</span>
      </div>
      <p className="dg-portal-support-note">{SUPPORT_UPDATE_NOTICE}</p>
    </div>
  );

  return (
    <main className="dg-legal-page dg-portal-page">
      <section className="dg-legal-hero">
        <div className="dg-legal-container">
          <div className="dg-portal-topbar">
            <button
              type="button"
              className="dg-legal-back-btn"
              onClick={() => onNavigate('/')}
            >
              <ArrowLeft size={15} />
              <span>Back to Waitlist Home</span>
            </button>

            {token && profile && (
              <button
                type="button"
                className="dg-portal-signout-btn"
                onClick={handleSignOut}
              >
                <LogOut size={15} />
                <span>Sign Out ({profile.email})</span>
              </button>
            )}
          </div>

          <div className="dg-legal-badge">
            {isLockedActive ? (
              <CheckCircle2 size={14} />
            ) : (
              <ShieldCheck size={14} />
            )}
            <span>
              {isLockedActive ? 'ACTIVE DRIVER ACCOUNT' : 'DELIVA DRIVER PORTAL'}
            </span>
          </div>

          <h1 className="dg-legal-title">Drivers Portal</h1>
          <p className="dg-legal-subtitle">
            {isLockedActive
              ? 'Your driver portal is complete and active. You can go online in the Deliva Rider app and receive delivery & ride offers.'
              : 'Sign in with your Deliva Rider account to review your immutable NIN registration details, complete your portal profile, and activate your account to receive offers.'}
          </p>
        </div>
      </section>

      <section className="dg-legal-body">
        <div className="dg-portal-container">
          {loadingProfile ? (
            <div className="dg-portal-card dg-portal-loading">
              <div className="dg-legal-spinner" />
              <p>Loading your Driver Portal details...</p>
            </div>
          ) : !token || !profile ? (
            <div className="dg-portal-auth-wrap">
              <div className="dg-portal-card">
                <div className="dg-portal-section-head">
                  <div className="dg-portal-icon-box">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="dg-portal-section-title">Driver Portal Sign In</h2>
                    <p className="dg-portal-section-sub">
                      Use the email and password from your Deliva Rider registration.
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="dg-portal-alert dg-portal-alert-error" role="alert">
                    <AlertCircle size={18} />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="dg-portal-login-form">
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="portal-login-email">
                      Driver Email
                    </label>
                    <input
                      id="portal-login-email"
                      type="email"
                      className="dg-input"
                      placeholder="rider@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="dg-field">
                    <label className="dg-label" htmlFor="portal-login-password">
                      Password
                    </label>
                    <input
                      id="portal-login-password"
                      type="password"
                      className="dg-input"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="dg-submit-btn"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing In...' : 'Access Driver Portal'}
                  </button>
                </form>

                <p className="dg-portal-auth-footnote">
                  Signing into the Driver Portal will not log you out of your Deliva Rider mobile app.
                </p>
              </div>
            </div>
          ) : (
            <div className="dg-portal-content">
              {/* Account Activation Status Banner */}
              {isLockedActive ? (
                <div className="dg-portal-banner dg-portal-banner-active">
                  <div className="dg-portal-banner-icon">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="dg-portal-banner-text">
                    <h2>
                      {justActivated
                        ? 'Driver Account Activated!'
                        : 'Account Active — Ready to Receive Offers'}
                    </h2>
                    <p>
                      {justActivated
                        ? 'Your portal details have been verified and locked. Open the Deliva Rider app, switch your status to Online, and start receiving offers.'
                        : `Your driver profile is complete and active. ${SUPPORT_UPDATE_NOTICE}.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="dg-portal-banner dg-portal-banner-pending">
                  <div className="dg-portal-banner-icon">
                    <AlertCircle size={24} />
                  </div>
                  <div className="dg-portal-banner-text">
                    <h2>Account Not Yet Activated</h2>
                    <p>
                      You cannot go online or receive ride/delivery offers yet. Complete all sections below and submit to activate your driver account. Fields pulled from your NIN registration are permanently immutable.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="dg-portal-alert dg-portal-alert-error" role="alert">
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleCompleteSubmit} className="dg-portal-sections" noValidate>
                {/* 1. Profile */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head">
                    <div className="dg-portal-icon-box">
                      <User size={19} />
                    </div>
                    <div>
                      <h2 className="dg-portal-section-title">Profile</h2>
                      <p className="dg-portal-section-sub">
                        Here you can check your driver profile details and modify some if they are outdated.
                      </p>
                    </div>
                  </div>

                  {/* Verified NIN Registration Strip */}
                  <div className="dg-portal-nin-strip">
                    <div className="dg-portal-nin-badge">
                      <Lock size={13} />
                      <span>NIN Registration Record (Immutable)</span>
                    </div>
                    <div className="dg-portal-nin-meta">
                      <span><strong>NIN:</strong> {maskNin(profile.nin)}</span>
                      {profile.middle_name && (
                        <span><strong>Middle name:</strong> {profile.middle_name}</span>
                      )}
                      {profile.date_of_birth && (
                        <span><strong>Date of birth:</strong> {profile.date_of_birth}</span>
                      )}
                      {profile.gender && (
                        <span><strong>Gender:</strong> {profile.gender}</span>
                      )}
                      <span>
                        <strong>Verification:</strong>{' '}
                        {profile.nin_verified ? 'Verified via NIN' : 'Locked at registration'}
                      </span>
                    </div>
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('First name', profile.first_name)}
                      {renderLockedRow('Last name', profile.last_name)}
                      {renderLockedRow('Email', profile.email)}
                      {renderLockedRow('Phone', profile.phone)}
                      {renderLockedRow('Display name', profile.display_name)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      <div className="dg-field">
                        <label className="dg-label dg-portal-label-row">
                          <span>First name</span>
                          <span className="dg-portal-immutable-tag">
                            <Lock size={11} /> Immutable (NIN)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="dg-input dg-input-immutable"
                          value={profile.first_name}
                          disabled
                          readOnly
                        />
                        <span className="dg-portal-hint">
                          Locked from NIN registration and cannot be modified.
                        </span>
                      </div>

                      <div className="dg-field">
                        <label className="dg-label dg-portal-label-row">
                          <span>Last name</span>
                          <span className="dg-portal-immutable-tag">
                            <Lock size={11} /> Immutable (NIN)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="dg-input dg-input-immutable"
                          value={profile.last_name}
                          disabled
                          readOnly
                        />
                        <span className="dg-portal-hint">
                          Locked from NIN registration and cannot be modified.
                        </span>
                      </div>

                      <div className="dg-field">
                        <label className="dg-label dg-portal-label-row">
                          <span>Email</span>
                          <span className="dg-portal-immutable-tag">
                            <Lock size={11} /> Immutable
                          </span>
                        </label>
                        <input
                          type="email"
                          className="dg-input dg-input-immutable"
                          value={profile.email}
                          disabled
                          readOnly
                        />
                        <span className="dg-portal-hint">
                          Registered account email cannot be changed here.
                        </span>
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-phone">
                          Phone
                        </label>
                        <input
                          id="portal-phone"
                          type="tel"
                          className="dg-input"
                          placeholder="+234 800 000 0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field dg-portal-col-span-2">
                        <label className="dg-label" htmlFor="portal-display-name">
                          Display name
                        </label>
                        <input
                          id="portal-display-name"
                          type="text"
                          className="dg-input"
                          placeholder="Name shown to customers"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. Driver documents */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head">
                    <div className="dg-portal-icon-box">
                      <FileText size={19} />
                    </div>
                    <div>
                      <h2 className="dg-portal-section-title">Driver documents</h2>
                      <p className="dg-portal-section-sub">
                        Driver and taxi license details. Keep an eye on expiration dates.
                      </p>
                    </div>
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('Driver license number', profile.license_number)}
                      {renderLockedRow('Driver licence expires', profile.license_expiry)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-license-num">
                          Driver license number
                        </label>
                        <input
                          id="portal-license-num"
                          type="text"
                          className="dg-input"
                          placeholder="e.g. ABC123456AA"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-license-exp">
                          Driver licence expires
                        </label>
                        <input
                          id="portal-license-exp"
                          type="date"
                          className="dg-input"
                          min={todayMinDate}
                          value={licenseExpiry}
                          onChange={(e) => setLicenseExpiry(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Driver vehicle */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head">
                    <div className="dg-portal-icon-box">
                      <Car size={19} />
                    </div>
                    <div>
                      <h2 className="dg-portal-section-title">Driver vehicle</h2>
                      <p className="dg-portal-section-sub">
                        Driver can currently select this vehicle in the app.
                      </p>
                    </div>
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('Model', profile.vehicle_model)}
                      {renderLockedRow('Year', profile.vehicle_year)}
                      {renderLockedRow('Number plate', profile.vehicle_plate)}
                      {renderLockedRow('Seats', profile.vehicle_seats)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-vehicle-type">
                          Vehicle category
                        </label>
                        <div className="dg-select-wrap">
                          <select
                            id="portal-vehicle-type"
                            className="dg-select"
                            value={vehicleType}
                            onChange={(e) => {
                              const next = e.target.value;
                              setVehicleType(next);
                              if (next === 'bike' && (!vehicleSeats || vehicleSeats === '4')) {
                                setVehicleSeats('1');
                              } else if (next !== 'bike' && vehicleSeats === '1') {
                                setVehicleSeats('4');
                              }
                            }}
                          >
                            <option value="bike">Motorbike / Dispatch Bike</option>
                            <option value="car">Sedan / Car</option>
                            <option value="van">Delivery Van</option>
                            <option value="truck">Cargo Truck</option>
                          </select>
                        </div>
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-vehicle-model">
                          Model
                        </label>
                        <input
                          id="portal-vehicle-model"
                          type="text"
                          className="dg-input"
                          placeholder="e.g. Toyota Corolla / Bajaj Boxer 150"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-vehicle-year">
                          Year
                        </label>
                        <input
                          id="portal-vehicle-year"
                          type="number"
                          className="dg-input"
                          placeholder="e.g. 2021"
                          min={1980}
                          max={new Date().getFullYear() + 1}
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-vehicle-plate">
                          Number plate
                        </label>
                        <input
                          id="portal-vehicle-plate"
                          type="text"
                          className="dg-input"
                          placeholder="e.g. KJA-123AB"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-vehicle-seats">
                          Seats
                        </label>
                        <input
                          id="portal-vehicle-seats"
                          type="number"
                          className="dg-input"
                          min={1}
                          max={60}
                          value={vehicleSeats}
                          onChange={(e) => setVehicleSeats(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 4. Billing information */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head dg-portal-section-head-split">
                    <div className="dg-portal-section-head-left">
                      <div className="dg-portal-icon-box">
                        <Building2 size={19} />
                      </div>
                      <div>
                        <h2 className="dg-portal-section-title">Billing information</h2>
                        <p className="dg-portal-section-sub">
                          This information appears on invoices sent to you.
                        </p>
                      </div>
                    </div>

                    {!isLockedActive && (
                      <button
                        type="button"
                        className="dg-portal-autofill-btn"
                        onClick={handleFillBillingFromProfile}
                      >
                        Auto-fill from Profile
                      </button>
                    )}
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('Company name', profile.billing_company_name)}
                      {renderLockedRow('Company email', profile.billing_company_email)}
                      {renderLockedRow('Address', profile.billing_address)}
                      {renderLockedRow('Reg. code', profile.billing_reg_code)}
                      {renderLockedRow('VAT no.', profile.billing_vat_number)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-billing-company">
                          Company name
                        </label>
                        <input
                          id="portal-billing-company"
                          type="text"
                          className="dg-input"
                          placeholder="Your name or registered business name"
                          value={billingCompanyName}
                          onChange={(e) => setBillingCompanyName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-billing-email">
                          Company email
                        </label>
                        <input
                          id="portal-billing-email"
                          type="email"
                          className="dg-input"
                          placeholder="billing@example.com"
                          value={billingCompanyEmail}
                          onChange={(e) => setBillingCompanyEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field dg-portal-col-span-2">
                        <label className="dg-label" htmlFor="portal-billing-address">
                          Address
                        </label>
                        <input
                          id="portal-billing-address"
                          type="text"
                          className="dg-input"
                          placeholder="Street address, City, State"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-billing-reg">
                          Reg. code <span className="dg-portal-optional">(Optional)</span>
                        </label>
                        <input
                          id="portal-billing-reg"
                          type="text"
                          className="dg-input"
                          placeholder="CAC / BN / RC number"
                          value={billingRegCode}
                          onChange={(e) => setBillingRegCode(e.target.value)}
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-billing-vat">
                          VAT no. <span className="dg-portal-optional">(Optional)</span>
                        </label>
                        <input
                          id="portal-billing-vat"
                          type="text"
                          className="dg-input"
                          placeholder="VAT or TIN number"
                          value={billingVatNumber}
                          onChange={(e) => setBillingVatNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 5. Invoice issuer information */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head">
                    <div className="dg-portal-icon-box">
                      <Receipt size={19} />
                    </div>
                    <div>
                      <h2 className="dg-portal-section-title">Invoice issuer information</h2>
                      <p className="dg-portal-section-sub">
                        This information appears on invoices sent to your clients.
                      </p>
                    </div>
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('Type', profile.invoice_issuer_type || 'Private')}
                      {renderLockedRow('Name', profile.invoice_issuer_name)}
                      {renderLockedRow('Address', profile.invoice_issuer_address)}
                      {renderLockedRow('Reg. code', profile.invoice_issuer_reg_code)}
                      {renderLockedRow('VAT no.', profile.invoice_issuer_vat_number)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-issuer-type">
                          Type
                        </label>
                        <div className="dg-select-wrap">
                          <select
                            id="portal-issuer-type"
                            className="dg-select"
                            value={invoiceIssuerType}
                            onChange={(e) =>
                              setInvoiceIssuerType(
                                e.target.value === 'Company' ? 'Company' : 'Private'
                              )
                            }
                          >
                            <option value="Private">Private</option>
                            <option value="Company">Company</option>
                          </select>
                        </div>
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-issuer-name">
                          Name
                        </label>
                        <input
                          id="portal-issuer-name"
                          type="text"
                          className="dg-input"
                          placeholder="Full name or legal entity name"
                          value={invoiceIssuerName}
                          onChange={(e) => setInvoiceIssuerName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field dg-portal-col-span-2">
                        <label className="dg-label" htmlFor="portal-issuer-address">
                          Address
                        </label>
                        <input
                          id="portal-issuer-address"
                          type="text"
                          className="dg-input"
                          placeholder="Issuer street address, City, State"
                          value={invoiceIssuerAddress}
                          onChange={(e) => setInvoiceIssuerAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-issuer-reg">
                          Reg. code{' '}
                          {invoiceIssuerType === 'Private' && (
                            <span className="dg-portal-optional">(Optional)</span>
                          )}
                        </label>
                        <input
                          id="portal-issuer-reg"
                          type="text"
                          className="dg-input"
                          placeholder="Registration code"
                          value={invoiceIssuerRegCode}
                          onChange={(e) => setInvoiceIssuerRegCode(e.target.value)}
                          required={invoiceIssuerType === 'Company'}
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-issuer-vat">
                          VAT no. <span className="dg-portal-optional">(Optional)</span>
                        </label>
                        <input
                          id="portal-issuer-vat"
                          type="text"
                          className="dg-input"
                          placeholder="VAT number"
                          value={invoiceIssuerVatNumber}
                          onChange={(e) => setInvoiceIssuerVatNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* 6. Payout account information */}
                <section className="dg-portal-card">
                  <div className="dg-portal-section-head">
                    <div className="dg-portal-icon-box">
                      <Landmark size={19} />
                    </div>
                    <div>
                      <h2 className="dg-portal-section-title">Payout account information</h2>
                      <p className="dg-portal-section-sub">
                        Bank details used to disburse your driver earnings payouts.
                      </p>
                    </div>
                  </div>

                  {isLockedActive ? (
                    <div className="dg-portal-locked-grid">
                      {renderLockedRow('Bank Account Holder Name', profile.account_name)}
                      {renderLockedRow('Nuban Account Number', profile.account_number)}
                      {renderLockedRow('Bank Name or BIC/SWIFT', profile.bank_name)}
                      {renderLockedRow('Transit number', profile.transit_number)}
                    </div>
                  ) : (
                    <div className="dg-portal-form-grid">
                      {banks.length > 0 && (
                        <div className="dg-field dg-portal-col-span-2">
                          <label className="dg-label" htmlFor="portal-bank-select">
                            Select Nigerian Bank <span className="dg-portal-optional">(or enter Bank Name / BIC/SWIFT below)</span>
                          </label>
                          <div className="dg-select-wrap">
                            <select
                              id="portal-bank-select"
                              className="dg-select"
                              value={bankCode}
                              onChange={(e) => {
                                const code = e.target.value;
                                setBankCode(code);
                                const found = banks.find((b) => b.code === code);
                                if (found) setBankName(found.name);
                              }}
                            >
                              <option value="">Select bank from list (optional)</option>
                              {banks.map((b) => (
                                <option key={b.code} value={b.code}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-bank-name">
                          Bank Name or BIC/SWIFT
                        </label>
                        <input
                          id="portal-bank-name"
                          type="text"
                          className="dg-input"
                          placeholder="e.g. Access Bank or ABNGNGLA"
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            if (bankCode) {
                              const found = banks.find((b) => b.code === bankCode);
                              if (found && found.name !== e.target.value) {
                                setBankCode('');
                              }
                            }
                          }}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-nuban">
                          Nuban Account Number
                        </label>
                        <div className="dg-portal-input-action-row">
                          <input
                            id="portal-nuban"
                            type="text"
                            className="dg-input"
                            placeholder="10-digit NUBAN or account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                          />
                          {bankCode && accountNumber.trim().length >= 10 && (
                            <button
                              type="button"
                              className="dg-portal-verify-btn"
                              onClick={handleVerifyNuban}
                              disabled={verifyingBank}
                            >
                              {verifyingBank ? 'Verifying...' : 'Verify NUBAN'}
                            </button>
                          )}
                        </div>
                        {bankVerifyMsg && (
                          <span className="dg-portal-hint">{bankVerifyMsg}</span>
                        )}
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-holder-name">
                          Bank Account Holder Name
                        </label>
                        <input
                          id="portal-holder-name"
                          type="text"
                          className="dg-input"
                          placeholder="Exact account holder name"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="dg-field">
                        <label className="dg-label" htmlFor="portal-transit">
                          Transit number <span className="dg-portal-optional">(Optional)</span>
                        </label>
                        <input
                          id="portal-transit"
                          type="text"
                          className="dg-input"
                          placeholder="Leave blank if not applicable"
                          value={transitNumber}
                          onChange={(e) => setTransitNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {!isLockedActive && (
                  <div className="dg-portal-submit-bar">
                    <p className="dg-portal-submit-note">
                      Once submitted, your profile will be locked like an active Bolt driver portal and your Deliva Rider account will immediately activate to receive ride & delivery offers.
                    </p>
                    <button
                      type="submit"
                      className="dg-submit-btn dg-portal-submit-btn"
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Activating Driver Account...'
                        : 'Complete Portal & Activate Account'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
