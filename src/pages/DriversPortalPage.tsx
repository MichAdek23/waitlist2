import React, { useEffect, useRef, useState } from 'react';
import {
  completeDriverPortal,
  exchangePortalLaunchCode,
  fetchDriverPortalProfile,
  fetchSupportedBanks,
  getStoredPortalToken,
  MAX_PORTAL_DOCUMENT_BYTES,
  resolvePortalMediaUrl,
  setStoredPortalToken,
  uploadDriverPortalDocument,
  verifyNubanAccount,
} from '../lib/driverPortalService';
import type {
  BankOption,
  CompleteDriverPortalPayload,
  DriverPortalProfile,
  PortalDocumentFile,
  PortalDocumentType,
} from '../types';

interface DriversPortalPageProps {
  onNavigate?: (path: string) => void;
}

interface RequiredDocConfig {
  key: PortalDocumentType;
  label: string;
}

const REQUIRED_DOCUMENTS: RequiredDocConfig[] = [
  { key: 'road_worthiness', label: 'Road worthiness' },
  { key: 'driving_licence', label: 'Driving licence' },
  { key: 'mot', label: 'Ministry of Transportation (MOT)' },
  { key: 'bike_licence', label: 'Bike licence (vehicle papers)' },
];

type PortalDocsMap = Record<PortalDocumentType, PortalDocumentFile | null>;
type PortalDocFlagsMap = Record<PortalDocumentType, boolean>;
type PortalDocErrorsMap = Record<PortalDocumentType, string>;

const EMPTY_DOCS: PortalDocsMap = {
  road_worthiness: null,
  driving_licence: null,
  mot: null,
  bike_licence: null,
};

const EMPTY_UPLOADING: PortalDocFlagsMap = {
  road_worthiness: false,
  driving_licence: false,
  mot: false,
  bike_licence: false,
};

const EMPTY_DOC_ERRORS: PortalDocErrorsMap = {
  road_worthiness: '',
  driving_licence: '',
  mot: '',
  bike_licence: '',
};

function maskNin(nin?: string): string {
  if (!nin) return 'Not on file';
  const clean = nin.trim();
  if (clean.length <= 4) return clean;
  return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hydratePortalDocs(p: DriverPortalProfile): PortalDocsMap {
  const resolveDoc = (
    docObj: PortalDocumentFile | null | undefined,
    url: string | undefined,
    fallbackName: string
  ): PortalDocumentFile | null => {
    const resolvedUrl = (docObj?.url || url || '').trim();
    if (!resolvedUrl) return null;
    return {
      upload_id: docObj?.upload_id,
      url: resolvedUrl,
      file_name: docObj?.file_name || fallbackName,
      content_type: docObj?.content_type,
      size_bytes: docObj?.size_bytes,
      uploaded_at: docObj?.uploaded_at,
    };
  };

  return {
    road_worthiness: resolveDoc(
      p.road_worthiness_doc,
      p.road_worthiness_doc_url,
      'Road worthiness'
    ),
    driving_licence: resolveDoc(
      p.driving_licence_doc,
      p.driving_licence_doc_url,
      'Driving licence'
    ),
    mot: resolveDoc(p.mot_doc, p.mot_doc_url, 'Ministry of Transportation (MOT)'),
    bike_licence: resolveDoc(
      p.bike_licence_doc,
      p.bike_licence_doc_url,
      'Bike licence (vehicle papers)'
    ),
  };
}

export const DriversPortalPage: React.FC<DriversPortalPageProps> = () => {
  const [token, setToken] = useState<string | null>(() => getStoredPortalToken());
  const [profile, setProfile] = useState<DriverPortalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [accessError, setAccessError] = useState('');

  // Editable form state
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleSeats, setVehicleSeats] = useState('1');

  const [docs, setDocs] = useState<PortalDocsMap>(EMPTY_DOCS);
  const [uploadingDocs, setUploadingDocs] = useState<PortalDocFlagsMap>(EMPTY_UPLOADING);
  const [docErrors, setDocErrors] = useState<PortalDocErrorsMap>(EMPTY_DOC_ERRORS);
  const fileInputRefs = useRef<Partial<Record<PortalDocumentType, HTMLInputElement | null>>>({});

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

    setDocs(hydratePortalDocs(p));

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
    let cancelled = false;

    const bootstrapPortal = async () => {
      setLoadingProfile(true);
      setAccessError('');

      let launchCode = '';
      try {
        const params = new URLSearchParams(window.location.search);
        launchCode = (params.get('code') || '').trim();
        if (launchCode) {
          window.history.replaceState({}, '', '/driversportal');
        }
      } catch {
        launchCode = '';
      }

      if (launchCode) {
        try {
          const exchanged = await exchangePortalLaunchCode(launchCode);
          if (cancelled) return;
          setToken(exchanged.token);
          setProfile(exchanged.profile);
          populateForm(exchanged.profile);
          const bankList = await fetchSupportedBanks(exchanged.token);
          if (!cancelled) setBanks(bankList);
        } catch (err: any) {
          if (cancelled) return;
          setStoredPortalToken(null);
          setToken(null);
          setProfile(null);
          setAccessError(
            err?.message ||
              'This Drivers Portal link is invalid or expired. Please open Drivers Portal again from the Deliva Rider app sidebar.'
          );
        } finally {
          if (!cancelled) setLoadingProfile(false);
        }
        return;
      }

      const existingToken = getStoredPortalToken();
      if (!existingToken) {
        setToken(null);
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const [p, bankList] = await Promise.all([
          fetchDriverPortalProfile(existingToken),
          fetchSupportedBanks(existingToken),
        ]);
        if (cancelled) return;
        setToken(existingToken);
        setProfile(p);
        populateForm(p);
        setBanks(bankList);
      } catch (err: any) {
        if (cancelled) return;
        setStoredPortalToken(null);
        setToken(null);
        setProfile(null);
        if (err?.message !== 'SESSION_EXPIRED') {
          setAccessError(
            err?.message ||
              'Your Drivers Portal session expired. Please open Drivers Portal again from the Deliva Rider app sidebar.'
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    bootstrapPortal();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCloseSession = () => {
    setStoredPortalToken(null);
    setToken(null);
    setProfile(null);
    setDocs(EMPTY_DOCS);
    setUploadingDocs(EMPTY_UPLOADING);
    setDocErrors(EMPTY_DOC_ERRORS);
    setJustActivated(false);
    setSubmitError('');
    setBankVerifyMsg('');
    setAccessError('');
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
      setBankVerifyMsg(
        err?.message || 'Could not auto-verify account number; please check details.'
      );
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleDocumentChange = async (
    docConfig: RequiredDocConfig,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;

    setSubmitError('');
    setDocErrors((prev) => ({ ...prev, [docConfig.key]: '' }));

    if (file.size === 0) {
      setDocErrors((prev) => ({
        ...prev,
        [docConfig.key]: `${docConfig.label} file cannot be empty.`,
      }));
      return;
    }

    if (file.size > MAX_PORTAL_DOCUMENT_BYTES) {
      setDocErrors((prev) => ({
        ...prev,
        [docConfig.key]: `${docConfig.label} exceeds the 5 MB limit (${formatFileSize(file.size)} selected).`,
      }));
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [docConfig.key]: true }));
    try {
      const result = await uploadDriverPortalDocument(token, docConfig.key, file);
      setDocs((prev) => ({ ...prev, [docConfig.key]: result.document }));
      setProfile(result.profile);
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED') {
        setToken(null);
        setProfile(null);
        setAccessError(
          'Your Drivers Portal session expired. Please open Drivers Portal again from the Deliva Rider app sidebar.'
        );
      } else {
        setDocErrors((prev) => ({
          ...prev,
          [docConfig.key]: err?.message || `Failed to upload ${docConfig.label}.`,
        }));
      }
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docConfig.key]: false }));
    }
  };

  const isAnyDocUploading = Object.values(uploadingDocs).some(Boolean);

  const validatePortalForm = (): string | null => {
    if (phone.trim().length < 7) return 'Please enter a valid phone number.';
    if (!displayName.trim()) return 'Please enter your display name.';
    if (!licenseNumber.trim()) return 'Driver licence number is required.';
    const cleanExpiry = licenseExpiry.trim();
    if (!cleanExpiry) return 'Driver licence expiry date is required.';
    if (!isValidIsoDate(cleanExpiry)) {
      return 'Driver licence expiry date must be in YYYY-MM-DD format (e.g. 2028-12-31).';
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (cleanExpiry < todayIso) {
      return 'Driver licence expiry date cannot be in the past.';
    }

    if (!vehicleModel.trim()) return 'Vehicle model is required.';
    const yr = Number(vehicleYear.trim());
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(yr) || yr < 1980 || yr > maxYear) {
      return `Vehicle year must be between 1980 and ${maxYear}.`;
    }
    if (!vehiclePlate.trim()) return 'Vehicle number plate is required.';
    const seats = Number(vehicleSeats.trim());
    if (!Number.isInteger(seats) || seats < 1 || seats > 60) {
      return 'Vehicle seats must be between 1 and 60.';
    }

    if (isAnyDocUploading) {
      return 'Please wait for your document uploads to finish before submitting.';
    }

    const nextDocErrors: PortalDocErrorsMap = { ...EMPTY_DOC_ERRORS };
    let firstDocErr: string | null = null;
    for (const cfg of REQUIRED_DOCUMENTS) {
      if (!docs[cfg.key]?.url) {
        const msg = `${cfg.label} upload is required.`;
        nextDocErrors[cfg.key] = msg;
        if (!firstDocErr) firstDocErr = msg;
      }
    }
    if (firstDocErr) {
      setDocErrors(nextDocErrors);
      return firstDocErr;
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
    if (!accountName.trim()) return 'Bank account holder name is required.';
    const cleanAccNum = accountNumber.replace(/\s+/g, '');
    if (cleanAccNum.length < 8) return 'A valid NUBAN / account number is required.';
    if (!bankName.trim()) return 'Bank name or BIC/SWIFT is required.';
    return null;
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitError('');

    const validationErr = validatePortalForm();
    if (validationErr) {
      setSubmitError(validationErr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CompleteDriverPortalPayload = {
        phone: phone.trim(),
        display_name: displayName.trim(),
        license_number: licenseNumber.trim(),
        license_expiry: licenseExpiry.trim(),
        road_worthiness_doc_url: docs.road_worthiness?.url || '',
        driving_licence_doc_url: docs.driving_licence?.url || '',
        mot_doc_url: docs.mot?.url || '',
        bike_licence_doc_url: docs.bike_licence?.url || '',
        road_worthiness_doc: docs.road_worthiness,
        driving_licence_doc: docs.driving_licence,
        mot_doc: docs.mot,
        bike_licence_doc: docs.bike_licence,
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        vehicle_year: Number(vehicleYear.trim()),
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        vehicle_seats: Number(vehicleSeats.trim()),
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
      if (err?.message === 'SESSION_EXPIRED') {
        setToken(null);
        setProfile(null);
        setAccessError(
          'Your Drivers Portal session expired. Please open Drivers Portal again from the Deliva Rider app sidebar.'
        );
      } else {
        setSubmitError(err?.message || 'Could not complete Driver Portal onboarding.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const isLockedActive = Boolean(profile?.portal_completed && profile?.is_activated);

  return (
    <main className="dp-page">
      <div className="dp-container">
        <div className="dp-page-head">
          <div>
            <h1 className="dp-title">Drivers Portal</h1>
            <p className="dp-subtitle">
              {isLockedActive
                ? 'Your driver portal has been submitted and your account is active.'
                : token && profile
                  ? 'Complete the fields and required document uploads below to activate your driver account.'
                  : 'Open this portal from the Deliva Rider mobile app to sign in automatically.'}
            </p>
          </div>

          {token && profile && (
            <div className="dp-session-actions">
              <span className={`dp-status-text${isLockedActive ? ' dp-status-active' : ''}`}>
                {isLockedActive ? 'Active' : 'Pending activation'}
              </span>
              <button
                type="button"
                className="dp-text-btn"
                onClick={handleCloseSession}
              >
                End session ({profile.email})
              </button>
            </div>
          )}
        </div>

        {loadingProfile ? (
          <div className="dp-panel dp-state-box">
            <div className="dp-spinner" aria-hidden="true" />
            <p className="dp-muted">Loading Drivers Portal session...</p>
          </div>
        ) : !token || !profile ? (
          <div className="dp-panel">
            <h2 className="dp-section-title">Sign in via Deliva Rider App</h2>
            <p className="dp-section-desc">
              Drivers Portal sessions are launched directly from your signed-in Deliva Rider mobile app.
            </p>

            {accessError && (
              <div className="dp-alert dp-alert-error" role="alert">
                {accessError}
              </div>
            )}

            <ol className="dp-steps-list">
              <li>Open the <strong>Deliva Rider</strong> mobile app and ensure you are signed in.</li>
              <li>Open the sidebar menu in the top-left corner.</li>
              <li>Tap <strong>Drivers Portal</strong> to open your authenticated onboarding session here.</li>
            </ol>
          </div>
        ) : (
          <form onSubmit={handleCompleteSubmit} className="dp-form" noValidate>
            {isLockedActive ? (
              <div className="dp-alert dp-alert-success" role="status">
                {justActivated
                  ? 'Your driver account is now active. Return to the Deliva Rider app and go online to receive offers.'
                  : 'Profile completed and locked. To request changes to locked details, contact support via the Deliva Rider app.'}
              </div>
            ) : (
              <div className="dp-alert dp-alert-info">
                Complete all required sections and upload all four compliance documents (max 5 MB each, any media format) to activate your account.
              </div>
            )}

            {submitError && (
              <div className="dp-alert dp-alert-error" role="alert">
                {submitError}
              </div>
            )}

            {/* 1. Profile */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Profile Details</h2>
                <p className="dp-section-desc">
                  NIN identity records are verified at registration and remain locked.
                </p>
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-first-name">
                    First name
                  </label>
                  <input
                    id="dp-first-name"
                    type="text"
                    className="dp-input dp-input-readonly"
                    value={profile.first_name || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-last-name">
                    Last name
                  </label>
                  <input
                    id="dp-last-name"
                    type="text"
                    className="dp-input dp-input-readonly"
                    value={profile.last_name || ''}
                    readOnly
                    disabled
                  />
                </div>

                {profile.middle_name && (
                  <div className="dp-field">
                    <label className="dp-label" htmlFor="dp-middle-name">
                      Middle name
                    </label>
                    <input
                      id="dp-middle-name"
                      type="text"
                      className="dp-input dp-input-readonly"
                      value={profile.middle_name}
                      readOnly
                      disabled
                    />
                  </div>
                )}

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-nin">
                    NIN
                  </label>
                  <input
                    id="dp-nin"
                    type="text"
                    className="dp-input dp-input-readonly"
                    value={maskNin(profile.nin)}
                    readOnly
                    disabled
                  />
                </div>

                {profile.date_of_birth && (
                  <div className="dp-field">
                    <label className="dp-label" htmlFor="dp-dob">
                      Date of birth
                    </label>
                    <input
                      id="dp-dob"
                      type="text"
                      className="dp-input dp-input-readonly"
                      value={profile.date_of_birth}
                      readOnly
                      disabled
                    />
                  </div>
                )}

                {profile.gender && (
                  <div className="dp-field">
                    <label className="dp-label" htmlFor="dp-gender">
                      Gender
                    </label>
                    <input
                      id="dp-gender"
                      type="text"
                      className="dp-input dp-input-readonly"
                      value={profile.gender}
                      readOnly
                      disabled
                    />
                  </div>
                )}

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-email">
                    Email
                  </label>
                  <input
                    id="dp-email"
                    type="email"
                    className="dp-input dp-input-readonly"
                    value={profile.email || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-phone">
                    Phone <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-phone"
                    type="tel"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field dp-col-span-2">
                  <label className="dp-label" htmlFor="dp-display-name">
                    Display name <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-display-name"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Name shown to customers"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 2. Driver Licence */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Driver Licence Details</h2>
                <p className="dp-section-desc">
                  Enter your licence number and expiration date.
                </p>
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-license-num">
                    Driver licence number <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-license-num"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. ABC123456AA"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-license-exp">
                    Driver licence expiry date <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-license-exp"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="YYYY-MM-DD"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                  {!isLockedActive && (
                    <span className="dp-hint">Format: YYYY-MM-DD (e.g. 2028-12-31)</span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Mandatory Compliance Document Uploads */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Required Document Uploads</h2>
                <p className="dp-section-desc">
                  All four documents are required. Any media format is accepted (max 5 MB per file).
                </p>
              </div>

              <div className="dp-grid">
                {REQUIRED_DOCUMENTS.map((docCfg) => {
                  const uploaded = docs[docCfg.key];
                  const isUploading = uploadingDocs[docCfg.key];
                  const fieldErr = docErrors[docCfg.key];
                  const viewHref = uploaded?.url ? resolvePortalMediaUrl(uploaded.url) : '';

                  return (
                    <div className="dp-field dp-col-span-2" key={docCfg.key}>
                      <label className="dp-label" htmlFor={`dp-doc-${docCfg.key}`}>
                        {docCfg.label} <span className="dp-req">*</span>
                      </label>

                      <div
                        className={`dp-file-input-row${fieldErr ? ' dp-file-input-error' : ''}${
                          isLockedActive ? ' dp-input-readonly' : ''
                        }`}
                      >
                        <input
                          ref={(el) => {
                            fileInputRefs.current[docCfg.key] = el;
                          }}
                          id={`dp-doc-${docCfg.key}`}
                          type="file"
                          className="dp-file-native"
                          disabled={isLockedActive || isUploading}
                          onChange={(e) => handleDocumentChange(docCfg, e)}
                        />

                        <div className="dp-file-meta">
                          {isUploading ? (
                            <span className="dp-file-placeholder">Uploading file...</span>
                          ) : uploaded ? (
                            <span className="dp-file-name" title={uploaded.file_name || uploaded.url}>
                              {uploaded.file_name || docCfg.label}
                              {uploaded.size_bytes
                                ? ` (${formatFileSize(uploaded.size_bytes)})`
                                : ''}
                            </span>
                          ) : (
                            <span className="dp-file-placeholder">
                              No file chosen (max 5 MB, all media types)
                            </span>
                          )}
                        </div>

                        <div className="dp-file-actions">
                          {viewHref && !isUploading && (
                            <a
                              href={viewHref}
                              target="_blank"
                              rel="noreferrer"
                              className="dp-file-view-link"
                            >
                              View file
                            </a>
                          )}

                          {!isLockedActive && (
                            <button
                              type="button"
                              className="dp-file-pick-btn"
                              disabled={isUploading}
                              onClick={() => fileInputRefs.current[docCfg.key]?.click()}
                            >
                              {isUploading
                                ? 'Uploading...'
                                : uploaded
                                  ? 'Replace file'
                                  : 'Choose file'}
                            </button>
                          )}
                        </div>
                      </div>

                      {fieldErr ? (
                        <span className="dp-field-error" role="alert">
                          {fieldErr}
                        </span>
                      ) : uploaded ? (
                        <span className="dp-field-success">
                          Uploaded{uploaded.content_type ? ` • ${uploaded.content_type}` : ''}
                        </span>
                      ) : (
                        <span className="dp-hint">Required • Maximum file size: 5 MB</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. Vehicle */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Vehicle Information</h2>
                <p className="dp-section-desc">
                  Details of the dispatch vehicle linked to your driver account.
                </p>
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-type">
                    Vehicle category <span className="dp-req">*</span>
                  </label>
                  <select
                    id="dp-vehicle-type"
                    className={`dp-select${isLockedActive ? ' dp-input-readonly' : ''}`}
                    value={vehicleType}
                    disabled={isLockedActive}
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

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-model">
                    Vehicle model <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-model"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. Bajaj Boxer 150 / Toyota Corolla"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-year">
                    Year <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-year"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. 2022"
                    value={vehicleYear}
                    onChange={(e) =>
                      setVehicleYear(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-plate">
                    Number plate <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-plate"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. KJA-123AB"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-seats">
                    Seats <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-seats"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. 1"
                    value={vehicleSeats}
                    onChange={(e) =>
                      setVehicleSeats(e.target.value.replace(/\D/g, '').slice(0, 2))
                    }
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 5. Billing Information */}
            <section className="dp-section">
              <div className="dp-section-head dp-section-head-row">
                <div>
                  <h2 className="dp-section-title">Billing Information</h2>
                  <p className="dp-section-desc">
                    Appears on statements and invoices issued to you.
                  </p>
                </div>
                {!isLockedActive && (
                  <button
                    type="button"
                    className="dp-secondary-btn"
                    onClick={handleFillBillingFromProfile}
                  >
                    Auto-fill from profile
                  </button>
                )}
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-billing-company">
                    Company name <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-billing-company"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Your name or business name"
                    value={billingCompanyName}
                    onChange={(e) => setBillingCompanyName(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-billing-email">
                    Company email <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-billing-email"
                    type="email"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="billing@example.com"
                    value={billingCompanyEmail}
                    onChange={(e) => setBillingCompanyEmail(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field dp-col-span-2">
                  <label className="dp-label" htmlFor="dp-billing-address">
                    Address <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-billing-address"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Street address, City, State"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-billing-reg">
                    Reg. code <span className="dp-optional">(Optional)</span>
                  </label>
                  <input
                    id="dp-billing-reg"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="CAC / BN / RC number"
                    value={billingRegCode}
                    onChange={(e) => setBillingRegCode(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-billing-vat">
                    VAT no. <span className="dp-optional">(Optional)</span>
                  </label>
                  <input
                    id="dp-billing-vat"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="VAT or TIN number"
                    value={billingVatNumber}
                    onChange={(e) => setBillingVatNumber(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                  />
                </div>
              </div>
            </section>

            {/* 6. Invoice Issuer Information */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Invoice Issuer Information</h2>
                <p className="dp-section-desc">
                  Appears on receipts and invoices sent to clients.
                </p>
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-issuer-type">
                    Type <span className="dp-req">*</span>
                  </label>
                  <select
                    id="dp-issuer-type"
                    className={`dp-select${isLockedActive ? ' dp-input-readonly' : ''}`}
                    value={invoiceIssuerType}
                    disabled={isLockedActive}
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

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-issuer-name">
                    Name <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-issuer-name"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Full name or legal entity name"
                    value={invoiceIssuerName}
                    onChange={(e) => setInvoiceIssuerName(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field dp-col-span-2">
                  <label className="dp-label" htmlFor="dp-issuer-address">
                    Address <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-issuer-address"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Issuer street address, City, State"
                    value={invoiceIssuerAddress}
                    onChange={(e) => setInvoiceIssuerAddress(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-issuer-reg">
                    Reg. code{' '}
                    {invoiceIssuerType === 'Private' ? (
                      <span className="dp-optional">(Optional)</span>
                    ) : (
                      <span className="dp-req">*</span>
                    )}
                  </label>
                  <input
                    id="dp-issuer-reg"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Registration code"
                    value={invoiceIssuerRegCode}
                    onChange={(e) => setInvoiceIssuerRegCode(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required={invoiceIssuerType === 'Company'}
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-issuer-vat">
                    VAT no. <span className="dp-optional">(Optional)</span>
                  </label>
                  <input
                    id="dp-issuer-vat"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="VAT number"
                    value={invoiceIssuerVatNumber}
                    onChange={(e) => setInvoiceIssuerVatNumber(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                  />
                </div>
              </div>
            </section>

            {/* 7. Payout Account Information */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Payout Account Information</h2>
                <p className="dp-section-desc">
                  Bank account details used to disburse your driver payouts.
                </p>
              </div>

              <div className="dp-grid">
                {!isLockedActive && banks.length > 0 && (
                  <div className="dp-field dp-col-span-2">
                    <label className="dp-label" htmlFor="dp-bank-select">
                      Select bank <span className="dp-optional">(Optional)</span>
                    </label>
                    <select
                      id="dp-bank-select"
                      className="dp-select"
                      value={bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setBankCode(code);
                        const found = banks.find((b) => b.code === code);
                        if (found) setBankName(found.name);
                      }}
                    >
                      <option value="">Select bank from list</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-bank-name">
                    Bank name or BIC/SWIFT <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-bank-name"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. Access Bank or ABNGNGLA"
                    value={bankName}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
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

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-nuban">
                    NUBAN / Account number <span className="dp-req">*</span>
                  </label>
                  <div className="dp-input-action-row">
                    <input
                      id="dp-nuban"
                      type="text"
                      inputMode="numeric"
                      className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                      placeholder="10-digit NUBAN or account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      readOnly={isLockedActive}
                      disabled={isLockedActive}
                      required
                    />
                    {!isLockedActive && bankCode && accountNumber.trim().length >= 10 && (
                      <button
                        type="button"
                        className="dp-secondary-btn dp-verify-btn"
                        onClick={handleVerifyNuban}
                        disabled={verifyingBank}
                      >
                        {verifyingBank ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  {bankVerifyMsg && <span className="dp-hint">{bankVerifyMsg}</span>}
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-holder-name">
                    Account holder name <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-holder-name"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Exact account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-transit">
                    Transit number <span className="dp-optional">(Optional)</span>
                  </label>
                  <input
                    id="dp-transit"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Leave blank if not applicable"
                    value={transitNumber}
                    onChange={(e) => setTransitNumber(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                  />
                </div>
              </div>
            </section>

            {!isLockedActive && (
              <div className="dp-submit-row">
                <button
                  type="submit"
                  className="dp-submit-btn"
                  disabled={submitting || isAnyDocUploading}
                >
                  {submitting
                    ? 'Submitting...'
                    : isAnyDocUploading
                      ? 'Waiting for file upload...'
                      : 'Complete Portal & Activate Account'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
};
