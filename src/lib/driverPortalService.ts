import { GO_BACKEND_URL } from './delivaClient';
import type {
  BankOption,
  CompleteDriverPortalPayload,
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
  file: File
): Promise<{
  document: PortalDocumentFile;
  profile: DriverPortalProfile;
}> {
  if (!file || file.size === 0) {
    throw new Error('Selected file is empty.');
  }
  if (file.size > MAX_PORTAL_DOCUMENT_BYTES) {
    throw new Error('File exceeds the 5MB maximum size limit.');
  }

  const formData = new FormData();
  formData.append('document_type', documentType);
  formData.append('file_name', file.name || documentType);
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
    throw new Error(json?.error || json?.message || 'Failed to upload document');
  }

  const doc = json?.data?.document as PortalDocumentFile | undefined;
  const profile = json?.data?.profile as DriverPortalProfile | undefined;
  if (!doc?.url || !profile) {
    throw new Error('Upload completed without document metadata');
  }
  return { document: doc, profile };
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
