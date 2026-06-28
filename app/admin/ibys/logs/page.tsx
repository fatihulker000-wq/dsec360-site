"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  Eye,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";

const stats = [
  { title: "Toplam Log", value: "0", desc: "Kayıtlı işlem", icon: FileText, tone: "blue" },
  { title: "Başarılı", value: "0", desc: "Sorunsuz işlem", icon: CheckCircle2, tone: "green" },
  { title: "Hatalı", value: "0", desc: "İncelenecek", icon: XCircle, tone: "red" },
  { title: "Ortalama Süre", value: "0 ms", desc: "Servis cevabı", icon: Timer, tone: "amber" },
  { title: "Son Sync", value: "Yok", desc: "Henüz yapılmadı", icon: Clock3, tone: "purple" },
];

const logs = [
  {
    date: "Hazırlanacak",
    company: "Demo Lojistik A.Ş.",
    module: "Eğitim",
    action: "İBYS gönderim denemesi",
    status: "Bekliyor",
    duration: "0 ms",
    detail: "Firma eşleştirmesi bekleniyor",
  },
  {
    date: "Hazırlanacak",
    company: "Demo Üretim Ltd.",
    module: "Sağlık",
    action: "Muayene kaydı hazırlığı",
    status: "Eksik Bilgi",
    duration: "0 ms",
    detail: "Hekim bilgisi eksik",
  },
];

const errors = [
  "Firma eşleştirmesi yapılmadı",
  "SGK sicil no eksik",
  "TC kimlik no eksik",
  "Servis bağlantısı aktif değil",
  "Yetkilendirme bilgisi tanımlanmadı",
];

type IbysLogRow = {
  id: string;
  firm_name?: string | null;
  module_name?: string | null;
  action?: string | null;
  status?: string | null;
  response_code?: string | null;
  duration_ms?: number | null;
  error_message?: string | null;
  created_at?: string | null;
};

export default function IbysLogsPage() {
  const [rows, setRows] = useState<IbysLogRow[]>([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");

const loadLogs = async () => {
  setLoading(true);
  setMessage("");

  try {
    const res = await fetch(`/api/ibys/logs?t=${Date.now()}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.error || "Log listesi alınamadı.");
      return;
    }

    setRows(json.data || []);
  } catch {
    setMessage("Log listesi alınırken hata oluştu.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  void loadLogs();
}, []);

const dynamicStats = useMemo(() => {
  const total = rows.length;
  const success = rows.filter((r) => r.status === "SUCCESS").length;
  const failed = rows.filter((r) => r.status === "FAILED").length;
  const avg =
    total > 0
      ? Math.round(
          rows.reduce((sum, r) => sum + Number(r.duration_ms || 0), 0) / total
        )
      : 0;

  const lastSync = rows[0]?.created_at
    ? new Date(rows[0].created_at).toLocaleString("tr-TR")
    : "Yok";

  return [
    { title: "Toplam Log", value: String(total), desc: "Kayıtlı işlem", icon: FileText, tone: "blue" },
    { title: "Başarılı", value: String(success), desc: "Sorunsuz işlem", icon: CheckCircle2, tone: "green" },
    { title: "Hatalı", value: String(failed), desc: "İncelenecek", icon: XCircle, tone: "red" },
    { title: "Ortalama Süre", value: `${avg} ms`, desc: "Servis cevabı", icon: Timer, tone: "amber" },
    { title: "Son Sync", value: lastSync, desc: "Son işlem", icon: Clock3, tone: "purple" },
  ];
}, [rows]);
  return (
    <main className="ibys-logs-page">
      <section className="logs-hero">
        <div>
          <div className="logs-pill">
            <FileText size={16} />
            İBYS Log Merkezi
          </div>

          <h1>Gönderim Logları ve İşlem Geçmişi</h1>

          <p>
            İBYS’e gönderilen, bekleyen, hatalı veya tekrar denenen tüm kayıtların
            işlem geçmişini, servis cevaplarını, hata nedenlerini ve performans
            sürelerini merkezi olarak takip et.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" onClick={loadLogs} className="hero-btn light">
            <RefreshCcw size={17} />
            Yenile
          </button>

          <button type="button" className="hero-btn dark">
            <DatabaseZap size={17} />
            Logları Tara
          </button>
        </div>
      </section>

      <section className="stat-grid">
        {dynamicStats.map((item) => {
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

      <section className="filter-panel">
        <div className="filter-title">
          <Filter size={18} />
          <strong>Log Filtreleri</strong>
        </div>

        <div className="filter-grid">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Firma, modül, işlem veya hata ara..." />
          </div>

          <select defaultValue="">
            <option value="">Tüm Modüller</option>
            <option>Eğitim</option>
            <option>Sağlık</option>
            <option>Risk</option>
            <option>İş Kazası</option>
            <option>Çalışan</option>
          </select>

          <select defaultValue="">
            <option value="">Tüm Durumlar</option>
            <option>Başarılı</option>
            <option>Bekliyor</option>
            <option>Hatalı</option>
            <option>Eksik Bilgi</option>
          </select>

          <button type="button">Filtrele</button>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel large">
          <div className="panel-head">
            <div>
              <h2>İşlem Geçmişi</h2>
              <p>İBYS servis çağrıları ve gönderim kayıtları burada listelenir.</p>
            </div>

            <button type="button" className="small-btn">
              <Activity size={16} />
              Performans
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Firma</th>
                  <th>Modül</th>
                  <th>İşlem</th>
                  <th>Durum</th>
                  <th>Süre</th>
                  <th>Detay</th>
                </tr>
              </thead>

              <tbody>
  {loading ? (
    <tr>
      <td colSpan={7}>Loglar yükleniyor...</td>
    </tr>
  ) : rows.length === 0 ? (
    <tr>
      <td colSpan={7}>Henüz log kaydı yok.</td>
    </tr>
  ) : (
    rows.map((log) => (
      <tr key={log.id}>
        <td>
          {log.created_at
            ? new Date(log.created_at).toLocaleString("tr-TR")
            : "-"}
        </td>
        <td>{log.firm_name || "-"}</td>
        <td>
          <span className="module-badge">
            {log.module_name || "-"}
          </span>
        </td>
        <td>{log.action || "-"}</td>
        <td>
          <span
            className={
              log.status === "SUCCESS"
                ? "status-badge green"
                : log.status === "FAILED"
                  ? "status-badge red"
                  : "status-badge amber"
            }
          >
            {log.status || "-"}
          </span>
        </td>
        <td>{Number(log.duration_ms || 0)} ms</td>
        <td>
          <button type="button" className="detail-btn">
            <Eye size={15} />
            Gör
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>

          <div className="log-note">
            <ShieldAlert size={17} />
            Canlı entegrasyon açıldığında Bakanlık servis cevapları, response
            kodları ve işlem süreleri burada saklanacak.
          </div>
        </div>

        <aside className="side">
          <div className="panel">
            <div className="side-icon red">
              <AlertTriangle size={22} />
            </div>

            <h2>Son Hatalar</h2>
            <p>En sık görülen hazırlık ve entegrasyon hataları.</p>

            <div className="error-list">
              {errors.map((error) => (
                <div key={error}>
                  <XCircle size={17} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel performance">
            <div className="side-icon dark">
              <Activity size={22} />
            </div>

            <h2>Performans Özeti</h2>
            <p>Bugünkü gönderim performansı backend bağlandığında hesaplanacak.</p>

            <div className="perf-grid">
              <div>
                <strong>%0</strong>
                <span>Başarı</span>
              </div>
              <div>
                <strong>0 ms</strong>
                <span>Ortalama</span>
              </div>
              <div>
                <strong>0</strong>
                <span>Retry</span>
              </div>
              <div>
                <strong>Yok</strong>
                <span>Yoğun saat</span>
              </div>
            </div>
          </div>

          <div className="panel dora">
            <div className="side-icon dora-icon">
              <Sparkles size={22} />
            </div>

            <h2>DORA Log Analizi</h2>

            <p>
              Loglar gerçek veriye bağlandığında DORA, tekrar eden hataları ve
              çözüm önceliklerini otomatik çıkaracak.
            </p>

            <div className="dora-note">
              İlk öneri: Firma eşleştirmesi tamamlanmadan gönderim kuyruğu
              otomatik başlatılmamalı.
            </div>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .ibys-logs-page {
          min-height: 100vh;
          background: #fafafa;
          padding: 24px;
          color: #111827;
        }

        .logs-hero {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          padding: 26px;
          border-radius: 28px;
          color: white;
          background: linear-gradient(135deg, #4a0d1a 0%, #7f1d1d 100%);
          box-shadow: 0 22px 46px rgba(90, 15, 31, 0.18);
        }

        .logs-pill {
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

.status-badge.green {
  background: #ecfdf5;
  color: #047857;
}

.status-badge.red {
  background: #fef2f2;
  color: #b91c1c;
}

        .logs-hero h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .logs-hero p {
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

        .hero-btn.dark {
          background: #111827;
          color: white;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .stat-card,
        .filter-panel,
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
        }

        .stat-top strong {
          font-size: 24px;
          font-weight: 950;
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

        .filter-panel {
          margin-top: 18px;
          padding: 18px;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #5a0f1f;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 180px 180px 120px;
          gap: 12px;
        }

        .search-box,
        select,
        .filter-grid button {
          height: 42px;
          border: 1px solid #ead7db;
          border-radius: 15px;
          background: white;
          color: #374151;
          font-weight: 850;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          color: #5a0f1f;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          background: transparent;
          font-weight: 850;
        }

        select {
          padding: 0 12px;
        }

        .filter-grid button {
          background: #5a0f1f;
          color: white;
          cursor: pointer;
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
          min-width: 980px;
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

        .module-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .module-badge {
          background: #fff1f2;
          color: #5a0f1f;
        }

        .status-badge.blue {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status-badge.amber {
          background: #fef3c7;
          color: #92400e;
        }

        .detail-btn {
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }

        .log-note {
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

        .perf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }

        .perf-grid div {
          border: 1px solid #ead7db;
          border-radius: 16px;
          padding: 13px;
          background: #fffafa;
        }

        .perf-grid strong {
          display: block;
          color: #22070d;
          font-weight: 950;
          font-size: 18px;
        }

        .perf-grid span {
          display: block;
          margin-top: 4px;
          color: #7a5962;
          font-size: 12px;
          font-weight: 850;
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

        @media (max-width: 1200px) {
          .stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filter-grid,
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ibys-logs-page {
            padding: 14px;
          }

          .logs-hero {
            flex-direction: column;
            padding: 20px;
            border-radius: 22px;
          }

          .logs-hero h1 {
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
