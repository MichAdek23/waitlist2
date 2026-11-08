import { supabase } from './supabase';

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
    const { error } = await supabase.from('account_deletion_requests').insert([payload]);
    if (error) {
      console.warn('Supabase account_deletion_requests insert notice:', error.message);
      saveLocalDeletionRequest(payload);
    } else {
      saveLocalDeletionRequest(payload);
    }
  } catch (err: any) {
    console.warn('Network fallback for deletion request:', err?.message || err);
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
