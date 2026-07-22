"use client";

import {
  CalendarDays,
  FileText,
  ImagePlus,
  MapPin,
  Save,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import type { EmergencyPlan } from "../types";

type Props = {
  open: boolean;
  plan: Partial<EmergencyPlan>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChange: (
    field: keyof EmergencyPlan,
    value: unknown
  ) => void;
};

function millisToDate(value?: number | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function dateToMillis(value: string) {
  if (!value) return null;

  const millis = new Date(
    `${value}T00:00:00`
  ).getTime();

  return Number.isNaN(millis) ? null : millis;
}

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: "0 12px",
  background: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  width: "100%",
  minHeight: 110,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: 12,
  background: "#ffffff",
  color: "#0f172a",
  resize: "vertical" as const,
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "grid",
  gap: 6,
};

const labelTextStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 850,
};

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        paddingTop: 6,
        marginTop: 4,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#0f172a",
            fontSize: 16,
            fontWeight: 900,
          }}
        >
          {title}
        </div>

        {description ? (
          <div
            style={{
              marginTop: 3,
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ActionPlanDialog({
  open,
  plan,
  onClose,
  onSave,
  onChange,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "94vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#ffffff",
          padding: 22,
          boxShadow:
            "0 30px 90px rgba(15,23,42,0.34)",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 24,
                fontWeight: 950,
              }}
            >
              Acil Durum Eylem Planı
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Plan, revizyon, sorumlular,
              senaryolar ve görsel kayıtları
              yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            style={{
              width: 40,
              height: 40,
              border: 0,
              borderRadius: 12,
              background: "#f1f5f9",
              color: "#475569",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="actionPlanGrid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <SectionTitle
            icon={<FileText size={18} />}
            title="Plan ve İşyeri Bilgileri"
          />

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Plan Başlığı
            </span>

            <input
              value={plan.planTitle ?? ""}
              onChange={(event) =>
                onChange(
                  "planTitle",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              İşyeri Unvanı
            </span>

            <input
              value={plan.workplaceTitle ?? ""}
              onChange={(event) =>
                onChange(
                  "workplaceTitle",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            <span style={labelTextStyle}>
              İşyeri Adresi
            </span>

            <textarea
              rows={3}
              value={plan.workplaceAddress ?? ""}
              onChange={(event) =>
                onChange(
                  "workplaceAddress",
                  event.target.value
                )
              }
              style={textareaStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Tehlike Sınıfı
            </span>

            <select
              value={
                plan.dangerClass ??
                "AZ_TEHLIKELI"
              }
              onChange={(event) =>
                onChange(
                  "dangerClass",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="AZ_TEHLIKELI">
                Az Tehlikeli
              </option>
              <option value="TEHLIKELI">
                Tehlikeli
              </option>
              <option value="COK_TEHLIKELI">
                Çok Tehlikeli
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Çalışan Sayısı
            </span>

            <input
              type="number"
              min={0}
              value={plan.employeeCount ?? 0}
              onChange={(event) =>
                onChange(
                  "employeeCount",
                  Number(event.target.value)
                )
              }
              style={inputStyle}
            />
          </label>

          <SectionTitle
            icon={<CalendarDays size={18} />}
            title="Plan Tarihleri ve Revizyon"
          />

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Plan Tarihi
            </span>

            <input
              type="date"
              value={millisToDate(
                plan.planDateMillis
              )}
              onChange={(event) =>
                onChange(
                  "planDateMillis",
                  dateToMillis(
                    event.target.value
                  ) ?? Date.now()
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Geçerlilik Tarihi
            </span>

            <input
              type="date"
              value={millisToDate(
                plan.validUntilMillis
              )}
              onChange={(event) =>
                onChange(
                  "validUntilMillis",
                  dateToMillis(
                    event.target.value
                  )
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Revizyon Tarihi
            </span>

            <input
              type="date"
              value={millisToDate(
                plan.revisionDateMillis
              )}
              onChange={(event) =>
                onChange(
                  "revisionDateMillis",
                  dateToMillis(
                    event.target.value
                  )
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Revizyon No
            </span>

            <input
              value={plan.revisionNo ?? "R0"}
              onChange={(event) =>
                onChange(
                  "revisionNo",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <SectionTitle
            icon={<MapPin size={18} />}
            title="Toplanma Alanı ve Sorumlular"
          />

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            <span style={labelTextStyle}>
              Toplanma Alanı
            </span>

            <textarea
              rows={3}
              value={plan.assemblyArea ?? ""}
              onChange={(event) =>
                onChange(
                  "assemblyArea",
                  event.target.value
                )
              }
              style={textareaStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Acil Durum Koordinatörü
            </span>

            <input
              value={
                plan.emergencyCoordinator ?? ""
              }
              onChange={(event) =>
                onChange(
                  "emergencyCoordinator",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Hazırlayan
            </span>

            <input
              value={plan.preparedBy ?? ""}
              onChange={(event) =>
                onChange(
                  "preparedBy",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Onaylayan
            </span>

            <input
              value={plan.approvedBy ?? ""}
              onChange={(event) =>
                onChange(
                  "approvedBy",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <div />

          <SectionTitle
            icon={<ImagePlus size={18} />}
            title="Fotoğraf Bağlantıları"
            description="Mobil uygulamadan gelen URI veya web depolama bağlantıları"
          />

          {[
            [
              "assemblyAreaPhotoUri",
              "Toplanma Alanı Fotoğrafı",
            ],
            [
              "emergencyExitRoutePhotoUri",
              "Acil Çıkış Güzergâhı",
            ],
            [
              "fireEquipmentPhotoUri",
              "Yangın Ekipmanları",
            ],
            [
              "emergencyBoardPhotoUri",
              "Acil Durum Panosu",
            ],
          ].map(([field, label]) => (
            <label
              key={field}
              style={labelStyle}
            >
              <span style={labelTextStyle}>
                {label}
              </span>

              <input
                value={String(
                  plan[
                    field as keyof EmergencyPlan
                  ] ?? ""
                )}
                onChange={(event) =>
                  onChange(
                    field as keyof EmergencyPlan,
                    event.target.value || null
                  )
                }
                placeholder="https://... veya content://..."
                style={inputStyle}
              />
            </label>
          ))}

          <SectionTitle
            icon={<ShieldAlert size={18} />}
            title="Acil Durum Senaryoları"
          />

          {[
            [
              "fireScenario",
              "Yangın Senaryosu",
            ],
            [
              "earthquakeScenario",
              "Deprem Senaryosu",
            ],
            [
              "floodScenario",
              "Sel / Su Baskını Senaryosu",
            ],
            [
              "accidentScenario",
              "İş Kazası Senaryosu",
            ],
            [
              "evacuationScenario",
              "Tahliye Senaryosu",
            ],
          ].map(([field, label]) => (
            <label
              key={field}
              style={{
                ...labelStyle,
                gridColumn: "1 / -1",
              }}
            >
              <span style={labelTextStyle}>
                {label}
              </span>

              <textarea
                rows={4}
                value={String(
                  plan[
                    field as keyof EmergencyPlan
                  ] ?? ""
                )}
                onChange={(event) =>
                  onChange(
                    field as keyof EmergencyPlan,
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </label>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 44,
              borderRadius: 12,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              color: "#475569",
              fontWeight: 850,
              padding: "0 16px",
              cursor: "pointer",
            }}
          >
            İptal
          </button>

          <button
            type="button"
            onClick={() => void onSave()}
            style={{
              height: 44,
              borderRadius: 12,
              border: 0,
              background: "#991b1b",
              color: "#ffffff",
              fontWeight: 900,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Save size={16} />
            Planı Kaydet
          </button>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 760px) {
          .actionPlanGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}