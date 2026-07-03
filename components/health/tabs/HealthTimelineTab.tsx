"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Props = { employee: any };

type TimelineType = "EK2" | "MUAYENE" | "RECETE" | "KAZA";

type TimelineItem = {
  id: string;
  type: TimelineType;
  date: string | null;
  title: string;
  subtitle: string;
  detail: string;
  url?: string;
};

export default function HealthTimelineTab({ employee }: Props) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TÜMÜ");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);

        const [ek2Res, examRes, prescriptionRes, accidentRes] =
          await Promise.all([
            fetch(`/api/admin/ek2?employeeId=${employee.id}`, {
              cache: "no-store",
              credentials: "include",
            }),
            fetch(`/api/admin/health-examinations?employeeId=${employee.id}&limit=50`, {
              cache: "no-store",
              credentials: "include",
            }),
            fetch(`/api/admin/health-prescriptions?employeeId=${employee.id}&limit=50`, {
              cache: "no-store",
              credentials: "include",
            }),
            fetch(`/api/admin/accidents`, {
              cache: "no-store",
              credentials: "include",
            }),
          ]);

        const ek2Json = await ek2Res.json().catch(() => ({}));
        const examJson = await examRes.json().catch(() => ({}));
        const prescriptionJson = await prescriptionRes.json().catch(() => ({}));
        const accidentJson = await accidentRes.json().catch(() => ({}));

        const employeeName = normalizeText(employee.full_name || "");

        const ek2Items: TimelineItem[] = (ek2Json.forms || []).map((x: any) => ({
          id: `ek2-${x.id}`,
          type: "EK2",
          date: x.exam_date || x.created_at || null,
          title: `EK-2 ${x.form_type || ""}`,
          subtitle: `Karar: ${x.decision || "-"}`,
          detail: `${x.status || "-"} • ${formatDate(x.exam_date)}`,
          url: `/api/admin/ek2/${x.id}/download`,
        }));

        const examItems: TimelineItem[] = (examJson.examinations || []).map((x: any) => ({
          id: `exam-${x.id}`,
          type: "MUAYENE",
          date: x.exam_date || x.created_at || null,
          title: x.exam_type || "Muayene",
          subtitle: `Karar: ${x.decision || "-"}`,
          detail: `Sonraki muayene: ${formatDate(x.next_exam_date)}`,
          url: `/api/admin/health-examinations/${x.id}/pdf`,
        }));

        const prescriptionItems: TimelineItem[] = (prescriptionJson.prescriptions || []).map((x: any) => ({
          id: `recete-${x.id}`,
          type: "RECETE",
          date: x.createdAt || x.created_at || null,
          title: "E-Reçete",
          subtitle: `${x.diagnosisCode || x.diagnosis_code || "-"} ${
            x.diagnosisName || x.diagnosis_name || "Tanı girilmemiş"
          }`,
          detail: `${x.medicineCount || 0} ilaç`,
          url: `/api/admin/health-prescriptions/${x.id}/pdf`,
        }));

        const accidentItems: TimelineItem[] = (accidentJson.rows || [])
          .filter((x: any) => {
            const rowName = normalizeText(x.employeeName || "");
            const source = normalizeText(x.source || "");
            if (!rowName || rowName === "-") return false;
            if (source === "demo") return false;
            return rowName === employeeName;
          })
          .map((x: any) => ({
            id: `kaza-${x.id}`,
            type: "KAZA",
            date: x.eventDate || x.createdAt || null,
            title: x.title || "İş Kazası",
            subtitle: `Şiddet: ${x.severity ?? 0} • Kayıp gün: ${x.lostWorkDays ?? 0}`,
            detail: `${x.eventType || "-"} • ${x.location || "-"}`,
          }));

        setItems(
          [...ek2Items, ...examItems, ...prescriptionItems, ...accidentItems].sort(
            (a, b) =>
              (b.date ? new Date(b.date).getTime() : 0) -
              (a.date ? new Date(a.date).getTime() : 0)
          )
        );
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (employee?.id) void loadTimeline();
  }, [employee?.id]);

  const filteredItems = useMemo(() => {
    const q = normalizeText(search);

    return items.filter((item) => {
      const filterOk = filter === "TÜMÜ" || item.type === filter;
      const searchOk =
        !q ||
        normalizeText(item.title).includes(q) ||
        normalizeText(item.subtitle).includes(q) ||
        normalizeText(item.detail).includes(q);

      return filterOk && searchOk;
    });
  }, [items, filter, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};

    filteredItems.forEach((item) => {
      const key = formatDate(item.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups);
  }, [filteredItems]);

  const counts = {
    toplam: items.length,
    ek2: items.filter((x) => x.type === "EK2").length,
    muayene: items.filter((x) => x.type === "MUAYENE").length,
    recete: items.filter((x) => x.type === "RECETE").length,
    kaza: items.filter((x) => x.type === "KAZA").length,
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Sağlık Geçmişi</h2>
        <p style={{ color: "#64748b", marginBottom: 0 }}>
          Çalışanın EK-2, muayene, reçete ve iş kazası geçmişi tek zaman çizelgesinde gösterilir.
        </p>
      </section>

      <section style={statGridStyle}>
        <Stat title="Toplam" value={counts.toplam} />
        <Stat title="EK-2" value={counts.ek2} />
        <Stat title="Muayene" value={counts.muayene} />
        <Stat title="Reçete" value={counts.recete} />
        <Stat title="İş Kazası" value={counts.kaza} />
      </section>

      <section style={cardStyle}>
        <div style={toolbarStyle}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tanı, ilaç, kaza, karar ara..."
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["TÜMÜ", "EK2", "MUAYENE", "RECETE", "KAZA"].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setFilter(x)}
                style={filter === x ? activeFilterStyle : filterButtonStyle}
              >
                {labelType(x)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Empty text="Sağlık geçmişi yükleniyor..." />
        ) : groupedItems.length === 0 ? (
          <Empty text="Bu çalışan için sağlık geçmişi kaydı bulunamadı." />
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {groupedItems.map(([date, dayItems]) => (
              <div key={date}>
                <div style={dateHeaderStyle}>📅 {date}</div>

                <div style={timelineWrapStyle}>
                  {dayItems.map((item) => (
                    <div key={item.id} style={timelineRowStyle}>
                      <div style={lineStyle} />
                      <div style={iconStyle(item.type)}>{iconType(item.type)}</div>

                      <div style={timelineCardStyle(item.type)}>
                        <div>
                          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 900 }}>
                            {labelType(item.type)}
                          </div>

                          <h3 style={{ margin: "5px 0", fontSize: 18 }}>
                            {item.title}
                          </h3>

                          <div style={{ fontWeight: 900 }}>{item.subtitle}</div>

                          <div style={{ color: "#64748b", marginTop: 6, fontWeight: 700 }}>
                            {item.detail}
                          </div>
                        </div>

                        {item.url && (
                          <button
                            type="button"
                            onClick={() => window.open(item.url, "_blank")}
                            style={primaryButtonStyle}
                          >
                            Görüntüle / PDF
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div style={statStyle}>
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function labelType(type: string) {
  return {
    TÜMÜ: "Tümü",
    EK2: "EK-2",
    MUAYENE: "Muayene",
    RECETE: "Reçete",
    KAZA: "İş Kazası",
  }[type] || type;
}

function iconType(type: TimelineType) {
  return {
    EK2: "📄",
    MUAYENE: "🩺",
    RECETE: "💊",
    KAZA: "⚠️",
  }[type];
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function normalizeText(value: string) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

function iconStyle(type: TimelineType): CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background:
      type === "EK2"
        ? "#eff6ff"
        : type === "MUAYENE"
        ? "#f0fdf4"
        : type === "RECETE"
        ? "#faf5ff"
        : "#fef2f2",
    fontSize: 22,
    flexShrink: 0,
    zIndex: 2,
  };
}

function timelineCardStyle(type: TimelineType): CSSProperties {
  return {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderLeft:
      type === "EK2"
        ? "6px solid #2563eb"
        : type === "MUAYENE"
        ? "6px solid #16a34a"
        : type === "RECETE"
        ? "6px solid #7e22ce"
        : "6px solid #b91c1c",
    borderRadius: 18,
    padding: 18,
    background: "#f8fafc",
  };
}

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
  gap: 12,
};

const statStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  textAlign: "center",
};

const toolbarStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  marginBottom: 22,
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 800,
  outline: "none",
};

const filterButtonStyle: CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "8px 12px",
  background: "#fff",
  color: "#334155",
  fontWeight: 900,
  cursor: "pointer",
};

const activeFilterStyle: CSSProperties = {
  ...filterButtonStyle,
  border: "none",
  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  color: "#fff",
};

const dateHeaderStyle: CSSProperties = {
  fontWeight: 950,
  color: "#7f1d1d",
  marginBottom: 12,
  fontSize: 16,
};

const timelineWrapStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const timelineRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  gap: 14,
  alignItems: "center",
};

const lineStyle: CSSProperties = {
  position: "absolute",
  left: 21,
  top: 0,
  bottom: 0,
  width: 2,
  background: "#e5e7eb",
};

const emptyStyle: CSSProperties = {
  padding: 28,
  borderRadius: 14,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontWeight: 800,
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
