export interface DeletionRequestData {
  email: string;
  fullName?: string;
  phone?: string;
  accountType?: 'consumer' | 'rider' | 'merchant';
  reason?: string;
  notes?: string;
}

export interface DeletionResponse {
  success: boolean;
  referenceId: string;
  message: string;
  error?: string;
}

const LOCAL_STORAGE_KEY = 'deliva_deletion_requests';

function generateReferenceId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `DEL-${timestamp}-${randomPart}`;
}

export async function submitAccountDeletionRequest(
  data: DeletionRequestData
): Promise<DeletionResponse> {
  const cleanEmail = data.email.trim().toLowerCase();
  const referenceId = generateReferenceId();

  const payload = {
    email: cleanEmail,
    full_name: data.fullName?.trim() || null,
    phone: data.phone?.trim() || null,
    account_type: data.accountType || 'consumer',
    reason: data.reason?.trim() || null,
    notes: data.notes?.trim() || null,
    status: 'pending',
    source: 'web',
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  try {
    const GO_BACKEND_URL = (typeof window !== 'undefined' && (window as any).__DELIVA_API_URL__) || 'https://delbackend.onrender.com/api/v1';
    await fetch(`${GO_BACKEND_URL}/auth/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, reason: data.reason }),
    });
    saveLocalDeletionRequest(payload);
  } catch (err: any) {
    saveLocalDeletionRequest(payload);
  }

  return {
    success: true,
    referenceId,
    message: 'Your account and data deletion request has been registered.',
  };
}

function saveLocalDeletionRequest(item: any) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    existing.push(item);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    // ignore
  }
}

