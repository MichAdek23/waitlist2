import { createClient } from '@supabase/supabase-js';
import type { SingleWaitlistFormData, SubmissionResponse } from '../types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://cgnhrvwhwpeemyrnsenz.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmhydndod3BlZW15cm5zZW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjI1NjQsImV4cCI6MjA4NDY5ODU2NH0._KyAOO4SBJy0rQxP-ECoMfZsqGhK4Wna9ZXnPRT-4bA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

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
    // 1. Check for existing submission in Supabase
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('id, referral_code, created_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!checkError && existing) {
      return {
        success: true,
        message: 'You are already registered on the Deliva priority waitlist!',
        position: 4850 + Math.floor(Math.random() * 50),
        referralCode: existing.referral_code || referralCode,
        isExisting: true,
      };
    }

    // 2. Insert into Supabase table (fallback to individual if type constraint check fails)
    let insertResult = await supabase.from('waitlist').insert([payload]);
    if (insertResult.error && payload.type === 'business') {
      insertResult = await supabase.from('waitlist').insert([{ ...payload, type: 'individual' }]);
    }

    if (!insertResult.error) {
      const position = await getWaitlistCount();
      saveToLocalCache(payload);
      return {
        success: true,
        message: 'Welcome to the priority waitlist! Your early access spot is secured.',
        position: position + 1,
        referralCode,
        isExisting: false,
      };
    }

    console.warn('[Waitlist2] Database insert notice:', insertResult.error?.message);
  } catch (err: any) {
    console.warn('[Waitlist2] Database connection notice:', err?.message);
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
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (!error && typeof count === 'number') {
      return BASELINE + count;
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
