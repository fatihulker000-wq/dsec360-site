"use client";

import { Loader2, Save, X } from "lucide-react";

export type RiskDialogMethod = "MATRIX" | "FINE_KINNEY";
export type RiskDialogDofStatus = "OPEN" | "CLOSED";

export type RiskDialogForm = {
  id?: string;
  method: RiskDialogMethod;
  companyId: string;
  title: string;
  hazard: string;
  consequence: string;
  control: string;
  probability: number;
  severity: number;
  probabilityValue: number;
  frequencyValue: number;
  severityValue: number;
  department: string;
  location: string;
  machine: string;
  responsible: string;
  dofStatus: RiskDialogDofStatus;
  dofAction: string;
  dofResponsible: string;
  dofDueDate: string;
  dofNote: string;
};

type Props = {
  open: boolean;
  saving: boolean;
  form: RiskDialogForm;
  companies: string[];
  onChange: (form: RiskDialogForm) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

const inputStyle = {
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: "0 12px",
  width: "100%",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "grid",
  gap: 6,
};

const labelTextStyle = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

export default function RiskDialog({
  open,
  saving,
  form,
  companies,
  onChange,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  const setField = <K extends keyof RiskDialogForm>(
    key: K,
    value: RiskDialogForm[K]
  ) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,0.58)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        style={{
          width: "min(920px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#ffffff",
          padding: 20,
          boxShadow: "0 30px 90px rgba(15,23,42,0.34)",
        }}
        onClick={(event) => event.stopPropagation()}
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
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              {form.id ? "Risk Kaydını Düzenle" : "Yeni Risk Kaydı"}
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              5x5 Matris veya Fine-Kinney yöntemiyle kayıt oluşturun.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Kapat"
            style={{
              width: 40,
              height: 40,
              border: 0,
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: 12,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="riskDialogGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            <span style={labelTextStyle}>Yöntem</span>

            <select
              value={form.method}
              onChange={(event) =>
                setField(
                  "method",
                  event.target.value as RiskDialogMethod
                )
              }
              style={inputStyle}
            >
              <option value="MATRIX">5x5 Matris</option>
              <option value="FINE_KINNEY">Fine-Kinney</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Firma</span>

            <select
              value={form.companyId}
              onChange={(event) =>
                setField("companyId", event.target.value)
              }
              style={inputStyle}
            >
              <option value="">Firma seçin</option>

              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </label>

          {[
            ["title", "Risk Başlığı"],
            ["hazard", "Tehlike"],
            ["department", "Bölüm"],
            ["location", "Lokasyon"],
            ["machine", "Makine / Ekipman"],
            ["responsible", "Sorumlu"],
          ].map(([key, label]) => (
            <label key={key} style={labelStyle}>
              <span style={labelTextStyle}>{label}</span>

              <input
                value={String(
                  form[key as keyof RiskDialogForm] || ""
                )}
                onChange={(event) =>
                  setField(
                    key as keyof RiskDialogForm,
                    event.target.value as never
                  )
                }
                style={inputStyle}
              />
            </label>
          ))}

          {form.method === "MATRIX" ? (
            <>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Olasılık (1-5)</span>

                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.probability}
                  onChange={(event) =>
                    setField(
                      "probability",
                      Number(event.target.value)
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Şiddet (1-5)</span>

                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.severity}
                  onChange={(event) =>
                    setField(
                      "severity",
                      Number(event.target.value)
                    )
                  }
                  style={inputStyle}
                />
              </label>
            </>
          ) : (
            <>
              {[
                ["probabilityValue", "Olasılık (P)"],
                ["frequencyValue", "Frekans (F)"],
                ["severityValue", "Şiddet (S)"],
              ].map(([key, label]) => (
                <label key={key} style={labelStyle}>
                  <span style={labelTextStyle}>{label}</span>

                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={Number(
                      form[key as keyof RiskDialogForm] || 0
                    )}
                    onChange={(event) =>
                      setField(
                        key as keyof RiskDialogForm,
                        Number(event.target.value) as never
                      )
                    }
                    style={inputStyle}
                  />
                </label>
              ))}
            </>
          )}

          {[
            ["consequence", "Olası Sonuç"],
            ["control", "Mevcut / Önerilen Kontrol"],
            ["dofAction", "DÖF Aksiyonu"],
            ["dofResponsible", "DÖF Sorumlusu"],
            ["dofNote", "DÖF Notu"],
          ].map(([key, label]) => (
            <label
              key={key}
              style={{
                ...labelStyle,
                gridColumn: "1 / -1",
              }}
            >
              <span style={labelTextStyle}>{label}</span>

              <textarea
                rows={3}
                value={String(
                  form[key as keyof RiskDialogForm] || ""
                )}
                onChange={(event) =>
                  setField(
                    key as keyof RiskDialogForm,
                    event.target.value as never
                  )
                }
                style={{
                  borderRadius: 12,
                  border: "1px solid #dbe3ec",
                  padding: 12,
                  resize: "vertical",
                }}
              />
            </label>
          ))}

          <label style={labelStyle}>
            <span style={labelTextStyle}>DÖF Durumu</span>

            <select
              value={form.dofStatus}
              onChange={(event) =>
                setField(
                  "dofStatus",
                  event.target.value as RiskDialogDofStatus
                )
              }
              style={inputStyle}
            >
              <option value="OPEN">Açık</option>
              <option value="CLOSED">Kapalı</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>DÖF Termin Tarihi</span>

            <input
              type="date"
              value={form.dofDueDate}
              onChange={(event) =>
                setField("dofDueDate", event.target.value)
              }
              style={inputStyle}
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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
            disabled={saving}
            style={{
              height: 44,
              borderRadius: 12,
              border: 0,
              background: "#6b1020",
              color: "#ffffff",
              fontWeight: 900,
              padding: "0 18px",
              cursor: saving ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <Loader2 size={16} className="riskDialogSpin" />
            ) : (
              <Save size={16} />
            )}

            {saving ? "Kaydediliyor" : "Kaydet"}
          </button>
        </div>
      </section>

      <style jsx>{`
        .riskDialogSpin {
          animation: risk-dialog-spin 0.9s linear infinite;
        }

        @keyframes risk-dialog-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          .riskDialogGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}