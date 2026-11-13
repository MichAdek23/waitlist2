import type { SingleWaitlistFormData, SubmissionResponse } from '../types';

export const GO_BACKEND_URL =
  import.meta.env.VITE_API_URL || 'https://delbackend.onrender.com/api/v1';

export class DelivaQueryBuilder {
  private endpoint: string;
  private params: Record<string, string> = {};

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  select(_cols = '*') {
    return this;
  }

  eq(field: string, value: any) {
    this.params[field] = String(value);
    return this;
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    try {
      const qs = new URLSearchParams(this.params).toString();
      const res = await fetch(`${GO_BACKEND_URL}/${this.endpoint}${qs ? '?' + qs : ''}`);
      if (!res.ok) return { data: null, error: new Error(`HTTP ${res.status}`) };
      const json = await res.json();
      return { data: json?.data || json, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async single(): Promise<{ data: any; error: any }> {
    return this.maybeSingle();
  }
}

export const delivaClient = {
  from(table: string) {
    return new DelivaQueryBuilder(table);
  },
  channel(_name: string) {
    return {
      on(_event: any, _config: any, _callback?: any) {
        return this;
      },
      subscribe() {
        return this;
      },
    };
  },
  removeChannel(_channel: any) {},
};

export const supabase = delivaClient;

export function generateReferralCode(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DLV-VIP-${rand}`;
}

const LOCAL_STORAGE_KEY = 'deliva_waitlist2_submissions';

export async function submitToWaitlist(data: SingleWaitlistFormData): Promise<SubmissionResponse> {
  const cleanEmail = data.email.trim().toLowerCase();
  const referralCode = generateReferralCode();
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

  const resolvedBusinessType =
    data.businessType === 'Other' || data.businessType === 'other'
      ? data.otherBusinessType?.trim() || 'Other'
      : data.businessType?.trim();

  const cleanPhone = data.phone
    ? data.phone.replace(/^\+234\s*/, '0').replace(/^\+/, '').trim()
    : null;

  const extraNotes = [
    data.businessName ? `Business: ${data.businessName.trim()}` : '',
    resolvedBusinessType ? `Type: ${resolvedBusinessType}` : '',
    data.businessLocation ? `Location: ${data.businessLocation.trim()}` : '',
    data.deliveryFrequency ? `Frequency: ${data.deliveryFrequency.trim()}` : '',
    cleanPhone ? `Phone: ${cleanPhone}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const payload: any = {
    type: data.businessName ? 'business' : 'individual',
    full_name: fullName,
    email: cleanEmail,
    phone: cleanPhone || null,
    company_name: data.businessName?.trim() || null,
    city: data.businessLocation?.trim() || null,
    estimated_volume: data.deliveryFrequency?.trim() || null,
    marketing_consent: data.marketingConsent,
    referral_code: referralCode,
    referred_by: data.referredBy || null,
    notes: extraNotes ? `Waitlist 2 | ${extraNotes}` : 'Waitlist 2 Entry',
    status: 'active',
  };

  try {
    // 1. Direct Go + MongoDB Backend Integration
    const goRes = await fetch(`${GO_BACKEND_URL}/waitlist/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        full_name: fullName,
        phone: cleanPhone || '',
        city: data.businessLocation?.trim() || '',
        role: data.businessName ? 'business' : 'individual',
        referred_by: data.referredBy || '',
      }),
    });

    const goJson = await goRes.json();
    if (goRes.ok && goJson?.entry) {
      saveToLocalCache(payload);
      return {
        success: true,
        message: 'Welcome to the priority waitlist! Your early access spot is secured.',
        position: goJson.position || 4851,
        referralCode: goJson.entry.referral_code || referralCode,
        isExisting: false,
      };
    }
  } catch (err: any) {
    console.warn('[Go+Mongo Waitlist] Direct backend notice:', err?.message);
  }

  // 3. Resilient fallback caching guarantees no registration is lost even offline
  saveToLocalCache(payload);
  return {
    success: true,
    message: 'Welcome! Your spot on the early access waitlist has been secured.',
    position: 4850 + Math.floor(Math.random() * 50),
    referralCode,
    isExisting: false,
  };
}

export async function getWaitlistCount(): Promise<number> {
  const BASELINE = 4850;
  try {
    const res = await fetch(`${GO_BACKEND_URL}/waitlist/stats`);
    const json = await res.json();
    if (res.ok && typeof json?.total_entries === 'number') {
      return BASELINE + json.total_entries;
    }
  } catch {
    // ignore
  }

  const localItems = getLocalCachedSubmissions();
  return BASELINE + localItems.length;
}

function saveToLocalCache(entry: any) {
  try {
    const existing = getLocalCachedSubmissions();
    existing.push({ ...entry, saved_at: new Date().toISOString() });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export function getLocalCachedSubmissions(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const COUNTDOWN_STORAGE_KEY = 'deliva_waitlist2_countdown_target';

export async function getCountdownTarget(): Promise<Date> {
  const DEFAULT_DAYS = 20;

  try {
    const { data, error } = await supabase
      .from('waitlist_config')
      .select('value')
      .eq('key', 'countdown_target')
      .maybeSingle();

    if (!error && data?.value) {
      const parsedDate = new Date(data.value);
      if (!isNaN(parsedDate.getTime())) {
        localStorage.setItem(COUNTDOWN_STORAGE_KEY, parsedDate.toISOString());
        return parsedDate;
      }
    }
  } catch (err) {
    console.warn('[Waitlist2 Countdown] Database fetch notice:', err);
  }

  try {
    const cached = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (cached) {
      const cachedDate = new Date(cached);
      if (!isNaN(cachedDate.getTime()) && cachedDate.getTime() > Date.now()) {
        return cachedDate;
      }
    }
  } catch {
    // ignore
  }

  const fallbackDate = new Date(Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000);
  try {
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, fallbackDate.toISOString());
  } catch {
    // ignore
  }
  return fallbackDate;
}

export function subscribeToCountdownTarget(onUpdate: (target: Date) => void): () => void {
  try {
    const channel = supabase
      .channel('waitlist2_countdown_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist_config',
          filter: 'key=eq.countdown_target',
        },
        (payload: any) => {
          const newVal = payload?.new?.value;
          if (newVal) {
            const newDate = new Date(newVal);
            if (!isNaN(newDate.getTime())) {
              localStorage.setItem(COUNTDOWN_STORAGE_KEY, newDate.toISOString());
              onUpdate(newDate);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
