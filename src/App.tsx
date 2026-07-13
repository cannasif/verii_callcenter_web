import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Call02Icon,
  Globe02Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons';
import {
  Building2,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cpu,
  Disc3,
  Eye,
  EyeOff,
  Gamepad2,
  GitBranch,
  Globe,
  Headphones,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Orbit,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Phone,
  PhoneForwarded,
  PhoneIncoming,
  Play,
  Plus,
  RefreshCw,
  RadioTower,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Moon,
  UserRound,
  X,
} from 'lucide-react';
import './App.css';
import './app-themes.css';
import callCenterLogo from './assets/v3rii-callcenter.png';
import v3Logo from './assets/v3logo.png';
import { Dashboard } from './components/Dashboard';
import { PagedGrid, type PagedGridColumn } from './components/PagedGrid';
import {
  callCenterApi,
  type AuthContext,
  type AiAssistantProfile,
  type AuthCompany,
  type BusinessHour,
  type CalendarException,
  type CallQueue,
  type CallSession,
  type CallFollowUp,
  type AgentPresence,
  type AgentPresenceStatus,
  type Company,
  type CompanyRole,
  type CompanyUser,
  type ConversationLog,
  type DecisionResult,
  type Department,
  type LegacyCompanyRole,
  type PermissionDefinition,
  type PagedRequest,
  type PagedResponse,
  type RoutingAction,
  type RoutingRule,
  type SpeechLanguage,
  type SpeechProfile,
  type QueueDistributionStrategy,
  type QueueMember,
  type QueueAgentCandidate,
  type TransferTarget,
  type TransferTargetOptions,
  type TransferTargetType,
  type TelephonyProviderConnection,
  type TelephonyOptions,
  type TelephonyProviderType,
  type SipTransport,
  type InboundPhoneNumber,
} from './api';

const dayLabels = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
type AppTheme = 'space' | 'retro' | 'classic';
type AppMode = 'dark' | 'light';
const APP_THEME_STORAGE_KEY = 'v3rii_app_theme';
const APP_MODE_STORAGE_KEY = 'v3rii_app_mode';
const APP_EXPANDED_GROUPS_KEY = 'v3rii_expanded_groups';
const appThemeOptions: { id: AppTheme; label: string }[] = [
  { id: 'space', label: 'Uzay' },
  { id: 'retro', label: 'Retro' },
  { id: 'classic', label: 'Klasik' },
];

function readStoredAppTheme(): AppTheme {
  const value = localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (value === 'space' || value === 'retro' || value === 'classic') return value;
  return 'space';
}

function readStoredAppMode(): AppMode {
  const value = localStorage.getItem(APP_MODE_STORAGE_KEY);
  if (value === 'dark' || value === 'light') return value;
  return 'dark';
}

function hasStoredAccessToken() {
  return Boolean(localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token'));
}

const actionLabels: Record<string, string> = {
  AiAnswer: 'AI cevaplasın',
  TransferToQueue: 'Canlı kuyruğa aktar',
  CreateCallback: 'Geri arama kaydı',
  PlayMessage: 'Mesaj oku',
  Voicemail: 'Sesli mesaj al',
  '0': 'AI cevaplasın',
  '1': 'Canlı kuyruğa aktar',
  '2': 'Geri arama kaydı',
  '3': 'Mesaj oku',
  '4': 'Sesli mesaj al',
};

const loginLanguages = [
  { code: 'tr', label: 'Türkçe', shortLabel: 'TR' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'fr', label: 'Français', shortLabel: 'FR' },
  { code: 'es', label: 'Español', shortLabel: 'ES' },
  { code: 'it', label: 'Italiano', shortLabel: 'IT' },
  { code: 'ar', label: 'العربية', shortLabel: 'AR' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU' },
  { code: 'pt', label: 'Português', shortLabel: 'PT' },
  { code: 'nl', label: 'Nederlands', shortLabel: 'NL' },
] as const;

type LoginLanguageCode = (typeof loginLanguages)[number]['code'];
type SelectOption = { value: string; label: string; helper?: string };
type WorkspaceSection = 'dashboard' | 'company' | 'hours' | 'exceptions' | 'telephony-connections' | 'phone-numbers' | 'departments' | 'queues' | 'transfer-targets' | 'agent-status' | 'rules' | 'ai-profile' | 'speech-profile' | 'simulator' | 'call-sessions' | 'follow-ups' | 'logs' | 'users' | 'roles';
type WorkspaceGroup = 'overview' | 'company-management' | 'telephony' | 'operation' | 'ai-operation' | 'monitoring' | 'access-management';

const defaultExpandedWorkspaceGroups: Record<WorkspaceGroup, boolean> = {
  overview: true,
  'company-management': false,
  telephony: false,
  operation: false,
  'ai-operation': false,
  monitoring: false,
  'access-management': false,
};

function readStoredExpandedGroups(): Record<WorkspaceGroup, boolean> {
  try {
    const raw = localStorage.getItem(APP_EXPANDED_GROUPS_KEY);
    if (!raw) return { ...defaultExpandedWorkspaceGroups };
    const parsed = JSON.parse(raw) as Partial<Record<WorkspaceGroup, boolean>>;
    return { ...defaultExpandedWorkspaceGroups, ...parsed };
  } catch {
    return { ...defaultExpandedWorkspaceGroups };
  }
}

const workspacePaths: Record<WorkspaceSection, string> = {
  dashboard: '/dashboard',
  company: '/company-management/company-profile',
  hours: '/company-management/business-hours',
  exceptions: '/company-management/calendar-exceptions',
  'telephony-connections': '/telephony/connections',
  'phone-numbers': '/telephony/inbound-numbers',
  departments: '/operations/departments',
  queues: '/operations/queues',
  'transfer-targets': '/operations/transfer-targets',
  'agent-status': '/operations/agent-status',
  rules: '/operations/routing-rules',
  'ai-profile': '/ai-operations/assistant-profile',
  'speech-profile': '/ai-operations/speech-profile',
  simulator: '/monitoring/decision-simulator',
  'call-sessions': '/monitoring/call-sessions',
  'follow-ups': '/monitoring/follow-ups',
  logs: '/monitoring/conversation-logs',
  users: '/access-management/users',
  roles: '/access-management/roles',
};

const legacyWorkspacePaths: Partial<Record<string, WorkspaceSection>> = {
  '/firma-yonetimi/firma-karti': 'company',
  '/firma-yonetimi/calisma-saatleri': 'hours',
  '/firma-yonetimi/ozel-gunler': 'exceptions',
  '/operasyon/departman-kuyruklar': 'departments',
  '/operasyon/aktarim-hedefleri': 'transfer-targets',
  '/operasyon/yonlendirme-kurallari': 'rules',
  '/ai-operasyon/asistan-profili': 'ai-profile',
  '/ai-operasyon/konusma-profili': 'speech-profile',
  '/izleme/karar-simulasyonu': 'simulator',
  '/izleme/konusma-loglari': 'logs',
  '/erisim/kullanicilar': 'users',
  '/erisim/roller-yetkiler': 'roles',
};

function getWorkspaceSection(pathname: string): WorkspaceSection {
  return (Object.entries(workspacePaths).find(([, path]) => path === pathname)?.[0] as WorkspaceSection | undefined)
    ?? legacyWorkspacePaths[pathname]
    ?? 'dashboard';
}

const loginTranslations: Record<LoginLanguageCode, {
  brandSuffix: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroText: string;
  serverStatus: string;
  online: string;
  securityProtocol: string;
  active: string;
  title: string;
  subtitle: string;
  company: string;
  companyPlaceholder: string;
  operator: string;
  operatorPlaceholder: string;
  password: string;
  forgotCode: string;
  remember: string;
  submit: string;
  securityNetwork: string;
  language: string;
  required: string;
  emailRequired: string;
  passwordRequired: string;
  companyLoadFailed: string;
  checking: string;
  invalidLogin: string;
  companyRequired: string;
  loginFailed: string;
  loginSuccess: string;
}> = {
  tr: {
    brandSuffix: 'COMMS',
    heroLine1: 'MÜŞTERİ',
    heroLine2: 'İLETİŞİM',
    heroLine3: 'MERKEZİ',
    heroText: 'Temsilci ve yönetici portalına erişmek için firma ve kullanıcı bilgilerinizi doğrulayın.',
    serverStatus: 'ANA SİSTEM DURUMU',
    online: 'ÇEVRİMİÇİ',
    securityProtocol: 'GÜVENLİK PROTOKOLÜ',
    active: 'AKTİF',
    title: 'Sisteme Giriş',
    subtitle: 'Devam etmek için doğrulama sağlayın.',
    company: 'Hedef Modül',
    companyPlaceholder: 'Super admin / modül seçmeden giriş',
    operator: 'Operatör ID / E-Posta',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Güvenlik Kodu',
    forgotCode: 'Anahtarı Yenile',
    remember: 'Bağlantıyı Koru',
    submit: 'Sisteme Bağlan',
    securityNetwork: 'V3RII Güvenlik Ağı © 2026',
    language: 'Dil',
    required: 'E-posta ve şifre zorunlu',
    emailRequired: 'E-posta / operatör ID zorunlu',
    passwordRequired: 'Güvenlik kodu zorunlu',
    companyLoadFailed: 'Firma listesi yüklenemedi',
    checking: 'Giriş kontrol ediliyor',
    invalidLogin: 'E-posta, şifre veya firma seçimi hatalı',
    companyRequired: 'Firma seçimi gerekli',
    loginFailed: 'Giriş yapılamadı',
    loginSuccess: 'Giriş başarılı',
  },
  en: {
    brandSuffix: 'COMMS',
    heroLine1: 'Customer',
    heroLine2: 'Contact',
    heroLine3: 'Center',
    heroText: 'Verify your company and user credentials to access the agent and admin portal.',
    serverStatus: 'SERVER STATUS',
    online: 'ONLINE',
    securityProtocol: 'SECURITY PROTOCOL',
    active: 'ACTIVE',
    title: 'Agent Login',
    subtitle: 'Enter your operator credentials to continue.',
    company: 'Company',
    companyPlaceholder: 'Super admin / continue without company',
    operator: 'Operator ID / Email',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Access Code',
    forgotCode: 'Forgot code',
    remember: 'Remember terminal',
    submit: 'Connect System',
    securityNetwork: 'V3RII Security Network © 2026',
    language: 'Language',
    required: 'Email and password are required',
    emailRequired: 'Operator ID / email is required',
    passwordRequired: 'Access code is required',
    companyLoadFailed: 'Company list could not be loaded',
    checking: 'Checking credentials',
    invalidLogin: 'Email, password or company selection is invalid',
    companyRequired: 'Company selection is required',
    loginFailed: 'Login failed',
    loginSuccess: 'Login successful',
  },
  de: {
    brandSuffix: 'COMMS',
    heroLine1: 'Kunden',
    heroLine2: 'Kontakt',
    heroLine3: 'Zentrum',
    heroText: 'Prüfen Sie Firma und Benutzerangaben, um das Portal zu öffnen.',
    serverStatus: 'SERVERSTATUS',
    online: 'ONLINE',
    securityProtocol: 'SICHERHEIT',
    active: 'AKTIV',
    title: 'Agent Anmeldung',
    subtitle: 'Geben Sie Ihre Zugangsdaten ein.',
    company: 'Firma',
    companyPlaceholder: 'Superadmin / ohne Firma fortfahren',
    operator: 'Operator-ID / E-Mail',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Zugangscode',
    forgotCode: 'Code vergessen',
    remember: 'Terminal merken',
    submit: 'Verbinden',
    securityNetwork: 'V3RII Sicherheitsnetz © 2026',
    language: 'Sprache',
    required: 'E-Mail und Passwort sind erforderlich',
    emailRequired: 'Operator-ID / E-Mail ist erforderlich',
    passwordRequired: 'Zugangscode ist erforderlich',
    companyLoadFailed: 'Firmenliste konnte nicht geladen werden',
    checking: 'Anmeldung wird geprüft',
    invalidLogin: 'E-Mail, Passwort oder Firma ist ungültig',
    companyRequired: 'Firma ist erforderlich',
    loginFailed: 'Anmeldung fehlgeschlagen',
    loginSuccess: 'Anmeldung erfolgreich',
  },
  fr: {
    brandSuffix: 'COMMS',
    heroLine1: 'Centre',
    heroLine2: 'Relation',
    heroLine3: 'Client',
    heroText: 'Vérifiez la société et vos identifiants pour accéder au portail.',
    serverStatus: 'ÉTAT SERVEUR',
    online: 'EN LIGNE',
    securityProtocol: 'SÉCURITÉ',
    active: 'ACTIF',
    title: 'Connexion Agent',
    subtitle: 'Saisissez vos identifiants opérateur.',
    company: 'Société',
    companyPlaceholder: 'Super admin / continuer sans société',
    operator: 'ID opérateur / E-mail',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Code d’accès',
    forgotCode: 'Code oublié',
    remember: 'Mémoriser le terminal',
    submit: 'Se connecter',
    securityNetwork: 'Réseau de sécurité V3RII © 2026',
    language: 'Langue',
    required: 'E-mail et mot de passe obligatoires',
    emailRequired: 'ID opérateur / e-mail obligatoire',
    passwordRequired: 'Code d’accès obligatoire',
    companyLoadFailed: 'Liste des sociétés indisponible',
    checking: 'Vérification en cours',
    invalidLogin: 'E-mail, mot de passe ou société invalide',
    companyRequired: 'Sélection de société requise',
    loginFailed: 'Connexion impossible',
    loginSuccess: 'Connexion réussie',
  },
  es: {
    brandSuffix: 'COMMS',
    heroLine1: 'Centro',
    heroLine2: 'de Contacto',
    heroLine3: 'Cliente',
    heroText: 'Verifique empresa y usuario para acceder al portal.',
    serverStatus: 'SERVIDOR',
    online: 'EN LÍNEA',
    securityProtocol: 'SEGURIDAD',
    active: 'ACTIVO',
    title: 'Acceso Agente',
    subtitle: 'Ingrese sus credenciales de operador.',
    company: 'Empresa',
    companyPlaceholder: 'Super admin / continuar sin empresa',
    operator: 'ID operador / Email',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Código de acceso',
    forgotCode: 'Olvidé el código',
    remember: 'Recordar terminal',
    submit: 'Conectar',
    securityNetwork: 'Red de Seguridad V3RII © 2026',
    language: 'Idioma',
    required: 'Email y contraseña son obligatorios',
    emailRequired: 'ID de operador / email obligatorio',
    passwordRequired: 'Código de acceso obligatorio',
    companyLoadFailed: 'No se pudo cargar la lista de empresas',
    checking: 'Verificando acceso',
    invalidLogin: 'Email, contraseña o empresa inválidos',
    companyRequired: 'Debe seleccionar empresa',
    loginFailed: 'No se pudo iniciar sesión',
    loginSuccess: 'Inicio de sesión correcto',
  },
  it: {
    brandSuffix: 'COMMS',
    heroLine1: 'Centro',
    heroLine2: 'Contatto',
    heroLine3: 'Clienti',
    heroText: 'Verifica azienda e credenziali per accedere al portale.',
    serverStatus: 'STATO SERVER',
    online: 'ONLINE',
    securityProtocol: 'SICUREZZA',
    active: 'ATTIVO',
    title: 'Accesso Agente',
    subtitle: 'Inserisci le credenziali operatore.',
    company: 'Azienda',
    companyPlaceholder: 'Super admin / continua senza azienda',
    operator: 'ID operatore / Email',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Codice accesso',
    forgotCode: 'Codice dimenticato',
    remember: 'Ricorda terminale',
    submit: 'Connetti',
    securityNetwork: 'Rete Sicurezza V3RII © 2026',
    language: 'Lingua',
    required: 'Email e password obbligatorie',
    emailRequired: 'ID operatore / email obbligatoria',
    passwordRequired: 'Codice di accesso obbligatorio',
    companyLoadFailed: 'Elenco aziende non caricato',
    checking: 'Verifica accesso',
    invalidLogin: 'Email, password o azienda non validi',
    companyRequired: 'Selezione azienda obbligatoria',
    loginFailed: 'Accesso non riuscito',
    loginSuccess: 'Accesso riuscito',
  },
  ar: {
    brandSuffix: 'COMMS',
    heroLine1: 'مركز',
    heroLine2: 'تواصل',
    heroLine3: 'العملاء',
    heroText: 'تحقق من الشركة وبيانات المستخدم للوصول إلى البوابة.',
    serverStatus: 'حالة الخادم',
    online: 'متصل',
    securityProtocol: 'بروتوكول الأمان',
    active: 'نشط',
    title: 'دخول الوكيل',
    subtitle: 'أدخل بيانات المشغل للمتابعة.',
    company: 'الشركة',
    companyPlaceholder: 'مدير عام / الدخول بدون شركة',
    operator: 'معرف المشغل / البريد',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'رمز الدخول',
    forgotCode: 'نسيت الرمز',
    remember: 'تذكر الجهاز',
    submit: 'الاتصال بالنظام',
    securityNetwork: 'شبكة أمان V3RII © 2026',
    language: 'اللغة',
    required: 'البريد وكلمة المرور مطلوبان',
    emailRequired: 'معرّف المشغّل / البريد مطلوب',
    passwordRequired: 'رمز الوصول مطلوب',
    companyLoadFailed: 'تعذر تحميل قائمة الشركات',
    checking: 'جار التحقق',
    invalidLogin: 'البريد أو كلمة المرور أو الشركة غير صحيحة',
    companyRequired: 'اختيار الشركة مطلوب',
    loginFailed: 'فشل تسجيل الدخول',
    loginSuccess: 'تم تسجيل الدخول',
  },
  ru: {
    brandSuffix: 'COMMS',
    heroLine1: 'Центр',
    heroLine2: 'связи',
    heroLine3: 'клиентов',
    heroText: 'Подтвердите компанию и учетные данные для доступа.',
    serverStatus: 'СТАТУС СЕРВЕРА',
    online: 'ОНЛАЙН',
    securityProtocol: 'БЕЗОПАСНОСТЬ',
    active: 'АКТИВНО',
    title: 'Вход агента',
    subtitle: 'Введите данные оператора.',
    company: 'Компания',
    companyPlaceholder: 'Суперадмин / без компании',
    operator: 'ID оператора / Email',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Код доступа',
    forgotCode: 'Забыли код',
    remember: 'Запомнить терминал',
    submit: 'Подключиться',
    securityNetwork: 'Сеть безопасности V3RII © 2026',
    language: 'Язык',
    required: 'Email и пароль обязательны',
    emailRequired: 'ID оператора / email обязателен',
    passwordRequired: 'Код доступа обязателен',
    companyLoadFailed: 'Не удалось загрузить компании',
    checking: 'Проверка входа',
    invalidLogin: 'Неверный email, пароль или компания',
    companyRequired: 'Выберите компанию',
    loginFailed: 'Ошибка входа',
    loginSuccess: 'Вход выполнен',
  },
  pt: {
    brandSuffix: 'COMMS',
    heroLine1: 'Centro',
    heroLine2: 'de Contato',
    heroLine3: 'Cliente',
    heroText: 'Verifique empresa e credenciais para acessar o portal.',
    serverStatus: 'STATUS SERVIDOR',
    online: 'ONLINE',
    securityProtocol: 'SEGURANÇA',
    active: 'ATIVO',
    title: 'Login do Agente',
    subtitle: 'Informe suas credenciais.',
    company: 'Empresa',
    companyPlaceholder: 'Super admin / continuar sem empresa',
    operator: 'ID operador / Email',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Código de acesso',
    forgotCode: 'Esqueci o código',
    remember: 'Lembrar terminal',
    submit: 'Conectar',
    securityNetwork: 'Rede de Segurança V3RII © 2026',
    language: 'Idioma',
    required: 'Email e senha são obrigatórios',
    emailRequired: 'ID do operador / e-mail obrigatório',
    passwordRequired: 'Código de acesso obrigatório',
    companyLoadFailed: 'Lista de empresas não carregada',
    checking: 'Verificando acesso',
    invalidLogin: 'Email, senha ou empresa inválidos',
    companyRequired: 'Seleção de empresa obrigatória',
    loginFailed: 'Falha no login',
    loginSuccess: 'Login realizado',
  },
  nl: {
    brandSuffix: 'COMMS',
    heroLine1: 'Klant',
    heroLine2: 'Contact',
    heroLine3: 'Centrum',
    heroText: 'Controleer bedrijf en gebruiker om toegang te krijgen.',
    serverStatus: 'SERVERSTATUS',
    online: 'ONLINE',
    securityProtocol: 'BEVEILIGING',
    active: 'ACTIEF',
    title: 'Agent Login',
    subtitle: 'Voer uw operatorgegevens in.',
    company: 'Bedrijf',
    companyPlaceholder: 'Super admin / doorgaan zonder bedrijf',
    operator: 'Operator ID / E-mail',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Toegangscode',
    forgotCode: 'Code vergeten',
    remember: 'Terminal onthouden',
    submit: 'Verbinden',
    securityNetwork: 'V3RII Beveiligingsnetwerk © 2026',
    language: 'Taal',
    required: 'E-mail en wachtwoord zijn verplicht',
    emailRequired: 'Operator-ID / e-mail is verplicht',
    passwordRequired: 'Toegangscode is verplicht',
    companyLoadFailed: 'Bedrijven konden niet geladen worden',
    checking: 'Login controleren',
    invalidLogin: 'E-mail, wachtwoord of bedrijf ongeldig',
    companyRequired: 'Bedrijfselectie verplicht',
    loginFailed: 'Login mislukt',
    loginSuccess: 'Login succesvol',
  },
};

const emptyCompany = {
  code: '',
  name: '',
  companyType: 'Customer',
  legalName: '',
  taxNumber: '',
  taxOffice: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Türkiye',
  notes: '',
  timeZoneId: 'Europe/Istanbul',
  defaultLanguageCode: 'tr-TR',
  kvkkAnnouncementText: 'Görüşmeler hizmet kalitesi ve işlem güvenliği amacıyla kayıt altına alınabilir.',
  afterHoursMessage: 'Şu anda mesai saatleri dışındayız. Sizi ilk uygun zamanda geri arayacağız.',
  isActive: true,
};

function authCompaniesToCompanies(items: AuthCompany[]): Company[] {
  return items.map((item) => ({
    ...emptyCompany,
    id: item.id,
    code: item.code,
    name: item.name,
  }));
}

function emptyPage<T>(request: PagedRequest): Promise<PagedResponse<T>> {
  return Promise.resolve({
    items: [],
    totalCount: 0,
    pageNumber: request.pageNumber,
    pageSize: request.pageSize,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
}

function defaultAiProfile(companyId: number | null = null): AiAssistantProfile {
  return {
    id: 0,
    companyId: companyId ?? 0,
    isEnabled: false,
    provider: 'OpenAI',
    modelName: 'gpt-4.1-mini',
    apiBaseUrl: 'https://api.openai.com/v1/',
    credentialSecretReference: 'env://OPENAI_API_KEY',
    systemInstructions: '',
    greetingMessage: 'Merhaba, size nasıl yardımcı olabilirim?',
    fallbackMessage: 'Bu konuda net bir yanıt veremiyorum. Sizi bir temsilciye aktarıyorum.',
    handoffMessage: 'Sizi uygun temsilciye aktarıyorum. Lütfen hatta kalın.',
    minimumConfidence: 0.65,
    maxFallbackAttempts: 2,
    handoffOnHumanRequest: true,
    offerCallbackOutsideBusinessHours: true,
    includeConversationSummaryOnHandoff: true,
    piiRedactionEnabled: true,
    handoffDepartmentId: null,
  };
}

function defaultSpeechProfile(companyId: number | null = null): SpeechProfile {
  return { id: 0, companyId: companyId ?? 0, provider: 'AzureSpeech', region: 'westeurope', credentialSecretReference: 'env://AZURE_SPEECH_KEY', languageIdentificationMode: 'AtStart', primaryLocale: 'tr-TR', bargeInEnabled: true, automaticPunctuationEnabled: true, initialSilenceTimeoutMs: 5000, endSilenceTimeoutMs: 800, isActive: true, languages: [] };
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(() => hasStoredAccessToken());
  const [loginCompanies, setLoginCompanies] = useState<AuthCompany[]>([]);
  const [isLoginCompaniesLoading, setIsLoginCompaniesLoading] = useState(false);
  const [expandedWorkspaceGroups, setExpandedWorkspaceGroups] = useState<Record<WorkspaceGroup, boolean>>(() => readStoredExpandedGroups());
  const [navSearch, setNavSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [loginDraft, setLoginDraft] = useState({
    email: 'admin@v3rii.com',
    password: '',
    companyId: '',
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyDraft, setCompanyDraft] = useState(emptyCompany);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([]);
  const [aiProfile, setAiProfile] = useState<AiAssistantProfile>(() => defaultAiProfile());
  const [speechProfile, setSpeechProfile] = useState<SpeechProfile>(() => defaultSpeechProfile());
  const [speechLanguageDraft, setSpeechLanguageDraft] = useState({ locale: 'tr-TR', displayName: 'Türkçe', voiceName: 'tr-TR-EmelNeural', recognitionModel: '', customSpeechEndpointReference: '', phraseHints: '', priority: 100, isActive: true });
  const [isSpeechSaving, setIsSpeechSaving] = useState(false);
  const [isAiProfileLoading, setIsAiProfileLoading] = useState(false);
  const [isAiProfileSaving, setIsAiProfileSaving] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingUserAssignmentId, setEditingUserAssignmentId] = useState<number | null>(null);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isExceptionFormOpen, setIsExceptionFormOpen] = useState(false);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [isQueueFormOpen, setIsQueueFormOpen] = useState(false);
  const [isTransferTargetFormOpen, setIsTransferTargetFormOpen] = useState(false);
  const [isTelephonyConnectionFormOpen, setIsTelephonyConnectionFormOpen] = useState(false);
  const [isInboundNumberFormOpen, setIsInboundNumberFormOpen] = useState(false);
  const [editingTelephonyConnectionId, setEditingTelephonyConnectionId] = useState<number | null>(null);
  const [editingInboundNumberId, setEditingInboundNumberId] = useState<number | null>(null);
  const [telephonyOptions, setTelephonyOptions] = useState<TelephonyOptions>({ connections: [], queues: [] });
  const [editingTransferTargetId, setEditingTransferTargetId] = useState<number | null>(null);
  const [transferTargetOptions, setTransferTargetOptions] = useState<TransferTargetOptions>({ queues: [], providers: [], agents: [] });
  const [editingQueueId, setEditingQueueId] = useState<number | null>(null);
  const [queueMembers, setQueueMembers] = useState<QueueMember[]>([]);
  const [queueMemberCandidates, setQueueMemberCandidates] = useState<QueueAgentCandidate[]>([]);
  const [isQueueMembersLoading, setIsQueueMembersLoading] = useState(false);
  const [agentPresences, setAgentPresences] = useState<AgentPresence[]>([]);
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [savingBusinessHour, setSavingBusinessHour] = useState<number | null>(null);
  const [gridRefreshVersion, setGridRefreshVersion] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => readStoredAppTheme());
  const [appMode, setAppMode] = useState<AppMode>(() => readStoredAppMode());
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [status, setStatus] = useState('Hazır');
  const [loginStatusTone, setLoginStatusTone] = useState<'neutral' | 'info' | 'error' | 'success'>('neutral');
  const [loginFieldErrors, setLoginFieldErrors] = useState({
    company: false,
    email: false,
    password: false,
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isXComingSoonOpen, setIsXComingSoonOpen] = useState(false);
  const [loginLanguage, setLoginLanguage] = useState<LoginLanguageCode>('tr');
  const xComingSoonRef = useRef<HTMLDivElement | null>(null);
  const authBootstrapStartedRef = useRef(false);
  const [exceptionDraft, setExceptionDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: '',
    isClosed: true,
    openTime: '09:00',
    closeTime: '18:00',
    messageOverride: '',
  });
  const [departmentDraft, setDepartmentDraft] = useState({
    code: '',
    name: '',
    languageCode: '',
    isActive: true,
  });
  const [queueDraft, setQueueDraft] = useState({ departmentId: '', code: '', name: '', description: '', priority: 100, maxWaitingCalls: 50, maxWaitSeconds: 300, wrapUpSeconds: 30, distributionStrategy: 'LongestIdle', isActive: true });
  const [queueMemberDraft, setQueueMemberDraft] = useState({ companyUserId: '', skillLevel: 3, priority: 100 });
  const [transferTargetDraft, setTransferTargetDraft] = useState({ queueId: '', companyUserId: '', providerConnectionId: '', code: '', name: '', targetType: 'SipExtension' as TransferTargetType, destination: '', priority: 100, ringTimeoutSeconds: 20, isFallback: false, isActive: true, notes: '' });
  const [telephonyConnectionDraft, setTelephonyConnectionDraft] = useState({ code: '', name: '', providerType: 'Netgsm' as TelephonyProviderType, transport: 'Tls' as SipTransport, sipDomain: '', outboundProxy: '', authUsername: '', credentialSecretReference: '', webhookSigningSecretReference: '', apiBaseUrl: '', requestTimeoutSeconds: 15, recordingEnabled: true, allowInternationalOutbound: false, isActive: true });
  const [inboundNumberDraft, setInboundNumberDraft] = useState({ providerConnectionId: '', defaultQueueId: '', e164Number: '', displayName: '', countryCode: 'TR', defaultLocale: 'tr-TR', acceptInbound: true, acceptInternationalInbound: true, allowOutboundCli: false, isActive: true });
  const [ruleDraft, setRuleDraft] = useState({
    name: '',
    priority: 100,
    isActive: true,
    appliesDuringBusinessHours: true,
    appliesAfterHours: true,
    matchIntent: '',
    matchLanguageCode: '',
    action: 'AiAnswer',
    targetDepartmentId: '',
    message: '',
  });
  const [simulationDraft, setSimulationDraft] = useState({
    occurredAt: new Date().toISOString().slice(0, 16),
    languageCode: 'tr-TR',
    intent: '',
    callerNumberMasked: '+90 *** *** 0000',
    writeLog: true,
  });
  const [roleDraft, setRoleDraft] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    permissionCodes: [] as string[],
  });
  const [userDraft, setUserDraft] = useState({
    email: '',
    displayName: '',
    password: '',
    companyRoleId: '',
    legacyRole: 'Agent' as LegacyCompanyRole,
    isUserActive: true,
    isAssignmentActive: true,
  });
  const activeSection = getWorkspaceSection(location.pathname);
  const hasWorkspacePermission = (permissionCode: string) =>
    authContext?.isSuperAdmin === true || authContext?.permissionCodes?.includes(permissionCode) === true;

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );
  const loginText = loginTranslations[loginLanguage];
  const isLoginRtl = loginLanguage === 'ar';
  const companyOptions = useMemo<SelectOption[]>(
    () => [
      { value: '', label: loginText.companyPlaceholder, helper: 'SUPER ADMIN' },
      ...loginCompanies.map((company) => ({
        value: company.id.toString(),
        label: company.name,
        helper: company.code,
      })),
    ],
    [loginCompanies, loginText.companyPlaceholder],
  );
  const languageOptions = useMemo<SelectOption[]>(
    () => loginLanguages.map((language) => ({
      value: language.code,
      label: `${language.shortLabel} - ${language.label}`,
    })),
    [],
  );
  const allWorkspaceSections = useMemo(
    () => [
      { id: 'dashboard' as const, group: 'overview' as const, permission: 'dashboard.view', title: 'Dashboard', description: 'Operasyon özeti, KPI ve hızlı işlemler', icon: <LayoutDashboard size={16} /> },
      { id: 'company' as const, group: 'company-management' as const, permission: 'company.view', title: 'Firma Kartı', description: 'Ana firma kartı ve yasal bilgiler', icon: <Building2 size={16} /> },
      { id: 'hours' as const, group: 'company-management' as const, permission: 'calendar.view', title: 'Çalışma Saatleri', description: 'Haftalık açık ve kapalı saatler', icon: <Clock3 size={16} /> },
      { id: 'exceptions' as const, group: 'company-management' as const, permission: 'calendar.view', title: 'Özel Günler', description: 'Tatil, yarım gün ve kapalı günler', icon: <CalendarDays size={16} /> },
      { id: 'telephony-connections' as const, group: 'telephony' as const, permission: 'telephony.view', title: 'Telefon Bağlantıları', description: 'Netgsm, SIP trunk ve dış arama politikası', icon: <RadioTower size={16} /> },
      { id: 'phone-numbers' as const, group: 'telephony' as const, permission: 'telephony.view', title: 'Gelen Numaralar', description: 'DID, ülke, dil ve kuyruk eşleştirmesi', icon: <PhoneIncoming size={16} /> },
      { id: 'departments' as const, group: 'operation' as const, permission: 'departments.view', title: 'Departman ve Kuyruklar', description: 'Ekip, kuyruk ve dil tanımları', icon: <Headphones size={16} /> },
      { id: 'queues' as const, group: 'operation' as const, permission: 'queues.view', title: 'Çağrı Kuyrukları', description: 'Kapasite, dağıtım ve bekleme politikaları', icon: <History size={16} /> },
      { id: 'transfer-targets' as const, group: 'operation' as const, permission: 'transfer-targets.view', title: 'Aktarım Hedefleri', description: 'SIP dahili, cep telefonu ve harici santral', icon: <PhoneForwarded size={16} /> },
      { id: 'agent-status' as const, group: 'operation' as const, permission: 'agent-status.view', title: 'Temsilci Durumları', description: 'Uygunluk, çağrı ve mola durumları', icon: <UserRound size={16} /> },
      { id: 'rules' as const, group: 'operation' as const, permission: 'routing.view', title: 'Yönlendirme Kuralları', description: 'AI, canlı aktarım ve aksiyonlar', icon: <GitBranch size={16} /> },
      { id: 'ai-profile' as const, group: 'ai-operation' as const, permission: 'ai.view', title: 'AI Asistan Profili', description: 'Yanıt, güven ve temsilciye devir politikası', icon: <Bot size={16} /> },
      { id: 'speech-profile' as const, group: 'ai-operation' as const, permission: 'speech.view', title: 'Konuşma ve Diller', description: 'STT, TTS, dil, aksan ve ses profilleri', icon: <Globe size={16} /> },
      { id: 'simulator' as const, group: 'monitoring' as const, permission: 'simulator.execute', title: 'Karar Simülasyonu', description: 'Kural sonucunu test et', icon: <Play size={16} /> },
      { id: 'call-sessions' as const, group: 'monitoring' as const, permission: 'calls.view', title: 'Çağrı Oturumları', description: 'Aktif ve tamamlanan çağrı yaşam döngüsü', icon: <Headphones size={16} /> },
      { id: 'follow-ups' as const, group: 'monitoring' as const, permission: 'calls.view', title: 'Geri Arama ve Mesajlar', description: 'Bekleyen geri arama ve sesli mesaj işleri', icon: <PhoneIncoming size={16} /> },
      { id: 'logs' as const, group: 'monitoring' as const, permission: 'logs.view', title: 'Konuşma Logları', description: 'Çağrı karar kayıtları', icon: <History size={16} /> },
      { id: 'users' as const, group: 'access-management' as const, permission: 'users.view', title: 'Firma Kullanıcıları', description: 'Kullanıcı ve firma rolü atamaları', icon: <UserRound size={16} /> },
      { id: 'roles' as const, group: 'access-management' as const, permission: 'roles.view', title: 'Roller ve Yetkiler', description: 'Rol bazlı modül ve işlem izinleri', icon: <ShieldCheck size={16} /> },
    ],
    [],
  );
  const workspaceSections = useMemo(
    () => allWorkspaceSections.filter((section) =>
      section.id === 'dashboard'
      || authContext?.isSuperAdmin
      || authContext?.permissionCodes?.includes(section.permission)),
    [allWorkspaceSections, authContext],
  );
  const workspaceGroups = useMemo(
    () => [
      { id: 'overview' as const, title: 'Genel Bakış', icon: <LayoutDashboard size={18} /> },
      { id: 'company-management' as const, title: 'Firma Yönetimi', icon: <Building2 size={18} /> },
      { id: 'telephony' as const, title: 'Telefon Altyapısı', icon: <RadioTower size={18} /> },
      { id: 'operation' as const, title: 'Operasyon Tanımları', icon: <SlidersHorizontal size={18} /> },
      { id: 'ai-operation' as const, title: 'AI Operasyon', icon: <Bot size={18} /> },
      { id: 'monitoring' as const, title: 'İzleme ve Test', icon: <History size={18} /> },
      { id: 'access-management' as const, title: 'Erişim Yönetimi', icon: <ShieldCheck size={18} /> },
    ],
    [],
  );
  const activeWorkspaceSection = workspaceSections.find((section) => section.id === activeSection) ?? workspaceSections[0] ?? allWorkspaceSections[0];
  const exceptionGridColumns = useMemo<PagedGridColumn<CalendarException>[]>(() => [
    { key: 'date', label: 'Tarih', sortKey: 'Date', width: '120px', render: (row) => new Date(`${row.date}T00:00:00`).toLocaleDateString('tr-TR') },
    { key: 'title', label: 'Başlık', sortKey: 'Title', render: (row) => <strong>{row.title}</strong> },
    { key: 'status', label: 'Durum', sortKey: 'IsClosed', width: '120px', render: (row) => <span className={row.isClosed ? 'data-badge closed' : 'data-badge open'}>{row.isClosed ? 'Kapalı' : 'Özel saat'}</span> },
    { key: 'hours', label: 'Saat', width: '130px', render: (row) => row.isClosed ? '-' : `${row.openTime?.slice(0, 5)} - ${row.closeTime?.slice(0, 5)}` },
  ], []);
  const departmentGridColumns = useMemo<PagedGridColumn<Department>[]>(() => [
    { key: 'code', label: 'Kod', sortKey: 'Code', width: '110px', render: (row) => <span className="mono-cell">{row.code}</span> },
    { key: 'name', label: 'Departman / Kuyruk', sortKey: 'Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'language', label: 'Dil', sortKey: 'LanguageCode', width: '100px', render: (row) => row.languageCode ?? '-' },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '110px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const ruleGridColumns = useMemo<PagedGridColumn<RoutingRule>[]>(() => [
    { key: 'priority', label: 'Öncelik', sortKey: 'Priority', width: '90px', render: (row) => <span className="mono-cell">#{row.priority}</span> },
    { key: 'name', label: 'Kural', sortKey: 'Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'intent', label: 'Intent', width: '130px', render: (row) => row.matchIntent ?? '-' },
    { key: 'action', label: 'Aksiyon', sortKey: 'Action', width: '160px', render: (row) => <span className="data-badge info">{actionLabels[String(row.action)] ?? String(row.action)}</span> },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const logGridColumns = useMemo<PagedGridColumn<ConversationLog>[]>(() => [
    { key: 'started', label: 'Başlangıç', sortKey: 'StartedAtUtc', width: '170px', render: (row) => new Date(row.startedAtUtc).toLocaleString('tr-TR') },
    { key: 'channel', label: 'Kanal', sortKey: 'Channel', width: '90px', render: (row) => row.channel },
    { key: 'intent', label: 'Intent', sortKey: 'Intent', width: '130px', render: (row) => row.intent ?? '-' },
    { key: 'decision', label: 'Karar', sortKey: 'Decision', width: '150px', render: (row) => <span className="data-badge info">{row.decision}</span> },
    { key: 'reason', label: 'Karar nedeni', render: (row) => row.decisionReason ?? '-' },
  ], []);
  const userGridColumns = useMemo<PagedGridColumn<CompanyUser>[]>(() => [
    { key: 'user', label: 'Kullanıcı', sortKey: 'DisplayName', render: (row) => <span className="primary-cell"><strong>{row.displayName}</strong><small>{row.email}</small></span> },
    { key: 'role', label: 'Firma rolü', sortKey: 'Role', width: '180px', render: (row) => row.companyRoleName ?? row.legacyRole },
    { key: 'task', label: 'Görev tipi', width: '130px', render: (row) => row.legacyRole },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '120px', render: (row) => <span className={row.isUserActive && row.isAssignmentActive ? 'data-badge active' : 'data-badge'}>{row.isUserActive && row.isAssignmentActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const roleGridColumns = useMemo<PagedGridColumn<CompanyRole>[]>(() => [
    { key: 'role', label: 'Rol', sortKey: 'Name', render: (row) => <span className="primary-cell"><strong>{row.name}</strong><small>{row.code}</small></span> },
    { key: 'permissions', label: 'İzin', width: '90px', align: 'center', render: (row) => <span className="data-count">{row.permissionCodes.length}</span> },
    { key: 'type', label: 'Tip', sortKey: 'IsSystemRole', width: '120px', render: (row) => row.isSystemRole ? 'Sistem rolü' : 'Firma rolü' },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const queueGridColumns = useMemo<PagedGridColumn<CallQueue>[]>(() => [
    { key: 'priority', label: 'Öncelik', sortKey: 'Priority', width: '90px', render: (row) => <span className="mono-cell">#{row.priority}</span> },
    { key: 'queue', label: 'Kuyruk', sortKey: 'Name', render: (row) => <span className="primary-cell"><strong>{row.name}</strong><small>{row.code} · {row.departmentName}</small></span> },
    { key: 'strategy', label: 'Dağıtım', sortKey: 'DistributionStrategy', width: '150px', render: (row) => String(row.distributionStrategy) },
    { key: 'capacity', label: 'Kapasite', sortKey: 'MaxWaitingCalls', width: '110px', render: (row) => `${row.maxWaitingCalls} çağrı` },
    { key: 'members', label: 'Temsilci', width: '100px', align: 'center', render: (row) => <span className="data-count">{row.activeMemberCount}</span> },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const callSessionGridColumns = useMemo<PagedGridColumn<CallSession>[]>(() => [
    { key: 'created', label: 'Başlangıç', sortKey: 'CreatedAtUtc', width: '170px', render: (row) => new Date(row.createdAtUtc).toLocaleString('tr-TR') },
    { key: 'correlation', label: 'Çağrı', render: (row) => <span className="primary-cell"><strong>{row.callerNumberMasked ?? 'Numara gizli'}</strong><small>{row.correlationId.slice(0, 12)}</small></span> },
    { key: 'direction', label: 'Yön', sortKey: 'Direction', width: '110px', render: (row) => row.isInternationalCaller ? <span className="data-badge info">Yurt dışı</span> : String(row.direction) === 'Inbound' || row.direction === 0 ? 'Gelen' : 'Giden' },
    { key: 'queue', label: 'Kuyruk', width: '150px', render: (row) => row.queueName ?? '-' },
    { key: 'agent', label: 'Temsilci', width: '160px', render: (row) => row.assignedAgentName ?? '-' },
    { key: 'language', label: 'Dil', width: '90px', render: (row) => row.detectedLocale ?? row.initialLocale ?? '-' },
    { key: 'runtime', label: 'Canlı durum', width: '130px', render: (row) => <span className={String(row.runtimeStatus) === 'Faulted' ? 'data-badge' : 'data-badge info'}>{String(row.runtimeStatus)}</span> },
    { key: 'status', label: 'Oturum', sortKey: 'Status', width: '110px', render: (row) => <span className="data-badge info">{String(row.status)}</span> },
  ], []);
  const followUpGridColumns = useMemo<PagedGridColumn<CallFollowUp>[]>(() => [
    { key: 'requested', label: 'Talep zamanı', sortKey: 'RequestedAtUtc', width: '170px', render: (row) => new Date(row.requestedAtUtc).toLocaleString('tr-TR') },
    { key: 'caller', label: 'Arayan', render: (row) => <span className="primary-cell"><strong>{row.callerNumberMasked ?? 'Numara gizli'}</strong><small>{row.correlationId.slice(0, 12)} · {row.locale ?? '-'}</small></span> },
    { key: 'type', label: 'İş türü', sortKey: 'Type', width: '120px', render: (row) => String(row.type) === 'Callback' || row.type === 0 ? 'Geri arama' : 'Sesli mesaj' },
    { key: 'summary', label: 'Konuşma özeti', render: (row) => row.requestSummary ? <span className="line-clamp-cell">{row.requestSummary}</span> : '-' },
    { key: 'agent', label: 'Atanan', width: '150px', render: (row) => row.assignedAgentName ?? '-' },
    { key: 'status', label: 'Durum', sortKey: 'Status', width: '120px', render: (row) => <span className={String(row.status) === 'Completed' ? 'data-badge active' : 'data-badge info'}>{String(row.status)}</span> },
  ], []);
  const telephonyConnectionGridColumns = useMemo<PagedGridColumn<TelephonyProviderConnection>[]>(() => [
    { key: 'connection', label: 'Bağlantı', sortKey: 'Name', render: (row) => <span className="primary-cell"><strong>{row.name}</strong><small>{row.code} · {String(row.providerType)}</small></span> },
    { key: 'transport', label: 'Taşıma', sortKey: 'Transport', width: '100px', render: (row) => String(row.transport).toUpperCase() },
    { key: 'endpoint', label: 'SIP / Proxy', width: '210px', render: (row) => row.sipDomain ?? row.outboundProxy ?? '-' },
    { key: 'numbers', label: 'Numara', width: '90px', align: 'center', render: (row) => <span className="data-count">{row.phoneNumberCount}</span> },
    { key: 'international', label: 'Yurt dışı çıkış', width: '130px', render: (row) => <span className={row.allowInternationalOutbound ? 'data-badge active' : 'data-badge'}>{row.allowInternationalOutbound ? 'İzinli' : 'Kapalı'}</span> },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const inboundNumberGridColumns = useMemo<PagedGridColumn<InboundPhoneNumber>[]>(() => [
    { key: 'number', label: 'Gelen numara', sortKey: 'DisplayName', render: (row) => <span className="primary-cell"><strong>{row.displayName}</strong><small>{row.e164Number} · {row.countryCode ?? '-'}</small></span> },
    { key: 'provider', label: 'Bağlantı', width: '170px', render: (row) => row.providerName },
    { key: 'queue', label: 'Varsayılan kuyruk', width: '170px', render: (row) => row.defaultQueueName ?? 'Kural motoru' },
    { key: 'locale', label: 'Başlangıç dili', sortKey: 'DefaultLocale', width: '120px', render: (row) => <span className="mono-cell">{row.defaultLocale}</span> },
    { key: 'international', label: 'Yurt dışı gelen', width: '130px', render: (row) => <span className={row.acceptInternationalInbound ? 'data-badge active' : 'data-badge'}>{row.acceptInternationalInbound ? 'Kabul' : 'Engelli'}</span> },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive && row.acceptInbound ? 'data-badge active' : 'data-badge'}>{row.isActive && row.acceptInbound ? 'Aktif' : 'Pasif'}</span> },
  ], []);
  const transferTargetGridColumns = useMemo<PagedGridColumn<TransferTarget>[]>(() => [
    { key: 'priority', label: 'Öncelik', sortKey: 'Priority', width: '90px', render: (row) => <span className="mono-cell">#{row.priority}</span> },
    { key: 'target', label: 'Aktarım hedefi', sortKey: 'Name', render: (row) => <span className="primary-cell"><strong>{row.name}</strong><small>{row.code} · {row.destination}</small></span> },
    { key: 'queue', label: 'Kuyruk', width: '160px', render: (row) => row.queueName },
    { key: 'type', label: 'Tür', sortKey: 'TargetType', width: '170px', render: (row) => ({ SipExtension: 'SIP dahili', ExternalPhoneNumber: 'Cep / sabit', ExternalSipUri: 'Harici santral', NetgsmExtensionOrQueue: 'Netsantral' }[String(row.targetType)] ?? String(row.targetType)) },
    { key: 'agent', label: 'Temsilci', width: '150px', render: (row) => row.companyUserName ?? 'Kuyruk hedefi' },
    { key: 'timeout', label: 'Çalma', sortKey: 'RingTimeoutSeconds', width: '90px', render: (row) => `${row.ringTimeoutSeconds} sn` },
    { key: 'status', label: 'Durum', sortKey: 'IsActive', width: '100px', render: (row) => <span className={row.isActive ? 'data-badge active' : 'data-badge'}>{row.isActive ? 'Aktif' : 'Pasif'}</span> },
  ], []);

  function selectWorkspaceSection(section: WorkspaceSection) {
    const definition = workspaceSections.find((item) => item.id === section);
    if (definition) {
      setExpandedWorkspaceGroups((groups) => ({ ...groups, [definition.group]: true }));
    }
    setNavSearch('');
    navigate(workspacePaths[section]);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
    if (token) {
      if (!authBootstrapStartedRef.current) {
        authBootstrapStartedRef.current = true;
        void bootstrap();
      }
      return;
    }

    authBootstrapStartedRef.current = false;
    setIsAuthBootstrapping(false);
    setIsLoginCompaniesLoading(true);
    void callCenterApi.loginCompanies()
      .then(setLoginCompanies)
      .catch(() => {
        setLoginCompanies([]);
        setLoginStatusTone('error');
        setStatus(loginText.companyLoadFailed);
      })
      .finally(() => setIsLoginCompaniesLoading(false));
  }, [loginText.companyLoadFailed]);

  useEffect(() => {
    if (!selectedCompanyId || !authContext) return;
    void refreshCompanyData(selectedCompanyId, authContext);
  }, [selectedCompanyId, authContext]);

  useEffect(() => {
    if (!authContext) return;
    if (location.pathname === '/' || location.pathname === '') {
      navigate(workspacePaths.dashboard, { replace: true });
      return;
    }
    if (workspaceSections.some((section) => section.id === activeSection)) return;
    const firstSection = workspaceSections[0];
    if (firstSection) {
      navigate(workspacePaths[firstSection.id], { replace: true });
    }
  }, [activeSection, authContext, location.pathname, navigate, workspaceSections]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeSection, authContext?.userId]);

  useEffect(() => {
    if (activeSection !== 'agent-status' || !selectedCompanyId ||
      !(authContext?.isSuperAdmin || authContext?.permissionCodes?.includes('agent-status.view'))) return;
    void callCenterApi.agentPresences(selectedCompanyId).then(setAgentPresences).catch(() => setAgentPresences([]));
  }, [activeSection, selectedCompanyId, gridRefreshVersion, authContext]);

  useEffect(() => {
    const legacySection = legacyWorkspacePaths[location.pathname];
    if (legacySection) {
      navigate(workspacePaths[legacySection], { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isXComingSoonOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!xComingSoonRef.current?.contains(event.target as Node)) {
        setIsXComingSoonOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isXComingSoonOpen]);

  useEffect(() => {
    localStorage.setItem(APP_THEME_STORAGE_KEY, appTheme);
  }, [appTheme]);

  useEffect(() => {
    localStorage.setItem(APP_MODE_STORAGE_KEY, appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem(APP_EXPANDED_GROUPS_KEY, JSON.stringify(expandedWorkspaceGroups));
  }, [expandedWorkspaceGroups]);

  useEffect(() => {
    if (!selectedCompany) return;
    setCompanyDraft({
      code: selectedCompany.code,
      name: selectedCompany.name,
      companyType: selectedCompany.companyType ?? 'Customer',
      legalName: selectedCompany.legalName ?? '',
      taxNumber: selectedCompany.taxNumber ?? '',
      taxOffice: selectedCompany.taxOffice ?? '',
      email: selectedCompany.email ?? '',
      phone: selectedCompany.phone ?? '',
      address: selectedCompany.address ?? '',
      city: selectedCompany.city ?? '',
      country: selectedCompany.country ?? '',
      notes: selectedCompany.notes ?? '',
      timeZoneId: selectedCompany.timeZoneId,
      defaultLanguageCode: selectedCompany.defaultLanguageCode,
      kvkkAnnouncementText: selectedCompany.kvkkAnnouncementText ?? '',
      afterHoursMessage: selectedCompany.afterHoursMessage ?? '',
      isActive: selectedCompany.isActive,
    });
  }, [selectedCompany]);

  async function bootstrap() {
    setIsAuthBootstrapping(true);
    setLoginStatusTone('info');
    setStatus('Oturum bağlamı yükleniyor');
    try {
      const context = await callCenterApi.authContext();
      setAuthContext(context);
      setSelectedCompanyId(context.selectedCompanyId ?? context.companies[0]?.id ?? null);
      await refreshCompanies(context, true);
      setStatus('Hazır');
    } catch {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      setAuthContext(null);
      setCompanies([]);
      setSelectedCompanyId(null);
      setLoginStatusTone('error');
      setStatus('Oturum süresi doldu, tekrar giriş yapın');
      setIsLoginCompaniesLoading(true);
      void callCenterApi.loginCompanies()
        .then(setLoginCompanies)
        .catch(() => {
          setLoginCompanies([]);
          setStatus(loginText.companyLoadFailed);
        })
        .finally(() => setIsLoginCompaniesLoading(false));
    } finally {
      setIsAuthBootstrapping(false);
    }
  }

  function clearLoginFieldError(field: 'company' | 'email' | 'password') {
    setLoginFieldErrors((current) => (current[field] ? { ...current, [field]: false } : current));
  }

  async function login(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const emailEmpty = !loginDraft.email.trim();
    const passwordEmpty = !loginDraft.password.trim();
    if (emailEmpty || passwordEmpty) {
      setLoginFieldErrors({
        company: false,
        email: emailEmpty,
        password: passwordEmpty,
      });
      setLoginStatusTone('error');
      setStatus(
        emailEmpty && passwordEmpty
          ? loginText.required
          : emailEmpty
            ? loginText.emailRequired
            : loginText.passwordRequired,
      );
      return;
    }

    let response;
    const loginStartedAt = performance.now();
    try {
      setLoginFieldErrors({ company: false, email: false, password: false });
      setLoginStatusTone('info');
      setStatus(loginText.checking);
      response = await callCenterApi.login({
        email: loginDraft.email,
        password: loginDraft.password,
        companyId: loginDraft.companyId ? Number(loginDraft.companyId) : null,
      });
    } catch {
      setLoginFieldErrors({ company: false, email: true, password: true });
      setLoginStatusTone('error');
      setStatus(loginText.invalidLogin);
      return;
    }

    if (response.requiresCompanySelection) {
      setLoginCompanies(response.companies);
      setLoginDraft((draft) => ({ ...draft, companyId: draft.companyId || response.companies[0]?.id.toString() || '' }));
      setLoginFieldErrors({ company: true, email: false, password: false });
      setLoginStatusTone('error');
      setStatus(response.message ?? loginText.companyRequired);
      return;
    }

    if (!response.success || !response.token || !response.context) {
      const needsCompany = Boolean(response.message?.toLocaleLowerCase('tr-TR').includes('firma'));
      setLoginFieldErrors({
        company: needsCompany,
        email: true,
        password: true,
      });
      setLoginStatusTone('error');
      setStatus(response.message ?? loginText.loginFailed);
      return;
    }

    localStorage.setItem('access_token', response.token);
    setAuthContext(response.context);
    setSelectedCompanyId(response.context.selectedCompanyId ?? response.context.companies[0]?.id ?? null);
    setCompanies(authCompaniesToCompanies(response.context.companies));
    setLoginCompanies([]);
    setLoginFieldErrors({ company: false, email: false, password: false });
    setLoginStatusTone('success');
    setStatus(`${loginText.loginSuccess} (${Math.round(performance.now() - loginStartedAt)} ms)`);
    void refreshCompanies(response.context, true);
  }

  function logout() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    authBootstrapStartedRef.current = false;
    setIsAuthBootstrapping(false);
    setAuthContext(null);
    setCompanies([]);
    setSelectedCompanyId(null);
    setBusinessHours([]);
    setDepartments([]);
    setPermissions([]);
    setCompanyRoles([]);
    setDecision(null);
    setStatus('Çıkış yapıldı');
  }

  async function refreshCompanies(context = authContext, silent = false) {
    if (!silent) {
      setStatus('Firmalar yükleniyor');
    }
    const data = await callCenterApi.companies();
    setCompanies(data);
    setSelectedCompanyId((current) => current ?? context?.selectedCompanyId ?? data[0]?.id ?? null);
    if (!silent) {
      setStatus('Hazır');
    }
  }

  async function refreshCompanyData(companyId: number, context = authContext) {
    setStatus('Firma kuralları yükleniyor');
    const can = (permission: string) => context?.isSuperAdmin || context?.permissionCodes?.includes(permission);
    setIsAiProfileLoading(can('ai.view') ?? false);
    const [hoursData, departmentData, permissionData, roleData, aiProfileData, speechProfileData] = await Promise.all([
      can('calendar.view') ? callCenterApi.businessHours(companyId) : Promise.resolve([]),
      can('departments.view') ? callCenterApi.departments(companyId) : Promise.resolve([]),
      can('roles.view') ? callCenterApi.permissions(companyId) : Promise.resolve([]),
      can('roles.view') || can('users.manage') ? callCenterApi.companyRoles(companyId) : Promise.resolve([]),
      can('ai.view') ? callCenterApi.aiAssistantProfile(companyId) : Promise.resolve(defaultAiProfile(companyId)),
      can('speech.view') ? callCenterApi.speechProfile(companyId) : Promise.resolve(defaultSpeechProfile(companyId)),
    ]);
    setBusinessHours(hoursData);
    setDepartments(departmentData);
    setPermissions(permissionData);
    setCompanyRoles(roleData);
    setAiProfile(aiProfileData);
    setSpeechProfile(speechProfileData);
    setIsAiProfileLoading(false);
    setStatus('Hazır');
  }

  async function saveAiProfile() {
    if (!selectedCompanyId || !hasWorkspacePermission('ai.manage')) return;
    setIsAiProfileSaving(true);
    setStatus('AI asistan profili kaydediliyor');
    try {
      const saved = await callCenterApi.updateAiAssistantProfile(selectedCompanyId, {
        isEnabled: aiProfile.isEnabled,
        provider: aiProfile.provider,
        modelName: aiProfile.modelName,
        apiBaseUrl: aiProfile.apiBaseUrl,
        credentialSecretReference: aiProfile.credentialSecretReference,
        systemInstructions: aiProfile.systemInstructions || null,
        greetingMessage: aiProfile.greetingMessage || null,
        fallbackMessage: aiProfile.fallbackMessage || null,
        handoffMessage: aiProfile.handoffMessage || null,
        minimumConfidence: Number(aiProfile.minimumConfidence),
        maxFallbackAttempts: Number(aiProfile.maxFallbackAttempts),
        handoffOnHumanRequest: aiProfile.handoffOnHumanRequest,
        offerCallbackOutsideBusinessHours: aiProfile.offerCallbackOutsideBusinessHours,
        includeConversationSummaryOnHandoff: aiProfile.includeConversationSummaryOnHandoff,
        piiRedactionEnabled: aiProfile.piiRedactionEnabled,
        handoffDepartmentId: aiProfile.handoffDepartmentId || null,
      });
      setAiProfile(saved);
      setStatus('AI asistan profili kaydedildi');
    } catch {
      setStatus('AI asistan profili kaydedilemedi');
    } finally {
      setIsAiProfileSaving(false);
    }
  }

  async function completeFollowUp(item: CallFollowUp) {
    if (!selectedCompanyId || !hasWorkspacePermission('calls.manage')) return;
    const note = window.prompt('Tamamlama notu (isteğe bağlı)', item.resolutionNote ?? '');
    if (note === null) return;
    try {
      await callCenterApi.updateCallFollowUp(selectedCompanyId, item.id, {
        status: 'Completed',
        assignedCompanyUserId: item.assignedCompanyUserId ?? null,
        resolutionNote: note || null,
      });
      setGridRefreshVersion((version) => version + 1);
      setStatus('Takip işi tamamlandı');
    } catch {
      setStatus('Takip işi güncellenemedi');
    }
  }

  async function saveSpeechProfile() {
    if (!selectedCompanyId || !hasWorkspacePermission('speech.manage')) return;
    setIsSpeechSaving(true);
    setStatus('Konuşma profili kaydediliyor');
    try {
      const saved = await callCenterApi.updateSpeechProfile(selectedCompanyId, {
        provider: speechProfile.provider,
        region: speechProfile.region,
        credentialSecretReference: speechProfile.credentialSecretReference,
        languageIdentificationMode: speechProfile.languageIdentificationMode,
        primaryLocale: speechProfile.primaryLocale,
        bargeInEnabled: speechProfile.bargeInEnabled,
        automaticPunctuationEnabled: speechProfile.automaticPunctuationEnabled,
        initialSilenceTimeoutMs: Number(speechProfile.initialSilenceTimeoutMs),
        endSilenceTimeoutMs: Number(speechProfile.endSilenceTimeoutMs),
        isActive: speechProfile.isActive,
      });
      setSpeechProfile(saved);
      setStatus('Konuşma profili kaydedildi');
    } catch {
      setStatus('Konuşma profili kaydedilemedi');
    } finally {
      setIsSpeechSaving(false);
    }
  }

  async function addSpeechLanguage() {
    if (!selectedCompanyId || !speechProfile.id || !hasWorkspacePermission('speech.manage')) return;
    setIsSpeechSaving(true);
    try {
      const saved = await callCenterApi.addSpeechLanguage(selectedCompanyId, {
        locale: speechLanguageDraft.locale,
        displayName: speechLanguageDraft.displayName,
        voiceName: speechLanguageDraft.voiceName,
        recognitionModel: speechLanguageDraft.recognitionModel || null,
        customSpeechEndpointReference: speechLanguageDraft.customSpeechEndpointReference || null,
        phraseHints: speechLanguageDraft.phraseHints || null,
        priority: Number(speechLanguageDraft.priority),
        isActive: speechLanguageDraft.isActive,
      });
      setSpeechProfile((current) => ({ ...current, languages: [...current.languages.filter((language) => language.locale !== saved.locale), saved].sort((a, b) => a.priority - b.priority) }));
      setSpeechLanguageDraft((current) => ({ ...current, locale: '', displayName: '', voiceName: '', recognitionModel: '', customSpeechEndpointReference: '', phraseHints: '', priority: current.priority + 100 }));
      setStatus('Dil profili eklendi');
    } catch {
      setStatus('Dil profili eklenemedi');
    } finally {
      setIsSpeechSaving(false);
    }
  }

  async function deleteSpeechLanguage(language: SpeechLanguage) {
    if (!selectedCompanyId || !hasWorkspacePermission('speech.manage') || !window.confirm(`${language.displayName} dil profilini silmek istiyor musunuz?`)) return;
    setIsSpeechSaving(true);
    try {
      await callCenterApi.deleteSpeechLanguage(selectedCompanyId, language.id);
      setSpeechProfile((current) => ({ ...current, languages: current.languages.filter((item) => item.id !== language.id) }));
      setStatus('Dil profili silindi');
    } finally {
      setIsSpeechSaving(false);
    }
  }

  async function selectCompany(companyId: number) {
    setStatus('Firma bağlamı değiştiriliyor');
    const context = await callCenterApi.authContext(companyId);
    setAuthContext(context);
    setSelectedCompanyId(companyId);
    setIsMobileSidebarOpen(false);
  }

  async function saveCompany() {
    if (!authContext?.isSuperAdmin) {
      setStatus('Firma tanımlama sadece super admin yetkisindedir');
      return;
    }

    setStatus('Firma kaydediliyor');
    if (selectedCompanyId) {
      const updated = await callCenterApi.updateCompany(selectedCompanyId, companyDraft);
      setCompanies((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } else {
      const created = await callCenterApi.createCompany(companyDraft);
      setCompanies((items) => [...items, created]);
      setSelectedCompanyId(created.id);
    }
    setStatus('Firma kaydedildi');
  }

  async function saveBusinessHour(dayIndex: number, patch: Partial<BusinessHour>) {
    if (!selectedCompanyId) return;
    const current = businessHours.find((item) => Number(item.dayOfWeek) === dayIndex);
    const payload = {
      dayOfWeek: dayIndex,
      isClosed: patch.isClosed ?? current?.isClosed ?? false,
      openTime: patch.openTime ?? current?.openTime ?? '09:00',
      closeTime: patch.closeTime ?? current?.closeTime ?? '18:00',
    };
    setSavingBusinessHour(dayIndex);
    try {
      const saved = await callCenterApi.upsertBusinessHour(selectedCompanyId, dayIndex, payload);
      setBusinessHours((items) => [...items.filter((item) => Number(item.dayOfWeek) !== dayIndex), saved]);
      setStatus(`${dayLabels[dayIndex]} çalışma saati kaydedildi`);
    } finally {
      setSavingBusinessHour(null);
    }
  }

  function resetExceptionDraft() {
    setExceptionDraft({
      date: new Date().toISOString().slice(0, 10),
      title: '',
      isClosed: true,
      openTime: '09:00',
      closeTime: '18:00',
      messageOverride: '',
    });
  }

  async function createException() {
    if (!selectedCompanyId || !exceptionDraft.title.trim()) return;
    setStatus('Özel gün kaydediliyor');
    setIsFormSaving(true);
    try {
      await callCenterApi.createCalendarException(selectedCompanyId, {
        ...exceptionDraft,
        openTime: exceptionDraft.isClosed ? null : exceptionDraft.openTime,
        closeTime: exceptionDraft.isClosed ? null : exceptionDraft.closeTime,
      });
      setGridRefreshVersion((version) => version + 1);
      resetExceptionDraft();
      setIsExceptionFormOpen(false);
      setStatus('Özel gün kaydedildi');
    } catch {
      setStatus('Özel gün kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  function resetDepartmentDraft() {
    setDepartmentDraft({ code: '', name: '', languageCode: '', isActive: true });
  }

  async function createDepartment() {
    if (!selectedCompanyId || !departmentDraft.code.trim() || !departmentDraft.name.trim()) return;
    setStatus('Departman kaydediliyor');
    setIsFormSaving(true);
    try {
      const created = await callCenterApi.createDepartment(selectedCompanyId, {
        ...departmentDraft,
        languageCode: departmentDraft.languageCode || null,
      });
      setDepartments((items) => [...items, created]);
      setGridRefreshVersion((version) => version + 1);
      resetDepartmentDraft();
      setIsDepartmentFormOpen(false);
      setStatus('Departman kaydedildi');
    } catch {
      setStatus('Departman kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  function resetQueueDraft() {
    setEditingQueueId(null);
    setQueueMembers([]);
    setQueueMemberCandidates([]);
    setQueueMemberDraft({ companyUserId: '', skillLevel: 3, priority: 100 });
    setQueueDraft({ departmentId: departments.find((item) => item.isActive)?.id.toString() ?? '', code: '', name: '', description: '', priority: 100, maxWaitingCalls: 50, maxWaitSeconds: 300, wrapUpSeconds: 30, distributionStrategy: 'LongestIdle', isActive: true });
  }

  async function saveQueue() {
    if (!selectedCompanyId || !queueDraft.departmentId || !queueDraft.code.trim() || !queueDraft.name.trim()) return;
    setStatus('Çağrı kuyruğu kaydediliyor');
    setIsFormSaving(true);
    try {
      const payload = {
        ...queueDraft,
        departmentId: Number(queueDraft.departmentId),
        description: queueDraft.description || null,
        distributionStrategy: queueDraft.distributionStrategy as QueueDistributionStrategy,
      };
      if (editingQueueId) await callCenterApi.updateCallQueue(selectedCompanyId, editingQueueId, payload);
      else await callCenterApi.createCallQueue(selectedCompanyId, payload);
      setGridRefreshVersion((version) => version + 1);
      setIsQueueFormOpen(false);
      setStatus(editingQueueId ? 'Çağrı kuyruğu güncellendi' : 'Çağrı kuyruğu kaydedildi');
    } catch {
      setStatus('Çağrı kuyruğu kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function editQueue(queue: CallQueue) {
    if (!selectedCompanyId) return;
    setEditingQueueId(queue.id);
    setQueueDraft({ departmentId: queue.departmentId.toString(), code: queue.code, name: queue.name, description: queue.description ?? '', priority: queue.priority, maxWaitingCalls: queue.maxWaitingCalls, maxWaitSeconds: queue.maxWaitSeconds, wrapUpSeconds: queue.wrapUpSeconds, distributionStrategy: String(queue.distributionStrategy), isActive: queue.isActive });
    setQueueMemberDraft({ companyUserId: '', skillLevel: 3, priority: 100 });
    setQueueMembers([]);
    setQueueMemberCandidates([]);
    setIsQueueFormOpen(true);
    setIsQueueMembersLoading(true);
    try {
      const [members, users] = await Promise.all([
        callCenterApi.queueMembers(selectedCompanyId, queue.id),
        callCenterApi.queueAgentCandidates(selectedCompanyId),
      ]);
      setQueueMembers(members);
      setQueueMemberCandidates(users);
    } catch {
      setStatus('Kuyruk üyeleri yüklenemedi');
    } finally {
      setIsQueueMembersLoading(false);
    }
  }

  async function addQueueMember() {
    if (!selectedCompanyId || !editingQueueId || !queueMemberDraft.companyUserId) return;
    setIsFormSaving(true);
    try {
      const saved = await callCenterApi.upsertQueueMember(selectedCompanyId, editingQueueId, {
        companyUserId: Number(queueMemberDraft.companyUserId),
        skillLevel: queueMemberDraft.skillLevel,
        priority: queueMemberDraft.priority,
        isActive: true,
      });
      setQueueMembers((items) => [...items.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.priority - b.priority));
      setQueueMemberDraft({ companyUserId: '', skillLevel: 3, priority: 100 });
      setGridRefreshVersion((version) => version + 1);
      setStatus('Temsilci kuyruğa eklendi');
    } catch {
      setStatus('Temsilci kuyruğa eklenemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function removeQueueMember(member: QueueMember) {
    if (!selectedCompanyId || !editingQueueId || !window.confirm(`${member.displayName} kuyruktan çıkarılsın mı?`)) return;
    setIsFormSaving(true);
    try {
      await callCenterApi.deleteQueueMember(selectedCompanyId, editingQueueId, member.id);
      setQueueMembers((items) => items.filter((item) => item.id !== member.id));
      setGridRefreshVersion((version) => version + 1);
      setStatus('Temsilci kuyruktan çıkarıldı');
    } catch {
      setStatus('Temsilci kuyruktan çıkarılamadı');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function updateQueueMember(member: QueueMember, changes: Partial<Pick<QueueMember, 'skillLevel' | 'priority' | 'isActive'>>) {
    if (!selectedCompanyId || !editingQueueId) return;
    const next = { ...member, ...changes };
    setQueueMembers((items) => items.map((item) => item.id === member.id ? next : item));
    try {
      const saved = await callCenterApi.upsertQueueMember(selectedCompanyId, editingQueueId, {
        companyUserId: member.companyUserId,
        skillLevel: next.skillLevel,
        priority: next.priority,
        isActive: next.isActive,
      });
      setQueueMembers((items) => items.map((item) => item.id === saved.id ? saved : item).sort((a, b) => a.priority - b.priority));
      setStatus('Kuyruk üyeliği güncellendi');
    } catch {
      setQueueMembers((items) => items.map((item) => item.id === member.id ? member : item));
      setStatus('Kuyruk üyeliği güncellenemedi');
    }
  }

  function openTelephonyConnection(connection?: TelephonyProviderConnection) {
    setEditingTelephonyConnectionId(connection?.id ?? null);
    setTelephonyConnectionDraft(connection ? {
      code: connection.code,
      name: connection.name,
      providerType: connection.providerType,
      transport: connection.transport,
      sipDomain: connection.sipDomain ?? '',
      outboundProxy: connection.outboundProxy ?? '',
      authUsername: connection.authUsername ?? '',
      credentialSecretReference: connection.credentialSecretReference ?? '',
      webhookSigningSecretReference: connection.webhookSigningSecretReference ?? '',
      apiBaseUrl: connection.apiBaseUrl ?? '',
      requestTimeoutSeconds: connection.requestTimeoutSeconds,
      recordingEnabled: connection.recordingEnabled,
      allowInternationalOutbound: connection.allowInternationalOutbound,
      isActive: connection.isActive,
    } : { code: '', name: '', providerType: 'Netgsm', transport: 'Tls', sipDomain: '', outboundProxy: '', authUsername: '', credentialSecretReference: '', webhookSigningSecretReference: '', apiBaseUrl: '', requestTimeoutSeconds: 15, recordingEnabled: true, allowInternationalOutbound: false, isActive: true });
    setIsTelephonyConnectionFormOpen(true);
  }

  async function saveTelephonyConnection() {
    if (!selectedCompanyId || !telephonyConnectionDraft.code.trim() || !telephonyConnectionDraft.name.trim()) return;
    setIsFormSaving(true);
    setStatus('Telefon bağlantısı kaydediliyor');
    try {
      const payload = {
        ...telephonyConnectionDraft,
        sipDomain: telephonyConnectionDraft.sipDomain || null,
        outboundProxy: telephonyConnectionDraft.outboundProxy || null,
        authUsername: telephonyConnectionDraft.authUsername || null,
        credentialSecretReference: telephonyConnectionDraft.credentialSecretReference || null,
        webhookSigningSecretReference: telephonyConnectionDraft.webhookSigningSecretReference || null,
        apiBaseUrl: telephonyConnectionDraft.apiBaseUrl || null,
      };
      if (editingTelephonyConnectionId) await callCenterApi.updateTelephonyConnection(selectedCompanyId, editingTelephonyConnectionId, payload);
      else await callCenterApi.createTelephonyConnection(selectedCompanyId, payload);
      setGridRefreshVersion((version) => version + 1);
      setIsTelephonyConnectionFormOpen(false);
      setStatus('Telefon bağlantısı kaydedildi');
    } catch {
      setStatus('Telefon bağlantısı kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function deleteTelephonyConnection(connection: TelephonyProviderConnection) {
    if (!selectedCompanyId || !window.confirm(`${connection.name} bağlantısı silinsin mi?`)) return;
    try {
      await callCenterApi.deleteTelephonyConnection(selectedCompanyId, connection.id);
      setGridRefreshVersion((version) => version + 1);
      setStatus('Telefon bağlantısı silindi');
    } catch {
      setStatus('Aktif numarası bulunan bağlantı silinemez');
    }
  }

  async function openInboundNumber(number?: InboundPhoneNumber) {
    if (!selectedCompanyId) return;
    setStatus('Telefon seçenekleri yükleniyor');
    try {
      const options = await callCenterApi.telephonyOptions(selectedCompanyId);
      setTelephonyOptions(options);
      setEditingInboundNumberId(number?.id ?? null);
      setInboundNumberDraft(number ? {
        providerConnectionId: number.providerConnectionId.toString(),
        defaultQueueId: number.defaultQueueId?.toString() ?? '',
        e164Number: number.e164Number,
        displayName: number.displayName,
        countryCode: number.countryCode ?? 'TR',
        defaultLocale: number.defaultLocale,
        acceptInbound: number.acceptInbound,
        acceptInternationalInbound: number.acceptInternationalInbound,
        allowOutboundCli: number.allowOutboundCli,
        isActive: number.isActive,
      } : { providerConnectionId: options.connections[0]?.id.toString() ?? '', defaultQueueId: '', e164Number: '', displayName: '', countryCode: 'TR', defaultLocale: 'tr-TR', acceptInbound: true, acceptInternationalInbound: true, allowOutboundCli: false, isActive: true });
      setIsInboundNumberFormOpen(true);
      setStatus('Hazır');
    } catch {
      setStatus('Telefon seçenekleri yüklenemedi');
    }
  }

  async function saveInboundNumber() {
    if (!selectedCompanyId || !inboundNumberDraft.providerConnectionId || !inboundNumberDraft.e164Number.trim() || !inboundNumberDraft.displayName.trim()) return;
    setIsFormSaving(true);
    setStatus('Gelen numara kaydediliyor');
    try {
      const payload = {
        ...inboundNumberDraft,
        providerConnectionId: Number(inboundNumberDraft.providerConnectionId),
        defaultQueueId: inboundNumberDraft.defaultQueueId ? Number(inboundNumberDraft.defaultQueueId) : null,
      };
      if (editingInboundNumberId) await callCenterApi.updateInboundPhoneNumber(selectedCompanyId, editingInboundNumberId, payload);
      else await callCenterApi.createInboundPhoneNumber(selectedCompanyId, payload);
      setGridRefreshVersion((version) => version + 1);
      setIsInboundNumberFormOpen(false);
      setStatus('Gelen numara kaydedildi');
    } catch {
      setStatus('Gelen numara kaydedilemedi; E.164 formatını ve tekil numarayı kontrol edin');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function deleteInboundNumber(number: InboundPhoneNumber) {
    if (!selectedCompanyId || !window.confirm(`${number.e164Number} gelen numarası silinsin mi?`)) return;
    try {
      await callCenterApi.deleteInboundPhoneNumber(selectedCompanyId, number.id);
      setGridRefreshVersion((version) => version + 1);
      setStatus('Gelen numara silindi');
    } catch {
      setStatus('Gelen numara silinemedi');
    }
  }

  async function openTransferTarget(target?: TransferTarget) {
    if (!selectedCompanyId) return;
    setStatus('Aktarım seçenekleri yükleniyor');
    try {
      const options = await callCenterApi.transferTargetOptions(selectedCompanyId);
      setTransferTargetOptions(options);
      setEditingTransferTargetId(target?.id ?? null);
      setTransferTargetDraft(target ? {
        queueId: target.queueId.toString(),
        companyUserId: target.companyUserId?.toString() ?? '',
        providerConnectionId: target.providerConnectionId?.toString() ?? '',
        code: target.code,
        name: target.name,
        targetType: target.targetType,
        destination: target.destination,
        priority: target.priority,
        ringTimeoutSeconds: target.ringTimeoutSeconds,
        isFallback: target.isFallback,
        isActive: target.isActive,
        notes: target.notes ?? '',
      } : {
        queueId: options.queues[0]?.id.toString() ?? '',
        companyUserId: '',
        providerConnectionId: '',
        code: '',
        name: '',
        targetType: 'SipExtension',
        destination: '',
        priority: 100,
        ringTimeoutSeconds: 20,
        isFallback: false,
        isActive: true,
        notes: '',
      });
      setIsTransferTargetFormOpen(true);
      setStatus('Hazır');
    } catch {
      setStatus('Aktarım seçenekleri yüklenemedi');
    }
  }

  async function saveTransferTarget() {
    if (!selectedCompanyId || !transferTargetDraft.queueId || !transferTargetDraft.code.trim() || !transferTargetDraft.name.trim() || !transferTargetDraft.destination.trim()) return;
    setIsFormSaving(true);
    setStatus('Aktarım hedefi kaydediliyor');
    try {
      const payload = {
        ...transferTargetDraft,
        queueId: Number(transferTargetDraft.queueId),
        companyUserId: transferTargetDraft.companyUserId ? Number(transferTargetDraft.companyUserId) : null,
        providerConnectionId: transferTargetDraft.providerConnectionId ? Number(transferTargetDraft.providerConnectionId) : null,
        notes: transferTargetDraft.notes || null,
      };
      if (editingTransferTargetId) await callCenterApi.updateTransferTarget(selectedCompanyId, editingTransferTargetId, payload);
      else await callCenterApi.createTransferTarget(selectedCompanyId, payload);
      setGridRefreshVersion((version) => version + 1);
      setIsTransferTargetFormOpen(false);
      setStatus('Aktarım hedefi kaydedildi');
    } catch {
      setStatus('Aktarım hedefi kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function deleteTransferTarget(target: TransferTarget) {
    if (!selectedCompanyId || !window.confirm(`${target.name} aktarım hedefi silinsin mi?`)) return;
    try {
      await callCenterApi.deleteTransferTarget(selectedCompanyId, target.id);
      setGridRefreshVersion((version) => version + 1);
      setStatus('Aktarım hedefi silindi');
    } catch {
      setStatus('Aktarım hedefi silinemedi');
    }
  }

  async function changeAgentStatus(companyUserId: number, statusValue: AgentPresenceStatus) {
    if (!selectedCompanyId) return;
    setStatus('Temsilci durumu güncelleniyor');
    try {
      const updated = await callCenterApi.updateAgentPresence(selectedCompanyId, companyUserId, statusValue);
      setAgentPresences((items) => items.map((item) => item.companyUserId === companyUserId ? updated : item));
      setStatus('Temsilci durumu güncellendi');
    } catch {
      setStatus('Temsilci durumu güncellenemedi');
    }
  }

  function resetRuleDraft() {
    setRuleDraft({
      name: '', priority: 100, isActive: true, appliesDuringBusinessHours: true,
      appliesAfterHours: true, matchIntent: '', matchLanguageCode: '', action: 'AiAnswer',
      targetDepartmentId: '', message: '',
    });
  }

  async function createRule() {
    if (!selectedCompanyId || !ruleDraft.name.trim()) return;
    setStatus('Yönlendirme kuralı kaydediliyor');
    setIsFormSaving(true);
    try {
      await callCenterApi.createRoutingRule(selectedCompanyId, {
        ...ruleDraft,
        action: ruleDraft.action as RoutingAction,
        targetDepartmentId: ruleDraft.targetDepartmentId ? Number(ruleDraft.targetDepartmentId) : null,
        matchIntent: ruleDraft.matchIntent || null,
        matchLanguageCode: ruleDraft.matchLanguageCode || null,
        message: ruleDraft.message || null,
      });
      setGridRefreshVersion((version) => version + 1);
      resetRuleDraft();
      setIsRuleFormOpen(false);
      setStatus('Yönlendirme kuralı kaydedildi');
    } catch {
      setStatus('Yönlendirme kuralı kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  function editRole(role: CompanyRole) {
    setEditingRoleId(role.id);
    setRoleDraft({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      isActive: role.isActive,
      permissionCodes: role.permissionCodes,
    });
    setIsRoleFormOpen(true);
  }

  function resetRoleDraft() {
    setEditingRoleId(null);
    setRoleDraft({ code: '', name: '', description: '', isActive: true, permissionCodes: [] });
  }

  function toggleRolePermission(permissionCode: string) {
    setRoleDraft((draft) => ({
      ...draft,
      permissionCodes: draft.permissionCodes.includes(permissionCode)
        ? draft.permissionCodes.filter((code) => code !== permissionCode)
        : [...draft.permissionCodes, permissionCode],
    }));
  }

  async function saveRole() {
    if (!selectedCompanyId || !roleDraft.code.trim() || !roleDraft.name.trim()) return;
    setStatus(editingRoleId ? 'Rol güncelleniyor' : 'Rol oluşturuluyor');
    setIsFormSaving(true);
    try {
      const payload = {
        code: roleDraft.code,
        name: roleDraft.name,
        description: roleDraft.description,
        isActive: roleDraft.isActive,
        permissionCodes: roleDraft.permissionCodes,
      };
      const saved = editingRoleId
        ? await callCenterApi.updateCompanyRole(selectedCompanyId, editingRoleId, payload)
        : await callCenterApi.createCompanyRole(selectedCompanyId, payload);
      setCompanyRoles((items) => [...items.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, 'tr')));
      setGridRefreshVersion((version) => version + 1);
      resetRoleDraft();
      setIsRoleFormOpen(false);
      setStatus('Rol kaydedildi');
    } catch {
      setStatus('Rol kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  function editCompanyUser(user: CompanyUser) {
    setEditingUserAssignmentId(user.assignmentId);
    setUserDraft({
      email: user.email,
      displayName: user.displayName,
      password: '',
      companyRoleId: user.companyRoleId?.toString() ?? '',
      legacyRole: user.legacyRole,
      isUserActive: user.isUserActive,
      isAssignmentActive: user.isAssignmentActive,
    });
    setIsUserFormOpen(true);
  }

  function resetUserDraft() {
    const defaultRole = companyRoles.find((role) => role.isActive && role.code.toLowerCase() === 'agent')
      ?? companyRoles.find((role) => role.isActive);
    setEditingUserAssignmentId(null);
    setUserDraft({
      email: '',
      displayName: '',
      password: '',
      companyRoleId: defaultRole?.id.toString() ?? '',
      legacyRole: 'Agent',
      isUserActive: true,
      isAssignmentActive: true,
    });
  }

  async function saveCompanyUser() {
    if (!selectedCompanyId || !userDraft.email.trim() || !userDraft.displayName.trim() || !userDraft.companyRoleId) return;
    setStatus(editingUserAssignmentId ? 'Kullanıcı güncelleniyor' : 'Kullanıcı oluşturuluyor');
    setIsFormSaving(true);
    try {
      const companyRoleId = userDraft.companyRoleId ? Number(userDraft.companyRoleId) : null;
      if (editingUserAssignmentId) {
        await callCenterApi.updateCompanyUser(selectedCompanyId, editingUserAssignmentId, {
            displayName: userDraft.displayName,
            password: userDraft.password || undefined,
            companyRoleId,
            legacyRole: userDraft.legacyRole,
            isUserActive: userDraft.isUserActive,
            isAssignmentActive: userDraft.isAssignmentActive,
          });
      } else {
        await callCenterApi.createCompanyUser(selectedCompanyId, {
            email: userDraft.email,
            displayName: userDraft.displayName,
            password: userDraft.password || undefined,
            companyRoleId,
            legacyRole: userDraft.legacyRole,
            isActive: userDraft.isUserActive && userDraft.isAssignmentActive,
          });
      }
      setGridRefreshVersion((version) => version + 1);
      resetUserDraft();
      setIsUserFormOpen(false);
      setStatus('Kullanıcı kaydedildi');
    } catch {
      setStatus('Kullanıcı kaydedilemedi');
    } finally {
      setIsFormSaving(false);
    }
  }

  async function simulate() {
    if (!selectedCompanyId) return;
    setStatus('Karar simüle ediliyor');
    const result = await callCenterApi.simulate({
      companyId: selectedCompanyId,
      occurredAt: new Date(simulationDraft.occurredAt).toISOString(),
      languageCode: simulationDraft.languageCode,
      intent: simulationDraft.intent || undefined,
      callerNumberMasked: simulationDraft.callerNumberMasked || undefined,
      writeLog: simulationDraft.writeLog,
    });
    setDecision(result);
    if (simulationDraft.writeLog) {
      setGridRefreshVersion((version) => version + 1);
    }
    setStatus('Simülasyon tamamlandı');
  }

  if (isAuthBootstrapping) {
    return <ThemeBootLoader theme={appTheme} mode={appMode} />;
  }

  if (!authContext) {
    const passwordRevealLabel = loginLanguage === 'tr'
      ? (isPasswordVisible ? 'GİZLE' : 'GÖSTER')
      : (isPasswordVisible ? 'HIDE' : 'SHOW');

    return (
      <main
        className={
          isLoginRtl
            ? 'login-screen login-rtl'
            : 'login-screen'
        }
        dir={isLoginRtl ? 'rtl' : 'ltr'}
      >
        <SpaceBackground />
        <div className="login-atmosphere" aria-hidden="true">
          <div className="login-stars" />
          <div className="login-twinkles">
            <span /><span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span /><span />
          </div>
          <div className="login-dust" />
          <div className="login-grid-floor" />

          <div className="login-galaxy login-galaxy-far-1" />
          <div className="login-galaxy login-galaxy-far-2" />
          <div className="login-galaxy login-galaxy-mid-1" />
          <div className="login-galaxy login-galaxy-mid-2" />
          <div className="login-galaxy login-galaxy-near-1" />
          <div className="login-galaxy login-galaxy-near-2" />

          <div className="login-world login-world-saturn">
            <div className="login-saturn-planet" />
            <div className="login-saturn-ring" />
          </div>
          <div className="login-world login-world-cyan">
            <div className="login-soft-planet login-soft-planet-cyan" />
            <div className="login-dotted-orbit login-dotted-orbit-lg" />
            <div className="login-dotted-orbit login-dotted-orbit-sm" />
          </div>
          <div className="login-world login-world-pink">
            <div className="login-soft-planet login-soft-planet-pink" />
            <div className="login-dotted-orbit login-dotted-orbit-md" />
          </div>
          <div className="login-world login-world-ice">
            <div className="login-soft-planet login-soft-planet-ice" />
          </div>
          <div className="login-world login-world-amber">
            <div className="login-soft-planet login-soft-planet-amber" />
            <div className="login-dotted-orbit login-dotted-orbit-xs" />
          </div>

          <div className="login-soft-planet login-soft-planet-tiny" />
          <div className="login-soft-planet login-soft-planet-far-a" />
          <div className="login-soft-planet login-soft-planet-far-b" />
          <div className="login-soft-planet login-soft-planet-far-c" />
          <div className="login-soft-planet login-soft-planet-far-d" />
          <div className="login-soft-planet login-soft-planet-far-e" />

          <div className="login-flyby login-flyby-ship">
            <Rocket size={28} strokeWidth={1.5} />
          </div>
          <div className="login-flyby login-flyby-ufo">
            <svg viewBox="0 0 64 40" width="36" height="22" fill="none" aria-hidden="true">
              <ellipse cx="32" cy="24" rx="22" ry="7" fill="currentColor" opacity="0.35" />
              <ellipse cx="32" cy="22" rx="18" ry="5" fill="currentColor" opacity="0.55" />
              <path d="M20 18 C22 10 42 10 44 18" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.45" />
              <circle cx="32" cy="14" r="6" fill="currentColor" opacity="0.7" />
              <circle cx="24" cy="24" r="1.4" fill="#67e8f9" />
              <circle cx="32" cy="25" r="1.4" fill="#67e8f9" />
              <circle cx="40" cy="24" r="1.4" fill="#67e8f9" />
            </svg>
          </div>
          <div className="login-scanlines" />
        </div>

        <div className="login-stage">
        <section className="login-panel">
          <div className="login-panel-brand">
            <div className="login-orbit" aria-hidden="true">
              <div className="login-orbit-ring login-orbit-ring-outer">
                <span className="login-orbit-body login-orbit-body-outer" />
              </div>
              <div className="login-orbit-ring login-orbit-ring-mid">
                <span className="login-orbit-body login-orbit-body-mid" />
              </div>
              <div className="login-orbit-core" />
            </div>

            <div className="login-brand-inner">
              <div className="login-brand-logos">
                <img alt="V3RII Call Center" className="login-logo-callcenter" src={callCenterLogo} />
              </div>

              <div className="login-brand-copy">
                <h1 className="login-hero-title">
                  {loginText.heroLine1}
                  <br />
                  {loginText.heroLine2}
                  <br />
                  <span className="login-hero-accent">{loginText.heroLine3}_</span>
                </h1>
                <p className="login-hero-copy">
                  {loginText.heroText}
                </p>
              </div>

              <div className="login-status-stack">
                <div className="login-status-row login-status-row-pink">
                  <span>{loginText.serverStatus}</span>
                  <span className="login-status-value login-status-value-pink">
                    <span className="login-status-dot" />
                    {loginText.online}
                  </span>
                </div>
                <div className="login-status-row login-status-row-cyan">
                  <span>{loginText.securityProtocol}</span>
                  <span className="login-status-value login-status-value-cyan">AKTİF KALKAN (V3)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-panel-form">
            <div className="login-lang-wrap">
              <div className="login-lang-select">
                <CustomSelect
                  compact
                  icon={<Globe size={12} />}
                  label={`${loginText.language}:`}
                  onChange={(value) => setLoginLanguage(value as LoginLanguageCode)}
                  options={languageOptions}
                  value={loginLanguage}
                />
              </div>
            </div>

            <div className="login-form-head">
              <h2 className="login-form-title">
                {loginText.title}
                <span className="login-cursor" aria-hidden="true" />
              </h2>
              <p className="login-form-subtitle">{loginText.subtitle}</p>
            </div>

            <form className="login-form-fields" noValidate onSubmit={(event) => void login(event)}>
              <LoginField
                icon={<Globe size={18} />}
                invalid={loginFieldErrors.company}
                label={loginText.company}
              >
                <CustomSelect
                  isLoading={isLoginCompaniesLoading}
                  loadingText="Yükleniyor"
                  onChange={(value) => {
                    clearLoginFieldError('company');
                    setLoginDraft({ ...loginDraft, companyId: value });
                  }}
                  options={companyOptions}
                  value={loginDraft.companyId}
                />
              </LoginField>

              <LoginField
                required
                icon={<UserRound size={18} />}
                invalid={loginFieldErrors.email}
                label={loginText.operator}
              >
                <input
                  aria-invalid={loginFieldErrors.email}
                  className="login-control"
                  placeholder={loginText.operatorPlaceholder}
                  value={loginDraft.email}
                  onChange={(event) => {
                    clearLoginFieldError('email');
                    setLoginDraft({ ...loginDraft, email: event.target.value });
                  }}
                />
              </LoginField>

              <LoginField
                action={
                  <button className="login-forgot-link" type="button">
                    {loginText.forgotCode}
                  </button>
                }
                icon={<Lock size={18} />}
                invalid={loginFieldErrors.password}
                label={loginText.password}
                required
              >
                <input
                  aria-invalid={loginFieldErrors.password}
                  className="login-control login-control-password"
                  placeholder="••••••••"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={loginDraft.password}
                  onChange={(event) => {
                    clearLoginFieldError('password');
                    setLoginDraft({ ...loginDraft, password: event.target.value });
                  }}
                />
                <button
                  aria-label={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                >
                  <span className="login-password-toggle-label">{passwordRevealLabel}</span>
                  {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </LoginField>

              <label className="login-remember">
                <input className="login-remember-input" type="checkbox" />
                <span className="login-remember-track" aria-hidden="true">
                  <span className="login-remember-thumb" />
                </span>
                <span className="login-remember-text">{loginText.remember}</span>
              </label>

              <div className="login-submit-wrap">
                <button className="login-btn" type="submit">
                  <span className="login-btn-fill" aria-hidden="true" />
                  <span className="login-btn-content">
                    {loginText.submit}
                    <Rocket size={18} />
                  </span>
                </button>
              </div>
            </form>

            {status && status !== 'Hazır' ? (
              <div
                className={
                  loginStatusTone === 'error'
                    ? 'login-status-message login-status-message-error'
                    : loginStatusTone === 'success'
                      ? 'login-status-message login-status-message-success'
                      : 'login-status-message'
                }
                role={loginStatusTone === 'error' ? 'alert' : 'status'}
              >
                {status}
              </div>
            ) : null}

            <div className="login-footer-wrap">
              <p className="login-footer">
                <ShieldCheck size={10} /> {loginText.securityNetwork}
              </p>
            </div>
          </div>
        </section>

        <nav aria-label="V3RII iletişim" className="login-socials">
          <a
            aria-label="V3RII website"
            className="login-social-link"
            href="https://v3rii.com/"
            rel="noreferrer"
            target="_blank"
          >
            <HugeiconsIcon icon={Globe02Icon} size={18} strokeWidth={1.6} />
          </a>
          <a
            aria-label="Telefon +90 507 710 87 61"
            className="login-social-link"
            href="tel:+905077108761"
          >
            <HugeiconsIcon icon={Call02Icon} size={18} strokeWidth={1.6} />
          </a>
          <a
            aria-label="WhatsApp +90 507 012 30 18"
            className="login-social-link"
            href="https://wa.me/905070123018"
            rel="noreferrer"
            target="_blank"
          >
            <HugeiconsIcon icon={WhatsappIcon} size={18} strokeWidth={1.6} />
          </a>
          <a
            aria-label="Instagram"
            className="login-social-link"
            href="https://www.instagram.com/v3riiteknoloji/"
            rel="noreferrer"
            target="_blank"
          >
            <HugeiconsIcon icon={InstagramIcon} size={18} strokeWidth={1.6} />
          </a>
          <a
            aria-label="LinkedIn"
            className="login-social-link"
            href="https://www.linkedin.com/company/v3ri%CC%87i%CC%87-teknoloji%CC%87/"
            rel="noreferrer"
            target="_blank"
          >
            <HugeiconsIcon icon={Linkedin01Icon} size={18} strokeWidth={1.6} />
          </a>
          <div className="login-social-x" ref={xComingSoonRef}>
            <button
              aria-expanded={isXComingSoonOpen}
              aria-label="X"
              className="login-social-link"
              type="button"
              onClick={() => setIsXComingSoonOpen((open) => !open)}
            >
              <HugeiconsIcon icon={NewTwitterIcon} size={18} strokeWidth={1.6} />
            </button>
            {isXComingSoonOpen ? (
              <span className="login-social-soon" role="status">
                {loginLanguage === 'tr' ? 'Çok yakında' : 'Coming soon'}
              </span>
            ) : null}
          </div>
        </nav>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`app-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${isMobileSidebarOpen ? ' mobile-nav-open' : ''}`}
      data-mode={appMode}
      data-theme={appTheme}
    >
      {appTheme === 'space' && (
        <div className="space-void" aria-hidden="true">
          <span className="space-void-planet space-void-planet-a" />
          <span className="space-void-planet space-void-planet-b" />
          <span className="space-void-planet space-void-planet-c" />
          <span className="space-void-planet space-void-planet-d" />
        </div>
      )}
      <aside className="sidebar">
        <div className="brand">
          <img
            alt="V3RII"
            className={isSidebarCollapsed ? 'brand-logo brand-logo-v3' : 'brand-logo'}
            src={isSidebarCollapsed ? v3Logo : callCenterLogo}
          />
        </div>

        {authContext?.isSuperAdmin && (
          <button
            className="primary-action sidebar-new-company"
            type="button"
            onClick={() => {
              setSelectedCompanyId(null);
              setCompanyDraft(emptyCompany);
              selectWorkspaceSection('company');
            }}
          >
            <Plus size={16} /> <span>Yeni firma</span>
          </button>
        )}

        <div className="sidebar-scroll">
          <nav className="module-list" aria-label="Call center modülleri">
            {workspaceGroups.map((group) => {
              const groupSections = workspaceSections.filter((section) => {
                if (section.group !== group.id) return false;
                const query = navSearch.trim().toLocaleLowerCase('tr-TR');
                if (!query) return true;
                return (
                  section.title.toLocaleLowerCase('tr-TR').includes(query)
                  || section.description.toLocaleLowerCase('tr-TR').includes(query)
                  || group.title.toLocaleLowerCase('tr-TR').includes(query)
                );
              });
              if (groupSections.length === 0) return null;
              const groupHasActiveSection = groupSections.some((section) => section.id === activeSection);
              const isExpanded = Boolean(navSearch.trim()) || expandedWorkspaceGroups[group.id];

              return (
                <div className="module-group" key={group.id}>
                  <button
                    aria-expanded={isExpanded}
                    className={groupHasActiveSection ? 'module-group-trigger active' : 'module-group-trigger'}
                    type="button"
                    onClick={() => {
                      if (isSidebarCollapsed) {
                        setIsSidebarCollapsed(false);
                        setExpandedWorkspaceGroups((groups) => ({ ...groups, [group.id]: true }));
                        const targetSection = groupHasActiveSection
                          ? groupSections.find((section) => section.id === activeSection)?.id
                          : groupSections[0]?.id;
                        if (targetSection) {
                          selectWorkspaceSection(targetSection);
                        }
                        return;
                      }
                      if (navSearch.trim()) return;
                      setExpandedWorkspaceGroups((groups) => ({ ...groups, [group.id]: !groups[group.id] }));
                    }}
                  >
                    <span className="module-group-title">
                      {group.icon}
                      <strong>{group.title}</strong>
                    </span>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isExpanded && !isSidebarCollapsed && (
                    <div className="module-group-content">
                      {groupSections.map((section) => (
                        <button
                          className={activeSection === section.id ? 'module-item active' : 'module-item'}
                          key={section.id}
                          type="button"
                          onClick={() => selectWorkspaceSection(section.id)}
                        >
                          {section.icon}
                          <span>
                            <strong>{section.title}</strong>
                            <small>{section.description}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="company-list">
            <span className="sidebar-label">Aktif Firma</span>
            {!authContext?.isSuperAdmin && selectedCompany && (
              <div className="company-context">
                <Building2 size={16} />
                <span>{selectedCompany.name}</span>
                <small>{selectedCompany.code}</small>
              </div>
            )}
            {companies.map((company) => (
              <button
                className={company.id === selectedCompanyId ? 'company-item active' : 'company-item'}
                key={company.id}
                type="button"
                onClick={() => void selectCompany(company.id)}
              >
                <Building2 size={16} />
                <span>{company.name}</span>
                <small>{company.code}</small>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-navbar">
          <div className="app-navbar-left">
            <button
              aria-label={isSidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
              className="sidebar-toggle navbar-sidebar-toggle"
              type="button"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
            <button
              aria-label={isMobileSidebarOpen ? 'Mobil menüyü kapat' : 'Mobil menüyü aç'}
              className="mobile-sidebar-toggle"
              type="button"
              onClick={() => setIsMobileSidebarOpen((value) => !value)}
            >
              {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <label className="app-navbar-search">
              <Search size={16} aria-hidden="true" />
              <input
                placeholder="Menülerde ara..."
                type="search"
                value={navSearch}
                onChange={(event) => setNavSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="app-navbar-actions">
            <div className="user-menu" ref={userMenuRef}>
              <button className="user-menu-button" type="button" onClick={() => setIsUserMenuOpen((value) => !value)}>
                <span className="user-menu-avatar" aria-hidden="true">
                  <UserRound size={16} />
                </span>
                <span className="user-menu-badge">
                  <strong>{authContext.displayName}</strong>
                </span>
                <ChevronDown size={15} className="user-menu-chevron" />
              </button>
              {isUserMenuOpen && (
                <div className="user-menu-panel">
                  <div className="user-menu-status">
                    <RefreshCw size={14} />
                    <span>{status}</span>
                  </div>
                  <div className="mode-switcher user-menu-mode">
                    <span>Renk modu</span>
                    <div className="mode-switcher-options">
                      <button
                        className={appMode === 'dark' ? 'mode-option active' : 'mode-option'}
                        type="button"
                        onClick={() => setAppMode('dark')}
                      >
                        <Moon size={14} /> Koyu
                      </button>
                      <button
                        className={appMode === 'light' ? 'mode-option active' : 'mode-option'}
                        type="button"
                        onClick={() => setAppMode('light')}
                      >
                        <Sun size={14} /> Aydınlık
                      </button>
                    </div>
                  </div>
                  <div>
                    <span>Kullanıcı</span>
                    <strong>{authContext.displayName}</strong>
                    <small>{authContext.email}</small>
                  </div>
                  <div>
                    <span>Yetki</span>
                    <strong>{authContext.selectedRoleName ?? (authContext.isSuperAdmin ? 'Süper admin' : 'Firma kullanıcısı')}</strong>
                    <small>{authContext.isSuperAdmin ? 'Firma seçmeden giriş yapabilir' : `${authContext.permissionCodes?.length ?? 0} işlem izni`}</small>
                  </div>
                  <div>
                    <span>Firma</span>
                    <strong>{selectedCompany?.name ?? 'Firma seçilmedi'}</strong>
                    <small>{selectedCompany ? `${selectedCompany.code} · ${selectedCompany.companyType}` : 'Sol menüden firma seçilebilir'}</small>
                  </div>
                  <div className="theme-switcher">
                    <span>Arayüz teması</span>
                    <div className="theme-switcher-options">
                      {appThemeOptions.map((option) => (
                        <button
                          className={appTheme === option.id ? 'theme-option active' : 'theme-option'}
                          key={option.id}
                          type="button"
                          onClick={() => setAppTheme(option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="logout-button compact" type="button" onClick={logout}>
                    <LogOut size={15} /> Çıkış yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeSection !== 'dashboard' && (
          <header className="topbar">
            <div className="page-heading">
              <div className="page-breadcrumb">
                <span>Call Center</span>
                <ChevronRight size={13} />
                <strong>{workspaceGroups.find((group) => group.id === activeWorkspaceSection.group)?.title}</strong>
              </div>
              <h1>{activeWorkspaceSection.title}</h1>
              <p>{activeWorkspaceSection.description}</p>
            </div>
          </header>
        )}

        <div className="grid">
          {activeSection === 'dashboard' && (
            <Dashboard
              displayName={authContext.displayName}
              companyName={selectedCompany?.name}
              onNavigate={(section) => selectWorkspaceSection(section)}
            />
          )}
          {activeSection === 'company' && <section className="panel company-panel">
            <PanelTitle icon={<Building2 size={18} />} title="Firma Tanımı" />
            {!authContext?.isSuperAdmin && (
              <div className="notice">Firma tanımlama ve firma ana bilgileri sadece süper admin tarafından yönetilir.</div>
            )}
            <div className="form-grid two">
              <Field label="Kod" required>
                <input disabled={!authContext?.isSuperAdmin} required value={companyDraft.code} onChange={(event) => setCompanyDraft({ ...companyDraft, code: event.target.value })} />
              </Field>
              <Field label="Firma adı" required>
                <input disabled={!authContext?.isSuperAdmin} required value={companyDraft.name} onChange={(event) => setCompanyDraft({ ...companyDraft, name: event.target.value })} />
              </Field>
              <Field label="Firma tipi" required>
                <select disabled={!authContext?.isSuperAdmin} required value={companyDraft.companyType} onChange={(event) => setCompanyDraft({ ...companyDraft, companyType: event.target.value })}>
                  <option value="Customer">Müşteri</option>
                  <option value="Internal">İç firma</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Tedarikçi</option>
                </select>
              </Field>
              <label className="check active-check">
                <input checked={companyDraft.isActive} disabled={!authContext?.isSuperAdmin} type="checkbox" onChange={(event) => setCompanyDraft({ ...companyDraft, isActive: event.target.checked })} />
                Aktif firma
              </label>
              <Field label="Ticari unvan">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.legalName ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, legalName: event.target.value })} />
              </Field>
              <Field label="Vergi no">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.taxNumber ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, taxNumber: event.target.value })} />
              </Field>
              <Field label="Vergi dairesi">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.taxOffice ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, taxOffice: event.target.value })} />
              </Field>
              <Field label="E-posta">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.email ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, email: event.target.value })} />
              </Field>
              <Field label="Telefon">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.phone ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, phone: event.target.value })} />
              </Field>
              <Field label="Şehir">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.city ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, city: event.target.value })} />
              </Field>
              <Field label="Ülke">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.country ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, country: event.target.value })} />
              </Field>
              <Field label="Zaman dilimi" required>
                <input disabled={!authContext?.isSuperAdmin} required value={companyDraft.timeZoneId} onChange={(event) => setCompanyDraft({ ...companyDraft, timeZoneId: event.target.value })} />
              </Field>
              <Field label="Varsayılan dil" required>
                <input disabled={!authContext?.isSuperAdmin} required value={companyDraft.defaultLanguageCode} onChange={(event) => setCompanyDraft({ ...companyDraft, defaultLanguageCode: event.target.value })} />
              </Field>
            </div>
            <Field label="Adres">
              <textarea disabled={!authContext?.isSuperAdmin} value={companyDraft.address ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, address: event.target.value })} />
            </Field>
            <Field label="KVKK / kayıt anonsu">
              <textarea disabled={!authContext?.isSuperAdmin} value={companyDraft.kvkkAnnouncementText ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, kvkkAnnouncementText: event.target.value })} />
            </Field>
            <Field label="Mesai dışı mesajı">
              <textarea disabled={!authContext?.isSuperAdmin} value={companyDraft.afterHoursMessage ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, afterHoursMessage: event.target.value })} />
            </Field>
            <Field label="Not">
              <textarea disabled={!authContext?.isSuperAdmin} value={companyDraft.notes ?? ''} onChange={(event) => setCompanyDraft({ ...companyDraft, notes: event.target.value })} />
            </Field>
            {authContext?.isSuperAdmin && (
              <button className="save-button" disabled={!companyDraft.code.trim() || !companyDraft.name.trim() || !companyDraft.companyType.trim() || !companyDraft.timeZoneId.trim() || !companyDraft.defaultLanguageCode.trim()} type="button" onClick={saveCompany}>
                <Save size={16} /> Firmayı kaydet
              </button>
            )}
          </section>}

          {activeSection === 'hours' && <section className="panel company-panel">
            <div className="management-panel-header">
              <div>
                <PanelTitle icon={<Clock3 size={18} />} title="Haftalık Çalışma Saatleri" />
                <p className="panel-helper">Saat değişiklikleri ilgili gün için anında kaydedilir.</p>
              </div>
              <span className="definition-status">{savingBusinessHour === null ? 'Kaydedilmiş yapılandırma' : `${dayLabels[savingBusinessHour]} kaydediliyor`}</span>
            </div>
            <div className="hours-list">
              {dayLabels.map((label, dayIndex) => {
                const item = businessHours.find((hour) => Number(hour.dayOfWeek) === dayIndex);
                return (
                  <div className="hour-row" key={label}>
                    <strong><span className={savingBusinessHour === dayIndex ? 'hour-save-dot saving' : 'hour-save-dot'} />{label}</strong>
                    <label className="check">
                      <input
                        checked={item?.isClosed ?? dayIndex === 0}
                      disabled={savingBusinessHour === dayIndex || !hasWorkspacePermission('calendar.manage')}
                        type="checkbox"
                        onChange={(event) => void saveBusinessHour(dayIndex, { isClosed: event.target.checked })}
                      />
                      Kapalı
                    </label>
                    <input
                      disabled={savingBusinessHour === dayIndex || item?.isClosed || !hasWorkspacePermission('calendar.manage')}
                      type="time"
                      value={(item?.openTime ?? '09:00').slice(0, 5)}
                      onChange={(event) => void saveBusinessHour(dayIndex, { openTime: event.target.value })}
                    />
                    <input
                      disabled={savingBusinessHour === dayIndex || item?.isClosed || !hasWorkspacePermission('calendar.manage')}
                      type="time"
                      value={(item?.closeTime ?? '18:00').slice(0, 5)}
                      onChange={(event) => void saveBusinessHour(dayIndex, { closeTime: event.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </section>}

          {activeSection === 'exceptions' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<CalendarDays size={18} />} title="Özel Gün / İstisna" />
              {hasWorkspacePermission('calendar.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => { resetExceptionDraft(); setIsExceptionFormOpen(true); }}><Plus size={16} /> Yeni özel gün</button>}
            </div>
            <PagedGrid
              columns={exceptionGridColumns}
              defaultSortBy="Date"
              emptyAction={hasWorkspacePermission('calendar.manage') ? <button className="primary-action" type="button" onClick={() => { resetExceptionDraft(); setIsExceptionFormOpen(true); }}><Plus size={15} /> İlk özel günü ekle</button> : undefined}
              emptyDescription="Tatil, bakım veya yarım gün gibi çalışma düzenini değiştiren tarihleri buradan tanımlayın."
              emptyTitle="Özel gün tanımı yok"
              emptyText="Özel gün veya çalışma istisnası bulunmuyor."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCalendarExceptions(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              rowKey={(row) => row.id}
              searchPlaceholder="Özel günlerde ara..."
            />
          </section>}

          {activeSection === 'telephony-connections' && <section className="panel company-panel">
            <div className="management-panel-header">
              <div><PanelTitle icon={<RadioTower size={18} />} title="Telefon Bağlantıları" /><p className="panel-helper">Netgsm SIP trunk, Asterisk endpoint ve kontrollü uluslararası dış arama yetkisini firma bazında yönetin.</p></div>
              {hasWorkspacePermission('telephony.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => openTelephonyConnection()}><Plus size={16} /> Yeni bağlantı</button>}
            </div>
            <PagedGrid
              actionsLabel="Yönet"
              columns={telephonyConnectionGridColumns}
              defaultSortBy="Name"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('telephony.manage') ? <button className="primary-action" type="button" onClick={() => openTelephonyConnection()}><Plus size={15} /> İlk bağlantıyı ekle</button> : undefined}
              emptyDescription="Gelen numara tanımlamadan önce Netgsm veya diğer SIP sağlayıcı bağlantısını oluşturun."
              emptyTitle="Telefon bağlantısı bulunmuyor"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryTelephonyConnections(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={openTelephonyConnection}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('telephony.manage') ? (row) => <div className="grid-row-actions"><button aria-label={`${row.name} bağlantısını düzenle`} className="grid-edit-button" type="button" onClick={() => openTelephonyConnection(row)}><Pencil size={15} /></button><button aria-label={`${row.name} bağlantısını sil`} className="grid-icon-button danger" type="button" onClick={() => void deleteTelephonyConnection(row)}><X size={15} /></button></div> : undefined}
              rowKey={(row) => row.id}
              searchPlaceholder="Bağlantı adı, kodu veya SIP domaininde ara..."
            />
          </section>}

          {activeSection === 'phone-numbers' && <section className="panel company-panel">
            <div className="management-panel-header">
              <div><PanelTitle icon={<PhoneIncoming size={18} />} title="Gelen Numaralar" /><p className="panel-helper">Türkiye ve yurt dışı DID numaralarını varsayılan dil, kuyruk ve uluslararası kabul politikasıyla eşleştirin.</p></div>
              {hasWorkspacePermission('telephony.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => void openInboundNumber()}><Plus size={16} /> Yeni numara</button>}
            </div>
            <PagedGrid
              actionsLabel="Yönet"
              columns={inboundNumberGridColumns}
              defaultSortBy="DisplayName"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('telephony.manage') ? <button className="primary-action" type="button" onClick={() => void openInboundNumber()}><Plus size={15} /> İlk numarayı ekle</button> : undefined}
              emptyDescription="Her numara ayrı ülke, başlangıç dili ve varsayılan çağrı kuyruğuna bağlanabilir."
              emptyTitle="Gelen numara bulunmuyor"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryInboundPhoneNumbers(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={(row) => void openInboundNumber(row)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('telephony.manage') ? (row) => <div className="grid-row-actions"><button aria-label={`${row.e164Number} numarasını düzenle`} className="grid-edit-button" type="button" onClick={() => void openInboundNumber(row)}><Pencil size={15} /></button><button aria-label={`${row.e164Number} numarasını sil`} className="grid-icon-button danger" type="button" onClick={() => void deleteInboundNumber(row)}><X size={15} /></button></div> : undefined}
              rowKey={(row) => row.id}
              searchPlaceholder="Numara, ülke veya başlangıç dilinde ara..."
            />
          </section>}

          {activeSection === 'departments' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<Headphones size={18} />} title="Departman ve Kuyruklar" />
              {hasWorkspacePermission('departments.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => { resetDepartmentDraft(); setIsDepartmentFormOpen(true); }}><Plus size={16} /> Yeni departman</button>}
            </div>
            <PagedGrid
              columns={departmentGridColumns}
              defaultSortBy="Name"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('departments.manage') ? <button className="primary-action" type="button" onClick={() => { resetDepartmentDraft(); setIsDepartmentFormOpen(true); }}><Plus size={15} /> İlk departmanı ekle</button> : undefined}
              emptyDescription="Canlı aktarım, görev dağıtımı ve dil bazlı hizmet için önce kuyrukları tanımlayın."
              emptyTitle="Departman veya kuyruk yok"
              emptyText="Departman veya kuyruk tanımı bulunmuyor."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryDepartments(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              rowKey={(row) => row.id}
              searchPlaceholder="Departman ve kuyruklarda ara..."
            />
          </section>}

          {activeSection === 'queues' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<History size={18} />} title="Çağrı Kuyrukları" />
              {hasWorkspacePermission('queues.manage') && <button className="primary-action" disabled={!selectedCompanyId || departments.length === 0} type="button" onClick={() => { resetQueueDraft(); setIsQueueFormOpen(true); }}><Plus size={16} /> Yeni kuyruk</button>}
            </div>
            <PagedGrid
              actionsLabel="Yönet"
              columns={queueGridColumns}
              defaultSortBy="Priority"
              defaultSortDirection="asc"
              emptyDescription="Çağrıların kapasite, bekleme süresi ve temsilci dağıtım stratejisini burada yönetin."
              emptyTitle="Çağrı kuyruğu bulunmuyor"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCallQueues(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={editQueue}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={(row) => <button aria-label={`${row.name} kuyruğunu yönet`} className="grid-edit-button" type="button" onClick={() => void editQueue(row)}><Pencil size={15} /></button>}
              rowKey={(row) => row.id}
              searchPlaceholder="Kuyruk adı, kodu veya açıklamada ara..."
            />
          </section>}

          {activeSection === 'transfer-targets' && <section className="panel company-panel">
            <div className="management-panel-header">
              <div><PanelTitle icon={<PhoneForwarded size={18} />} title="Aktarım Hedefleri" /><p className="panel-helper">AI görüşmeyi devrettiğinde çalacak SIP dahili, telefon veya harici santral hedeflerini kuyruk bazında yönetin.</p></div>
              {hasWorkspacePermission('transfer-targets.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => void openTransferTarget()}><Plus size={16} /> Yeni hedef</button>}
            </div>
            <PagedGrid
              actionsLabel="Yönet"
              columns={transferTargetGridColumns}
              defaultSortBy="Priority"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('transfer-targets.manage') ? <button className="primary-action" type="button" onClick={() => void openTransferTarget()}><Plus size={15} /> İlk hedefi ekle</button> : undefined}
              emptyDescription="Önce kuyruk ve telefoni bağlantısını tanımlayın; ardından SIP dahili, +90 telefon veya harici SIP URI ekleyin."
              emptyTitle="Aktarım hedefi bulunmuyor"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryTransferTargets(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={(row) => void openTransferTarget(row)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('transfer-targets.manage') ? (row) => <div className="grid-row-actions"><button aria-label={`${row.name} hedefini düzenle`} className="grid-edit-button" type="button" onClick={() => void openTransferTarget(row)}><Pencil size={15} /></button><button aria-label={`${row.name} hedefini sil`} className="grid-icon-button danger" type="button" onClick={() => void deleteTransferTarget(row)}><X size={15} /></button></div> : undefined}
              rowKey={(row) => row.id}
              searchPlaceholder="Hedef adı, kodu, numara veya SIP adresinde ara..."
            />
          </section>}

          {activeSection === 'agent-status' && <section className="panel company-panel">
            <div className="management-panel-header"><PanelTitle icon={<UserRound size={18} />} title="Temsilci Durumları" /><button aria-label="Durumları yenile" className="grid-icon-button" type="button" onClick={() => setGridRefreshVersion((version) => version + 1)}><RefreshCw size={16} /></button></div>
            <div className="paged-grid"><div className="paged-grid-table-shell"><table><thead><tr><th>Temsilci</th><th>Durum</th><th>Son değişiklik</th><th>Aktif çağrı</th></tr></thead><tbody>
              {agentPresences.length === 0 && <tr><td className="paged-grid-message" colSpan={4}>Aktif firma kullanıcısı bulunmuyor.</td></tr>}
              {agentPresences.map((agent) => <tr key={agent.companyUserId}><td><span className="primary-cell"><strong>{agent.displayName}</strong><small>{agent.email}</small></span></td><td><select disabled={!hasWorkspacePermission('agent-status.manage')} value={String(agent.status)} onChange={(event) => void changeAgentStatus(agent.companyUserId, event.target.value as AgentPresenceStatus)}><option value="Offline">Çevrimdışı</option><option value="Available">Uygun</option><option value="Busy">Meşgul</option><option value="WrapUp">Çağrı sonrası işlem</option><option value="Break">Mola</option></select></td><td>{new Date(agent.statusChangedAtUtc).toLocaleString('tr-TR')}</td><td>{agent.activeCallCorrelationId?.slice(0, 12) ?? '-'}</td></tr>)}
            </tbody></table></div></div>
          </section>}

          {activeSection === 'rules' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<GitBranch size={18} />} title="Yönlendirme Kuralları" />
              {hasWorkspacePermission('routing.manage') && <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => { resetRuleDraft(); setIsRuleFormOpen(true); }}><Plus size={16} /> Yeni kural</button>}
            </div>
            <PagedGrid
              columns={ruleGridColumns}
              defaultSortBy="Priority"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('routing.manage') ? <button className="primary-action" type="button" onClick={() => { resetRuleDraft(); setIsRuleFormOpen(true); }}><Plus size={15} /> İlk kuralı ekle</button> : undefined}
              emptyDescription="AI yanıtı, canlı aktarım ve geri arama davranışlarını öncelikli kurallarla yönetin."
              emptyTitle="Yönlendirme kuralı yok"
              emptyText="Yönlendirme kuralı bulunmuyor."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryRoutingRules(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              rowKey={(row) => row.id}
              searchPlaceholder="Kurallarda, intent veya mesajda ara..."
            />
          </section>}

          {activeSection === 'ai-profile' && <section className="panel company-panel ai-profile-panel">
            <div className="management-panel-header">
              <div>
                <PanelTitle icon={<Bot size={18} />} title="AI Asistan Profili" />
                <p className="panel-helper">Asistanın yanıt sınırlarını, güven eşiğini ve temsilciye devir davranışını firma bazında yönetin.</p>
              </div>
              <span className={aiProfile.isEnabled ? 'definition-status ai-enabled' : 'definition-status'}>{aiProfile.isEnabled ? 'AI yanıtı açık' : 'AI yanıtı kapalı'}</span>
            </div>

            {isAiProfileLoading ? (
              <div className="ai-profile-loading"><RefreshCw className="spin" size={18} /> AI politikası yükleniyor</div>
            ) : (
              <div className="ai-profile-grid">
                <div className="ai-profile-section">
                  <div className="ai-section-heading"><strong>Çalışma Profili</strong><small>Model seçimi ve müşteriye görünen ilk yanıt.</small></div>
                  <label className="switch-row"><span><strong>AI asistanı aktif</strong><small>Uygun kurallarda çağrıyı AI karşılar.</small></span><input checked={aiProfile.isEnabled} disabled={!hasWorkspacePermission('ai.manage')} type="checkbox" onChange={(event) => setAiProfile({ ...aiProfile, isEnabled: event.target.checked })} /></label>
                  <div className="form-grid two">
                    <Field label="Sağlayıcı" required><select disabled={!hasWorkspacePermission('ai.manage')} required value={aiProfile.provider} onChange={(event) => setAiProfile({ ...aiProfile, provider: event.target.value })}><option value="OpenAI">OpenAI</option><option value="OpenAICompatible">OpenAI uyumlu API</option></select></Field>
                    <Field label="Model adı" required><input disabled={!hasWorkspacePermission('ai.manage')} required value={aiProfile.modelName} onChange={(event) => setAiProfile({ ...aiProfile, modelName: event.target.value })} placeholder="gpt-4.1-mini" /></Field>
                  </div>
                  <div className="form-grid two">
                    <Field label="AI API adresi" required><input disabled={!hasWorkspacePermission('ai.manage')} required type="url" value={aiProfile.apiBaseUrl} onChange={(event) => setAiProfile({ ...aiProfile, apiBaseUrl: event.target.value })} placeholder="https://api.openai.com/v1/" /></Field>
                    <Field label="API anahtarı secret referansı" required><input disabled={!hasWorkspacePermission('ai.manage')} required value={aiProfile.credentialSecretReference} onChange={(event) => setAiProfile({ ...aiProfile, credentialSecretReference: event.target.value })} placeholder="env://OPENAI_API_KEY" /></Field>
                  </div>
                  <Field label="Karşılama mesajı"><textarea disabled={!hasWorkspacePermission('ai.manage')} value={aiProfile.greetingMessage ?? ''} onChange={(event) => setAiProfile({ ...aiProfile, greetingMessage: event.target.value })} /></Field>
                  <Field label="Sistem talimatı"><textarea className="ai-instructions" disabled={!hasWorkspacePermission('ai.manage')} value={aiProfile.systemInstructions ?? ''} onChange={(event) => setAiProfile({ ...aiProfile, systemInstructions: event.target.value })} placeholder="Asistanın tonu, yapabilecekleri, yapamayacakları ve kaynak kullanma kuralları." /></Field>
                  <p className="ai-secret-note">Sağlayıcı anahtarı burada tutulmaz; canlı bağlantıda sunucu ortam değişkeni veya gizli anahtar kasası kullanılır.</p>
                </div>

                <div className="ai-profile-section">
                  <div className="ai-section-heading"><strong>Güven ve Devir Politikası</strong><small>AI'nin ne zaman duracağını ve temsilciye hangi bağlamı aktaracağını belirleyin.</small></div>
                  <div className="form-grid two">
                    <Field label="Minimum güven skoru" required><input disabled={!hasWorkspacePermission('ai.manage')} max="1" min="0" required step="0.05" type="number" value={aiProfile.minimumConfidence} onChange={(event) => setAiProfile({ ...aiProfile, minimumConfidence: Number(event.target.value) })} /></Field>
                    <Field label="Maksimum fallback" required><input disabled={!hasWorkspacePermission('ai.manage')} max="5" min="0" required type="number" value={aiProfile.maxFallbackAttempts} onChange={(event) => setAiProfile({ ...aiProfile, maxFallbackAttempts: Number(event.target.value) })} /></Field>
                    <Field label="Devir kuyruğu"><select disabled={!hasWorkspacePermission('ai.manage')} value={aiProfile.handoffDepartmentId?.toString() ?? ''} onChange={(event) => setAiProfile({ ...aiProfile, handoffDepartmentId: event.target.value ? Number(event.target.value) : null })}><option value="">Kuralın hedef departmanını kullan</option>{departments.filter((department) => department.isActive).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
                    <Field label="Temsilciye devir mesajı"><input disabled={!hasWorkspacePermission('ai.manage')} value={aiProfile.handoffMessage ?? ''} onChange={(event) => setAiProfile({ ...aiProfile, handoffMessage: event.target.value })} /></Field>
                  </div>
                  <Field label="Fallback mesajı"><textarea disabled={!hasWorkspacePermission('ai.manage')} value={aiProfile.fallbackMessage ?? ''} onChange={(event) => setAiProfile({ ...aiProfile, fallbackMessage: event.target.value })} /></Field>
                  <div className="check-stack ai-policy-options">
                    <label className="check"><input checked={aiProfile.handoffOnHumanRequest} disabled={!hasWorkspacePermission('ai.manage')} type="checkbox" onChange={(event) => setAiProfile({ ...aiProfile, handoffOnHumanRequest: event.target.checked })} /> Müşteri temsilci istediğinde doğrudan devir</label>
                    <label className="check"><input checked={aiProfile.offerCallbackOutsideBusinessHours} disabled={!hasWorkspacePermission('ai.manage')} type="checkbox" onChange={(event) => setAiProfile({ ...aiProfile, offerCallbackOutsideBusinessHours: event.target.checked })} /> Mesai dışındaysa geri arama teklif et</label>
                    <label className="check"><input checked={aiProfile.includeConversationSummaryOnHandoff} disabled={!hasWorkspacePermission('ai.manage')} type="checkbox" onChange={(event) => setAiProfile({ ...aiProfile, includeConversationSummaryOnHandoff: event.target.checked })} /> Devirde temsilciye konuşma özeti gönder</label>
                    <label className="check"><input checked={aiProfile.piiRedactionEnabled} disabled={!hasWorkspacePermission('ai.manage')} type="checkbox" onChange={(event) => setAiProfile({ ...aiProfile, piiRedactionEnabled: event.target.checked })} /> Log ve özette kişisel veriyi maskele</label>
                  </div>
                </div>
              </div>
            )}

            {hasWorkspacePermission('ai.manage') && <div className="ai-profile-footer"><button className="save-button" disabled={isAiProfileLoading || isAiProfileSaving || !selectedCompanyId || !aiProfile.provider.trim() || !aiProfile.modelName.trim() || !aiProfile.apiBaseUrl.trim() || !aiProfile.credentialSecretReference.trim() || aiProfile.minimumConfidence < 0 || aiProfile.minimumConfidence > 1 || aiProfile.maxFallbackAttempts < 0 || aiProfile.maxFallbackAttempts > 5} type="button" onClick={saveAiProfile}>{isAiProfileSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} AI politikasını kaydet</button></div>}
          </section>}

          {activeSection === 'speech-profile' && <section className="panel company-panel ai-profile-panel">
            <div className="management-panel-header">
              <div>
                <PanelTitle icon={<Globe size={18} />} title="Konuşma ve Dil Profili" />
                <p className="panel-helper">Canlı çağrıda konuşmayı yazıya, yanıtı sese dönüştüren sağlayıcıyı; dil, aksan ve sesleri firma bazında yönetin.</p>
              </div>
              <span className={speechProfile.isActive ? 'definition-status ai-enabled' : 'definition-status'}>{speechProfile.isActive ? 'Konuşma servisi açık' : 'Konuşma servisi kapalı'}</span>
            </div>

            <div className="ai-profile-grid">
              <div className="ai-profile-section">
                <div className="ai-section-heading"><strong>Sağlayıcı Bağlantısı</strong><small>İlk canlı test Azure Speech ile hazırlanmıştır.</small></div>
                <label className="switch-row"><span><strong>Konuşma servisi aktif</strong><small>STT ve TTS yalnızca aktif profilde çalışır.</small></span><input checked={speechProfile.isActive} disabled={!hasWorkspacePermission('speech.manage')} type="checkbox" onChange={(event) => setSpeechProfile({ ...speechProfile, isActive: event.target.checked })} /></label>
                <div className="form-grid two">
                  <Field label="Sağlayıcı" required><select disabled={!hasWorkspacePermission('speech.manage')} value={speechProfile.provider} onChange={(event) => setSpeechProfile({ ...speechProfile, provider: event.target.value as SpeechProfile['provider'] })}><option value="AzureSpeech">Azure Speech</option></select></Field>
                  <Field label="Azure bölgesi" required><input disabled={!hasWorkspacePermission('speech.manage')} value={speechProfile.region} onChange={(event) => setSpeechProfile({ ...speechProfile, region: event.target.value })} placeholder="westeurope" /></Field>
                  <Field label="Anahtar secret referansı" required><input disabled={!hasWorkspacePermission('speech.manage')} value={speechProfile.credentialSecretReference} onChange={(event) => setSpeechProfile({ ...speechProfile, credentialSecretReference: event.target.value })} placeholder="env://AZURE_SPEECH_KEY" /></Field>
                  <Field label="Dil algılama"><select disabled={!hasWorkspacePermission('speech.manage')} value={speechProfile.languageIdentificationMode} onChange={(event) => setSpeechProfile({ ...speechProfile, languageIdentificationMode: event.target.value as SpeechProfile['languageIdentificationMode'] })}><option value="Disabled">Kapalı</option><option value="AtStart">Çağrı başında</option><option value="Continuous">Konuşma boyunca</option></select></Field>
                  <Field label="Birincil dil" required><input disabled={!hasWorkspacePermission('speech.manage')} value={speechProfile.primaryLocale} onChange={(event) => setSpeechProfile({ ...speechProfile, primaryLocale: event.target.value })} placeholder="tr-TR" /></Field>
                  <Field label="İlk sessizlik (ms)" required><input disabled={!hasWorkspacePermission('speech.manage')} min="1000" step="100" type="number" value={speechProfile.initialSilenceTimeoutMs} onChange={(event) => setSpeechProfile({ ...speechProfile, initialSilenceTimeoutMs: Number(event.target.value) })} /></Field>
                  <Field label="Cümle sonu sessizliği (ms)" required><input disabled={!hasWorkspacePermission('speech.manage')} min="200" step="100" type="number" value={speechProfile.endSilenceTimeoutMs} onChange={(event) => setSpeechProfile({ ...speechProfile, endSilenceTimeoutMs: Number(event.target.value) })} /></Field>
                </div>
                <div className="check-stack ai-policy-options">
                  <label className="check"><input checked={speechProfile.bargeInEnabled} disabled={!hasWorkspacePermission('speech.manage')} type="checkbox" onChange={(event) => setSpeechProfile({ ...speechProfile, bargeInEnabled: event.target.checked })} /> Arayan konuştuğunda sesli yanıtı kes</label>
                  <label className="check"><input checked={speechProfile.automaticPunctuationEnabled} disabled={!hasWorkspacePermission('speech.manage')} type="checkbox" onChange={(event) => setSpeechProfile({ ...speechProfile, automaticPunctuationEnabled: event.target.checked })} /> Otomatik noktalama</label>
                </div>
                {hasWorkspacePermission('speech.manage') && <button className="save-button" disabled={isSpeechSaving || !selectedCompanyId || !speechProfile.region.trim() || !speechProfile.credentialSecretReference.trim() || !speechProfile.primaryLocale.trim()} type="button" onClick={saveSpeechProfile}>{isSpeechSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} Profili kaydet</button>}
              </div>

              <div className="ai-profile-section">
                <div className="ai-section-heading"><strong>Diller, Aksanlar ve Sesler</strong><small>Öncelik sırası dil algılama adaylarını belirler.</small></div>
                {hasWorkspacePermission('speech.manage') && <>
                  <div className="form-grid two">
                    <Field label="Locale" required><input value={speechLanguageDraft.locale} onChange={(event) => setSpeechLanguageDraft({ ...speechLanguageDraft, locale: event.target.value })} placeholder="tr-TR" /></Field>
                    <Field label="Görünen ad" required><input value={speechLanguageDraft.displayName} onChange={(event) => setSpeechLanguageDraft({ ...speechLanguageDraft, displayName: event.target.value })} placeholder="Türkçe (Türkiye)" /></Field>
                    <Field label="TTS ses adı" required><input value={speechLanguageDraft.voiceName} onChange={(event) => setSpeechLanguageDraft({ ...speechLanguageDraft, voiceName: event.target.value })} placeholder="tr-TR-EmelNeural" /></Field>
                    <Field label="Öncelik"><input min="0" type="number" value={speechLanguageDraft.priority} onChange={(event) => setSpeechLanguageDraft({ ...speechLanguageDraft, priority: Number(event.target.value) })} /></Field>
                  </div>
                  <Field label="Kelime / marka ipuçları"><input value={speechLanguageDraft.phraseHints} onChange={(event) => setSpeechLanguageDraft({ ...speechLanguageDraft, phraseHints: event.target.value })} placeholder="V3RII, ürün adları, şehirler" /></Field>
                  <button className="primary-action" disabled={isSpeechSaving || !speechProfile.id || !speechLanguageDraft.locale.trim() || !speechLanguageDraft.displayName.trim() || !speechLanguageDraft.voiceName.trim()} type="button" onClick={addSpeechLanguage}><Plus size={16} /> Dil ekle</button>
                  {!speechProfile.id && <p className="ai-secret-note">Dil eklemeden önce sağlayıcı profilini kaydedin.</p>}
                </>}
                <div className="speech-language-list">
                  {speechProfile.languages.length === 0 ? <div className="empty-inline">Henüz dil ve ses profili tanımlanmadı.</div> : speechProfile.languages.map((language) => <div className="speech-language-row" key={language.id}>
                    <span className="primary-cell"><strong>{language.displayName}</strong><small>{language.locale} · {language.voiceName}</small></span>
                    <span className="data-badge info">#{language.priority}</span>
                    <span className={language.isActive ? 'data-badge active' : 'data-badge'}>{language.isActive ? 'Aktif' : 'Pasif'}</span>
                    {hasWorkspacePermission('speech.manage') && <button className="icon-button danger" title="Dil profilini sil" type="button" onClick={() => deleteSpeechLanguage(language)}><Trash2 size={15} /></button>}
                  </div>)}
                </div>
              </div>
            </div>
          </section>}

          {activeSection === 'users' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<UserRound size={18} />} title="Firma Kullanıcıları" />
              {hasWorkspacePermission('users.manage') && (
                <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => { resetUserDraft(); setIsUserFormOpen(true); }}>
                  <Plus size={16} /> Yeni kullanıcı
                </button>
              )}
            </div>
            <PagedGrid
              actionsLabel="Düzenle"
              columns={userGridColumns}
              defaultSortBy="DisplayName"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('users.manage') ? <button className="primary-action" type="button" onClick={() => { resetUserDraft(); setIsUserFormOpen(true); }}><Plus size={15} /> İlk kullanıcıyı ekle</button> : undefined}
              emptyDescription="Kullanıcıları seçili firmaya bir rol ve görev tipiyle atayarak erişimlerini yönetin."
              emptyTitle="Firmaya atanmış kullanıcı yok"
              emptyText="Bu firmaya atanmış kullanıcı bulunmuyor."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCompanyUsers(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={editCompanyUser}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('users.manage') ? (row) => (
                <button aria-label={`${row.displayName} kullanıcısını düzenle`} className="grid-edit-button" type="button" onClick={() => editCompanyUser(row)}>
                  <Pencil size={15} />
                </button>
              ) : undefined}
              rowKey={(row) => row.assignmentId}
              searchPlaceholder="Kullanıcı adı, e-posta veya rolde ara..."
            />
          </section>}

          {activeSection === 'roles' && <section className="panel company-panel">
            <div className="management-panel-header">
              <PanelTitle icon={<ShieldCheck size={18} />} title="Roller ve Yetkiler" />
              {hasWorkspacePermission('roles.manage') && (
                <button className="primary-action" disabled={!selectedCompanyId} type="button" onClick={() => { resetRoleDraft(); setIsRoleFormOpen(true); }}>
                  <Plus size={16} /> Yeni rol
                </button>
              )}
            </div>
            <PagedGrid
              actionsLabel="Düzenle"
              columns={roleGridColumns}
              defaultSortBy="Name"
              defaultSortDirection="asc"
              emptyAction={hasWorkspacePermission('roles.manage') ? <button className="primary-action" type="button" onClick={() => { resetRoleDraft(); setIsRoleFormOpen(true); }}><Plus size={15} /> İlk rolü oluştur</button> : undefined}
              emptyDescription="Kullanıcıların hangi modülleri görebileceğini ve hangi işlemleri yapabileceğini rol üzerinden tanımlayın."
              emptyTitle="Firma rolü tanımlanmamış"
              emptyText="Bu firma için henüz rol tanımlanmadı."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCompanyRoles(selectedCompanyId, request) : emptyPage(request)}
              onRowClick={editRole}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('roles.manage') ? (row) => (
                <button aria-label={`${row.name} rolünü düzenle`} className="grid-edit-button" type="button" onClick={() => editRole(row)}>
                  <Pencil size={15} />
                </button>
              ) : undefined}
              rowKey={(row) => row.id}
              searchPlaceholder="Rol adı, kodu veya açıklamada ara..."
            />
          </section>}

          {activeSection === 'simulator' && <section className="panel company-panel simulator">
            <PanelTitle icon={<Play size={18} />} title="Karar Simülasyonu" />
            <div className="form-grid two compact">
              <Field label="Tarih/saat" required>
                <input required type="datetime-local" value={simulationDraft.occurredAt} onChange={(event) => setSimulationDraft({ ...simulationDraft, occurredAt: event.target.value })} />
              </Field>
              <Field label="Dil">
                <input value={simulationDraft.languageCode} onChange={(event) => setSimulationDraft({ ...simulationDraft, languageCode: event.target.value })} />
              </Field>
              <Field label="Intent">
                <input placeholder="reservation, support..." value={simulationDraft.intent} onChange={(event) => setSimulationDraft({ ...simulationDraft, intent: event.target.value })} />
              </Field>
              <Field label="Arayan">
                <input value={simulationDraft.callerNumberMasked} onChange={(event) => setSimulationDraft({ ...simulationDraft, callerNumberMasked: event.target.value })} />
              </Field>
            </div>
            <label className="check">
              <input checked={simulationDraft.writeLog} type="checkbox" onChange={(event) => setSimulationDraft({ ...simulationDraft, writeLog: event.target.checked })} />
              Simülasyonu konuşma loguna yaz
            </label>
            <button className="save-button" type="button" onClick={simulate}>
              <Play size={16} /> Kararı çalıştır
            </button>
            {decision && (
              <div className={decision.isBusinessOpen ? 'decision open' : 'decision closed'}>
                <strong>{actionLabels[String(decision.action)] ?? String(decision.action)}</strong>
                <span>{decision.calendarReason}</span>
                <small>{decision.decisionReason}</small>
              </div>
            )}
          </section>}

          {activeSection === 'call-sessions' && <section className="panel company-panel">
            <div className="management-panel-header"><PanelTitle icon={<Headphones size={18} />} title="Çağrı Oturumları" /></div>
            <PagedGrid
              columns={callSessionGridColumns}
              defaultSortBy="CreatedAtUtc"
              defaultSortDirection="desc"
              emptyDescription="SIP veya WebRTC sağlayıcısı bağlandığında çağrı yaşam döngüsü burada izlenecek."
              emptyTitle="Çağrı oturumu bulunmuyor"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCallSessions(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              rowKey={(row) => row.id}
              searchPlaceholder="Çağrı, numara veya sağlayıcı kimliğinde ara..."
            />
          </section>}

          {activeSection === 'follow-ups' && <section className="panel company-panel">
            <div className="management-panel-header">
              <div><PanelTitle icon={<PhoneIncoming size={18} />} title="Geri Arama ve Mesajlar" /><p className="panel-helper">AI görüşmesinden oluşan geri arama ve sesli mesaj işlerini sonuçlanana kadar izleyin.</p></div>
            </div>
            <PagedGrid
              actionsLabel="İşlem"
              columns={followUpGridColumns}
              defaultSortBy="RequestedAtUtc"
              defaultSortDirection="desc"
              emptyDescription="AI geri arama veya sesli mesaj kararı verdiğinde maskeli talep kaydı burada oluşur."
              emptyTitle="Bekleyen takip işi yok"
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryCallFollowUps(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              renderActions={hasWorkspacePermission('calls.manage') ? (row) => String(row.status) !== 'Completed' && row.status !== 2 ? <button aria-label="Takip işini tamamla" className="grid-icon-button" title="Tamamla" type="button" onClick={() => void completeFollowUp(row)}><Check size={15} /></button> : null : undefined}
              rowKey={(row) => row.id}
              searchPlaceholder="Numara, konuşma özeti veya sonuç notunda ara..."
            />
          </section>}

          {activeSection === 'logs' && <section className="panel logs-panel">
            <PanelTitle icon={<History size={18} />} title="Konuşma Logları" />
            <PagedGrid
              columns={logGridColumns}
              defaultSortBy="StartedAtUtc"
              emptyDescription="Çağrı kararları, simülasyon kayıtları veya işlem logları oluştuğunda burada görünür."
              emptyTitle="Henüz konuşma kaydı yok"
              emptyText="Konuşma veya karar kaydı bulunmuyor."
              fetchPage={(request) => selectedCompanyId ? callCenterApi.queryLogs(selectedCompanyId, request) : emptyPage(request)}
              refreshKey={`${selectedCompanyId}-${gridRefreshVersion}`}
              rowKey={(row) => row.id}
              searchPlaceholder="Kanal, intent, karar veya numarada ara..."
            />
          </section>}
        </div>

        {isExceptionFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsExceptionFormOpen(false)}>
            <aside aria-label="Yeni özel gün" className="form-drawer" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header">
                <div><span>Firma Yönetimi</span><h2>Yeni özel gün</h2><p>Bu tarih için çalışma düzenini ve gerekirse özel bilgilendirme mesajını belirleyin.</p></div>
                <button aria-label="Özel gün formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsExceptionFormOpen(false)}><X size={17} /></button>
              </header>
              <div className="form-drawer-body">
                <div className="form-grid two">
                  <Field label="Tarih" required><input required type="date" value={exceptionDraft.date} onChange={(event) => setExceptionDraft({ ...exceptionDraft, date: event.target.value })} /></Field>
                  <Field label="Başlık" required><input required value={exceptionDraft.title} onChange={(event) => setExceptionDraft({ ...exceptionDraft, title: event.target.value })} placeholder="Bayram, bakım, yarım gün" /></Field>
                </div>
                <label className="check"><input checked={exceptionDraft.isClosed} type="checkbox" onChange={(event) => setExceptionDraft({ ...exceptionDraft, isClosed: event.target.checked })} /> Bu tarihte tamamen kapalı</label>
                <div className="form-grid two">
                  <Field label="Açılış"><input disabled={exceptionDraft.isClosed} type="time" value={exceptionDraft.openTime} onChange={(event) => setExceptionDraft({ ...exceptionDraft, openTime: event.target.value })} /></Field>
                  <Field label="Kapanış"><input disabled={exceptionDraft.isClosed} type="time" value={exceptionDraft.closeTime} onChange={(event) => setExceptionDraft({ ...exceptionDraft, closeTime: event.target.value })} /></Field>
                </div>
                <Field label="Mesaj override"><textarea value={exceptionDraft.messageOverride} onChange={(event) => setExceptionDraft({ ...exceptionDraft, messageOverride: event.target.value })} placeholder="Arayana okunacak özel mesaj" /></Field>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsExceptionFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !exceptionDraft.title.trim()} type="button" onClick={createException}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} Özel günü kaydet</button></footer>
            </aside>
          </div>
        )}

        {isDepartmentFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsDepartmentFormOpen(false)}>
            <aside aria-label="Yeni departman" className="form-drawer" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header">
                <div><span>Operasyon Tanımları</span><h2>Yeni departman</h2><p>Aktarım ve kuyruk yönetiminde kullanılacak operasyon birimini oluşturun.</p></div>
                <button aria-label="Departman formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsDepartmentFormOpen(false)}><X size={17} /></button>
              </header>
              <div className="form-drawer-body">
                <Field label="Departman kodu" required><input required value={departmentDraft.code} onChange={(event) => setDepartmentDraft({ ...departmentDraft, code: event.target.value })} placeholder="support-tr" /></Field>
                <Field label="Departman adı" required><input required value={departmentDraft.name} onChange={(event) => setDepartmentDraft({ ...departmentDraft, name: event.target.value })} placeholder="Türkçe Destek" /></Field>
                <Field label="Dil kodu"><input value={departmentDraft.languageCode} onChange={(event) => setDepartmentDraft({ ...departmentDraft, languageCode: event.target.value })} placeholder="tr-TR" /></Field>
                <label className="check"><input checked={departmentDraft.isActive} type="checkbox" onChange={(event) => setDepartmentDraft({ ...departmentDraft, isActive: event.target.checked })} /> Departman aktif</label>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsDepartmentFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !departmentDraft.code.trim() || !departmentDraft.name.trim()} type="button" onClick={createDepartment}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} Departmanı kaydet</button></footer>
            </aside>
          </div>
        )}

        {isRuleFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsRuleFormOpen(false)}>
            <aside aria-label="Yeni yönlendirme kuralı" className="form-drawer wide" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header">
                <div><span>Operasyon Tanımları</span><h2>Yeni yönlendirme kuralı</h2><p>Gelen talebin hangi koşulda hangi aksiyona yönlendirileceğini belirleyin.</p></div>
                <button aria-label="Yönlendirme kuralı formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsRuleFormOpen(false)}><X size={17} /></button>
              </header>
              <div className="form-drawer-body">
                <div className="form-grid two">
                  <Field label="Kural adı" required><input required value={ruleDraft.name} onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })} placeholder="Mesai dışı destek aktarımı" /></Field>
                  <Field label="Öncelik" required><input min="1" required type="number" value={ruleDraft.priority} onChange={(event) => setRuleDraft({ ...ruleDraft, priority: Number(event.target.value) || 1 })} /></Field>
                  <Field label="Intent"><input value={ruleDraft.matchIntent} onChange={(event) => setRuleDraft({ ...ruleDraft, matchIntent: event.target.value })} placeholder="reservation" /></Field>
                  <Field label="Dil"><input value={ruleDraft.matchLanguageCode} onChange={(event) => setRuleDraft({ ...ruleDraft, matchLanguageCode: event.target.value })} placeholder="tr-TR" /></Field>
                  <Field label="Aksiyon" required><select required value={ruleDraft.action} onChange={(event) => setRuleDraft({ ...ruleDraft, action: event.target.value })}><option value="AiAnswer">AI cevaplasın</option><option value="TransferToQueue">Canlı kuyruğa aktar</option><option value="CreateCallback">Geri arama kaydı</option><option value="PlayMessage">Mesaj oku</option><option value="Voicemail">Sesli mesaj al</option></select></Field>
                  <Field label="Hedef departman"><select value={ruleDraft.targetDepartmentId} onChange={(event) => setRuleDraft({ ...ruleDraft, targetDepartmentId: event.target.value })}><option value="">Departman seçilmedi</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
                </div>
                <Field label="Okunacak mesaj"><textarea value={ruleDraft.message} onChange={(event) => setRuleDraft({ ...ruleDraft, message: event.target.value })} placeholder="Aksiyon mesaj okuyacaksa metni girin" /></Field>
                <div className="check-stack"><label className="check"><input checked={ruleDraft.isActive} type="checkbox" onChange={(event) => setRuleDraft({ ...ruleDraft, isActive: event.target.checked })} /> Kural aktif</label><label className="check"><input checked={ruleDraft.appliesDuringBusinessHours} type="checkbox" onChange={(event) => setRuleDraft({ ...ruleDraft, appliesDuringBusinessHours: event.target.checked })} /> Mesai saatlerinde uygula</label><label className="check"><input checked={ruleDraft.appliesAfterHours} type="checkbox" onChange={(event) => setRuleDraft({ ...ruleDraft, appliesAfterHours: event.target.checked })} /> Mesai dışında uygula</label></div>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsRuleFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !ruleDraft.name.trim()} type="button" onClick={createRule}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} Kuralı kaydet</button></footer>
            </aside>
          </div>
        )}

        {isTelephonyConnectionFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsTelephonyConnectionFormOpen(false)}>
            <aside aria-label={editingTelephonyConnectionId ? 'Telefon bağlantısını düzenle' : 'Yeni telefon bağlantısı'} className="form-drawer wide" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header"><div><span>Telefon Altyapısı</span><h2>{editingTelephonyConnectionId ? 'Bağlantıyı düzenle' : 'Yeni bağlantı'}</h2><p>SIP trunk ve sağlayıcı güvenlik politikasını tanımlayın.</p></div><button aria-label="Telefon bağlantısı formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsTelephonyConnectionFormOpen(false)}><X size={17} /></button></header>
              <div className="form-drawer-body">
                <div className="form-grid two"><Field label="Bağlantı kodu" required><input required value={telephonyConnectionDraft.code} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, code: event.target.value })} placeholder="NETGSM" /></Field><Field label="Bağlantı adı" required><input required value={telephonyConnectionDraft.name} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, name: event.target.value })} placeholder="Netgsm SIP Trunk" /></Field></div>
                <div className="form-grid two"><Field label="Sağlayıcı" required><select value={String(telephonyConnectionDraft.providerType)} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, providerType: event.target.value as TelephonyProviderType })}><option value="Netgsm">Netgsm</option><option value="GenericSip">Generic SIP</option><option value="Twilio">Twilio</option><option value="AzureCommunicationServices">Azure Communication Services</option><option value="Other">Diğer</option></select></Field><Field label="SIP taşıma" required><select value={String(telephonyConnectionDraft.transport)} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, transport: event.target.value as SipTransport })}><option value="Tls">TLS</option><option value="Tcp">TCP</option><option value="Udp">UDP</option></select></Field></div>
                <div className="form-grid two"><Field label="SIP domain"><input value={telephonyConnectionDraft.sipDomain} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, sipDomain: event.target.value })} placeholder="sip.provider.example" /></Field><Field label="Outbound proxy"><input value={telephonyConnectionDraft.outboundProxy} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, outboundProxy: event.target.value })} placeholder="proxy.provider.example:5061" /></Field></div>
                <Field label="SIP kullanıcı adı"><input autoComplete="off" value={telephonyConnectionDraft.authUsername} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, authUsername: event.target.value })} /></Field>
                <div className="form-grid two"><Field label="Credential secret referansı"><input autoComplete="off" value={telephonyConnectionDraft.credentialSecretReference} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, credentialSecretReference: event.target.value })} placeholder="env://NETGSM_SIP_SECRET" /></Field><Field label="Webhook secret referansı"><input autoComplete="off" value={telephonyConnectionDraft.webhookSigningSecretReference} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, webhookSigningSecretReference: event.target.value })} placeholder="env://NETGSM_WEBHOOK_SECRET" /></Field></div>
                <div className="form-grid two"><Field label="Dış API adresi"><input type="url" value={telephonyConnectionDraft.apiBaseUrl} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, apiBaseUrl: event.target.value })} placeholder="https://api.provider.example" /></Field><Field label="Zaman aşımı (sn)" required><input min="2" max="120" type="number" value={telephonyConnectionDraft.requestTimeoutSeconds} onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, requestTimeoutSeconds: Number(event.target.value) })} /></Field></div>
                <div className="check-stack"><label className="check"><input checked={telephonyConnectionDraft.recordingEnabled} type="checkbox" onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, recordingEnabled: event.target.checked })} /> Görüşme kaydı etkin</label><label className="check"><input checked={telephonyConnectionDraft.allowInternationalOutbound} type="checkbox" onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, allowInternationalOutbound: event.target.checked })} /> Bu bağlantıdan uluslararası dış aramaya izin ver</label><label className="check"><input checked={telephonyConnectionDraft.isActive} type="checkbox" onChange={(event) => setTelephonyConnectionDraft({ ...telephonyConnectionDraft, isActive: event.target.checked })} /> Bağlantı aktif</label></div>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsTelephonyConnectionFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !telephonyConnectionDraft.code.trim() || !telephonyConnectionDraft.name.trim()} type="button" onClick={saveTelephonyConnection}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingTelephonyConnectionId ? 'Bağlantıyı güncelle' : 'Bağlantıyı kaydet'}</button></footer>
            </aside>
          </div>
        )}

        {isInboundNumberFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsInboundNumberFormOpen(false)}>
            <aside aria-label={editingInboundNumberId ? 'Gelen numarayı düzenle' : 'Yeni gelen numara'} className="form-drawer" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header"><div><span>Telefon Altyapısı</span><h2>{editingInboundNumberId ? 'Numarayı düzenle' : 'Yeni gelen numara'}</h2><p>DID numarasını ülke, dil ve çağrı kuyruğuna bağlayın.</p></div><button aria-label="Gelen numara formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsInboundNumberFormOpen(false)}><X size={17} /></button></header>
              <div className="form-drawer-body">
                <Field label="Telefon bağlantısı" required><select required value={inboundNumberDraft.providerConnectionId} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, providerConnectionId: event.target.value })}><option value="">Bağlantı seçin</option>{telephonyOptions.connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {connection.code}</option>)}</select></Field>
                <div className="form-grid two"><Field label="Gelen numara" required><input required value={inboundNumberDraft.e164Number} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, e164Number: event.target.value })} placeholder="+902121234567" /></Field><Field label="Görünen ad" required><input required value={inboundNumberDraft.displayName} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, displayName: event.target.value })} placeholder="Türkiye destek hattı" /></Field></div>
                <div className="form-grid two"><Field label="Varsayılan ülke" required><select value={inboundNumberDraft.countryCode} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, countryCode: event.target.value })}><option value="TR">Türkiye</option><option value="GB">Birleşik Krallık</option><option value="DE">Almanya</option><option value="US">ABD / Kanada</option><option value="FR">Fransa</option><option value="NL">Hollanda</option><option value="AE">Birleşik Arap Emirlikleri</option><option value="SA">Suudi Arabistan</option></select></Field><Field label="Başlangıç dili" required><select value={inboundNumberDraft.defaultLocale} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, defaultLocale: event.target.value })}><option value="tr-TR">Türkçe · tr-TR</option><option value="en-GB">English UK · en-GB</option><option value="en-US">English US · en-US</option><option value="de-DE">Deutsch · de-DE</option><option value="fr-FR">Français · fr-FR</option><option value="ar-SA">العربية · ar-SA</option><option value="ru-RU">Русский · ru-RU</option><option value="es-ES">Español · es-ES</option></select></Field></div>
                <Field label="Varsayılan çağrı kuyruğu"><select value={inboundNumberDraft.defaultQueueId} onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, defaultQueueId: event.target.value })}><option value="">Kural motoru karar versin</option>{telephonyOptions.queues.map((queue) => <option key={queue.id} value={queue.id}>{queue.name} · {queue.code}</option>)}</select></Field>
                <div className="check-stack"><label className="check"><input checked={inboundNumberDraft.acceptInbound} type="checkbox" onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, acceptInbound: event.target.checked })} /> Gelen çağrıları kabul et</label><label className="check"><input checked={inboundNumberDraft.acceptInternationalInbound} type="checkbox" onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, acceptInternationalInbound: event.target.checked })} /> Yurt dışından gelen çağrıları kabul et</label><label className="check"><input checked={inboundNumberDraft.allowOutboundCli} type="checkbox" onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, allowOutboundCli: event.target.checked })} /> Giden aramalarda bu numarayı CLI olarak kullan</label><label className="check"><input checked={inboundNumberDraft.isActive} type="checkbox" onChange={(event) => setInboundNumberDraft({ ...inboundNumberDraft, isActive: event.target.checked })} /> Numara aktif</label></div>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsInboundNumberFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !inboundNumberDraft.providerConnectionId || !inboundNumberDraft.e164Number.trim() || !inboundNumberDraft.displayName.trim()} type="button" onClick={saveInboundNumber}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingInboundNumberId ? 'Numarayı güncelle' : 'Numarayı kaydet'}</button></footer>
            </aside>
          </div>
        )}

        {isTransferTargetFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsTransferTargetFormOpen(false)}>
            <aside aria-label={editingTransferTargetId ? 'Aktarım hedefini düzenle' : 'Yeni aktarım hedefi'} className="form-drawer" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header"><div><span>Telefon Altyapısı</span><h2>{editingTransferTargetId ? 'Aktarım hedefini düzenle' : 'Yeni aktarım hedefi'}</h2><p>AI görüşmeyi sonlandırmadan canlı temsilciye veya harici santrale devretsin.</p></div><button aria-label="Aktarım hedefi formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsTransferTargetFormOpen(false)}><X size={17} /></button></header>
              <div className="form-drawer-body">
                <Field label="Çağrı kuyruğu" required><select required value={transferTargetDraft.queueId} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, queueId: event.target.value, companyUserId: '' })}><option value="">Kuyruk seçin</option>{transferTargetOptions.queues.map((queue) => <option key={queue.id} value={queue.id}>{queue.name} · {queue.code}</option>)}</select></Field>
                <div className="form-grid two"><Field label="Hedef kodu" required><input required value={transferTargetDraft.code} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, code: event.target.value })} placeholder="SUPPORT-1001" /></Field><Field label="Hedef adı" required><input required value={transferTargetDraft.name} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, name: event.target.value })} placeholder="Türkçe destek dahili" /></Field></div>
                <Field label="Hedef türü" required><select required value={String(transferTargetDraft.targetType)} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, targetType: event.target.value as TransferTargetType, providerConnectionId: '', destination: '' })}><option value="SipExtension">Asterisk SIP dahili</option><option value="ExternalPhoneNumber">Cep veya sabit telefon</option><option value="ExternalSipUri">Harici SIP santral</option><option value="NetgsmExtensionOrQueue">Netsantral dahili / kuyruk</option></select></Field>
                {(String(transferTargetDraft.targetType) === 'ExternalPhoneNumber' || String(transferTargetDraft.targetType) === 'NetgsmExtensionOrQueue') && <Field label="Telefon sağlayıcı bağlantısı" required><select required value={transferTargetDraft.providerConnectionId} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, providerConnectionId: event.target.value })}><option value="">Sağlayıcı seçin</option>{transferTargetOptions.providers.filter((provider) => String(transferTargetDraft.targetType) !== 'NetgsmExtensionOrQueue' || String(provider.providerType) === 'Netgsm' || provider.providerType === 3).map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {String(provider.providerType)}</option>)}</select></Field>}
                <Field label={String(transferTargetDraft.targetType) === 'ExternalPhoneNumber' ? 'Telefon numarası' : String(transferTargetDraft.targetType) === 'ExternalSipUri' ? 'SIP URI' : String(transferTargetDraft.targetType) === 'NetgsmExtensionOrQueue' ? 'Netsantral dahili / kuyruk kodu' : 'PJSIP dahili'} required><input required value={transferTargetDraft.destination} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, destination: event.target.value })} placeholder={String(transferTargetDraft.targetType) === 'ExternalPhoneNumber' ? '+905321234567' : String(transferTargetDraft.targetType) === 'ExternalSipUri' ? 'sip:destek@santral.firma.com' : '1001'} /></Field>
                <Field label="Temsilci hesabı"><select disabled={!transferTargetDraft.queueId} value={transferTargetDraft.companyUserId} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, companyUserId: event.target.value })}><option value="">Kuyruğun genel hedefi</option>{transferTargetOptions.agents.filter((agent) => agent.queueId.toString() === transferTargetDraft.queueId).map((agent) => <option key={agent.companyUserId} value={agent.companyUserId}>{agent.displayName} · {agent.email}</option>)}</select></Field>
                <div className="form-grid two"><Field label="Öncelik" required><input min="1" max="9999" required type="number" value={transferTargetDraft.priority} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, priority: Number(event.target.value) })} /></Field><Field label="Çalma süresi (sn)" required><input min="5" max="120" required type="number" value={transferTargetDraft.ringTimeoutSeconds} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, ringTimeoutSeconds: Number(event.target.value) })} /></Field></div>
                <Field label="Not"><textarea value={transferTargetDraft.notes} onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, notes: event.target.value })} placeholder="Mesai dışı kullanım veya santral açıklaması" /></Field>
                <div className="check-stack"><label className="check"><input checked={transferTargetDraft.isFallback} type="checkbox" onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, isFallback: event.target.checked })} /> Ana hedefler cevap vermezse yedek olarak kullan</label><label className="check"><input checked={transferTargetDraft.isActive} type="checkbox" onChange={(event) => setTransferTargetDraft({ ...transferTargetDraft, isActive: event.target.checked })} /> Aktarım hedefi aktif</label></div>
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsTransferTargetFormOpen(false)}>Vazgeç</button><button className="save-button" disabled={isFormSaving || !transferTargetDraft.queueId || !transferTargetDraft.code.trim() || !transferTargetDraft.name.trim() || !transferTargetDraft.destination.trim() || ((String(transferTargetDraft.targetType) === 'ExternalPhoneNumber' || String(transferTargetDraft.targetType) === 'NetgsmExtensionOrQueue') && !transferTargetDraft.providerConnectionId)} type="button" onClick={saveTransferTarget}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingTransferTargetId ? 'Hedefi güncelle' : 'Hedefi kaydet'}</button></footer>
            </aside>
          </div>
        )}

        {isQueueFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsQueueFormOpen(false)}>
            <aside aria-label={editingQueueId ? 'Çağrı kuyruğunu yönet' : 'Yeni çağrı kuyruğu'} className="form-drawer wide" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header"><div><span>Operasyon</span><h2>{editingQueueId ? 'Çağrı kuyruğunu yönet' : 'Yeni çağrı kuyruğu'}</h2><p>Çağrı kapasitesini, bekleme sınırını, dağıtımı ve kuyruk üyelerini yönetin.</p></div><button aria-label="Kuyruk formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsQueueFormOpen(false)}><X size={17} /></button></header>
              <div className="form-drawer-body">
                <Field label="Departman" required><select required value={queueDraft.departmentId} onChange={(event) => setQueueDraft({ ...queueDraft, departmentId: event.target.value })}><option value="">Departman seçin</option>{departments.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <div className="form-grid two"><Field label="Kuyruk kodu" required><input required value={queueDraft.code} onChange={(event) => setQueueDraft({ ...queueDraft, code: event.target.value })} placeholder="SUPPORT-TR" /></Field><Field label="Kuyruk adı" required><input required value={queueDraft.name} onChange={(event) => setQueueDraft({ ...queueDraft, name: event.target.value })} placeholder="Türkçe Destek" /></Field></div>
                <Field label="Açıklama"><textarea value={queueDraft.description} onChange={(event) => setQueueDraft({ ...queueDraft, description: event.target.value })} /></Field>
                <div className="form-grid two"><Field label="Dağıtım stratejisi" required><select value={queueDraft.distributionStrategy} onChange={(event) => setQueueDraft({ ...queueDraft, distributionStrategy: event.target.value })}><option value="LongestIdle">En uzun süredir boşta</option><option value="RoundRobin">Sırayla dağıt</option><option value="FewestCalls">En az çağrı alan</option><option value="Random">Rastgele</option></select></Field><Field label="Öncelik" required><input min="1" max="9999" required type="number" value={queueDraft.priority} onChange={(event) => setQueueDraft({ ...queueDraft, priority: Number(event.target.value) })} /></Field></div>
                <div className="form-grid two"><Field label="Maksimum bekleyen çağrı" required><input min="1" required type="number" value={queueDraft.maxWaitingCalls} onChange={(event) => setQueueDraft({ ...queueDraft, maxWaitingCalls: Number(event.target.value) })} /></Field><Field label="Maksimum bekleme (sn)" required><input min="1" required type="number" value={queueDraft.maxWaitSeconds} onChange={(event) => setQueueDraft({ ...queueDraft, maxWaitSeconds: Number(event.target.value) })} /></Field></div>
                <Field label="Çağrı sonrası işlem süresi (sn)" required><input min="0" required type="number" value={queueDraft.wrapUpSeconds} onChange={(event) => setQueueDraft({ ...queueDraft, wrapUpSeconds: Number(event.target.value) })} /></Field>
                <label className="check"><input checked={queueDraft.isActive} type="checkbox" onChange={(event) => setQueueDraft({ ...queueDraft, isActive: event.target.checked })} /> Kuyruk aktif</label>
                {editingQueueId && <section className="queue-members-section">
                  <div className="queue-members-heading"><div><strong>Kuyruk üyeleri</strong><small>Temsilci yetkinliği ve dağıtım önceliği</small></div><span className="data-count">{queueMembers.length}</span></div>
                  {hasWorkspacePermission('queues.manage') && <div className="queue-member-add-row">
                    <Field label="Temsilci" required><select disabled={isQueueMembersLoading} value={queueMemberDraft.companyUserId} onChange={(event) => setQueueMemberDraft({ ...queueMemberDraft, companyUserId: event.target.value })}><option value="">Temsilci seçin</option>{queueMemberCandidates.filter((user) => !queueMembers.some((member) => member.companyUserId === user.companyUserId)).map((user) => <option key={user.companyUserId} value={user.companyUserId}>{user.displayName} · {user.email}</option>)}</select></Field>
                    <Field label="Yetkinlik" required><select value={queueMemberDraft.skillLevel} onChange={(event) => setQueueMemberDraft({ ...queueMemberDraft, skillLevel: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}</select></Field>
                    <Field label="Öncelik" required><input min="1" max="9999" type="number" value={queueMemberDraft.priority} onChange={(event) => setQueueMemberDraft({ ...queueMemberDraft, priority: Number(event.target.value) })} /></Field>
                    <button aria-label="Temsilciyi kuyruğa ekle" className="primary-action queue-member-add-button" disabled={isFormSaving || !queueMemberDraft.companyUserId} type="button" onClick={addQueueMember}><Plus size={16} /> Ekle</button>
                  </div>}
                  <div className="queue-member-list">
                    {isQueueMembersLoading && <div className="queue-members-empty"><RefreshCw className="spin" size={16} /> Üyeler yükleniyor</div>}
                    {!isQueueMembersLoading && queueMembers.length === 0 && <div className="queue-members-empty">Bu kuyruğa henüz temsilci atanmadı.</div>}
                    {!isQueueMembersLoading && queueMembers.map((member) => <div className="queue-member-row" key={member.id}><span className="primary-cell"><strong>{member.displayName}</strong><small>{member.email}</small></span><label className="inline-member-field">Yetkinlik<select disabled={!hasWorkspacePermission('queues.manage')} value={member.skillLevel} onChange={(event) => void updateQueueMember(member, { skillLevel: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}/5</option>)}</select></label><label className="inline-member-field">Öncelik<input disabled={!hasWorkspacePermission('queues.manage')} min="1" max="9999" type="number" value={member.priority} onBlur={(event) => void updateQueueMember(member, { priority: Number(event.target.value) })} onChange={(event) => setQueueMembers((items) => items.map((item) => item.id === member.id ? { ...item, priority: Number(event.target.value) } : item))} /></label>{hasWorkspacePermission('queues.manage') && <button aria-label={`${member.displayName} temsilcisini kuyruktan çıkar`} className="grid-icon-button danger" disabled={isFormSaving} type="button" onClick={() => void removeQueueMember(member)}><X size={15} /></button>}</div>)}
                  </div>
                </section>}
              </div>
              <footer className="form-drawer-footer"><button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsQueueFormOpen(false)}>Vazgeç</button>{hasWorkspacePermission('queues.manage') && <button className="save-button" disabled={isFormSaving || !queueDraft.departmentId || !queueDraft.code.trim() || !queueDraft.name.trim()} type="button" onClick={saveQueue}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingQueueId ? 'Kuyruğu güncelle' : 'Kuyruğu kaydet'}</button>}</footer>
            </aside>
          </div>
        )}

        {isUserFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsUserFormOpen(false)}>
            <aside aria-label={editingUserAssignmentId ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı'} className="form-drawer" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header">
                <div>
                  <span>Erişim Yönetimi</span>
                  <h2>{editingUserAssignmentId ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı'}</h2>
                  <p>Kullanıcı hesabını seçili firmaya rol ve görev tipiyle bağlayın.</p>
                </div>
                <button aria-label="Kullanıcı formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsUserFormOpen(false)}><X size={17} /></button>
              </header>
              <div className="form-drawer-body">
                <Field label="E-posta" required>
                  <input
                    autoComplete="off"
                    disabled={editingUserAssignmentId !== null}
                    required
                    type="email"
                    value={userDraft.email}
                    onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })}
                  />
                </Field>
                <Field label="Ad soyad / görünen ad" required>
                  <input autoComplete="off" required value={userDraft.displayName} onChange={(event) => setUserDraft({ ...userDraft, displayName: event.target.value })} />
                </Field>
                <Field label={editingUserAssignmentId ? 'Yeni şifre (değişmeyecekse boş)' : 'Geçici şifre'} required={editingUserAssignmentId === null}>
                  <input autoComplete="new-password" required={editingUserAssignmentId === null} type="password" value={userDraft.password} onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })} />
                </Field>
                <Field label="Firma rolü" required>
                  <select required value={userDraft.companyRoleId} onChange={(event) => setUserDraft({ ...userDraft, companyRoleId: event.target.value })}>
                    <option value="">Rol seçin</option>
                    {companyRoles.filter((role) => role.isActive).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </Field>
                <Field label="Temel görev tipi">
                  <select value={userDraft.legacyRole} onChange={(event) => setUserDraft({ ...userDraft, legacyRole: event.target.value as LegacyCompanyRole })}>
                    <option value="Agent">Temsilci</option>
                    <option value="Supervisor">Süpervizör</option>
                    <option value="CompanyAdmin">Firma yöneticisi</option>
                  </select>
                </Field>
                <div className="check-stack">
                  <label className="check"><input checked={userDraft.isUserActive} type="checkbox" onChange={(event) => setUserDraft({ ...userDraft, isUserActive: event.target.checked })} /> Kullanıcı hesabı aktif</label>
                  <label className="check"><input checked={userDraft.isAssignmentActive} type="checkbox" onChange={(event) => setUserDraft({ ...userDraft, isAssignmentActive: event.target.checked })} /> Firma ataması aktif</label>
                </div>
              </div>
              <footer className="form-drawer-footer">
                <button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsUserFormOpen(false)}>Vazgeç</button>
                <button className="save-button" disabled={isFormSaving || !userDraft.email.trim() || !userDraft.displayName.trim() || !userDraft.companyRoleId || (editingUserAssignmentId === null && userDraft.password.length < 8)} type="button" onClick={saveCompanyUser}>
                  {isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingUserAssignmentId ? 'Güncelle' : 'Kullanıcıyı ekle'}
                </button>
              </footer>
            </aside>
          </div>
        )}

        {isRoleFormOpen && (
          <div className="drawer-backdrop" role="presentation" onMouseDown={() => setIsRoleFormOpen(false)}>
            <aside aria-label={editingRoleId ? 'Rolü düzenle' : 'Yeni rol'} className="form-drawer wide" onMouseDown={(event) => event.stopPropagation()}>
              <header className="form-drawer-header">
                <div>
                  <span>Erişim Yönetimi</span>
                  <h2>{editingRoleId ? 'Rolü düzenle' : 'Yeni firma rolü'}</h2>
                  <p>İzinler yalnızca seçili firma ve bu role atanmış kullanıcılar için geçerlidir.</p>
                </div>
                <button aria-label="Rol formunu kapat" className="grid-icon-button" type="button" onClick={() => setIsRoleFormOpen(false)}><X size={17} /></button>
              </header>
              <div className="form-drawer-body">
                <div className="form-grid two">
                  <Field label="Rol kodu" required><input required value={roleDraft.code} onChange={(event) => setRoleDraft({ ...roleDraft, code: event.target.value })} placeholder="supervisor-tr" /></Field>
                  <Field label="Rol adı" required><input required value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} placeholder="Süpervizör" /></Field>
                </div>
                <Field label="Açıklama"><textarea value={roleDraft.description} onChange={(event) => setRoleDraft({ ...roleDraft, description: event.target.value })} /></Field>
                <label className="check"><input checked={roleDraft.isActive} type="checkbox" onChange={(event) => setRoleDraft({ ...roleDraft, isActive: event.target.checked })} /> Rol aktif</label>
                <div className="permission-groups">
                  {[...new Set(permissions.map((permission) => permission.module))].map((module) => (
                    <div className="permission-group" key={module}>
                      <strong>{module}</strong>
                      {permissions.filter((permission) => permission.module === module).map((permission) => (
                        <label className="permission-option" key={permission.code}>
                          <input checked={roleDraft.permissionCodes.includes(permission.code)} type="checkbox" onChange={() => toggleRolePermission(permission.code)} />
                          <span><strong>{permission.name}</strong><small>{permission.description}</small></span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <footer className="form-drawer-footer">
                <button className="secondary-action" disabled={isFormSaving} type="button" onClick={() => setIsRoleFormOpen(false)}>Vazgeç</button>
                <button className="save-button" disabled={isFormSaving || !roleDraft.code.trim() || !roleDraft.name.trim()} type="button" onClick={saveRole}>{isFormSaving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} {editingRoleId ? 'Rolü güncelle' : 'Rolü oluştur'}</button>
              </footer>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span aria-hidden="true" className="required-mark">*</span>}
      </span>
      <div className="field-control">{children}</div>
    </label>
  );
}

function LoginField({
  action,
  icon,
  invalid = false,
  label,
  required = false,
  children,
}: {
  action?: React.ReactNode;
  icon: React.ReactNode;
  invalid?: boolean;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="login-field">
      <span className={action ? 'login-field-head' : 'login-field-label-wrap'}>
        <span className="login-field-label">
          {label}
          {required && <span aria-hidden="true" className="login-field-required">*</span>}
        </span>
        {action}
      </span>
      <div className={invalid ? 'login-field-shell is-invalid' : 'login-field-shell'}>
        <div className="login-field-glow" aria-hidden="true" />
        <div className="login-field-icon">{icon}</div>
        {children}
      </div>
    </label>
  );
}

function CustomSelect({
  compact = false,
  icon,
  isLoading = false,
  label,
  loadingText = 'Yükleniyor',
  onChange,
  options,
  value,
}: {
  compact?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
  label?: string;
  loadingText?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className="relative w-full min-w-0 max-w-full" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        className={compact ? 'select-trigger select-trigger-compact' : 'select-trigger'}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        {icon && <span className="select-trigger-leading">{icon}</span>}
        <span className="select-trigger-value min-w-0 flex-1 truncate text-left">
          {label && compact ? <span className="select-trigger-label text-slate-500">{label}</span> : null}
          {isLoading ? loadingText : selectedOption?.label}
        </span>
        <ChevronDown className={isOpen ? 'rotate-180 transition-transform shrink-0' : 'transition-transform shrink-0'} size={16} />
      </button>

      {isOpen && (
        <div className={compact ? 'select-content select-content-compact' : 'select-content'}>
          {isLoading ? (
            <div className="select-empty">{loadingText}</div>
          ) : (
            options.map((option) => (
              <button
                className={option.value === value ? 'select-item select-item-active' : 'select-item'}
                key={option.value || '__empty'}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.helper && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{option.helper}</span>}
                </span>
                {option.value === value && <Check size={15} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ThemeBootLoader({ theme, mode }: { theme: AppTheme; mode: AppMode }) {
  const copy =
    theme === 'retro'
      ? { title: 'SYSTEM BOOT', subtitle: 'Oturum yükleniyor...' }
      : theme === 'classic'
        ? { title: 'V3RII', subtitle: 'Oturum yükleniyor' }
        : { title: 'V3RII Call Center', subtitle: 'Uzaya bağlanıyor...' };

  return (
    <main className="app-shell theme-boot-loader" data-theme={theme} data-mode={mode} aria-busy="true" aria-live="polite">
      <div className="theme-boot-stage">
        {theme === 'space' && (
          <div className="theme-boot-orbit" aria-hidden="true">
            <span className="theme-boot-planet theme-boot-planet-a" />
            <span className="theme-boot-planet theme-boot-planet-b" />
            <span className="theme-boot-planet theme-boot-planet-c" />
            <div className="theme-boot-ring theme-boot-ring-lg">
              <Rocket className="theme-boot-sat" size={22} strokeWidth={1.6} />
            </div>
            <div className="theme-boot-ring theme-boot-ring-md">
              <Orbit className="theme-boot-sat" size={20} strokeWidth={1.6} />
            </div>
            <div className="theme-boot-ring theme-boot-ring-sm">
              <Star className="theme-boot-sat" size={18} strokeWidth={1.6} />
            </div>
            <div className="theme-boot-core">
              <Sparkles size={28} strokeWidth={1.5} />
            </div>
          </div>
        )}

        {theme === 'retro' && (
          <div className="theme-boot-retro" aria-hidden="true">
            <div className="theme-boot-retro-frame">
              <div className="theme-boot-retro-scan" />
              <div className="theme-boot-retro-icons">
                <Gamepad2 className="theme-boot-retro-icon theme-boot-retro-icon-a" size={28} strokeWidth={1.8} />
                <Monitor className="theme-boot-retro-icon theme-boot-retro-icon-b" size={28} strokeWidth={1.8} />
                <Disc3 className="theme-boot-retro-icon theme-boot-retro-icon-c" size={28} strokeWidth={1.8} />
                <Cpu className="theme-boot-retro-icon theme-boot-retro-icon-d" size={28} strokeWidth={1.8} />
              </div>
              <div className="theme-boot-retro-bar">
                <span /><span /><span /><span /><span /><span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {theme === 'classic' && (
          <div className="theme-boot-classic" aria-hidden="true">
            <div className="theme-boot-classic-ring">
              <Building2 className="theme-boot-classic-icon theme-boot-classic-icon-a" size={22} strokeWidth={1.7} />
              <Headphones className="theme-boot-classic-icon theme-boot-classic-icon-b" size={22} strokeWidth={1.7} />
              <Phone className="theme-boot-classic-icon theme-boot-classic-icon-c" size={22} strokeWidth={1.7} />
              <ShieldCheck className="theme-boot-classic-icon theme-boot-classic-icon-d" size={22} strokeWidth={1.7} />
            </div>
            <div className="theme-boot-classic-core">
              <img src={v3Logo} alt="" className="theme-boot-classic-logo" />
            </div>
          </div>
        )}

        <div className="theme-boot-copy">
          {theme !== 'classic' && (
            <img src={theme === 'retro' ? v3Logo : callCenterLogo} alt="V3RII" className="theme-boot-brand" />
          )}
          <strong>{copy.title}</strong>
          <span>{copy.subtitle}</span>
        </div>
      </div>
    </main>
  );
}

function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let stars: { x: number; y: number; radius: number; vx: number; vy: number; color: string }[] = [];
    const colors = ['#ffffff', '#06b6d4', '#ec4899', '#f97316', '#ffffff'];

    const initStars = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.floor((width * height) / 1400);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#05020A';
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0 || star.x > width) star.vx *= -1;
        if (star.y < 0 || star.y > height) star.vy *= -1;

        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = star.color;
        context.globalAlpha = 0.45 + Math.random() * 0.45;
        context.fill();
      }

      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    initStars();
    draw();
    window.addEventListener('resize', initStars);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', initStars);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" />;
}

export default App;
