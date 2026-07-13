import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_CALLCENTER_API_URL ?? 'https://callcenterapi.v3rii.com',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type RoutingAction = 'AiAnswer' | 'TransferToQueue' | 'CreateCallback' | 'PlayMessage' | 'Voicemail' | number;

export interface Company {
  id: number;
  code: string;
  name: string;
  companyType: string;
  legalName?: string | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  timeZoneId: string;
  defaultLanguageCode: string;
  kvkkAnnouncementText?: string | null;
  afterHoursMessage?: string | null;
  isActive: boolean;
}

export interface AuthCompany {
  id: number;
  code: string;
  name: string;
  role?: 'Agent' | 'Supervisor' | 'CompanyAdmin' | null;
}

export interface AuthContext {
  userId: number;
  email: string;
  displayName: string;
  isSuperAdmin: boolean;
  selectedCompanyId?: number | null;
  companies: AuthCompany[];
  selectedRoleName?: string | null;
  permissionCodes?: string[];
}

export interface PermissionDefinition {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  isActive: boolean;
}

export interface CompanyRole {
  id: number;
  companyId: number;
  code: string;
  name: string;
  description?: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  permissionCodes: string[];
}

export type LegacyCompanyRole = 'Agent' | 'Supervisor' | 'CompanyAdmin';

export interface CompanyUser {
  assignmentId: number;
  companyId: number;
  userId: number;
  email: string;
  displayName: string;
  companyRoleId?: number | null;
  companyRoleName?: string | null;
  legacyRole: LegacyCompanyRole;
  isUserActive: boolean;
  isAssignmentActive: boolean;
  createdAtUtc: string;
}

export interface LoginResponse {
  success: boolean;
  requiresCompanySelection: boolean;
  token?: string | null;
  context?: AuthContext | null;
  companies: AuthCompany[];
  message?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  exceptionMessage: string;
  data?: T | null;
  errors: string[];
  statusCode: number;
}

export interface PagedResponse<T> {
  items?: T[];
  data?: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PagedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filterLogic?: 'and' | 'or';
  filters?: Array<{ column: string; operator: string; value: string }>;
}

export interface BusinessHour {
  id: number;
  companyId: number;
  dayOfWeek: number | string;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface CalendarException {
  id: number;
  companyId: number;
  date: string;
  title: string;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  messageOverride?: string | null;
}

export interface Department {
  id: number;
  companyId: number;
  code: string;
  name: string;
  languageCode?: string | null;
  isActive: boolean;
}

export interface RoutingRule {
  id: number;
  companyId: number;
  name: string;
  priority: number;
  isActive: boolean;
  appliesDuringBusinessHours: boolean;
  appliesAfterHours: boolean;
  matchIntent?: string | null;
  matchLanguageCode?: string | null;
  action: RoutingAction;
  targetDepartmentId?: number | null;
  message?: string | null;
}

export interface AiAssistantProfile {
  id: number;
  companyId: number;
  isEnabled: boolean;
  provider: string;
  modelName: string;
  systemInstructions?: string | null;
  greetingMessage?: string | null;
  fallbackMessage?: string | null;
  handoffMessage?: string | null;
  minimumConfidence: number;
  maxFallbackAttempts: number;
  handoffOnHumanRequest: boolean;
  offerCallbackOutsideBusinessHours: boolean;
  includeConversationSummaryOnHandoff: boolean;
  piiRedactionEnabled: boolean;
  handoffDepartmentId?: number | null;
}

export interface DecisionResult {
  companyId: number;
  isBusinessOpen: boolean;
  calendarReason: string;
  action: RoutingAction;
  targetDepartmentId?: number | null;
  message?: string | null;
  matchedRuleId?: number | null;
  decisionReason: string;
  correlationId: string;
}

export interface ConversationLog {
  id: number;
  companyId: number;
  correlationId: string;
  channel: string;
  callerNumberMasked?: string | null;
  languageCode?: string | null;
  intent?: string | null;
  decision: string;
  decisionReason?: string | null;
  transcriptPreview?: string | null;
  startedAtUtc: string;
  endedAtUtc?: string | null;
}

export type QueueDistributionStrategy = 'LongestIdle' | 'RoundRobin' | 'FewestCalls' | 'Random' | number;
export interface CallQueue { id: number; companyId: number; departmentId: number; departmentName: string; code: string; name: string; description?: string | null; priority: number; maxWaitingCalls: number; maxWaitSeconds: number; wrapUpSeconds: number; distributionStrategy: QueueDistributionStrategy; isActive: boolean; activeMemberCount: number; }
export interface QueueMember { id: number; queueId: number; companyUserId: number; userId: number; displayName: string; email: string; skillLevel: number; priority: number; isActive: boolean; }
export interface QueueAgentCandidate { companyUserId: number; userId: number; displayName: string; email: string; role: LegacyCompanyRole; }
export type AgentPresenceStatus = 'Offline' | 'Available' | 'Busy' | 'WrapUp' | 'Break' | number;
export interface AgentPresence { companyUserId: number; userId: number; displayName: string; email: string; status: AgentPresenceStatus; reasonCode?: string | null; statusChangedAtUtc: string; lastHeartbeatAtUtc?: string | null; activeCallCorrelationId?: string | null; }
export type CallSessionStatus = 'Created' | 'Ringing' | 'Queued' | 'Assigned' | 'Connected' | 'WrapUp' | 'Completed' | 'Abandoned' | 'Failed' | number;
export interface CallSession { id: number; companyId: number; correlationId: string; direction: 'Inbound' | 'Outbound' | number; status: CallSessionStatus; channel: string; providerCallId?: string | null; callerNumberMasked?: string | null; calledNumber?: string | null; queueId?: number | null; queueName?: string | null; assignedCompanyUserId?: number | null; assignedAgentName?: string | null; createdAtUtc: string; queuedAtUtc?: string | null; answeredAtUtc?: string | null; endedAtUtc?: string | null; endReason?: string | null; }
export type TransferTargetType = 'SipExtension' | 'ExternalPhoneNumber' | 'ExternalSipUri' | 'NetgsmExtensionOrQueue' | number;
export interface TransferTarget { id: number; companyId: number; queueId: number; queueName: string; companyUserId?: number | null; companyUserName?: string | null; providerConnectionId?: number | null; providerConnectionName?: string | null; code: string; name: string; targetType: TransferTargetType; destination: string; priority: number; ringTimeoutSeconds: number; isFallback: boolean; isActive: boolean; notes?: string | null; }
export interface TransferTargetOptions { queues: Array<{ id: number; code: string; name: string }>; providers: Array<{ id: number; name: string; providerType: string | number }>; agents: Array<{ companyUserId: number; queueId: number; displayName: string; email: string }>; }

function unwrapPaged<T>(response: ApiResponse<PagedResponse<T>>): PagedResponse<T> {
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Liste yüklenemedi');
  }
  return response.data;
}

export const callCenterApi = {
  loginCompanies: () =>
    api
      .post<ApiResponse<PagedResponse<AuthCompany>>>('/api/auth/companies/query', {
        pageNumber: 1,
        pageSize: 100,
        search: '',
        sortBy: 'Name',
        sortDirection: 'asc',
        filterLogic: 'and',
        filters: [],
      })
      .then((x) => {
        if (!x.data.success || !x.data.data) {
          throw new Error(x.data.message || 'Firmalar yüklenemedi');
        }

        return x.data.data.items ?? x.data.data.data ?? [];
      }),
  login: (payload: { email: string; password: string; companyId?: number | null }) =>
    api.post<LoginResponse>('/api/auth/login', payload).then((x) => x.data),
  authContext: (selectedCompanyId?: number | null) =>
    api
      .get<AuthContext>('/api/auth-context', { params: selectedCompanyId ? { selectedCompanyId } : undefined })
      .then((x) => x.data),
  companies: () => api.get<Company[]>('/api/companies').then((x) => x.data),
  createCompany: (payload: Omit<Company, 'id'>) => api.post<Company>('/api/companies', payload).then((x) => x.data),
  updateCompany: (id: number, payload: Omit<Company, 'id'>) =>
    api.put<Company>(`/api/companies/${id}`, payload).then((x) => x.data),
  businessHours: (companyId: number) =>
    api.get<BusinessHour[]>(`/api/companies/${companyId}/business-hours`).then((x) => x.data),
  upsertBusinessHour: (companyId: number, dayOfWeek: number, payload: Omit<BusinessHour, 'id' | 'companyId'>) =>
    api.put<BusinessHour>(`/api/companies/${companyId}/business-hours/${dayOfWeek}`, payload).then((x) => x.data),
  calendarExceptions: (companyId: number) =>
    api.get<CalendarException[]>(`/api/companies/${companyId}/calendar-exceptions`).then((x) => x.data),
  queryCalendarExceptions: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<CalendarException>>>(`/api/companies/${companyId}/calendar-exceptions/query`, request)
      .then((x) => unwrapPaged(x.data)),
  createCalendarException: (companyId: number, payload: Omit<CalendarException, 'id' | 'companyId'>) =>
    api.post<CalendarException>(`/api/companies/${companyId}/calendar-exceptions`, payload).then((x) => x.data),
  deleteCalendarException: (companyId: number, id: number) =>
    api.delete(`/api/companies/${companyId}/calendar-exceptions/${id}`),
  departments: (companyId: number) =>
    api.get<Department[]>(`/api/companies/${companyId}/departments`).then((x) => x.data),
  queryDepartments: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<Department>>>(`/api/companies/${companyId}/departments/query`, request)
      .then((x) => unwrapPaged(x.data)),
  createDepartment: (companyId: number, payload: Omit<Department, 'id' | 'companyId'>) =>
    api.post<Department>(`/api/companies/${companyId}/departments`, payload).then((x) => x.data),
  routingRules: (companyId: number) =>
    api.get<RoutingRule[]>(`/api/companies/${companyId}/routing-rules`).then((x) => x.data),
  queryRoutingRules: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<RoutingRule>>>(`/api/companies/${companyId}/routing-rules/query`, request)
      .then((x) => unwrapPaged(x.data)),
  createRoutingRule: (companyId: number, payload: Omit<RoutingRule, 'id' | 'companyId'>) =>
    api.post<RoutingRule>(`/api/companies/${companyId}/routing-rules`, payload).then((x) => x.data),
  aiAssistantProfile: (companyId: number) =>
    api.get<AiAssistantProfile>(`/api/companies/${companyId}/ai-assistant-profile`).then((x) => x.data),
  updateAiAssistantProfile: (companyId: number, payload: Omit<AiAssistantProfile, 'id' | 'companyId'>) =>
    api.put<AiAssistantProfile>(`/api/companies/${companyId}/ai-assistant-profile`, payload).then((x) => x.data),
  simulate: (payload: {
    companyId: number;
    occurredAt: string;
    languageCode?: string;
    intent?: string;
    callerNumberMasked?: string;
    writeLog: boolean;
  }) => api.post<DecisionResult>('/api/decision/simulate', payload).then((x) => x.data),
  logs: (companyId?: number) =>
    api
      .get<ConversationLog[]>('/api/conversation-logs', { params: companyId ? { companyId } : undefined })
      .then((x) => x.data),
  queryLogs: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<ConversationLog>>>('/api/conversation-logs/query', request, { params: { companyId } })
      .then((x) => unwrapPaged(x.data)),
  permissions: (companyId: number) =>
    api.get<PermissionDefinition[]>(`/api/companies/${companyId}/access/permissions`).then((x) => x.data),
  companyRoles: (companyId: number) =>
    api.get<CompanyRole[]>(`/api/companies/${companyId}/access/roles`).then((x) => x.data),
  queryCompanyRoles: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<CompanyRole>>>(`/api/companies/${companyId}/access/roles/query`, request)
      .then((x) => unwrapPaged(x.data)),
  createCompanyRole: (companyId: number, payload: Omit<CompanyRole, 'id' | 'companyId' | 'isSystemRole'>) =>
    api.post<CompanyRole>(`/api/companies/${companyId}/access/roles`, payload).then((x) => x.data),
  updateCompanyRole: (
    companyId: number,
    roleId: number,
    payload: Omit<CompanyRole, 'id' | 'companyId' | 'isSystemRole'>,
  ) => api.put<CompanyRole>(`/api/companies/${companyId}/access/roles/${roleId}`, payload).then((x) => x.data),
  companyUsers: (companyId: number) =>
    api.get<CompanyUser[]>(`/api/companies/${companyId}/access/users`).then((x) => x.data),
  queryCompanyUsers: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<CompanyUser>>>(`/api/companies/${companyId}/access/users/query`, request)
      .then((x) => unwrapPaged(x.data)),
  createCompanyUser: (
    companyId: number,
    payload: {
      email: string;
      displayName: string;
      password?: string;
      companyRoleId?: number | null;
      legacyRole: LegacyCompanyRole;
      isActive: boolean;
    },
  ) => api.post<CompanyUser>(`/api/companies/${companyId}/access/users`, payload).then((x) => x.data),
  updateCompanyUser: (
    companyId: number,
    assignmentId: number,
    payload: {
      displayName: string;
      password?: string;
      companyRoleId?: number | null;
      legacyRole: LegacyCompanyRole;
      isUserActive: boolean;
      isAssignmentActive: boolean;
    },
  ) => api.put<CompanyUser>(`/api/companies/${companyId}/access/users/${assignmentId}`, payload).then((x) => x.data),
  queryCallQueues: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<CallQueue>>>(`/api/companies/${companyId}/operations/queues/query`, request).then((x) => unwrapPaged(x.data)),
  createCallQueue: (companyId: number, payload: Omit<CallQueue, 'id' | 'companyId' | 'departmentName' | 'activeMemberCount'>) =>
    api.post<CallQueue>(`/api/companies/${companyId}/operations/queues`, payload).then((x) => x.data),
  updateCallQueue: (companyId: number, queueId: number, payload: Omit<CallQueue, 'id' | 'companyId' | 'departmentName' | 'activeMemberCount'>) =>
    api.put<CallQueue>(`/api/companies/${companyId}/operations/queues/${queueId}`, payload).then((x) => x.data),
  deleteCallQueue: (companyId: number, queueId: number) =>
    api.delete(`/api/companies/${companyId}/operations/queues/${queueId}`),
  queueMembers: (companyId: number, queueId: number) =>
    api.get<QueueMember[]>(`/api/companies/${companyId}/operations/queues/${queueId}/members`).then((x) => x.data),
  queueAgentCandidates: (companyId: number) =>
    api.get<QueueAgentCandidate[]>(`/api/companies/${companyId}/operations/queues/agent-candidates`).then((x) => x.data),
  upsertQueueMember: (companyId: number, queueId: number, payload: { companyUserId: number; skillLevel: number; priority: number; isActive: boolean }) =>
    api.post<QueueMember>(`/api/companies/${companyId}/operations/queues/${queueId}/members`, payload).then((x) => x.data),
  deleteQueueMember: (companyId: number, queueId: number, memberId: number) =>
    api.delete(`/api/companies/${companyId}/operations/queues/${queueId}/members/${memberId}`),
  agentPresences: (companyId: number) =>
    api.get<AgentPresence[]>(`/api/companies/${companyId}/operations/agent-presences`).then((x) => x.data),
  updateAgentPresence: (companyId: number, companyUserId: number, status: AgentPresenceStatus, reasonCode?: string) =>
    api.put<AgentPresence>(`/api/companies/${companyId}/operations/agent-presences/${companyUserId}`, { status, reasonCode }).then((x) => x.data),
  queryCallSessions: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<CallSession>>>(`/api/companies/${companyId}/operations/call-sessions/query`, request).then((x) => unwrapPaged(x.data)),
  assignNextAvailableAgent: (companyId: number, sessionId: number) =>
    api.post<CallSession>(`/api/companies/${companyId}/operations/call-sessions/${sessionId}/assign-next-agent`).then((x) => x.data),
  transferTargetOptions: (companyId: number) =>
    api.get<TransferTargetOptions>(`/api/companies/${companyId}/operations/transfer-targets/options`).then((x) => x.data),
  queryTransferTargets: (companyId: number, request: PagedRequest) =>
    api.post<ApiResponse<PagedResponse<TransferTarget>>>(`/api/companies/${companyId}/operations/transfer-targets/query`, request).then((x) => unwrapPaged(x.data)),
  createTransferTarget: (companyId: number, payload: Omit<TransferTarget, 'id' | 'companyId' | 'queueName' | 'companyUserName' | 'providerConnectionName'>) =>
    api.post<TransferTarget>(`/api/companies/${companyId}/operations/transfer-targets`, payload).then((x) => x.data),
  updateTransferTarget: (companyId: number, targetId: number, payload: Omit<TransferTarget, 'id' | 'companyId' | 'queueName' | 'companyUserName' | 'providerConnectionName'>) =>
    api.put<TransferTarget>(`/api/companies/${companyId}/operations/transfer-targets/${targetId}`, payload).then((x) => x.data),
  deleteTransferTarget: (companyId: number, targetId: number) =>
    api.delete(`/api/companies/${companyId}/operations/transfer-targets/${targetId}`),
};
