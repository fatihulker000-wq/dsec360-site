"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  PlayCircle,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  TimerReset,
  XCircle,
} from "lucide-react";

const recentErrors = [
  "SGK sicil no eksik",
  "TC kimlik no eksik",
  "Firma İBYS eşleştirmesi yapılmadı",
  "Servis bağlantısı henüz aktif değil",
];

type QueueRow = {
  id: string;
  firm_name?: string | null;
  module_name?: string | null;
  record_type?: string | null;
  record_title?: string | null;
  status?: string | null;
  created_at?: string | null;
  sent_at?: string | null;
  last_error?: string | null;
};

export default function IbysQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadQueue = async () => {
  setLoading(true);
  setMessage("⏳ Kuyruk yenileniyor...");

  try {
    const res = await fetch(`/api/ibys/queue?t=${Date.now()}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(json.error || "Kuyruk listesi alınamadı.");
      return;
    }

    setRows(json.data || []);
    setMessage("✅ Kuyruk başarıyla yenilendi.");
  } catch {
    setMessage("❌ Kuyruk listesi alınırken hata oluştu.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    void loadQueue();
  }, []);

  const sendQueueItem = async (queueId: string) => {
    setSendingId(queueId);
    setMessage("");

    try {
      const res = await fetch("/api/ibys/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId }),
      });

      const json = await res.json();

      if (!json.success) {
        setMessage(json.error || "Kayıt gönderilemedi.");
        return;
      }

      setMessage(`✅ ${json.message}`);
      await loadQueue();
    } catch {
      setMessage("Gönderim sırasında hata oluştu.");
    } finally {
      setSendingId(null);
    }
  };

  const dynamicStats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const sent = rows.filter((r) => r.status === "SENT").length;
    const failed = rows.filter((r) => r.status === "FAILED").length;
    const retry = rows.filter((r) => r.status === "RETRY").length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return [
      { title: "Bekleyen", value: String(pending), desc: "Kuyrukta bekleyen", icon: Clock, tone: "blue" },
      { title: "Gönderilen", value: String(sent), desc: "Başarılı kayıt", icon: CheckCircle2, tone: "green" },
      { title: "Hatalı", value: String(failed), desc: "İşlem gerekli", icon: XCircle, tone: "red" },
      { title: "Retry", value: String(retry), desc: "Tekrar denenecek", icon: RotateCcw, tone: "amber" },
      { title: "Başarı", value: `%${successRate}`, desc: "Genel başarı oranı", icon: Activity, tone: "purple" },
    ];
  }, [rows]);

  return (
    <main className="ibys-queue-page">
      <section className="queue-hero">
        <div>
          <div className="queue-pill">
            <Send size={16} />
            İBYS Gönderim Kuyruğu
          </div>

          <h1>Gönderim Kuyruğu ve Retry Merkezi</h1>

          <p>
            D-SEC üzerinde oluşan eğitim, sağlık, çalışan, risk ve olay
            kayıtlarının İBYS gönderim sırasını, hata durumlarını ve tekrar
            deneme süreçlerini bu ekrandan yönet.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" onClick={loadQueue} className="hero-btn light">
            <RefreshCcw size={17} />
            Yenile
          </button>

          <button type="button" className="hero-btn green">
            <PlayCircle size={17} />
            Kuyruğu Başlat
          </button>
        </div>
      </section>

      {message && <section className="message-box">{message}</section>}

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
          <strong>Filtreler</strong>
        </div>

        <div className="filter-grid">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Firma, çalışan veya kayıt ara..." />
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
            <option>Bekliyor</option>
            <option>Gönderildi</option>
            <option>Hatalı</option>
            <option>Eksik Bilgi</option>
          </select>

          <button type="button">Uygula</button>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel large">
          <div className="panel-head">
            {message && (
  <div className="table-message">
    {message}
  </div>
)}
            <div>
              <h2>Kuyruk Kayıtları</h2>
              <p>İBYS’e gönderilecek tüm kayıtlar burada takip edilir.</p>
            </div>

            <button type="button" className="small-btn">
              <TimerReset size={16} />
              Retry Planı
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tür</th>
                  <th>Firma</th>
                  <th>Kayıt</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>Uyarı</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Kuyruk yükleniyor...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Henüz kuyruk kaydı yok.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="type-badge">
                          {row.module_name || row.record_type || "-"}
                        </span>
                      </td>
                      <td>{row.firm_name || "-"}</td>
                      <td>{row.record_title || row.record_type || "-"}</td>
                      <td>
                        <span
                          className={
                            row.status === "SENT"
                              ? "status-badge green"
                              : row.status === "RETRY" || row.status === "MISSING_INFO"
                                ? "status-badge amber"
                                : row.status === "FAILED"
                                  ? "status-badge red"
                                  : "status-badge blue"
                          }
                        >
                          {row.status === "PENDING" && "Bekliyor"}
{row.status === "READY" && "Hazır"}
{row.status === "SENT" && "Gönderildi"}
{row.status === "FAILED" && "Hatalı"}
{row.status === "RETRY" && "Retry"}
{row.status === "MISSING_INFO" && "Eksik Bilgi"}
{!row.status && "-"}
                        </span>
                      </td>
                      <td>
                        {row.sent_at
                          ? new Date(row.sent_at).toLocaleString("tr-TR")
                          : row.created_at
                            ? new Date(row.created_at).toLocaleString("tr-TR")
                            : "-"}
                      </td>
                      <td>
                        <div className="warning-cell">
                          <AlertTriangle size={15} />
                          {row.last_error || "Uyarı yok"}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button">Detay</button>
                          <button
  type="button"
  onClick={() => sendQueueItem(row.id)}
  disabled={sendingId === row.id || row.status === "SENT"}
>
  {sendingId === row.id
    ? "Gönderiliyor..."
    : row.status === "SENT"
      ? "Gönderildi"
      : "Retry"}
</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="side">
          <div className="panel queue-live">
            <div className="live-icon">
              <Activity size={23} />
            </div>

            <h2>Canlı Kuyruk</h2>
            <p>Backend queue bağlandığında anlık işlem durumu burada gösterilecek.</p>

            <div className="live-box">
              <strong>{rows.filter((r) => r.status === "READY").length}</strong>
              <span>Aktif işlem</span>
            </div>

            <div className="live-metrics">
              <div>
                <strong>{rows.filter((r) => r.status === "SENT").length}</strong>
                <span>Gönderilen</span>
              </div>
              <div>
                <strong>{rows.filter((r) => r.status === "RETRY").length}</strong>
                <span>Retry</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Son Hatalar</h2>
            <p>En sık karşılaşılan İBYS hazırlık hataları.</p>

            <div className="error-list">
              {recentErrors.map((error) => (
                <div key={error}>
                  <XCircle size={17} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .ibys-queue-page {
          min-height: 100vh;
          background: #fafafa;
          padding: 24px;
          color: #111827;
        }

        .queue-hero {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          padding: 26px;
          border-radius: 28px;
          color: white;
          background: linear-gradient(135deg, #4a0d1a 0%, #7f1d1d 100%);
          box-shadow: 0 22px 46px rgba(90, 15, 31, 0.18);
        }

        .queue-pill {
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

        .queue-hero h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .queue-hero p {
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

        .table-message {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff1f2;
  color: #5a0f1f;
  font-weight: 900;
}

        .message-box {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          font-weight: 900;
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
          font-size: 26px;
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

        .type-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .type-badge {
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

        .status-badge.green {
          background: #ecfdf5;
          color: #047857;
        }

        .status-badge.red {
          background: #fef2f2;
          color: #b91c1c;
        }

        .warning-cell {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #92400e;
          font-weight: 900;
        }

        .row-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .row-actions button {
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
        }

        .row-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .side {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .live-icon {
          width: 48px;
          height: 48px;
          border-radius: 17px;
          background: #5a0f1f;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .live-box {
          margin-top: 16px;
          padding: 18px;
          border-radius: 18px;
          background: #fff1f2;
          color: #5a0f1f;
        }

        .live-box strong {
          display: block;
          font-size: 34px;
          font-weight: 950;
        }

        .live-box span {
          font-size: 13px;
          font-weight: 900;
        }

        .live-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .live-metrics div {
          padding: 13px;
          border: 1px solid #ead7db;
          border-radius: 16px;
        }

        .live-metrics strong {
          display: block;
          color: #22070d;
          font-weight: 950;
        }

        .live-metrics span {
          display: block;
          margin-top: 4px;
          color: #7a5962;
          font-size: 12px;
          font-weight: 800;
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
          .ibys-queue-page {
            padding: 14px;
          }

          .queue-hero {
            flex-direction: column;
            padding: 20px;
            border-radius: 22px;
          }

          .queue-hero h1 {
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