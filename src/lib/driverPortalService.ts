import { GO_BACKEND_URL } from './delivaClient';
import type {
  BankOption,
  CompleteDriverPortalPayload,
  DocumentUploadHints,
  DocumentVerificationReport,
  DriverPortalProfile,
  PortalDocumentFile,
  PortalDocumentType,
} from '../types';

export const MAX_PORTAL_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MiB per file

const PORTAL_TOKEN_KEY = 'deliva_driver_portal_session_token';

export function resolvePortalMediaUrl(rawUrl?: string | null): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  try {
    const base = new URL(GO_BACKEND_URL);
    return `${base.origin}${clean.startsWith('/') ? clean : `/${clean}`}`;
  } catch {
    return clean;
  }
}

export function getStoredPortalToken(): string | null {
  try {
    return sessionStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredPortalToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(PORTAL_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(PORTAL_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Performs client-side optical/metadata inspection on an uploaded compliance certificate
 * (including QR/Barcode decoding via BarcodeDetector when available and embedded PDF/XMP text runs)
 * so any embedded expiry dates, serial numbers, POC VIDs, or AutoReg PINs are sent to the verification engine.
 */
export async function extractClientDocumentText(file: File): Promise<string> {
  const segments: string[] = [];

  // 1. Try native browser BarcodeDetector for QR codes (e.g. Proof of Ownership Certificate QR)
  try {
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (BarcodeDetectorCtor && file.type.startsWith('image/') && typeof createImageBitmap === 'function') {
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'pdf417'] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (Array.isArray(codes)) {
        for (const c of codes) {
          if (c?.rawValue) {
            segments.push(String(c.rawValue));
          }
        }
      }
      if (typeof bitmap.close === 'function') bitmap.close();
    }
  } catch {
    // BarcodeDetector not available or image couldn't be scanned
  }

  // 2. Scan embedded metadata / text streams for PDFs or text-bearing files
  try {
    const slice = file.slice(0, Math.min(file.size, 256 * 1024));
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let run = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        run += String.fromCharCode(b);
      } else {
        if (run.length >= 14 && /expir|issue|date|plate|engine|chassis|owner|rivers|nigeria|worthiness|hackney|license|ownership|courier|rec-|poc|pin|rscr/i.test(run)) {
          segments.push(run.trim());
        }
        run = '';
      }
    }
    if (run.length >= 14 && /expir|issue|date|plate|engine|chassis|owner|rivers|nigeria|worthiness|hackney|license|ownership|courier|rec-|poc|pin|rscr/i.test(run)) {
      segments.push(run.trim());
    }
  } catch {
    // ignore buffer scan errors
  }

  return segments.join('\n');
}

export async function exchangePortalLaunchCode(code: string): Promise<{
  token: string;
  profile: DriverPortalProfile;
}> {
  const res = await fetch(`${GO_BACKEND_URL}/drivers/portal/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
  });

  const json = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(
      json?.error ||
        json?.message ||
        'This Drivers Portal link is invalid or has expired. Open Drivers Portal from your Deliva Rider app sidebar.'
    );
  }

  const token = json?.data?.token;
  if (!token) {
    throw new Error('Scoped portal session token was not returned by server');
  }

  setStoredPortalToken(token);
  const profile = await fetchDriverPortalProfile(token);
  return { token, profile };
}

export async function fetchDriverPortalProfile(token: string): Promise<DriverPortalProfile> {
  const res = await fetch(`${GO_BACKEND_URL}/drivers/portal`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await parseJsonSafe(res);
  if (res.status === 401 || res.status === 403) {
    setStoredPortalToken(null);
    throw new Error('SESSION_EXPIRED');
  }
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Failed to load Driver Portal profile');
  }

  return json?.data as DriverPortalProfile;
}

export async function uploadDriverPortalDocument(
  token: string,
  documentType: PortalDocumentType,
  file: File,
  hints?: DocumentUploadHints
): Promise<{
  document: PortalDocumentFile;
  verification?: DocumentVerificationReport | null;
  profile: DriverPortalProfile;
}> {
  if (!file || file.size === 0) {
    throw new Error('Selected file is empty.');
  }
  if (file.size > MAX_PORTAL_DOCUMENT_BYTES) {
    throw new Error('File exceeds the 5MB maximum size limit.');
  }

  const clientExtractedText = await extractClientDocumentText(file);
  const combinedText = [hints?.extracted_text || '', clientExtractedText]
    .filter(Boolean)
    .join('\n')
    .trim();

  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('file_name', file.name || documentType);
  if (combinedText) formData.append('extracted_text', combinedText);
  if (hints?.document_number) formData.append('document_number', hints.document_number.trim());
  if (hints?.receipt_number) formData.append('receipt_number', hints.receipt_number.trim());
  if (hints?.issue_date) formData.append('issue_date', hints.issue_date.trim());
  if (hints?.expiry_date) formData.append('expiry_date', hints.expiry_date.trim());
  if (hints?.plate_number) formData.append('plate_number', hints.plate_number.trim());
  if (hints?.engine_number) formData.append('engine_number', hints.engine_number.trim());
  if (hints?.chassis_number) formData.append('chassis_number', hints.chassis_number.trim());
  if (hints?.owner_name) formData.append('owner_name', hints.owner_name.trim());
  if (hints?.vehicle_make) formData.append('vehicle_make', hints.vehicle_make.trim());
  if (hints?.pin) formData.append('pin', hints.pin.trim());
  if (hints?.poc_vid) formData.append('poc_vid', hints.poc_vid.trim());
  if (hints?.file_number) formData.append('file_number', hints.file_number.trim());
  formData.append('file', file);

  const res = await fetch(`${GO_BACKEND_URL}/drivers/portal/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await parseJsonSafe(res);
  if (res.status === 401) {
    setStoredPortalToken(null);
    throw new Error('SESSION_EXPIRED');
  }
  if (res.status === 403 && json?.code === 'PORTAL_APP_LAUNCH_REQUIRED') {
    setStoredPortalToken(null);
    throw new Error('SESSION_EXPIRED');
  }
  if (res.status === 413) {
    throw new Error(json?.error || 'File exceeds the 5MB maximum size limit.');
  }
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Failed to upload and verify document');
  }

  const doc = json?.data?.document as PortalDocumentFile | undefined;
  const verification = (json?.data?.verification || doc?.verification || null) as
    | DocumentVerificationReport
    | null;
  const profile = json?.data?.profile as DriverPortalProfile | undefined;
  if (!doc?.url || !profile) {
    throw new Error('Upload completed without document metadata');
  }
  return { document: doc, verification, profile };
}

export async function completeDriverPortal(
  token: string,
  payload: CompleteDriverPortalPayload
): Promise<DriverPortalProfile> {
  const res = await fetch(`${GO_BACKEND_URL}/drivers/portal/complete`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await parseJsonSafe(res);
  if (res.status === 401 || res.status === 403) {
    setStoredPortalToken(null);
    throw new Error('SESSION_EXPIRED');
  }
  if (!res.ok) {
    throw new Error(json?.error || json?.message || 'Could not complete Driver Portal profile');
  }

  return json?.data as DriverPortalProfile;
}

export async function fetchSupportedBanks(token: string): Promise<BankOption[]> {
  try {
    const res = await fetch(`${GO_BACKEND_URL}/wallet/banks`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return [];
    const json = await parseJsonSafe(res);
    const raw = Array.isArray(json?.data) ? json.data : [];
    const unique = new Map<string, BankOption>();
    for (const item of raw) {
      if (item?.name && item?.code && !unique.has(item.code)) {
        unique.set(item.code, { name: String(item.name), code: String(item.code) });
      }
    }
    return Array.from(unique.values());
  } catch {
    return [];
  }
}

export async function verifyNubanAccount(
  token: string,
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; account_number: string }> {
  const res = await fetch(`${GO_BACKEND_URL}/wallet/verify-bank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_number: accountNumber.trim(),
      bank_code: bankCode.trim(),
    }),
  });

  const json = await parseJsonSafe(res);
  if (!res.ok || !json?.status) {
    throw new Error(json?.error || 'Could not verify bank account details');
  }

  return {
    account_name: String(json?.data?.account_name || ''),
    account_number: String(json?.data?.account_number || accountNumber),
  };
}
