import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAgentSession,
  setAgentSession,
  invokeSupportAction,
  subscribeToSupportRealtime,
  resolveSupportMediaUrl,
  type SupportTicket,
  type SupportMessage,
  type UserTag,
  type DriverCredentials,
  type DriverCredentialDoc,
} from '../lib/supportService';

interface AgentDashboardPageProps {
  onNavigate: (path: string) => void;
}

type AgentSection = 'overview' | 'support' | 'deliveries' | 'users';
type TicketTab = 'queue' | 'my_tickets' | 'resolved';
type RightTab = 'profile' | 'credentials' | 'deliveries' | 'payments' | 'addresses' | 'tickets';

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  ai_handling: { label: 'AI Handling', color: '#204B7A', bg: '#EFF6FF' },
  escalated: { label: 'Needs Agent', color: '#92400E', bg: '#FFFBEB' },
  agent_assigned: { label: 'In Progress', color: '#065F46', bg: '#ECFDF5' },
  resolved: { label: 'Resolved', color: '#475569', bg: '#F1F5F9' },
};

const PRIORITY_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#475569', bg: '#F1F5F9' },
  medium: { label: 'Medium', color: '#92400E', bg: '#FFFBEB' },
  high: { label: 'High', color: '#B91C1C', bg: '#FEF2F2' },
};

const DELIVERY_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#92400E', bg: '#FFFBEB' },
  accepted: { label: 'Accepted', color: '#204B7A', bg: '#EFF6FF' },
  arrived_at_pickup: { label: 'At Pickup', color: '#204B7A', bg: '#EFF6FF' },
  picked_up: { label: 'Picked Up', color: '#204B7A', bg: '#EFF6FF' },
  in_transit: { label: 'In Transit', color: '#204B7A', bg: '#EFF6FF' },
  arrived_at_dropoff: { label: 'At Dropoff', color: '#065F46', bg: '#ECFDF5' },
  delivered: { label: 'Delivered', color: '#065F46', bg: '#ECFDF5' },
  cancelled: { label: 'Cancelled', color: '#B91C1C', bg: '#FEF2F2' },
};

const PRESET_TAGS = [
  { name: 'VIP', color: '#B45309' },
  { name: 'Flagged', color: '#DC2626' },
  { name: 'Verified', color: '#059669' },
  { name: 'Suspended', color: '#B91C1C' },
  { name: 'Frequent', color: '#204B7A' },
  { name: 'New User', color: '#475569' },
  { name: 'Top Driver', color: '#065F46' },
  { name: 'At Risk', color: '#D97706' },
];

const SidebarIcon: React.FC<{ name: 'overview' | 'support' | 'deliveries' | 'users' | 'collapse' | 'expand' | 'logout' }> = ({
  name,
}) => {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { flexShrink: 0 },
  };
  switch (name) {
    case 'overview':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'support':
      return (
        <svg {...props}>
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      );
    case 'deliveries':
      return (
        <svg {...props}>
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'collapse':
      return (
        <svg {...props}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case 'expand':
      return (
        <svg {...props}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
  }
};

export const AgentDashboardPage: React.FC<AgentDashboardPageProps> = ({ onNavigate }) => {
  const session = getAgentSession();
  const [activeSection, setActiveSection] = useState<AgentSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Overview
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Support Tickets
  const [ticketTab, setTicketTab] = useState<TicketTab>('queue');
  const [ticketsBuckets, setTicketsBuckets] = useState<{
    queue: SupportTicket[];
    my_tickets: SupportTicket[];
    resolved: SupportTicket[];
  }>({ queue: [], my_tickets: [], resolved: [] });
  const [queueBadgeCount, setQueueBadgeCount] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Deliveries
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveriesTotal, setDeliveriesTotal] = useState(0);
  const [deliveriesPage, setDeliveriesPage] = useState(1);
  const [deliveriesTotalPages, setDeliveriesTotalPages] = useState(1);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedDeliveryConv, setSelectedDeliveryConv] = useState<any>(null);
  const [loadingDeliveryConv, setLoadingDeliveryConv] = useState(false);

  // Users & Drivers Directory
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'consumer' | 'rider'>('all');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Contextual Right Sidebar (opens when needed)
  const [rightOpen, setRightOpen] = useState(false);
  const [rightWide, setRightWide] = useState(false);
  const [rightMode, setRightMode] = useState<'user' | 'delivery' | 'ticket'>('user');
  const [rightTab, setRightTab] = useState<RightTab>('profile');
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [inspectedUserDetail, setInspectedUserDetail] = useState<any>(null);
  const [loadingInspectedUser, setLoadingInspectedUser] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showFullNin, setShowFullNin] = useState(false);

  // Full Document Preview Modal
  const [viewingDoc, setViewingDoc] = useState<DriverCredentialDoc | null>(null);

  useEffect(() => {
    if (!session?.token) {
      onNavigate('/agent-login');
    }
  }, [session?.token, onNavigate]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await invokeSupportAction('agent_get_overview', {}, 'agent');
      setOverviewData(data);
      const qCount = data?.stats?.queue_count ?? data?.queue_count ?? 0;
      setQueueBadgeCount(qCount);
    } catch {
      // ignore
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const fetchAgentTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await invokeSupportAction<{
        queue?: SupportTicket[];
        my_tickets?: SupportTicket[];
        resolved?: SupportTicket[];
      }>('agent_list_tickets', {}, 'agent');
      const queue = data?.queue || [];
      const myTickets = data?.my_tickets || [];
      const resolved = data?.resolved || [];
      setTicketsBuckets({ queue, my_tickets: myTickets, resolved });
      setQueueBadgeCount(queue.length);
    } catch {
      // ignore
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const openUserInspectorInRightSidebar = useCallback(
    async (userId: string, preferredTab: RightTab = 'profile') => {
      if (!userId) return;
      setRightMode('user');
      setRightOpen(true);
      setInspectedUserId(userId);
      setRightTab(preferredTab);
      setShowTagDropdown(false);
      setShowFullNin(false);
      setLoadingInspectedUser(true);
      try {
        const data = await invokeSupportAction(
          'agent_get_user_details',
          { user_id: userId },
          'agent'
        );
        setInspectedUserDetail(data);
      } catch {
        setInspectedUserDetail(null);
      } finally {
        setLoadingInspectedUser(false);
      }
    },
    []
  );

  const openAgentTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingChat(true);
    try {
      const data = await invokeSupportAction<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>('agent_get_messages', { ticket_id: ticket.id }, 'agent');
      if (data?.ticket) setSelectedTicket(data.ticket);
      if (data?.messages) setTicketMessages(data.messages);
    } catch {
      // ignore
    } finally {
      setLoadingChat(false);
    }
  };

  const fetchAgentDeliveries = useCallback(
    async (page = 1, status = deliveryStatusFilter, q = deliverySearch) => {
      setLoadingDeliveries(true);
      try {
        const data = await invokeSupportAction(
          'agent_list_deliveries',
          {
            page,
            status_filter: status === 'all' ? undefined : status,
            search_query: q.trim().length >= 2 ? q.trim() : undefined,
          },
          'agent'
        );
        if (data?.deliveries) {
          setDeliveries(data.deliveries);
          setDeliveriesTotal(data.total || 0);
          setDeliveriesPage(data.page || 1);
          setDeliveriesTotalPages(data.total_pages || 1);
        }
      } catch {
        // ignore
      } finally {
        setLoadingDeliveries(false);
      }
    },
    [deliveryStatusFilter, deliverySearch]
  );

  const openDeliveryInspector = async (deliveryId: string) => {
    setLoadingDeliveryConv(true);
    try {
      const data = await invokeSupportAction(
        'agent_get_delivery_conversation',
        { delivery_id: deliveryId },
        'agent'
      );
      setSelectedDeliveryConv(data);
      setRightMode('delivery');
      setRightOpen(true);
    } catch {
      // ignore
    } finally {
      setLoadingDeliveryConv(false);
    }
  };

  const fetchAgentUsers = useCallback(
    async (q = userSearch) => {
      setLoadingUsers(true);
      try {
        const data = await invokeSupportAction<{ users: any[] }>(
          'agent_lookup_user',
          { search_query: q.trim() },
          'agent'
        );
        if (data?.users) {
          setUsersList(data.users);
        }
      } catch {
        // ignore
      } finally {
        setLoadingUsers(false);
      }
    },
    [userSearch]
  );

  useEffect(() => {
    if (!session?.token) return;
    if (activeSection === 'overview') {
      fetchOverview();
    } else if (activeSection === 'support') {
      fetchAgentTickets();
    } else if (activeSection === 'deliveries') {
      fetchAgentDeliveries(1, deliveryStatusFilter, deliverySearch);
    } else if (activeSection === 'users') {
      fetchAgentUsers(userSearch);
    }
  }, [activeSection, session?.token]);

  useEffect(() => {
    if (!session?.token) return;
    const unsubGlobal = subscribeToSupportRealtime('support_agents', (evt) => {
      if (evt.type === 'support_ticket_updated') {
        if (activeSection === 'support') fetchAgentTickets();
        if (activeSection === 'overview') fetchOverview();
      }
    });
    return unsubGlobal;
  }, [session?.token, activeSection, fetchAgentTickets, fetchOverview]);

  useEffect(() => {
    if (!selectedTicket?.id) return;
    const unsubTicket = subscribeToSupportRealtime(`support_${selectedTicket.id}`, (evt) => {
      if (evt.type === 'support_ticket_updated' && evt.payload) {
        if (evt.payload.id === selectedTicket.id) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...evt.payload } : evt.payload));
        }
      } else if (evt.type === 'support_message_created' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== selectedTicket.id) return;
        setTicketMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (evt.type === 'support_message_updated' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== selectedTicket.id) return;
        setTicketMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      }
    });
    return unsubTicket;
  }, [selectedTicket?.id]);

  useEffect(() => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [ticketMessages.length]);

  const handleSectionChange = (sec: AgentSection) => {
    setActiveSection(sec);
    // Keep right sidebar closed by default on section change unless inspecting something in that section
    if (sec === 'overview') {
      setRightOpen(false);
    } else if (sec === 'support') {
      if (!selectedTicket) setRightOpen(false);
    } else if (sec === 'deliveries') {
      if (!selectedDeliveryConv) setRightOpen(false);
    } else if (sec === 'users') {
      if (rightMode !== 'user') setRightOpen(false);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    try {
      await invokeSupportAction('agent_claim_ticket', { ticket_id: ticketId }, 'agent');
      fetchAgentTickets();
      if (selectedTicket?.id === ticketId) {
        const refreshed = await invokeSupportAction<{
          ticket: SupportTicket;
          messages: SupportMessage[];
        }>('agent_get_messages', { ticket_id: ticketId }, 'agent');
        if (refreshed?.ticket) setSelectedTicket(refreshed.ticket);
        if (refreshed?.messages) setTicketMessages(refreshed.messages);
      }
    } catch {
      // ignore
    }
  };

  const handleSendAgentReply = async () => {
    if (!replyInput.trim() || !selectedTicket || sendingReply) return;
    const msgText = replyInput.trim();
    setReplyInput('');
    setSendingReply(true);
    try {
      const data = await invokeSupportAction<{
        message?: SupportMessage;
        agent_message?: SupportMessage;
        ai_message?: SupportMessage;
      }>(
        'agent_send_message',
        {
          ticket_id: selectedTicket.id,
          message: msgText,
          tag_ai: msgText.toLowerCase().includes('@delai'),
        },
        'agent'
      );
      const sentAgentMsg = data?.agent_message || data?.message;
      setTicketMessages((prev) => {
        const next = [...prev];
        if (sentAgentMsg && !next.some((m) => m.id === sentAgentMsg.id)) {
          next.push(sentAgentMsg);
        }
        if (data?.ai_message && !next.some((m) => m.id === data.ai_message!.id)) {
          next.push(data.ai_message);
        }
        return next;
      });
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  const handlePushPrivateAiMessage = async (messageId: string) => {
    if (!selectedTicket) return;
    try {
      const data = await invokeSupportAction<{ message: SupportMessage }>(
        'agent_push_message',
        { ticket_id: selectedTicket.id, tag_id: messageId, message_id: messageId },
        'agent'
      );
      if (data?.message) {
        setTicketMessages((prev) => prev.map((m) => (m.id === messageId ? data.message : m)));
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateTicketPriority = async (priority: 'low' | 'medium' | 'high') => {
    if (!selectedTicket) return;
    try {
      await invokeSupportAction(
        'agent_update_priority',
        { ticket_id: selectedTicket.id, priority },
        'agent'
      );
      setSelectedTicket((prev) => (prev ? { ...prev, priority } : prev));
      fetchAgentTickets();
    } catch {
      // ignore
    }
  };

  const handleResolveAgentTicket = async () => {
    if (!selectedTicket) return;
    try {
      await invokeSupportAction('agent_resolve_ticket', { ticket_id: selectedTicket.id }, 'agent');
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : prev));
      fetchAgentTickets();
    } catch {
      // ignore
    }
  };

  const handleAddUserTag = async (tagName: string, tagColor: string) => {
    const uid = inspectedUserDetail?.profile?.id;
    if (!uid) return;
    setShowTagDropdown(false);
    try {
      const res = await invokeSupportAction<{ tag: UserTag }>(
        'agent_add_user_tag',
        {
          user_id: uid,
          tag_name: tagName,
          tag_color: tagColor,
        },
        'agent'
      );
      if (res?.tag) {
        setInspectedUserDetail((prev: any) =>
          prev ? { ...prev, tags: [...(prev.tags || []), res.tag] } : prev
        );
        setUsersList((prev) =>
          prev.map((u) => (u.id === uid ? { ...u, tags: [...(u.tags || []), res.tag] } : u))
        );
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveUserTag = async (tagId: string) => {
    const uid = inspectedUserDetail?.profile?.id;
    try {
      await invokeSupportAction('agent_remove_user_tag', { tag_id: tagId }, 'agent');
      setInspectedUserDetail((prev: any) =>
        prev ? { ...prev, tags: (prev.tags || []).filter((t: UserTag) => t.id !== tagId) } : prev
      );
      if (uid) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === uid ? { ...u, tags: (u.tags || []).filter((t: UserTag) => t.id !== tagId) } : u
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const handleInspectTicketAuthor = () => {
    if (!selectedTicket) return;
    const uid = selectedTicket.user_id || selectedTicket.profiles?.id;
    if (uid) {
      const isDrv =
        selectedTicket.profiles?.user_type === 'rider' ||
        selectedTicket.profiles?.user_type === 'driver';
      openUserInspectorInRightSidebar(uid, isDrv ? 'credentials' : 'profile');
    } else {
      setRightMode('ticket');
      setRightOpen(true);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocStatusBadge = (doc: DriverCredentialDoc) => {
    if (!doc.uploaded) {
      return { label: 'Not Uploaded', color: '#64748B', bg: '#F1F5F9' };
    }
    const status = (doc.verification_status || '').toLowerCase();
    if (status === 'expired' || (typeof doc.days_until_expiry === 'number' && doc.days_until_expiry < 0)) {
      return { label: 'Expired', color: '#B91C1C', bg: '#FEF2F2' };
    }
    if (status === 'expiring_soon' || (typeof doc.days_until_expiry === 'number' && doc.days_until_expiry <= 30 && doc.extracted_expiry_date)) {
      return { label: 'Expiring Soon', color: '#92400E', bg: '#FFFBEB' };
    }
    if (doc.verified || status === 'verified') {
      return { label: 'Verified', color: '#065F46', bg: '#ECFDF5' };
    }
    return { label: 'Uploaded', color: '#204B7A', bg: '#EFF6FF' };
  };

  const isPdfUrl = (url?: string, contentType?: string) => {
    if (contentType && contentType.toLowerCase().includes('pdf')) return true;
    return Boolean(url && /\.pdf(\?|$)/i.test(url));
  };

  const isImageUrl = (url?: string, contentType?: string) => {
    if (contentType && contentType.toLowerCase().startsWith('image/')) return true;
    if (url && /^data:image\//i.test(url)) return true;
    return !isPdfUrl(url, contentType);
  };

  const currentTabTickets = ticketsBuckets[ticketTab] || [];
  const isDelAiActive = replyInput.toLowerCase().includes('@delai');
  const creds: DriverCredentials | null = inspectedUserDetail?.driver_credentials || null;
  const ninPhotoSrc = resolveSupportMediaUrl(
    creds?.nin_record?.photo
      ? creds.nin_record.photo.startsWith('data:') || creds.nin_record.photo.startsWith('http')
        ? creds.nin_record.photo
        : `data:image/jpeg;base64,${creds.nin_record.photo}`
      : inspectedUserDetail?.profile?.avatar_url
  );

  return (
    <div className="da-shell">
      {/* ==================== 1. TRADITIONAL LEFT SIDEBAR ==================== */}
      <aside className={`da-left-sidebar ${sidebarCollapsed ? 'da-left-sidebar-collapsed' : ''}`}>
        <div>
          <div className="da-sidebar-brand">
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span
                  role="img"
                  aria-label="Deliva"
                  className="dg-logo-mark"
                  style={{ height: 24, cursor: 'pointer' }}
                  onClick={() => handleSectionChange('overview')}
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--dg-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Ops
                </span>
              </div>
            ) : (
              <div
                onClick={() => handleSectionChange('overview')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--dg-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  cursor: 'pointer',
                  margin: '0 auto',
                }}
              >
                D
              </div>
            )}
          </div>

          <nav className="da-sidebar-nav" aria-label="Agent navigation">
            {(
              [
                { id: 'overview', label: 'Overview', icon: 'overview' },
                { id: 'support', label: 'Support', icon: 'support', badge: queueBadgeCount },
                { id: 'deliveries', label: 'Deliveries', icon: 'deliveries' },
                { id: 'users', label: 'Users & Drivers', icon: 'users' },
              ] as const
            ).map((nav) => {
              const active = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => handleSectionChange(nav.id)}
                  title={sidebarCollapsed ? nav.label : undefined}
                  className={`da-nav-item ${active ? 'da-nav-item-active' : ''}`}
                  style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                >
                  <SidebarIcon name={nav.icon} />
                  {!sidebarCollapsed && <span>{nav.label}</span>}
                  {'badge' in nav && nav.badge !== undefined && nav.badge > 0 && (
                    <span
                      className={`da-nav-badge ${
                        sidebarCollapsed ? 'da-nav-badge-collapsed' : ''
                      }`}
                    >
                      {nav.badge > 99 ? '99+' : nav.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="da-sidebar-footer">
          {!sidebarCollapsed && session?.user && (
            <div style={{ padding: '6px 10px 10px', borderBottom: '1px solid var(--dg-border)', marginBottom: 4 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                {session.user.first_name} {session.user.last_name}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--dg-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.user.email}
              </div>
            </div>
          )}

          <button
            type="button"
            className="da-nav-item"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
          >
            <SidebarIcon name={sidebarCollapsed ? 'expand' : 'collapse'} />
            {!sidebarCollapsed && <span>Collapse sidebar</span>}
          </button>

          <button
            type="button"
            className="da-nav-item"
            onClick={() => {
              setAgentSession(null);
              onNavigate('/agent-login');
            }}
            style={{
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: '#B91C1C',
            }}
          >
            <SidebarIcon name="logout" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ==================== 2. WORKSPACE (MAIN CONTENT + OPTIONAL RIGHT SIDEBAR) ==================== */}
      <div className="da-workspace">
        <main className="da-main">
          {/* ---------- SECTION 1: OVERVIEW ---------- */}
          {activeSection === 'overview' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 18,
                    borderBottom: '1px solid var(--dg-border)',
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h1 className="dp-title" style={{ color: 'var(--dg-primary)' }}>
                      Operations overview
                    </h1>
                    <p className="dp-subtitle">
                      Real-time summary of support tickets, deliveries, and registered users &amp; drivers.
                    </p>
                  </div>
                  <button type="button" className="dp-text-btn" onClick={fetchOverview}>
                    Refresh
                  </button>
                </div>

                {loadingOverview && !overviewData ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                    Loading overview…
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
                        gap: 14,
                        marginBottom: 32,
                      }}
                    >
                      {[
                        {
                          label: 'Ticket Queue',
                          value: overviewData?.stats?.queue_count ?? overviewData?.queue_count ?? 0,
                          target: 'support' as AgentSection,
                        },
                        {
                          label: 'My Tickets',
                          value: overviewData?.stats?.my_tickets_count ?? overviewData?.my_tickets_count ?? 0,
                          target: 'support' as AgentSection,
                        },
                        {
                          label: 'Resolved',
                          value: overviewData?.stats?.resolved_count ?? overviewData?.resolved_count ?? 0,
                          target: 'support' as AgentSection,
                        },
                        {
                          label: 'Active Deliveries',
                          value: overviewData?.stats?.active_deliveries ?? overviewData?.active_deliveries ?? 0,
                          target: 'deliveries' as AgentSection,
                        },
                        {
                          label: 'Total Deliveries',
                          value: overviewData?.stats?.total_deliveries ?? overviewData?.total_deliveries ?? 0,
                          target: 'deliveries' as AgentSection,
                        },
                        {
                          label: 'Total Users',
                          value: overviewData?.stats?.total_users ?? overviewData?.total_users ?? 0,
                          target: 'users' as AgentSection,
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          onClick={() => handleSectionChange(card.target)}
                          style={{
                            background: 'var(--dg-bg-alt)',
                            border: '1px solid var(--dg-border)',
                            borderRadius: 8,
                            padding: 16,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', fontWeight: 600 }}>
                            {card.label}
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dg-primary)', marginTop: 4 }}>
                            {card.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: 32,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: 10,
                            borderBottom: '1px solid var(--dg-border)',
                          }}
                        >
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                            Recent tickets
                          </h3>
                          <button
                            type="button"
                            className="dg-link-btn"
                            onClick={() => handleSectionChange('support')}
                          >
                            View all &rarr;
                          </button>
                        </div>

                        {(overviewData?.recent_tickets || []).length === 0 ? (
                          <div style={{ padding: '24px 0', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No support tickets yet
                          </div>
                        ) : (
                          (overviewData?.recent_tickets || []).map((t: SupportTicket) => {
                            const st = STATUS_BADGES[t.status] || STATUS_BADGES.ai_handling;
                            const uName = t.profiles
                              ? `${t.profiles.first_name} ${t.profiles.last_name}`.trim()
                              : t.guest_name || 'Customer';
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  handleSectionChange('support');
                                  openAgentTicket(t);
                                }}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px 0',
                                  borderBottom: '1px solid var(--dg-border)',
                                  cursor: 'pointer',
                                  gap: 12,
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                                    {t.subject}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                                    {uName} &bull; {formatTimeAgo(t.updated_at)}
                                  </div>
                                </div>
                                <span
                                  className="ds-status-pill"
                                  style={{ background: st.bg, color: st.color }}
                                >
                                  {st.label}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: 10,
                            borderBottom: '1px solid var(--dg-border)',
                          }}
                        >
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                            Recent deliveries
                          </h3>
                          <button
                            type="button"
                            className="dg-link-btn"
                            onClick={() => handleSectionChange('deliveries')}
                          >
                            View all &rarr;
                          </button>
                        </div>

                        {(overviewData?.recent_deliveries || []).length === 0 ? (
                          <div style={{ padding: '24px 0', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No deliveries recorded yet
                          </div>
                        ) : (
                          (overviewData?.recent_deliveries || []).map((d: any) => {
                            const st = DELIVERY_STATUS_STYLE[d.status] || DELIVERY_STATUS_STYLE.pending;
                            return (
                              <div
                                key={d.id}
                                onClick={() => {
                                  handleSectionChange('deliveries');
                                  openDeliveryInspector(d.id);
                                }}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px 0',
                                  borderBottom: '1px solid var(--dg-border)',
                                  cursor: 'pointer',
                                  gap: 12,
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                                    {d.tracking_id || `#${String(d.id).slice(0, 8)}`}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.78rem',
                                      color: 'var(--dg-text-secondary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {d.pickup_address} &rarr; {d.delivery_address}
                                  </div>
                                </div>
                                <span
                                  className="ds-status-pill"
                                  style={{ background: st.bg, color: st.color }}
                                >
                                  {st.label}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---------- SECTION 2: SUPPORT TICKETS ---------- */}
          {activeSection === 'support' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div
                style={{
                  width: 340,
                  borderRight: '1px solid var(--dg-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: 64,
                    padding: '0 16px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--dg-primary)' }}>Support queue</span>
                  <button type="button" className="dp-text-btn" onClick={fetchAgentTickets}>
                    Refresh
                  </button>
                </div>

                <div className="ds-tabs" style={{ padding: '0 16px', marginBottom: 0 }}>
                  {(
                    [
                      { key: 'queue', label: `Queue (${ticketsBuckets.queue.length})` },
                      { key: 'my_tickets', label: `Mine (${ticketsBuckets.my_tickets.length})` },
                      { key: 'resolved', label: `Resolved (${ticketsBuckets.resolved.length})` },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={`ds-tab ${ticketTab === t.key ? 'ds-tab-active' : ''}`}
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => setTicketTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingTickets ? (
                    <div style={{ padding: 36, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                      Loading tickets…
                    </div>
                  ) : currentTabTickets.length === 0 ? (
                    <div style={{ padding: 36, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                      No tickets in this tab
                    </div>
                  ) : (
                    currentTabTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;
                      const st = STATUS_BADGES[t.status] || STATUS_BADGES.ai_handling;
                      const pr = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
                      const userName = t.profiles
                        ? `${t.profiles.first_name} ${t.profiles.last_name}`.trim()
                        : t.guest_name || 'Customer';

                      return (
                        <div
                          key={t.id}
                          onClick={() => openAgentTicket(t)}
                          style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--dg-border)',
                            background: isSelected ? 'var(--dg-bg-alt)' : '#FFFFFF',
                            borderLeft: isSelected ? '3px solid var(--dg-primary)' : '3px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                              {userName}
                            </span>
                            <span
                              className="ds-status-pill"
                              style={{ background: pr.bg, color: pr.color }}
                            >
                              {pr.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dg-primary)', marginBottom: 8 }}>
                            {t.subject}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              className="ds-status-pill"
                              style={{ background: st.bg, color: st.color }}
                            >
                              {st.label}
                            </span>
                            {!t.assigned_agent_id && t.status === 'escalated' ? (
                              <button
                                type="button"
                                className="dp-text-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimTicket(t.id);
                                }}
                              >
                                Claim
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--dg-text-muted)' }}>
                                {formatTimeAgo(t.updated_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ticket Conversation Pane */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dg-bg-alt)', minWidth: 0 }}>
                {selectedTicket ? (
                  <>
                    <div
                      style={{
                        minHeight: 64,
                        padding: '10px 20px',
                        background: '#FFFFFF',
                        borderBottom: '1px solid var(--dg-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                          {selectedTicket.subject}
                        </div>
                        <button
                          type="button"
                          className="dg-inline-link"
                          style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--dg-text-secondary)' }}
                          onClick={handleInspectTicketAuthor}
                        >
                          {selectedTicket.profiles
                            ? `${selectedTicket.profiles.first_name} ${selectedTicket.profiles.last_name} (${selectedTicket.profiles.email})`
                            : `${selectedTicket.guest_name || 'Guest'} (${selectedTicket.guest_email || ''})`}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="dp-text-btn"
                          onClick={() => {
                            if (rightOpen && rightMode === 'user') {
                              setRightOpen(false);
                            } else {
                              handleInspectTicketAuthor();
                            }
                          }}
                        >
                          {rightOpen ? 'Hide info' : 'Inspect user'}
                        </button>

                        <select
                          className="dg-select"
                          style={{ width: 'auto', padding: '5px 30px 5px 10px', fontSize: '0.8rem' }}
                          value={selectedTicket.priority}
                          onChange={(e) =>
                            handleUpdateTicketPriority(e.target.value as 'low' | 'medium' | 'high')
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>

                        {!selectedTicket.assigned_agent_id &&
                          selectedTicket.status !== 'resolved' && (
                            <button
                              type="button"
                              className="dp-submit-btn"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => handleClaimTicket(selectedTicket.id)}
                            >
                              Claim
                            </button>
                          )}

                        {selectedTicket.status !== 'resolved' && (
                          <button
                            type="button"
                            className="dp-text-btn"
                            onClick={handleResolveAgentTicket}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {loadingChat ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--dg-text-secondary)' }}>
                          Loading conversation…
                        </div>
                      ) : (
                        ticketMessages.map((m) => {
                          const isAgent = m.sender_type === 'agent';
                          const isSystem = m.sender_type === 'system';
                          const isAI = m.sender_type === 'ai';
                          const isPrivate = Boolean(m.metadata?.is_private);
                          const canPush = Boolean(m.metadata?.can_push && isPrivate);

                          if (isSystem) {
                            return (
                              <div
                                key={m.id}
                                style={{
                                  alignSelf: 'center',
                                  fontSize: '0.78rem',
                                  color: 'var(--dg-text-secondary)',
                                  padding: '4px 12px',
                                }}
                              >
                                {m.content}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={m.id}
                              style={{
                                alignSelf: isAgent ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                              }}
                            >
                              {isPrivate && (
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                                  Private note (agent only)
                                </div>
                              )}

                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  background: isPrivate
                                    ? '#FFFBEB'
                                    : isAgent
                                    ? 'var(--dg-primary)'
                                    : '#FFFFFF',
                                  color: isAgent && !isPrivate ? '#FFFFFF' : '#0F172A',
                                  border: isPrivate
                                    ? '1px dashed #F59E0B'
                                    : isAgent
                                    ? 'none'
                                    : '1px solid var(--dg-border)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    marginBottom: 4,
                                    color: isPrivate
                                      ? '#92400E'
                                      : isAgent
                                      ? 'rgba(255,255,255,0.85)'
                                      : 'var(--dg-primary)',
                                  }}
                                >
                                  {isAgent
                                    ? 'You'
                                    : isAI
                                    ? isPrivate
                                      ? 'Deliva AI (Private Co-Pilot)'
                                      : 'Deliva AI'
                                    : 'Customer'}
                                </div>
                                <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                  {m.content}
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 6,
                                    gap: 12,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      color: isAgent && !isPrivate ? 'rgba(255,255,255,0.75)' : 'var(--dg-text-muted)',
                                    }}
                                  >
                                    {new Date(m.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>

                                  {canPush && (
                                    <button
                                      type="button"
                                      className="dp-text-btn"
                                      onClick={() => handlePushPrivateAiMessage(m.id)}
                                    >
                                      Push to customer
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {selectedTicket.status !== 'resolved' && (
                      <div
                        style={{
                          background: '#FFFFFF',
                          borderTop: '1px solid var(--dg-border)',
                          padding: '12px 18px',
                        }}
                      >
                        {isDelAiActive && (
                          <div style={{ fontSize: '0.76rem', color: '#92400E', marginBottom: 6, fontWeight: 600 }}>
                            @delai Co-Pilot active — response stays private until you click Push to customer
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="dp-text-btn"
                            onClick={() => {
                              if (!isDelAiActive) {
                                setReplyInput((prev) => `@delai ${prev}`);
                              }
                            }}
                          >
                            @delai
                          </button>

                          <input
                            type="text"
                            className="dg-input"
                            placeholder="Reply to customer (prefix @delai for private AI help)..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendAgentReply();
                              }
                            }}
                            style={{ padding: '10px 14px' }}
                          />

                          <button
                            type="button"
                            disabled={!replyInput.trim() || sendingReply}
                            onClick={handleSendAgentReply}
                            className="dp-submit-btn"
                            style={{ padding: '0 20px' }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dg-text-muted)',
                      fontSize: '0.92rem',
                    }}
                  >
                    Select a ticket from the queue to view messages
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- SECTION 3: DELIVERIES ---------- */}
          {activeSection === 'deliveries' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selectedDeliveryConv ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: 64,
                      padding: '0 24px',
                      borderBottom: '1px solid var(--dg-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        type="button"
                        className="dp-text-btn"
                        onClick={() => {
                          setSelectedDeliveryConv(null);
                          setRightOpen(false);
                        }}
                      >
                        &larr; Deliveries
                      </button>
                      <div style={{ fontWeight: 700, color: 'var(--dg-primary)' }}>
                        {selectedDeliveryConv.delivery?.tracking_id || 'Delivery Conversation'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={() => {
                        setRightMode('delivery');
                        setRightOpen((prev) => !prev);
                      }}
                    >
                      {rightOpen && rightMode === 'delivery' ? 'Hide details' : 'Delivery & Driver Info'}
                    </button>
                  </div>

                  <div style={{ flex: 1, background: 'var(--dg-bg-alt)', padding: 24, overflowY: 'auto' }}>
                    <div style={{ maxWidth: 760, margin: '0 auto' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dg-primary)', marginBottom: 14 }}>
                        Customer – Driver Conversation ({(selectedDeliveryConv.messages || []).length} messages)
                      </h3>
                      {(selectedDeliveryConv.messages || []).length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.88rem' }}>
                          No chat messages recorded for this delivery
                        </div>
                      ) : (
                        (selectedDeliveryConv.messages || []).map((msg: any) => {
                          const isCustomer =
                            msg.sender_id === selectedDeliveryConv.consumer?.id ||
                            msg.sender_id === selectedDeliveryConv.conversation?.consumer_id;
                          return (
                            <div
                              key={msg.id}
                              style={{
                                marginBottom: 10,
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: isCustomer ? '#FFFFFF' : 'var(--dg-primary)',
                                color: isCustomer ? '#0F172A' : '#FFFFFF',
                                border: isCustomer ? '1px solid var(--dg-border)' : 'none',
                                maxWidth: '75%',
                                marginLeft: isCustomer ? 0 : 'auto',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: isCustomer ? 'var(--dg-primary)' : 'rgba(255,255,255,0.8)',
                                  marginBottom: 4,
                                }}
                              >
                                {isCustomer ? 'Customer' : 'Driver'}
                              </div>
                              <div style={{ fontSize: '0.88rem', lineHeight: 1.45 }}>{msg.content}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 28px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 14,
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <h2 className="dp-title" style={{ fontSize: '1.35rem', color: 'var(--dg-primary)' }}>
                        Deliveries ({deliveriesTotal})
                      </h2>
                    </div>
                    <div style={{ width: 320 }}>
                      <input
                        type="text"
                        className="dg-input"
                        placeholder="Search tracking ID, address, recipient..."
                        value={deliverySearch}
                        onChange={(e) => {
                          setDeliverySearch(e.target.value);
                          fetchAgentDeliveries(1, deliveryStatusFilter, e.target.value);
                        }}
                        style={{ padding: '9px 12px' }}
                      />
                    </div>
                  </div>

                  <div className="ds-tabs" style={{ marginBottom: 12 }}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'accepted', label: 'Accepted' },
                      { key: 'picked_up', label: 'Picked Up' },
                      { key: 'in_transit', label: 'In Transit' },
                      { key: 'delivered', label: 'Delivered' },
                      { key: 'cancelled', label: 'Cancelled' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`ds-tab ${deliveryStatusFilter === f.key ? 'ds-tab-active' : ''}`}
                        onClick={() => {
                          setDeliveryStatusFilter(f.key);
                          fetchAgentDeliveries(1, f.key, deliverySearch);
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loadingDeliveries || loadingDeliveryConv ? (
                      <div style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                        Loading deliveries…
                      </div>
                    ) : deliveries.length === 0 ? (
                      <div style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-muted)' }}>
                        No deliveries match your filter
                      </div>
                    ) : (
                      deliveries.map((d) => {
                        const st = DELIVERY_STATUS_STYLE[d.status] || DELIVERY_STATUS_STYLE.pending;
                        return (
                          <div
                            key={d.id}
                            onClick={() => openDeliveryInspector(d.id)}
                            style={{
                              padding: '14px 0',
                              borderBottom: '1px solid var(--dg-border)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <strong style={{ color: 'var(--dg-primary)' }}>
                                  {d.tracking_id || `#${String(d.id).slice(0, 8)}`}
                                </strong>
                                <span
                                  className="ds-status-pill"
                                  style={{ background: st.bg, color: st.color }}
                                >
                                  {st.label}
                                </span>
                              </div>
                              <strong style={{ fontSize: '0.9rem' }}>
                                ₦{Number(d.total_cost || 0).toLocaleString()}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.84rem', color: 'var(--dg-text-secondary)', marginBottom: 4 }}>
                              {d.pickup_address} &rarr; {d.delivery_address}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--dg-text-muted)' }}>
                              <span>
                                Customer:{' '}
                                {d.profiles ? `${d.profiles.first_name} ${d.profiles.last_name}` : 'N/A'}
                              </span>
                              <span>
                                Driver:{' '}
                                {d.driver_profile
                                  ? `${d.driver_profile.first_name} ${d.driver_profile.last_name}${
                                      d.driver_profile.vehicle_plate
                                        ? ` (${d.driver_profile.vehicle_plate})`
                                        : ''
                                    }`
                                  : 'Unassigned'}
                              </span>
                              <span>{formatTimeAgo(d.created_at)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {deliveriesTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 16 }}>
                        <button
                          type="button"
                          className="dp-text-btn"
                          disabled={deliveriesPage <= 1}
                          onClick={() =>
                            fetchAgentDeliveries(deliveriesPage - 1, deliveryStatusFilter, deliverySearch)
                          }
                        >
                          Prev
                        </button>
                        <span style={{ fontSize: '0.84rem', alignSelf: 'center' }}>
                          Page {deliveriesPage} / {deliveriesTotalPages}
                        </span>
                        <button
                          type="button"
                          className="dp-text-btn"
                          disabled={deliveriesPage >= deliveriesTotalPages}
                          onClick={() =>
                            fetchAgentDeliveries(deliveriesPage + 1, deliveryStatusFilter, deliverySearch)
                          }
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- SECTION 4: USERS & DRIVERS DIRECTORY ---------- */}
          {activeSection === 'users' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px 28px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 className="dp-title" style={{ fontSize: '1.35rem', color: 'var(--dg-primary)' }}>
                    Users &amp; Drivers
                  </h2>
                  <p className="dp-subtitle">
                    Select any account to inspect profile details, driver licenses, and compliance credentials.
                  </p>
                </div>
                <div style={{ width: 340 }}>
                  <input
                    type="text"
                    className="dg-input"
                    placeholder="Search name, email, phone, plate, license, NIN..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      fetchAgentUsers(e.target.value);
                    }}
                    style={{ padding: '9px 12px' }}
                  />
                </div>
              </div>

              <div className="ds-tabs" style={{ marginBottom: 12 }}>
                {(
                  [
                    { key: 'all', label: `All (${usersList.length})` },
                    {
                      key: 'consumer',
                      label: `Consumers (${
                        usersList.filter((u) => u.user_type !== 'rider' && u.user_type !== 'driver').length
                      })`,
                    },
                    {
                      key: 'rider',
                      label: `Drivers (${
                        usersList.filter((u) => u.user_type === 'rider' || u.user_type === 'driver').length
                      })`,
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`ds-tab ${userTypeFilter === f.key ? 'ds-tab-active' : ''}`}
                    onClick={() => setUserTypeFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingUsers ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                    Loading directory…
                  </div>
                ) : (
                  usersList
                    .filter((u) => userTypeFilter === 'all' || u.user_type === userTypeFilter)
                    .map((u) => {
                      const isDriver = u.user_type === 'rider' || u.user_type === 'driver';
                      const isSelected = rightOpen && rightMode === 'user' && inspectedUserId === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() =>
                            openUserInspectorInRightSidebar(u.id, isDriver ? 'credentials' : 'profile')
                          }
                          style={{
                            padding: '14px 12px',
                            borderBottom: '1px solid var(--dg-border)',
                            background: isSelected ? 'var(--dg-bg-alt)' : '#FFFFFF',
                            borderLeft: isSelected ? '3px solid var(--dg-primary)' : '3px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--dg-primary)', fontSize: '0.94rem' }}>
                                {u.first_name} {u.last_name}
                              </span>
                              <span
                                className="ds-status-pill"
                                style={{
                                  background: isDriver ? '#FFFBEB' : '#EFF6FF',
                                  color: isDriver ? '#92400E' : '#204B7A',
                                }}
                              >
                                {isDriver ? 'Driver' : 'Consumer'}
                              </span>
                              {isDriver && u.expiry_locked && (
                                <span className="ds-status-pill" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                                  Docs Expired
                                </span>
                              )}
                              {isDriver && !u.expiry_locked && (u.nin_verified || u.license_verified) && (
                                <span className="ds-status-pill" style={{ background: '#ECFDF5', color: '#065F46' }}>
                                  {u.nin_verified && u.license_verified ? 'Verified' : u.nin_verified ? 'NIN Verified' : 'Licence Verified'}
                                </span>
                              )}
                              {(u.tags || []).map((t: UserTag) => (
                                <span
                                  key={t.id}
                                  className="ds-status-pill"
                                  style={{ border: `1px solid ${t.tag_color}`, color: t.tag_color, background: '#FFFFFF' }}
                                >
                                  {t.tag_name}
                                </span>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginTop: 3 }}>
                              {u.email} &bull; {u.phone || 'No phone'}
                              {isDriver && u.vehicle_plate ? ` • Plate: ${u.vehicle_plate}` : ''}
                              {isDriver && u.license_number ? ` • Licence: ${u.license_number}` : ''}
                            </div>
                          </div>

                          <span style={{ fontSize: '0.8rem', color: 'var(--dg-primary)', fontWeight: 600, flexShrink: 0 }}>
                            {isDriver ? 'View credentials' : 'Inspect'} &rsaquo;
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </main>

        {/* ==================== 3. CONTEXTUAL RIGHT SIDEBAR (OPENS WHEN NEEDED) ==================== */}
        {rightOpen && (
          <aside
            className={`da-right-sidebar ${rightWide ? 'da-right-sidebar-wide' : ''}`}
            aria-label="Context inspector sidebar"
          >
            {/* Right Sidebar Header */}
            <div className="da-right-head">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--dg-primary)' }}>
                {rightMode === 'user'
                  ? inspectedUserDetail?.is_driver
                    ? 'Driver Details & Credentials'
                    : 'User Details'
                  : rightMode === 'delivery'
                  ? 'Delivery & Driver Info'
                  : 'Ticket Details'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="dp-text-btn"
                  onClick={() => setRightWide((w) => !w)}
                >
                  {rightWide ? 'Narrow' : 'Widen'}
                </button>
                <button
                  type="button"
                  className="dp-text-btn"
                  onClick={() => setRightOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Right Mode: GUEST TICKET SUMMARY */}
            {rightMode === 'ticket' && selectedTicket && (
              <div className="da-right-body">
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dg-primary)', marginBottom: 4 }}>
                  {selectedTicket.guest_name || 'Guest Inquiry'}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--dg-text-secondary)', marginBottom: 16 }}>
                  {selectedTicket.guest_email || 'No email on file'}
                </div>
                <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Subject</span>
                    <span className="ds-contact-value">{selectedTicket.subject}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Category</span>
                    <span className="ds-contact-value">{selectedTicket.category}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Department</span>
                    <span className="ds-contact-value">{selectedTicket.department || 'General'}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Priority</span>
                    <span className="ds-contact-value">{selectedTicket.priority}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Mode: DELIVERY INSPECTOR */}
            {rightMode === 'delivery' && selectedDeliveryConv && (
              <div className="da-right-body">
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--dg-primary)', marginBottom: 4 }}>
                  {selectedDeliveryConv.delivery?.tracking_id || 'Delivery'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginBottom: 16 }}>
                  {selectedDeliveryConv.delivery?.created_at
                    ? `Created ${new Date(selectedDeliveryConv.delivery.created_at).toLocaleString()}`
                    : ''}
                </div>

                <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Status</span>
                    <span className="ds-contact-value">{selectedDeliveryConv.delivery?.status}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Pickup</span>
                    <span className="ds-contact-value">{selectedDeliveryConv.delivery?.pickup_address}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Drop-off</span>
                    <span className="ds-contact-value">{selectedDeliveryConv.delivery?.delivery_address}</span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Cost</span>
                    <span className="ds-contact-value">
                      ₦{Number(selectedDeliveryConv.delivery?.total_cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Payment</span>
                    <span className="ds-contact-value">
                      {selectedDeliveryConv.delivery?.payment_status} ({selectedDeliveryConv.delivery?.selected_payment_type})
                    </span>
                  </div>
                </div>

                {/* Customer Link */}
                {selectedDeliveryConv.consumer && (
                  <div className="da-cred-section">
                    <div className="da-cred-title">Customer</div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                      {selectedDeliveryConv.consumer.first_name} {selectedDeliveryConv.consumer.last_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginBottom: 8 }}>
                      {selectedDeliveryConv.consumer.email} &bull; {selectedDeliveryConv.consumer.phone || 'No phone'}
                    </div>
                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={() =>
                        openUserInspectorInRightSidebar(selectedDeliveryConv.consumer.id, 'profile')
                      }
                    >
                      Inspect customer profile
                    </button>
                  </div>
                )}

                {/* Assigned Driver + Quick License Inspection Link */}
                <div className="da-cred-section">
                  <div className="da-cred-title">Assigned Driver</div>
                  {selectedDeliveryConv.driver ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                        {selectedDeliveryConv.driver.first_name} {selectedDeliveryConv.driver.last_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginBottom: 6 }}>
                        {selectedDeliveryConv.driver.phone || selectedDeliveryConv.driver.email} &bull;{' '}
                        {selectedDeliveryConv.driver.vehicle_type || 'bike'}
                      </div>
                      {(selectedDeliveryConv.driver.vehicle_plate ||
                        selectedDeliveryConv.driver.license_number) && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--dg-primary)', fontWeight: 600, marginBottom: 10 }}>
                          {selectedDeliveryConv.driver.vehicle_plate
                            ? `Plate: ${selectedDeliveryConv.driver.vehicle_plate}`
                            : ''}
                          {selectedDeliveryConv.driver.vehicle_plate &&
                          selectedDeliveryConv.driver.license_number
                            ? ' • '
                            : ''}
                          {selectedDeliveryConv.driver.license_number
                            ? `Licence: ${selectedDeliveryConv.driver.license_number}`
                            : ''}
                        </div>
                      )}
                      <button
                        type="button"
                        className="dp-submit-btn"
                        style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                        onClick={() =>
                          openUserInspectorInRightSidebar(
                            selectedDeliveryConv.driver.id,
                            'credentials'
                          )
                        }
                      >
                        View driver licenses &amp; credentials
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--dg-text-muted)' }}>
                      No driver assigned yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Mode: FULL USER / DRIVER INSPECTOR */}
            {rightMode === 'user' && (
              <>
                {loadingInspectedUser ? (
                  <div className="da-right-body" style={{ textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                    Loading account information…
                  </div>
                ) : !inspectedUserDetail ? (
                  <div className="da-right-body" style={{ textAlign: 'center', color: 'var(--dg-text-muted)' }}>
                    Could not load account details.
                  </div>
                ) : (
                  <>
                    {/* User Identity & Tags Summary Header */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dg-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        {ninPhotoSrc ? (
                          <img
                            src={ninPhotoSrc}
                            alt=""
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              objectFit: 'cover',
                              border: '1px solid var(--dg-border)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              background: 'var(--dg-primary)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1rem',
                              flexShrink: 0,
                            }}
                          >
                            {(inspectedUserDetail.profile?.first_name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--dg-primary)' }}>
                              {inspectedUserDetail.profile?.first_name}{' '}
                              {inspectedUserDetail.profile?.last_name}
                            </span>
                            <span
                              className="ds-status-pill"
                              style={{
                                background: inspectedUserDetail.is_driver ? '#FFFBEB' : '#EFF6FF',
                                color: inspectedUserDetail.is_driver ? '#92400E' : '#204B7A',
                              }}
                            >
                              {inspectedUserDetail.is_driver ? 'Driver' : 'Consumer'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                            {inspectedUserDetail.profile?.email} &bull;{' '}
                            {inspectedUserDetail.profile?.phone || 'No phone'}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
                        {(inspectedUserDetail.tags || []).map((tag: UserTag) => (
                          <span
                            key={tag.id}
                            className="ds-status-pill"
                            style={{
                              border: `1px solid ${tag.tag_color}`,
                              color: tag.tag_color,
                              background: '#FFFFFF',
                            }}
                          >
                            {tag.tag_name}{' '}
                            <button
                              type="button"
                              onClick={() => handleRemoveUserTag(tag.id)}
                              style={{ border: 'none', background: 'none', color: tag.tag_color, cursor: 'pointer' }}
                            >
                              &times;
                            </button>
                          </span>
                        ))}

                        <button
                          type="button"
                          className="dp-text-btn"
                          style={{ padding: '3px 9px', fontSize: '0.74rem' }}
                          onClick={() => setShowTagDropdown(!showTagDropdown)}
                        >
                          + Tag
                        </button>

                        {showTagDropdown && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 30,
                              left: 0,
                              background: '#FFFFFF',
                              border: '1px solid var(--dg-border)',
                              borderRadius: 8,
                              zIndex: 50,
                              minWidth: 140,
                              boxShadow: '0 6px 20px rgba(15,23,42,0.1)',
                            }}
                          >
                            {PRESET_TAGS.map((pt) => (
                              <button
                                key={pt.name}
                                type="button"
                                onClick={() => handleAddUserTag(pt.name, pt.color)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '0.8rem',
                                  color: pt.color,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {pt.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Inspector Sub-Tabs */}
                    <div
                      className="ds-tabs"
                      style={{
                        padding: '0 18px',
                        marginBottom: 0,
                        gap: 14,
                        overflowX: 'auto',
                        flexShrink: 0,
                      }}
                    >
                      {(
                        [
                          { key: 'profile', label: 'Profile' },
                          ...(inspectedUserDetail.is_driver
                            ? [{ key: 'credentials' as const, label: 'Licenses & Docs' }]
                            : []),
                          {
                            key: 'deliveries',
                            label: `Deliveries (${(inspectedUserDetail.deliveries || []).length})`,
                          },
                          {
                            key: 'payments',
                            label: `Payments (${(inspectedUserDetail.payment_methods || []).length})`,
                          },
                          {
                            key: 'addresses',
                            label: `Addresses (${(inspectedUserDetail.addresses || []).length})`,
                          },
                          {
                            key: 'tickets',
                            label: `Tickets (${(inspectedUserDetail.support_tickets || []).length})`,
                          },
                        ] as { key: RightTab; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`ds-tab ${rightTab === tab.key ? 'ds-tab-active' : ''}`}
                          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => setRightTab(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Inspector Tab Body */}
                    <div className="da-right-body">
                      {/* 1. PROFILE */}
                      {rightTab === 'profile' && (
                        <>
                          <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                            <div className="ds-contact-row">
                              <span className="ds-contact-label">Wallet balance</span>
                              <span className="ds-contact-value">
                                ₦{Number(inspectedUserDetail.wallet_balance || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="ds-contact-row">
                              <span className="ds-contact-label">Completed deliveries</span>
                              <span className="ds-contact-value">
                                {inspectedUserDetail.profile?.total_deliveries_completed || 0}
                              </span>
                            </div>
                            {inspectedUserDetail.is_driver && (
                              <>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Total earnings</span>
                                  <span className="ds-contact-value">
                                    ₦{Number(inspectedUserDetail.total_earnings || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Rating</span>
                                  <span className="ds-contact-value">
                                    {Number(inspectedUserDetail.profile?.rating || 0).toFixed(1)} / 5 (
                                    {inspectedUserDetail.profile?.rating_count || 0})
                                  </span>
                                </div>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Driver Licence</span>
                                  <span className="ds-contact-value">
                                    {creds?.license_number || 'Not provided'}
                                  </span>
                                </div>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Vehicle Plate</span>
                                  <span className="ds-contact-value">
                                    {creds?.vehicle_plate || 'Not provided'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {inspectedUserDetail.is_driver && (
                            <div style={{ marginTop: 18 }}>
                              <button
                                type="button"
                                className="dp-submit-btn"
                                style={{ width: '100%', padding: '10px 14px', fontSize: '0.84rem' }}
                                onClick={() => setRightTab('credentials')}
                              >
                                View licenses, NIN &amp; compliance documents
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 2. DRIVER LICENSES & CREDENTIALS */}
                      {rightTab === 'credentials' && inspectedUserDetail.is_driver && (
                        <>
                          {!creds ? (
                            <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                              No driver credential profile has been created for this user yet.
                            </div>
                          ) : (
                            <>
                              {/* Compliance Status Alerts */}
                              {creds.expiry_locked && (
                                <div className="dp-alert dp-alert-error" style={{ marginBottom: 14 }}>
                                  Account locked due to expired document(s):{' '}
                                  {(creds.expired_document_types || []).join(', ') || 'Check expiry dates'}
                                </div>
                              )}
                              {!creds.expiry_locked && creds.expiry_warning_active && (
                                <div className="dp-alert dp-alert-warning" style={{ marginBottom: 14 }}>
                                  {creds.next_expiring_doc_label || creds.next_expiring_doc_type} expires{' '}
                                  {creds.next_document_expiry} ({creds.days_until_next_expiry} days left)
                                </div>
                              )}

                              {/* Activation & Compliance Overview */}
                              <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Portal Onboarding</span>
                                  <span className="ds-contact-value">
                                    {creds.portal_completed ? 'Completed' : 'Incomplete'}
                                  </span>
                                </div>
                                <div className="ds-contact-row">
                                  <span className="ds-contact-label">Activation</span>
                                  <span className="ds-contact-value">
                                    {creds.is_activated ? 'Activated' : 'Inactive'} &bull;{' '}
                                    {creds.is_online ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                {creds.next_document_expiry && (
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Next Document Expiry</span>
                                    <span className="ds-contact-value">
                                      {creds.next_document_expiry} ({creds.days_until_next_expiry}d)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* NIMC Identity & NIN Credentials */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">NIMC Identity &amp; NIN Verification</div>
                                <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">NIN Verification</span>
                                    <span className="ds-contact-value">
                                      {creds.nin_verified ? 'Verified' : 'Not Verified'}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">NIN Number</span>
                                    <span className="ds-contact-value">
                                      {creds.nin ? (
                                        <>
                                          {showFullNin ? creds.nin : creds.nin_masked}{' '}
                                          <button
                                            type="button"
                                            className="dg-inline-link"
                                            style={{ fontSize: '0.75rem', marginLeft: 6 }}
                                            onClick={() => setShowFullNin((v) => !v)}
                                          >
                                            {showFullNin ? 'Hide' : 'Show'}
                                          </button>
                                        </>
                                      ) : (
                                        'Not provided'
                                      )}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Full Name (NIMC)</span>
                                    <span className="ds-contact-value">
                                      {creds.nin_record?.full_name ||
                                        creds.display_name ||
                                        `${inspectedUserDetail.profile?.first_name || ''} ${
                                          creds.middle_name || ''
                                        } ${inspectedUserDetail.profile?.last_name || ''}`.trim()}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Date of Birth / Gender</span>
                                    <span className="ds-contact-value">
                                      {creds.date_of_birth || creds.nin_record?.date_of_birth || 'N/A'} &bull;{' '}
                                      {creds.gender || creds.nin_record?.gender || 'N/A'}
                                    </span>
                                  </div>
                                  {creds.nin_record?.address && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">NIMC Address</span>
                                      <span className="ds-contact-value">{creds.nin_record.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Driver's Licence Details */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">Driver&apos;s Licence Details</div>
                                <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Licence Verification</span>
                                    <span className="ds-contact-value">
                                      {creds.license_verified ? 'Verified' : 'Pending / Unverified'}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Licence Number</span>
                                    <span className="ds-contact-value">
                                      {creds.license_number || 'Not on file'}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Issued / Expiry</span>
                                    <span className="ds-contact-value">
                                      {creds.license_issued_date || 'N/A'} &rarr;{' '}
                                      {creds.license_expiry || 'N/A'}
                                    </span>
                                  </div>
                                  {creds.license_state_of_issue && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">Issuing State</span>
                                      <span className="ds-contact-value">{creds.license_state_of_issue}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Vehicle & State Motor Registry Details */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">Vehicle &amp; Motor Registry</div>
                                <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Vehicle</span>
                                    <span className="ds-contact-value">
                                      {[creds.vehicle_type, creds.vehicle_make, creds.vehicle_model, creds.vehicle_year || '']
                                        .filter(Boolean)
                                        .join(' • ') || 'Not specified'}
                                    </span>
                                  </div>
                                  <div className="ds-contact-row">
                                    <span className="ds-contact-label">Plate Number</span>
                                    <span className="ds-contact-value">{creds.vehicle_plate || 'N/A'}</span>
                                  </div>
                                  {creds.vehicle_chassis_number && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">Chassis / VIN</span>
                                      <span className="ds-contact-value">{creds.vehicle_chassis_number}</span>
                                    </div>
                                  )}
                                  {creds.vehicle_engine_number && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">Engine Number</span>
                                      <span className="ds-contact-value">{creds.vehicle_engine_number}</span>
                                    </div>
                                  )}
                                  {creds.vehicle_registry_file_no && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">Registry File No.</span>
                                      <span className="ds-contact-value">{creds.vehicle_registry_file_no}</span>
                                    </div>
                                  )}
                                  {creds.vehicle_autoreg_pin && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">AutoReg PIN</span>
                                      <span className="ds-contact-value">{creds.vehicle_autoreg_pin}</span>
                                    </div>
                                  )}
                                  {creds.vehicle_poc_vid && (
                                    <div className="ds-contact-row">
                                      <span className="ds-contact-label">POC VID</span>
                                      <span className="ds-contact-value">{creds.vehicle_poc_vid}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Uploaded Licenses & Compliance Documents */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">
                                  Uploaded Licenses &amp; Documents (
                                  {(creds.documents || []).filter((d) => d.uploaded).length}/
                                  {(creds.documents || []).length})
                                </div>

                                {(creds.documents || []).map((doc) => {
                                  const badge = getDocStatusBadge(doc);
                                  const resolvedUrl = resolveSupportMediaUrl(doc.url);
                                  const previewImg = resolvedUrl && isImageUrl(resolvedUrl, doc.content_type);
                                  return (
                                    <div key={doc.key} className="da-doc-row">
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'flex-start',
                                          gap: 8,
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--dg-primary)' }}>
                                            {doc.label}
                                          </div>
                                          {doc.issuing_authority && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--dg-text-muted)' }}>
                                              {doc.issuing_authority}
                                            </div>
                                          )}
                                        </div>
                                        <span
                                          className="ds-status-pill"
                                          style={{ background: badge.bg, color: badge.color, flexShrink: 0 }}
                                        >
                                          {badge.label}
                                        </span>
                                      </div>

                                      {doc.uploaded && (
                                        <>
                                          <div
                                            style={{
                                              fontSize: '0.75rem',
                                              color: 'var(--dg-text-secondary)',
                                              marginTop: 6,
                                              lineHeight: 1.5,
                                            }}
                                          >
                                            {doc.document_number && (
                                              <div>Doc #: {doc.document_number}</div>
                                            )}
                                            {doc.receipt_number && (
                                              <div>Receipt: {doc.receipt_number}</div>
                                            )}
                                            {(doc.extracted_issue_date || doc.extracted_expiry_date) && (
                                              <div>
                                                Validity: {doc.extracted_issue_date || 'N/A'} &rarr;{' '}
                                                <strong>{doc.extracted_expiry_date || 'N/A'}</strong>
                                              </div>
                                            )}
                                            {typeof doc.authenticity_score === 'number' &&
                                              doc.authenticity_score > 0 && (
                                                <div>
                                                  Authenticity Score: {Math.round(doc.authenticity_score)}%
                                                </div>
                                              )}
                                          </div>

                                          {previewImg && (
                                            <img
                                              src={resolvedUrl}
                                              alt={doc.label}
                                              className="da-doc-thumb"
                                              onClick={() => setViewingDoc(doc)}
                                            />
                                          )}

                                          <div
                                            style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              marginTop: 8,
                                              gap: 8,
                                            }}
                                          >
                                            <button
                                              type="button"
                                              className="dp-text-btn"
                                              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                                              onClick={() => setViewingDoc(doc)}
                                            >
                                              Inspect document &amp; checks
                                            </button>
                                            <a
                                              href={resolvedUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="dg-inline-link"
                                              style={{ fontSize: '0.76rem' }}
                                            >
                                              Open file &nearr;
                                            </a>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* 3. DELIVERIES */}
                      {rightTab === 'deliveries' &&
                        ((inspectedUserDetail.deliveries || []).length === 0 ? (
                          <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No deliveries for this account
                          </div>
                        ) : (
                          (inspectedUserDetail.deliveries || []).map((d: any) => (
                            <div
                              key={d.id}
                              onClick={() => {
                                handleSectionChange('deliveries');
                                openDeliveryInspector(d.id);
                              }}
                              style={{
                                padding: '12px 0',
                                borderBottom: '1px solid var(--dg-border)',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.86rem' }}>
                                <span style={{ color: 'var(--dg-primary)' }}>{d.tracking_id || d.id}</span>
                                <span>₦{Number(d.total_cost || 0).toLocaleString()}</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 3 }}>
                                {d.pickup_address} &rarr; {d.delivery_address}
                              </div>
                            </div>
                          ))
                        ))}

                      {/* 4. PAYMENTS */}
                      {rightTab === 'payments' &&
                        ((inspectedUserDetail.payment_methods || []).length === 0 ? (
                          <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No saved payment methods
                          </div>
                        ) : (
                          (inspectedUserDetail.payment_methods || []).map((pm: any) => (
                            <div key={pm.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--dg-border)' }}>
                              <strong style={{ fontSize: '0.86rem' }}>
                                {pm.card_brand || pm.method_type} {pm.last4 ? `•••• ${pm.last4}` : ''}
                              </strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)' }}>
                                {pm.bank_name || pm.card_name || ''}
                              </div>
                            </div>
                          ))
                        ))}

                      {/* 5. ADDRESSES */}
                      {rightTab === 'addresses' &&
                        ((inspectedUserDetail.addresses || []).length === 0 ? (
                          <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No saved addresses
                          </div>
                        ) : (
                          (inspectedUserDetail.addresses || []).map((a: any) => (
                            <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--dg-border)' }}>
                              <strong style={{ fontSize: '0.86rem' }}>{a.label}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)' }}>
                                {a.address}, {a.city}
                              </div>
                            </div>
                          ))
                        ))}

                      {/* 6. TICKETS */}
                      {rightTab === 'tickets' &&
                        ((inspectedUserDetail.support_tickets || []).length === 0 ? (
                          <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No support tickets for this account
                          </div>
                        ) : (
                          (inspectedUserDetail.support_tickets || []).map((t: SupportTicket) => (
                            <div
                              key={t.id}
                              onClick={() => {
                                handleSectionChange('support');
                                openAgentTicket(t);
                              }}
                              style={{
                                padding: '12px 0',
                                borderBottom: '1px solid var(--dg-border)',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--dg-primary)' }}>
                                {t.subject}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                                {t.status} &bull; Priority: {t.priority} &bull; {formatTimeAgo(t.updated_at)}
                              </div>
                            </div>
                          ))
                        ))}
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {/* ==================== 4. FULL DOCUMENT & VERIFICATION PROOF MODAL ==================== */}
      {viewingDoc && (
        <div
          className="dg-modal-overlay"
          onClick={() => setViewingDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dg-modal-card"
            style={{ maxWidth: 820, maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dg-modal-head">
              <div>
                <h3 className="dg-modal-title">{viewingDoc.label}</h3>
                {viewingDoc.file_name && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                    {viewingDoc.file_name}
                    {viewingDoc.size_bytes ? ` (${formatBytes(viewingDoc.size_bytes)})` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {viewingDoc.url && (
                  <a
                    href={resolveSupportMediaUrl(viewingDoc.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="dp-text-btn"
                  >
                    Open in tab &nearr;
                  </a>
                )}
                <button
                  type="button"
                  className="dp-text-btn"
                  onClick={() => setViewingDoc(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="dg-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {viewingDoc.url && (
                <div
                  style={{
                    border: '1px solid var(--dg-border)',
                    borderRadius: 8,
                    background: 'var(--dg-bg-alt)',
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  {isPdfUrl(viewingDoc.url, viewingDoc.content_type) ? (
                    <iframe
                      src={resolveSupportMediaUrl(viewingDoc.url)}
                      title={viewingDoc.label}
                      style={{ width: '100%', height: 420, border: 'none', borderRadius: 6 }}
                    />
                  ) : (
                    <img
                      src={resolveSupportMediaUrl(viewingDoc.url)}
                      alt={viewingDoc.label}
                      style={{ maxWidth: '100%', maxHeight: 460, borderRadius: 6, objectFit: 'contain' }}
                    />
                  )}
                </div>
              )}

              {/* Extracted Document Data */}
              <div className="ds-contact-meta" style={{ marginTop: 0 }}>
                {viewingDoc.document_number && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Document / Serial No.</span>
                    <span className="ds-contact-value">{viewingDoc.document_number}</span>
                  </div>
                )}
                {viewingDoc.receipt_number && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Receipt No.</span>
                    <span className="ds-contact-value">{viewingDoc.receipt_number}</span>
                  </div>
                )}
                {(viewingDoc.extracted_issue_date || viewingDoc.extracted_expiry_date) && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Issue &amp; Expiry Dates</span>
                    <span className="ds-contact-value">
                      {viewingDoc.extracted_issue_date || 'N/A'} &rarr;{' '}
                      {viewingDoc.extracted_expiry_date || 'N/A'}
                    </span>
                  </div>
                )}
                {viewingDoc.extracted_plate && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Extracted Plate</span>
                    <span className="ds-contact-value">{viewingDoc.extracted_plate}</span>
                  </div>
                )}
                {viewingDoc.extracted_chassis_number && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Extracted Chassis / VIN</span>
                    <span className="ds-contact-value">{viewingDoc.extracted_chassis_number}</span>
                  </div>
                )}
                {viewingDoc.extracted_engine_number && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Extracted Engine No.</span>
                    <span className="ds-contact-value">{viewingDoc.extracted_engine_number}</span>
                  </div>
                )}
                {viewingDoc.extracted_pin && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Extracted AutoReg PIN</span>
                    <span className="ds-contact-value">{viewingDoc.extracted_pin}</span>
                  </div>
                )}
                {viewingDoc.extracted_poc_vid && (
                  <div className="ds-contact-row">
                    <span className="ds-contact-label">Extracted POC VID</span>
                    <span className="ds-contact-value">{viewingDoc.extracted_poc_vid}</span>
                  </div>
                )}
              </div>

              {/* 8-Point Authenticity Checks */}
              {viewingDoc.checks && viewingDoc.checks.length > 0 && (
                <div>
                  <div className="da-cred-title" style={{ marginBottom: 8 }}>
                    Authenticity Verification Proof ({viewingDoc.checks.length} Checks)
                  </div>
                  <div className="dp-proof-list">
                    {viewingDoc.checks.map((chk, idx) => (
                      <div key={chk.code || idx} className="dp-proof-item">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
