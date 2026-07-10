import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  GitBranch,
  Globe2,
  Headphones,
  History,
  Lock,
  LogIn,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import './App.css';
import {
  callCenterApi,
  type AuthContext,
  type AuthCompany,
  type BusinessHour,
  type CalendarException,
  type Company,
  type ConversationLog,
  type DecisionResult,
  type Department,
  type RoutingAction,
  type RoutingRule,
} from './api';

const dayLabels = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
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
  companyLoadFailed: string;
  checking: string;
  invalidLogin: string;
  companyRequired: string;
  loginFailed: string;
  loginSuccess: string;
}> = {
  tr: {
    brandSuffix: 'COMMS',
    heroLine1: 'Müşteri',
    heroLine2: 'İletişim',
    heroLine3: 'Merkezi',
    heroText: 'Temsilci ve yönetici portalına erişmek için firma ve kullanıcı bilgilerinizi doğrulayın.',
    serverStatus: 'SUNUCU DURUMU',
    online: 'ÇEVRİMİÇİ',
    securityProtocol: 'GÜVENLİK PROTOKOLÜ',
    active: 'AKTİF',
    title: 'Temsilci Girişi',
    subtitle: 'Devam etmek için operatör bilgilerinizi giriniz.',
    company: 'Firma',
    companyPlaceholder: 'Super admin / firma seçmeden giriş',
    operator: 'Operatör ID / E-posta',
    operatorPlaceholder: 'admin@v3rii.com',
    password: 'Erişim Kodu',
    forgotCode: 'Kodu unuttum',
    remember: 'Terminali hatırla',
    submit: 'Sisteme Bağlan',
    securityNetwork: 'V3RII Güvenlik Ağı © 2026',
    language: 'Dil',
    required: 'E-posta ve şifre zorunlu',
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

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [loginCompanies, setLoginCompanies] = useState<AuthCompany[]>([]);
  const [isLoginCompaniesLoading, setIsLoginCompaniesLoading] = useState(false);
  const [loginDraft, setLoginDraft] = useState({
    email: 'admin@v3rii.com',
    password: '',
    companyId: '',
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyDraft, setCompanyDraft] = useState(emptyCompany);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [exceptions, setExceptions] = useState<CalendarException[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [status, setStatus] = useState('Hazır');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginLanguage, setLoginLanguage] = useState<LoginLanguageCode>('tr');
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

  useEffect(() => {
    const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
    if (token) {
      void bootstrap();
    } else {
      void loadLoginCompanies();
    }
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    void refreshCompanyData(selectedCompanyId);
  }, [selectedCompanyId]);

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
    setStatus('Oturum bağlamı yükleniyor');
    const context = await callCenterApi.authContext();
    setAuthContext(context);
    setSelectedCompanyId(context.selectedCompanyId ?? context.companies[0]?.id ?? null);
    await refreshCompanies(context);
  }

  async function loadLoginCompanies() {
    try {
      setIsLoginCompaniesLoading(true);
      const data = await callCenterApi.loginCompanies();
      setLoginCompanies(data);
    } catch {
      setLoginCompanies([]);
      setStatus(loginText.companyLoadFailed);
    } finally {
      setIsLoginCompaniesLoading(false);
    }
  }

  async function login(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!loginDraft.email.trim() || !loginDraft.password.trim()) {
      setStatus(loginText.required);
      return;
    }

    let response;
    try {
      setStatus(loginText.checking);
      response = await callCenterApi.login({
        email: loginDraft.email,
        password: loginDraft.password,
        companyId: loginDraft.companyId ? Number(loginDraft.companyId) : null,
      });
    } catch {
      setStatus(loginText.invalidLogin);
      return;
    }

    if (response.requiresCompanySelection) {
      setLoginCompanies(response.companies);
      setLoginDraft((draft) => ({ ...draft, companyId: draft.companyId || response.companies[0]?.id.toString() || '' }));
      setStatus(response.message ?? loginText.companyRequired);
      return;
    }

    if (!response.success || !response.token || !response.context) {
      setStatus(response.message ?? loginText.loginFailed);
      return;
    }

    localStorage.setItem('access_token', response.token);
    setAuthContext(response.context);
    setSelectedCompanyId(response.context.selectedCompanyId ?? response.context.companies[0]?.id ?? null);
    setLoginCompanies([]);
    await refreshCompanies(response.context);
    setStatus(loginText.loginSuccess);
  }

  function logout() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    setAuthContext(null);
    setCompanies([]);
    setSelectedCompanyId(null);
    setBusinessHours([]);
    setExceptions([]);
    setDepartments([]);
    setRules([]);
    setLogs([]);
    setDecision(null);
    setStatus('Çıkış yapıldı');
  }

  async function refreshCompanies(context = authContext) {
    setStatus('Firmalar yükleniyor');
    const data = await callCenterApi.companies();
    setCompanies(data);
    setSelectedCompanyId((current) => current ?? context?.selectedCompanyId ?? data[0]?.id ?? null);
    setStatus('Hazır');
  }

  async function refreshCompanyData(companyId: number) {
    setStatus('Firma kuralları yükleniyor');
    const [hoursData, exceptionData, departmentData, ruleData, logData] = await Promise.all([
      callCenterApi.businessHours(companyId),
      callCenterApi.calendarExceptions(companyId),
      callCenterApi.departments(companyId),
      callCenterApi.routingRules(companyId),
      callCenterApi.logs(companyId),
    ]);
    setBusinessHours(hoursData);
    setExceptions(exceptionData);
    setDepartments(departmentData);
    setRules(ruleData);
    setLogs(logData);
    setStatus('Hazır');
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
    const saved = await callCenterApi.upsertBusinessHour(selectedCompanyId, dayIndex, payload);
    setBusinessHours((items) => [...items.filter((item) => Number(item.dayOfWeek) !== dayIndex), saved]);
  }

  async function createException() {
    if (!selectedCompanyId || !exceptionDraft.title.trim()) return;
    const created = await callCenterApi.createCalendarException(selectedCompanyId, {
      ...exceptionDraft,
      openTime: exceptionDraft.isClosed ? null : exceptionDraft.openTime,
      closeTime: exceptionDraft.isClosed ? null : exceptionDraft.closeTime,
    });
    setExceptions((items) => [created, ...items]);
    setExceptionDraft((draft) => ({ ...draft, title: '', messageOverride: '' }));
  }

  async function createDepartment() {
    if (!selectedCompanyId || !departmentDraft.code.trim() || !departmentDraft.name.trim()) return;
    const created = await callCenterApi.createDepartment(selectedCompanyId, {
      ...departmentDraft,
      languageCode: departmentDraft.languageCode || null,
    });
    setDepartments((items) => [...items, created]);
    setDepartmentDraft({ code: '', name: '', languageCode: '', isActive: true });
  }

  async function createRule() {
    if (!selectedCompanyId || !ruleDraft.name.trim()) return;
    const created = await callCenterApi.createRoutingRule(selectedCompanyId, {
      ...ruleDraft,
      action: ruleDraft.action as RoutingAction,
      targetDepartmentId: ruleDraft.targetDepartmentId ? Number(ruleDraft.targetDepartmentId) : null,
      matchIntent: ruleDraft.matchIntent || null,
      matchLanguageCode: ruleDraft.matchLanguageCode || null,
      message: ruleDraft.message || null,
    });
    setRules((items) => [...items, created].sort((a, b) => a.priority - b.priority));
    setRuleDraft((draft) => ({ ...draft, name: '', matchIntent: '', message: '' }));
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
      setLogs(await callCenterApi.logs(selectedCompanyId));
    }
    setStatus('Simülasyon tamamlandı');
  }

  if (!authContext) {
    return (
      <main
        className={
          isLoginRtl
            ? 'login-rtl relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050914] px-4 py-8 text-slate-200'
            : 'relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050914] px-4 py-8 text-slate-200'
        }
        dir={isLoginRtl ? 'rtl' : 'ltr'}
      >
        <SpaceBackground />
        <WanderingRocket />

        <section className="glass-panel relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl md:grid-cols-2">
          <div className="relative hidden overflow-hidden border-r border-blue-500/20 bg-gradient-to-br from-blue-900/40 to-purple-900/40 p-10 md:flex md:min-h-[620px] md:flex-col md:justify-between">
            <div className="pointer-events-none absolute -bottom-20 -left-20 opacity-20">
              <PlanetMark />
            </div>

            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-3">
                <Rocket className="shuttle-anim text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.75)]" size={34} />
                <h2 className="brand-font text-2xl font-bold tracking-widest text-white">
                  V3RII<span className="text-blue-300">{loginText.brandSuffix}</span>
                </h2>
              </div>
              <h1 className="brand-font text-4xl font-bold leading-tight text-white">
                {loginText.heroLine1}
                <br />
                {loginText.heroLine2}
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{loginText.heroLine3}</span>
              </h1>
              <p className="mt-5 max-w-xs text-sm leading-6 text-gray-400">
                {loginText.heroText}
              </p>
            </div>

            <div className="relative z-10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between rounded border border-gray-700/50 bg-black/30 p-2">
                <span className="text-gray-400">{loginText.serverStatus}</span>
                <span className="flex items-center text-green-400">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  {loginText.online}
                </span>
              </div>
              <div className="flex items-center justify-between rounded border border-gray-700/50 bg-black/30 p-2">
                <span className="text-gray-400">{loginText.securityProtocol}</span>
                <span className="text-blue-400">{loginText.active} (V4.2)</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[620px] flex-col justify-center bg-[#0b1120]/80 p-8 md:p-12">
            <div className="mb-6 flex justify-end">
              <div className="w-full max-w-72">
                <CustomSelect
                  compact
                  icon={<Globe2 size={15} />}
                  label={loginText.language}
                  onChange={(value) => setLoginLanguage(value as LoginLanguageCode)}
                  options={languageOptions}
                  value={loginLanguage}
                />
              </div>
            </div>

            <div className="mb-8 flex items-center justify-center gap-2 md:hidden">
              <Rocket className="shuttle-anim text-blue-400" size={26} />
              <h2 className="brand-font text-xl font-bold tracking-widest text-white">
                V3RII<span className="text-blue-300">{loginText.brandSuffix}</span>
              </h2>
            </div>

            <h3 className="brand-font neon-text text-2xl font-semibold text-white">{loginText.title}</h3>
            <p className="mb-8 mt-2 text-sm text-gray-400">{loginText.subtitle}</p>

            <form className="space-y-6" onSubmit={(event) => void login(event)}>
              <LoginField icon={<Building2 size={17} />} label={loginText.company}>
                <CustomSelect
                  isLoading={isLoginCompaniesLoading}
                  loadingText="Yükleniyor"
                  onChange={(value) => setLoginDraft({ ...loginDraft, companyId: value })}
                  options={companyOptions}
                  value={loginDraft.companyId}
                />
              </LoginField>

              <LoginField icon={<UserRound size={17} />} label={loginText.operator}>
                <input
                  className="login-control"
                  placeholder={loginText.operatorPlaceholder}
                  value={loginDraft.email}
                  onChange={(event) => setLoginDraft({ ...loginDraft, email: event.target.value })}
                />
              </LoginField>

              <LoginField
                action={
                  <button className="text-xs text-blue-400 transition-colors hover:text-blue-300" type="button">
                    {loginText.forgotCode}
                  </button>
                }
                icon={<Lock size={17} />}
                label={loginText.password}
              >
                <input
                  className="login-control login-control-password"
                  placeholder="••••••••"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={loginDraft.password}
                  onChange={(event) => setLoginDraft({ ...loginDraft, password: event.target.value })}
                />
                <button
                  aria-label={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="login-password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-200"
                  type="button"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                >
                  {isPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </LoginField>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                <input className="login-checkbox" type="checkbox" />
                <span className="select-none">{loginText.remember}</span>
              </label>

              <button
                className="login-btn brand-font mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white"
                type="submit"
              >
                <span>{loginText.submit}</span>
                <LogIn size={17} />
              </button>
            </form>

            <div className="mt-4 min-h-11 rounded border border-blue-400/20 bg-blue-950/20 p-3 text-center text-sm text-blue-200">
              {status}
            </div>

            <div className="mt-12 text-center">
              <p className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                <ShieldCheck size={13} /> {loginText.securityNetwork}
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Headphones size={24} />
          <div>
            <strong>V3RII Call Center</strong>
            <span>Rule admin</span>
          </div>
        </div>

        {authContext?.isSuperAdmin && (
          <button className="primary-action" type="button" onClick={() => {
            setSelectedCompanyId(null);
            setCompanyDraft(emptyCompany);
          }}>
            <Plus size={16} /> Yeni firma
          </button>
        )}

        <div className="role-box">
          <strong>{authContext?.displayName ?? 'Oturum bekleniyor'}</strong>
          <span>{authContext?.isSuperAdmin ? 'Süper admin' : 'Firma admini'}</span>
        </div>

        <button className="logout-button" type="button" onClick={logout}>
          <LogOut size={16} /> Çıkış
        </button>

        <div className="company-list">
          {companies.map((company) => (
            <button
              className={company.id === selectedCompanyId ? 'company-item active' : 'company-item'}
              key={company.id}
              type="button"
              onClick={() => setSelectedCompanyId(company.id)}
            >
              <Building2 size={16} />
              <span>{company.name}</span>
              <small>{company.code}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Kural Tanımları</h1>
            <p>Firma bazında mesai, özel gün, departman ve yönlendirme kararlarını yönetin.</p>
          </div>
          <div className="status-pill">
            <RefreshCw size={14} />
            {status}
          </div>
        </header>

        <div className="grid">
          <section className="panel company-panel">
            <PanelTitle icon={<Building2 size={18} />} title="Firma Tanımı" />
            {!authContext?.isSuperAdmin && (
              <div className="notice">Firma tanımlama ve firma ana bilgileri sadece süper admin tarafından yönetilir.</div>
            )}
            <div className="form-grid two">
              <Field label="Kod">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.code} onChange={(event) => setCompanyDraft({ ...companyDraft, code: event.target.value })} />
              </Field>
              <Field label="Firma adı">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.name} onChange={(event) => setCompanyDraft({ ...companyDraft, name: event.target.value })} />
              </Field>
              <Field label="Firma tipi">
                <select disabled={!authContext?.isSuperAdmin} value={companyDraft.companyType} onChange={(event) => setCompanyDraft({ ...companyDraft, companyType: event.target.value })}>
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
              <Field label="Zaman dilimi">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.timeZoneId} onChange={(event) => setCompanyDraft({ ...companyDraft, timeZoneId: event.target.value })} />
              </Field>
              <Field label="Varsayılan dil">
                <input disabled={!authContext?.isSuperAdmin} value={companyDraft.defaultLanguageCode} onChange={(event) => setCompanyDraft({ ...companyDraft, defaultLanguageCode: event.target.value })} />
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
              <button className="save-button" type="button" onClick={saveCompany}>
                <Save size={16} /> Firmayı kaydet
              </button>
            )}
          </section>

          <section className="panel">
            <PanelTitle icon={<Clock3 size={18} />} title="Haftalık Çalışma Saatleri" />
            <div className="hours-list">
              {dayLabels.map((label, dayIndex) => {
                const item = businessHours.find((hour) => Number(hour.dayOfWeek) === dayIndex);
                return (
                  <div className="hour-row" key={label}>
                    <strong>{label}</strong>
                    <label className="check">
                      <input
                        checked={item?.isClosed ?? dayIndex === 0}
                        type="checkbox"
                        onChange={(event) => void saveBusinessHour(dayIndex, { isClosed: event.target.checked })}
                      />
                      Kapalı
                    </label>
                    <input
                      disabled={item?.isClosed}
                      type="time"
                      value={(item?.openTime ?? '09:00').slice(0, 5)}
                      onChange={(event) => void saveBusinessHour(dayIndex, { openTime: event.target.value })}
                    />
                    <input
                      disabled={item?.isClosed}
                      type="time"
                      value={(item?.closeTime ?? '18:00').slice(0, 5)}
                      onChange={(event) => void saveBusinessHour(dayIndex, { closeTime: event.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <PanelTitle icon={<CalendarDays size={18} />} title="Özel Gün / İstisna" />
            <div className="form-grid two compact">
              <Field label="Tarih">
                <input type="date" value={exceptionDraft.date} onChange={(event) => setExceptionDraft({ ...exceptionDraft, date: event.target.value })} />
              </Field>
              <Field label="Başlık">
                <input value={exceptionDraft.title} onChange={(event) => setExceptionDraft({ ...exceptionDraft, title: event.target.value })} placeholder="Bayram, bakım, yarım gün" />
              </Field>
              <label className="check">
                <input checked={exceptionDraft.isClosed} type="checkbox" onChange={(event) => setExceptionDraft({ ...exceptionDraft, isClosed: event.target.checked })} />
                Bugün kapalı
              </label>
              <div className="time-pair">
                <input disabled={exceptionDraft.isClosed} type="time" value={exceptionDraft.openTime} onChange={(event) => setExceptionDraft({ ...exceptionDraft, openTime: event.target.value })} />
                <input disabled={exceptionDraft.isClosed} type="time" value={exceptionDraft.closeTime} onChange={(event) => setExceptionDraft({ ...exceptionDraft, closeTime: event.target.value })} />
              </div>
            </div>
            <Field label="Mesaj override">
              <input value={exceptionDraft.messageOverride} onChange={(event) => setExceptionDraft({ ...exceptionDraft, messageOverride: event.target.value })} />
            </Field>
            <button className="secondary-action" type="button" onClick={createException}>
              <Plus size={16} /> İstisna ekle
            </button>
            <div className="table-list">
              {exceptions.map((item) => (
                <div className="list-row" key={item.id}>
                  <span>{item.date}</span>
                  <strong>{item.title}</strong>
                  <small>{item.isClosed ? 'Kapalı' : `${item.openTime} - ${item.closeTime}`}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <PanelTitle icon={<GitBranch size={18} />} title="Departman ve Kurallar" />
            <div className="inline-form">
              <input placeholder="Kod" value={departmentDraft.code} onChange={(event) => setDepartmentDraft({ ...departmentDraft, code: event.target.value })} />
              <input placeholder="Departman adı" value={departmentDraft.name} onChange={(event) => setDepartmentDraft({ ...departmentDraft, name: event.target.value })} />
              <input placeholder="Dil" value={departmentDraft.languageCode} onChange={(event) => setDepartmentDraft({ ...departmentDraft, languageCode: event.target.value })} />
              <button type="button" onClick={createDepartment}><Plus size={15} /></button>
            </div>
            <div className="chip-row">
              {departments.map((department) => (
                <span className="chip" key={department.id}>{department.name}</span>
              ))}
            </div>
            <div className="rule-builder">
              <input placeholder="Kural adı" value={ruleDraft.name} onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })} />
              <input placeholder="Intent ör: reservation" value={ruleDraft.matchIntent} onChange={(event) => setRuleDraft({ ...ruleDraft, matchIntent: event.target.value })} />
              <input placeholder="Dil ör: tr-TR" value={ruleDraft.matchLanguageCode} onChange={(event) => setRuleDraft({ ...ruleDraft, matchLanguageCode: event.target.value })} />
              <select value={ruleDraft.action} onChange={(event) => setRuleDraft({ ...ruleDraft, action: event.target.value })}>
                <option value="AiAnswer">AI cevaplasın</option>
                <option value="TransferToQueue">Canlı kuyruğa aktar</option>
                <option value="CreateCallback">Geri arama kaydı</option>
                <option value="PlayMessage">Mesaj oku</option>
                <option value="Voicemail">Sesli mesaj al</option>
              </select>
              <select value={ruleDraft.targetDepartmentId} onChange={(event) => setRuleDraft({ ...ruleDraft, targetDepartmentId: event.target.value })}>
                <option value="">Departman yok</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
              <button type="button" onClick={createRule}><Plus size={15} /> Kural ekle</button>
            </div>
            <div className="table-list">
              {rules.map((rule) => (
                <div className="list-row rule-row" key={rule.id}>
                  <span>#{rule.priority}</span>
                  <strong>{rule.name}</strong>
                  <small>{actionLabels[String(rule.action)] ?? String(rule.action)}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel simulator">
            <PanelTitle icon={<Play size={18} />} title="Karar Simülasyonu" />
            <div className="form-grid two compact">
              <Field label="Tarih/saat">
                <input type="datetime-local" value={simulationDraft.occurredAt} onChange={(event) => setSimulationDraft({ ...simulationDraft, occurredAt: event.target.value })} />
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
          </section>

          <section className="panel logs-panel">
            <PanelTitle icon={<History size={18} />} title="Konuşma Logları" />
            <div className="table-list log-list">
              {logs.map((log) => (
                <div className="list-row log-row" key={log.id}>
                  <span>{new Date(log.startedAtUtc).toLocaleString('tr-TR')}</span>
                  <strong>{log.decision}</strong>
                  <small>{log.decisionReason}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function LoginField({
  action,
  icon,
  label,
  children,
}: {
  action?: React.ReactNode;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={action ? 'mb-1 flex items-center justify-between gap-3' : 'mb-1 block'}>
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        {action}
      </span>
      <div className="neon-border relative flex items-center rounded-lg border border-gray-700 bg-[#131b2f] transition-colors">
        <div className="login-field-icon absolute left-3 text-slate-500">{icon}</div>
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
    <div className="relative w-full" ref={rootRef}>
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
        <ChevronDown className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} size={16} />
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

function WanderingRocket() {
  const rocketRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rocket = rocketRef.current;
    if (!rocket) return;

    let animationFrame = 0;
    let x = -120;
    let y = window.innerHeight * 0.72;
    let targetX = window.innerWidth + 140;
    let targetY = window.innerHeight * 0.18;
    let progress = 0;

    const resetPath = () => {
      x = -140;
      y = window.innerHeight * (0.45 + Math.random() * 0.38);
      targetX = window.innerWidth + 140;
      targetY = window.innerHeight * (0.08 + Math.random() * 0.35);
      progress = 0;
    };

    const animate = () => {
      progress += 0.0018;
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentX = x + (targetX - x) * eased;
      const arc = Math.sin(progress * Math.PI) * 130;
      const currentY = y + (targetY - y) * eased - arc;
      const angle = Math.atan2(targetY - y, targetX - x) * (180 / Math.PI) + 90;

      rocket.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${angle}deg)`;

      if (progress >= 1) {
        resetPath();
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    resetPath();
    animate();

    const handleResize = () => resetPath();
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="wandering-rocket pointer-events-none fixed left-0 top-0 z-0 h-[200px] w-[100px]"
      ref={rocketRef}
      style={{ transform: 'translate(-999px, -999px)' }}
    >
      <svg viewBox="0 0 100 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="rocketGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="rocketFinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <filter id="rocketFlameGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="wandering-flame">
          <path d="M35 135 Q50 220 65 135 Z" fill="#ea580c" filter="url(#rocketFlameGlow)" />
          <path d="M40 135 Q50 185 60 135 Z" fill="#facc15" />
          <path d="M45 135 Q50 155 55 135 Z" fill="#ffffff" />
        </g>

        <path d="M35 120 L65 120 L60 135 L40 135 Z" fill="#334155" />
        <path d="M20 100 Q5 140 0 150 L20 130 Z" fill="url(#rocketFinGrad)" />
        <path d="M80 100 Q95 140 100 150 L80 130 Z" fill="url(#rocketFinGrad)" />
        <path d="M50 10 Q20 40 20 120 L80 120 Q80 40 50 10 Z" fill="url(#rocketBodyGrad)" />
        <path d="M48 100 L52 100 L52 140 L48 140 Z" fill="#7f1d1d" />
        <path d="M50 10 Q32 30 25.5 50 L74.5 50 Q68 30 50 10 Z" fill="url(#rocketFinGrad)" />
        <circle cx="50" cy="65" r="14" fill="#1e293b" />
        <circle cx="50" cy="65" r="11" fill="url(#rocketGlassGrad)" />
        <path d="M43 58 A 9 9 0 0 1 55 59 A 11 11 0 0 0 43 68 Z" fill="#ffffff" opacity="0.4" />
        <path d="M22 100 L78 100" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
        <path d="M20 110 L80 110" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}

function PlanetMark() {
  return (
    <svg width="300" height="300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="callcenterPlanetGrad" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#00c3ff" />
          <stop offset="100%" stopColor="#000033" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#00c3ff" strokeDasharray="4 2" strokeWidth="2" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#a020f0" strokeWidth="1" />
      <circle cx="50" cy="50" r="20" fill="url(#callcenterPlanetGrad)" />
    </svg>
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
    const colors = ['#ffffff', '#00c3ff', '#a020f0', '#ffffff', '#ffffff'];

    const initStars = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.floor((width * height) / 2400);
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
      context.fillStyle = '#050914';
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
