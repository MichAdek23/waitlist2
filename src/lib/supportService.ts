/**
 * Deliva Customer Support & Agent Operations Service
 * Powered by the Deliva Go Backend (https://delbackend.onrender.com/api/v1)
 */

export const GO_BACKEND_URL =
  import.meta.env.VITE_GO_BACKEND_URL || 'https://delbackend.onrender.com/api/v1';

export const GO_WS_URL =
  import.meta.env.VITE_GO_WS_URL ||
  GO_BACKEND_URL.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '') + '/ws';

export interface SupportUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type?: string;
  role?: string;
  avatar_url?: string;
  is_support_agent?: boolean;
  created_at?: string;
}

export interface SupportSession {
  token: string;
  user: SupportUserProfile;
}

export interface SupportTicket {
  id: string;
  user_id?: string;
  assigned_agent_id?: string | null;
  subject: string;
  category: string;
  status: 'ai_handling' | 'escalated' | 'agent_assigned' | 'resolved' | string;
  priority: 'low' | 'medium' | 'high' | string;
  hidden_by_user?: boolean;
  guest_name?: string;
  guest_email?: string;
  department?: string;
  created_at: string;
  updated_at: string;
  escalated_at?: string | null;
  resolved_at?: string | null;
  profiles?: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    user_type?: string;
    avatar_url?: string;
  } | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'ai' | 'agent' | 'system';
  sender_id?: string | null;
  content: string;
  metadata?: {
    is_private?: boolean;
    can_push?: boolean;
    suggest_escalation?: boolean;
    auto_escalated?: boolean;
    agent_triggered?: boolean;
    [key: string]: any;
  };
  created_at: string;
}

export interface UserTag {
  id: string;
  user_id: string;
  tag_name: string;
  tag_color: string;
  created_at?: string;
}

export interface DriverAuthenticityCheck {
  code: string;
  label: string;
  passed: boolean;
  detail: string;
  weight?: number;
}

export interface DriverCredentialDoc {
  key: string;
  label: string;
  uploaded: boolean;
  url?: string;
  upload_id?: string;
  file_name?: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
  extracted_issue_date?: string;
  extracted_expiry_date?: string;
  days_until_expiry?: number;
  document_number?: string;
  receipt_number?: string;
  extracted_plate?: string;
  extracted_engine_number?: string;
  extracted_chassis_number?: string;
  extracted_owner_name?: string;
  extracted_pin?: string;
  extracted_poc_vid?: string;
  extracted_file_number?: string;
  sha256_hash?: string;
  verified?: boolean;
  verification_status?: string;
  authenticity_score?: number;
  issuing_authority?: string;
  rejection_reason?: string;
  verified_at?: string;
  checks?: DriverAuthenticityCheck[];
}

export interface DriverCredentials {
  nin?: string;
  nin_masked?: string;
  nin_verified?: boolean;
  nin_verified_at?: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  display_name?: string;
  id_document_url?: string;
  nin_record?: {
    nin?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    full_name?: string;
    date_of_birth?: string;
    gender?: string;
    phone?: string;
    address?: string;
    state?: string;
    lga?: string;
    photo?: string;
    source?: string;
    verified_at?: string;
  } | null;
  license_number?: string;
  license_issued_date?: string;
  license_expiry?: string;
  license_state_of_issue?: string;
  license_verified?: boolean;
  license_verified_at?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_seats?: number;
  vehicle_engine_number?: string;
  vehicle_chassis_number?: string;
  vehicle_registry_file_no?: string;
  vehicle_autoreg_pin?: string;
  vehicle_poc_vid?: string;
  portal_completed?: boolean;
  portal_completed_at?: string;
  is_activated?: boolean;
  is_online?: boolean;
  driver_score?: number;
  reward_tier?: string;
  reward_points?: number;
  acceptance_rate?: number;
  completion_rate?: number;
  on_time_rate?: number;
  next_document_expiry?: string;
  next_expiring_doc_type?: string;
  next_expiring_doc_label?: string;
  days_until_next_expiry?: number;
  expiry_warning_active?: boolean;
  expiry_locked?: boolean;
  expired_document_types?: string[];
  expiring_document_types?: string[];
  documents?: DriverCredentialDoc[];
}

export function resolveSupportMediaUrl(rawUrl?: string | null): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return '';
  if (/^(https?:|data:)/i.test(clean)) return clean;
  try {
    const base = new URL(GO_BACKEND_URL);
    return `${base.origin}${clean.startsWith('/') ? clean : `/${clean}`}`;
  } catch {
    return clean;
  }
}

const SUPPORT_SESSION_KEY = 'deliva_support_session_v1';
const AGENT_SESSION_KEY = 'deliva_agent_session_v1';

export function getSupportSession(): SupportSession | null {
  try {
    const raw = localStorage.getItem(SUPPORT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSupportSession(session: SupportSession | null) {
  if (!session) {
    localStorage.removeItem(SUPPORT_SESSION_KEY);
  } else {
    localStorage.setItem(SUPPORT_SESSION_KEY, JSON.stringify(session));
  }
}

export function getAgentSession(): SupportSession | null {
  try {
    const raw = localStorage.getItem(AGENT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAgentSession(session: SupportSession | null) {
  if (!session) {
    localStorage.removeItem(AGENT_SESSION_KEY);
  } else {
    localStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(session));
  }
}

export async function supportLogin(email: string, password: string): Promise<SupportSession> {
  const res = await fetch(`${GO_BACKEND_URL}/support/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || 'Sign in failed. Please check your credentials.');
  }
  const data = json.data || json;
  const session: SupportSession = {
    token: data.token,
    user: data.user,
  };
  setSupportSession(session);
  return session;
}

export async function supportQuickRegister(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<SupportSession> {
  const res = await fetch(`${GO_BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      password: params.password,
      role: 'consumer',
      country: 'NG',
    }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || 'Could not create support account.');
  }
  const data = json.data || json;
  const session: SupportSession = {
    token: data.token,
    user: data.user,
  };
  setSupportSession(session);
  return session;
}

export async function agentLogin(email: string, password: string): Promise<SupportSession> {
  const res = await fetch(`${GO_BACKEND_URL}/support/agent/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(
      json.error || json.message || 'Access denied. Invalid credentials or unauthorized account.'
    );
  }
  const data = json.data || json;
  const session: SupportSession = {
    token: data.token,
    user: data.user,
  };
  setAgentSession(session);
  return session;
}

export async function submitGuestSupportTicket(params: {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  department?: string;
}): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }> {
  const session = getSupportSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  const res = await fetch(`${GO_BACKEND_URL}/support/guest-ticket`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || 'Failed to submit support ticket.');
  }
  return json.data || json;
}

export async function invokeSupportAction<T = any>(
  action: string,
  payload: Record<string, any> = {},
  mode: 'customer' | 'agent' = 'customer'
): Promise<T> {
  const session = mode === 'agent' ? getAgentSession() : getSupportSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const res = await fetch(`${GO_BACKEND_URL}/support-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || json.message || `Support action "${action}" failed`);
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export function subscribeToSupportRealtime(
  room: string,
  onEvent: (event: { type: string; payload: any }) => void
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    try {
      const url = `${GO_WS_URL}?room=${encodeURIComponent(room)}`;
      ws = new WebSocket(url);

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          if (parsed && parsed.type) {
            onEvent(parsed);
          }
        } catch {
          // ignore invalid json
        }
      };

      ws.onclose = () => {
        if (!closed) {
          reconnectTimer = setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 5000);
      }
    }
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}
