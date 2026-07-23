"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Save, Trash2, X } from "lucide-react";

import type {
  EmergencyEquipment,
  EmergencyPlan,
  EmergencyPlanContent,
} from "../../../../lib/emergency/types";
import { DEFAULT_EMERGENCY_PLAN_CONTENT } from "./emergencyPlanTemplate";
import { printEmergencyPlan } from "./emergencyPlanReport";

type ExtendedPlan = Partial<EmergencyPlan>;

type Props = {
  open: boolean;
  plan: ExtendedPlan;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChange: (
    field: keyof EmergencyPlan,
    value: unknown
  ) => void;
};

type Tab =
  | "GENERAL"
  | "CONTENT"
  | "SCENARIOS"
  | "CONTACTS"
  | "AREAS"
  | "EQUIPMENT"
  | "SKETCHES"
  | "REVISIONS"
  | "APPROVALS";

const inputStyle = {
  width: "100%",
  minHeight: 44,
  borderRadius: 11,
  border: "1px solid #dbe3ec",
  padding: "9px 11px",
  boxSizing: "border-box" as const,
};

const labelStyle = { display: "grid", gap: 6 };
const labelText = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 850,
};

function cloneDefault(): EmergencyPlanContent {
  return JSON.parse(
    JSON.stringify(DEFAULT_EMERGENCY_PLAN_CONTENT)
  );
}

export default function ActionPlanDialog({
  open,
  plan,
  onClose,
  onSave,
  onChange,
}: Props) {
  const [tab, setTab] =
    useState<Tab>("GENERAL");

  const content = useMemo(
    () => plan.planContent || cloneDefault(),
    [plan.planContent]
  );

  useEffect(() => {
    if (!open) return;

    setTab("GENERAL");

    if (!plan.planContent) {
      onChange("planContent", cloneDefault());
    }

    if (!plan.planNo) {
      onChange(
        "planNo",
        `ADP-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-6)}`
      );
    }
  }, [open, plan.id]);

  if (!open) return null;

  const updateContent = (
    patch: Partial<EmergencyPlanContent>
  ) => {
    onChange("planContent", {
      ...content,
      ...patch,
    });
  };

  const tabs: Array<[Tab, string]> = [
    ["GENERAL", "Genel"],
    ["CONTENT", "Plan İçeriği"],
    ["SCENARIOS", "Senaryolar"],
    ["CONTACTS", "Acil İletişim"],
    ["AREAS", "Toplanma Alanı"],
    ["EQUIPMENT", "Ekipman"],
    ["SKETCHES", "Krokiler"],
    ["REVISIONS", "Revizyonlar"],
    ["APPROVALS", "Onaylar"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 130,
        background:
          "rgba(15,23,42,.68)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(1220px,100%)",
          maxHeight: "95vh",
          overflow: "hidden",
          borderRadius: 24,
          background: "#fff",
          display: "grid",
          gridTemplateRows:
            "auto auto minmax(0,1fr) auto",
        }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header
          style={{
            padding: 18,
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              Kurumsal Acil Durum
              Eylem Planı
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Plan, senaryolar, krokiler,
              revizyonlar ve PDF çıktısı.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              border: 0,
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <nav
          style={{
            padding: "10px 18px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
          }}
        >
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                minHeight: 38,
                borderRadius: 10,
                border:
                  tab === id
                    ? "1px solid #7f1d1d"
                    : "1px solid #dbe3ec",
                background:
                  tab === id
                    ? "#7f1d1d"
                    : "#fff",
                color:
                  tab === id
                    ? "#fff"
                    : "#475569",
                padding: "0 12px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <main
          style={{
            overflowY: "auto",
            padding: 18,
          }}
        >
          {tab === "GENERAL" ? (
            <GeneralTab
              plan={plan}
              onChange={onChange}
            />
          ) : null}

          {tab === "CONTENT" ? (
            <ContentTab
              content={content}
              updateContent={updateContent}
            />
          ) : null}

          {tab === "SCENARIOS" ? (
            <ScenarioTab
              content={content}
              updateContent={updateContent}
            />
          ) : null}

          {tab === "CONTACTS" ? (
            <EditableList
              items={content.contacts}
              fields={[
                "title",
                "phone",
                "note",
              ]}
              labels={[
                "Kurum / Kişi",
                "Telefon",
                "Not",
              ]}
              emptyItem={{
                title: "",
                phone: "",
                note: "",
              }}
              onChange={(items) =>
                updateContent({
                  contacts: items,
                })
              }
            />
          ) : null}

          {tab === "AREAS" ? (
            <EditableList
              items={
                content.assemblyAreas
              }
              fields={[
                "name",
                "location",
                "capacity",
                "responsible",
                "note",
              ]}
              labels={[
                "Alan Adı",
                "Konum",
                "Kapasite",
                "Sorumlu",
                "Not",
              ]}
              emptyItem={{
                name: "",
                location: "",
                capacity: 0,
                responsible: "",
                note: "",
              }}
              onChange={(items) =>
                updateContent({
                  assemblyAreas: items,
                })
              }
            />
          ) : null}

          {tab === "EQUIPMENT" ? (
  <EditableList<EmergencyEquipment>
    items={content.equipment}
    fields={[
      "name",
      "location",
      "quantity",
      "lastControlDate",
      "nextControlDate",
      "status",
    ]}
    labels={[
      "Ekipman",
      "Konum",
      "Adet",
      "Son Kontrol",
      "Sonraki Kontrol",
      "Durum",
    ]}
    emptyItem={{
      name: "",
      location: "",
      quantity: 0,
      lastControlDate: "",
      nextControlDate: "",
      status: "UYGUN",
    }}
    onChange={(items) =>
      updateContent({
        equipment: items,
      })
    }
  />
) : null}

          {tab === "SKETCHES" ? (
            <SketchTab
              content={content}
              updateContent={updateContent}
            />
          ) : null}

          {tab === "REVISIONS" ? (
            <EditableList
              items={
                content.revisionHistory
              }
              fields={[
                "revisionNo",
                "revisionDate",
                "changeReason",
                "preparedBy",
                "approvedBy",
              ]}
              labels={[
                "Revizyon",
                "Tarih",
                "Değişiklik Nedeni",
                "Hazırlayan",
                "Onaylayan",
              ]}
              emptyItem={{
                revisionNo: "",
                revisionDate: "",
                changeReason: "",
                preparedBy: "",
                approvedBy: "",
              }}
              onChange={(items) =>
                updateContent({
                  revisionHistory: items,
                })
              }
            />
          ) : null}

          {tab === "APPROVALS" ? (
            <ApprovalTab
              content={content}
              updateContent={updateContent}
            />
          ) : null}
        </main>

        <footer
          style={{
            padding: 14,
            borderTop:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 9,
          }}
        >
          <button
            type="button"
            onClick={() =>
              printEmergencyPlan({
                companyName:
                  plan.workplaceTitle ||
                  "",
                planTitle:
                  plan.planTitle ||
                  "Acil Durum Eylem Planı",
                planNo:
                  plan.planNo || "",
                revisionNo:
                  plan.revisionNo || "R0",
                planDate: new Date(
                  plan.planDateMillis ||
                    Date.now()
                ).toLocaleDateString(
                  "tr-TR"
                ),
                validUntil:
                  plan.validUntilMillis
                    ? new Date(
                        plan.validUntilMillis
                      ).toLocaleDateString(
                        "tr-TR"
                      )
                    : "-",
                dangerClass:
                  plan.dangerClass || "",
                employeeCount: Number(
                  plan.employeeCount || 0
                ),
                workplaceAddress:
                  plan.workplaceAddress ||
                  "",
                content,
              })
            }
            style={{
              minHeight: 43,
              borderRadius: 11,
              border:
                "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "0 14px",
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
            }}
          >
            <FileText size={16} />
            PDF Önizle
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 43,
              borderRadius: 11,
              border:
                "1px solid #dbe3ec",
              background: "#fff",
              padding: "0 14px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            İptal
          </button>

          <button
            type="button"
            onClick={() =>
              void onSave()
            }
            style={{
              minHeight: 43,
              borderRadius: 11,
              border: 0,
              background: "#7f1d1d",
              color: "#fff",
              padding: "0 16px",
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
            }}
          >
            <Save size={16} />
            Planı Kaydet
          </button>
        </footer>
      </section>
    </div>
  );
}

function GeneralTab({
  plan,
  onChange,
}: {
  plan: ExtendedPlan;
  onChange: Props["onChange"];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {[
        [
          "Plan Başlığı",
          "planTitle",
          plan.planTitle || "",
        ],
        [
          "Plan No",
          "planNo",
          plan.planNo || "",
        ],
        [
          "İşyeri",
          "workplaceTitle",
          plan.workplaceTitle || "",
        ],
        [
          "Adres",
          "workplaceAddress",
          plan.workplaceAddress || "",
        ],
        [
          "Revizyon No",
          "revisionNo",
          plan.revisionNo || "R0",
        ],
        [
          "Çalışan Sayısı",
          "employeeCount",
          plan.employeeCount || 0,
        ],
        [
          "Acil Durum Koordinatörü",
          "emergencyCoordinator",
          plan.emergencyCoordinator || "",
        ],
        [
          "Toplanma Alanı",
          "assemblyArea",
          plan.assemblyArea || "",
        ],
      ].map(([label, field, value]) => (
        <label
          key={String(field)}
          style={labelStyle}
        >
          <span style={labelText}>
            {label}
          </span>

          <input
            type={
              field === "employeeCount"
                ? "number"
                : "text"
            }
            value={String(value)}
            onChange={(event) =>
              onChange(
                field as keyof EmergencyPlan,
                field === "employeeCount"
                  ? Number(
                      event.target.value
                    )
                  : event.target.value
              )
            }
            style={inputStyle}
          />
        </label>
      ))}

      <label style={labelStyle}>
        <span style={labelText}>
          Tehlike Sınıfı
        </span>

        <select
          value={
            plan.dangerClass ||
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
        <span style={labelText}>
          Plan Tarihi
        </span>

        <input
          type="date"
          value={new Date(
            plan.planDateMillis ||
              Date.now()
          )
            .toISOString()
            .slice(0, 10)}
          onChange={(event) =>
            onChange(
              "planDateMillis",
              new Date(
                `${event.target.value}T00:00:00`
              ).getTime()
            )
          }
          style={inputStyle}
        />
      </label>
    </div>
  );
}

function ContentTab({
  content,
  updateContent,
}: {
  content: EmergencyPlanContent;
  updateContent: (
    patch: Partial<EmergencyPlanContent>
  ) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {[
        ["Amaç", "purpose"],
        ["Kapsam", "scope"],
        ["Yasal Dayanak", "legalBasis"],
        ["Tanımlar", "definitions"],
        [
          "Görev ve Sorumluluklar",
          "responsibilities",
        ],
        [
          "Alarm ve Haberleşme",
          "alarmAndCommunication",
        ],
        [
          "Tahliye Esasları",
          "evacuationPrinciples",
        ],
        ["Özel Gruplar", "specialGroups"],
        [
          "Acil Durum Sonrası İşlemler",
          "postEmergencyActions",
        ],
      ].map(([label, field]) => (
        <label
          key={field}
          style={labelStyle}
        >
          <span style={labelText}>
            {label}
          </span>

          <textarea
            value={String(
              content[
                field as keyof EmergencyPlanContent
              ] || ""
            )}
            onChange={(event) =>
              updateContent({
                [field]:
                  event.target.value,
              } as Partial<EmergencyPlanContent>)
            }
            rows={4}
            style={inputStyle}
          />
        </label>
      ))}
    </div>
  );
}

function ScenarioTab({
  content,
  updateContent,
}: {
  content: EmergencyPlanContent;
  updateContent: (
    patch: Partial<EmergencyPlanContent>
  ) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {content.scenarios.map(
        (scenario, index) => (
          <article
            key={`${scenario.title}-${index}`}
            style={{
              border:
                "1px solid #dbe3ec",
              borderRadius: 14,
              padding: 13,
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                color: "#7f1d1d",
              }}
            >
              {scenario.title}
            </h3>

            {[
              ["Başlık", "title"],
              [
                "Risk / Olay",
                "riskDescription",
              ],
              ["Alarm", "alarmMethod"],
              [
                "İlk Müdahale",
                "firstResponse",
              ],
              [
                "Tahliye",
                "evacuationMethod",
              ],
              [
                "Sorumlu Ekipler",
                "responsibleTeams",
              ],
              ["Ekipman", "equipment"],
              [
                "Dış Kurumlar",
                "externalInstitutions",
              ],
            ].map(([label, field]) => (
              <label
                key={field}
                style={{
                  ...labelStyle,
                  marginBottom: 8,
                }}
              >
                <span style={labelText}>
                  {label}
                </span>

                <textarea
                  value={String(
                    scenario[
                      field as keyof typeof scenario
                    ] || ""
                  )}
                  onChange={(event) => {
                    const scenarios = [
                      ...content.scenarios,
                    ];

                    scenarios[index] = {
                      ...scenario,
                      [field]:
                        event.target.value,
                    };

                    updateContent({
                      scenarios,
                    });
                  }}
                  rows={2}
                  style={inputStyle}
                />
              </label>
            ))}
          </article>
        )
      )}
    </div>
  );
}

function SketchTab({
  content,
  updateContent,
}: {
  content: EmergencyPlanContent;
  updateContent: (
    patch: Partial<EmergencyPlanContent>
  ) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <label style={labelStyle}>
        <span style={labelText}>
          Tahliye Krokisi Görsel URL
        </span>

        <input
          value={
            content.evacuationSketchUrl
          }
          onChange={(event) =>
            updateContent({
              evacuationSketchUrl:
                event.target.value,
            })
          }
          placeholder="https://..."
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        <span style={labelText}>
          Toplanma Alanı Krokisi
          Görsel URL
        </span>

        <input
          value={
            content.assemblyAreaSketchUrl
          }
          onChange={(event) =>
            updateContent({
              assemblyAreaSketchUrl:
                event.target.value,
            })
          }
          placeholder="https://..."
          style={inputStyle}
        />
      </label>
    </div>
  );
}

function ApprovalTab({
  content,
  updateContent,
}: {
  content: EmergencyPlanContent;
  updateContent: (
    patch: Partial<EmergencyPlanContent>
  ) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {[
        ["Hazırlayan", "preparedBy"],
        ["Kontrol Eden", "checkedBy"],
        [
          "İSG Uzmanı",
          "occupationalSafetyExpert",
        ],
        [
          "İşyeri Hekimi",
          "workplacePhysician",
        ],
        [
          "İşveren / Onaylayan",
          "approvedBy",
        ],
      ].map(([label, field]) => (
        <label
          key={field}
          style={labelStyle}
        >
          <span style={labelText}>
            {label}
          </span>

          <input
            value={
              content.approvals[
                field as keyof typeof content.approvals
              ]
            }
            onChange={(event) =>
              updateContent({
                approvals: {
                  ...content.approvals,
                  [field]:
                    event.target.value,
                },
              })
            }
            style={inputStyle}
          />
        </label>
      ))}
    </div>
  );
}

function EditableList<
  T extends Record<string, unknown>
>({
  items,
  fields,
  labels,
  emptyItem,
  onChange,
}: {
  items: T[];
  fields: string[];
  labels: string[];
  emptyItem: T;
  onChange: (items: T[]) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      {items.map((item, index) => (
        <article
          key={index}
          style={{
            border:
              "1px solid #dbe3ec",
            borderRadius: 13,
            padding: 12,
          }}
        >
          {fields.map(
            (field, fieldIndex) => (
              <label
                key={field}
                style={{
                  ...labelStyle,
                  marginBottom: 8,
                }}
              >
                <span style={labelText}>
                  {labels[fieldIndex]}
                </span>

                <input
                  type={
                    field
                      .toLowerCase()
                      .includes("date")
                      ? "date"
                      : field ===
                          "quantity" ||
                        field ===
                          "capacity"
                      ? "number"
                      : "text"
                  }
                  value={String(
                    item[field] ?? ""
                  )}
                  onChange={(event) => {
                    const next = [
                      ...items,
                    ];

                    next[index] = {
                      ...item,
                      [field]:
                        field ===
                          "quantity" ||
                        field ===
                          "capacity"
                          ? Number(
                              event.target
                                .value
                            )
                          : event.target
                              .value,
                    };

                    onChange(next);
                  }}
                  style={inputStyle}
                />
              </label>
            )
          )}

          <button
            type="button"
            onClick={() =>
              onChange(
                items.filter(
                  (_, itemIndex) =>
                    itemIndex !== index
                )
              )
            }
            style={{
              minHeight: 34,
              borderRadius: 9,
              border:
                "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              padding: "0 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} />
            Sil
          </button>
        </article>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            { ...emptyItem },
          ])
        }
        style={{
          minHeight: 40,
          borderRadius: 10,
          border:
            "1px dashed #94a3b8",
          background: "#f8fafc",
          color: "#475569",
          fontWeight: 850,
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 7,
          cursor: "pointer",
        }}
      >
        <Plus size={15} />
        Yeni Satır
      </button>
    </div>
  );
}