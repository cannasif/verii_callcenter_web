import {
  Activity,
  Bot,
  Headphones,
  History,
  PhoneIncoming,
  PhoneOutgoing,
  RadioTower,
  Sparkles,
  Timer,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react';
import './Dashboard.css';

export type DashboardNavigateTarget =
  | 'call-sessions'
  | 'follow-ups'
  | 'queues'
  | 'agent-status'
  | 'ai-profile'
  | 'simulator'
  | 'phone-numbers'
  | 'logs';

type DashboardProps = {
  displayName: string;
  companyName?: string | null;
  onNavigate: (section: DashboardNavigateTarget) => void;
};

const kpiRings = [
  { id: 'sla', label: 'SLA Uyumu', value: 94, tone: 'cyan', hint: 'Hedef ≥ %90' },
  { id: 'ai', label: 'AI Çözüm Oranı', value: 67, tone: 'pink', hint: 'Temsilcisiz kapanış' },
  { id: 'csat', label: 'CSAT Skoru', value: 88, tone: 'orange', hint: 'Son 7 gün' },
  { id: 'avail', label: 'Temsilci Uygunluk', value: 76, tone: 'teal', hint: 'Anlık kapasite' },
] as const;

const statCards = [
  { id: 'inbound', label: 'Gelen Çağrı', value: '1.284', delta: '+12%', icon: PhoneIncoming, tone: 'cyan' },
  { id: 'outbound', label: 'Giden Çağrı', value: '312', delta: '+4%', icon: PhoneOutgoing, tone: 'pink' },
  { id: 'wait', label: 'Ort. Bekleme', value: '00:42', delta: '-18%', icon: Timer, tone: 'orange' },
  { id: 'agents', label: 'Çevrimiçi Temsilci', value: '38', delta: '+3', icon: UserRound, tone: 'teal' },
  { id: 'ai-handled', label: 'AI Karşılama', value: '742', delta: '+21%', icon: Bot, tone: 'pink' },
  { id: 'queues', label: 'Aktif Kuyruk', value: '9', delta: 'stabil', icon: Headphones, tone: 'cyan' },
] as const;

const weekBars = [
  { day: 'Pzt', calls: 980 },
  { day: 'Sal', calls: 1120 },
  { day: 'Çar', calls: 1040 },
  { day: 'Per', calls: 1280 },
  { day: 'Cum', calls: 1410 },
  { day: 'Cmt', calls: 760 },
  { day: 'Paz', calls: 540 },
] as const;

const channels = [
  { id: 'voice', label: 'Ses', pct: 62, tone: 'cyan' },
  { id: 'ai', label: 'AI Ses', pct: 24, tone: 'pink' },
  { id: 'callback', label: 'Geri Arama', pct: 9, tone: 'orange' },
  { id: 'voicemail', label: 'Sesli Mesaj', pct: 5, tone: 'teal' },
] as const;

const feed = [
  { id: '1', time: '14:22', text: 'AI asistan, fatura intent’inde %92 güvenle kapattı', tone: 'pink' },
  { id: '2', time: '14:18', text: 'Destek kuyruğunda bekleme 00:55 → 00:31 düştü', tone: 'cyan' },
  { id: '3', time: '14:11', text: '3 temsilci mola sonrası uygun duruma geçti', tone: 'teal' },
  { id: '4', time: '14:04', text: 'Yurt dışı DID’den 18 çağrı kabul edildi', tone: 'orange' },
  { id: '5', time: '13:57', text: 'Geri arama kuyruğunda 6 iş tamamlandı', tone: 'cyan' },
] as const;

const quickActions: { id: DashboardNavigateTarget; title: string; description: string; icon: typeof Headphones }[] = [
  { id: 'call-sessions', title: 'Çağrı Oturumları', description: 'Canlı ve tamamlanan çağrılar', icon: Headphones },
  { id: 'queues', title: 'Kuyruklar', description: 'Kapasite ve dağıtım', icon: History },
  { id: 'agent-status', title: 'Temsilciler', description: 'Anlık uygunluk durumu', icon: UserRound },
  { id: 'ai-profile', title: 'AI Politika', description: 'Güven ve devir ayarları', icon: Bot },
  { id: 'follow-ups', title: 'Geri Aramalar', description: 'Bekleyen iş listesi', icon: PhoneIncoming },
  { id: 'simulator', title: 'Simülasyon', description: 'Kural kararını test et', icon: Zap },
  { id: 'phone-numbers', title: 'Gelen Numaralar', description: 'DID eşleştirmeleri', icon: RadioTower },
  { id: 'logs', title: 'Konuşma Logları', description: 'Karar kayıtları', icon: Activity },
];

function RingMeter({ value, tone, label, hint, tag }: { value: number; tone: string; label: string; hint: string; tag: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <article className={`dash-ring dash-ring-${tone}`}>
      <span className="dash-hud-tag" aria-hidden="true">{tag}</span>
      <div className="dash-ring-visual" aria-hidden="true">
        <svg viewBox="0 0 108 108">
          <circle className="dash-ring-track" cx="54" cy="54" r={radius} />
          <circle
            className="dash-ring-progress"
            cx="54"
            cy="54"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <strong>%{value}</strong>
      </div>
      <div className="dash-ring-copy">
        <h3>{label}</h3>
        <p>{hint}</p>
      </div>
    </article>
  );
}

export function Dashboard({ displayName, companyName, onNavigate }: DashboardProps) {
  const maxCalls = Math.max(...weekBars.map((item) => item.calls));
  const firstName = displayName.split(' ')[0] || displayName;

  return (
    <section className="dashboard" aria-label="Operasyon panosu">
      <header className="dash-hero">
        <span className="dash-hud-tag" aria-hidden="true">SEC-00 // BRIDGE</span>
        <div className="dash-hero-copy">
          <span className="dash-eyebrow">
            <Sparkles size={14} /> Canlı operasyon panosu
          </span>
          <h1>
            Merhaba {firstName}
            <em>_</em>
          </h1>
          <p>
            {companyName
              ? `${companyName} için bugünkü çağrı merkezi nabzı. Göstermelik özet verilerle performans, AI ve kuyruk durumunu izleyin.`
              : 'Bugünkü çağrı merkezi nabzı. Göstermelik özet verilerle performans, AI ve kuyruk durumunu izleyin.'}
          </p>
        </div>
        <div className="dash-hero-pulse" aria-hidden="true">
          <span className="dash-pulse-dot" />
          <div>
            <strong>Sistem çevrimiçi</strong>
            <small>Latency 42 ms · Uptime %99.98</small>
          </div>
        </div>
      </header>

      <div className="dash-stat-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article className={`dash-stat dash-stat-${card.tone}`} key={card.id}>
              <span className="dash-hud-tag" aria-hidden="true">{`TEL-${String(index + 1).padStart(2, '0')}`}</span>
              <div className="dash-stat-icon">
                <Icon size={18} />
              </div>
              <div className="dash-stat-body">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>
                  <TrendingUp size={12} /> {card.delta}
                </small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dash-ring-grid">
        {kpiRings.map((ring, index) => (
          <RingMeter
            key={ring.id}
            value={ring.value}
            tone={ring.tone}
            label={ring.label}
            hint={ring.hint}
            tag={`KPI-${String(index + 1).padStart(2, '0')}`}
          />
        ))}
      </div>

      <div className="dash-main-grid">
        <article className="dash-panel dash-chart-panel">
          <span className="dash-hud-tag" aria-hidden="true">SEC-04 // TRAFFIC</span>
          <header className="dash-panel-head">
            <div>
              <h2>Haftalık çağrı hacmi</h2>
              <p>Son 7 gün · göstermelik veri</p>
            </div>
            <span className="dash-chip">+9.4% WoW</span>
          </header>
          <div className="dash-bars" role="img" aria-label="Haftalık çağrı hacmi çubuk grafiği">
            {weekBars.map((item) => (
              <div className="dash-bar-col" key={item.day}>
                <div className="dash-bar-track">
                  <div className="dash-bar-fill" style={{ height: `${Math.max(12, (item.calls / maxCalls) * 100)}%` }} />
                </div>
                <span>{item.day}</span>
                <small>{item.calls}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="dash-panel dash-channel-panel">
          <span className="dash-hud-tag" aria-hidden="true">SEC-05 // CHNL</span>
          <header className="dash-panel-head">
            <div>
              <h2>Kanal dağılımı</h2>
              <p>Bugünkü etkileşim payı</p>
            </div>
          </header>
          <div className="dash-channels">
            {channels.map((channel) => (
              <div className={`dash-channel dash-channel-${channel.tone}`} key={channel.id}>
                <div className="dash-channel-meta">
                  <strong>{channel.label}</strong>
                  <span>%{channel.pct}</span>
                </div>
                <div className="dash-channel-track">
                  <div className="dash-channel-fill" style={{ width: `${channel.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="dash-donut" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle className="dash-donut-bg" cx="60" cy="60" r="42" />
              <circle className="dash-donut-seg dash-donut-cyan" cx="60" cy="60" r="42" strokeDasharray="165 264" strokeDashoffset="0" />
              <circle className="dash-donut-seg dash-donut-pink" cx="60" cy="60" r="42" strokeDasharray="63 264" strokeDashoffset="-165" />
              <circle className="dash-donut-seg dash-donut-orange" cx="60" cy="60" r="42" strokeDasharray="24 264" strokeDashoffset="-228" />
              <circle className="dash-donut-seg dash-donut-teal" cx="60" cy="60" r="42" strokeDasharray="13 264" strokeDashoffset="-252" />
            </svg>
            <div className="dash-donut-center">
              <strong>1.6K</strong>
              <span>etkileşim</span>
            </div>
          </div>
        </article>
      </div>

      <div className="dash-lower-grid">
        <article className="dash-panel dash-actions-panel">
          <span className="dash-hud-tag" aria-hidden="true">SEC-06 // QUICK</span>
          <header className="dash-panel-head">
            <div>
              <h2>Hızlı işlemler</h2>
              <p>Sık kullanılan operasyon ekranlarına atla</p>
            </div>
          </header>
          <div className="dash-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button className="dash-action" key={action.id} type="button" onClick={() => onNavigate(action.id)}>
                  <span className="dash-action-icon">
                    <Icon size={18} />
                  </span>
                  <span className="dash-action-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="dash-panel dash-feed-panel">
          <span className="dash-hud-tag" aria-hidden="true">SEC-07 // FEED</span>
          <header className="dash-panel-head">
            <div>
              <h2>Canlı aktivite</h2>
              <p>Son olay akışı · demo</p>
            </div>
            <span className="dash-live">LIVE</span>
          </header>
          <ul className="dash-feed">
            {feed.map((item) => (
              <li className={`dash-feed-item dash-feed-${item.tone}`} key={item.id}>
                <time>{item.time}</time>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
