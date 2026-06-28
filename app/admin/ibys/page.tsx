"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ListOrdered,
  ClipboardList,
  HeartPulse,
} from "lucide-react";

import {
  Activity,
  AlertTriangle,
  Eye,
  RotateCcw,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  FileWarning,
  RefreshCcw,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";


const stats = [
  { title: "Bekleyen", value: "0", desc: "Kuyrukta", icon: Clock, tone: "blue" },
  { title: "Başarılı", value: "0", desc: "Gönderildi", icon: CheckCircle2, tone: "green" },
  { title: "Hatalı", value: "0", desc: "Kontrol gerekli", icon: XCircle, tone: "red" },
  { title: "Eksik Bilgi", value: "0", desc: "Tamamlanmalı", icon: AlertTriangle, tone: "amber" },
  { title: "Retry", value: "0", desc: "Tekrar denenecek", icon: RefreshCcw, tone: "purple" },
  { title: "Başarı Oranı", value: "%0", desc: "Genel oran", icon: Activity, tone: "dark" },
];

const services = [
  "Kimlik Doğrulama Servisi",
  "Firma Bilgileri Servisi",
  "Çalışan Bilgileri Servisi",
  "Eğitim Kayıtları Servisi",
  "Sağlık Muayeneleri Servisi",
  "İş Kazası / Olay Servisi",
];

const missingChecks = [
  "TC kimlik no kontrolü",
  "Firma SGK sicil no kontrolü",
  "Eğitim süresi kontrolü",
  "Uzman / hekim eşleştirme kontrolü",
  "Firma İBYS eşleştirme kontrolü",
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
};

export default function IbysPage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/ibys/queue?t=${Date.now()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.success) {
        setRows(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const dynamicStats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const sent = rows.filter((r) => r.status === "SENT").length;
    const failed = rows.filter((r) => r.status === "FAILED").length;
    const missing = rows.filter((r) => r.status === "MISSING_INFO").length;
    const retry = rows.filter((r) => r.status === "RETRY").length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return [
      { title: "Bekleyen", value: String(pending), desc: "Kuyrukta", icon: Clock, tone: "blue" },
      { title: "Başarılı", value: String(sent), desc: "Gönderildi", icon: CheckCircle2, tone: "green" },
      { title: "Hatalı", value: String(failed), desc: "Kontrol gerekli", icon: XCircle, tone: "red" },
      { title: "Eksik Bilgi", value: String(missing), desc: "Tamamlanmalı", icon: AlertTriangle, tone: "amber" },
      { title: "Retry", value: String(retry), desc: "Tekrar denenecek", icon: RefreshCcw, tone: "purple" },
      { title: "Başarı Oranı", value: `%${successRate}`, desc: "Genel oran", icon: Activity, tone: "dark" },
    ];
  }, [rows]);

  const createTestQueue = async () => {
  try {
    const res = await fetch("/api/ibys/test-send", {
      method: "POST",
      cache: "no-store",
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.error || "Test gönderimi oluşturulamadı.");
      return;
    }

    alert("Test gönderimi başarıyla kuyruğa eklendi.");
    window.location.href = "/admin/ibys/queue";
  } catch {
    alert("Test gönderimi sırasında hata oluştu.");
  }
};
  return (
    <main className="ibys-page">
      <section className="ibys-hero">
        <div>
          <div className="ibys-pill">
            <ShieldCheck size={16} />
            D-SEC360 Resmi Entegrasyon Merkezi
          </div>

          <h1>İBYS Entegrasyon Paneli</h1>

          <p>
            Firma, çalışan, eğitim, sağlık, risk ve olay kayıtlarının İBYS
            gönderim sürecini takip etmek, hataları yönetmek ve resmi servis
            bağlantılarını kontrol etmek için merkezi yönetim ekranı.
          </p>
        </div>

        <div className="ibys-hero-actions">
          <Link href="/admin/ibys/settings" className="ibys-btn light">
  <Settings size={17} />
  İBYS Ayarları
 </Link>

          <button type="button" onClick={createTestQueue} className="ibys-btn green">
            <Send size={17} />
            Test Gönderimi
          </button>
        </div>
      </section>

      <section className="ibys-status-grid">
        <div className="ibys-status-card">
          <Server size={23} />
          <span>TEST</span>
          <h3>Bağlantı Durumu</h3>
          <p>Test ortamı hazırlanıyor</p>
        </div>

        <div className="ibys-status-card">
          <Database size={23} />
          <span>PASİF</span>
          <h3>Veri Kaynağı</h3>
          <p>D-SEC Supabase / Backend</p>
        </div>

        <div className="ibys-status-card">
          <Clock size={23} />
          <span>YOK</span>
          <h3>Son Senkronizasyon</h3>
          <p>Henüz yapılmadı</p>
        </div>

        <div className="ibys-status-card">
          <ShieldCheck size={23} />
          <span>KAPALI</span>
          <h3>Canlı Durum</h3>
          <p>Canlı entegrasyon kapalı</p>
        </div>
      </section>

      <section className="ibys-stat-grid">
        {dynamicStats.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className={`ibys-stat-card ${item.tone}`}>
              <div className="ibys-stat-top">
                <div className="ibys-stat-icon">
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

      <section className="ibys-main-grid">
        <div className="ibys-panel large">
          <div className="ibys-panel-head">
            <div>
              <h2>İBYS Gönderim Kuyruğu</h2>
              <p>Gönderilecek, gönderilen ve hatalı kayıtlar burada listelenecek.</p>
            </div>

           <button type="button" onClick={loadQueue} className="ibys-small-btn">
              <RefreshCcw size={16} />
              Yenile
            </button>
          </div>

          <div className="ibys-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tür</th>
                  <th>Firma</th>
                  <th>Kayıt</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
  {loading ? (
    <tr>
      <td colSpan={6}>
        <div className="ibys-empty">
          <RefreshCcw size={36} />
          <strong>Kuyruk yükleniyor...</strong>
          <span>İBYS gönderim kayıtları alınıyor.</span>
        </div>
      </td>
    </tr>
  ) : rows.length === 0 ? (
    <tr>
      <td colSpan={6}>
        <div className="ibys-empty">
          <Clock size={36} />
          <strong>Henüz gönderim kaydı yok</strong>
          <span>Test gönderimi oluşturduğunda kayıtlar burada görünecek.</span>
        </div>
      </td>
    </tr>
  ) : (
    rows.slice(0, 5).map((row) => (
      <tr key={row.id}>
        <td>{row.module_name || row.record_type || "-"}</td>
        <td>{row.firm_name || "-"}</td>
        <td>{row.record_title || row.record_type || "-"}</td>
        <td>
  <span
    className={`ibys-status-badge ${
      row.status === "SENT"
        ? "success"
        : row.status === "FAILED"
        ? "danger"
        : row.status === "RETRY"
        ? "warning"
        : row.status === "MISSING_INFO"
        ? "missing"
        : "pending"
    }`}
  >
    {row.status === "PENDING" && "Bekliyor"}
    {row.status === "READY" && "Hazır"}
    {row.status === "SENT" && "Gönderildi"}
    {row.status === "FAILED" && "Hatalı"}
    {row.status === "RETRY" && "Retry"}
    {row.status === "MISSING_INFO" && "Eksik Bilgi"}
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
  <div className="ibys-row-actions">
    <Link href="/admin/ibys/queue" className="ibys-row-btn">
      <Eye size={14} />
      Detay
    </Link>

    <Link href="/admin/ibys/queue" className="ibys-row-btn">
      <RotateCcw size={14} />
      Retry
    </Link>

    <Link href="/admin/ibys/logs" className="ibys-row-btn">
      <FileText size={14} />
      Log
    </Link>
  </div>
</td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
        </div>

        <aside className="ibys-side">
          <div className="ibys-panel">
            <h2>Eksik Bilgi Merkezi</h2>
            <p>İBYS gönderimi öncesi zorunlu alan kontrolü.</p>

            <div className="ibys-check-list">
              {missingChecks.map((item) => (
                <div key={item} className="ibys-check-item">
                  <span>{item}</span>
                  <FileWarning size={18} />
                </div>
              ))}
            </div>
          </div>

          <div className="ibys-panel">
  <h2>Hızlı İşlemler</h2>

  <div className="ibys-action-list">
  <Link href="/admin/ibys/queue" className="ibys-action-card">
    <ListOrdered size={18} />
    <span>Gönderim Kuyruğu</span>
  </Link>

  <Link href="/admin/ibys/logs" className="ibys-action-card">
    <ClipboardList size={18} />
    <span>Entegrasyon Logları</span>
  </Link>

  <Link href="/admin/ibys/services" className="ibys-action-card">
    <HeartPulse size={18} />
    <span>Servis Sağlığı</span>
  </Link>

  <Link href="/admin/ibys/companies" className="ibys-action-card">
    <Building2 size={18} />
    <span>Firma Eşleştirme</span>
  </Link>
</div>
          </div>
        </aside>
      </section>

      <section className="ibys-bottom-grid">
        <div className="ibys-panel">
          <div className="ibys-panel-head">
            <div>
              <h2>Bakanlık Servis Durumu</h2>
              <p>Test/canlı servis bağlantıları backend üzerinden kontrol edilecek.</p>
            </div>
          </div>

          <div className="ibys-service-grid">
            {services.map((service) => (
              <div key={service} className="ibys-service-card">
                <div>
                  <strong>{service}</strong>
                  <span>Bağlantı hazırlanacak</span>
                </div>

                <em>Hazır değil</em>
              </div>
            ))}
          </div>
        </div>

        <div className="ibys-panel dora">
          <div className="ibys-dora-icon">
            <Sparkles size={22} />
          </div>

          <h2>DORA İBYS Asistanı</h2>

          <p>
            İBYS gönderim hataları, eksik alanlar, firma eşleştirme problemleri
            ve servis cevapları burada akıllı önerilere dönüştürülecek.
          </p>

          <div className="ibys-dora-note">
            <Building2 size={18} />
            Henüz analiz edilecek firma kaydı yok.
          </div>
        </div>
      </section>

      <style jsx>{`
        .ibys-page {
          padding: 24px;
          background: #fafafa;
          min-height: 100vh;
          color: #111827;
        }

        .ibys-hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px;
          border-radius: 28px;
          background: linear-gradient(135deg, #4a0d1a 0%, #7f1d1d 100%);
          color: white;
          box-shadow: 0 24px 50px rgba(90, 15, 31, 0.18);
        }

        .ibys-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 14px;
        }

        .ibys-hero h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .ibys-hero p {
          max-width: 760px;
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.7;
          font-weight: 600;
        }

        .ibys-hero-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          min-width: 210px;
          align-content: center;
        }

        .ibys-btn,
        .ibys-small-btn {
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 950;
        }

        .ibys-btn {
         border-radius: 16px;
         padding: 13px 16px;
         font-size: 14px;
         text-decoration: none;
           }

        .ibys-btn.light {
          background: white;
          color: #5a0f1f;
        }

        .ibys-btn.green {
          background: #10b981;
          color: white;
        }

        .ibys-status-grid,
        .ibys-stat-grid {
          display: grid;
          gap: 16px;
          margin-top: 18px;
        }

        .ibys-status-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .ibys-stat-grid {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .ibys-status-card,
        .ibys-stat-card,
        .ibys-panel {
          background: white;
          border: 1px solid #ead7db;
          border-radius: 22px;
          box-shadow: 0 14px 30px rgba(90, 15, 31, 0.06);
        }

        .ibys-status-card {
          padding: 20px;
          position: relative;
        }

        .ibys-status-card svg {
          color: #5a0f1f;
          background: #fff1f2;
          padding: 10px;
          width: 46px;
          height: 46px;
          border-radius: 16px;
        }

        .ibys-status-card span {
          position: absolute;
          right: 16px;
          top: 18px;
          border-radius: 999px;
          padding: 5px 10px;
          background: #fef3c7;
          color: #92400e;
          font-size: 11px;
          font-weight: 950;
        }

        .ibys-status-card h3,
        .ibys-stat-card h3,
        .ibys-panel h2 {
          margin: 14px 0 0;
          font-weight: 950;
          color: #22070d;
        }

        .ibys-status-card p,
        .ibys-stat-card p,
        .ibys-panel p {
          margin: 6px 0 0;
          color: #7a5962;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.55;
        }

        .ibys-stat-card {
          padding: 18px;
        }

        .ibys-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ibys-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1f2;
          color: #5a0f1f;
        }

        .ibys-stat-top strong {
          font-size: 26px;
          font-weight: 950;
          color: #111827;
        }

        .ibys-stat-card.green .ibys-stat-icon {
          background: #ecfdf5;
          color: #047857;
        }

        .ibys-stat-card.red .ibys-stat-icon {
          background: #fef2f2;
          color: #b91c1c;
        }

        .ibys-stat-card.amber .ibys-stat-icon {
          background: #fffbeb;
          color: #b45309;
        }

        .ibys-stat-card.blue .ibys-stat-icon {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .ibys-stat-card.purple .ibys-stat-icon {
          background: #faf5ff;
          color: #7e22ce;
        }

        .ibys-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(320px, 0.9fr);
          gap: 18px;
          margin-top: 18px;
        }

        .ibys-panel {
          padding: 20px;
        }

        .ibys-panel.large {
          min-width: 0;
        }

        .ibys-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .ibys-panel h2 {
          font-size: 20px;
          margin-top: 0;
        }

        .ibys-small-btn {
          border: 1px solid #ead7db;
          background: white;
          color: #5a0f1f;
          border-radius: 14px;
          padding: 10px 13px;
        }

        .ibys-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #ead7db;
          border-radius: 18px;
        }

        table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        th {
          background: #fff7f8;
          color: #7a5962;
          padding: 14px;
          font-size: 12px;
          text-align: left;
          font-weight: 950;
        }

        td {
          padding: 24px;
          border-top: 1px solid #ead7db;
        }

        :global(.ibys-table-link) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ead7db;
        border-radius: 12px;
        padding: 8px 10px;
        background: white;
        color: #5a0f1f;
        font-size: 12px;
        font-weight: 950;
        text-decoration: none;
         }

:global(.ibys-row-actions) {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

:global(.ibys-row-btn) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #ead7db;
  border-radius: 12px;
  padding: 7px 9px;
  background: white;
  color: #5a0f1f;
  font-size: 12px;
  font-weight: 950;
  text-decoration: none;
}

:global(.ibys-row-btn:hover) {
  background: #5a0f1f;
  color: white;
}

        .ibys-empty {
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #9ca3af;
        }

        .ibys-empty strong {
          margin-top: 10px;
          color: #374151;
          font-weight: 950;
        }

        .ibys-empty span {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 700;
          color: #8b6770;
        }

        .ibys-side {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .ibys-check-list {
        display: grid;
        gap: 10px;
        margin-top: 16px;
         }

        .ibys-check-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 13px;
          border-radius: 16px;
          background: #fff7ed;
          color: #92400e;
          font-size: 13px;
          font-weight: 850;
        }

       .ibys-action-list {
        display: grid;
        gap: 12px;
        margin-top: 16px;
         }

        :global(.ibys-action-card) {
         display: flex !important;
        align-items: center;
       gap: 12px;
       width: 100%;
        padding: 14px 16px;
       border: 1px solid #ead7db;
       border-radius: 16px;
       background: white;
       color: #5a0f1f;
       font-weight: 950;
       text-decoration: none;
       transition: all .2s ease;
       }

       :global(.ibys-action-card svg) {
       flex-shrink: 0;
       }

:global(.ibys-action-card:hover) {
  background: #5a0f1f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(90,15,31,.18);
}

:global(.ibys-action-card:first-child) {
  background: #5a0f1f;
          color: white;
          }

         .ibys-bottom-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(320px, 0.9fr);
          gap: 18px;
          margin-top: 18px;
        }

        .ibys-service-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .ibys-service-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px;
          border: 1px solid #ead7db;
          border-radius: 18px;
          background: #fffafa;
        }

        .ibys-service-card strong {
          display: block;
          font-size: 13px;
          font-weight: 950;
          color: #22070d;
        }

        .ibys-service-card span {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #8b6770;
          font-weight: 700;
        }

        .ibys-service-card em {
          font-style: normal;
          white-space: nowrap;
          padding: 6px 10px;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          font-size: 11px;
          font-weight: 950;
        }

        .ibys-panel.dora {
          background: linear-gradient(180deg, #ffffff 0%, #fff1f2 100%);
        }

        .ibys-dora-icon {
          width: 48px;
          height: 48px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #5a0f1f;
          color: white;
          margin-bottom: 12px;
        }

        .ibys-dora-note {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          border-radius: 16px;
          background: white;
          border: 1px solid #ead7db;
          color: #5a0f1f;
          font-size: 13px;
          font-weight: 900;
        }

:global(.ibys-status-badge){
display:inline-flex;
align-items:center;
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:900;
}

:global(.pending){
background:#dbeafe;
color:#1d4ed8;
}

:global(.success){
background:#dcfce7;
color:#15803d;
}

:global(.danger){
background:#fee2e2;
color:#b91c1c;
}

:global(.warning){
background:#fef3c7;
color:#b45309;
}

:global(.missing){
background:#fde68a;
color:#92400e;
}

        @media (max-width: 1200px) {
          .ibys-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ibys-stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .ibys-main-grid,
          .ibys-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ibys-page {
            padding: 14px;
          }

          .ibys-hero {
            padding: 20px;
            border-radius: 22px;
            flex-direction: column;
          }

          .ibys-hero h1 {
            font-size: 25px;
          }

          .ibys-status-grid,
          .ibys-stat-grid,
          .ibys-service-grid {
            grid-template-columns: 1fr;
          }

          .ibys-panel-head {
            flex-direction: column;
          }

        }
       `}</style>
       </main>
  );
}
