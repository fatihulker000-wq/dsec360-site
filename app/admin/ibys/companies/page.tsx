"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileWarning,
  Link2,
  Pencil,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

const companies = [
  {
    name: "Demo Lojistik A.Ş.",
    taxNo: "Hazırlanacak",
    sgkNo: "Eksik",
    status: "Hazır değil",
    missing: "SGK sicil no eksik",
  },
  {
    name: "Demo Üretim Ltd.",
    taxNo: "Hazırlanacak",
    sgkNo: "Hazırlanacak",
    status: "Hazırlanacak",
    missing: "İBYS firma eşleştirmesi yapılmadı",
  },
];

export default function IbysCompaniesPage() {
  return (
    <main className="ibys-company-page">
      <section className="company-hero">
        <div>
          <div className="company-pill">
            <Building2 size={16} />
            İBYS Firma Eşleştirme
          </div>

          <h1>Firma İBYS Eşleştirme Merkezi</h1>

          <p>
            D-SEC’e kayıtlı firmaların vergi no, SGK sicil no ve İBYS bağlantı
            durumlarını kontrol ederek resmi gönderime hazır hale getirir.
          </p>
        </div>

        <button type="button" className="hero-btn">
          <RefreshCcw size={17} />
          Listeyi Yenile
        </button>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <Building2 size={22} />
          <strong>2</strong>
          <span>Toplam Firma</span>
        </div>

        <div className="summary-card green">
          <CheckCircle2 size={22} />
          <strong>0</strong>
          <span>Hazır Firma</span>
        </div>

        <div className="summary-card amber">
          <FileWarning size={22} />
          <strong>2</strong>
          <span>Eksik Bilgili</span>
        </div>

        <div className="summary-card red">
          <XCircle size={22} />
          <strong>0</strong>
          <span>Hatalı Eşleşme</span>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel large">
          <div className="panel-head">
            <div>
              <h2>Firma Listesi</h2>
              <p>İBYS’ye gönderilecek firmaların eşleştirme ve eksik bilgi durumu.</p>
            </div>

            <div className="search-box">
              <Search size={16} />
              <input placeholder="Firma ara..." />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Vergi No</th>
                  <th>SGK Sicil</th>
                  <th>İBYS Durumu</th>
                  <th>Eksik / Uyarı</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company) => (
                  <tr key={company.name}>
                    <td>
                      <div className="firm-cell">
                        <span>
                          <Building2 size={17} />
                        </span>
                        <strong>{company.name}</strong>
                      </div>
                    </td>
                    <td>{company.taxNo}</td>
                    <td>
                      <em className={company.sgkNo === "Eksik" ? "badge red" : "badge amber"}>
                        {company.sgkNo}
                      </em>
                    </td>
                    <td>
                      <em className="badge amber">{company.status}</em>
                    </td>
                    <td>
                      <div className="warning-cell">
                        <AlertTriangle size={16} />
                        {company.missing}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button">
                          <Link2 size={15} />
                          Eşleştir
                        </button>
                        <button type="button">
                          <Pencil size={15} />
                          Düzenle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="side">
          <div className="panel">
            <div className="side-icon">
              <ShieldCheck size={22} />
            </div>

            <h2>Eşleştirme Kontrolü</h2>
            <p>Firma gönderime hazır olmadan önce aşağıdaki alanlar tamamlanmalı.</p>

            <div className="check-list">
              <div>
                <span>Vergi no</span>
                <em>Kontrol</em>
              </div>
              <div>
                <span>SGK sicil no</span>
                <em>Kontrol</em>
              </div>
              <div>
                <span>Tehlike sınıfı</span>
                <em>Kontrol</em>
              </div>
              <div>
                <span>İBYS firma kodu</span>
                <em>Kontrol</em>
              </div>
            </div>
          </div>

          <div className="panel dora">
            <div className="side-icon dark">
              <Sparkles size={22} />
            </div>

            <h2>DORA Önerisi</h2>
            <p>
              Firma eşleştirmesi yapılmadan eğitim, sağlık ve olay kayıtlarının
              İBYS’ye güvenli gönderimi başlatılmamalıdır.
            </p>

            <div className="dora-note">
              Öncelik: SGK sicil no ve İBYS firma eşleştirme alanları.
            </div>
          </div>
        </aside>
      </section>

      <style jsx>{`
        .ibys-company-page {
          min-height: 100vh;
          background: #fafafa;
          padding: 24px;
          color: #111827;
        }

        .company-hero {
          display: flex;
          justify-content: space-between;
          gap: 22px;
          padding: 26px;
          border-radius: 28px;
          color: white;
          background: linear-gradient(135deg, #4a0d1a 0%, #7f1d1d 100%);
          box-shadow: 0 22px 46px rgba(90, 15, 31, 0.18);
        }

        .company-pill {
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

        .company-hero h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .company-hero p {
          max-width: 760px;
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.7;
          font-weight: 650;
        }

        .hero-btn {
          align-self: center;
          border: none;
          border-radius: 16px;
          padding: 13px 16px;
          background: white;
          color: #5a0f1f;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .summary-card,
        .panel {
          background: white;
          border: 1px solid #ead7db;
          border-radius: 22px;
          box-shadow: 0 14px 30px rgba(90, 15, 31, 0.06);
        }

        .summary-card {
          padding: 18px;
        }

        .summary-card svg {
          color: #5a0f1f;
          background: #fff1f2;
          padding: 10px;
          width: 44px;
          height: 44px;
          border-radius: 15px;
        }

        .summary-card.green svg {
          color: #047857;
          background: #ecfdf5;
        }

        .summary-card.amber svg {
          color: #b45309;
          background: #fffbeb;
        }

        .summary-card.red svg {
          color: #b91c1c;
          background: #fef2f2;
        }

        .summary-card strong {
          display: block;
          margin-top: 12px;
          font-size: 28px;
          font-weight: 950;
        }

        .summary-card span {
          display: block;
          margin-top: 4px;
          color: #7a5962;
          font-size: 13px;
          font-weight: 800;
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

        .search-box {
          height: 42px;
          min-width: 250px;
          border: 1px solid #ead7db;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          color: #5a0f1f;
          background: #fff;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-weight: 800;
          background: transparent;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #ead7db;
          border-radius: 18px;
        }

        table {
          width: 100%;
          min-width: 920px;
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

        .firm-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .firm-cell span {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: #fff1f2;
          color: #5a0f1f;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .firm-cell strong {
          color: #22070d;
          font-weight: 950;
        }

        .badge {
          font-style: normal;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
        }

        .badge.amber {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.red {
          background: #fee2e2;
          color: #991b1b;
        }

        .warning-cell {
          display: flex;
          align-items: center;
          gap: 8px;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
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

        .side-icon.dark {
          background: #5a0f1f;
          color: white;
        }

        .check-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .check-list div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 13px;
          border-radius: 16px;
          background: #fffafa;
          border: 1px solid #ead7db;
        }

        .check-list span {
          font-size: 13px;
          font-weight: 900;
          color: #374151;
        }

        .check-list em {
          font-style: normal;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 950;
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
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ibys-company-page {
            padding: 14px;
          }

          .company-hero {
            flex-direction: column;
            padding: 20px;
            border-radius: 22px;
          }

          .company-hero h1 {
            font-size: 24px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .panel-head {
            flex-direction: column;
          }

          .search-box {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}