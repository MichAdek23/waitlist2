import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAgentSession,
  setAgentSession,
  invokeSupportAction,
  subscribeToSupportRealtime,
  type SupportTicket,
  type SupportMessage,
  type UserTag,
} from '../lib/supportService';

interface AgentDashboardPageProps {
  onNavigate: (path: string) => void;
}

type AgentSection = 'overview' | 'support' | 'deliveries' | 'users';
type TicketTab = 'queue' | 'my_tickets' | 'resolved';
type UserDetailTab = 'profile' | 'deliveries' | 'payments' | 'addresses' | 'tickets';

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

export const AgentDashboardPage: React.FC<AgentDashboardPageProps> = ({ onNavigate }) => {
  const session = getAgentSession();
  const [activeSection, setActiveSection] = useState<AgentSection>('overview');

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

  // Users
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'consumer' | 'rider'>('all');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailTab, setUserDetailTab] = useState<UserDetailTab>('profile');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

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
      if (data?.stats?.queue_count !== undefined) {
        setQueueBadgeCount(data.stats.queue_count);
      }
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

  const openUserDetailInspector = async (userId: string) => {
    setLoadingUserDetail(true);
    setUserDetailTab('profile');
    setShowTagDropdown(false);
    try {
      const data = await invokeSupportAction('agent_get_user_details', { user_id: userId }, 'agent');
      setSelectedUserDetail(data);
    } catch {
      // ignore
    } finally {
      setLoadingUserDetail(false);
    }
  };

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
    if (!selectedUserDetail?.profile?.id) return;
    setShowTagDropdown(false);
    try {
      const res = await invokeSupportAction<{ tag: UserTag }>(
        'agent_add_user_tag',
        {
          user_id: selectedUserDetail.profile.id,
          tag_name: tagName,
          tag_color: tagColor,
        },
        'agent'
      );
      if (res?.tag) {
        setSelectedUserDetail((prev: any) =>
          prev ? { ...prev, tags: [...(prev.tags || []), res.tag] } : prev
        );
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveUserTag = async (tagId: string) => {
    try {
      await invokeSupportAction('agent_remove_user_tag', { tag_id: tagId }, 'agent');
      setSelectedUserDetail((prev: any) =>
        prev ? { ...prev, tags: (prev.tags || []).filter((t: UserTag) => t.id !== tagId) } : prev
      );
    } catch {
      // ignore
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

  const currentTabTickets = ticketsBuckets[ticketTab] || [];
  const isDelAiActive = replyInput.toLowerCase().includes('@delai');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#FFFFFF',
        color: '#0F172A',
        fontFamily: 'var(--dg-font)',
      }}
    >
      {/* Top Bar matching Waitlist2 Header */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid var(--dg-border)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span
            role="img"
            aria-label="Deliva"
            className="dg-logo-mark"
            style={{ height: 26, cursor: 'pointer' }}
            onClick={() => setActiveSection('overview')}
          />

          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {(
              [
                { id: 'overview', label: 'Overview' },
                {
                  id: 'support',
                  label: queueBadgeCount > 0 ? `Support (${queueBadgeCount})` : 'Support',
                },
                { id: 'deliveries', label: 'Deliveries' },
                { id: 'users', label: 'Users' },
              ] as const
            ).map((nav) => {
              const active = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveSection(nav.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '2px solid var(--dg-primary)' : '2px solid transparent',
                    padding: '20px 2px',
                    font: 'inherit',
                    fontSize: '0.9rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--dg-primary)' : 'var(--dg-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {session?.user && (
            <span style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)' }}>
              {session.user.email}
            </span>
          )}
          <button
            type="button"
            className="dp-text-btn"
            onClick={() => {
              setAgentSession(null);
              onNavigate('/agent-login');
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Workspace Body */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 1. OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
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
                    Summary of support queue, deliveries, and registered users.
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
                  {/* Clean Flat Stat Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: 14,
                      marginBottom: 32,
                    }}
                  >
                    {[
                      {
                        label: 'Ticket Queue',
                        value: overviewData?.stats?.queue_count ?? 0,
                        target: 'support' as AgentSection,
                      },
                      {
                        label: 'My Tickets',
                        value: overviewData?.stats?.my_tickets_count ?? 0,
                        target: 'support' as AgentSection,
                      },
                      {
                        label: 'Resolved',
                        value: overviewData?.stats?.resolved_count ?? 0,
                        target: 'support' as AgentSection,
                      },
                      {
                        label: 'Active Deliveries',
                        value: overviewData?.stats?.active_deliveries ?? 0,
                        target: 'deliveries' as AgentSection,
                      },
                      {
                        label: 'Total Deliveries',
                        value: overviewData?.stats?.total_deliveries ?? 0,
                        target: 'deliveries' as AgentSection,
                      },
                      {
                        label: 'Total Users',
                        value: overviewData?.stats?.total_users ?? 0,
                        target: 'users' as AgentSection,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        onClick={() => setActiveSection(card.target)}
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

                  {/* Two Simple Hairline Lists */}
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
                          onClick={() => setActiveSection('support')}
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
                                setActiveSection('support');
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
                          onClick={() => setActiveSection('deliveries')}
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
                                setActiveSection('deliveries');
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

        {/* 2. SUPPORT TICKETS */}
        {activeSection === 'support' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Pane */}
            <div
              style={{
                width: 370,
                borderRight: '1px solid var(--dg-border)',
                display: 'flex',
                flexDirection: 'column',
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
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
                    style={{ fontSize: '0.82rem' }}
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

            {/* Right Pane */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dg-bg-alt)' }}>
              {selectedTicket ? (
                <>
                  <div
                    style={{
                      padding: '14px 20px',
                      background: '#FFFFFF',
                      borderBottom: '1px solid var(--dg-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                        {selectedTicket.subject}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                        {selectedTicket.profiles
                          ? `${selectedTicket.profiles.first_name} ${selectedTicket.profiles.last_name} (${selectedTicket.profiles.email})`
                          : `${selectedTicket.guest_name || 'Guest'} (${selectedTicket.guest_email || ''})`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        className="dg-select"
                        style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '0.82rem' }}
                        value={selectedTicket.priority}
                        onChange={(e) =>
                          handleUpdateTicketPriority(e.target.value as 'low' | 'medium' | 'high')
                        }
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>

                      {!selectedTicket.assigned_agent_id &&
                        selectedTicket.status !== 'resolved' && (
                          <button
                            type="button"
                            className="dp-submit-btn"
                            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                            onClick={() => handleClaimTicket(selectedTicket.id)}
                          >
                            Claim ticket
                          </button>
                        )}

                      {selectedTicket.status !== 'resolved' && (
                        <button
                          type="button"
                          className="dp-text-btn"
                          onClick={handleResolveAgentTicket}
                        >
                          Mark resolved
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
                              maxWidth: '72%',
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

        {/* 3. DELIVERIES */}
        {activeSection === 'deliveries' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedDeliveryConv ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '14px 24px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <button
                    type="button"
                    className="dp-text-btn"
                    onClick={() => setSelectedDeliveryConv(null)}
                  >
                    &larr; Back
                  </button>
                  <div style={{ fontWeight: 700, color: 'var(--dg-primary)' }}>
                    {selectedDeliveryConv.delivery?.tracking_id || 'Delivery Detail'}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: 360,
                      borderRight: '1px solid var(--dg-border)',
                      overflowY: 'auto',
                      padding: 20,
                    }}
                  >
                    <div className="ds-contact-meta" style={{ marginTop: 0 }}>
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
                        <span className="ds-contact-label">Customer</span>
                        <span className="ds-contact-value">
                          {selectedDeliveryConv.consumer
                            ? `${selectedDeliveryConv.consumer.first_name} ${selectedDeliveryConv.consumer.last_name}`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="ds-contact-row">
                        <span className="ds-contact-label">Driver</span>
                        <span className="ds-contact-value">
                          {selectedDeliveryConv.driver
                            ? `${selectedDeliveryConv.driver.first_name} ${selectedDeliveryConv.driver.last_name}`
                            : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, background: 'var(--dg-bg-alt)', padding: 20, overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--dg-primary)', marginBottom: 14 }}>
                      Customer – Driver Conversation ({(selectedDeliveryConv.messages || []).length})
                    </h4>
                    {(selectedDeliveryConv.messages || []).length === 0 ? (
                      <div style={{ color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                        No messages recorded for this delivery
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
                              borderRadius: 8,
                              background: '#FFFFFF',
                              border: '1px solid var(--dg-border)',
                              maxWidth: '75%',
                              marginLeft: isCustomer ? 0 : 'auto',
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--dg-primary)', marginBottom: 4 }}>
                              {isCustomer ? 'Customer' : 'Driver'}
                            </div>
                            <div style={{ fontSize: '0.88rem' }}>{msg.content}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 28px' }}>
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
                    <h2 className="dp-section-title" style={{ color: 'var(--dg-primary)' }}>
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
                          <div style={{ fontSize: '0.84rem', color: 'var(--dg-text-secondary)' }}>
                            {d.pickup_address} &rarr; {d.delivery_address}
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

        {/* 4. USERS */}
        {activeSection === 'users' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedUserDetail ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '16px 28px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="dp-text-btn"
                    onClick={() => setSelectedUserDetail(null)}
                  >
                    &larr; Back
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dg-primary)' }}>
                      {selectedUserDetail.profile?.first_name} {selectedUserDetail.profile?.last_name}{' '}
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dg-text-secondary)' }}>
                        ({selectedUserDetail.is_driver ? 'Driver' : 'Consumer'})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)' }}>
                      {selectedUserDetail.profile?.email} &bull;{' '}
                      {selectedUserDetail.profile?.phone || 'No phone'}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                    {(selectedUserDetail.tags || []).map((tag: UserTag) => (
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
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                    >
                      + Tag
                    </button>

                    {showTagDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 34,
                          right: 0,
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
                              fontSize: '0.82rem',
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

                <div className="ds-tabs" style={{ padding: '0 28px', marginBottom: 0 }}>
                  {(
                    [
                      { key: 'profile', label: 'Profile' },
                      { key: 'deliveries', label: `Deliveries (${(selectedUserDetail.deliveries || []).length})` },
                      { key: 'payments', label: `Payments (${(selectedUserDetail.payment_methods || []).length})` },
                      { key: 'addresses', label: `Addresses (${(selectedUserDetail.addresses || []).length})` },
                      { key: 'tickets', label: `Tickets (${(selectedUserDetail.support_tickets || []).length})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`ds-tab ${userDetailTab === tab.key ? 'ds-tab-active' : ''}`}
                      onClick={() => setUserDetailTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                  {userDetailTab === 'profile' && (
                    <div className="ds-contact-meta" style={{ maxWidth: 520, marginTop: 0 }}>
                      <div className="ds-contact-row">
                        <span className="ds-contact-label">Wallet balance</span>
                        <span className="ds-contact-value">
                          ₦{Number(selectedUserDetail.wallet_balance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="ds-contact-row">
                        <span className="ds-contact-label">Completed deliveries</span>
                        <span className="ds-contact-value">
                          {selectedUserDetail.profile?.total_deliveries_completed || 0}
                        </span>
                      </div>
                      <div className="ds-contact-row">
                        <span className="ds-contact-label">Rating</span>
                        <span className="ds-contact-value">
                          {Number(selectedUserDetail.profile?.rating || 0).toFixed(1)} (
                          {selectedUserDetail.profile?.rating_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  {userDetailTab === 'deliveries' &&
                    (selectedUserDetail.deliveries || []).map((d: any) => (
                      <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--dg-border)' }}>
                        <strong style={{ color: 'var(--dg-primary)' }}>{d.tracking_id || d.id}</strong> —{' '}
                        {d.pickup_address} &rarr; {d.delivery_address}
                      </div>
                    ))}

                  {userDetailTab === 'payments' &&
                    (selectedUserDetail.payment_methods || []).map((pm: any) => (
                      <div key={pm.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--dg-border)' }}>
                        <strong>{pm.card_brand || pm.method_type}</strong> {pm.last4 ? `•••• ${pm.last4}` : ''}
                      </div>
                    ))}

                  {userDetailTab === 'addresses' &&
                    (selectedUserDetail.addresses || []).map((a: any) => (
                      <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--dg-border)' }}>
                        <strong>{a.label}:</strong> {a.address}, {a.city}
                      </div>
                    ))}

                  {userDetailTab === 'tickets' &&
                    (selectedUserDetail.support_tickets || []).map((t: SupportTicket) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveSection('support');
                          openAgentTicket(t);
                        }}
                        style={{
                          padding: '12px 0',
                          borderBottom: '1px solid var(--dg-border)',
                          cursor: 'pointer',
                        }}
                      >
                        <strong style={{ color: 'var(--dg-primary)' }}>{t.subject}</strong> — {t.status} (
                        {formatTimeAgo(t.updated_at)})
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 28px' }}>
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
                  <h2 className="dp-section-title" style={{ color: 'var(--dg-primary)' }}>
                    Users directory
                  </h2>
                  <div style={{ width: 320 }}>
                    <input
                      type="text"
                      className="dg-input"
                      placeholder="Search by name, email, or phone..."
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
                      { key: 'all', label: 'All Users' },
                      { key: 'consumer', label: 'Consumers' },
                      { key: 'rider', label: 'Drivers' },
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
                  {loadingUsers || loadingUserDetail ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                      Loading users…
                    </div>
                  ) : (
                    usersList
                      .filter((u) => userTypeFilter === 'all' || u.user_type === userTypeFilter)
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => openUserDetailInspector(u.id)}
                          style={{
                            padding: '14px 0',
                            borderBottom: '1px solid var(--dg-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--dg-primary)', fontSize: '0.92rem' }}>
                              {u.first_name} {u.last_name}{' '}
                              <span style={{ fontWeight: 500, fontSize: '0.78rem', color: 'var(--dg-text-secondary)' }}>
                                &bull; {u.user_type === 'rider' || u.user_type === 'driver' ? 'Driver' : 'Consumer'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                              {u.email} &bull; {u.phone || 'No phone'}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)' }}>
                            {u.total_deliveries_completed || 0} deliveries &rsaquo;
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
