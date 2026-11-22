import React, { useEffect, useRef, useState } from 'react';
import {
  completeDriverPortal,
  exchangePortalLaunchCode,
  fetchDriverPortalProfile,
  getStoredPortalToken,
  MAX_PORTAL_DOCUMENT_BYTES,
  resolvePortalMediaUrl,
  setStoredPortalToken,
  uploadDriverPortalDocument,
} from '../lib/driverPortalService';
import type {
  CompleteDriverPortalPayload,
  DocumentUploadHints,
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
  authority: string;
  description: string;
  serialPlaceholder: string;
}

const REQUIRED_DOCUMENTS: RequiredDocConfig[] = [
  {
    key: 'road_worthiness',
    label: 'National Certificate of Roadworthiness',
    authority: 'Federal Republic of Nigeria • Vehicle Inspection Office (VIO)',
    description:
      'Yellow VIO Roadworthiness Certificate & Road Worthiness Tag showing Certificate No., Issue & Expiry Date, Plate, Engine & Chassis No.',
    serialPlaceholder: 'e.g. 954893 or REC-20261019-5CD05',
  },
  {
    key: 'vehicle_inspection',
    label: 'Computerized Vehicle Inspection Referral Note',
    authority: 'Ministry of Transport • Computerized Vehicle Inspection Service',
    description:
      'Ministry of Transport Computerized Vehicle Inspection Referral slip showing Transaction Date, Veh. Reg. No., and REC receipt code.',
    serialPlaceholder: 'e.g. 20260324092803644 - REC-20261019-9EB24',
  },
  {
    key: 'proof_of_ownership',
    label: 'Proof of Ownership Certificate',
    authority: 'Uniform Licensing Scheme • State Motor Registry',
    description:
      'Pink Proof of Ownership Certificate & QR Sticker showing Serial No. (e.g. A0440899), 18-digit POC VID, Plate, Engine/Chassis, and Expiry.',
    serialPlaceholder: 'e.g. A0440899 / POC VID 639280124551224467',
  },
  {
    key: 'hackney_permit',
    label: 'Hackney Permit (Commercial Motorcycle)',
    authority: 'State Motor Registry • Commercial Transport Permit',
    description:
      'Commercial Motorcycle Hackney Permit showing Serial No. (e.g. A1029647), 17-digit AutoReg PIN, File Number, Issue & Expiry Date.',
    serialPlaceholder: 'e.g. A1029647 / PIN 50566202632763806',
  },
  {
    key: 'bike_licence',
    label: 'Vehicle License / Bike Licence (Commercial Motorcycle)',
    authority: 'State Motor Registry • Commercial Vehicle License',
    description:
      'Commercial Motorcycle Vehicle License showing Serial No. (e.g. A1029646), 17-digit AutoReg PIN, File Number, Issue & Expiry Date.',
    serialPlaceholder: 'e.g. A1029646 / PIN 50566202632763806',
  },
  {
    key: 'mot',
    label: 'MOT Courier Card / Permit (Ministry of Transport)',
    authority: 'State Ministry of Transport • Courier Permit',
    description:
      'Ministry of Transport MOT Courier Card/Permit showing S/NO (e.g. RSCR/428749), Holder Name, D.O.B., Reg. Date & Exp. Date.',
    serialPlaceholder: 'e.g. RSCR/428749',
  },
];

type PortalDocsMap = Record<PortalDocumentType, PortalDocumentFile | null>;
type PortalDocFlagsMap = Record<PortalDocumentType, boolean>;
type PortalDocErrorsMap = Record<PortalDocumentType, string>;
type PortalDocHintsMap = Record<PortalDocumentType, DocumentUploadHints>;

const EMPTY_DOCS: PortalDocsMap = {
  road_worthiness: null,
  vehicle_inspection: null,
  proof_of_ownership: null,
  hackney_permit: null,
  bike_licence: null,
  mot: null,
  driving_licence: null,
};

const EMPTY_UPLOADING: PortalDocFlagsMap = {
  road_worthiness: false,
  vehicle_inspection: false,
  proof_of_ownership: false,
  hackney_permit: false,
  bike_licence: false,
  mot: false,
  driving_licence: false,
};

const EMPTY_DOC_ERRORS: PortalDocErrorsMap = {
  road_worthiness: '',
  vehicle_inspection: '',
  proof_of_ownership: '',
  hackney_permit: '',
  bike_licence: '',
  mot: '',
  driving_licence: '',
};

const EMPTY_HINTS: PortalDocHintsMap = {
  road_worthiness: {},
  vehicle_inspection: {},
  proof_of_ownership: {},
  hackney_permit: {},
  bike_licence: {},
  mot: {},
  driving_licence: {},
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
    const status = (docObj?.verification_status || '').toLowerCase();
    if (!resolvedUrl && status !== 'rejected') return null;
    return {
      ...docObj,
      url: resolvedUrl,
      file_name: resolvedUrl ? docObj?.file_name || fallbackName : '',
    };
  };

  return {
    road_worthiness: resolveDoc(
      p.road_worthiness_doc,
      p.road_worthiness_doc_url,
      'National Certificate of Roadworthiness'
    ),
    vehicle_inspection: resolveDoc(
      p.vehicle_inspection_doc,
      p.vehicle_inspection_doc_url,
      'Computerized Vehicle Inspection Referral Note'
    ),
    proof_of_ownership: resolveDoc(
      p.proof_of_ownership_doc,
      p.proof_of_ownership_doc_url,
      'Proof of Ownership Certificate'
    ),
    hackney_permit: resolveDoc(
      p.hackney_permit_doc,
      p.hackney_permit_doc_url,
      'Hackney Permit (Commercial Motorcycle)'
    ),
    bike_licence: resolveDoc(
      p.bike_licence_doc,
      p.bike_licence_doc_url,
      'Vehicle License / Bike Licence'
    ),
    mot: resolveDoc(
      p.mot_doc,
      p.mot_doc_url,
      'MOT Courier Card / Permit'
    ),
    driving_licence: resolveDoc(
      p.driving_licence_doc,
      p.driving_licence_doc_url,
      'Driving Licence'
    ),
  };
}

export const DriversPortalPage: React.FC<DriversPortalPageProps> = () => {
  const [token, setToken] = useState<string | null>(() => getStoredPortalToken());
  const [profile, setProfile] = useState<DriverPortalProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
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
  const [vehicleEngineNumber, setVehicleEngineNumber] = useState('');
  const [vehicleChassisNumber, setVehicleChassisNumber] = useState('');

  const [docs, setDocs] = useState<PortalDocsMap>(EMPTY_DOCS);
  const [uploadingDocs, setUploadingDocs] = useState<PortalDocFlagsMap>(EMPTY_UPLOADING);
  const [docErrors, setDocErrors] = useState<PortalDocErrorsMap>(EMPTY_DOC_ERRORS);
  const [docHints, setDocHints] = useState<PortalDocHintsMap>(EMPTY_HINTS);
  const [expandedProofs, setExpandedProofs] = useState<PortalDocFlagsMap>(EMPTY_UPLOADING);
  const [expandedHintInputs, setExpandedHintInputs] = useState<PortalDocFlagsMap>(EMPTY_UPLOADING);
  const fileInputRefs = useRef<Partial<Record<PortalDocumentType, HTMLInputElement | null>>>({});

  const [billingCompanyName, setBillingCompanyName] = useState('');
  const [billingCompanyEmail, setBillingCompanyEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingRegCode, setBillingRegCode] = useState('');
  const [billingVatNumber, setBillingVatNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [justActivated, setJustActivated] = useState(false);

  const populateForm = (p: DriverPortalProfile) => {
    setPhone(p.phone || '');
    setDisplayName(
      p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
    );
    setLicenseNumber(p.license_number || '');
    setLicenseExpiry(p.next_document_expiry || p.license_expiry || '');
    const vType = (p.vehicle_type || 'bike').toLowerCase();
    setVehicleType(vType);
    setVehicleModel(p.vehicle_model || p.vehicle_make || '');
    setVehicleYear(p.vehicle_year ? String(p.vehicle_year) : '');
    setVehiclePlate(p.vehicle_plate || '');
    setVehicleSeats(
      p.vehicle_seats ? String(p.vehicle_seats) : vType === 'bike' ? '1' : '4'
    );
    setVehicleEngineNumber(p.vehicle_engine_number || '');
    setVehicleChassisNumber(p.vehicle_chassis_number || '');

    setDocs(hydratePortalDocs(p));

    setBillingCompanyName(p.billing_company_name || '');
    setBillingCompanyEmail(p.billing_company_email || '');
    setBillingAddress(p.billing_address || '');
    setBillingRegCode(p.billing_reg_code || '');
    setBillingVatNumber(p.billing_vat_number || '');
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
        const p = await fetchDriverPortalProfile(existingToken);
        if (cancelled) return;
        setToken(existingToken);
        setProfile(p);
        populateForm(p);
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
    setAccessError('');
  };

  const handleFillBillingFromProfile = () => {
    if (!profile) return;
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    if (!billingCompanyName.trim()) setBillingCompanyName(fullName);
    if (!billingCompanyEmail.trim()) setBillingCompanyEmail(profile.email || '');
  };

  const updateDocHint = (
    docType: PortalDocumentType,
    field: keyof DocumentUploadHints,
    value: string
  ) => {
    setDocHints((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        [field]: value,
      },
    }));
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
      // Only forward explicit hints entered for this specific document slot so form inputs
      // never override optical extraction from the paper or card itself.
      const slotHints: DocumentUploadHints = {
        ...docHints[docConfig.key],
      };
      const result = await uploadDriverPortalDocument(token, docConfig.key, file, slotHints);
      setDocs((prev) => ({ ...prev, [docConfig.key]: result.document }));
      setProfile(result.profile);

      // Sync extracted document identifiers cleanly without overwriting with unrelated doc numbers
      const extractedExp =
        result.profile.next_document_expiry ||
        result.document.extracted_expiry_date ||
        '';
      if (extractedExp) {
        setLicenseExpiry(extractedExp);
      }
      if (
        (docConfig.key === 'mot' || docConfig.key === 'driving_licence') &&
        result.document.document_number &&
        !licenseNumber.trim()
      ) {
        setLicenseNumber(result.document.document_number);
      }
      if (result.document.extracted_plate && !vehiclePlate.trim()) {
        setVehiclePlate(result.document.extracted_plate);
      }
      if (result.document.extracted_vehicle_make && !vehicleModel.trim()) {
        setVehicleModel(result.document.extracted_vehicle_make);
      }
      if (result.document.extracted_engine_number && !vehicleEngineNumber.trim()) {
        setVehicleEngineNumber(result.document.extracted_engine_number);
      }
      if (result.document.extracted_chassis_number && !vehicleChassisNumber.trim()) {
        setVehicleChassisNumber(result.document.extracted_chassis_number);
      }
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
          [docConfig.key]:
            err?.message || `Failed to verify and upload ${docConfig.label}.`,
        }));
      }
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docConfig.key]: false }));
    }
  };

  const isAnyDocUploading = Object.values(uploadingDocs).some(Boolean);

  // Determine lock and renewal status:
  // - If expiry_locked is true (on or after the day a certificate expires), the portal is locked
  //   until the driver uploads a new document and it passes verification.
  // - If expiry_warning_active is true (within 30 days / 1 month before expiry), daily notifications
  //   are active and the renewal upload slot is unlocked.
  const isExpiryLocked = Boolean(profile?.expiry_locked);
  const isExpiryWarning = Boolean(profile?.expiry_warning_active);
  const rejectedDocCount = REQUIRED_DOCUMENTS.filter((cfg) => {
    const d = docs[cfg.key];
    return (d?.verification_status || d?.verification?.status || '').toLowerCase() === 'rejected';
  }).length;
  const isPendingAgentApproval = Boolean(
    profile?.portal_completed && !profile?.is_activated && !isExpiryLocked
  );
  const isRenewalMode = isExpiryLocked || isExpiryWarning || rejectedDocCount > 0;
  const isLockedActive = Boolean(
    profile?.portal_completed && profile?.is_activated && !isExpiryLocked && !isExpiryWarning
  );

  // Check if a specific document slot is unlocked for upload/renewal/re-upload after rejection
  const isDocSlotUnlocked = (docKey: PortalDocumentType): boolean => {
    if (!profile?.portal_completed) return true;
    if (isExpiryLocked || isExpiryWarning) return true;
    const d = docs[docKey];
    if (!d?.url) return true;
    const st = (d.verification_status || d.verification?.status || '').toLowerCase();
    if (st === 'rejected' || st === 'expired') return true;
    if (typeof d.days_until_expiry === 'number' && d.days_until_expiry <= 30) return true;
    return false;
  };

  const validatePortalForm = (): string | null => {
    if (phone.trim().length < 7) return 'Please enter a valid phone number.';
    if (!displayName.trim()) return 'Please enter your display name.';
    if (!licenseNumber.trim()) return 'Driver licence / permit number is required.';

    if (isAnyDocUploading) {
      return 'Please wait for your document uploads and verification to finish before submitting.';
    }

    const nextDocErrors: PortalDocErrorsMap = { ...EMPTY_DOC_ERRORS };
    let firstDocErr: string | null = null;
    for (const cfg of REQUIRED_DOCUMENTS) {
      const uploaded = docs[cfg.key];
      if (!uploaded?.url) {
        const msg = `${cfg.label} upload is required.`;
        nextDocErrors[cfg.key] = msg;
        if (!firstDocErr) firstDocErr = msg;
      } else if (uploaded.verification_status === 'expired' || (typeof uploaded.days_until_expiry === 'number' && uploaded.days_until_expiry <= 0)) {
        const msg = `${cfg.label} has expired (${uploaded.extracted_expiry_date}). Please upload a renewed document.`;
        nextDocErrors[cfg.key] = msg;
        if (!firstDocErr) firstDocErr = msg;
      }
    }
    if (firstDocErr) {
      setDocErrors(nextDocErrors);
      return firstDocErr;
    }

    const cleanExpiry = licenseExpiry.trim();
    if (cleanExpiry) {
      if (!isValidIsoDate(cleanExpiry)) {
        return 'Extracted licence expiry date must be in YYYY-MM-DD format (e.g. 2027-03-26).';
      }
      const todayIso = new Date().toISOString().slice(0, 10);
      if (cleanExpiry < todayIso) {
        return 'Licence expiry date cannot be in the past. Please upload a valid renewed certificate.';
      }
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

    if (!billingCompanyName.trim()) return 'Billing company name is required.';
    if (!billingCompanyEmail.includes('@') || !billingCompanyEmail.includes('.')) {
      return 'Please enter a valid billing company email.';
    }
    if (!billingAddress.trim()) return 'Billing address is required.';
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
        vehicle_inspection_doc_url: docs.vehicle_inspection?.url || '',
        proof_of_ownership_doc_url: docs.proof_of_ownership?.url || '',
        hackney_permit_doc_url: docs.hackney_permit?.url || '',
        driving_licence_doc_url: docs.driving_licence?.url || '',
        mot_doc_url: docs.mot?.url || '',
        bike_licence_doc_url: docs.bike_licence?.url || '',
        road_worthiness_doc: docs.road_worthiness,
        vehicle_inspection_doc: docs.vehicle_inspection,
        proof_of_ownership_doc: docs.proof_of_ownership,
        hackney_permit_doc: docs.hackney_permit,
        driving_licence_doc: docs.driving_licence,
        mot_doc: docs.mot,
        bike_licence_doc: docs.bike_licence,
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        vehicle_year: Number(vehicleYear.trim()),
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        vehicle_seats: Number(vehicleSeats.trim()),
        vehicle_engine_number: vehicleEngineNumber.trim().toUpperCase(),
        vehicle_chassis_number: vehicleChassisNumber.trim().toUpperCase(),
        billing_company_name: billingCompanyName.trim(),
        billing_company_email: billingCompanyEmail.trim(),
        billing_address: billingAddress.trim(),
        billing_reg_code: billingRegCode.trim(),
        billing_vat_number: billingVatNumber.trim(),
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

  return (
    <main className="dp-page">
      <div className="dp-container">
        <div className="dp-page-head">
          <div>
            <h1 className="dp-title">Drivers Portal</h1>
            <p className="dp-subtitle">
              {isExpiryLocked
                ? 'Your account is locked due to an expired compliance document. Upload a renewed document below for agent review and approval.'
                : rejectedDocCount > 0
                  ? `${rejectedDocCount} document(s) require re-upload. Review the agent feedback below and upload updated files.`
                  : isPendingAgentApproval
                    ? 'Your documentation has been submitted and is currently awaiting Deliva operations agent approval.'
                    : isExpiryWarning
                      ? `Renewal reminder: Your ${profile?.next_expiring_doc_label || 'compliance document'} expires on ${profile?.next_document_expiry || profile?.license_expiry}. Upload your renewed document before expiry to avoid lockout.`
                      : isLockedActive
                        ? 'Your driver portal has been reviewed, approved, and your account is active.'
                        : token && profile
                          ? 'Upload your six compliance documents and submit them for Deliva agent review and activation.'
                          : 'Open this portal from the Deliva Rider mobile app to sign in automatically.'}
            </p>
          </div>

          {token && profile && (
            <div className="dp-session-actions">
              <span
                className={`dp-status-text${
                  isExpiryLocked || rejectedDocCount > 0
                    ? ' dp-status-expired'
                    : isExpiryWarning || isPendingAgentApproval
                      ? ' dp-status-warning'
                      : isLockedActive
                        ? ' dp-status-active'
                        : ''
                }`}
              >
                {isExpiryLocked
                  ? 'Locked — Document Expired'
                  : rejectedDocCount > 0
                    ? 'Action Needed — Document Rejected'
                    : isPendingAgentApproval
                      ? 'Pending Agent Approval'
                      : isExpiryWarning
                        ? `Expiring in ${profile.days_until_next_expiry ?? 0} day(s)`
                        : isLockedActive
                          ? 'Active & Approved'
                          : 'Pending submission'}
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
            {isExpiryLocked ? (
              <div className="dp-alert dp-alert-error" role="alert">
                <strong>Portal Locked — Licence / Certificate Expired:</strong> Your{' '}
                <strong>{profile.next_expiring_doc_label || 'compliance document'}</strong> expired on{' '}
                <strong>{profile.next_document_expiry || profile.license_expiry}</strong>. Your dispatch
                access is locked until you upload a valid renewed document below and an agent approves it.
              </div>
            ) : rejectedDocCount > 0 ? (
              <div className="dp-alert dp-alert-error" role="alert">
                <strong>Re-upload Required:</strong> One or more submitted documents were rejected during
                agent review. Upload corrected file(s) in the unlocked slot(s) below and re-submit for
                approval.
              </div>
            ) : profile?.portal_completed &&
              !profile?.is_activated &&
              profile?.ai_comparison &&
              !profile.ai_comparison.passed &&
              profile.ai_comparison.status === 'mismatch' ? (
              <div className="dp-alert dp-alert-error" role="alert">
                <strong>AI Document Comparison Mismatch — Account Pending Correction:</strong>{' '}
                {profile.ai_comparison.summary}
                {profile.ai_comparison.mismatches && profile.ai_comparison.mismatches.length > 0 && (
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    {profile.ai_comparison.mismatches.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : isPendingAgentApproval ? (
              <div className="dp-alert dp-alert-warning" role="status">
                <strong>Submitted — Awaiting Agent Acceptance:</strong> All submitted certificates are now in
                the Deliva operations queue. Once agents accept every document, AI will compare your details
                and activate your rider account.
              </div>
            ) : isExpiryWarning ? (
              <div className="dp-alert dp-alert-warning" role="status">
                <strong>1-Month Expiry Auto-Notification Active:</strong> Your{' '}
                <strong>{profile.next_expiring_doc_label || 'compliance document'}</strong> expires on{' '}
                <strong>{profile.next_document_expiry || profile.license_expiry}</strong> (
                {profile.days_until_next_expiry} day
                {profile.days_until_next_expiry === 1 ? '' : 's'} remaining). Our system sends daily
                notifications until you upload a renewed document. On the day of expiry, your portal will
                lock automatically.
              </div>
            ) : isLockedActive ? (
              <div className="dp-alert dp-alert-success" role="status">
                {justActivated
                  ? 'Documentation submitted successfully and is awaiting Deliva operations agent approval.'
                  : `Profile approved and active. Nearest recorded certificate expiry: ${
                      profile.next_document_expiry || profile.license_expiry || 'On file'
                    }. You will be auto-notified 30 days before expiry.`}
              </div>
            ) : (
              <div className="dp-alert dp-alert-info">
                Upload all six required compliance certificates below (max 5 MB each) and complete your
                portal submission. Deliva operations agents will inspect and accept each certificate, after
                which AI will cross-check your details and activate your rider account.
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
                  NIN identity records are verified at registration and cross-checked against your uploaded certificates.
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

            {/* 2. Mandatory Compliance Document Uploads & Authenticity Verification */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">
                  Required Licences & Compliance Certificates
                </h2>
                <p className="dp-section-desc">
                  Upload all six required documents below (max 5 MB per file). All submitted files are
                  reviewed by a Deliva support agent before your rider account is activated.
                </p>
              </div>

              <div className="dp-doc-list">
                {REQUIRED_DOCUMENTS.map((docCfg) => {
                  const uploaded = docs[docCfg.key];
                  const isUploading = uploadingDocs[docCfg.key];
                  const fieldErr = docErrors[docCfg.key];
                  const viewHref = uploaded?.url ? resolvePortalMediaUrl(uploaded.url) : '';
                  const slotUnlocked = isDocSlotUnlocked(docCfg.key);
                  const verification = uploaded?.verification;
                  const isProofExpanded = Boolean(expandedProofs[docCfg.key]);
                  const isHintExpanded = Boolean(expandedHintInputs[docCfg.key]);
                  const docStatus = (
                    uploaded?.verification_status ||
                    verification?.status ||
                    (uploaded?.verified ? 'verified' : uploaded?.url ? 'pending_review' : '')
                  ).toLowerCase();
                  const rejectionReason =
                    (uploaded as any)?.rejection_reason || verification?.rejection_reason || '';

                  return (
                    <div
                      className={`dp-doc-card${
                        docStatus === 'expired' || docStatus === 'rejected'
                          ? ' dp-doc-card-expired'
                          : docStatus === 'expiring_soon' || docStatus === 'pending_review'
                            ? ' dp-doc-card-warning'
                            : uploaded?.verified || docStatus === 'verified'
                              ? ' dp-doc-card-verified'
                              : ''
                      }`}
                      key={docCfg.key}
                    >
                      <div className="dp-doc-card-head">
                        <div>
                          <label className="dp-label" htmlFor={`dp-doc-${docCfg.key}`}>
                            {docCfg.label} <span className="dp-req">*</span>
                          </label>
                          <p className="dp-doc-authority">{docCfg.authority}</p>
                          <p className="dp-doc-desc">{docCfg.description}</p>
                        </div>

                        {uploaded && (
                          <div className="dp-doc-badges">
                            <span
                              className={`dp-verify-badge${
                                docStatus === 'expired' || docStatus === 'rejected'
                                  ? ' dp-verify-badge-expired'
                                  : docStatus === 'expiring_soon' || docStatus === 'pending_review'
                                    ? ' dp-verify-badge-warning'
                                    : ' dp-verify-badge-ok'
                              }`}
                            >
                              {docStatus === 'expired'
                                ? 'Expired — Renewal Required'
                                : docStatus === 'rejected'
                                  ? 'Rejected — Re-upload Required'
                                  : docStatus === 'expiring_soon'
                                    ? `Expiring Soon (${uploaded.days_until_expiry ?? 0}d left)`
                                    : uploaded.verified || docStatus === 'verified'
                                      ? 'Approved'
                                      : 'Pending Agent Approval'}
                            </span>
                          </div>
                        )}
                      </div>

                      {docStatus === 'rejected' && rejectionReason && (
                        <div className="dp-alert dp-alert-error" style={{ marginBottom: 10 }}>
                          <strong>Agent Review Note:</strong> {rejectionReason}
                        </div>
                      )}

                      {slotUnlocked && (
                        <div className="dp-doc-hints-toggle-row">
                          <button
                            type="button"
                            className="dp-link-toggle-btn"
                            onClick={() =>
                              setExpandedHintInputs((prev) => ({
                                ...prev,
                                [docCfg.key]: !prev[docCfg.key],
                              }))
                            }
                          >
                            {isHintExpanded
                              ? 'Hide certificate details (auto-extracted on upload)'
                              : 'Enter / confirm certificate serial & expiry before upload (optional)'}
                          </button>
                        </div>
                      )}

                      {slotUnlocked && isHintExpanded && (
                        <div className="dp-doc-hints-grid">
                          <div className="dp-field">
                            <label className="dp-label">Certificate / Serial / S/NO</label>
                            <input
                              type="text"
                              className="dp-input"
                              placeholder={docCfg.serialPlaceholder}
                              value={docHints[docCfg.key]?.document_number || ''}
                              onChange={(e) =>
                                updateDocHint(docCfg.key, 'document_number', e.target.value)
                              }
                            />
                          </div>
                          <div className="dp-field">
                            <label className="dp-label">Issue / Reg. Date (Optional)</label>
                            <input
                              type="text"
                              className="dp-input"
                              placeholder="DD/MM/YYYY or YYYY-MM-DD"
                              value={docHints[docCfg.key]?.issue_date || ''}
                              onChange={(e) =>
                                updateDocHint(docCfg.key, 'issue_date', e.target.value)
                              }
                            />
                          </div>
                          <div className="dp-field">
                            <label className="dp-label">Expiry Date (Auto-extracted if blank)</label>
                            <input
                              type="text"
                              className="dp-input"
                              placeholder="e.g. 26/03/2027, 23/Jan/2027, OCT 2027"
                              value={docHints[docCfg.key]?.expiry_date || ''}
                              onChange={(e) =>
                                updateDocHint(docCfg.key, 'expiry_date', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div
                        className={`dp-file-input-row${fieldErr ? ' dp-file-input-error' : ''}${
                          !slotUnlocked ? ' dp-input-readonly' : ''
                        }`}
                      >
                        <input
                          ref={(el) => {
                            fileInputRefs.current[docCfg.key] = el;
                          }}
                          id={`dp-doc-${docCfg.key}`}
                          type="file"
                          className="dp-file-native"
                          disabled={!slotUnlocked || isUploading}
                          onChange={(e) => handleDocumentChange(docCfg, e)}
                        />

                        <div className="dp-file-meta">
                          {isUploading ? (
                            <span className="dp-file-placeholder">
                              Uploading file & extracting document metadata...
                            </span>
                          ) : uploaded?.url ? (
                            <span className="dp-file-name" title={uploaded.file_name || uploaded.url}>
                              {uploaded.file_name || docCfg.label}
                              {uploaded.size_bytes
                                ? ` (${formatFileSize(uploaded.size_bytes)})`
                                : ''}
                            </span>
                          ) : docStatus === 'rejected' ? (
                            <span className="dp-file-placeholder" style={{ color: '#B91C1C' }}>
                              Previous document was deleted — choose a clear new file (max 5 MB)
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

                          {slotUnlocked && (
                            <button
                              type="button"
                              className="dp-file-pick-btn"
                              disabled={isUploading}
                              onClick={() => fileInputRefs.current[docCfg.key]?.click()}
                            >
                              {isUploading
                                ? 'Uploading...'
                                : uploaded?.url
                                  ? docStatus === 'expired' || docStatus === 'expiring_soon'
                                    ? 'Upload Renewed Document'
                                    : 'Replace file'
                                  : docStatus === 'rejected'
                                    ? 'Upload New Document'
                                    : 'Choose file'}
                            </button>
                          )}
                        </div>
                      </div>

                      {fieldErr ? (
                        <span className="dp-field-error" role="alert">
                          {fieldErr}
                        </span>
                      ) : uploaded?.url ? (
                        <div className="dp-doc-extracted-summary">
                          <div className="dp-doc-extracted-items">
                            {uploaded.extracted_expiry_date && (
                              <span>
                                <strong>Extracted Expiry:</strong> {uploaded.extracted_expiry_date}
                                {typeof uploaded.days_until_expiry === 'number'
                                  ? uploaded.days_until_expiry > 0
                                    ? ` (${uploaded.days_until_expiry} days left)`
                                    : ' (Expired)'
                                  : ''}
                              </span>
                            )}
                            {uploaded.extracted_issue_date && (
                              <span>
                                <strong>Issued:</strong> {uploaded.extracted_issue_date}
                              </span>
                            )}
                            {uploaded.extracted_owner_name && (
                              <span>
                                <strong>Owner:</strong> {uploaded.extracted_owner_name}
                              </span>
                            )}
                            {uploaded.extracted_date_of_birth && (
                              <span>
                                <strong>D.O.B.:</strong> {uploaded.extracted_date_of_birth}
                              </span>
                            )}
                            {uploaded.extracted_gender && (
                              <span>
                                <strong>Gender:</strong> {uploaded.extracted_gender}
                              </span>
                            )}
                            {uploaded.document_number && (
                              <span>
                                <strong>Cert / Serial:</strong> {uploaded.document_number}
                              </span>
                            )}
                            {uploaded.receipt_number && (
                              <span>
                                <strong>Receipt No.:</strong> {uploaded.receipt_number}
                              </span>
                            )}
                            {uploaded.extracted_vehicle_make && (
                              <span>
                                <strong>Make / Model:</strong> {uploaded.extracted_vehicle_make}
                                {uploaded.extracted_vehicle_model ? ` ${uploaded.extracted_vehicle_model}` : ''}
                              </span>
                            )}
                            {uploaded.extracted_plate && (
                              <span>
                                <strong>Plate:</strong> {uploaded.extracted_plate}
                              </span>
                            )}
                            {uploaded.extracted_engine_number && (
                              <span>
                                <strong>Engine:</strong> {uploaded.extracted_engine_number}
                              </span>
                            )}
                            {uploaded.extracted_chassis_number && (
                              <span>
                                <strong>Chassis:</strong> {uploaded.extracted_chassis_number}
                              </span>
                            )}
                            {uploaded.extracted_file_number && (
                              <span>
                                <strong>File No.:</strong> {uploaded.extracted_file_number}
                              </span>
                            )}
                            {uploaded.extracted_poc_vid && (
                              <span>
                                <strong>POC VID:</strong> {uploaded.extracted_poc_vid}
                              </span>
                            )}
                            {uploaded.extracted_pin && (
                              <span>
                                <strong>AutoReg PIN:</strong> {uploaded.extracted_pin}
                              </span>
                            )}
                          </div>

                          {verification?.checks && verification.checks.length > 0 && (
                            <div className="dp-proof-section">
                              <button
                                type="button"
                                className="dp-link-toggle-btn"
                                onClick={() =>
                                  setExpandedProofs((prev) => ({
                                    ...prev,
                                    [docCfg.key]: !prev[docCfg.key],
                                  }))
                                }
                              >
                                {isProofExpanded
                                  ? 'Hide Authenticity Verification Proof'
                                  : `View Detailed Authenticity Proof (${
                                      verification.checks.filter((c) => c.passed).length
                                    }/${verification.checks.length} checks verified)`}
                              </button>

                              {isProofExpanded && (
                                <div className="dp-proof-list">
                                  {verification.checks.map((chk) => (
                                    <div key={chk.code} className="dp-proof-item">
                                      <span
                                        className={`dp-proof-status ${
                                          chk.passed ? 'dp-proof-pass' : 'dp-proof-fail'
                                        }`}
                                      >
                                        {chk.passed ? 'PASS' : 'FAIL'}
                                      </span>
                                      <div className="dp-proof-body">
                                        <div className="dp-proof-label">{chk.label}</div>
                                        <div className="dp-proof-detail">{chk.detail}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="dp-hint">
                          Required • Maximum file size: 5 MB • Reviewed by Deliva operations agents
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. Driver Licence & Recorded Compliance Expiry */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Licence & Extracted Expiry Record</h2>
                <p className="dp-section-desc">
                  Your licence/permit reference and the system-extracted nearest compliance expiry date
                  used for 1-month advance notifications and expiry-day portal locking.
                </p>
              </div>

              <div className="dp-grid">
                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-license-num">
                    Driver licence / MOT permit number <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-license-num"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. RSCR/428749 or ABC123456AA"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-license-exp">
                    Extracted licence / certificate expiry date <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-license-exp"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="Auto-extracted on document upload (YYYY-MM-DD)"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                  <span className="dp-hint">
                    Automatically extracted and recorded from your uploaded certificates (YYYY-MM-DD).
                  </span>
                </div>
              </div>
            </section>

            {/* 4. Vehicle */}
            <section className="dp-section">
              <div className="dp-section-head">
                <h2 className="dp-section-title">Vehicle Information</h2>
                <p className="dp-section-desc">
                  Details of the dispatch vehicle linked to your driver account and cross-checked across
                  your Roadworthiness, Proof of Ownership, Hackney Permit, and Vehicle License.
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
                    Vehicle make / model <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-model"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. QLINK / Bajaj Boxer 150"
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
                    placeholder="e.g. 2026"
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
                    Number plate (Identification Mark) <span className="dp-req">*</span>
                  </label>
                  <input
                    id="dp-vehicle-plate"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. RUM655WZ"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                    required
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-engine">
                    Engine number <span className="dp-optional">(Auto-extracted)</span>
                  </label>
                  <input
                    id="dp-vehicle-engine"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. QL162FMJ1TTT08697"
                    value={vehicleEngineNumber}
                    onChange={(e) => setVehicleEngineNumber(e.target.value.toUpperCase())}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
                  />
                </div>

                <div className="dp-field">
                  <label className="dp-label" htmlFor="dp-vehicle-chassis">
                    Chassis number <span className="dp-optional">(Auto-extracted)</span>
                  </label>
                  <input
                    id="dp-vehicle-chassis"
                    type="text"
                    className={`dp-input${isLockedActive ? ' dp-input-readonly' : ''}`}
                    placeholder="e.g. QLKPCKBJ2TTT08723"
                    value={vehicleChassisNumber}
                    onChange={(e) => setVehicleChassisNumber(e.target.value.toUpperCase())}
                    readOnly={isLockedActive}
                    disabled={isLockedActive}
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
                    placeholder="e.g. 1 or 2"
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

            {(!isLockedActive || isRenewalMode) && !isPendingAgentApproval && (
              <div className="dp-submit-row">
                <button
                  type="submit"
                  className="dp-submit-btn"
                  disabled={submitting || isAnyDocUploading}
                >
                  {submitting
                    ? 'Submitting...'
                    : isAnyDocUploading
                      ? 'Uploading document...'
                      : isExpiryLocked
                        ? 'Submit Renewed Documents for Approval'
                        : isExpiryWarning
                          ? 'Save Renewed Documents'
                          : 'Submit Documentation for Approval'}
                </button>
              </div>
            )}
            {isPendingAgentApproval && rejectedDocCount > 0 && (
              <div className="dp-submit-row">
                <button
                  type="submit"
                  className="dp-submit-btn"
                  disabled={submitting || isAnyDocUploading}
                >
                  {submitting ? 'Submitting...' : 'Re-submit Documentation for Approval'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
};
