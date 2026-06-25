"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  HeartPulse,
  KeyRound,
  RefreshCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

const stats = [
  { title: "API Durumu", value: "Pasif", desc: "Test bağlantısı bekliyor", icon: Server, tone: "amber" },
  { title: "Auth", value: "Kapalı", desc: "Kimlik doğrulama yok", icon: KeyRound, tone: "red" },
  { title: "Token", value: "Yok", desc: "Token üretilmedi", icon: ShieldCheck, tone: "red" },
  { title: "Heartbeat", value: "Yok", desc: "Son kontrol yapılmadı", icon: HeartPulse, tone: "purple" },
  { title: "Response", value: "0 ms", desc: "Ortalama cevap", icon: Timer, tone: "blue" },
  { title: "Uptime", value: "%0", desc: "Servis erişilebilirliği", icon: Activity, tone: "green" },
];

const services = [
  {
    name: "Kimlik Doğrulama Servisi",
    code: "AUTH",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "API kimlik bilgileri tanımlanacak",
  },
  {
    name: "Firma Bilgileri Servisi",
    code: "COMPANY",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "Firma eşleştirme tamamlanmalı",
  },
  {
    name: "Çalışan Bilgileri Servisi",
    code: "EMPLOYEE",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "Çalışan veri seti eşleştirilecek",
  },
  {
    name: "Eğitim Kayıtları Servisi",
    code: "TRAINING",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "Eğitim alanları doğrulanacak",
  },
  {
    name: "Sağlık Muayeneleri Servisi",
    code: "HEALTH",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "Hekim ve muayene alanları eşleştirilecek",
  },
  {
    name: "İş Kazası / Olay Servisi",
    code: "ACCIDENT",
    status: "Hazır değil",
    lastCheck: "Henüz kontrol edilmedi",
    avg: "0 ms",
    note: "Olay veri seti hazırlanacak",
  },
];

const errors = [
  "API bilgileri tanımlanmadı",
  "Token üretimi yapılmadı",
  "Test ortamı bağlantısı kurulmadı",
  "Servis endpointleri doğrulanmadı",
  "Heartbeat görevi aktif değil",
];

export default function IbysServicesPage() {
  return (
    <main className="ibys-services-page">
      <section className="services-hero">
        <div>
          <div className="services-pill">
            <Wifi size={16} />
            İBYS Servis Sağlığı
          </div>

          <h1>Servis Sağlığı ve Bağlantı İzleme</h1>

          <p>
            İBYS test/canlı servislerinin bağlantı durumunu, kimlik doğrulama
            sürecini, token geçerliliğini, cevap sürelerini ve servis hatalarını
            merkezi olarak takip et.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="hero-btn light">
            <RefreshCcw size={17} />
            Kontrol Et
          </button>

          <button type="button" className="hero-btn green">
            <Zap size={17} />
            Heartbeat Başlat
          </button>
        </div>
      </section>

      <section className="stat-grid">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className={`stat-card ${item.tone}`}>
              <div className="stat-top">
                <div className="stat-icon">
                  <Icon size={20} />
                </div>
                <strong>{item.value}</strong>
              </div>

              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="content-grid">
        <div className="panel large">
          <div className="panel-head">
            <div>
              <h2>Servis Listesi</h2>
              <p>İBYS servislerinin canlılık, performans ve hazırlık durumu.</p>
            </div>

            <button type="button" className="small-btn">
              <Gauge size={16} />
              Performans Testi
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servis</th>
                  <th>Kod</th>
                  <th>Durum</th>
                  <th>Son Kontrol</th>
                  <th>Ort. Süre</th>
                  <th>Not</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.code}>
                    <td>
                      <div className="service-cell">
                        <span>
                          <Server size={17} />
                        </span>
                        <strong>{service.name}</strong>
                      </div>
                    </td>
                    <td>
                      <em className="code-badge">{service.code}</em>
                    </td>
                    <td>
                      <em className="status-badge amber">{service.status}</em>
                    </td>
                    <td>{service.lastCheck}</td>
                    <td>{service.avg}</td>
                    <td>
                      <div className="note-cell">
                        <AlertTriangle size={15} />
                        {service.note}
                      </div>
                    </td>
                    <td>
                      <button type="button" className="row-btn">
                        Test Et
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="service-note">
            <Clock size={17} />
            Backend servis sağlık kontrolü bağlandığında bu ekran otomatik
            heartbeat, token kontrolü ve response sürelerini gösterecek.
          </div>
        </div>

        <aside className="side">
          <div className="panel traffic">
            <div className="side-icon dark">
              <Activity size={22} />
            </div>

            <h2>Canlı Trafik</h2>
            <p>Servis istek yoğunluğu ve cevap performansı.</p>

            <div className="traffic-main">
              <strong>0</strong>
              <span>Dakikadaki istek</span>
            </div>

            <div className="traffic-grid">
              <div>
                <strong>0 ms</strong>
                <span>Ortalama cevap</span>
              </div>
              <div>
                <strong>%0</strong>
                <span>Başarı</span>
              </div>
              <div>
                <strong>0</strong>
                <span>Timeout</span>
              </div>
              <div>
                <strong>0</strong>
                <span>401/403</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="side-icon red">
              <XCircle size={22} />
            </div>

            <h2>Son Servis Hataları</h2>
            <p>Servis bağlantısı öncesi tamamlanması gereken kritik başlıklar.</p>

            <div className="error-list">
              {errors.map((error) => (
                <div key={error}>
                  <XCircle size={17} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel dora">
            <div className="side-icon dora-icon">
              <Sparkles size={22} />
            </div>

            <h2>DORA Servis Analizi</h2>

            <p>
              Canlı veriler bağlandığında DORA, servis yavaşlamalarını,
              authentication hatalarını ve token yenileme problemlerini otomatik
              analiz edecek.
            </p>

            <div className="dora-note">
              İlk öneri: Test ortamı bilgileri tanımlanmadan canlı gönderim
              butonları aktif edilmemeli.
            </div>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .ibys-services-page {
          min-height: 100vh;
          background: #fafafa;
          padding: 24px;
          color: #111827;
        }

        .services-hero {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          padding: 26px;
          border-radius: 28px;
          color: white;
          background: linear-gradient(135deg, #4a0d1a 0%, #7f1d1d 100%);
          box-shadow: 0 22px 46px rgba(90, 15, 31, 0.18);
        }

        .services-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 13px;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .services-hero h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .services-hero p {
          max-width: 760px;
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.7;
          font-weight: 650;
        }

        .hero-actions {
          display: grid;
          gap: 12px;
          min-width: 190px;
          align-content: center;
        }

        .hero-btn {
          border: none;
          border-radius: 16px;
          padding: 13px 16px;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
        }

        .hero-btn.light {
          background: white;
          color: #5a0f1f;
        }

        .hero-btn.green {
          background: #10b981;
          color: white;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .stat-card,
        .panel {
          background: white;
          border: 1px solid #ead7db;
          border-radius: 22px;
          box-shadow: 0 14px 30px rgba(90, 15, 31, 0.06);
        }

        .stat-card {
          padding: 18px;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: #fff1f2;
          color: #5a0f1f;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-top strong {
          font-size: 21px;
          font-weight: 950;
          text-align: right;
        }

        .stat-card h3 {
          margin: 13px 0 0;
          color: #22070d;
          font-weight: 950;
        }

        .stat-card p {
          margin: 5px 0 0;
          color: #7a5962;
          font-size: 13px;
          font-weight: 750;
        }

        .stat-card.green .stat-icon {
          color: #047857;
          background: #ecfdf5;
        }

        .stat-card.red .stat-icon {
          color: #b91c1c;
          background: #fef2f2;
        }

        .stat-card.amber .stat-icon {
          color: #b45309;
          background: #fffbeb;
        }

        .stat-card.blue .stat-icon {
          color: #1d4ed8;
          background: #eff6ff;
        }

        .stat-card.purple .stat-icon {
          color: #7e22ce;
          background: #faf5ff;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(320px, 0.9fr);
          gap: 18px;
          margin-top: 18px;
        }

        .panel {
          padding: 20px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        h2 {
          margin: 0;
          color: #22070d;
          font-size: 20px;
          font-weight: 950;
        }

        p {
          margin: 7px 0 0;
          color: #7a5962;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 700;
        }

        .small-btn {
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          border-radius: 14px;
          padding: 10px 13px;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          gap: 7px;
          align-items: center;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #ead7db;
          border-radius: 18px;
        }

        table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 14px;
          background: #fff7f8;
          color: #7a5962;
          font-size: 12px;
          font-weight: 950;
        }

        td {
          padding: 14px;
          border-top: 1px solid #ead7db;
          font-size: 13px;
          font-weight: 800;
          color: #374151;
          vertical-align: middle;
        }

        .service-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .service-cell span {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: #fff1f2;
          color: #5a0f1f;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-cell strong {
          color: #22070d;
          font-weight: 950;
        }

        .code-badge,
        .status-badge {
          font-style: normal;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .code-badge {
          background: #fff1f2;
          color: #5a0f1f;
        }

        .status-badge.amber {
          background: #fef3c7;
          color: #92400e;
        }

        .note-cell {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #92400e;
          font-weight: 900;
        }

        .row-btn {
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
        }

        .service-note {
          margin-top: 14px;
          display: flex;
          gap: 9px;
          align-items: center;
          padding: 13px;
          border-radius: 16px;
          background: #fff7ed;
          color: #92400e;
          font-size: 13px;
          font-weight: 900;
        }

        .side {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .side-icon {
          width: 48px;
          height: 48px;
          border-radius: 17px;
          background: #fff1f2;
          color: #5a0f1f;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .side-icon.red {
          color: #b91c1c;
          background: #fef2f2;
        }

        .side-icon.dark {
          background: #111827;
          color: white;
        }

        .side-icon.dora-icon {
          background: #5a0f1f;
          color: white;
        }

        .traffic-main {
          margin-top: 16px;
          padding: 18px;
          border-radius: 18px;
          background: #fff1f2;
          color: #5a0f1f;
        }

        .traffic-main strong {
          display: block;
          font-size: 34px;
          font-weight: 950;
        }

        .traffic-main span {
          font-size: 13px;
          font-weight: 900;
        }

        .traffic-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .traffic-grid div {
          border: 1px solid #ead7db;
          border-radius: 16px;
          padding: 13px;
          background: #fffafa;
        }

        .traffic-grid strong {
          display: block;
          color: #22070d;
          font-weight: 950;
        }

        .traffic-grid span {
          display: block;
          margin-top: 4px;
          color: #7a5962;
          font-size: 12px;
          font-weight: 850;
        }

        .error-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .error-list div {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px;
          border-radius: 15px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          font-weight: 900;
        }

        .panel.dora {
          background: linear-gradient(180deg, #ffffff 0%, #fff1f2 100%);
        }

        .dora-note {
          margin-top: 16px;
          padding: 14px;
          border-radius: 16px;
          background: white;
          border: 1px solid #ead7db;
          color: #5a0f1f;
          font-size: 13px;
          font-weight: 950;
        }

        @media (max-width: 1300px) {
          .stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ibys-services-page {
            padding: 14px;
          }

          .services-hero {
            flex-direction: column;
            padding: 20px;
            border-radius: 22px;
          }

          .services-hero h1 {
            font-size: 24px;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .panel-head {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}