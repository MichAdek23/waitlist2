import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getSupportSession,
  setSupportSession,
  supportLogin,
  invokeSupportAction,
  submitGuestSupportTicket,
  subscribeToSupportRealtime,
  type SupportTicket,
  type SupportMessage,
  type SupportSession,
} from '../lib/supportService';

interface HelpSupportPageProps {
  onNavigate: (path: string) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Deliveries' | 'Merchants';
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'What is Deliva?',
    answer:
      'Deliva is a fast, reliable, and smart logistics platform designed to connect individuals and businesses with professional riders and drivers for seamless deliveries across your city.',
    category: 'General',
  },
  {
    id: '2',
    question: 'How does Deliva work?',
    answer:
      'Simply enter your pickup and drop-off locations, select the right vehicle type for your package, and confirm your request. You will be matched with a nearby rider in seconds and can track your package in real-time until it is safely delivered.',
    category: 'Deliveries',
  },
  {
    id: '3',
    question: 'How are delivery fees calculated?',
    answer:
      'Delivery fees are transparently calculated upfront based on the distance between pickup and drop-off, the type of vehicle required (bike, car, or van), and current traffic conditions. There are no hidden charges.',
    category: 'Deliveries',
  },
  {
    id: '4',
    question: 'Can I schedule a delivery in advance?',
    answer:
      'Yes! With Deliva, you can either request an instant pickup or schedule a delivery for a specific date and time that works best for you or your business.',
    category: 'Deliveries',
  },
  {
    id: '5',
    question: 'How do I become a Deliva rider or driver?',
    answer:
      'Download the Deliva app, sign up as a Rider/Driver, and complete verification by uploading your driver’s license and vehicle compliance details in the Drivers Portal. Once approved, you can start accepting delivery requests immediately.',
    category: 'General',
  },
  {
    id: '6',
    question: 'Is my package insured during transit?',
    answer:
      'Every delivery on Deliva is handled by vetted, background-checked riders and monitored with live GPS tracking. High-value goods are also eligible for transit protection coverage.',
    category: 'Merchants',
  },
];

const CATEGORIES = ['All', 'General', 'Deliveries', 'Merchants'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ai_handling: {
    label: 'AI Handling',
    color: '#204B7A',
    bg: '#EFF6FF',
  },
  escalated: {
    label: 'Waiting for Agent',
    color: '#92400E',
    bg: '#FFFBEB',
  },
  agent_assigned: {
    label: 'Agent Assigned',
    color: '#065F46',
    bg: '#ECFDF5',
  },
  resolved: {
    label: 'Resolved',
    color: '#475569',
    bg: '#F1F5F9',
  },
};

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ onNavigate }) => {
  const [session, setSessionState] = useState<SupportSession | null>(() => getSupportSession());

  // FAQ State
  const [openFaqId, setOpenFaqId] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState('');

  // Slide-over Live Support Drawer State
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('chat') === 'open';
    } catch {
      return false;
    }
  });
  const [drawerTab, setDrawerTab] = useState<'list' | 'chat'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Drawer Inline Auth
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tickets List State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  // Active Chat State
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [suggestEscalation, setSuggestEscalation] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const loadUserTickets = async () => {
    if (!session?.token) return;
    setLoadingTickets(true);
    try {
      const data = await invokeSupportAction<{ tickets: SupportTicket[] }>('get_tickets');
      if (data?.tickets) {
        setTickets(data.tickets);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isSupportDrawerOpen && session?.token && drawerTab === 'list') {
      loadUserTickets();
    }
  }, [isSupportDrawerOpen, session?.token, drawerTab]);

  const loadOrStartTicketChat = async (ticketId: string | null) => {
    if (!session?.token) return;
    setLoadingChat(true);
    setSuggestEscalation(false);
    try {
      if (ticketId) {
        const data = await invokeSupportAction<{
          ticket: SupportTicket;
          messages: SupportMessage[];
        }>('get_messages', { ticket_id: ticketId });
        if (data?.ticket) {
          setActiveTicket(data.ticket);
          const visible = (data.messages || []).filter((m) => !m.metadata?.is_private);
          setMessages(visible);
          const lastAi = [...visible].reverse().find((m) => m.sender_type === 'ai');
          if (lastAi?.metadata?.suggest_escalation && data.ticket.status === 'ai_handling') {
            setSuggestEscalation(true);
          }
        }
      } else {
        const created = await invokeSupportAction<{
          ticket: SupportTicket;
          messages: SupportMessage[];
        }>('create_ticket', {
          subject: 'Support Request',
          category: 'other',
        });
        if (created?.ticket) {
          setActiveTicket(created.ticket);
          setSelectedTicketId(created.ticket.id);
          setMessages((created.messages || []).filter((m) => !m.metadata?.is_private));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (isSupportDrawerOpen && session?.token && drawerTab === 'chat') {
      loadOrStartTicketChat(selectedTicketId);
    }
  }, [isSupportDrawerOpen, session?.token, drawerTab, selectedTicketId]);

  useEffect(() => {
    if (!activeTicket?.id) return;
    const unsubscribe = subscribeToSupportRealtime(`support_${activeTicket.id}`, (evt) => {
      if (evt.type === 'support_ticket_updated' && evt.payload) {
        if (evt.payload.id === activeTicket.id || evt.payload.id === undefined) {
          setActiveTicket((prev) => (prev ? { ...prev, ...evt.payload } : evt.payload));
        }
      } else if (evt.type === 'support_message_created' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== activeTicket.id) return;
        if (msg.metadata?.is_private) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (evt.type === 'support_message_updated' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== activeTicket.id) return;
        if (!msg.metadata?.is_private) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
              return prev.map((m) => (m.id === msg.id ? msg : m));
            }
            return [...prev, msg];
          });
        }
      }
    });
    return unsubscribe;
  }, [activeTicket?.id]);

  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }, [messages.length, aiThinking]);

  const handleInlineDrawerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your email address and password.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const s = await supportLogin(loginEmail, loginPassword);
      setSessionState(s);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid login credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmitPriorityTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError('Please enter both a subject and message.');
      return;
    }
    if (!session?.token && (!guestName.trim() || !guestEmail.trim())) {
      setTicketError('Please enter your full name and email address or sign in.');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      if (session?.token) {
        const created = await invokeSupportAction<{
          ticket: SupportTicket;
          messages: SupportMessage[];
        }>('create_ticket', {
          subject: ticketSubject.trim(),
          category: 'other',
          priority: ticketPriority,
          message: ticketMessage.trim(),
        });
        const tId = created?.ticket?.id;
        if (tId) {
          setTicketSubmittedId(tId);
          setTicketSubject('');
          setTicketMessage('');
        }
      } else {
        const guestRes = await submitGuestSupportTicket({
          name: guestName.trim(),
          email: guestEmail.trim(),
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
          priority: ticketPriority,
          category: 'other',
        });
        setTicketSubmittedId(guestRes?.ticket?.id || 'TKT-NEW');
        setTicketSubject('');
        setTicketMessage('');
      }
    } catch (err: any) {
      setTicketError(err?.message || 'Failed to submit support request.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeTicket || sendingMessage) return;
    const text = chatInput.trim();
    setChatInput('');
    setSendingMessage(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticUserMsg: SupportMessage = {
      id: tempId,
      ticket_id: activeTicket.id,
      sender_type: 'user',
      sender_id: session?.user?.id,
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    if (activeTicket.status === 'ai_handling') {
      setAiThinking(true);
    }

    try {
      const data = await invokeSupportAction<{
        user_message?: SupportMessage;
        ai_message?: SupportMessage;
        ticket_status?: string;
        suggest_escalation?: boolean;
      }>('send_message', {
        ticket_id: activeTicket.id,
        message: text,
      });

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        const next = [...withoutTemp];
        if (data?.user_message && !next.some((m) => m.id === data.user_message!.id)) {
          next.push(data.user_message);
        }
        if (data?.ai_message && !next.some((m) => m.id === data.ai_message!.id)) {
          next.push(data.ai_message);
        }
        return next;
      });

      if (data?.ticket_status) {
        setActiveTicket((prev) => (prev ? { ...prev, status: data.ticket_status! } : prev));
      }
      if (data?.suggest_escalation) {
        setSuggestEscalation(true);
      }
    } catch {
      // keep optimistic message
    } finally {
      setSendingMessage(false);
      setAiThinking(false);
    }
  };

  const handleEscalateToAgent = async () => {
    if (!activeTicket) return;
    setSuggestEscalation(false);
    try {
      await invokeSupportAction('escalate', { ticket_id: activeTicket.id });
      setActiveTicket((prev) => (prev ? { ...prev, status: 'escalated' } : prev));
      const refreshed = await invokeSupportAction<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>('get_messages', { ticket_id: activeTicket.id });
      if (refreshed?.messages) {
        setMessages(refreshed.messages.filter((m) => !m.metadata?.is_private));
      }
    } catch {
      // ignore
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket) return;
    try {
      await invokeSupportAction('resolve', { ticket_id: activeTicket.id });
      setActiveTicket((prev) => (prev ? { ...prev, status: 'resolved' } : prev));
      const refreshed = await invokeSupportAction<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>('get_messages', { ticket_id: activeTicket.id });
      if (refreshed?.messages) {
        setMessages(refreshed.messages.filter((m) => !m.metadata?.is_private));
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteResolvedTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTicketId(ticketId);
    try {
      await invokeSupportAction('hide_ticket', { ticket_id: ticketId });
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch {
      // ignore
    } finally {
      setDeletingTicketId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} style={{ fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const activeStatusBadge = activeTicket
    ? STATUS_CONFIG[activeTicket.status] || STATUS_CONFIG.ai_handling
    : STATUS_CONFIG.ai_handling;

  return (
    <main className="ds-page">
      <div className="ds-container">
        {/* Clean Page Header matching DriversPortal */}
        <div className="dp-page-head">
          <div>
            <p className="ds-eyebrow">Help Center</p>
            <h1 className="dp-title" style={{ color: 'var(--dg-primary)' }}>
              How can we help you?
            </h1>
            <p className="dp-subtitle">
              Browse common questions, submit a support request, or open live chat with our team.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="dp-text-btn"
              onClick={() => {
                setDrawerTab('list');
                setIsSupportDrawerOpen(true);
              }}
            >
              Live support
            </button>
            <button
              type="button"
              className="dp-text-btn"
              onClick={() => onNavigate('/contact')}
            >
              Contact us
            </button>
            {session?.user ? (
              <button
                type="button"
                className="dp-text-btn"
                onClick={() => {
                  setSupportSession(null);
                  setSessionState(null);
                }}
              >
                Sign out ({session.user.first_name})
              </button>
            ) : (
              <button
                type="button"
                className="dp-text-btn"
                onClick={() => onNavigate('/support-login?redirect=/help')}
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Search & Clean Category Tabs */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              className="dg-input"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ds-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`ds-tab ${selectedCategory === cat ? 'ds-tab-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Hairline FAQ Accordion List */}
        <div className="ds-faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="ds-faq-item">
                  <button
                    type="button"
                    className="ds-faq-trigger"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <span className="ds-faq-plus">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <div className="ds-faq-answer">{faq.answer}</div>}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '32px 0', color: 'var(--dg-text-secondary)', fontSize: '0.92rem' }}>
              No matching questions found for "{searchQuery}".
            </div>
          )}
        </div>

        {/* Clean Uncarded Support Request Form */}
        <section className="dp-section" style={{ borderTop: '1px solid var(--dg-border)' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 className="dg-form-title">Submit a support request</h2>
            <p className="dp-section-desc">
              Need direct assistance? Send us your request and track updates with your ticket ID.
            </p>
          </div>

          {ticketSubmittedId ? (
            <div className="ds-alert-success">
              <p style={{ fontWeight: 700, marginBottom: 6 }}>
                Support request submitted — #{ticketSubmittedId.slice(0, 8).toUpperCase()}
              </p>
              <p style={{ marginBottom: 14 }}>
                We have logged your ticket and generated an initial response in Live Support.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {session?.token && (
                  <button
                    type="button"
                    className="dg-inline-link"
                    onClick={() => {
                      setSelectedTicketId(ticketSubmittedId);
                      setDrawerTab('chat');
                      setIsSupportDrawerOpen(true);
                    }}
                  >
                    View in live support
                  </button>
                )}
                <button
                  type="button"
                  className="dg-inline-link"
                  onClick={() => setTicketSubmittedId(null)}
                >
                  Submit another request
                </button>
              </div>
            </div>
          ) : (
            <form className="dg-form-box" onSubmit={handleSubmitPriorityTicket} noValidate>
              {ticketError && (
                <p className="dg-error" role="alert">
                  {ticketError}
                </p>
              )}

              {!session?.user && (
                <div className="dg-name-grid">
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="ticket-guest-name">
                      Full name <span className="dg-req">*</span>
                    </label>
                    <input
                      id="ticket-guest-name"
                      type="text"
                      className="dg-input"
                      placeholder="e.g. Chukwuma Adeyemi"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="dg-field">
                    <label className="dg-label" htmlFor="ticket-guest-email">
                      Email address <span className="dg-req">*</span>
                    </label>
                    <input
                      id="ticket-guest-email"
                      type="email"
                      className="dg-input"
                      placeholder="name@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="dg-name-grid">
                <div className="dg-field">
                  <label className="dg-label" htmlFor="ticket-subject">
                    Subject <span className="dg-req">*</span>
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    className="dg-input"
                    placeholder="e.g. Delayed package pickup or billing issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="dg-field">
                  <label className="dg-label" htmlFor="ticket-priority">
                    Priority level
                  </label>
                  <div className="dg-select-wrap">
                    <select
                      id="ticket-priority"
                      className="dg-select"
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as 'low' | 'medium' | 'high')}
                    >
                      <option value="low">Low — General question</option>
                      <option value="medium">Medium — Standard support</option>
                      <option value="high">High — Urgent delivery or billing issue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="dg-field">
                <label className="dg-label" htmlFor="ticket-message">
                  Message <span className="dg-req">*</span>
                </label>
                <textarea
                  id="ticket-message"
                  rows={4}
                  className="dg-input"
                  placeholder="Include tracking numbers, dates, or relevant details..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                {!session?.user ? (
                  <button
                    type="button"
                    className="dg-link-btn"
                    onClick={() => onNavigate('/support-login?redirect=/help')}
                  >
                    Sign in to track tickets in live support
                  </button>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)' }}>
                    Signed in as {session.user.email}
                  </span>
                )}

                <button
                  type="submit"
                  className="dg-submit-btn"
                  style={{ width: 'auto', minWidth: 200 }}
                  disabled={isSubmittingTicket}
                >
                  {isSubmittingTicket ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </form>
          )}
        </section>

        <div style={{ marginTop: 12, fontSize: '0.84rem', color: 'var(--dg-text-secondary)' }}>
          Support staff member?{' '}
          <button
            type="button"
            className="dg-inline-link"
            onClick={() => onNavigate('/agent-login')}
          >
            Agent portal sign in
          </button>
        </div>
      </div>

      {/* Floating Minimal Live Support Button */}
      <button
        type="button"
        className="ds-live-btn"
        onClick={() => {
          setDrawerTab('list');
          setIsSupportDrawerOpen(true);
        }}
      >
        Live support
      </button>

      {/* Slide-Over Live Support Panel */}
      {isSupportDrawerOpen && (
        <div
          onClick={() => setIsSupportDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              height: '100%',
              background: '#FFFFFF',
              borderLeft: '1px solid var(--dg-border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {!session?.user ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                    Live support
                  </span>
                  <button
                    type="button"
                    className="dp-text-btn"
                    onClick={() => setIsSupportDrawerOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                  <h3 className="dg-form-title" style={{ marginBottom: 6 }}>
                    Sign in to live chat
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--dg-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                    Sign in with your Deliva account to view your conversations or talk with our support team.
                  </p>

                  {loginError && (
                    <p className="dg-error" style={{ marginBottom: 14 }}>
                      {loginError}
                    </p>
                  )}

                  <form className="dg-form-box" onSubmit={handleInlineDrawerLogin} style={{ gap: 14 }}>
                    <div className="dg-field">
                      <label className="dg-label">Email address</label>
                      <input
                        type="email"
                        required
                        className="dg-input"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="dg-field">
                      <label className="dg-label">Password</label>
                      <input
                        type="password"
                        required
                        className="dg-input"
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="dg-submit-btn" disabled={isLoggingIn}>
                      {isLoggingIn ? 'Signing in…' : 'Sign in'}
                    </button>
                  </form>

                  <div style={{ marginTop: 18 }}>
                    <button
                      type="button"
                      className="dg-link-btn"
                      onClick={() => {
                        setIsSupportDrawerOpen(false);
                        onNavigate('/support-login?redirect=/help?chat=open');
                      }}
                    >
                      Need an account? Create support account &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : drawerTab === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                      Support conversations
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)' }}>
                      {session.user.first_name} {session.user.last_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={() => {
                        setSelectedTicketId(null);
                        setDrawerTab('chat');
                      }}
                    >
                      New chat
                    </button>
                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={() => setIsSupportDrawerOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
                  {loadingTickets ? (
                    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                      Loading conversations…
                    </div>
                  ) : tickets.length === 0 ? (
                    <div style={{ padding: '48px 8px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, color: 'var(--dg-primary)', marginBottom: 6 }}>
                        No conversations yet
                      </p>
                      <p style={{ fontSize: '0.88rem', color: 'var(--dg-text-secondary)', marginBottom: 20 }}>
                        Start a conversation with our assistant or request a human support agent.
                      </p>
                      <button
                        type="button"
                        className="dg-submit-btn"
                        style={{ width: 'auto', padding: '11px 22px' }}
                        onClick={() => {
                          setSelectedTicketId(null);
                          setDrawerTab('chat');
                        }}
                      >
                        Start conversation
                      </button>
                    </div>
                  ) : (
                    tickets.map((t) => {
                      const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.ai_handling;
                      const isResolved = t.status === 'resolved';
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            setDrawerTab('chat');
                          }}
                          style={{
                            padding: '14px 0',
                            borderBottom: '1px solid var(--dg-border)',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              className="ds-status-pill"
                              style={{ background: st.bg, color: st.color }}
                            >
                              {st.label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--dg-text-muted)' }}>
                                {formatTimeAgo(t.updated_at)}
                              </span>
                              {isResolved && (
                                <button
                                  type="button"
                                  className="dg-inline-link"
                                  style={{ fontSize: '0.75rem', color: '#DC2626' }}
                                  disabled={deletingTicketId === t.id}
                                  onClick={(e) => handleDeleteResolvedTicket(t.id, e)}
                                >
                                  {deletingTicketId === t.id ? 'Removing…' : 'Remove'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--dg-primary)' }}>
                            {t.subject}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--dg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    className="dp-text-btn"
                    onClick={() => setDrawerTab('list')}
                  >
                    &larr;
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--dg-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {activeTicket?.subject || 'Deliva Support'}
                    </div>
                    <span
                      className="ds-status-pill"
                      style={{
                        background: activeStatusBadge.bg,
                        color: activeStatusBadge.color,
                        marginTop: 2,
                      }}
                    >
                      {activeStatusBadge.label}
                    </span>
                  </div>

                  {activeTicket?.status === 'ai_handling' && (
                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={handleEscalateToAgent}
                    >
                      Human agent
                    </button>
                  )}

                  {activeTicket && activeTicket.status !== 'resolved' && (
                    <button
                      type="button"
                      className="dp-text-btn"
                      onClick={handleResolveTicket}
                    >
                      Resolve
                    </button>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 16,
                    background: 'var(--dg-bg-alt)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {loadingChat ? (
                    <div style={{ textAlign: 'center', padding: 48, color: 'var(--dg-text-secondary)' }}>
                      Loading chat…
                    </div>
                  ) : (
                    <>
                      {messages.map((item) => {
                        const isUser = item.sender_type === 'user';
                        const isSystem = item.sender_type === 'system';
                        const isAI = item.sender_type === 'ai';

                        if (isSystem) {
                          return (
                            <div
                              key={item.id}
                              style={{
                                alignSelf: 'center',
                                fontSize: '0.78rem',
                                color: 'var(--dg-text-secondary)',
                                padding: '4px 10px',
                                textAlign: 'center',
                              }}
                            >
                              {item.content}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            style={{
                              alignSelf: isUser ? 'flex-end' : 'flex-start',
                              maxWidth: '82%',
                              padding: '10px 14px',
                              borderRadius: 12,
                              background: isUser ? 'var(--dg-primary)' : '#FFFFFF',
                              color: isUser ? '#FFFFFF' : '#0F172A',
                              border: isUser ? 'none' : '1px solid var(--dg-border)',
                            }}
                          >
                            {!isUser && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: 'var(--dg-primary)',
                                  marginBottom: 4,
                                }}
                              >
                                {isAI ? 'Deliva AI' : 'Support Agent'}
                              </div>
                            )}
                            <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {renderFormattedContent(item.content)}
                            </div>
                          </div>
                        );
                      })}

                      {aiThinking && (
                        <div
                          style={{
                            alignSelf: 'flex-start',
                            background: '#FFFFFF',
                            border: '1px solid var(--dg-border)',
                            borderRadius: 12,
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            color: 'var(--dg-text-secondary)',
                          }}
                        >
                          Deliva AI is typing…
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {suggestEscalation && activeTicket?.status === 'ai_handling' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: '#FFFBEB',
                      borderTop: '1px solid #FDE68A',
                      fontSize: '0.82rem',
                      color: '#92400E',
                    }}
                  >
                    <span>Need a human agent?</span>
                    <button type="button" className="dp-text-btn" onClick={handleEscalateToAgent}>
                      Connect agent
                    </button>
                  </div>
                )}

                {activeTicket?.status !== 'resolved' ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid var(--dg-border)',
                      background: '#FFFFFF',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <input
                      type="text"
                      className="dg-input"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      style={{ padding: '10px 14px' }}
                    />
                    <button
                      type="button"
                      disabled={!chatInput.trim() || sendingMessage}
                      onClick={handleSendChatMessage}
                      style={{
                        background: 'var(--dg-primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        padding: '0 18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: !chatInput.trim() || sendingMessage ? 0.5 : 1,
                      }}
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderTop: '1px solid var(--dg-border)',
                      background: 'var(--dg-bg-alt)',
                      textAlign: 'center',
                      fontSize: '0.84rem',
                      color: 'var(--dg-text-secondary)',
                    }}
                  >
                    This ticket is marked as resolved.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
