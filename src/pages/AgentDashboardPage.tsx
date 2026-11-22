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
  type DriverDocSubmission,
  type AIComparisonReport,
  type AgentAuditLog,
} from '../lib/supportService';

interface AgentDashboardPageProps {
  onNavigate: (path: string) => void;
}

type AgentSection = 'overview' | 'approvals' | 'support' | 'deliveries' | 'customers' | 'riders';
type ApprovalsFilter = 'pending' | 'approved' | 'rejected' | 'all';
type AccountStatusFilter = 'all' | 'active' | 'pending' | 'suspended';
type TicketTab = 'queue' | 'my_tickets' | 'resolved';
type RightTab = 'profile' | 'credentials' | 'deliveries' | 'payments' | 'addresses' | 'tickets' | 'audit';

interface ParsedDashboardRoute {
  section: AgentSection;
  approvalsFilter: ApprovalsFilter;
  approvalsQuery: string;
  ticketId: string | null;
  ticketTab: TicketTab;
  deliveryId: string | null;
  deliveryStatus: string;
  deliveryQuery: string;
  deliveryPage: number;
  userId: string | null;
  accountStatusFilter: AccountStatusFilter;
  userQuery: string;
  rightTab: RightTab | null;
  inspectTarget: 'user' | 'delivery' | 'ticket' | null;
  docKey: string | null;
}

function parseDashboardRoute(locationUrl: string): ParsedDashboardRoute {
  let pathname = '/dashboard';
  let search = '';
  try {
    const u = new URL(locationUrl, window.location.origin);
    pathname = u.pathname;
    search = u.search;
  } catch {
    const [p, s] = locationUrl.split('?');
    pathname = p || '/dashboard';
    search = s ? `?${s}` : '';
  }

  const clean = pathname.replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  // parts[0] is dashboard | agent-dashboard | support-dashboard
  const seg1 = (parts[1] || '').toLowerCase();
  const seg2 = parts[2] || null;

  const qs = new URLSearchParams(search);
  const rawTab = (qs.get('tab') || '').toLowerCase();
  const rawInspectTab = (qs.get('itab') || rawTab).toLowerCase();
  const validRightTabs: RightTab[] = [
    'profile',
    'credentials',
    'deliveries',
    'payments',
    'addresses',
    'tickets',
    'audit',
  ];
  const parsedRightTab = validRightTabs.includes(rawInspectTab as RightTab)
    ? (rawInspectTab as RightTab)
    : null;

  const inspectParam = (qs.get('inspect') || '').toLowerCase();
  const inspectTarget =
    inspectParam === 'user' || inspectParam === 'delivery' || inspectParam === 'ticket'
      ? (inspectParam as 'user' | 'delivery' | 'ticket')
      : null;

  const tTab: TicketTab =
    rawTab === 'my_tickets' || rawTab === 'mine'
      ? 'my_tickets'
      : rawTab === 'resolved'
      ? 'resolved'
      : 'queue';

  const uFilterParam = (qs.get('filter') || '').toLowerCase();
  const rawAcctStatus = (qs.get('status') || '').toLowerCase();
  const parsedAccountStatus: AccountStatusFilter =
    rawAcctStatus === 'active' || rawAcctStatus === 'pending' || rawAcctStatus === 'suspended'
      ? (rawAcctStatus as AccountStatusFilter)
      : 'all';

  const rawApprovalsStatus = (qs.get('status') || '').toLowerCase();
  const approvalsFilter: ApprovalsFilter =
    rawApprovalsStatus === 'approved' ||
    rawApprovalsStatus === 'rejected' ||
    rawApprovalsStatus === 'all'
      ? (rawApprovalsStatus as ApprovalsFilter)
      : 'pending';

  let section: AgentSection = 'overview';
  if (seg1 === 'approvals' || seg1 === 'documents' || seg1 === 'doc-approvals') {
    section = 'approvals';
  } else if (seg1 === 'support' || seg1 === 'tickets') section = 'support';
  else if (seg1 === 'deliveries') section = 'deliveries';
  else if (seg1 === 'riders' || seg1 === 'drivers') section = 'riders';
  else if (seg1 === 'customers' || seg1 === 'consumers') section = 'customers';
  else if (seg1 === 'users') {
    section = uFilterParam === 'rider' || uFilterParam === 'driver' ? 'riders' : 'customers';
  }

  return {
    section,
    approvalsFilter,
    approvalsQuery: section === 'approvals' ? qs.get('q') || '' : '',
    ticketId: section === 'support' ? seg2 : null,
    ticketTab: tTab,
    deliveryId: section === 'deliveries' ? seg2 : null,
    deliveryStatus: qs.get('status') || 'all',
    deliveryQuery: qs.get('q') || '',
    deliveryPage: Math.max(1, parseInt(qs.get('page') || '1', 10) || 1),
    userId: section === 'customers' || section === 'riders' ? seg2 : qs.get('uid') || null,
    accountStatusFilter: section === 'customers' || section === 'riders' ? parsedAccountStatus : 'all',
    userQuery: section === 'customers' || section === 'riders' ? qs.get('q') || '' : '',
    rightTab: parsedRightTab,
    inspectTarget,
    docKey: qs.get('doc') || null,
  };
}

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
  { name: 'Top Rider', color: '#065F46' },
  { name: 'At Risk', color: '#D97706' },
];

const COMPLIANCE_DOC_SLOTS: { key: string; label: string; shortLabel: string; authority: string }[] = [
  { key: 'road_worthiness', label: 'National Certificate of Roadworthiness', shortLabel: 'Roadworthiness', authority: 'VIO / Roadworthiness' },
  { key: 'vehicle_inspection', label: 'Computerized Vehicle Inspection Referral', shortLabel: 'Inspection', authority: 'Ministry of Transport' },
  { key: 'proof_of_ownership', label: 'Proof of Ownership Certificate', shortLabel: 'Ownership', authority: 'State Motor Registry' },
  { key: 'hackney_permit', label: 'Hackney Permit (Commercial Motorcycle)', shortLabel: 'Hackney Permit', authority: 'Commercial Permit' },
  { key: 'bike_licence', label: 'Vehicle License / Bike Licence', shortLabel: 'Bike Licence', authority: 'State Motor Registry' },
  { key: 'mot', label: "MOT Courier Card / Permit (Rider's Licence)", shortLabel: 'MOT Card', authority: 'Ministry of Transport' },
];

const DashIcon: React.FC<{
  name:
    | 'overview'
    | 'approvals'
    | 'support'
    | 'deliveries'
    | 'users'
    | 'collapse'
    | 'expand'
    | 'logout'
    | 'clock'
    | 'check'
    | 'shield'
    | 'close'
    | 'search'
    | 'user';
  size?: number;
}> = ({ name, size = 18 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
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
    case 'approvals':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 11.5 17.5 16 13" />
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
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'user':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
};

export const AgentDashboardPage: React.FC<AgentDashboardPageProps> = ({ onNavigate }) => {
  const session = getAgentSession();
  const initialRoute = useRef<ParsedDashboardRoute>(
    parseDashboardRoute(window.location.pathname + window.location.search)
  ).current;

  const [activeSection, setActiveSection] = useState<AgentSection>(initialRoute.section);
  const [overviewSearch, setOverviewSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Overview
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Support Tickets
  const [ticketTab, setTicketTab] = useState<TicketTab>(initialRoute.ticketTab);
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
  const [deliveriesPage, setDeliveriesPage] = useState(initialRoute.deliveryPage);
  const [deliveriesTotalPages, setDeliveriesTotalPages] = useState(1);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState(initialRoute.deliveryStatus);
  const [deliverySearch, setDeliverySearch] = useState(initialRoute.deliveryQuery);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [selectedDeliveryConv, setSelectedDeliveryConv] = useState<any>(null);
  const [loadingDeliveryConv, setLoadingDeliveryConv] = useState(false);
  const [liveDriverLocation, setLiveDriverLocation] = useState<{
    lat: number;
    lng: number;
    updatedAt: string;
  } | null>(null);
  const delivChatEndRef = useRef<HTMLDivElement | null>(null);

  // Customers & Riders (separated tabs)
  const [customerSearch, setCustomerSearch] = useState(
    initialRoute.section === 'customers' ? initialRoute.userQuery : ''
  );
  const [riderSearch, setRiderSearch] = useState(
    initialRoute.section === 'riders' ? initialRoute.userQuery : ''
  );
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatusFilter>(
    initialRoute.accountStatusFilter
  );
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Contextual Right Sidebar (opens when needed)
  const [rightOpen, setRightOpen] = useState(false);
  const [rightMode, setRightMode] = useState<'user' | 'delivery' | 'ticket'>('user');
  const [rightTab, setRightTab] = useState<RightTab>('profile');
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(initialRoute.userId);
  const [inspectedUserDetail, setInspectedUserDetail] = useState<any>(null);
  const [loadingInspectedUser, setLoadingInspectedUser] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showFullNin, setShowFullNin] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<DriverCredentialDoc | null>(null);
  const [viewingDocUserId, setViewingDocUserId] = useState<string | null>(null);
  const [opBusy, setOpBusy] = useState(false);
  const [opFeedback, setOpFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [editingRiderDetails, setEditingRiderDetails] = useState(false);
  const [riderEditForm, setRiderEditForm] = useState({
    vehicle_type: 'bike',
    vehicle_plate: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    license_number: '',
    license_expiry: '',
  });

  // Rider Documentation Approvals Tab
  const [approvalsFilter, setApprovalsFilter] = useState<ApprovalsFilter>(initialRoute.approvalsFilter);
  const [approvalsQuery, setApprovalsQuery] = useState(initialRoute.approvalsQuery);
  const [docSubmissions, setDocSubmissions] = useState<DriverDocSubmission[]>([]);
  const [docSubmissionCounts, setDocSubmissionCounts] = useState<{
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  }>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalsFeedback, setApprovalsFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [rejectingDocKey, setRejectingDocKey] = useState<string | null>(null);
  const [rejectReasonDraft, setRejectReasonDraft] = useState('');
  const [reviewBusyKey, setReviewBusyKey] = useState<string | null>(null);
  const [bulkRejectUserId, setBulkRejectUserId] = useState<string | null>(null);
  const [bulkSelectedKeys, setBulkSelectedKeys] = useState<Record<string, boolean>>({});
  const [bulkSharedReason, setBulkSharedReason] = useState('');
  const [bulkDocReasons, setBulkDocReasons] = useState<Record<string, string>>({});

  const selectedTicketRef = useRef<SupportTicket | null>(null);
  selectedTicketRef.current = selectedTicket;
  const selectedDeliveryConvRef = useRef<any>(null);
  selectedDeliveryConvRef.current = selectedDeliveryConv;
  const inspectedUserIdRef = useRef<string | null>(null);
  inspectedUserIdRef.current = inspectedUserId;
  const rightOpenRef = useRef(false);
  rightOpenRef.current = rightOpen;
  const rightModeRef = useRef<'user' | 'delivery' | 'ticket'>('user');
  rightModeRef.current = rightMode;
  const wsConnectedRef = useRef(false);
  const syncTimersRef = useRef<Map<string, number>>(new Map());
  const deliveriesPageRef = useRef(deliveriesPage);
  deliveriesPageRef.current = deliveriesPage;
  const deliveryStatusFilterRef = useRef(deliveryStatusFilter);
  deliveryStatusFilterRef.current = deliveryStatusFilter;
  const deliverySearchRef = useRef(deliverySearch);
  deliverySearchRef.current = deliverySearch;
  const activeSectionRef = useRef<AgentSection>(activeSection);
  activeSectionRef.current = activeSection;
  const customerSearchRef = useRef(customerSearch);
  customerSearchRef.current = customerSearch;
  const riderSearchRef = useRef(riderSearch);
  riderSearchRef.current = riderSearch;
  const getActiveDirectoryQuery = useCallback(
    () =>
      activeSectionRef.current === 'riders'
        ? riderSearchRef.current
        : activeSectionRef.current === 'customers'
          ? customerSearchRef.current
          : '',
    []
  );
  const approvalsFilterRef = useRef<ApprovalsFilter>(approvalsFilter);
  approvalsFilterRef.current = approvalsFilter;
  const approvalsQueryRef = useRef(approvalsQuery);
  approvalsQueryRef.current = approvalsQuery;

  // Helper to update browser URL cleanly without page reload
  const pushDashboardUrl = useCallback((urlPath: string, replace = false) => {
    try {
      const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
      if (window.location.pathname + window.location.search !== normalized) {
        if (replace) {
          window.history.replaceState({}, '', normalized);
        } else {
          window.history.pushState({}, '', normalized);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!session?.token) {
      onNavigate('/agent-login');
    }
  }, [session?.token, onNavigate]);

  // Dynamic document title matching current route
  useEffect(() => {
    if (activeSection === 'overview') {
      document.title = 'Overview | Deliva Agent Operations';
    } else if (activeSection === 'approvals') {
      document.title = 'Doc Approvals | Deliva Agent Operations';
    } else if (activeSection === 'support') {
      document.title = selectedTicket
        ? `${selectedTicket.subject} | Support — Deliva Agent`
        : 'Support Queue | Deliva Agent Operations';
    } else if (activeSection === 'deliveries') {
      document.title = selectedDeliveryConv?.delivery?.tracking_id
        ? `${selectedDeliveryConv.delivery.tracking_id} | Deliveries — Deliva Agent`
        : 'Deliveries | Deliva Agent Operations';
    } else if (activeSection === 'customers') {
      document.title = inspectedUserDetail?.profile
        ? `${inspectedUserDetail.profile.first_name} ${inspectedUserDetail.profile.last_name} | Customers — Deliva Agent`
        : 'Customers | Deliva Agent Operations';
    } else if (activeSection === 'riders') {
      document.title = inspectedUserDetail?.profile
        ? `${inspectedUserDetail.profile.first_name} ${inspectedUserDetail.profile.last_name} | Riders — Deliva Agent`
        : 'Riders | Deliva Agent Operations';
    }
  }, [activeSection, selectedTicket, selectedDeliveryConv, inspectedUserDetail]);

  // Silent background data fetchers (real-time driven)
  const fetchOverview = useCallback(async (silent = false) => {
    if (!silent) setLoadingOverview(true);
    try {
      const data = await invokeSupportAction('agent_get_overview', {}, 'agent');
      setOverviewData(data);
      const qCount = data?.stats?.queue_count ?? data?.queue_count ?? 0;
      setQueueBadgeCount(qCount);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoadingOverview(false);
    }
  }, []);

  const fetchAgentTickets = useCallback(async (silent = false) => {
    if (!silent) setLoadingTickets(true);
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
      if (!silent) setLoadingTickets(false);
    }
  }, []);

  const loadTicketMessages = useCallback(async (ticketId: string, silent = false) => {
    if (!silent) setLoadingChat(true);
    try {
      const data = await invokeSupportAction<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>('agent_get_messages', { ticket_id: ticketId }, 'agent');
      if (data?.ticket) setSelectedTicket(data.ticket);
      if (data?.messages) setTicketMessages(data.messages);
      return data?.ticket || null;
    } catch {
      return null;
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }, []);

  const fetchAgentDeliveries = useCallback(
    async (
      page = deliveriesPageRef.current,
      status = deliveryStatusFilterRef.current,
      q = deliverySearchRef.current,
      silent = false
    ) => {
      if (!silent) setLoadingDeliveries(true);
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
        if (!silent) setLoadingDeliveries(false);
      }
    },
    []
  );

  const loadDeliveryConversation = useCallback(
    async (deliveryId: string, silent = false) => {
      if (!silent) setLoadingDeliveryConv(true);
      try {
        const data = await invokeSupportAction(
          'agent_get_delivery_conversation',
          { delivery_id: deliveryId },
          'agent'
        );
        setSelectedDeliveryConv(data);
        return data;
      } catch {
        return null;
      } finally {
        if (!silent) setLoadingDeliveryConv(false);
      }
    },
    []
  );

  const fetchAgentUsers = useCallback(
    async (q = getActiveDirectoryQuery(), silent = false) => {
      if (!silent) setLoadingUsers(true);
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
        if (!silent) setLoadingUsers(false);
      }
    },
    [getActiveDirectoryQuery]
  );

  const fetchDocSubmissions = useCallback(
    async (
      status: ApprovalsFilter = approvalsFilterRef.current,
      q = approvalsQueryRef.current,
      silent = false
    ) => {
      if (!silent) setLoadingApprovals(true);
      try {
        const data = await invokeSupportAction<{
          submissions?: DriverDocSubmission[];
          counts?: { all: number; pending: number; approved: number; rejected: number };
        }>(
          'agent_list_doc_submissions',
          {
            status_filter: status,
            search_query: q.trim(),
          },
          'agent'
        );
        if (Array.isArray(data?.submissions)) {
          setDocSubmissions(data.submissions);
        }
        if (data?.counts) {
          setDocSubmissionCounts({
            all: data.counts.all || 0,
            pending: data.counts.pending || 0,
            approved: data.counts.approved || 0,
            rejected: data.counts.rejected || 0,
          });
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setLoadingApprovals(false);
      }
    },
    []
  );

  const loadUserInspector = useCallback(
    async (
      userId: string,
      preferredTab?: RightTab,
      silent = false,
      docToOpenKey?: string | null
    ) => {
      if (!userId) return;
      if (!silent) {
        setRightMode('user');
        setRightOpen(true);
        setInspectedUserId(userId);
        if (preferredTab) setRightTab(preferredTab);
        setShowTagDropdown(false);
        setShowFullNin(false);
        setOpFeedback(null);
        setSuspendReasonInput('');
        setEditingRiderDetails(false);
        setLoadingInspectedUser(true);
      }
      try {
        const data = await invokeSupportAction(
          'agent_get_user_details',
          { user_id: userId },
          'agent'
        );
        setInspectedUserDetail(data);
        if (!silent && data?.driver_credentials) {
          const dc = data.driver_credentials;
          setRiderEditForm({
            vehicle_type: dc.vehicle_type || 'bike',
            vehicle_plate: dc.vehicle_plate || '',
            vehicle_make: dc.vehicle_make || '',
            vehicle_model: dc.vehicle_model || '',
            vehicle_year: dc.vehicle_year ? String(dc.vehicle_year) : '',
            license_number: dc.license_number || '',
            license_expiry: dc.license_expiry || '',
          });
        }
        if (!preferredTab && !silent) {
          setRightTab(data?.is_driver ? 'credentials' : 'profile');
        }
        const docsList = (data?.driver_credentials?.documents || []) as DriverCredentialDoc[];
        if (docToOpenKey && docsList.length > 0) {
          const matchedDoc = docsList.find((d) => d.key === docToOpenKey && d.uploaded);
          if (matchedDoc) {
            setViewingDoc(matchedDoc);
            setViewingDocUserId(userId);
          }
        } else if (silent && docsList.length > 0) {
          setViewingDoc((prev) => {
            if (!prev) return prev;
            const updatedDoc = docsList.find((d) => d.key === prev.key);
            if (!updatedDoc) return prev;
            return updatedDoc.uploaded ? updatedDoc : null;
          });
        }
      } catch {
        if (!silent) setInspectedUserDetail(null);
      } finally {
        if (!silent) setLoadingInspectedUser(false);
      }
    },
    []
  );

  // Sync URL with current user inspector action
  const openUserWithRoute = useCallback(
    (
      userId: string,
      preferredTab: RightTab = 'profile',
      updatePathToDirectory = activeSection === 'customers' || activeSection === 'riders'
    ) => {
      loadUserInspector(userId, preferredTab);
      if (updatePathToDirectory) {
        const dirSec =
          activeSection === 'riders' || activeSection === 'customers' ? activeSection : 'customers';
        pushDashboardUrl(`/dashboard/${dirSec}/${userId}?tab=${preferredTab}`);
      } else if (activeSection === 'approvals') {
        const qs = new URLSearchParams();
        if (approvalsFilterRef.current !== 'pending') qs.set('status', approvalsFilterRef.current);
        if (approvalsQueryRef.current.trim()) qs.set('q', approvalsQueryRef.current.trim());
        qs.set('inspect', 'user');
        qs.set('uid', userId);
        qs.set('itab', preferredTab);
        pushDashboardUrl(`/dashboard/approvals?${qs.toString()}`);
      } else if (activeSection === 'support' && selectedTicketRef.current) {
        pushDashboardUrl(
          `/dashboard/support/${selectedTicketRef.current.id}?inspect=user&itab=${preferredTab}`
        );
      } else if (activeSection === 'deliveries' && selectedDeliveryConvRef.current?.delivery?.id) {
        pushDashboardUrl(
          `/dashboard/deliveries/${selectedDeliveryConvRef.current.delivery.id}?inspect=user&uid=${userId}&itab=${preferredTab}`
        );
      }
    },
    [activeSection, loadUserInspector, pushDashboardUrl]
  );

  const navigateSection = useCallback(
    (sec: AgentSection) => {
      setActiveSection(sec);
      setViewingDoc(null);
      setViewingDocUserId(null);
      if (sec === 'overview') {
        setRightOpen(false);
        pushDashboardUrl('/dashboard/overview');
        fetchOverview(Boolean(overviewData));
      } else if (sec === 'approvals') {
        setRightOpen(false);
        const qs = new URLSearchParams();
        if (approvalsFilter !== 'pending') qs.set('status', approvalsFilter);
        if (approvalsQuery.trim()) qs.set('q', approvalsQuery.trim());
        pushDashboardUrl(`/dashboard/approvals${qs.toString() ? `?${qs.toString()}` : ''}`);
        fetchDocSubmissions(approvalsFilter, approvalsQuery, docSubmissions.length > 0);
      } else if (sec === 'support') {
        setSelectedTicket(null);
        setTicketMessages([]);
        setRightOpen(false);
        pushDashboardUrl(`/dashboard/support?tab=${ticketTab}`);
        fetchAgentTickets(ticketsBuckets.queue.length > 0 || ticketsBuckets.my_tickets.length > 0);
      } else if (sec === 'deliveries') {
        setSelectedDeliveryConv(null);
        setRightOpen(false);
        const qs = new URLSearchParams();
        if (deliveryStatusFilter !== 'all') qs.set('status', deliveryStatusFilter);
        if (deliverySearch.trim()) qs.set('q', deliverySearch.trim());
        pushDashboardUrl(`/dashboard/deliveries${qs.toString() ? `?${qs.toString()}` : ''}`);
        fetchAgentDeliveries(
          deliveriesPageRef.current,
          deliveryStatusFilter,
          deliverySearch,
          deliveries.length > 0
        );
      } else if (sec === 'customers' || sec === 'riders') {
        setRightOpen(false);
        setAccountStatusFilter('all');
        const q = sec === 'riders' ? riderSearch : customerSearch;
        const qs = new URLSearchParams();
        if (q.trim()) qs.set('q', q.trim());
        pushDashboardUrl(`/dashboard/${sec}${qs.toString() ? `?${qs.toString()}` : ''}`);
        fetchAgentUsers(q, usersList.length > 0);
      }
    },
    [
      overviewData,
      approvalsFilter,
      approvalsQuery,
      docSubmissions.length,
      ticketTab,
      ticketsBuckets.queue.length,
      ticketsBuckets.my_tickets.length,
      deliveryStatusFilter,
      deliverySearch,
      deliveries.length,
      customerSearch,
      riderSearch,
      usersList.length,
      fetchOverview,
      fetchDocSubmissions,
      fetchAgentTickets,
      fetchAgentDeliveries,
      fetchAgentUsers,
      pushDashboardUrl,
    ]
  );

  const openTicketWithRoute = useCallback(
    (ticket: SupportTicket) => {
      setActiveSection('support');
      setSelectedTicket(ticket);
      setRightOpen(false);
      loadTicketMessages(ticket.id);
      pushDashboardUrl(`/dashboard/support/${ticket.id}`);
    },
    [loadTicketMessages, pushDashboardUrl]
  );

  const openDeliveryWithRoute = useCallback(
    async (deliveryId: string) => {
      setActiveSection('deliveries');
      const data = await loadDeliveryConversation(deliveryId);
      if (data) {
        setRightMode('delivery');
        setRightOpen(true);
      }
      pushDashboardUrl(`/dashboard/deliveries/${deliveryId}`);
    },
    [loadDeliveryConversation, pushDashboardUrl]
  );

  // Hydrate initial deep-link URL & handle browser Back/Forward (`popstate`)
  const applyParsedRoute = useCallback(
    async (parsed: ParsedDashboardRoute) => {
      setActiveSection(parsed.section);
      setApprovalsFilter(parsed.approvalsFilter);
      setApprovalsQuery(parsed.approvalsQuery);
      setTicketTab(parsed.ticketTab);
      setDeliveryStatusFilter(parsed.deliveryStatus);
      setDeliverySearch(parsed.deliveryQuery);
      setDeliveriesPage(parsed.deliveryPage);
      setAccountStatusFilter(parsed.accountStatusFilter);
      if (parsed.section === 'customers') {
        setCustomerSearch(parsed.userQuery);
      } else if (parsed.section === 'riders') {
        setRiderSearch(parsed.userQuery);
      }
      setViewingDoc(null);
      setViewingDocUserId(null);

      if (parsed.section === 'overview') {
        setRightOpen(false);
        fetchOverview();
      } else if (parsed.section === 'approvals') {
        fetchDocSubmissions(parsed.approvalsFilter, parsed.approvalsQuery);
        if (parsed.inspectTarget === 'user' && parsed.userId) {
          await loadUserInspector(parsed.userId, parsed.rightTab || 'credentials', false, parsed.docKey);
        } else {
          setRightOpen(false);
        }
      } else if (parsed.section === 'support') {
        fetchAgentTickets();
        if (parsed.ticketId) {
          const loadedTicket = await loadTicketMessages(parsed.ticketId);
          if (parsed.inspectTarget === 'user') {
            const ticket = loadedTicket || selectedTicketRef.current;
            const uid = parsed.userId || ticket?.user_id || ticket?.profiles?.id;
            if (uid) {
              await loadUserInspector(uid, parsed.rightTab || 'profile', false, parsed.docKey);
            }
          } else {
            setRightOpen(false);
          }
        } else {
          setSelectedTicket(null);
          setTicketMessages([]);
          setRightOpen(false);
        }
      } else if (parsed.section === 'deliveries') {
        fetchAgentDeliveries(parsed.deliveryPage, parsed.deliveryStatus, parsed.deliveryQuery);
        if (parsed.deliveryId) {
          await loadDeliveryConversation(parsed.deliveryId);
          if (parsed.inspectTarget === 'user' && parsed.userId) {
            await loadUserInspector(parsed.userId, parsed.rightTab || 'credentials', false, parsed.docKey);
          } else {
            setRightMode('delivery');
            setRightOpen(true);
          }
        } else {
          setSelectedDeliveryConv(null);
          setRightOpen(false);
        }
      } else if (parsed.section === 'customers' || parsed.section === 'riders') {
        fetchAgentUsers(parsed.userQuery);
        if (parsed.userId) {
          await loadUserInspector(parsed.userId, parsed.rightTab || undefined, false, parsed.docKey);
        } else {
          setRightOpen(false);
        }
      }
    },
    [
      fetchOverview,
      fetchDocSubmissions,
      fetchAgentTickets,
      loadTicketMessages,
      fetchAgentDeliveries,
      loadDeliveryConversation,
      fetchAgentUsers,
      loadUserInspector,
    ]
  );

  // Initial mount hydration
  useEffect(() => {
    if (!session?.token) return;
    if (window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/dashboard') {
      pushDashboardUrl('/dashboard/overview', true);
    }
    applyParsedRoute(initialRoute);
    // Keep all sidebar badges, directories, and live card stores warm
    if (initialRoute.section !== 'support') {
      fetchAgentTickets(true);
    }
    if (initialRoute.section !== 'approvals') {
      fetchDocSubmissions('pending', '', true);
    }
    if (initialRoute.section !== 'deliveries') {
      fetchAgentDeliveries(1, 'all', '', true);
    }
    if (initialRoute.section !== 'customers' && initialRoute.section !== 'riders') {
      fetchAgentUsers('', true);
    }
  }, [session?.token]);

  // Listen to browser Back/Forward
  useEffect(() => {
    const onPopState = () => {
      const nextUrl = window.location.pathname + window.location.search;
      applyParsedRoute(parseDashboardRoute(nextUrl));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyParsedRoute]);

  type RealtimeChannel =
    | 'overview'
    | 'approvals'
    | 'tickets'
    | 'deliveries'
    | 'users'
    | 'inspector'
    | 'selected_ticket'
    | 'selected_delivery';

  const scheduleRealtimeSync = useCallback(
    (...channels: RealtimeChannel[]) => {
      channels.forEach((ch) => {
        const existingTimer = syncTimersRef.current.get(ch);
        if (existingTimer !== undefined) {
          window.clearTimeout(existingTimer);
        }
        const timerId = window.setTimeout(() => {
          syncTimersRef.current.delete(ch);
          switch (ch) {
            case 'overview':
              fetchOverview(true);
              break;
            case 'approvals':
              fetchDocSubmissions(approvalsFilterRef.current, approvalsQueryRef.current, true);
              break;
            case 'tickets':
              fetchAgentTickets(true);
              break;
            case 'deliveries':
              fetchAgentDeliveries(
                deliveriesPageRef.current,
                deliveryStatusFilterRef.current,
                deliverySearchRef.current,
                true
              );
              break;
            case 'users':
              fetchAgentUsers(getActiveDirectoryQuery(), true);
              break;
            case 'inspector':
              if (rightOpenRef.current && rightModeRef.current === 'user' && inspectedUserIdRef.current) {
                loadUserInspector(inspectedUserIdRef.current, undefined, true);
              }
              break;
            case 'selected_ticket':
              if (selectedTicketRef.current?.id) {
                loadTicketMessages(selectedTicketRef.current.id, true);
              }
              break;
            case 'selected_delivery':
              if (selectedDeliveryConvRef.current?.delivery?.id) {
                loadDeliveryConversation(selectedDeliveryConvRef.current.delivery.id, true);
              }
              break;
          }
        }, 90);
        syncTimersRef.current.set(ch, timerId);
      });
    },
    [
      fetchOverview,
      fetchDocSubmissions,
      fetchAgentTickets,
      fetchAgentDeliveries,
      fetchAgentUsers,
      getActiveDirectoryQuery,
      loadUserInspector,
      loadTicketMessages,
      loadDeliveryConversation,
    ]
  );

  // Real-time WebSocket stream for EVERY entity & card across the Agent Dashboard
  useEffect(() => {
    if (!session?.token) return;
    let hasConnectedOnce = false;

    const handleRealtimeEvent = (evt: { type: string; payload: any }) => {
      const t = evt.type;
      const p = evt.payload;

      if (t === 'support_ticket_updated') {
        if (selectedTicketRef.current && p?.id === selectedTicketRef.current.id) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...p } : p));
        }
        scheduleRealtimeSync('tickets', 'overview', 'inspector');
      } else if (t === 'support_message_created' || t === 'support_message_updated') {
        const activeT = selectedTicketRef.current;
        if (activeT && (!p?.ticket_id || p.ticket_id === activeT.id) && p?.id) {
          setTicketMessages((prev) => {
            if (t === 'support_message_updated') {
              return prev.map((m) => (m.id === p.id ? p : m));
            }
            if (prev.some((m) => m.id === p.id)) return prev;
            return [...prev, p];
          });
        }
        scheduleRealtimeSync('tickets', 'overview');
      } else if (t === 'delivery_status') {
        const activeDel = selectedDeliveryConvRef.current?.delivery;
        if (activeDel && (p?.id === activeDel.id || p?.tracking_id === activeDel.tracking_id)) {
          setSelectedDeliveryConv((prev: any) =>
            prev ? { ...prev, delivery: { ...prev.delivery, ...p } } : prev
          );
          scheduleRealtimeSync('selected_delivery');
        }
        scheduleRealtimeSync('overview', 'deliveries', 'inspector');
      } else if (t === 'chat_message' || t === 'conversation_updated' || t === 'messages_read') {
        const msgObj = p?.message || p;
        const activeConv = selectedDeliveryConvRef.current;
        if (
          t === 'chat_message' &&
          activeConv &&
          msgObj?.id &&
          (p?.delivery_id === activeConv.delivery?.id ||
            msgObj?.conversation_id === activeConv.conversation?.id)
        ) {
          setSelectedDeliveryConv((prev: any) => {
            if (!prev) return prev;
            const existing: any[] = prev.messages || [];
            if (existing.some((m) => m.id === msgObj.id)) return prev;
            return { ...prev, messages: [...existing, msgObj] };
          });
        }
        scheduleRealtimeSync('overview', 'deliveries', 'selected_delivery');
      } else if (
        t === 'driver_updated' ||
        t === 'user_updated' ||
        t === 'user_tag_updated' ||
        t === 'driver_performance_updated' ||
        t === 'wallet_updated' ||
        t === 'driver_suspended' ||
        t === 'driver_license_expired_locked' ||
        t === 'driver_license_expiry_warning'
      ) {
        const targetUid = p?.user_id || p?.driver_id;
        scheduleRealtimeSync('overview', 'users', 'approvals', 'deliveries');
        if (
          rightOpenRef.current &&
          rightModeRef.current === 'user' &&
          inspectedUserIdRef.current &&
          (!targetUid || targetUid === inspectedUserIdRef.current)
        ) {
          scheduleRealtimeSync('inspector');
        }
      } else if (t === 'driver_location') {
        const lat = Number(p?.lat ?? p?.latitude);
        const lng = Number(p?.lng ?? p?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setLiveDriverLocation({
            lat,
            lng,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    };

    const unsubGlobal = subscribeToSupportRealtime(
      'support_agents',
      handleRealtimeEvent,
      (connected) => {
        wsConnectedRef.current = connected;
        if (connected) {
          if (hasConnectedOnce) {
            scheduleRealtimeSync(
              'overview',
              'approvals',
              'tickets',
              'deliveries',
              'users',
              'inspector',
              'selected_ticket',
              'selected_delivery'
            );
          }
          hasConnectedOnce = true;
        }
      }
    );

    const reconcileOnVisible = () => {
      if (document.visibilityState === 'visible') {
        scheduleRealtimeSync(
          'overview',
          'approvals',
          'tickets',
          'deliveries',
          'users',
          'inspector',
          'selected_ticket',
          'selected_delivery'
        );
      }
    };
    window.addEventListener('focus', reconcileOnVisible);
    document.addEventListener('visibilitychange', reconcileOnVisible);

    // Light backup reconciliation only while WebSocket is temporarily disconnected
    const fallbackTimer = window.setInterval(() => {
      if (!wsConnectedRef.current && document.visibilityState === 'visible') {
        scheduleRealtimeSync(
          'overview',
          'approvals',
          'tickets',
          'deliveries',
          'users',
          'inspector',
          'selected_ticket',
          'selected_delivery'
        );
      }
    }, 12000);

    return () => {
      unsubGlobal();
      window.removeEventListener('focus', reconcileOnVisible);
      document.removeEventListener('visibilitychange', reconcileOnVisible);
      window.clearInterval(fallbackTimer);
      syncTimersRef.current.forEach((tid) => window.clearTimeout(tid));
      syncTimersRef.current.clear();
    };
  }, [session?.token, scheduleRealtimeSync]);

  // Subscribe to active support ticket room directly when open
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const unsubTicket = subscribeToSupportRealtime(`support_${selectedTicket.id}`, (evt) => {
      if (evt.type === 'support_ticket_updated' && evt.payload?.id === selectedTicket.id) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...evt.payload } : evt.payload));
        scheduleRealtimeSync('tickets', 'overview');
      } else if (evt.type === 'support_message_created' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== selectedTicket.id) return;
        setTicketMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        scheduleRealtimeSync('tickets', 'overview');
      } else if (evt.type === 'support_message_updated' && evt.payload) {
        const msg = evt.payload as SupportMessage;
        if (msg.ticket_id && msg.ticket_id !== selectedTicket.id) return;
        setTicketMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      }
    });
    return unsubTicket;
  }, [selectedTicket?.id, scheduleRealtimeSync]);

  // Subscribe directly to active Delivery & Conversation rooms for live GPS, status, & chat
  const activeDeliveryId = selectedDeliveryConv?.delivery?.id || '';
  const activeDeliveryTrackingId = selectedDeliveryConv?.delivery?.tracking_id || '';
  const activeDeliveryConvId = selectedDeliveryConv?.conversation?.id || '';

  useEffect(() => {
    setLiveDriverLocation(null);
    const rooms = [
      activeDeliveryId ? `delivery_${activeDeliveryId}` : '',
      activeDeliveryTrackingId ? `delivery_${activeDeliveryTrackingId}` : '',
      activeDeliveryConvId ? `conv_${activeDeliveryConvId}` : '',
    ].filter(Boolean);
    if (rooms.length === 0) return;

    const unsubs = Array.from(new Set(rooms)).map((room) =>
      subscribeToSupportRealtime(room, (evt) => {
        const t = evt.type;
        const p = evt.payload;
        if (t === 'driver_location') {
          const lat = Number(p?.lat ?? p?.latitude);
          const lng = Number(p?.lng ?? p?.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setLiveDriverLocation({ lat, lng, updatedAt: new Date().toISOString() });
          }
        } else if (t === 'delivery_status' && p) {
          setSelectedDeliveryConv((prev: any) =>
            prev ? { ...prev, delivery: { ...prev.delivery, ...p } } : prev
          );
          scheduleRealtimeSync('deliveries', 'overview', 'selected_delivery', 'inspector');
        } else if (t === 'chat_message' && p) {
          const msgObj = p?.message || p;
          if (msgObj?.id) {
            setSelectedDeliveryConv((prev: any) => {
              if (!prev) return prev;
              const existing: any[] = prev.messages || [];
              if (existing.some((m) => m.id === msgObj.id)) return prev;
              return { ...prev, messages: [...existing, msgObj] };
            });
          }
        } else if (t === 'messages_read' || t === 'conversation_updated') {
          scheduleRealtimeSync('selected_delivery', 'deliveries');
        }
      })
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [activeDeliveryId, activeDeliveryTrackingId, activeDeliveryConvId, scheduleRealtimeSync]);

  // Subscribe directly to inspected User / Rider rooms for instant wallet, GPS, rating, & verification updates
  useEffect(() => {
    if (!rightOpen || rightMode !== 'user' || !inspectedUserId) return;
    const rooms = [`user_${inspectedUserId}`, `driver_${inspectedUserId}`];
    const unsubs = rooms.map((room) =>
      subscribeToSupportRealtime(room, (evt) => {
        if (
          evt.type === 'wallet_updated' ||
          evt.type === 'driver_performance_updated' ||
          evt.type === 'driver_updated' ||
          evt.type === 'user_updated' ||
          evt.type === 'driver_suspended' ||
          evt.type === 'driver_license_expired_locked' ||
          evt.type === 'driver_license_expiry_warning' ||
          evt.type === 'conversation_updated'
        ) {
          scheduleRealtimeSync('inspector', 'users', 'approvals', 'overview');
        }
      })
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [rightOpen, rightMode, inspectedUserId, scheduleRealtimeSync]);

  // Smooth auto-scroll chat feeds when messages arrive
  useEffect(() => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [ticketMessages.length]);

  useEffect(() => {
    setTimeout(() => {
      delivChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [selectedDeliveryConv?.messages?.length]);

  // Ticket & User Mutations
  const handleClaimTicket = async (ticketId: string) => {
    try {
      await invokeSupportAction('agent_claim_ticket', { ticket_id: ticketId }, 'agent');
      if (selectedTicket?.id === ticketId) {
        loadTicketMessages(ticketId, true);
      }
      fetchAgentTickets(true);
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
        if (sentAgentMsg && !next.some((m) => m.id === sentAgentMsg.id)) next.push(sentAgentMsg);
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
      fetchAgentTickets(true);
    } catch {
      // ignore
    }
  };

  const handleResolveAgentTicket = async () => {
    if (!selectedTicket) return;
    try {
      await invokeSupportAction('agent_resolve_ticket', { ticket_id: selectedTicket.id }, 'agent');
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : prev));
      fetchAgentTickets(true);
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
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveUserTag = async (tagId: string) => {
    try {
      await invokeSupportAction('agent_remove_user_tag', { tag_id: tagId }, 'agent');
      setInspectedUserDetail((prev: any) =>
        prev ? { ...prev, tags: (prev.tags || []).filter((t: UserTag) => t.id !== tagId) } : prev
      );
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
      openUserWithRoute(uid, isDrv ? 'credentials' : 'profile', false);
    } else {
      setRightMode('ticket');
      setRightOpen(true);
      pushDashboardUrl(`/dashboard/support/${selectedTicket.id}?inspect=ticket`);
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  const handleToggleSuspension = async (suspend: boolean) => {
    const uid = inspectedUserDetail?.profile?.id;
    if (!uid || opBusy) return;
    setOpBusy(true);
    setOpFeedback(null);
    try {
      await invokeSupportAction(
        suspend ? 'agent_suspend_user' : 'agent_unsuspend_user',
        {
          user_id: uid,
          reason: suspendReasonInput.trim() || undefined,
        },
        'agent'
      );
      setSuspendReasonInput('');
      await Promise.all([
        loadUserInspector(uid, undefined, true),
        fetchAgentUsers(getActiveDirectoryQuery(), true),
      ]);
      setOpFeedback({
        type: 'success',
        text: suspend
          ? 'Account suspended, active session revoked, and email sent.'
          : 'Account unsuspended, restored to active, and email sent.',
      });
    } catch (err: any) {
      setOpFeedback({
        type: 'error',
        text: err?.message || `Failed to ${suspend ? 'suspend' : 'unsuspend'} account.`,
      });
    } finally {
      setOpBusy(false);
    }
  };

  const handleRiderOperation = async (
    operation: string,
    extra: Record<string, any> = {},
    successText?: string
  ) => {
    const uid = inspectedUserDetail?.profile?.id;
    if (!uid || opBusy) return;
    setOpBusy(true);
    setOpFeedback(null);
    try {
      await invokeSupportAction(
        'agent_manage_rider',
        {
          user_id: uid,
          operation,
          ...extra,
        },
        'agent'
      );
      await Promise.all([
        loadUserInspector(uid, undefined, true),
        fetchAgentUsers(getActiveDirectoryQuery(), true),
      ]);
      setOpFeedback({
        type: 'success',
        text: successText || 'Rider profile updated and logged.',
      });
      if (operation === 'update_details') {
        setEditingRiderDetails(false);
      }
    } catch (err: any) {
      setOpFeedback({
        type: 'error',
        text: err?.message || 'Could not update rider record.',
      });
    } finally {
      setOpBusy(false);
    }
  };

  const handleSaveRiderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
      await handleRiderOperation(
      'update_details',
      {
        reason: suspendReasonInput.trim() || undefined,
        vehicle_type: riderEditForm.vehicle_type,
        vehicle_plate: riderEditForm.vehicle_plate.trim(),
        vehicle_make: riderEditForm.vehicle_make.trim(),
        vehicle_model: riderEditForm.vehicle_model.trim(),
        vehicle_year: riderEditForm.vehicle_year ? Number(riderEditForm.vehicle_year) : 0,
        license_number: riderEditForm.license_number.trim(),
        license_expiry: riderEditForm.license_expiry.trim(),
      },
      'Rider vehicle and licence details updated, audited, and emailed.'
    );
  };

  const handleReviewDocument = async (
    targetUserId: string,
    docKey: string,
    decision: 'approve' | 'reject',
    reason = ''
  ) => {
    const busyId = `${targetUserId}:${docKey}`;
    if (reviewBusyKey) return;
    if (decision === 'reject' && !reason.trim()) {
      const msg = 'Please enter a rejection reason so the rider knows what to re-upload.';
      setApprovalsFeedback({ type: 'error', text: msg });
      setOpFeedback({ type: 'error', text: msg });
      return;
    }

    setReviewBusyKey(busyId);
    setOpBusy(true);
    setApprovalsFeedback(null);
    setOpFeedback(null);
    try {
      const res = await invokeSupportAction<{
        is_activated?: boolean;
        ai_comparison?: AIComparisonReport | null;
      }>(
        'agent_review_document',
        {
          user_id: targetUserId,
          doc_key: docKey,
          decision,
          reason: reason.trim(),
        },
        'agent'
      );

      setRejectingDocKey(null);
      setRejectReasonDraft('');

      const aiMismatch =
        decision === 'approve' && res?.ai_comparison && !res.ai_comparison.passed;
      const msg =
        decision === 'approve'
          ? res?.is_activated
            ? 'Document accepted — AI compared all certificates and activated the rider account.'
            : aiMismatch
              ? `Documents accepted, but AI comparison blocked activation: ${res?.ai_comparison?.summary || 'Mismatch detected across documents or NIN profile.'}`
              : 'Document accepted and recorded in audit trail.'
          : 'Document rejected and deleted; rider slot unlocked for re-upload.';

      setApprovalsFeedback({ type: aiMismatch ? 'error' : 'success', text: msg });
      setOpFeedback({ type: aiMismatch ? 'error' : 'success', text: msg });

      await Promise.all([
        fetchDocSubmissions(approvalsFilterRef.current, approvalsQueryRef.current, true),
        fetchOverview(true),
        fetchAgentUsers(getActiveDirectoryQuery(), true),
        inspectedUserIdRef.current === targetUserId
          ? loadUserInspector(targetUserId, undefined, true)
          : Promise.resolve(),
      ]);

      if (viewingDoc && viewingDocUserId === targetUserId) {
        if (decision === 'reject' && viewingDoc.key === docKey) {
          setViewingDoc(null);
          setViewingDocUserId(null);
        } else if (viewingDoc.key === docKey) {
          setViewingDoc((prev) =>
            prev
              ? {
                  ...prev,
                  verified: true,
                  verification_status: 'verified',
                  rejection_reason: '',
                  reviewed_by_agent_name: session?.user
                    ? `${session.user.first_name} ${session.user.last_name}`.trim()
                    : 'Agent',
                  reviewed_at: new Date().toISOString(),
                }
              : prev
          );
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Could not record document review decision.';
      setApprovalsFeedback({ type: 'error', text: errMsg });
      setOpFeedback({ type: 'error', text: errMsg });
    } finally {
      setReviewBusyKey(null);
      setOpBusy(false);
    }
  };

  const handleBulkReviewDocuments = async (
    targetUserId: string,
    decision: 'approve' | 'reject',
    items: { doc_key: string; label?: string; reason?: string }[]
  ) => {
    if (reviewBusyKey || items.length === 0) return;

    const prepared = items.map((it) => ({
      doc_key: it.doc_key,
      decision,
      reason: (it.reason || '').trim(),
    }));
    if (decision === 'reject') {
      const missing = prepared.find((it) => !it.reason);
      if (missing) {
        const msg = 'Please enter a rejection reason (shared or per-document) for every selected document.';
        setApprovalsFeedback({ type: 'error', text: msg });
        setOpFeedback({ type: 'error', text: msg });
        return;
      }
    }

    setReviewBusyKey(`${targetUserId}:all`);
    setOpBusy(true);
    setApprovalsFeedback(null);
    setOpFeedback(null);
    try {
      const res = await invokeSupportAction<{
        is_activated?: boolean;
        ai_comparison?: AIComparisonReport | null;
        reviewed_count?: number;
        rejected_count?: number;
      }>(
        'agent_review_documents',
        {
          user_id: targetUserId,
          decision,
          items: prepared,
        },
        'agent'
      );

      setBulkRejectUserId(null);
      setBulkSharedReason('');
      setBulkDocReasons({});
      setBulkSelectedKeys({});
      setRejectingDocKey(null);
      setRejectReasonDraft('');

      const count = res?.reviewed_count ?? prepared.length;
      const aiMismatch =
        decision === 'approve' && res?.ai_comparison && !res.ai_comparison.passed;
      const msg =
        decision === 'approve'
          ? res?.is_activated
            ? `Accepted ${count} document(s) — AI verification passed, rider activated, and activation email sent.`
            : aiMismatch
              ? `Accepted ${count} document(s), but AI comparison blocked activation: ${res?.ai_comparison?.summary || 'Mismatch detected across documents or NIN profile.'}`
              : `Accepted ${count} document(s) and recorded in audit trail.`
          : `Rejected and deleted ${res?.rejected_count ?? count} document(s), unlocked slots, and emailed rejection reason(s) to the rider.`;

      setApprovalsFeedback({ type: aiMismatch ? 'error' : 'success', text: msg });
      setOpFeedback({ type: aiMismatch ? 'error' : 'success', text: msg });

      await Promise.all([
        fetchDocSubmissions(approvalsFilterRef.current, approvalsQueryRef.current, true),
        fetchOverview(true),
        fetchAgentUsers(getActiveDirectoryQuery(), true),
        inspectedUserIdRef.current === targetUserId
          ? loadUserInspector(targetUserId, undefined, true)
          : Promise.resolve(),
      ]);

      if (viewingDoc && viewingDocUserId === targetUserId && decision === 'reject') {
        if (prepared.some((it) => it.doc_key === viewingDoc.key)) {
          setViewingDoc(null);
          setViewingDocUserId(null);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Could not apply bulk document review.';
      setApprovalsFeedback({ type: 'error', text: errMsg });
      setOpFeedback({ type: 'error', text: errMsg });
    } finally {
      setReviewBusyKey(null);
      setOpBusy(false);
    }
  };

  const renderBulkReviewControls = (
    targetUserId: string,
    complianceUploadedDocs: DriverCredentialDoc[]
  ) => {
    const eligibleDocs = complianceUploadedDocs.filter(
      (d) => d.key !== 'id_document' && d.uploaded
    );
    if (eligibleDocs.length === 0) return null;

    const pendingDocs = eligibleDocs.filter(
      (d) => !d.verified && (d.verification_status || '').toLowerCase() !== 'rejected'
    );
    const isPanelOpen = bulkRejectUserId === targetUserId;
    const isBulkBusy = reviewBusyKey === `${targetUserId}:all`;
    const selectedDocs = eligibleDocs.filter((d) => Boolean(bulkSelectedKeys[d.key]));

    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {pendingDocs.length > 1 && (
            <button
              type="button"
              disabled={Boolean(reviewBusyKey)}
              className="da-btn da-btn-sm da-btn-success"
              style={{ fontSize: '0.71rem', padding: '4px 9px' }}
              onClick={() =>
                handleBulkReviewDocuments(
                  targetUserId,
                  'approve',
                  pendingDocs.map((d) => ({ doc_key: d.key }))
                )
              }
            >
              {isBulkBusy ? 'Saving…' : `Accept All Pending (${pendingDocs.length})`}
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(reviewBusyKey)}
            className="da-btn da-btn-sm da-btn-danger-outline"
            style={{ fontSize: '0.71rem', padding: '4px 9px' }}
            onClick={() => {
              if (isPanelOpen) {
                setBulkRejectUserId(null);
              } else {
                const initial: Record<string, boolean> = {};
                eligibleDocs.forEach((d) => {
                  initial[d.key] = true;
                });
                setBulkSelectedKeys(initial);
                setBulkSharedReason('');
                setBulkDocReasons({});
                setBulkRejectUserId(targetUserId);
                setRejectingDocKey(null);
              }
            }}
          >
            {isPanelOpen
              ? 'Close Multi / Reject All'
              : eligibleDocs.length === 1
                ? 'Reject Document...'
                : `Reject Selected / All (${eligibleDocs.length})`}
          </button>
        </div>

        {isPanelOpen && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #FECACA',
              background: '#FEF2F2',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991B1B' }}>
                Select document(s) to reject &amp; email itemized reasons ({selectedDocs.length}/{eligibleDocs.length})
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="da-btn da-btn-sm da-btn-subtle"
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    eligibleDocs.forEach((d) => {
                      all[d.key] = true;
                    });
                    setBulkSelectedKeys(all);
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="da-btn da-btn-sm da-btn-subtle"
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                  onClick={() => setBulkSelectedKeys({})}
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              type="text"
              className="dg-input"
              placeholder="Shared rejection reason for selected documents (optional if entered per doc)..."
              value={bulkSharedReason}
              onChange={(e) => setBulkSharedReason(e.target.value)}
              style={{ padding: '6px 8px', fontSize: '0.74rem', background: '#FFFFFF' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {eligibleDocs.map((d) => {
                const checked = Boolean(bulkSelectedKeys[d.key]);
                return (
                  <div
                    key={d.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      padding: '6px 8px',
                      borderRadius: 6,
                      background: '#FFFFFF',
                      border: `1px solid ${checked ? '#FCA5A5' : '#E2E8F0'}`,
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.73rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setBulkSelectedKeys((prev) => ({
                            ...prev,
                            [d.key]: e.target.checked,
                          }))
                        }
                      />
                      <span>{d.label}</span>
                    </label>
                    {checked && (
                      <input
                        type="text"
                        className="dg-input"
                        placeholder={`Specific reason for ${d.label} (or leaves shared reason above)`}
                        value={bulkDocReasons[d.key] || ''}
                        onChange={(e) =>
                          setBulkDocReasons((prev) => ({
                            ...prev,
                            [d.key]: e.target.value,
                          }))
                        }
                        style={{ padding: '5px 7px', fontSize: '0.71rem' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                type="button"
                className="da-btn da-btn-sm da-btn-subtle"
                style={{ fontSize: '0.7rem', padding: '4px 9px' }}
                onClick={() => setBulkRejectUserId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(reviewBusyKey) || selectedDocs.length === 0}
                className="da-btn da-btn-sm da-btn-danger"
                style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                onClick={() =>
                  handleBulkReviewDocuments(
                    targetUserId,
                    'reject',
                    selectedDocs.map((d) => ({
                      doc_key: d.key,
                      label: d.label,
                      reason: (bulkDocReasons[d.key] || '').trim() || bulkSharedReason.trim(),
                    }))
                  )
                }
              >
                {isBulkBusy
                  ? 'Rejecting…'
                  : selectedDocs.length === eligibleDocs.length && eligibleDocs.length > 1
                    ? `Reject All (${selectedDocs.length})`
                    : `Confirm Reject (${selectedDocs.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
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
    const status = (doc.verification_status || '').toLowerCase();
    if (!doc.uploaded) {
      if (status === 'rejected') {
        return { label: 'Rejected — Deleted', color: '#B91C1C', bg: '#FEF2F2' };
      }
      return { label: 'Missing', color: '#64748B', bg: '#F1F5F9' };
    }
    if (status === 'rejected') {
      return { label: 'Rejected', color: '#B91C1C', bg: '#FEF2F2' };
    }
    if (
      status === 'expired' ||
      (Boolean((doc.extracted_expiry_date || '').trim()) &&
        typeof doc.days_until_expiry === 'number' &&
        doc.days_until_expiry < 0)
    ) {
      return { label: 'Expired', color: '#B91C1C', bg: '#FEF2F2' };
    }
    if (status === 'expiring_soon' || (typeof doc.days_until_expiry === 'number' && doc.days_until_expiry <= 30 && doc.extracted_expiry_date && doc.verified)) {
      return { label: 'Expiring Soon', color: '#92400E', bg: '#FFFBEB' };
    }
    if (doc.verified || status === 'verified' || status === 'approved') {
      return { label: 'Accepted', color: '#065F46', bg: '#ECFDF5' };
    }
    return { label: 'Pending Review', color: '#92400E', bg: '#FFFBEB' };
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

  const ticketSearchLower = ticketSearch.trim().toLowerCase();
  const currentTabTickets = (ticketsBuckets[ticketTab] || []).filter((t) => {
    if (!ticketSearchLower) return true;
    const customerName = t.profiles
      ? `${t.profiles.first_name} ${t.profiles.last_name}`.toLowerCase()
      : (t.guest_name || '').toLowerCase();
    const customerEmail = (t.profiles?.email || t.guest_email || '').toLowerCase();
    return (
      (t.subject || '').toLowerCase().includes(ticketSearchLower) ||
      customerName.includes(ticketSearchLower) ||
      customerEmail.includes(ticketSearchLower) ||
      (t.id || '').toLowerCase().includes(ticketSearchLower)
    );
  });

  const overviewSearchLower = overviewSearch.trim().toLowerCase();
  const overviewRecentTickets = (overviewData?.recent_tickets || []).filter((t: SupportTicket) => {
    if (!overviewSearchLower) return true;
    const uName = t.profiles
      ? `${t.profiles.first_name} ${t.profiles.last_name}`.toLowerCase()
      : (t.guest_name || '').toLowerCase();
    return (
      (t.subject || '').toLowerCase().includes(overviewSearchLower) ||
      uName.includes(overviewSearchLower)
    );
  });
  const overviewRecentDeliveries = (overviewData?.recent_deliveries || []).filter((d: any) => {
    if (!overviewSearchLower) return true;
    return (
      String(d.tracking_id || d.id || '').toLowerCase().includes(overviewSearchLower) ||
      String(d.pickup_address || '').toLowerCase().includes(overviewSearchLower) ||
      String(d.delivery_address || '').toLowerCase().includes(overviewSearchLower)
    );
  });

  const handleHeaderSearchChange = (val: string) => {
    if (activeSection === 'approvals') {
      setApprovalsQuery(val);
      fetchDocSubmissions(approvalsFilter, val);
      const qs = new URLSearchParams();
      if (approvalsFilter !== 'pending') qs.set('status', approvalsFilter);
      if (val.trim()) qs.set('q', val.trim());
      pushDashboardUrl(`/dashboard/approvals${qs.toString() ? `?${qs.toString()}` : ''}`, true);
    } else if (activeSection === 'deliveries') {
      setDeliverySearch(val);
      if (selectedDeliveryConv) setSelectedDeliveryConv(null);
      fetchAgentDeliveries(1, deliveryStatusFilter, val);
      const qs = new URLSearchParams();
      if (deliveryStatusFilter !== 'all') qs.set('status', deliveryStatusFilter);
      if (val.trim()) qs.set('q', val.trim());
      pushDashboardUrl(`/dashboard/deliveries${qs.toString() ? `?${qs.toString()}` : ''}`, true);
    } else if (activeSection === 'customers') {
      setCustomerSearch(val);
      fetchAgentUsers(val);
      const qs = new URLSearchParams();
      if (accountStatusFilter !== 'all') qs.set('status', accountStatusFilter);
      if (val.trim()) qs.set('q', val.trim());
      pushDashboardUrl(`/dashboard/customers${qs.toString() ? `?${qs.toString()}` : ''}`, true);
    } else if (activeSection === 'riders') {
      setRiderSearch(val);
      fetchAgentUsers(val);
      const qs = new URLSearchParams();
      if (accountStatusFilter !== 'all') qs.set('status', accountStatusFilter);
      if (val.trim()) qs.set('q', val.trim());
      pushDashboardUrl(`/dashboard/riders${qs.toString() ? `?${qs.toString()}` : ''}`, true);
    } else if (activeSection === 'support') {
      setTicketSearch(val);
    } else {
      setOverviewSearch(val);
    }
  };

  const headerSearchMeta: Record<AgentSection, { value: string; placeholder: string }> = {
    overview: {
      value: overviewSearch,
      placeholder: 'Search recent tickets & deliveries...',
    },
    approvals: {
      value: approvalsQuery,
      placeholder: 'Search rider name, email, phone, plate, licence...',
    },
    support: {
      value: ticketSearch,
      placeholder: 'Search ticket subject, customer, email...',
    },
    deliveries: {
      value: deliverySearch,
      placeholder: 'Search tracking ID, address, recipient...',
    },
    customers: {
      value: customerSearch,
      placeholder: 'Search customer name, email, phone...',
    },
    riders: {
      value: riderSearch,
      placeholder: 'Search rider name, email, phone, plate, licence, NIN...',
    },
  };
  const currentHeaderSearch = headerSearchMeta[activeSection];
  const isDelAiActive = replyInput.toLowerCase().includes('@delai');
  const creds: DriverCredentials | null = inspectedUserDetail?.driver_credentials || null;
  const ninPhotoSrc = resolveSupportMediaUrl(
    creds?.nin_record?.photo
      ? creds.nin_record.photo.startsWith('data:') || creds.nin_record.photo.startsWith('http')
        ? creds.nin_record.photo
        : `data:image/jpeg;base64,${creds.nin_record.photo}`
      : inspectedUserDetail?.profile?.avatar_url
  );

  // Build dynamic breadcrumb segments
  const breadcrumbParts: { label: string; href?: string; onClick?: () => void }[] = [];
  if (activeSection === 'overview') {
    breadcrumbParts.push({ label: 'Overview' });
  } else if (activeSection === 'approvals') {
    breadcrumbParts.push({
      label: 'Doc Approvals',
      href: rightOpen ? '/dashboard/approvals' : undefined,
      onClick: rightOpen ? () => navigateSection('approvals') : undefined,
    });
    if (rightOpen && inspectedUserDetail?.profile) {
      breadcrumbParts.push({
        label: `${inspectedUserDetail.profile.first_name} ${inspectedUserDetail.profile.last_name}`.trim(),
      });
    }
  } else if (activeSection === 'support') {
    breadcrumbParts.push({
      label: 'Support',
      href: selectedTicket ? `/dashboard/support?tab=${ticketTab}` : undefined,
      onClick: selectedTicket ? () => navigateSection('support') : undefined,
    });
    if (selectedTicket) breadcrumbParts.push({ label: selectedTicket.subject });
  } else if (activeSection === 'deliveries') {
    breadcrumbParts.push({
      label: selectedDeliveryConv ? 'Deliveries' : `Deliveries (${deliveriesTotal})`,
      href: selectedDeliveryConv ? '/dashboard/deliveries' : undefined,
      onClick: selectedDeliveryConv ? () => navigateSection('deliveries') : undefined,
    });
    if (selectedDeliveryConv?.delivery) {
      breadcrumbParts.push({
        label: selectedDeliveryConv.delivery.tracking_id || selectedDeliveryConv.delivery.id,
      });
    }
  } else if (activeSection === 'customers' || activeSection === 'riders') {
    breadcrumbParts.push({
      label: activeSection === 'riders' ? 'Riders' : 'Customers',
      href: rightOpen ? `/dashboard/${activeSection}` : undefined,
      onClick: rightOpen ? () => navigateSection(activeSection) : undefined,
    });
    if (rightOpen && inspectedUserDetail?.profile) {
      breadcrumbParts.push({
        label: `${inspectedUserDetail.profile.first_name} ${inspectedUserDetail.profile.last_name}`.trim(),
      });
    }
  }

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
                  style={{ height: 22, cursor: 'pointer' }}
                  onClick={() => navigateSection('overview')}
                />
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--dg-primary)',
                    background: '#EFF6FF',
                    padding: '2px 7px',
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Ops
                </span>
              </div>
            ) : (
              <div
                onClick={() => navigateSection('overview')}
                style={{
                  width: 34,
                  height: 34,
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
            {!sidebarCollapsed && <div className="da-nav-label-heading">Workspace</div>}
            {(
              [
                { id: 'overview', label: 'Overview', icon: 'overview' },
                {
                  id: 'approvals',
                  label: 'Doc Approvals',
                  icon: 'approvals',
                  badge: docSubmissionCounts.pending,
                },
                { id: 'support', label: 'Support Queue', icon: 'support', badge: queueBadgeCount },
                { id: 'deliveries', label: 'Deliveries', icon: 'deliveries' },
                { id: 'customers', label: 'Customers', icon: 'user' },
                { id: 'riders', label: 'Riders', icon: 'users' },
              ] as const
            ).map((nav) => {
              const active = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => navigateSection(nav.id)}
                  title={sidebarCollapsed ? nav.label : undefined}
                  className={`da-nav-item ${active ? 'da-nav-item-active' : ''}`}
                  style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                >
                  <DashIcon name={nav.icon} />
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
            <div className="da-agent-chip">
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                {session.user.first_name} {session.user.last_name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
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
            <DashIcon name={sidebarCollapsed ? 'expand' : 'collapse'} />
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
            <DashIcon name="logout" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ==================== 2. WORKSPACE ==================== */}
      <div className="da-workspace">
        <main className="da-main">
          {/* Persistent Top Context Bar */}
          <div className="da-topbar">
            <div className="da-breadcrumb">
              {breadcrumbParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="da-breadcrumb-sep">/</span>}
                  {part.onClick ? (
                    <a
                      href={part.href || '#'}
                      className="da-breadcrumb-link"
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        part.onClick?.();
                      }}
                    >
                      {part.label}
                    </a>
                  ) : (
                    <span className="da-breadcrumb-current">{part.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="da-topbar-search">
              <span className="da-topbar-search-icon" aria-hidden="true">
                <DashIcon name="search" size={15} />
              </span>
              <input
                type="text"
                className="da-topbar-search-input"
                aria-label={currentHeaderSearch.placeholder}
                placeholder={currentHeaderSearch.placeholder}
                value={currentHeaderSearch.value}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
              />
              {currentHeaderSearch.value && (
                <button
                  type="button"
                  className="da-topbar-search-clear"
                  aria-label="Clear search"
                  onClick={() => handleHeaderSearchChange('')}
                >
                  <DashIcon name="close" size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ---------- SECTION 1: OVERVIEW ---------- */}
          {activeSection === 'overview' && (
            <div className="da-scroll-body">
              <div className="da-page-inner">
                {loadingOverview && !overviewData ? (
                  <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                    Connecting to live operations telemetry…
                  </div>
                ) : (
                  <>
                    <div className="da-stats-grid">
                      {[
                        {
                          label: 'Ticket Queue',
                          hint: 'Awaiting agent claim',
                          value: overviewData?.stats?.queue_count ?? overviewData?.queue_count ?? 0,
                          icon: 'clock' as const,
                          action: () => {
                            setTicketTab('queue');
                            setActiveSection('support');
                            pushDashboardUrl('/dashboard/support?tab=queue');
                          },
                        },
                        {
                          label: 'My Tickets',
                          hint: 'Assigned to you',
                          value:
                            overviewData?.stats?.my_tickets_count ??
                            overviewData?.my_tickets_count ??
                            0,
                          icon: 'support' as const,
                          action: () => {
                            setTicketTab('my_tickets');
                            setActiveSection('support');
                            pushDashboardUrl('/dashboard/support?tab=my_tickets');
                          },
                        },
                        {
                          label: 'Resolved',
                          hint: 'Completed support',
                          value:
                            overviewData?.stats?.resolved_count ?? overviewData?.resolved_count ?? 0,
                          icon: 'check' as const,
                          action: () => {
                            setTicketTab('resolved');
                            setActiveSection('support');
                            pushDashboardUrl('/dashboard/support?tab=resolved');
                          },
                        },
                        {
                          label: 'Active Deliveries',
                          hint: 'In-progress dispatches',
                          value:
                            overviewData?.stats?.active_deliveries ??
                            overviewData?.active_deliveries ??
                            0,
                          icon: 'deliveries' as const,
                          action: () => {
                            setDeliveryStatusFilter('in_transit');
                            setActiveSection('deliveries');
                            pushDashboardUrl('/dashboard/deliveries?status=in_transit');
                          },
                        },
                        {
                          label: 'Total Deliveries',
                          hint: 'All-time shipments',
                          value:
                            overviewData?.stats?.total_deliveries ??
                            overviewData?.total_deliveries ??
                            0,
                          icon: 'overview' as const,
                          action: () => navigateSection('deliveries'),
                        },
                        {
                          label: 'Pending Doc Reviews',
                          hint: 'Riders awaiting approval',
                          value:
                            overviewData?.stats?.pending_doc_reviews ??
                            overviewData?.pending_doc_reviews ??
                            docSubmissionCounts.pending,
                          icon: 'approvals' as const,
                          action: () => navigateSection('approvals'),
                        },
                        {
                          label: 'Customers',
                          hint: 'Registered consumer accounts',
                          value:
                            overviewData?.stats?.total_customers ??
                            overviewData?.total_customers ??
                            overviewData?.stats?.total_users ??
                            overviewData?.total_users ??
                            0,
                          icon: 'user' as const,
                          action: () => navigateSection('customers'),
                        },
                        {
                          label: 'Riders',
                          hint: 'Registered courier riders',
                          value: overviewData?.stats?.total_riders ?? overviewData?.total_riders ?? 0,
                          icon: 'users' as const,
                          action: () => navigateSection('riders'),
                        },
                      ].map((card) => (
                        <div key={card.label} className="da-stat-card" onClick={card.action}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: '#EFF6FF',
                                color: 'var(--dg-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <DashIcon name={card.icon} size={16} />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--dg-text-muted)' }}>
                              &rsaquo;
                            </span>
                          </div>
                          <div className="da-stat-value">{card.value}</div>
                          <div className="da-stat-label">{card.label}</div>
                          <div className="da-stat-hint">{card.hint}</div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                        gap: 20,
                      }}
                    >
                      {/* Recent Tickets Card */}
                      <div className="da-card">
                        <div className="da-card-header">
                          <h2 className="da-card-title">Recent support tickets</h2>
                          <button
                            type="button"
                            className="da-btn da-btn-sm da-btn-outline"
                            onClick={() => navigateSection('support')}
                          >
                            Open queue
                          </button>
                        </div>

                        {overviewRecentTickets.length === 0 ? (
                          <div style={{ padding: 32, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            {overviewSearchLower ? 'No matching support tickets' : 'No support tickets recorded yet'}
                          </div>
                        ) : (
                          overviewRecentTickets.map((t: SupportTicket) => {
                            const st = STATUS_BADGES[t.status] || STATUS_BADGES.ai_handling;
                            const uName = t.profiles
                              ? `${t.profiles.first_name} ${t.profiles.last_name}`.trim()
                              : t.guest_name || 'Customer';
                            return (
                              <div
                                key={t.id}
                                className="da-list-row"
                                onClick={() => openTicketWithRoute(t)}
                              >
                                <div className="da-avatar">
                                  {uName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: '0.88rem',
                                      fontWeight: 600,
                                      color: '#0F172A',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {t.subject}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
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

                      {/* Recent Deliveries Card */}
                      <div className="da-card">
                        <div className="da-card-header">
                          <h2 className="da-card-title">Recent deliveries</h2>
                          <button
                            type="button"
                            className="da-btn da-btn-sm da-btn-outline"
                            onClick={() => navigateSection('deliveries')}
                          >
                            All deliveries
                          </button>
                        </div>

                        {overviewRecentDeliveries.length === 0 ? (
                          <div style={{ padding: 32, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            {overviewSearchLower ? 'No matching deliveries' : 'No deliveries recorded yet'}
                          </div>
                        ) : (
                          overviewRecentDeliveries.map((d: any) => {
                            const st =
                              DELIVERY_STATUS_STYLE[d.status] || DELIVERY_STATUS_STYLE.pending;
                            return (
                              <div
                                key={d.id}
                                className="da-list-row"
                                onClick={() => openDeliveryWithRoute(d.id)}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="da-kv-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--dg-primary)' }}>
                                      {d.tracking_id || `#${String(d.id).slice(0, 8)}`}
                                    </span>
                                    <span
                                      className="ds-status-pill"
                                      style={{ background: st.bg, color: st.color }}
                                    >
                                      {st.label}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--dg-text-secondary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      marginTop: 3,
                                    }}
                                  >
                                    {d.pickup_address} &rarr; {d.delivery_address}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div className="da-kv-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                                    ₦{Number(d.total_cost || 0).toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--dg-text-muted)' }}>
                                    {formatTimeAgo(d.created_at)}
                                  </div>
                                </div>
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
              {/* Left Queue Pane */}
              <div
                style={{
                  width: 350,
                  borderRight: '1px solid var(--dg-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--dg-border)' }}>
                  <div className="da-seg-tabs" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                    {(
                      [
                        { key: 'queue', label: `Queue (${ticketsBuckets.queue.length})` },
                        { key: 'my_tickets', label: `Mine (${ticketsBuckets.my_tickets.length})` },
                        { key: 'resolved', label: `Done (${ticketsBuckets.resolved.length})` },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`da-seg-tab ${ticketTab === t.key ? 'da-seg-tab-active' : ''}`}
                        onClick={() => {
                          setTicketTab(t.key);
                          if (!selectedTicket) {
                            pushDashboardUrl(`/dashboard/support?tab=${t.key}`);
                          }
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingTickets ? (
                    <div style={{ padding: 36, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                      Loading support queue…
                    </div>
                  ) : currentTabTickets.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                      No conversations in this queue
                    </div>
                  ) : (
                    currentTabTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;
                      const st = STATUS_BADGES[t.status] || STATUS_BADGES.ai_handling;
                      const pr = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
                      const userName = t.profiles
                        ? `${t.profiles.first_name} ${t.profiles.last_name}`.trim()
                        : t.guest_name || 'Customer';
                      const isDriver =
                        t.profiles?.user_type === 'rider' || t.profiles?.user_type === 'driver';

                      return (
                        <div
                          key={t.id}
                          onClick={() => openTicketWithRoute(t)}
                          className={`da-list-row ${isSelected ? 'da-list-row-active' : ''}`}
                          style={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: 8,
                            borderLeft: isSelected
                              ? '3px solid var(--dg-primary)'
                              : '3px solid transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <div className={`da-avatar ${isDriver ? 'da-avatar-driver' : ''}`} style={{ width: 28, height: 28, fontSize: '0.72rem' }}>
                                {userName.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                                {userName}
                              </span>
                              <span
                                className="ds-status-pill"
                                style={{
                                  background: isDriver ? '#FFFBEB' : '#EFF6FF',
                                  color: isDriver ? '#92400E' : '#204B7A',
                                  fontSize: '0.66rem',
                                }}
                              >
                                {isDriver ? 'Rider' : 'Customer'}
                              </span>
                            </div>
                            <span
                              className="ds-status-pill"
                              style={{ background: pr.bg, color: pr.color }}
                            >
                              {pr.label}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dg-primary)' }}>
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
                                className="da-btn da-btn-sm da-btn-primary"
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

              {/* Ticket Conversation Main Pane */}
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
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                          {selectedTicket.subject}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                          {selectedTicket.profiles
                            ? `${selectedTicket.profiles.first_name} ${selectedTicket.profiles.last_name} • ${selectedTicket.profiles.email}`
                            : `${selectedTicket.guest_name || 'Guest'} • ${selectedTicket.guest_email || ''}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={`da-btn da-btn-sm ${
                            rightOpen ? 'da-btn-primary' : 'da-btn-outline'
                          }`}
                          onClick={() => {
                            if (rightOpen) {
                              setRightOpen(false);
                              pushDashboardUrl(`/dashboard/support/${selectedTicket.id}`);
                            } else {
                              handleInspectTicketAuthor();
                            }
                          }}
                        >
                          <DashIcon name="user" size={14} />
                          <span>{rightOpen ? 'Hide inspector' : 'Inspect user'}</span>
                        </button>

                        <select
                          className="dg-select"
                          style={{
                            width: 'auto',
                            height: 28,
                            padding: '0 28px 0 10px',
                            fontSize: '0.76rem',
                            borderRadius: 6,
                          }}
                          value={selectedTicket.priority}
                          onChange={(e) =>
                            handleUpdateTicketPriority(e.target.value as 'low' | 'medium' | 'high')
                          }
                        >
                          <option value="low">Low priority</option>
                          <option value="medium">Medium priority</option>
                          <option value="high">High priority</option>
                        </select>

                        {!selectedTicket.assigned_agent_id &&
                          selectedTicket.status !== 'resolved' && (
                            <button
                              type="button"
                              className="da-btn da-btn-sm da-btn-primary"
                              onClick={() => handleClaimTicket(selectedTicket.id)}
                            >
                              Claim ticket
                            </button>
                          )}

                        {selectedTicket.status !== 'resolved' && (
                          <button
                            type="button"
                            className="da-btn da-btn-sm da-btn-success"
                            onClick={handleResolveAgentTicket}
                          >
                            <DashIcon name="check" size={13} />
                            <span>Resolve</span>
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
                        <div style={{ textAlign: 'center', padding: 48, color: 'var(--dg-text-secondary)' }}>
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
                                  background: '#FFFFFF',
                                  border: '1px solid var(--dg-border)',
                                  borderRadius: 999,
                                  fontSize: '0.75rem',
                                  color: 'var(--dg-text-secondary)',
                                  padding: '5px 14px',
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
                                <div
                                  style={{
                                    display: 'inline-block',
                                    background: '#FEF3C7',
                                    color: '#92400E',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    marginBottom: 4,
                                  }}
                                >
                                  Private Co-Pilot Note (Agent Only)
                                </div>
                              )}

                              <div
                                style={{
                                  padding: '11px 14px',
                                  borderRadius: 12,
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
                                  boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
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
                                    ? 'Support Agent'
                                    : isAI
                                    ? isPrivate
                                      ? 'Deliva AI Co-Pilot'
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
                                    marginTop: 7,
                                    gap: 12,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      color:
                                        isAgent && !isPrivate
                                          ? 'rgba(255,255,255,0.75)'
                                          : 'var(--dg-text-muted)',
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
                                      className="da-btn da-btn-sm da-btn-success"
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
                            @delai Co-Pilot active — response stays private until you push it to the customer
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className={`da-btn ${isDelAiActive ? 'da-btn-primary' : 'da-btn-subtle'}`}
                            onClick={() => {
                              if (!isDelAiActive) {
                                setReplyInput((prev) => `@delai ${prev}`);
                              } else {
                                setReplyInput((prev) => prev.replace(/^@delai\s*/i, ''));
                              }
                            }}
                          >
                            @delai
                          </button>

                          <input
                            type="text"
                            className="dg-input"
                            placeholder="Reply to customer (use @delai for private AI Co-Pilot)..."
                            value={replyInput}
                            onChange={(e) => setReplyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendAgentReply();
                              }
                            }}
                            style={{ padding: '9px 14px', height: 38 }}
                          />

                          <button
                            type="button"
                            disabled={!replyInput.trim() || sendingReply}
                            onClick={handleSendAgentReply}
                            className="da-btn da-btn-primary"
                            style={{ height: 38, padding: '0 18px' }}
                          >
                            {sendingReply ? 'Sending…' : 'Send'}
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
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dg-text-muted)',
                      padding: 24,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>
                      Select a support conversation
                    </div>
                    <div style={{ fontSize: '0.86rem' }}>
                      Choose a ticket from the queue to reply, claim, or inspect the customer/rider profile.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- SECTION 3: DELIVERIES ---------- */}
          {activeSection === 'deliveries' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selectedDeliveryConv ? (
                <div style={{ flex: 1, background: 'var(--dg-bg-alt)', padding: 24, overflowY: 'auto' }}>
                  <div style={{ maxWidth: 780, margin: '0 auto' }}>
                    <div className="da-card">
                      <div className="da-card-header">
                        <span className="da-card-title">
                          {selectedDeliveryConv.delivery?.tracking_id
                            ? `${selectedDeliveryConv.delivery.tracking_id} — `
                            : ''}
                          Customer – Rider Live Chat ({(selectedDeliveryConv.messages || []).length})
                        </span>
                        {!rightOpen && (
                          <button
                            type="button"
                            className="dg-inline-link"
                            style={{ fontSize: '0.78rem', textDecoration: 'none' }}
                            onClick={() => {
                              setRightMode('delivery');
                              setRightOpen(true);
                            }}
                          >
                            Show inspector
                          </button>
                        )}
                      </div>
                      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(selectedDeliveryConv.messages || []).length === 0 ? (
                          <div style={{ padding: 32, textAlign: 'center', color: 'var(--dg-text-muted)', fontSize: '0.88rem' }}>
                            No messages exchanged for this delivery yet
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
                                  alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                                  maxWidth: '75%',
                                  padding: '10px 14px',
                                  borderRadius: 12,
                                  background: isCustomer ? 'var(--dg-bg-alt)' : 'var(--dg-primary)',
                                  color: isCustomer ? '#0F172A' : '#FFFFFF',
                                  border: isCustomer ? '1px solid var(--dg-border)' : 'none',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: isCustomer ? 'var(--dg-primary)' : 'rgba(255,255,255,0.85)',
                                    marginBottom: 4,
                                  }}
                                >
                                  {isCustomer ? 'Customer' : 'Rider'}
                                </div>
                                <div style={{ fontSize: '0.88rem', lineHeight: 1.45 }}>{msg.content}</div>
                              </div>
                            );
                          })
                        )}
                        <div ref={delivChatEndRef} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="da-scroll-body">
                  <div className="da-page-inner">
                    <div style={{ marginBottom: 16 }}>
                      <div className="da-seg-tabs">
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
                            className={`da-seg-tab ${deliveryStatusFilter === f.key ? 'da-seg-tab-active' : ''}`}
                            onClick={() => {
                              setDeliveryStatusFilter(f.key);
                              fetchAgentDeliveries(1, f.key, deliverySearch);
                              const qs = new URLSearchParams();
                              if (f.key !== 'all') qs.set('status', f.key);
                              if (deliverySearch.trim()) qs.set('q', deliverySearch.trim());
                              pushDashboardUrl(`/dashboard/deliveries${qs.toString() ? `?${qs.toString()}` : ''}`);
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {loadingDeliveries || loadingDeliveryConv ? (
                      <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                        Loading deliveries…
                      </div>
                    ) : deliveries.length === 0 ? (
                      <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-muted)' }}>
                        No deliveries match your filter
                      </div>
                    ) : (
                      <div className="da-delivery-list">
                        {deliveries.map((d) => {
                          const st =
                            DELIVERY_STATUS_STYLE[d.status] || DELIVERY_STATUS_STYLE.pending;
                          return (
                            <div
                              key={d.id}
                              className="da-delivery-card"
                              onClick={() => openDeliveryWithRoute(d.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span className="da-kv-mono" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dg-primary)' }}>
                                  {d.tracking_id || `#${String(d.id).slice(0, 8)}`}
                                </span>
                                <span
                                  className="ds-status-pill"
                                  style={{ background: st.bg, color: st.color }}
                                >
                                  {st.label}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>
                                  <span style={{ color: 'var(--dg-text-muted)', fontWeight: 600 }}>Pickup:</span>{' '}
                                  {d.pickup_address}
                                </div>
                                <div>
                                  <span style={{ color: 'var(--dg-text-muted)', fontWeight: 600 }}>Drop-off:</span>{' '}
                                  {d.delivery_address}
                                </div>
                              </div>

                              <div style={{ fontSize: '0.75rem', color: 'var(--dg-text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div>
                                  Customer:{' '}
                                  <strong>
                                    {d.profiles
                                      ? `${d.profiles.first_name} ${d.profiles.last_name}`
                                      : 'N/A'}
                                  </strong>
                                </div>
                                <div>
                                  Driver:{' '}
                                  <strong>
                                    {d.driver_profile
                                      ? `${d.driver_profile.first_name} ${d.driver_profile.last_name}${
                                          d.driver_profile.vehicle_plate
                                            ? ` (${d.driver_profile.vehicle_plate})`
                                            : ''
                                        }`
                                      : 'Unassigned'}
                                  </strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  paddingTop: 10,
                                  marginTop: 'auto',
                                  borderTop: '1px solid #F1F5F9',
                                }}
                              >
                                <div>
                                  <div className="da-kv-mono" style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>
                                    ₦{Number(d.total_cost || 0).toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.71rem', color: 'var(--dg-text-muted)' }}>
                                    {formatTimeAgo(d.created_at)}
                                  </div>
                                </div>
                                <span className="da-btn da-btn-sm da-btn-outline">Inspect</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {deliveriesTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 18 }}>
                        <button
                          type="button"
                          className="da-btn da-btn-sm da-btn-outline"
                          disabled={deliveriesPage <= 1}
                          onClick={() => {
                            const nextP = deliveriesPage - 1;
                            fetchAgentDeliveries(nextP, deliveryStatusFilter, deliverySearch);
                            pushDashboardUrl(`/dashboard/deliveries?status=${deliveryStatusFilter}&page=${nextP}`);
                          }}
                        >
                          Previous
                        </button>
                        <span className="da-kv-mono" style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)' }}>
                          Page {deliveriesPage} / {deliveriesTotalPages}
                        </span>
                        <button
                          type="button"
                          className="da-btn da-btn-sm da-btn-outline"
                          disabled={deliveriesPage >= deliveriesTotalPages}
                          onClick={() => {
                            const nextP = deliveriesPage + 1;
                            fetchAgentDeliveries(nextP, deliveryStatusFilter, deliverySearch);
                            pushDashboardUrl(`/dashboard/deliveries?status=${deliveryStatusFilter}&page=${nextP}`);
                          }}
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

          {/* ---------- SECTION 4 & 5: SEPARATED CUSTOMERS & RIDERS TABS ---------- */}
          {(activeSection === 'customers' || activeSection === 'riders') && (() => {
            const isRidersTab = activeSection === 'riders';
            const sectionAccounts = usersList.filter((u) => {
              const isR = u.user_type === 'rider' || u.user_type === 'driver';
              return isRidersTab ? isR : !isR;
            });
            const matchesStatus = (u: any) => {
              const susp = Boolean(u.is_suspended || u.status === 'suspended');
              if (accountStatusFilter === 'suspended') return susp;
              if (accountStatusFilter === 'active') {
                return !susp && (!isRidersTab || Boolean(u.is_activated));
              }
              if (accountStatusFilter === 'pending' && isRidersTab) {
                return !susp && !u.is_activated;
              }
              return true;
            };
            const filteredAccounts = sectionAccounts.filter(matchesStatus);
            const activeDirSearch = isRidersTab ? riderSearch : customerSearch;
            const filterOptions: { key: AccountStatusFilter; label: string }[] = isRidersTab
              ? [
                  { key: 'all', label: `All (${sectionAccounts.length})` },
                  {
                    key: 'active',
                    label: `Active (${sectionAccounts.filter((u) => !u.is_suspended && u.status !== 'suspended' && u.is_activated).length})`,
                  },
                  {
                    key: 'pending',
                    label: `Pending Activation (${sectionAccounts.filter((u) => !u.is_suspended && u.status !== 'suspended' && !u.is_activated).length})`,
                  },
                  {
                    key: 'suspended',
                    label: `Suspended (${sectionAccounts.filter((u) => u.is_suspended || u.status === 'suspended').length})`,
                  },
                ]
              : [
                  { key: 'all', label: `All (${sectionAccounts.length})` },
                  {
                    key: 'active',
                    label: `Active (${sectionAccounts.filter((u) => !u.is_suspended && u.status !== 'suspended').length})`,
                  },
                  {
                    key: 'suspended',
                    label: `Suspended (${sectionAccounts.filter((u) => u.is_suspended || u.status === 'suspended').length})`,
                  },
                ];

            return (
              <div className="da-scroll-body">
                <div className="da-page-inner">
                  <div style={{ marginBottom: 16 }}>
                    <div className="da-seg-tabs">
                      {filterOptions.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          className={`da-seg-tab ${accountStatusFilter === f.key ? 'da-seg-tab-active' : ''}`}
                          onClick={() => {
                            setAccountStatusFilter(f.key);
                            const qs = new URLSearchParams();
                            if (f.key !== 'all') qs.set('status', f.key);
                            if (activeDirSearch.trim()) qs.set('q', activeDirSearch.trim());
                            pushDashboardUrl(`/dashboard/${activeSection}${qs.toString() ? `?${qs.toString()}` : ''}`);
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingUsers ? (
                    <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                      Loading {isRidersTab ? 'riders' : 'customers'}…
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-muted)' }}>
                      No matching {isRidersTab ? 'riders' : 'customers'} found
                    </div>
                  ) : (
                    <div className="da-user-grid">
                      {filteredAccounts.map((u) => {
                        const isRider = u.user_type === 'rider' || u.user_type === 'driver';
                        const isSelected =
                          rightOpen && rightMode === 'user' && inspectedUserId === u.id;
                        const avatarSrc = resolveSupportMediaUrl(u.avatar_url);
                        const isSuspended = Boolean(u.is_suspended || u.status === 'suspended');
                        const riderToneClass = isRider
                          ? isSuspended
                            ? 'da-rider-card-suspended'
                            : u.is_activated
                              ? 'da-rider-card-active-verified'
                              : 'da-rider-card-pending'
                          : '';
                        const vehicleDesc = [
                          u.vehicle_type
                            ? String(u.vehicle_type).charAt(0).toUpperCase() +
                              String(u.vehicle_type).slice(1)
                            : '',
                          [u.vehicle_make, u.vehicle_model].filter(Boolean).join(' '),
                          u.vehicle_year ? `(${u.vehicle_year})` : '',
                        ]
                          .filter(Boolean)
                          .join(' • ');
                        const totalOrders =
                          typeof u.total_orders === 'number'
                            ? u.total_orders
                            : u.total_deliveries_completed || 0;
                        const completedOrders = u.total_deliveries_completed || 0;
                        const activeOrders = u.active_orders || 0;
                        const riderRating = Number(u.rating || 0);
                        const riderRatingCount = Number(u.rating_count || 0);

                        return (
                          <div
                            key={u.id}
                            onClick={() =>
                              openUserWithRoute(u.id, isRider ? 'credentials' : 'profile', true)
                            }
                            className={`da-user-card ${riderToneClass} ${
                              isSelected ? 'da-user-card-active' : ''
                            }`}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                  <div className={`da-avatar ${isRider ? 'da-avatar-driver' : ''}`}>
                                    {avatarSrc ? (
                                      <img
                                        src={avatarSrc}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      (u.first_name || 'U').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.94rem', wordBreak: 'break-word' }}>
                                      {u.first_name} {u.last_name}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--dg-text-muted)', wordBreak: 'break-all' }}>
                                      {u.email}
                                    </div>
                                  </div>
                                </div>

                                {!isRider && (
                                  <span
                                    className="ds-status-pill"
                                    style={{
                                      background: '#EFF6FF',
                                      color: '#204B7A',
                                      flexShrink: 0,
                                    }}
                                  >
                                    Customer
                                  </span>
                                )}
                              </div>

                              {((!isRider && isSuspended) ||
                                (isRider && !isSuspended && u.is_online) ||
                                (isRider && u.expiry_locked) ||
                                (u.tags || []).length > 0) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                                  {!isRider && isSuspended && (
                                    <span className="ds-status-pill" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                                      Suspended
                                    </span>
                                  )}
                                  {isRider && !isSuspended && u.is_online && (
                                    <span className="ds-status-pill" style={{ background: '#DCFCE7', color: '#065F46' }}>
                                      Online
                                    </span>
                                  )}
                                  {isRider && u.expiry_locked && (
                                    <span className="ds-status-pill" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                                      Docs Expired
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
                              )}

                              <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 10, lineHeight: 1.55 }}>
                                <div>{u.phone || 'No phone number'}</div>
                                {isRider && (
                                  <>
                                    {vehicleDesc && (
                                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{vehicleDesc}</div>
                                    )}
                                    <div>
                                      {u.vehicle_plate ? `Plate: ${u.vehicle_plate}` : 'No plate on file'}
                                      {u.license_number ? ` • Licence: ${u.license_number}` : ''}
                                      {u.license_expiry ? ` (Exp ${u.license_expiry})` : ''}
                                    </div>
                                    {(() => {
                                      const rawComplianceDocs: DriverCredentialDoc[] = Array.isArray(u.compliance_docs)
                                        ? u.compliance_docs
                                        : [];
                                      const docByKey = new Map<string, DriverCredentialDoc>(
                                        rawComplianceDocs.map((d) => [d.key, d])
                                      );
                                      const requiredCount = Number(
                                        u.required_docs_count || COMPLIANCE_DOC_SLOTS.length
                                      );
                                      const uploadedCount = Number(u.uploaded_docs_count || 0);
                                      const approvedCount = Number(u.approved_docs_count || 0);
                                      const pendingCount = Number(u.pending_docs_count || 0);
                                      const rejectedCount = Number(u.rejected_docs_count || 0);
                                      const expiredCount = Number(u.expired_doc_count || 0);
                                      const hasPerDocDetails = rawComplianceDocs.length > 0;

                                      return (
                                        <div style={{ marginTop: 4 }}>
                                          <div style={{ color: 'var(--dg-primary)', fontWeight: 600 }}>
                                            Compliance docs: {uploadedCount}/{requiredCount} uploaded
                                            {hasPerDocDetails && approvedCount > 0 && (
                                              <span style={{ color: '#065F46' }}> • {approvedCount} approved</span>
                                            )}
                                            {hasPerDocDetails && pendingCount > 0 && (
                                              <span style={{ color: '#92400E' }}> • {pendingCount} pending</span>
                                            )}
                                            {hasPerDocDetails && rejectedCount > 0 && (
                                              <span style={{ color: '#B91C1C' }}> • {rejectedCount} rejected</span>
                                            )}
                                            {expiredCount > 0 && (
                                              <span style={{ color: '#B91C1C' }}> • {expiredCount} expired</span>
                                            )}
                                            {u.reward_tier ? ` • ${u.reward_tier}` : ''}
                                            {Number(u.driver_score || 0) > 0
                                              ? ` (${Math.round(Number(u.driver_score))}% score)`
                                              : ''}
                                          </div>

                                          {hasPerDocDetails && (
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 4,
                                                marginTop: 6,
                                              }}
                                            >
                                              {COMPLIANCE_DOC_SLOTS.map((slot) => {
                                                const doc = docByKey.get(slot.key) || {
                                                  key: slot.key,
                                                  label: slot.label,
                                                  uploaded: false,
                                                };
                                                const badge = getDocStatusBadge(doc);
                                                const st = (doc.verification_status || '').toLowerCase();
                                                const icon =
                                                  doc.verified || st === 'verified' || st === 'approved'
                                                    ? '✓'
                                                    : st === 'rejected' || st === 'expired'
                                                      ? '✕'
                                                      : doc.uploaded
                                                        ? '•'
                                                        : '—';
                                                const chipTitle = [
                                                  `${slot.label}: ${badge.label}`,
                                                  doc.extracted_expiry_date
                                                    ? `Exp: ${doc.extracted_expiry_date}`
                                                    : '',
                                                  doc.rejection_reason
                                                    ? `Reason: ${doc.rejection_reason}`
                                                    : '',
                                                ]
                                                  .filter(Boolean)
                                                  .join(' • ');

                                                return (
                                                  <span
                                                    key={slot.key}
                                                    title={chipTitle}
                                                    style={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 3,
                                                      fontSize: '0.67rem',
                                                      fontWeight: 600,
                                                      padding: '2px 7px',
                                                      borderRadius: 999,
                                                      background:
                                                        doc.uploaded || st === 'rejected'
                                                          ? badge.bg
                                                          : 'rgba(255, 255, 255, 0.72)',
                                                      color: badge.color,
                                                      border:
                                                        doc.uploaded || st === 'rejected'
                                                          ? `1px solid ${badge.color}33`
                                                          : '1px dashed #CBD5E1',
                                                    }}
                                                  >
                                                    <span>{icon}</span>
                                                    <span>{slot.shortLabel}</span>
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}

                                          {u.ai_comparison && u.ai_comparison.status === 'mismatch' && (
                                            <div style={{ color: '#B91C1C', fontSize: '0.72rem', fontWeight: 600, marginTop: 5 }}>
                                              AI Cross-Check Mismatch: {u.ai_comparison.summary || 'Requires correction'}
                                            </div>
                                          )}
                                          {u.ai_comparison && u.ai_comparison.passed && (
                                            <div style={{ color: '#065F46', fontSize: '0.72rem', fontWeight: 600, marginTop: 5 }}>
                                              AI Cross-Check Passed
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    {(Number(u.acceptance_rate || 0) > 0 ||
                                      Number(u.completion_rate || 0) > 0 ||
                                      Number(u.total_earnings || 0) > 0) && (
                                      <div style={{ fontSize: '0.73rem', color: 'var(--dg-text-muted)', marginTop: 2 }}>
                                        {[
                                          Number(u.completion_rate || 0) > 0
                                            ? `${Math.round(Number(u.completion_rate))}% completion`
                                            : '',
                                          Number(u.acceptance_rate || 0) > 0
                                            ? `${Math.round(Number(u.acceptance_rate))}% acceptance`
                                            : '',
                                          Number(u.total_earnings || 0) > 0
                                            ? `Earned ₦${Number(u.total_earnings).toLocaleString()}`
                                            : '',
                                        ]
                                          .filter(Boolean)
                                          .join(' • ')}
                                      </div>
                                    )}
                                  </>
                                )}
                                {isSuspended && u.suspension_reason && (
                                  <div style={{ color: '#B91C1C', fontSize: '0.74rem', marginTop: 4 }}>
                                    Suspension reason: {u.suspension_reason}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                paddingTop: 10,
                                marginTop: 'auto',
                                borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                              }}
                            >
                              <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)' }}>
                                <span className="da-kv-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
                                  {totalOrders}
                                </span>{' '}
                                {totalOrders === 1 ? 'order' : 'orders'}
                                {isRider && (
                                  <span style={{ color: 'var(--dg-text-muted)' }}>
                                    {' '}
                                    ({completedOrders} completed
                                    {activeOrders > 0 ? `, ${activeOrders} active` : ''})
                                  </span>
                                )}
                              </div>
                              {isRider ? (
                                <div className="da-kv-mono" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0F172A' }}>
                                  {riderRatingCount > 0 || riderRating > 0
                                    ? `★ ${riderRating.toFixed(1)} (${riderRatingCount})`
                                    : 'No ratings'}
                                </div>
                              ) : (
                                <div className="da-kv-mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                                  ₦{Number(u.wallet_balance || 0).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ---------- SECTION 5: RIDER DOCUMENTATION APPROVALS ---------- */}
          {activeSection === 'approvals' && (
            <div className="da-scroll-body">
              <div className="da-page-inner">
                <div style={{ marginBottom: 16 }}>
                  <div className="da-seg-tabs">
                    {(
                      [
                        { key: 'pending', label: `Pending Review (${docSubmissionCounts.pending})` },
                        { key: 'approved', label: `Approved (${docSubmissionCounts.approved})` },
                        { key: 'rejected', label: `Rejected (${docSubmissionCounts.rejected})` },
                        { key: 'all', label: `All Submissions (${docSubmissionCounts.all})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`da-seg-tab ${approvalsFilter === f.key ? 'da-seg-tab-active' : ''}`}
                        onClick={() => {
                          setApprovalsFilter(f.key);
                          fetchDocSubmissions(f.key, approvalsQuery);
                          const qs = new URLSearchParams();
                          if (f.key !== 'pending') qs.set('status', f.key);
                          if (approvalsQuery.trim()) qs.set('q', approvalsQuery.trim());
                          pushDashboardUrl(
                            `/dashboard/approvals${qs.toString() ? `?${qs.toString()}` : ''}`
                          );
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {approvalsFeedback && (
                  <div
                    className={`dp-alert ${
                      approvalsFeedback.type === 'success' ? 'dp-alert-success' : 'dp-alert-error'
                    }`}
                    style={{ marginBottom: 14 }}
                  >
                    {approvalsFeedback.text}
                  </div>
                )}

                {loadingApprovals ? (
                  <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-secondary)' }}>
                    Loading submitted rider documentation…
                  </div>
                ) : docSubmissions.length === 0 ? (
                  <div className="da-card" style={{ padding: 48, textAlign: 'center', color: 'var(--dg-text-muted)' }}>
                    {approvalsFilter === 'pending'
                      ? 'No rider document submissions waiting for approval right now'
                      : 'No matching rider document submissions found'}
                  </div>
                ) : (
                  <div className="da-user-grid">
                    {docSubmissions.map((sub) => {
                      const uploadedDocs = (sub.documents || []).filter(
                        (d) =>
                          (d.uploaded ||
                            (d.verification_status || '').toLowerCase() === 'rejected') &&
                          d.key !== 'id_document'
                      );
                      const avatarSrc = resolveSupportMediaUrl(sub.avatar_url);
                      const isSelected =
                        rightOpen && rightMode === 'user' && inspectedUserId === sub.user_id;

                      const subPill =
                        sub.submission_status === 'approved' && sub.is_activated
                          ? { label: 'Accepted & Active', color: '#065F46', bg: '#ECFDF5' }
                          : sub.submission_status === 'approved' &&
                              sub.ai_comparison &&
                              !sub.ai_comparison.passed
                            ? { label: 'AI Mismatch — Blocked', color: '#B91C1C', bg: '#FEF2F2' }
                            : sub.submission_status === 'approved'
                              ? { label: 'Docs Accepted', color: '#065F46', bg: '#ECFDF5' }
                              : sub.submission_status === 'rejected'
                                ? { label: 'Action Needed', color: '#B91C1C', bg: '#FEF2F2' }
                                : {
                                    label: `${sub.pending_count} Pending Review`,
                                    color: '#92400E',
                                    bg: '#FFFBEB',
                                  };

                      const approvalToneClass = sub.is_suspended
                        ? 'da-rider-card-suspended'
                        : sub.is_activated
                          ? 'da-rider-card-active-verified'
                          : 'da-rider-card-pending';
                      const subVehDesc = [
                        sub.vehicle_type
                          ? String(sub.vehicle_type).charAt(0).toUpperCase() +
                            String(sub.vehicle_type).slice(1)
                          : '',
                        [sub.vehicle_make, sub.vehicle_model].filter(Boolean).join(' '),
                        sub.vehicle_year ? `(${sub.vehicle_year})` : '',
                      ]
                        .filter(Boolean)
                        .join(' • ');

                      return (
                        <div
                          key={sub.user_id}
                          className={`da-user-card ${approvalToneClass} ${
                            isSelected ? 'da-user-card-active' : ''
                          }`}
                          style={{ cursor: 'default' }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 10,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <div className="da-avatar da-avatar-driver">
                                  {avatarSrc ? (
                                    <img
                                      src={avatarSrc}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    (sub.first_name || sub.full_name || 'R').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      color: '#0F172A',
                                      fontSize: '0.94rem',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {sub.full_name || `${sub.first_name} ${sub.last_name}`.trim()}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.74rem',
                                      color: 'var(--dg-text-muted)',
                                      wordBreak: 'break-all',
                                    }}
                                  >
                                    {sub.email}
                                  </div>
                                </div>
                              </div>

                              <span
                                className="ds-status-pill"
                                style={{ background: subPill.bg, color: subPill.color, flexShrink: 0 }}
                              >
                                {subPill.label}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--dg-text-secondary)',
                                marginTop: 10,
                                lineHeight: 1.5,
                              }}
                            >
                              <div>
                                {subVehDesc || (sub.vehicle_type || 'bike').toUpperCase()}
                                {sub.vehicle_plate ? ` • Plate: ${sub.vehicle_plate}` : ''}
                                {sub.license_number ? ` • Licence: ${sub.license_number}` : ''}
                                {sub.license_expiry ? ` (Exp ${sub.license_expiry})` : ''}
                              </div>
                              <div>
                                {(typeof sub.total_orders === 'number' || typeof sub.rating === 'number') && (
                                  <>
                                    <strong>{sub.total_orders ?? sub.total_deliveries_completed ?? 0}</strong>{' '}
                                    {(sub.total_orders ?? sub.total_deliveries_completed ?? 0) === 1
                                      ? 'order'
                                      : 'orders'}{' '}
                                    &bull;{' '}
                                    <strong>
                                      {Number(sub.rating_count || 0) > 0 || Number(sub.rating || 0) > 0
                                        ? `★ ${Number(sub.rating || 0).toFixed(1)} (${sub.rating_count || 0})`
                                        : 'No ratings'}
                                    </strong>{' '}
                                    &bull;{' '}
                                  </>
                                )}
                                {sub.total_uploaded}/{sub.required_count || COMPLIANCE_DOC_SLOTS.length} uploaded &bull;{' '}
                                <span style={{ color: '#065F46', fontWeight: 600 }}>
                                  {sub.approved_count} approved
                                </span>
                                {sub.rejected_count > 0 && (
                                  <>
                                    {' '}&bull;{' '}
                                    <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                                      {sub.rejected_count} rejected
                                    </span>
                                  </>
                                )}
                                {sub.submitted_at ? ` • ${formatTimeAgo(sub.submitted_at)}` : ''}
                              </div>
                            </div>

                            {renderBulkReviewControls(
                              sub.user_id,
                              uploadedDocs.filter((d) => d.uploaded)
                            )}

                            <div className="da-approval-doc-list">
                              {uploadedDocs.map((doc) => {
                                const badge = getDocStatusBadge(doc);
                                const docStatus = (doc.verification_status || '').toLowerCase();
                                const rowKey = `${sub.user_id}:${doc.key}`;
                                const isRejectingHere = rejectingDocKey === rowKey;
                                const isDocBusy =
                                  reviewBusyKey === rowKey || reviewBusyKey === `${sub.user_id}:all`;
                                const rowClass =
                                  doc.verified || docStatus === 'verified'
                                    ? 'da-approval-doc-row-approved'
                                    : docStatus === 'rejected'
                                      ? 'da-approval-doc-row-rejected'
                                      : 'da-approval-doc-row-pending';

                                return (
                                  <div key={doc.key} className={`da-approval-doc-row ${rowClass}`}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 8,
                                      }}
                                    >
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div
                                          style={{
                                            fontSize: '0.79rem',
                                            fontWeight: 700,
                                            color: '#0F172A',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                          title={doc.label}
                                        >
                                          {doc.label}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--dg-text-muted)', lineHeight: 1.4 }}>
                                          {[
                                            doc.document_number ? `#${doc.document_number}` : '',
                                            doc.extracted_owner_name ? doc.extracted_owner_name : '',
                                            doc.extracted_date_of_birth ? `D.O.B: ${doc.extracted_date_of_birth}` : '',
                                            doc.extracted_plate ? `Plate: ${doc.extracted_plate}` : '',
                                            doc.extracted_issue_date ? `Issued: ${doc.extracted_issue_date}` : '',
                                            doc.extracted_expiry_date ? `Exp: ${doc.extracted_expiry_date}` : '',
                                            doc.reviewed_by_agent_name ? `By ${doc.reviewed_by_agent_name}` : '',
                                          ]
                                            .filter(Boolean)
                                            .join(' • ') || doc.file_name || 'Submitted file'}
                                        </div>
                                      </div>

                                      <span
                                        className="ds-status-pill"
                                        style={{ background: badge.bg, color: badge.color, fontSize: '0.67rem' }}
                                      >
                                        {badge.label}
                                      </span>
                                    </div>

                                    {docStatus === 'rejected' && doc.rejection_reason && (
                                      <div style={{ fontSize: '0.71rem', color: '#B91C1C' }}>
                                        Reason: {doc.rejection_reason}
                                        {!doc.uploaded ? ' (Deleted — awaiting rider re-upload)' : ''}
                                      </div>
                                    )}

                                    {doc.uploaded && (
                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button
                                          type="button"
                                          className="da-btn da-btn-sm da-btn-outline"
                                          style={{ fontSize: '0.71rem', padding: '4px 9px' }}
                                          onClick={() => {
                                            setViewingDoc(doc);
                                            setViewingDocUserId(sub.user_id);
                                          }}
                                        >
                                          View
                                        </button>
                                        {!doc.verified && docStatus !== 'rejected' && (
                                          <button
                                            type="button"
                                            disabled={Boolean(reviewBusyKey)}
                                            className="da-btn da-btn-sm da-btn-success"
                                            style={{ fontSize: '0.71rem', padding: '4px 9px' }}
                                            onClick={() =>
                                              handleReviewDocument(sub.user_id, doc.key, 'approve')
                                            }
                                          >
                                            {isDocBusy ? 'Saving…' : 'Accept'}
                                          </button>
                                        )}
                                        {(docStatus !== 'rejected' || doc.uploaded) && (
                                          <button
                                            type="button"
                                            disabled={Boolean(reviewBusyKey)}
                                            className="da-btn da-btn-sm da-btn-danger-outline"
                                            style={{ fontSize: '0.71rem', padding: '4px 9px' }}
                                            onClick={() => {
                                              if (isRejectingHere) {
                                                setRejectingDocKey(null);
                                                setRejectReasonDraft('');
                                              } else {
                                                setRejectingDocKey(rowKey);
                                                setRejectReasonDraft(doc.rejection_reason || '');
                                              }
                                            }}
                                          >
                                            Reject
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {isRejectingHere && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                                        <input
                                          type="text"
                                          className="dg-input"
                                          placeholder="Rejection reason for rider (required)..."
                                          value={rejectReasonDraft}
                                          onChange={(e) => setRejectReasonDraft(e.target.value)}
                                          style={{ padding: '6px 8px', fontSize: '0.74rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                          <button
                                            type="button"
                                            className="da-btn da-btn-sm da-btn-subtle"
                                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                            onClick={() => {
                                              setRejectingDocKey(null);
                                              setRejectReasonDraft('');
                                            }}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            disabled={Boolean(reviewBusyKey)}
                                            className="da-btn da-btn-sm da-btn-danger"
                                            style={{ fontSize: '0.7rem', padding: '4px 9px' }}
                                            onClick={() =>
                                              handleReviewDocument(
                                                sub.user_id,
                                                doc.key,
                                                'reject',
                                                rejectReasonDraft
                                              )
                                            }
                                          >
                                            Confirm Reject
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {sub.ai_comparison && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: '9px 11px',
                                borderRadius: 8,
                                border: `1px solid ${sub.ai_comparison.passed ? '#A7F3D0' : '#FECACA'}`,
                                background: sub.ai_comparison.passed ? '#ECFDF5' : '#FEF2F2',
                                fontSize: '0.76rem',
                                color: sub.ai_comparison.passed ? '#065F46' : '#991B1B',
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 3 }}>
                                {sub.ai_comparison.passed
                                  ? 'AI Cross-Document Check Passed'
                                  : 'AI Cross-Document Mismatch — Account Not Activated'}
                              </div>
                              <div>{sub.ai_comparison.summary}</div>
                              {!sub.ai_comparison.passed &&
                                sub.ai_comparison.mismatches &&
                                sub.ai_comparison.mismatches.length > 0 && (
                                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                    {sub.ai_comparison.mismatches.map((m, idx) => (
                                      <li key={idx}>{m}</li>
                                    ))}
                                  </ul>
                                )}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              paddingTop: 10,
                              marginTop: 'auto',
                              borderTop: '1px solid #F1F5F9',
                            }}
                          >
                            <button
                              type="button"
                              className="da-btn da-btn-sm da-btn-outline"
                              onClick={() => openUserWithRoute(sub.user_id, 'credentials', false)}
                            >
                              Inspect Rider
                            </button>
                            <span style={{ fontSize: '0.74rem', color: 'var(--dg-text-muted)', fontWeight: 600 }}>
                              {sub.is_activated
                                ? 'Activated after AI check'
                                : sub.pending_count > 0
                                  ? `${sub.pending_count} document(s) pending acceptance`
                                  : sub.rejected_count > 0
                                    ? 'Awaiting rider re-upload'
                                    : sub.ai_comparison && !sub.ai_comparison.passed
                                      ? 'AI mismatch — reject conflicting doc'
                                      : 'Awaiting AI verification'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ==================== 3. CONTEXTUAL RIGHT SIDEBAR (OPENS WHEN NEEDED) ==================== */}
        {rightOpen && (
          <aside className="da-right-sidebar" aria-label="Inspector sidebar">
            <div className="da-right-head">
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--dg-primary)' }}>
                {rightMode === 'user'
                  ? inspectedUserDetail?.is_driver
                    ? 'Rider Inspector'
                    : 'User Inspector'
                  : rightMode === 'delivery'
                  ? 'Delivery Inspector'
                  : 'Ticket Context'}
              </div>
              <button
                type="button"
                className="da-btn da-btn-sm da-btn-subtle"
                onClick={() => {
                  setRightOpen(false);
                  if (activeSection === 'customers' || activeSection === 'riders') {
                    pushDashboardUrl(`/dashboard/${activeSection}`);
                  } else if (activeSection === 'approvals') {
                    const qs = new URLSearchParams();
                    if (approvalsFilter !== 'pending') qs.set('status', approvalsFilter);
                    if (approvalsQuery.trim()) qs.set('q', approvalsQuery.trim());
                    pushDashboardUrl(`/dashboard/approvals${qs.toString() ? `?${qs.toString()}` : ''}`);
                  } else if (activeSection === 'support' && selectedTicket) {
                    pushDashboardUrl(`/dashboard/support/${selectedTicket.id}`);
                  }
                }}
              >
                <DashIcon name="close" size={14} />
                <span>Close</span>
              </button>
            </div>

            {/* Ticket Guest Context */}
            {rightMode === 'ticket' && selectedTicket && (
              <div className="da-right-body">
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>
                  {selectedTicket.guest_name || 'Guest Inquiry'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--dg-text-secondary)', marginBottom: 16 }}>
                  {selectedTicket.guest_email || 'No email on file'}
                </div>
                <div className="da-kv-grid">
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Subject</div>
                    <div className="da-kv-value">{selectedTicket.subject}</div>
                  </div>
                  <div>
                    <div className="da-kv-label">Category</div>
                    <div className="da-kv-value">{selectedTicket.category}</div>
                  </div>
                  <div>
                    <div className="da-kv-label">Department</div>
                    <div className="da-kv-value">{selectedTicket.department || 'General'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Context */}
            {rightMode === 'delivery' && selectedDeliveryConv && (
              <div className="da-right-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div className="da-kv-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dg-primary)' }}>
                      {selectedDeliveryConv.delivery?.tracking_id || 'Delivery'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)' }}>
                      {selectedDeliveryConv.delivery?.created_at
                        ? new Date(selectedDeliveryConv.delivery.created_at).toLocaleString()
                        : ''}
                    </div>
                  </div>
                  <span
                    className="ds-status-pill"
                    style={{
                      background: (
                        DELIVERY_STATUS_STYLE[selectedDeliveryConv.delivery?.status] ||
                        DELIVERY_STATUS_STYLE.pending
                      ).bg,
                      color: (
                        DELIVERY_STATUS_STYLE[selectedDeliveryConv.delivery?.status] ||
                        DELIVERY_STATUS_STYLE.pending
                      ).color,
                    }}
                  >
                    {(
                      DELIVERY_STATUS_STYLE[selectedDeliveryConv.delivery?.status] ||
                      DELIVERY_STATUS_STYLE.pending
                    ).label}
                  </span>
                </div>

                <div className="da-kv-grid">
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Pickup Address</div>
                    <div className="da-kv-value">{selectedDeliveryConv.delivery?.pickup_address}</div>
                  </div>
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Drop-off Address</div>
                    <div className="da-kv-value">{selectedDeliveryConv.delivery?.delivery_address}</div>
                  </div>
                  {liveDriverLocation && (
                    <div className="da-kv-item-full">
                      <div className="da-kv-label">Live Rider GPS Ping</div>
                      <div className="da-kv-value da-kv-mono">
                        {liveDriverLocation.lat.toFixed(5)}, {liveDriverLocation.lng.toFixed(5)} &bull;{' '}
                        {formatTimeAgo(liveDriverLocation.updatedAt)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="da-kv-label">Total Cost</div>
                    <div className="da-kv-value da-kv-mono">
                      ₦{Number(selectedDeliveryConv.delivery?.total_cost || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="da-kv-label">Payment</div>
                    <div className="da-kv-value" style={{ textTransform: 'capitalize' }}>
                      {selectedDeliveryConv.delivery?.payment_status} (
                      {selectedDeliveryConv.delivery?.selected_payment_type})
                    </div>
                  </div>
                </div>

                {selectedDeliveryConv.consumer && (
                  <div className="da-cred-section">
                    <div className="da-cred-title">Customer</div>
                    <div className="da-doc-card" style={{ marginBottom: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                        {selectedDeliveryConv.consumer.first_name}{' '}
                        {selectedDeliveryConv.consumer.last_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', margin: '3px 0 10px' }}>
                        {selectedDeliveryConv.consumer.email} &bull;{' '}
                        {selectedDeliveryConv.consumer.phone || 'No phone'}
                      </div>
                      <button
                        type="button"
                        className="da-btn da-btn-sm da-btn-outline"
                        onClick={() =>
                          openUserWithRoute(selectedDeliveryConv.consumer.id, 'profile', false)
                        }
                      >
                        Inspect customer profile
                      </button>
                    </div>
                  </div>
                )}

                <div className="da-cred-section">
                  <div className="da-cred-title">Assigned Rider &amp; Credentials</div>
                  {selectedDeliveryConv.driver ? (
                    <div className="da-doc-card" style={{ marginBottom: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                        {selectedDeliveryConv.driver.first_name}{' '}
                        {selectedDeliveryConv.driver.last_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 3 }}>
                        {selectedDeliveryConv.driver.phone || selectedDeliveryConv.driver.email}{' '}
                        &bull;{' '}
                        {[
                          selectedDeliveryConv.driver.vehicle_type || 'bike',
                          selectedDeliveryConv.driver.vehicle_make,
                          selectedDeliveryConv.driver.vehicle_model,
                          selectedDeliveryConv.driver.vehicle_year || '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        {typeof selectedDeliveryConv.driver.rating === 'number' &&
                          ` • ★ ${Number(selectedDeliveryConv.driver.rating || 0).toFixed(1)} (${
                            selectedDeliveryConv.driver.rating_count || 0
                          })`}
                        {typeof selectedDeliveryConv.driver.total_orders === 'number' &&
                          ` • ${selectedDeliveryConv.driver.total_orders} orders`}
                      </div>
                      {(selectedDeliveryConv.driver.vehicle_plate ||
                        selectedDeliveryConv.driver.license_number) && (
                        <div className="da-kv-mono" style={{ fontSize: '0.76rem', color: 'var(--dg-primary)', fontWeight: 600, marginTop: 6 }}>
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
                      <div style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="da-btn da-btn-sm da-btn-primary"
                          onClick={() =>
                            openUserWithRoute(
                              selectedDeliveryConv.driver.id,
                              'credentials',
                              false
                            )
                          }
                        >
                          View rider licenses &amp; credentials
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--dg-text-muted)' }}>
                      No rider assigned yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User / Rider Inspector Mode */}
            {rightMode === 'user' && (
              <>
                {loadingInspectedUser ? (
                  <div className="da-right-body" style={{ textAlign: 'center', color: 'var(--dg-text-secondary)', paddingTop: 48 }}>
                    Loading account information…
                  </div>
                ) : !inspectedUserDetail ? (
                  <div className="da-right-body" style={{ textAlign: 'center', color: 'var(--dg-text-muted)', paddingTop: 48 }}>
                    Could not load account details.
                  </div>
                ) : (
                  <>
                    {/* User Identity Header */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dg-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div
                          className={`da-avatar ${
                            inspectedUserDetail.is_driver ? 'da-avatar-driver' : ''
                          }`}
                          style={{ width: 44, height: 44, fontSize: '1rem' }}
                        >
                          {ninPhotoSrc ? (
                            <img
                              src={ninPhotoSrc}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            (inspectedUserDetail.profile?.first_name || 'U')
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0F172A' }}>
                              {inspectedUserDetail.profile?.first_name}{' '}
                              {inspectedUserDetail.profile?.last_name}
                            </span>
                            {!inspectedUserDetail.is_driver && (
                              <span
                                className="ds-status-pill"
                                style={{
                                  background: '#EFF6FF',
                                  color: '#204B7A',
                                }}
                              >
                                Customer
                              </span>
                            )}
                            {!inspectedUserDetail.is_driver &&
                              (inspectedUserDetail.is_suspended ||
                                inspectedUserDetail.profile?.is_suspended ||
                                inspectedUserDetail.profile?.status === 'suspended') && (
                              <span
                                className="ds-status-pill"
                                style={{ background: '#FEF2F2', color: '#B91C1C' }}
                              >
                                Suspended
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
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
                          className="da-btn da-btn-sm da-btn-subtle"
                          style={{ height: 24, fontSize: '0.72rem' }}
                          onClick={() => setShowTagDropdown(!showTagDropdown)}
                        >
                          + Add tag
                        </button>

                        {showTagDropdown && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 28,
                              left: 0,
                              background: '#FFFFFF',
                              border: '1px solid var(--dg-border)',
                              borderRadius: 8,
                              zIndex: 50,
                              minWidth: 140,
                              boxShadow: '0 6px 20px rgba(15,23,42,0.12)',
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

                    {/* Inspector Sub-Tabs */}
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
                          {
                            key: 'audit',
                            label: `Audit Log (${(inspectedUserDetail.audit_logs || []).length})`,
                          },
                        ] as { key: RightTab; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`ds-tab ${rightTab === tab.key ? 'ds-tab-active' : ''}`}
                          style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setRightTab(tab.key);
                            if ((activeSection === 'customers' || activeSection === 'riders') && inspectedUserId) {
                              pushDashboardUrl(`/dashboard/${activeSection}/${inspectedUserId}?tab=${tab.key}`, true);
                            }
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Inspector Body */}
                    <div className="da-right-body">
                      {opFeedback && (
                        <div
                          className={`dp-alert ${
                            opFeedback.type === 'success' ? 'dp-alert-success' : 'dp-alert-error'
                          }`}
                          style={{ marginBottom: 14 }}
                        >
                          {opFeedback.text}
                        </div>
                      )}

                      {/* 1. PROFILE & ACCOUNT CONTROLS */}
                      {rightTab === 'profile' && (
                        <>
                          {(inspectedUserDetail.is_suspended ||
                            inspectedUserDetail.profile?.status === 'suspended') && (
                            <div className="dp-alert dp-alert-error" style={{ marginBottom: 14 }}>
                              <div style={{ fontWeight: 700, marginBottom: 2 }}>Account Suspended</div>
                              {inspectedUserDetail.profile?.suspension_reason && (
                                <div>Reason: {inspectedUserDetail.profile.suspension_reason}</div>
                              )}
                              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                                {inspectedUserDetail.profile?.suspended_by_name
                                  ? `Suspended by ${inspectedUserDetail.profile.suspended_by_name}${
                                      inspectedUserDetail.profile?.suspended_by_email
                                        ? ` (${inspectedUserDetail.profile.suspended_by_email})`
                                        : ''
                                    }`
                                  : 'Suspended by Operations'}
                                {inspectedUserDetail.profile?.suspended_at
                                  ? ` • ${formatDateTime(inspectedUserDetail.profile.suspended_at)}`
                                  : ''}
                              </div>
                            </div>
                          )}

                          <div className="da-kv-grid">
                            <div>
                              <div className="da-kv-label">Account Status</div>
                              <div
                                className="da-kv-value"
                                style={{
                                  color:
                                    inspectedUserDetail.is_suspended ||
                                    inspectedUserDetail.profile?.status === 'suspended'
                                      ? '#B91C1C'
                                      : '#065F46',
                                }}
                              >
                                {inspectedUserDetail.is_suspended ||
                                inspectedUserDetail.profile?.status === 'suspended'
                                  ? 'Suspended'
                                  : 'Active'}
                              </div>
                            </div>
                            <div>
                              <div className="da-kv-label">Wallet Balance</div>
                              <div className="da-kv-value da-kv-mono">
                                ₦{Number(inspectedUserDetail.wallet_balance || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="da-kv-label">Total Orders</div>
                              <div className="da-kv-value da-kv-mono">
                                {inspectedUserDetail.profile?.total_orders ??
                                  inspectedUserDetail.profile?.total_deliveries_completed ??
                                  0}
                              </div>
                            </div>
                            <div>
                              <div className="da-kv-label">Completed Orders</div>
                              <div className="da-kv-value da-kv-mono">
                                {inspectedUserDetail.profile?.total_deliveries_completed || 0}
                              </div>
                            </div>
                            {inspectedUserDetail.is_driver && (
                              <>
                                <div>
                                  <div className="da-kv-label">Total Earnings</div>
                                  <div className="da-kv-value da-kv-mono">
                                    ₦{Number(inspectedUserDetail.total_earnings || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Rating</div>
                                  <div className="da-kv-value da-kv-mono">
                                    ★ {Number(inspectedUserDetail.profile?.rating || 0).toFixed(1)} / 5 (
                                    {inspectedUserDetail.profile?.rating_count || 0})
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Driver Score &amp; Tier</div>
                                  <div className="da-kv-value da-kv-mono">
                                    {Math.round(Number(creds?.driver_score || 0))}% &bull;{' '}
                                    {creds?.reward_tier || 'Standard'}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Completion / Acceptance</div>
                                  <div className="da-kv-value da-kv-mono">
                                    {Math.round(Number(creds?.completion_rate || 0))}% /{' '}
                                    {Math.round(Number(creds?.acceptance_rate || 0))}%
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Vehicle</div>
                                  <div className="da-kv-value">
                                    {[
                                      creds?.vehicle_type,
                                      creds?.vehicle_make,
                                      creds?.vehicle_model,
                                      creds?.vehicle_year || '',
                                    ]
                                      .filter(Boolean)
                                      .join(' • ') || 'Not specified'}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Rider Licence</div>
                                  <div className="da-kv-value da-kv-mono">
                                    {creds?.license_number || 'Not provided'}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Vehicle Plate</div>
                                  <div className="da-kv-value da-kv-mono">
                                    {creds?.vehicle_plate || 'Not provided'}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Activation</div>
                                  <div className="da-kv-value">
                                    {creds?.is_activated ? 'Activated' : 'Pending Activation'} &bull;{' '}
                                    {creds?.is_online ? 'Online' : 'Offline'}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Moderation & Operational Controls */}
                          <div className="da-action-panel">
                            <div className="da-cred-title" style={{ marginBottom: 8 }}>
                              Account Moderation &amp; Operations
                            </div>
                            <input
                              type="text"
                              className="dg-input"
                              placeholder="Reason / audit note (optional)..."
                              value={suspendReasonInput}
                              onChange={(e) => setSuspendReasonInput(e.target.value)}
                              style={{ padding: '7px 10px', fontSize: '0.8rem', marginBottom: 10, background: '#FFFFFF' }}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {inspectedUserDetail.is_suspended ||
                              inspectedUserDetail.profile?.status === 'suspended' ? (
                                <button
                                  type="button"
                                  disabled={opBusy}
                                  className="da-btn da-btn-sm da-btn-success"
                                  onClick={() => handleToggleSuspension(false)}
                                >
                                  {inspectedUserDetail.is_driver ? 'Unsuspend Rider' : 'Unsuspend Account'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={opBusy}
                                  className="da-btn da-btn-sm da-btn-danger"
                                  onClick={() => handleToggleSuspension(true)}
                                >
                                  {inspectedUserDetail.is_driver ? 'Suspend Rider' : 'Suspend Account'}
                                </button>
                              )}

                              {inspectedUserDetail.is_driver && (
                                <>
                                  {creds?.is_activated ? (
                                    <button
                                      type="button"
                                      disabled={opBusy}
                                      className="da-btn da-btn-sm da-btn-warning"
                                      onClick={() =>
                                        handleRiderOperation(
                                          'deactivate',
                                          { reason: suspendReasonInput.trim() || undefined },
                                          'Rider account deactivated and email sent.'
                                        )
                                      }
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={opBusy}
                                      className="da-btn da-btn-sm da-btn-primary"
                                      onClick={() =>
                                        handleRiderOperation(
                                          'activate',
                                          { reason: suspendReasonInput.trim() || undefined },
                                          'Rider account activated, logged, and email sent.'
                                        )
                                      }
                                    >
                                      Activate Rider
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={opBusy || !creds?.is_online}
                                    className="da-btn da-btn-sm da-btn-outline"
                                    onClick={() =>
                                      handleRiderOperation(
                                        'force_offline',
                                        { reason: suspendReasonInput.trim() || undefined },
                                        'Rider set offline and email sent.'
                                      )
                                    }
                                  >
                                    Force Offline
                                  </button>

                                  <button
                                    type="button"
                                    disabled={opBusy}
                                    className="da-btn da-btn-sm da-btn-outline"
                                    onClick={() =>
                                      handleRiderOperation(
                                        'clear_device_session',
                                        { reason: suspendReasonInput.trim() || undefined },
                                        'Active device session lock cleared and email sent.'
                                      )
                                    }
                                  >
                                    Clear Device Lock
                                  </button>

                                  {!creds?.license_verified && (
                                    <button
                                      type="button"
                                      disabled={opBusy}
                                      className="da-btn da-btn-sm da-btn-success"
                                      onClick={() =>
                                        handleRiderOperation(
                                          'verify_license',
                                          { reason: suspendReasonInput.trim() || undefined },
                                          'Rider licence marked verified and email sent.'
                                        )
                                      }
                                    >
                                      Verify Licence
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={opBusy}
                                    className="da-btn da-btn-sm da-btn-subtle"
                                    onClick={() => setEditingRiderDetails((v) => !v)}
                                  >
                                    {editingRiderDetails ? 'Cancel Edit' : 'Edit Vehicle / Licence'}
                                  </button>
                                </>
                              )}
                            </div>

                            {inspectedUserDetail.is_driver && editingRiderDetails && (
                              <form
                                onSubmit={handleSaveRiderDetails}
                                style={{
                                  marginTop: 12,
                                  paddingTop: 12,
                                  borderTop: '1px solid var(--dg-border)',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: 8,
                                }}
                              >
                                <select
                                  className="dg-select"
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                  value={riderEditForm.vehicle_type}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, vehicle_type: e.target.value }))
                                  }
                                >
                                  <option value="bike">Bike</option>
                                  <option value="car">Car</option>
                                  <option value="van">Van</option>
                                  <option value="truck">Truck</option>
                                </select>
                                <input
                                  type="text"
                                  className="dg-input"
                                  placeholder="Plate Number"
                                  value={riderEditForm.vehicle_plate}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, vehicle_plate: e.target.value }))
                                  }
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                />
                                <input
                                  type="text"
                                  className="dg-input"
                                  placeholder="Vehicle Make"
                                  value={riderEditForm.vehicle_make}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, vehicle_make: e.target.value }))
                                  }
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                />
                                <input
                                  type="text"
                                  className="dg-input"
                                  placeholder="Vehicle Model"
                                  value={riderEditForm.vehicle_model}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, vehicle_model: e.target.value }))
                                  }
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                />
                                <input
                                  type="text"
                                  className="dg-input"
                                  placeholder="Licence Number"
                                  value={riderEditForm.license_number}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, license_number: e.target.value }))
                                  }
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                />
                                <input
                                  type="text"
                                  className="dg-input"
                                  placeholder="Expiry (YYYY-MM-DD)"
                                  value={riderEditForm.license_expiry}
                                  onChange={(e) =>
                                    setRiderEditForm((p) => ({ ...p, license_expiry: e.target.value }))
                                  }
                                  style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                                />
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                  <button type="submit" disabled={opBusy} className="da-btn da-btn-sm da-btn-primary">
                                    Save Vehicle &amp; Licence Details
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>

                          {inspectedUserDetail.is_driver && (
                            <div style={{ marginTop: 14 }}>
                              <button
                                type="button"
                                className="da-btn da-btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => setRightTab('credentials')}
                              >
                                Review rider compliance documents
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 2. LICENSES & CREDENTIALS */}
                      {rightTab === 'credentials' && inspectedUserDetail.is_driver && (
                        <>
                          {!creds && (
                            <div className="dp-alert dp-alert-info" style={{ marginBottom: 14 }}>
                              This rider has not uploaded any compliance certificates yet.
                            </div>
                          )}
                          {creds && (
                            <>
                              {creds.expiry_locked && (
                                <div className="dp-alert dp-alert-error" style={{ marginBottom: 14 }}>
                                  Account locked due to expired document(s):{' '}
                                  {(creds.expired_document_types || []).join(', ') || 'Expired compliance doc'}
                                </div>
                              )}
                              {!creds.expiry_locked && creds.expiry_warning_active && (
                                <div className="dp-alert dp-alert-warning" style={{ marginBottom: 14 }}>
                                  {creds.next_expiring_doc_label || creds.next_expiring_doc_type} expires{' '}
                                  {creds.next_document_expiry} ({creds.days_until_next_expiry} days left)
                                </div>
                              )}

                              <div className="da-kv-grid">
                                <div>
                                  <div className="da-kv-label">Portal Status</div>
                                  <div className="da-kv-value">
                                    {creds.portal_completed ? 'Completed' : 'Incomplete'}
                                  </div>
                                </div>
                                <div>
                                  <div className="da-kv-label">Activation</div>
                                  <div className="da-kv-value">
                                    {creds.is_activated ? 'Activated' : 'Inactive'} &bull;{' '}
                                    {creds.is_online ? 'Online' : 'Offline'}
                                  </div>
                                </div>
                                {creds.next_document_expiry && (
                                  <div className="da-kv-item-full">
                                    <div className="da-kv-label">Next Compliance Expiry</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.next_expiring_doc_label || 'Document'} —{' '}
                                      {creds.next_document_expiry} ({creds.days_until_next_expiry}d left)
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* NIMC Identity */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">NIMC Identity Record</div>
                                <div className="da-kv-grid">
                                  <div className="da-kv-item-full">
                                    <div className="da-kv-label">NIN Number</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.nin ? (
                                        <>
                                          {showFullNin ? creds.nin : creds.nin_masked}{' '}
                                          <button
                                            type="button"
                                            className="dg-inline-link"
                                            style={{ fontSize: '0.72rem', marginLeft: 4 }}
                                            onClick={() => setShowFullNin((v) => !v)}
                                          >
                                            {showFullNin ? 'Hide' : 'Show'}
                                          </button>
                                        </>
                                      ) : (
                                        'Not provided'
                                      )}
                                    </div>
                                  </div>
                                  <div className="da-kv-item-full">
                                    <div className="da-kv-label">Registered Legal Name (NIMC)</div>
                                    <div className="da-kv-value">
                                      {creds.nin_record?.full_name ||
                                        creds.display_name ||
                                        `${inspectedUserDetail.profile?.first_name || ''} ${
                                          creds.middle_name || ''
                                        } ${inspectedUserDetail.profile?.last_name || ''}`.trim()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Date of Birth</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.date_of_birth || creds.nin_record?.date_of_birth || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Gender</div>
                                    <div className="da-kv-value">
                                      {creds.gender || creds.nin_record?.gender || 'N/A'}
                                    </div>
                                  </div>
                                  {creds.nin_record?.address && (
                                    <div className="da-kv-item-full">
                                      <div className="da-kv-label">NIMC Address</div>
                                      <div className="da-kv-value">{creds.nin_record.address}</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Rider Licence */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">Rider&apos;s Licence</div>
                                <div className="da-kv-grid">
                                  <div>
                                    <div className="da-kv-label">Licence Status</div>
                                    <div className="da-kv-value">
                                      {creds.license_verified ? 'Verified' : 'Unverified'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Licence Number</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.license_number || 'Not on file'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Issue Date</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.license_issued_date || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Expiry Date</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.license_expiry || 'N/A'}
                                    </div>
                                  </div>
                                  {creds.license_state_of_issue && (
                                    <div className="da-kv-item-full">
                                      <div className="da-kv-label">State of Issue</div>
                                      <div className="da-kv-value">{creds.license_state_of_issue}</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Vehicle Registry */}
                              <div className="da-cred-section">
                                <div className="da-cred-title">Vehicle &amp; Motor Registry</div>
                                <div className="da-kv-grid">
                                  <div className="da-kv-item-full">
                                    <div className="da-kv-label">Vehicle</div>
                                    <div className="da-kv-value">
                                      {[
                                        creds.vehicle_type,
                                        creds.vehicle_make,
                                        creds.vehicle_model,
                                        creds.vehicle_year || '',
                                      ]
                                        .filter(Boolean)
                                        .join(' • ') || 'Not specified'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="da-kv-label">Plate Number</div>
                                    <div className="da-kv-value da-kv-mono">
                                      {creds.vehicle_plate || 'N/A'}
                                    </div>
                                  </div>
                                  {creds.vehicle_chassis_number && (
                                    <div>
                                      <div className="da-kv-label">Chassis / VIN</div>
                                      <div className="da-kv-value da-kv-mono">
                                        {creds.vehicle_chassis_number}
                                      </div>
                                    </div>
                                  )}
                                  {creds.vehicle_engine_number && (
                                    <div>
                                      <div className="da-kv-label">Engine Number</div>
                                      <div className="da-kv-value da-kv-mono">
                                        {creds.vehicle_engine_number}
                                      </div>
                                    </div>
                                  )}
                                  {creds.vehicle_registry_file_no && (
                                    <div>
                                      <div className="da-kv-label">Registry File No.</div>
                                      <div className="da-kv-value da-kv-mono">
                                        {creds.vehicle_registry_file_no}
                                      </div>
                                    </div>
                                  )}
                                  {creds.vehicle_autoreg_pin && (
                                    <div>
                                      <div className="da-kv-label">AutoReg PIN</div>
                                      <div className="da-kv-value da-kv-mono">
                                        {creds.vehicle_autoreg_pin}
                                      </div>
                                    </div>
                                  )}
                                  {creds.vehicle_poc_vid && (
                                    <div>
                                      <div className="da-kv-label">POC VID</div>
                                      <div className="da-kv-value da-kv-mono">
                                        {creds.vehicle_poc_vid}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Compliance Documents Cards & Agent Approval Controls */}
                          {(() => {
                            const existingDocs = creds?.documents || [];
                            const docByKey = new Map<string, DriverCredentialDoc>(
                              existingDocs.map((d) => [d.key, d])
                            );
                            const renderDocs: DriverCredentialDoc[] = COMPLIANCE_DOC_SLOTS.map(
                              (slot) =>
                                docByKey.get(slot.key) || {
                                  key: slot.key,
                                  label: slot.label,
                                  issuing_authority: slot.authority,
                                  uploaded: false,
                                }
                            );
                            for (const extra of existingDocs) {
                              if (!renderDocs.some((r) => r.key === extra.key)) {
                                renderDocs.push(extra);
                              }
                            }
                            const uploadedDocs = renderDocs.filter((d) => d.uploaded);
                            const riderUid = inspectedUserDetail?.profile?.id || inspectedUserId || '';

                            return (
                              <div className="da-cred-section">
                                <div className="da-cred-title" style={{ marginBottom: 6 }}>
                                  Compliance Documents ({uploadedDocs.length}/{renderDocs.length})
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--dg-text-secondary)', marginBottom: 10 }}>
                                  Accept or reject each uploaded certificate below. After all required documents are accepted, Deliva AI compares names, date of birth, identity, and vehicle details before activating the rider.
                                </div>

                                {riderUid && renderBulkReviewControls(riderUid, uploadedDocs)}

                                {creds?.ai_comparison && (
                                  <div
                                    style={{
                                      marginBottom: 12,
                                      padding: '10px 12px',
                                      borderRadius: 8,
                                      border: `1px solid ${creds.ai_comparison.passed ? '#A7F3D0' : '#FECACA'}`,
                                      background: creds.ai_comparison.passed ? '#ECFDF5' : '#FEF2F2',
                                      color: creds.ai_comparison.passed ? '#065F46' : '#991B1B',
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>
                                      {creds.ai_comparison.passed
                                        ? 'AI Cross-Document & NIN Comparison Passed'
                                        : 'AI Comparison Mismatch — Activation Blocked'}
                                    </div>
                                    <div style={{ fontSize: '0.76rem', marginBottom: 6 }}>
                                      {creds.ai_comparison.summary}
                                    </div>
                                    {creds.ai_comparison.checks && creds.ai_comparison.checks.length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {creds.ai_comparison.checks.map((chk, idx) => (
                                          <div key={`${chk.field}-${idx}`} style={{ fontSize: '0.73rem', display: 'flex', gap: 6 }}>
                                            <span style={{ fontWeight: 700 }}>{chk.passed ? 'PASS' : 'MISMATCH'}</span>
                                            <span>
                                              <strong>{chk.label}:</strong> {chk.detail}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {renderDocs.map((doc) => {
                                  const badge = getDocStatusBadge(doc);
                                  const resolvedUrl = resolveSupportMediaUrl(doc.url);
                                  const previewImg =
                                    resolvedUrl && isImageUrl(resolvedUrl, doc.content_type);
                                  const docStatus = (doc.verification_status || '').toLowerCase();
                                  const rowKey = `${riderUid}:${doc.key}`;
                                  const isRejectingHere = rejectingDocKey === rowKey;
                                  const isDocBusy =
                                    reviewBusyKey === rowKey || reviewBusyKey === `${riderUid}:all`;

                                  return (
                                    <div key={doc.key} className="da-doc-card">
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'flex-start',
                                          gap: 8,
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                                            {doc.label}
                                          </div>
                                          {doc.issuing_authority && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--dg-text-muted)', marginTop: 1 }}>
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

                                      {!doc.uploaded && docStatus === 'rejected' && (
                                        <div
                                          style={{
                                            marginTop: 8,
                                            padding: '7px 9px',
                                            borderRadius: 6,
                                            background: '#FEF2F2',
                                            border: '1px solid #FECACA',
                                            color: '#B91C1C',
                                            fontSize: '0.73rem',
                                          }}
                                        >
                                          {doc.rejection_reason && (
                                            <div>
                                              <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                            </div>
                                          )}
                                          <div style={{ marginTop: 2, color: '#7F1D1D' }}>
                                            Rejected document deleted — waiting for rider to upload a new version.
                                            {doc.reviewed_by_agent_name
                                              ? ` Reviewed by ${doc.reviewed_by_agent_name}.`
                                              : ''}
                                          </div>
                                        </div>
                                      )}

                                      {doc.uploaded && (
                                        <>
                                          <div
                                            style={{
                                              fontSize: '0.75rem',
                                              color: 'var(--dg-text-secondary)',
                                              marginTop: 8,
                                              lineHeight: 1.5,
                                            }}
                                          >
                                            {doc.document_number && (
                                              <div>
                                                Doc / Serial #: <span className="da-kv-mono">{doc.document_number}</span>
                                              </div>
                                            )}
                                            {doc.receipt_number && (
                                              <div>
                                                Receipt #: <span className="da-kv-mono">{doc.receipt_number}</span>
                                              </div>
                                            )}
                                            {doc.extracted_owner_name && (
                                              <div>
                                                Owner: <strong>{doc.extracted_owner_name}</strong>
                                              </div>
                                            )}
                                            {(doc.extracted_issue_date || doc.extracted_expiry_date) && (
                                              <div>
                                                Validity:{' '}
                                                <span className="da-kv-mono">
                                                  {doc.extracted_issue_date || 'N/A'} &rarr;{' '}
                                                  <strong>{doc.extracted_expiry_date || 'N/A'}</strong>
                                                </span>
                                              </div>
                                            )}
                                            {(doc.extracted_plate || doc.extracted_vehicle_make) && (
                                              <div>
                                                Vehicle:{' '}
                                                <span className="da-kv-mono">
                                                  {[doc.extracted_vehicle_make, doc.extracted_plate]
                                                    .filter(Boolean)
                                                    .join(' • ')}
                                                </span>
                                              </div>
                                            )}
                                            {doc.extracted_engine_number && (
                                              <div>
                                                Engine: <span className="da-kv-mono">{doc.extracted_engine_number}</span>
                                              </div>
                                            )}
                                            {doc.extracted_chassis_number && (
                                              <div>
                                                Chassis: <span className="da-kv-mono">{doc.extracted_chassis_number}</span>
                                              </div>
                                            )}
                                            {doc.extracted_file_number && (
                                              <div>
                                                File No.: <span className="da-kv-mono">{doc.extracted_file_number}</span>
                                              </div>
                                            )}
                                            {doc.extracted_poc_vid && (
                                              <div>
                                                POC VID: <span className="da-kv-mono">{doc.extracted_poc_vid}</span>
                                              </div>
                                            )}
                                            {doc.extracted_pin && (
                                              <div>
                                                AutoReg PIN: <span className="da-kv-mono">{doc.extracted_pin}</span>
                                              </div>
                                            )}
                                            {docStatus === 'rejected' && doc.rejection_reason && (
                                              <div
                                                style={{
                                                  marginTop: 5,
                                                  padding: '6px 8px',
                                                  borderRadius: 6,
                                                  background: '#FEF2F2',
                                                  border: '1px solid #FECACA',
                                                  color: '#B91C1C',
                                                  fontSize: '0.73rem',
                                                }}
                                              >
                                                <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                              </div>
                                            )}
                                            {(doc.reviewed_by_agent_name || doc.uploaded_at) && (
                                              <div
                                                style={{
                                                  marginTop: 5,
                                                  padding: '5px 8px',
                                                  borderRadius: 6,
                                                  background: doc.reviewed_by_agent_name
                                                    ? '#EFF6FF'
                                                    : 'var(--dg-bg-alt)',
                                                  border: '1px solid var(--dg-border)',
                                                  fontSize: '0.72rem',
                                                  color: '#0F172A',
                                                }}
                                              >
                                                {doc.uploaded_at && (
                                                  <div style={{ color: 'var(--dg-text-secondary)' }}>
                                                    Submitted by Rider: {formatDateTime(doc.uploaded_at)}
                                                  </div>
                                                )}
                                                {doc.reviewed_by_agent_name && (
                                                  <div style={{ marginTop: doc.uploaded_at ? 2 : 0 }}>
                                                    <strong>Reviewed by Agent:</strong>{' '}
                                                    {doc.reviewed_by_agent_name}
                                                    {doc.reviewed_by_agent_email
                                                      ? ` (${doc.reviewed_by_agent_email})`
                                                      : ''}
                                                    {doc.reviewed_at
                                                      ? ` • ${formatDateTime(doc.reviewed_at)}`
                                                      : ''}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {previewImg && (
                                            <img
                                              src={resolvedUrl}
                                              alt={doc.label}
                                              className="da-doc-thumb"
                                              onClick={() => {
                                                setViewingDoc(doc);
                                                setViewingDocUserId(riderUid || null);
                                                if (inspectedUserId) {
                                                  const dirSec = activeSection === 'riders' ? 'riders' : 'customers';
                                                  pushDashboardUrl(
                                                    `/dashboard/${dirSec}/${inspectedUserId}?tab=credentials&doc=${doc.key}`,
                                                    true
                                                  );
                                                }
                                              }}
                                            />
                                          )}

                                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                                            <button
                                              type="button"
                                              className="da-btn da-btn-sm da-btn-primary"
                                              style={{ flex: 1 }}
                                              onClick={() => {
                                                setViewingDoc(doc);
                                                setViewingDocUserId(riderUid || null);
                                                if (inspectedUserId) {
                                                  const dirSec = activeSection === 'riders' ? 'riders' : 'customers';
                                                  pushDashboardUrl(
                                                    `/dashboard/${dirSec}/${inspectedUserId}?tab=credentials&doc=${doc.key}`,
                                                    true
                                                  );
                                                }
                                              }}
                                            >
                                              Preview
                                            </button>
                                            <a
                                              href={resolvedUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="da-btn da-btn-sm da-btn-outline"
                                            >
                                              Open ↗
                                            </a>
                                            {doc.key !== 'id_document' && riderUid && !doc.verified && docStatus !== 'rejected' && (
                                              <button
                                                type="button"
                                                disabled={Boolean(reviewBusyKey)}
                                                className="da-btn da-btn-sm da-btn-success"
                                                onClick={() =>
                                                  handleReviewDocument(riderUid, doc.key, 'approve')
                                                }
                                              >
                                                {isDocBusy ? 'Saving…' : 'Accept'}
                                              </button>
                                            )}
                                            {doc.key !== 'id_document' &&
                                              riderUid &&
                                              (docStatus !== 'rejected' || doc.uploaded) && (
                                                <button
                                                  type="button"
                                                  disabled={Boolean(reviewBusyKey)}
                                                  className="da-btn da-btn-sm da-btn-danger-outline"
                                                  onClick={() => {
                                                    if (isRejectingHere) {
                                                      setRejectingDocKey(null);
                                                      setRejectReasonDraft('');
                                                    } else {
                                                      setRejectingDocKey(rowKey);
                                                      setRejectReasonDraft(doc.rejection_reason || '');
                                                    }
                                                  }}
                                                >
                                                  Reject
                                                </button>
                                              )}
                                          </div>

                                          {isRejectingHere && riderUid && (
                                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                              <input
                                                type="text"
                                                className="dg-input"
                                                placeholder="Rejection reason for rider (required)..."
                                                value={rejectReasonDraft}
                                                onChange={(e) => setRejectReasonDraft(e.target.value)}
                                                style={{ padding: '6px 8px', fontSize: '0.74rem' }}
                                              />
                                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button
                                                  type="button"
                                                  className="da-btn da-btn-sm da-btn-subtle"
                                                  onClick={() => {
                                                    setRejectingDocKey(null);
                                                    setRejectReasonDraft('');
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  disabled={Boolean(reviewBusyKey)}
                                                  className="da-btn da-btn-sm da-btn-danger"
                                                  onClick={() =>
                                                    handleReviewDocument(
                                                      riderUid,
                                                      doc.key,
                                                      'reject',
                                                      rejectReasonDraft
                                                    )
                                                  }
                                                >
                                                  Confirm Reject
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
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
                              onClick={() => openDeliveryWithRoute(d.id)}
                              className="da-doc-card"
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.86rem', marginBottom: 4 }}>
                                <span className="da-kv-mono" style={{ color: 'var(--dg-primary)' }}>
                                  {d.tracking_id || d.id}
                                </span>
                                <span className="da-kv-mono">
                                  ₦{Number(d.total_cost || 0).toLocaleString()}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)' }}>
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
                            <div key={pm.id} className="da-doc-card">
                              <strong style={{ fontSize: '0.86rem', textTransform: 'capitalize' }}>
                                {pm.card_brand || pm.method_type}{' '}
                                {pm.last4 ? `•••• ${pm.last4}` : ''}
                              </strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
                                {pm.bank_name || pm.card_name || 'Saved method'}
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
                            <div key={a.id} className="da-doc-card">
                              <strong style={{ fontSize: '0.86rem' }}>{a.label}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--dg-text-secondary)', marginTop: 2 }}>
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
                              onClick={() => openTicketWithRoute(t)}
                              className="da-doc-card"
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--dg-primary)' }}>
                                {t.subject}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--dg-text-secondary)', marginTop: 3 }}>
                                {t.status} &bull; Priority: {t.priority} &bull; {formatTimeAgo(t.updated_at)}
                              </div>
                            </div>
                          ))
                        ))}

                      {/* 7. AUDIT LOG */}
                      {rightTab === 'audit' &&
                        ((inspectedUserDetail.audit_logs || []).length === 0 ? (
                          <div style={{ padding: 24, color: 'var(--dg-text-muted)', fontSize: '0.86rem' }}>
                            No agent review or enforcement actions logged for this account yet.
                          </div>
                        ) : (
                          (inspectedUserDetail.audit_logs as AgentAuditLog[]).map((log) => (
                            <div key={log.id} className="da-audit-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span
                                  className="ds-status-pill"
                                  style={{
                                    background:
                                      log.action === 'suspend' ||
                                      log.action === 'reject_document' ||
                                      log.action === 'ai_comparison_mismatch'
                                        ? '#FEF2F2'
                                        : log.action === 'approve_document' ||
                                            log.action === 'ai_comparison_activated' ||
                                            log.action === 'approve_all_documents' ||
                                            log.action === 'unsuspend' ||
                                            log.action === 'activate'
                                          ? '#ECFDF5'
                                          : '#EFF6FF',
                                    color:
                                      log.action === 'suspend' ||
                                      log.action === 'reject_document' ||
                                      log.action === 'ai_comparison_mismatch'
                                        ? '#B91C1C'
                                        : log.action === 'approve_document' ||
                                            log.action === 'ai_comparison_activated' ||
                                            log.action === 'approve_all_documents' ||
                                            log.action === 'unsuspend' ||
                                            log.action === 'activate'
                                          ? '#065F46'
                                          : '#204B7A',
                                    textTransform: 'uppercase',
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--dg-text-muted)' }}>
                                  {formatDateTime(log.created_at)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>
                                {log.summary}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--dg-text-secondary)', marginTop: 4 }}>
                                Agent: <strong>{log.agent_name}</strong>
                                {log.agent_email ? ` (${log.agent_email})` : ''}
                              </div>
                              {log.details?.authenticity_score ? (
                                <div style={{ fontSize: '0.72rem', color: '#065F46', marginTop: 3 }}>
                                  Verification score: {Math.round(Number(log.details.authenticity_score))}%
                                  {log.details.extracted_expiry_date
                                    ? ` • Expiry: ${log.details.extracted_expiry_date}`
                                    : ''}
                                </div>
                              ) : null}
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

      {/* ==================== 4. DOCUMENT PREVIEW & APPROVAL LIGHTBOX MODAL ==================== */}
      {viewingDoc && (
        <div
          className="dg-modal-overlay"
          onClick={() => {
            setViewingDoc(null);
            setViewingDocUserId(null);
            if ((activeSection === 'customers' || activeSection === 'riders') && inspectedUserId) {
              pushDashboardUrl(`/dashboard/${activeSection}/${inspectedUserId}?tab=${rightTab}`, true);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dg-modal-card"
            style={{ maxWidth: 840, maxHeight: '90vh' }}
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {viewingDoc.url && (
                  <a
                    href={resolveSupportMediaUrl(viewingDoc.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="da-btn da-btn-sm da-btn-outline"
                  >
                    Open in new tab ↗
                  </a>
                )}
                <button
                  type="button"
                  className="da-btn da-btn-sm da-btn-subtle"
                  onClick={() => {
                    setViewingDoc(null);
                    setViewingDocUserId(null);
                    if ((activeSection === 'customers' || activeSection === 'riders') && inspectedUserId) {
                      pushDashboardUrl(`/dashboard/${activeSection}/${inspectedUserId}?tab=${rightTab}`, true);
                    }
                  }}
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
                    borderRadius: 10,
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

              <div className="da-kv-grid">
                {viewingDoc.document_number && (
                  <div>
                    <div className="da-kv-label">Document / Serial No.</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.document_number}</div>
                  </div>
                )}
                {viewingDoc.receipt_number && (
                  <div>
                    <div className="da-kv-label">Receipt No.</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.receipt_number}</div>
                  </div>
                )}
                {(viewingDoc.extracted_issue_date || viewingDoc.extracted_expiry_date) && (
                  <div>
                    <div className="da-kv-label">Issue &amp; Expiry Dates</div>
                    <div className="da-kv-value da-kv-mono">
                      {viewingDoc.extracted_issue_date || 'N/A'} &rarr;{' '}
                      {viewingDoc.extracted_expiry_date || 'N/A'}
                    </div>
                  </div>
                )}
                {viewingDoc.extracted_owner_name && (
                  <div>
                    <div className="da-kv-label">Owner Name</div>
                    <div className="da-kv-value">{viewingDoc.extracted_owner_name}</div>
                  </div>
                )}
                {viewingDoc.extracted_vehicle_make && (
                  <div>
                    <div className="da-kv-label">Vehicle Make / Model</div>
                    <div className="da-kv-value">
                      {viewingDoc.extracted_vehicle_make}
                      {viewingDoc.extracted_vehicle_model ? ` ${viewingDoc.extracted_vehicle_model}` : ''}
                    </div>
                  </div>
                )}
                {!viewingDoc.extracted_vehicle_make && viewingDoc.extracted_vehicle_model && (
                  <div>
                    <div className="da-kv-label">Vehicle Model</div>
                    <div className="da-kv-value">{viewingDoc.extracted_vehicle_model}</div>
                  </div>
                )}
                {viewingDoc.extracted_plate && (
                  <div>
                    <div className="da-kv-label">Extracted Plate</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_plate}</div>
                  </div>
                )}
                {viewingDoc.extracted_chassis_number && (
                  <div>
                    <div className="da-kv-label">Chassis / VIN</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_chassis_number}</div>
                  </div>
                )}
                {viewingDoc.extracted_engine_number && (
                  <div>
                    <div className="da-kv-label">Engine No.</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_engine_number}</div>
                  </div>
                )}
                {viewingDoc.extracted_file_number && (
                  <div>
                    <div className="da-kv-label">File Number</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_file_number}</div>
                  </div>
                )}
                {viewingDoc.extracted_date_of_birth && (
                  <div>
                    <div className="da-kv-label">Extracted D.O.B.</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_date_of_birth}</div>
                  </div>
                )}
                {viewingDoc.extracted_gender && (
                  <div>
                    <div className="da-kv-label">Extracted Gender</div>
                    <div className="da-kv-value">{viewingDoc.extracted_gender}</div>
                  </div>
                )}
                {viewingDoc.extracted_phone && (
                  <div>
                    <div className="da-kv-label">Extracted Phone</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_phone}</div>
                  </div>
                )}
                {viewingDoc.extracted_address && (
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Extracted Address</div>
                    <div className="da-kv-value">{viewingDoc.extracted_address}</div>
                  </div>
                )}
                {viewingDoc.extraction_method && (
                  <div>
                    <div className="da-kv-label">Extraction Engine</div>
                    <div className="da-kv-value" style={{ textTransform: 'uppercase' }}>
                      {viewingDoc.extraction_method === 'gemini' ? 'Gemini AI Vision' : viewingDoc.extraction_method}
                    </div>
                  </div>
                )}
                {viewingDoc.extracted_pin && (
                  <div>
                    <div className="da-kv-label">AutoReg PIN</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_pin}</div>
                  </div>
                )}
                {viewingDoc.extracted_poc_vid && (
                  <div>
                    <div className="da-kv-label">POC VID</div>
                    <div className="da-kv-value da-kv-mono">{viewingDoc.extracted_poc_vid}</div>
                  </div>
                )}
                <div>
                  <div className="da-kv-label">Review Status</div>
                  <div className="da-kv-value">{getDocStatusBadge(viewingDoc).label}</div>
                </div>
                {viewingDoc.rejection_reason && (
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Rejection Reason</div>
                    <div className="da-kv-value" style={{ color: '#B91C1C' }}>
                      {viewingDoc.rejection_reason}
                    </div>
                  </div>
                )}
                {viewingDoc.reviewed_by_agent_name && (
                  <div className="da-kv-item-full">
                    <div className="da-kv-label">Reviewed By Agent</div>
                    <div className="da-kv-value">
                      {viewingDoc.reviewed_by_agent_name}
                      {viewingDoc.reviewed_by_agent_email
                        ? ` (${viewingDoc.reviewed_by_agent_email})`
                        : ''}
                    </div>
                  </div>
                )}
                {viewingDoc.uploaded_at && (
                  <div>
                    <div className="da-kv-label">Submitted Date &amp; Time</div>
                    <div className="da-kv-value da-kv-mono">
                      {formatDateTime(viewingDoc.uploaded_at)}
                    </div>
                  </div>
                )}
                {viewingDoc.reviewed_at && (
                  <div>
                    <div className="da-kv-label">Reviewed Date &amp; Time</div>
                    <div className="da-kv-value da-kv-mono">
                      {formatDateTime(viewingDoc.reviewed_at)}
                    </div>
                  </div>
                )}
              </div>

              {viewingDocUserId && viewingDoc.key !== 'id_document' && (
                <div
                  style={{
                    borderTop: '1px solid var(--dg-border)',
                    paddingTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {!viewingDoc.verified &&
                      (viewingDoc.verification_status || '').toLowerCase() !== 'rejected' && (
                      <button
                        type="button"
                        disabled={Boolean(reviewBusyKey)}
                        className="da-btn da-btn-success"
                        onClick={() =>
                          handleReviewDocument(viewingDocUserId, viewingDoc.key, 'approve')
                        }
                      >
                        {reviewBusyKey === `${viewingDocUserId}:${viewingDoc.key}`
                          ? 'Accepting…'
                          : 'Accept Document'}
                      </button>
                    )}
                    {((viewingDoc.verification_status || '').toLowerCase() !== 'rejected' ||
                      Boolean(viewingDoc.uploaded)) && (
                      <button
                        type="button"
                        disabled={Boolean(reviewBusyKey)}
                        className="da-btn da-btn-danger-outline"
                        onClick={() => {
                          const mKey = `${viewingDocUserId}:modal:${viewingDoc.key}`;
                          if (rejectingDocKey === mKey) {
                            setRejectingDocKey(null);
                            setRejectReasonDraft('');
                          } else {
                            setRejectingDocKey(mKey);
                            setRejectReasonDraft(viewingDoc.rejection_reason || '');
                          }
                        }}
                      >
                        Reject Document
                      </button>
                    )}
                  </div>
                  {rejectingDocKey === `${viewingDocUserId}:modal:${viewingDoc.key}` && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="dg-input"
                        placeholder="Enter rejection reason for rider (required)..."
                        value={rejectReasonDraft}
                        onChange={(e) => setRejectReasonDraft(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                      />
                      <button
                        type="button"
                        disabled={Boolean(reviewBusyKey)}
                        className="da-btn da-btn-danger"
                        onClick={() =>
                          handleReviewDocument(
                            viewingDocUserId,
                            viewingDoc.key,
                            'reject',
                            rejectReasonDraft
                          )
                        }
                      >
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

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
