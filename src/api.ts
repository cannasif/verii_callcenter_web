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
}

export interface LoginResponse {
  success: boolean;
  requiresCompanySelection: boolean;
  token?: string | null;
  context?: AuthContext | null;
  companies: AuthCompany[];
  message?: string | null;
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

export const callCenterApi = {
  loginCompanies: () => api.get<AuthCompany[]>('/api/auth/companies').then((x) => x.data),
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
  createCalendarException: (companyId: number, payload: Omit<CalendarException, 'id' | 'companyId'>) =>
    api.post<CalendarException>(`/api/companies/${companyId}/calendar-exceptions`, payload).then((x) => x.data),
  deleteCalendarException: (companyId: number, id: number) =>
    api.delete(`/api/companies/${companyId}/calendar-exceptions/${id}`),
  departments: (companyId: number) =>
    api.get<Department[]>(`/api/companies/${companyId}/departments`).then((x) => x.data),
  createDepartment: (companyId: number, payload: Omit<Department, 'id' | 'companyId'>) =>
    api.post<Department>(`/api/companies/${companyId}/departments`, payload).then((x) => x.data),
  routingRules: (companyId: number) =>
    api.get<RoutingRule[]>(`/api/companies/${companyId}/routing-rules`).then((x) => x.data),
  createRoutingRule: (companyId: number, payload: Omit<RoutingRule, 'id' | 'companyId'>) =>
    api.post<RoutingRule>(`/api/companies/${companyId}/routing-rules`, payload).then((x) => x.data),
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
};
