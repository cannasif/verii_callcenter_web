import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Clock3,
  GitBranch,
  Headphones,
  History,
  KeyRound,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Save,
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
      const data = await callCenterApi.loginCompanies();
      setLoginCompanies(data);
    } catch {
      setLoginCompanies([]);
      setStatus('Firma listesi yüklenemedi');
    }
  }

  async function login() {
    if (!loginDraft.email.trim() || !loginDraft.password.trim()) {
      setStatus('E-posta ve şifre zorunlu');
      return;
    }

    let response;
    try {
      setStatus('Giriş kontrol ediliyor');
      response = await callCenterApi.login({
        email: loginDraft.email,
        password: loginDraft.password,
        companyId: loginDraft.companyId ? Number(loginDraft.companyId) : null,
      });
    } catch {
      setStatus('E-posta, şifre veya firma seçimi hatalı');
      return;
    }

    if (response.requiresCompanySelection) {
      setLoginCompanies(response.companies);
      setLoginDraft((draft) => ({ ...draft, companyId: draft.companyId || response.companies[0]?.id.toString() || '' }));
      setStatus(response.message ?? 'Firma seçimi gerekli');
      return;
    }

    if (!response.success || !response.token || !response.context) {
      setStatus(response.message ?? 'Giriş yapılamadı');
      return;
    }

    localStorage.setItem('access_token', response.token);
    setAuthContext(response.context);
    setSelectedCompanyId(response.context.selectedCompanyId ?? response.context.companies[0]?.id ?? null);
    setLoginCompanies([]);
    await refreshCompanies(response.context);
    setStatus('Giriş başarılı');
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
      <main className="login-page">
        <section className="login-panel">
          <div className="login-brand">
            <Headphones size={30} />
            <div>
              <h1>V3RII Call Center</h1>
              <p>Admin paneline giriş</p>
            </div>
          </div>
          <div className="login-form">
            <Field label="E-posta">
              <input value={loginDraft.email} onChange={(event) => setLoginDraft({ ...loginDraft, email: event.target.value })} />
            </Field>
            <Field label="Şifre">
              <input type="password" value={loginDraft.password} onChange={(event) => setLoginDraft({ ...loginDraft, password: event.target.value })} />
            </Field>
            <Field label="Firma">
              <select value={loginDraft.companyId} onChange={(event) => setLoginDraft({ ...loginDraft, companyId: event.target.value })}>
                <option value="">Super admin / firma seçmeden giriş</option>
                {loginCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </Field>
            <button className="save-button" type="button" onClick={login}>
              <KeyRound size={16} /> Giriş yap
            </button>
            <div className="login-status">{status}</div>
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

export default App;
