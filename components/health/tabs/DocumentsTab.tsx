"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Props = {
  employee: any;
};

type Ek2Record = {
  id: string;
  form_type?: string | null;
  status?: string | null;
  exam_date?: string | null;
  decision?: string | null;
  file_no?: string | null;
};

type ExaminationRecord = {
  id: string;
  exam_type?: string | null;
  exam_date?: string | null;
  next_exam_date?: string | null;
  decision?: string | null;
};

type PrescriptionRecord = {
  id: string;
  diagnosisName?: string | null;
  diagnosis_name?: string | null;
  diagnosisCode?: string | null;
  diagnosis_code?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  status?: string | null;
  medicineCount?: number;
};

export default function DocumentsTab({ employee }: Props) {
  const [ek2Items, setEk2Items] = useState<Ek2Record[]>([]);
  const [examItems, setExamItems] = useState<ExaminationRecord[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);

        const ek2Res = await fetch(`/api/admin/ek2?employeeId=${employee.id}`, {
          cache: "no-store",
          credentials: "include",
        });

        const examRes = await fetch(
          `/api/admin/health-examinations?employeeId=${employee.id}&limit=50`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const prescriptionRes = await fetch(
          `/api/admin/health-prescriptions?employeeId=${employee.id}&limit=50`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const ek2Json = await ek2Res.json().catch(() => ({}));
        const examJson = await examRes.json().catch(() => ({}));
        const prescriptionJson = await prescriptionRes.json().catch(() => ({}));

        setEk2Items(ek2Json.success ? ek2Json.forms || [] : []);
        setExamItems(examJson.success ? examJson.examinations || [] : []);
        setPrescriptionItems(
          prescriptionJson.success ? prescriptionJson.prescriptions || [] : []
        );
      } catch {
        setEk2Items([]);
        setExamItems([]);
        setPrescriptionItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employee?.id) void loadFiles();
  }, [employee?.id]);

  function openUrl(url: string) {
    window.open(url, "_blank");
  }

  function printUrl(url: string) {
    const win = window.open(url, "_blank");
    if (win) setTimeout(() => win.print(), 1200);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Sağlık Dosyaları</h2>
        <p style={{ color: "#64748b", marginBottom: 0 }}>
          Çalışana ait EK-2, muayene, reçete ve sağlık evrakları bu alanda listelenir.
        </p>
      </section>

      <DocumentSection title={`EK-2 Formları (${ek2Items.length})`}>
        {loading ? (
          <Empty text="EK-2 kayıtları yükleniyor..." />
        ) : ek2Items.length === 0 ? (
          <Empty text="Bu çalışan için EK-2 kaydı bulunamadı." />
        ) : (
          ek2Items.map((item) => {
            const url = `/api/admin/ek2/${item.id}/download`;
            return (
              <FileCard
                key={item.id}
                title={item.file_no || `EK-2 ${item.form_type || ""}`}
                meta={`${item.form_type || "-"} • ${formatDate(item.exam_date)} • ${item.status || "-"}`}
                detail={`Karar: ${item.decision || "-"}`}
                actions={
                  <>
                    <button onClick={() => openUrl(url)} style={primaryButtonStyle}>Görüntüle</button>
                    <button onClick={() => openUrl(url)} style={secondaryButtonStyle}>PDF</button>
                    <button onClick={() => printUrl(url)} style={secondaryButtonStyle}>Yazdır</button>
                  </>
                }
              />
            );
          })
        )}
      </DocumentSection>

      <DocumentSection title={`Muayene Formları (${examItems.length})`}>
        {loading ? (
          <Empty text="Muayene kayıtları yükleniyor..." />
        ) : examItems.length === 0 ? (
          <Empty text="Bu çalışan için muayene kaydı bulunamadı." />
        ) : (
          examItems.map((item) => {
            const url = `/api/admin/health-examinations/${item.id}/pdf`;
            return (
              <FileCard
                key={item.id}
                title={item.exam_type || "Muayene Formu"}
                meta={`Muayene: ${formatDate(item.exam_date)} • Sonraki: ${formatDate(item.next_exam_date)}`}
                detail={`Karar: ${item.decision || "-"}`}
                actions={
                  <>
                    <button onClick={() => openUrl(url)} style={primaryButtonStyle}>Görüntüle</button>
                    <button onClick={() => openUrl(url)} style={secondaryButtonStyle}>PDF</button>
                    <button onClick={() => printUrl(url)} style={secondaryButtonStyle}>Yazdır</button>
                  </>
                }
              />
            );
          })
        )}
      </DocumentSection>

      <DocumentSection title={`Reçeteler (${prescriptionItems.length})`}>
        {loading ? (
          <Empty text="Reçeteler yükleniyor..." />
        ) : prescriptionItems.length === 0 ? (
          <Empty text="Bu çalışan için reçete kaydı bulunamadı." />
        ) : (
          prescriptionItems.map((item) => {
            const url = `/api/admin/health-prescriptions/${item.id}/pdf`;
            return (
              <FileCard
                key={item.id}
                title="E-Reçete"
                meta={`Tarih: ${formatDate(item.createdAt || item.created_at)}`}
                detail={`Tanı: ${item.diagnosisCode || item.diagnosis_code || "-"} ${
                  item.diagnosisName || item.diagnosis_name || "Tanı girilmemiş"
                }`}
                actions={
                  <button onClick={() => openUrl(url)} style={primaryButtonStyle}>
                    PDF Aç / İndir
                  </button>
                }
              />
            );
          })
        )}
      </DocumentSection>
    </div>
  );
}

function DocumentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}

function FileCard({ title, meta, detail, actions }: any) {
  return (
    <div style={fileCardStyle}>
      <div>
        <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
        <div style={{ color: "#64748b", marginTop: 6, fontWeight: 700 }}>{meta}</div>
        <div style={{ marginTop: 8, fontWeight: 800 }}>{detail}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR");
}

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const emptyStyle: CSSProperties = {
  padding: 28,
  borderRadius: 14,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontWeight: 800,
};

const fileCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#f8fafc",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "9px 13px",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "9px 13px",
  background: "#fff",
  color: "#334155",
  fontWeight: 900,
  cursor: "pointer",
};