"use client";

import { useEffect, useMemo, useState } from "react";

type CompanyRow = {
  id: string;
  name: string;
};

type ReportResponse = {
  success?: boolean;
  company?: {
    id: string;
    name: string;
    company_title: string;
    address: string;
    employer_representative: string;
    employee_count: number;
  };
  summary?: {
    total_employees: number;
    total_trainings: number;
    total_assignments: number;
    completed_count: number;
    in_progress_count: number;
    not_started_count: number;
  };
  trainings?: Array<{
    id: string;
    title: string;
  }>;
  matrix?: Array<{
    user_id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    statuses: Array<{
      training_id: string;
      status: string;
    }>;
  }>;
  error?: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  green: "#166534",
  blue: "#1d4ed8",
  amber: "#92400e",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
  };
}

function statusStyle(status: string): React.CSSProperties {
  if (status === "Tamamlandı") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (status === "Devam Ediyor") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    };
  }

  if (status === "Başlamadı") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  };
}

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);

      const res = await fetch("/api/admin/companies", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Firmalar alınamadı.");
        setCompanies([]);
        return;
      }

      const list = Array.isArray(json?.data)
        ? json.data.map((item: { id: string; name: string }) => ({
            id: String(item.id),
            name: String(item.name || "").trim(),
          }))
        : [];

      setCompanies(list);
    } catch (err) {
      console.error(err);
      setError("Firmalar alınamadı.");
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadReport = async (companyId: string) => {
    if (!companyId) {
      setReport(null);
      return;
    }

    try {
      setLoadingReport(true);
      setError("");

      const res = await fetch(
        `/api/admin/reports/company-training-matrix?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: ReportResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Rapor alınamadı.");
        setReport(null);
        return;
      }

      setReport(json);
    } catch (err) {
      console.error(err);
      setError("Rapor alınamadı.");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      void loadReport(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const completionRate = useMemo(() => {
    const total = report?.summary?.total_assignments || 0;
    const completed = report?.summary?.completed_count || 0;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [report]);

  return (
    <main style={{ minHeight: "100%", background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 36, fontWeight: 900 }}>
            Firma Eğitim Raporları
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            Firma seç, künye bilgilerini görüntüle ve çalışan x eğitim durum matrisini incele.
          </p>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
            Firma Seç
          </div>

          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            disabled={loadingCompanies}
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${BRAND.border}`,
              background: "#fff",
              fontSize: 14,
            }}
          >
            <option value="">Firma seç</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div style={{ ...cardStyle(), marginBottom: 20, color: BRAND.red, fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {loadingReport ? (
          <div style={cardStyle()}>Rapor yükleniyor...</div>
        ) : null}

        {!loadingReport && report?.company ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 0.7fr",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Firma Künyesi
                </h2>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Firma Adı</div>
                    <div style={{ marginTop: 4, fontWeight: 800, color: BRAND.text }}>
                      {report.company.name}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Şirket Ünvanı</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.company_title}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Adres</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.address}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>İşveren Vekili</div>
                    <div style={{ marginTop: 4, fontWeight: 700, color: BRAND.text }}>
                      {report.company.employer_representative}
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardStyle()}>
                <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                  Eğitim Özeti
                </h2>

                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Çalışan Sayısı</div>
                    <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900 }}>
                      {report.company.employee_count}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: BRAND.muted }}>Tamamlama Oranı</div>
                    <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: BRAND.green }}>
                      %{completionRate}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.7 }}>
                    Toplam Atama: {report.summary?.total_assignments || 0}
                    <br />
                    Tamamlandı: {report.summary?.completed_count || 0}
                    <br />
                    Devam Ediyor: {report.summary?.in_progress_count || 0}
                    <br />
                    Başlamadı: {report.summary?.not_started_count || 0}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam Çalışan</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                  {report.summary?.total_employees || 0}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam Eğitim</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                  {report.summary?.total_trainings || 0}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Toplam Atama</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
                  {report.summary?.total_assignments || 0}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Tamamlanan</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 28,
                    fontWeight: 900,
                    color: BRAND.green,
                  }}
                >
                  {report.summary?.completed_count || 0}
                </div>
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 12, color: BRAND.muted }}>Devam / Başlamadı</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 28,
                    fontWeight: 900,
                    color: BRAND.amber,
                  }}
                >
                  {(report.summary?.in_progress_count || 0) + (report.summary?.not_started_count || 0)}
                </div>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
                Eğitim Durum Matrisi
              </h2>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 900,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: 12,
                          borderBottom: `1px solid ${BRAND.border}`,
                          background: "#f9fafb",
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                        }}
                      >
                        Çalışan
                      </th>

                      {report.trainings?.map((training) => (
                        <th
                          key={training.id}
                          style={{
                            textAlign: "center",
                            padding: 12,
                            borderBottom: `1px solid ${BRAND.border}`,
                            background: "#f9fafb",
                            minWidth: 160,
                          }}
                        >
                          {training.title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {report.matrix?.map((row) => (
                      <tr key={row.user_id}>
                        <td
                          style={{
                            padding: 12,
                            borderBottom: `1px solid ${BRAND.border}`,
                            background: "#fff",
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            minWidth: 220,
                          }}
                        >
                          <div style={{ fontWeight: 800, color: BRAND.text }}>
                            {row.full_name}
                          </div>
                          <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 4 }}>
                            {row.email || "-"}
                          </div>
                        </td>

                        {row.statuses.map((cell) => (
                          <td
                            key={`${row.user_id}-${cell.training_id}`}
                            style={{
                              padding: 12,
                              borderBottom: `1px solid ${BRAND.border}`,
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                ...statusStyle(cell.status),
                                display: "inline-flex",
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {cell.status}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}