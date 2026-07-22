"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Image as ImageIcon,
  MapPin,
  Paperclip,
  ShieldAlert,
  Siren,
  UserRound,
  X,
} from "lucide-react";

import type { RiskRecord } from "../types";
import RiskEvidenceManager from "./RiskEvidenceManager";
import RiskAiPanel from "./RiskAiPanel";
import {
  formatDate,
  formatDateTime,
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type TabId =
  | "GENERAL"
  | "ANALYSIS"
  | "CONTROLS"
  | "DOF"
  | "FILES"
  | "AI"
  | "HISTORY";

type Props = {
  open: boolean;
  record: RiskRecord | null;
  onClose: () => void;
  onEdit?: (record: RiskRecord) => void;
};

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 13,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#0f172a",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {value === null ||
        value === undefined ||
        value === ""
          ? "-"
          : value}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        minHeight: 230,
        borderRadius: 16,
        border: "1px dashed #cbd5e1",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        color: "#94a3b8",
      }}
    >
      <div>
        {icon}

        <h3
          style={{
            margin: "12px 0 5px",
            color: "#334155",
            fontSize: 16,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default function RiskDetailDrawer({
  open,
  record,
  onClose,
  onEdit,
}: Props) {
  const [tab, setTab] =
    useState<TabId>("GENERAL");

  const dofDays = useMemo(() => {
    if (!record?.dueDateMillis) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const due = new Date(
      record.dueDateMillis
    );
    due.setHours(0, 0, 0, 0);

    return Math.ceil(
      (due.getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000)
    );
  }, [record]);

  if (!open || !record) return null;

  const tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "GENERAL",
      label: "Genel",
      icon: <Building2 size={15} />,
    },
    {
      id: "ANALYSIS",
      label: "Analiz",
      icon: <ShieldAlert size={15} />,
    },
    {
      id: "CONTROLS",
      label: "Kontroller",
      icon: <ClipboardCheck size={15} />,
    },
    {
      id: "DOF",
      label: "DÖF",
      icon: <CheckCircle2 size={15} />,
    },
    {
      id: "FILES",
      label: "Ekler",
      icon: <Paperclip size={15} />,
    },
    {
      id: "AI",
      label: "DORA",
      icon: <ShieldAlert size={15} />,
    },
    {
      id: "HISTORY",
      label: "Geçmiş",
      icon: <History size={15} />,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "rgba(15,23,42,.56)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <aside
        style={{
          width: "min(680px, 100%)",
          height: "100%",
          background: "#f8fafc",
          overflow: "hidden",
          boxShadow:
            "-24px 0 70px rgba(15,23,42,.25)",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0,1fr) auto",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header
          style={{
            padding: 18,
            background:
              "linear-gradient(135deg,#3f0d18 0%,#111827 100%)",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: 999,
                  padding: "5px 8px",
                  background:
                    "rgba(255,255,255,.12)",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                <ShieldAlert size={14} />
                RİSK DETAY MERKEZİ
              </div>

              <h2
                style={{
                  margin: "12px 0 0",
                  fontSize: 22,
                  lineHeight: 1.25,
                  fontWeight: 950,
                }}
              >
                {record.activity ||
                  record.hazard ||
                  "Risk kaydı"}
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color:
                    "rgba(255,255,255,.72)",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {record.company || "-"} ·{" "}
                {record.department || "-"} ·{" "}
                {record.process || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                flex: "0 0 auto",
                borderRadius: 12,
                border:
                  "1px solid rgba(255,255,255,.2)",
                background:
                  "rgba(255,255,255,.1)",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 8,
            }}
          >
            <div
              style={{
                borderRadius: 13,
                padding: 11,
                background:
                  "rgba(255,255,255,.1)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  opacity: .7,
                  fontWeight: 900,
                }}
              >
                RİSK SKORU
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 22,
                  fontWeight: 950,
                }}
              >
                {record.score}
              </div>
            </div>

            <div
              style={{
                borderRadius: 13,
                padding: 11,
                background:
                  "rgba(255,255,255,.1)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  opacity: .7,
                  fontWeight: 900,
                }}
              >
                SEVİYE
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: 950,
                }}
              >
                {riskLabel(record.level)}
              </div>
            </div>

            <div
              style={{
                borderRadius: 13,
                padding: 11,
                background:
                  "rgba(255,255,255,.1)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  opacity: .7,
                  fontWeight: 900,
                }}
              >
                DÖF
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: 950,
                }}
              >
                {record.completed
                  ? "Kapalı"
                  : "Açık"}
              </div>
            </div>
          </div>
        </header>

        <nav
          style={{
            padding: 9,
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: 6,
            overflowX: "auto",
          }}
        >
          {tabs.map((item) => {
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                style={{
                  minHeight: 38,
                  borderRadius: 10,
                  border: active
                    ? "1px solid #6b1020"
                    : "1px solid #dbe3ec",
                  background: active
                    ? "#6b1020"
                    : "#ffffff",
                  color: active
                    ? "#ffffff"
                    : "#475569",
                  padding: "0 11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            overflowY: "auto",
            padding: 16,
          }}
        >
          {tab === "GENERAL" ? (
            <div
              style={{
                display: "grid",
                gap: 11,
              }}
            >
              <div
                className="drawerTwoColumn"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <InfoCard
                  label="Firma"
                  value={record.company}
                />

                <InfoCard
                  label="Departman"
                  value={record.department}
                />

                <InfoCard
                  label="Süreç / Lokasyon"
                  value={record.process}
                />

                <InfoCard
                  label="Sorumlu"
                  value={record.responsible}
                />

                <InfoCard
                  label="Oluşturma"
                  value={formatDateTime(
                    record.createdAtMillis
                  )}
                />

                <InfoCard
                  label="Son Güncelleme"
                  value={formatDateTime(
                    record.updatedAtMillis
                  )}
                />
              </div>

              <InfoCard
                label="Faaliyet"
                value={record.activity}
              />

              <InfoCard
                label="Tehlike"
                value={record.hazard}
              />

              <InfoCard
                label="Olası Sonuç"
                value={record.consequence}
              />

              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid #dbe3ec",
                  background: "#ffffff",
                  padding: 13,
                  display: "flex",
                  gap: 9,
                  alignItems: "center",
                  color: "#475569",
                }}
              >
                <MapPin size={17} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  Kaynak:{" "}
                  {(record as RiskRecord & {
                    source?: string;
                  }).source || "WEB"}
                </span>
              </div>
            </div>
          ) : null}

          {tab === "ANALYSIS" ? (
            <div
              style={{
                display: "grid",
                gap: 11,
              }}
            >
              <div
                className="drawerThreeColumn"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,minmax(0,1fr))",
                  gap: 9,
                }}
              >
                <InfoCard
                  label="Yöntem"
                  value={
                    record.method ===
                    "FINE_KINNEY"
                      ? "Fine-Kinney"
                      : "5×5 Matris"
                  }
                />

                <InfoCard
                  label="Olasılık"
                  value={record.probability}
                />

                {record.method ===
                "FINE_KINNEY" ? (
                  <InfoCard
                    label="Frekans"
                    value={record.frequency}
                  />
                ) : (
                  <InfoCard
                    label="Matris"
                    value="5×5"
                  />
                )}

                <InfoCard
                  label="Şiddet"
                  value={record.severity}
                />

                <InfoCard
                  label="Risk Skoru"
                  value={record.score}
                />

                <InfoCard
                  label="Risk Seviyesi"
                  value={riskLabel(
                    record.level
                  )}
                />
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${riskColor(
                    record.level
                  )}44`,
                  background: riskBackground(
                    record.level
                  ),
                  padding: 16,
                  color: riskColor(
                    record.level
                  ),
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  HESAPLAMA
                </div>

                <div
                  style={{
                    marginTop: 7,
                    fontSize: 24,
                    fontWeight: 950,
                  }}
                >
                  {record.method ===
                  "FINE_KINNEY"
                    ? `${record.probability} × ${record.frequency} × ${record.severity}`
                    : `${record.probability} × ${record.severity}`}
                  {" = "}
                  {record.score}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {riskLabel(record.level)}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "CONTROLS" ? (
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <section
                style={{
                  borderRadius: 17,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    color: "#1d4ed8",
                    fontWeight: 950,
                  }}
                >
                  <ClipboardCheck size={17} />
                  Mevcut Kontrol Tedbirleri
                </div>

                <p
                  style={{
                    margin: "9px 0 0",
                    color: "#334155",
                    fontSize: 12,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {record.existingControl ||
                    "Mevcut kontrol tedbiri girilmemiş."}
                </p>
              </section>

              <section
                style={{
                  borderRadius: 17,
                  border: "1px solid #fed7aa",
                  background: "#fff7ed",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    color: "#c2410c",
                    fontWeight: 950,
                  }}
                >
                  <AlertTriangle size={17} />
                  İlave Kontrol Tedbirleri
                </div>

                <p
                  style={{
                    margin: "9px 0 0",
                    color: "#334155",
                    fontSize: 12,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {record.proposedControl ||
                    "İlave kontrol tedbiri girilmemiş."}
                </p>
              </section>
            </div>
          ) : null}

          {tab === "DOF" ? (
            <div
              style={{
                display: "grid",
                gap: 11,
              }}
            >
              <div
                className="drawerTwoColumn"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <InfoCard
                  label="Durum"
                  value={
                    record.completed
                      ? "Kapalı"
                      : "Açık"
                  }
                />

                <InfoCard
                  label="Sorumlu"
                  value={record.responsible}
                />

                <InfoCard
                  label="Termin"
                  value={formatDate(
                    record.dueDateMillis
                  )}
                />

                <InfoCard
                  label="Termin Durumu"
                  value={
                    dofDays === null
                      ? "Termin girilmemiş"
                      : record.completed
                        ? "Tamamlandı"
                        : dofDays < 0
                          ? `${Math.abs(
                              dofDays
                            )} gün gecikmiş`
                          : dofDays === 0
                            ? "Bugün"
                            : `${dofDays} gün kaldı`
                  }
                />
              </div>

              <div
                style={{
                  borderRadius: 16,
                  padding: 14,
                  border: record.completed
                    ? "1px solid #a7f3d0"
                    : dofDays !== null &&
                        dofDays < 0
                      ? "1px solid #fecaca"
                      : "1px solid #fde68a",
                  background: record.completed
                    ? "#ecfdf5"
                    : dofDays !== null &&
                        dofDays < 0
                      ? "#fef2f2"
                      : "#fffbeb",
                  color: record.completed
                    ? "#047857"
                    : dofDays !== null &&
                        dofDays < 0
                      ? "#b91c1c"
                      : "#92400e",
                  display: "flex",
                  gap: 9,
                  alignItems: "center",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {record.completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <CalendarDays size={18} />
                )}

                {record.completed
                  ? "Düzeltici faaliyet tamamlanmış olarak işaretlenmiştir."
                  : dofDays !== null &&
                      dofDays < 0
                    ? "Düzeltici faaliyet termin süresini aşmıştır ve öncelikli takip edilmelidir."
                    : "Düzeltici faaliyet açık durumdadır ve termin takibi devam etmektedir."}
              </div>

              <section
                style={{
                  borderRadius: 16,
                  border: "1px solid #dbe3ec",
                  background: "#ffffff",
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    color: "#0f172a",
                    fontWeight: 950,
                  }}
                >
                  <Siren size={17} color="#6b1020" />
                  Acil Durum İlişkisi
                </div>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#64748b",
                    fontSize: 12,
                    lineHeight: 1.55,
                  }}
                >
                  Bu riskin acil durum planı, destek
                  ekibi veya tatbikat kaydıyla ilişkisi
                  henüz tanımlanmamıştır. Senkronizasyon
                  ve ilişkilendirme katmanında bu alan
                  otomatik beslenecektir.
                </p>
              </section>
            </div>
          ) : null}

          {tab === "FILES" ? (
            <RiskEvidenceManager
              riskId={record.id}
              firmId={String(record.firmId || "")}
            />
          ) : null}

          {tab === "AI" ? (
            <RiskAiPanel record={record} />
          ) : null}

          {tab === "HISTORY" ? (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {[
                {
                  title: "Risk kaydı oluşturuldu",
                  date: record.createdAtMillis,
                  description:
                    "Risk kaydı sisteme ilk kez eklendi.",
                },
                {
                  title: "Risk kaydı güncellendi",
                  date: record.updatedAtMillis,
                  description:
                    "Kayıt üzerindeki en son güncelleme tarihi.",
                },
              ].map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "34px minmax(0,1fr)",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      display: "grid",
                      placeItems: "center",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                    }}
                  >
                    <History size={15} />
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        color: "#0f172a",
                        fontSize: 12,
                        fontWeight: 950,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#64748b",
                        fontSize: 11,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.description}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        color: "#94a3b8",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {formatDateTime(item.date)}
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  borderRadius: 15,
                  border: "1px dashed #cbd5e1",
                  padding: 14,
                  color: "#64748b",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Ayrıntılı revizyon farkları, kullanıcı
                bilgileri ve mobil-web işlem logları
                senkronizasyon aşamasında ayrı geçmiş
                tablosundan yüklenecektir.
              </div>
            </div>
          ) : null}
        </div>

        <footer
          style={{
            padding: 13,
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 9,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 41,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              padding: "0 14px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Kapat
          </button>

          {onEdit ? (
            <button
              type="button"
              onClick={() => {
                onEdit(record);
                onClose();
              }}
              style={{
                minHeight: 41,
                borderRadius: 11,
                border: 0,
                background: "#6b1020",
                color: "#ffffff",
                padding: "0 15px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Riski Düzenle
            </button>
          ) : null}
        </footer>

        <style jsx>{`
          @media (max-width: 620px) {
            .drawerTwoColumn,
            .drawerThreeColumn {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </aside>
    </div>
  );
}