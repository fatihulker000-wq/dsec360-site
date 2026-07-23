"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import type {
  EmergencyEquipment,
  EmergencyPlan,
  EmergencyPlanContent,
  EmergencySupportMember,
} from "../../../../lib/emergency/types";

import {
  DEFAULT_EMERGENCY_PLAN_CONTENT,
} from "./emergencyPlanTemplate";

import {
  printEmergencyPlan,
} from "./emergencyPlanReport";

import EmergencyTeamCards from "./EmergencyTeamCards";

import {
  printEmergencyTeamTables,
} from "./emergencyTeamReport";

type ExtendedPlan =
  Partial<EmergencyPlan>;

type Props = {
  open: boolean;
  plan: ExtendedPlan;

  onClose: () => void;

  onSave:
    () => void | Promise<void>;

  onChange: (
    field: keyof EmergencyPlan,
    value: unknown
  ) => void;

  teams?: EmergencySupportMember[];
};

type Tab =
  | "GENERAL"
  | "CONTENT"
  | "SCENARIOS"
  | "CONTACTS"
  | "AREAS"
  | "EQUIPMENT"
  | "TEAMS"
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

const labelStyle = {
  display: "grid",
  gap: 6,
};

const labelText = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 850,
};

function cloneDefault():
  EmergencyPlanContent {
  return JSON.parse(
    JSON.stringify(
      DEFAULT_EMERGENCY_PLAN_CONTENT
    )
  ) as EmergencyPlanContent;
}

export default function ActionPlanDialog({
  open,
  plan,
  onClose,
  onSave,
  onChange,
  teams = [],
}: Props) {
  const [tab, setTab] =
    useState<Tab>("GENERAL");

  const content = useMemo(
    () =>
      plan.planContent ||
      cloneDefault(),
    [plan.planContent]
  );

  useEffect(() => {
    if (!open) return;

    setTab("GENERAL");

    if (!plan.planContent) {
      onChange(
        "planContent",
        cloneDefault()
      );
    }

    if (!plan.planNo) {
      onChange(
        "planNo",
        `ADP-${new Date().getFullYear()}-${String(
          Date.now()
        ).slice(-6)}`
      );
    }
  }, [
    open,
    plan.id,
    plan.planContent,
    plan.planNo,
    onChange,
  ]);

  if (!open) return null;

  const updateContent = (
    patch:
      Partial<EmergencyPlanContent>
  ) => {
    onChange("planContent", {
      ...content,
      ...patch,
    });
  };

  const tabs:
    Array<[Tab, string]> = [
      ["GENERAL", "Genel"],
      ["CONTENT", "Plan İçeriği"],
      ["SCENARIOS", "Senaryolar"],
      ["CONTACTS", "Acil İletişim"],
      ["AREAS", "Toplanma Alanı"],
      ["EQUIPMENT", "Ekipman"],
      ["TEAMS", "Ekip Tabloları"],
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
          width:
            "min(1220px,100%)",
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
            gap: 12,
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
              Plan, senaryolar,
              destek ekipleri,
              krokiler, revizyonlar
              ve PDF çıktısı.
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
              background: "#f1f5f9",
              color: "#475569",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
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
          {tabs.map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setTab(id)
                }
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
            )
          )}
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
              updateContent={
                updateContent
              }
            />
          ) : null}

          {tab === "SCENARIOS" ? (
            <ScenarioTab
              content={content}
              updateContent={
                updateContent
              }
            />
          ) : null}

          {tab === "CONTACTS" ? (
            <EditableList<
              EmergencyPlanContent["contacts"][number]
            >
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
            <EditableList<
              EmergencyPlanContent["assemblyAreas"][number]
            >
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
                  assemblyAreas:
                    items,
                })
              }
            />
          ) : null}

          {tab === "EQUIPMENT" ? (
            <EditableList<
              EmergencyEquipment
            >
              items={
                content.equipment
              }
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

          {tab === "TEAMS" ? (
            <EmergencyTeamCards
              teams={teams}
              companyName={
                plan.workplaceTitle ||
                ""
              }
              planNo={
                plan.planNo || ""
              }
              revisionNo={
                plan.revisionNo ||
                "R0"
              }
              onPrint={() =>
                printEmergencyTeamTables(
                  teams,
                  plan.workplaceTitle ||
                    "",
                  plan.planNo || "",
                  plan.revisionNo ||
                    "R0"
                )
              }
            />
          ) : null}

          {tab === "SKETCHES" ? (
            <SketchTab
              content={content}
              updateContent={
                updateContent
              }
            />
          ) : null}

          {tab === "REVISIONS" ? (
            <EditableList<
              EmergencyPlanContent["revisionHistory"][number]
            >
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
                  revisionHistory:
                    items,
                })
              }
            />
          ) : null}

          {tab === "APPROVALS" ? (
            <ApprovalTab
              content={content}
              updateContent={
                updateContent
              }
            />
          ) : null}
        </main>

        <footer
          style={{
            padding: 14,
            borderTop:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "flex-end",
            gap: 9,
            flexWrap: "wrap",
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
                  plan.revisionNo ||
                  "R0",

                planDate:
                  new Date(
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
                  plan.dangerClass ||
                  "",

                employeeCount:
                  Number(
                    plan.employeeCount ||
                      0
                  ),

                workplaceAddress:
                  plan.workplaceAddress ||
                  "",

                content,
                teams,
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
              color: "#475569",
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

      <style jsx>{`
        @media (max-width: 760px) {
          footer {
            justify-content: stretch;
          }

          footer button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
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
  const fields: Array<{
    label: string;
    field: keyof EmergencyPlan;
    value: string | number;
    type?: "text" | "number";
  }> = [
    {
      label: "Plan Başlığı",
      field: "planTitle",
      value:
        plan.planTitle || "",
    },
    {
      label: "Plan No",
      field: "planNo",
      value:
        plan.planNo || "",
    },
    {
      label: "İşyeri",
      field: "workplaceTitle",
      value:
        plan.workplaceTitle ||
        "",
    },
    {
      label: "Adres",
      field: "workplaceAddress",
      value:
        plan.workplaceAddress ||
        "",
    },
    {
      label: "Revizyon No",
      field: "revisionNo",
      value:
        plan.revisionNo || "R0",
    },
    {
      label: "Çalışan Sayısı",
      field: "employeeCount",
      value:
        plan.employeeCount || 0,
      type: "number",
    },
    {
      label:
        "Acil Durum Koordinatörü",
      field:
        "emergencyCoordinator",
      value:
        plan.emergencyCoordinator ||
        "",
    },
    {
      label: "Toplanma Alanı",
      field: "assemblyArea",
      value:
        plan.assemblyArea || "",
    },
  ];

  return (
    <div
      className="generalGrid"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {fields.map((item) => (
        <label
          key={item.field}
          style={labelStyle}
        >
          <span style={labelText}>
            {item.label}
          </span>

          <input
            type={
              item.type || "text"
            }
            value={item.value}
            onChange={(event) =>
              onChange(
                item.field,
                item.type === "number"
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
              event.target.value
                ? new Date(
                    `${event.target.value}T00:00:00`
                  ).getTime()
                : Date.now()
            )
          }
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        <span style={labelText}>
          Geçerlilik Tarihi
        </span>

        <input
          type="date"
          value={
            plan.validUntilMillis
              ? new Date(
                  plan.validUntilMillis
                )
                  .toISOString()
                  .slice(0, 10)
              : ""
          }
          onChange={(event) =>
            onChange(
              "validUntilMillis",
              event.target.value
                ? new Date(
                    `${event.target.value}T00:00:00`
                  ).getTime()
                : null
            )
          }
          style={inputStyle}
        />
      </label>

      <style jsx>{`
        @media (max-width: 760px) {
          .generalGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function ContentTab({
  content,
  updateContent,
}: {
  content:
    EmergencyPlanContent;

  updateContent: (
    patch:
      Partial<EmergencyPlanContent>
  ) => void;
}) {
  const fields: Array<{
    label: string;
    field:
      | "purpose"
      | "scope"
      | "legalBasis"
      | "definitions"
      | "responsibilities"
      | "alarmAndCommunication"
      | "evacuationPrinciples"
      | "specialGroups"
      | "postEmergencyActions";
  }> = [
    {
      label: "Amaç",
      field: "purpose",
    },
    {
      label: "Kapsam",
      field: "scope",
    },
    {
      label: "Yasal Dayanak",
      field: "legalBasis",
    },
    {
      label: "Tanımlar",
      field: "definitions",
    },
    {
      label:
        "Görev ve Sorumluluklar",
      field:
        "responsibilities",
    },
    {
      label:
        "Alarm ve Haberleşme",
      field:
        "alarmAndCommunication",
    },
    {
      label:
        "Tahliye Esasları",
      field:
        "evacuationPrinciples",
    },
    {
      label: "Özel Gruplar",
      field: "specialGroups",
    },
    {
      label:
        "Acil Durum Sonrası İşlemler",
      field:
        "postEmergencyActions",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {fields.map((item) => (
        <label
          key={item.field}
          style={labelStyle}
        >
          <span style={labelText}>
            {item.label}
          </span>

          <textarea
            value={
              content[item.field]
            }
            onChange={(event) =>
              updateContent({
                [item.field]:
                  event.target.value,
              })
            }
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
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
  content:
    EmergencyPlanContent;

  updateContent: (
    patch:
      Partial<EmergencyPlanContent>
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

            {(
              [
                [
                  "Başlık",
                  "title",
                ],
                [
                  "Risk / Olay",
                  "riskDescription",
                ],
                [
                  "Alarm",
                  "alarmMethod",
                ],
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
                [
                  "Ekipman",
                  "equipment",
                ],
                [
                  "Dış Kurumlar",
                  "externalInstitutions",
                ],
              ] as const
            ).map(
              ([label, field]) => (
                <label
                  key={field}
                  style={{
                    ...labelStyle,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={
                      labelText
                    }
                  >
                    {label}
                  </span>

                  <textarea
                    value={
                      scenario[field]
                    }
                    onChange={(
                      event
                    ) => {
                      const scenarios =
                        [
                          ...content.scenarios,
                        ];

                      scenarios[index] =
                        {
                          ...scenario,
                          [field]:
                            event
                              .target
                              .value,
                        };

                      updateContent({
                        scenarios,
                      });
                    }}
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize:
                        "vertical",
                    }}
                  />
                </label>
              )
            )}
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
  content:
    EmergencyPlanContent;

  updateContent: (
    patch:
      Partial<EmergencyPlanContent>
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

        {content.evacuationSketchUrl ? (
          <img
            src={
              content.evacuationSketchUrl
            }
            alt="Tahliye krokisi"
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              border:
                "1px solid #dbe3ec",
              borderRadius: 12,
              marginTop: 6,
            }}
          />
        ) : null}
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

        {content
          .assemblyAreaSketchUrl ? (
          <img
            src={
              content.assemblyAreaSketchUrl
            }
            alt="Toplanma alanı krokisi"
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              border:
                "1px solid #dbe3ec",
              borderRadius: 12,
              marginTop: 6,
            }}
          />
        ) : null}
      </label>
    </div>
  );
}

function ApprovalTab({
  content,
  updateContent,
}: {
  content:
    EmergencyPlanContent;

  updateContent: (
    patch:
      Partial<EmergencyPlanContent>
  ) => void;
}) {
  const fields =
    [
      [
        "Hazırlayan",
        "preparedBy",
      ],
      [
        "Kontrol Eden",
        "checkedBy",
      ],
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
    ] as const;

  return (
    <div
      className="approvalGrid"
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: 12,
      }}
    >
      {fields.map(
        ([label, field]) => (
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
                  field
                ]
              }
              onChange={(event) =>
                updateContent({
                  approvals: {
                    ...content.approvals,
                    [field]:
                      event.target
                        .value,
                  },
                })
              }
              style={inputStyle}
            />
          </label>
        )
      )}

      <style jsx>{`
        @media (max-width: 760px) {
          .approvalGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function EditableList<
  T extends object
>({
  items,
  fields,
  labels,
  emptyItem,
  onChange,
}: {
  items: T[];
  fields: Array<keyof T>;
  labels: string[];
  emptyItem: T;
  onChange: (items: T[]) => void;
}) {
  const changeItem = (
    index: number,
    field: keyof T,
    rawValue: string
  ) => {
    const fieldName =
      String(field);

    let value: unknown =
      rawValue;

    if (
      fieldName ===
        "quantity" ||
      fieldName ===
        "capacity"
    ) {
      value = Number(rawValue);
    }

    if (
      fieldName === "status"
    ) {
      value = rawValue as
        | "UYGUN"
        | "BAKIM_GEREKLI"
        | "EKSIK";
    }

    const next = [...items];

    next[index] = {
      ...items[index],
      [field]: value,
    } as T;

    onChange(next);
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      {items.map(
        (item, index) => (
          <article
            key={index}
            style={{
              border:
                "1px solid #dbe3ec",
              borderRadius: 13,
              padding: 12,
            }}
          >
            <div
              className="editableGrid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 10,
              }}
            >
              {fields.map(
                (
                  field,
                  fieldIndex
                ) => {
                  const fieldName =
                    String(field);

                  const value =
                    String(
                      item[field] ??
                        ""
                    );

                  return (
                    <label
                      key={fieldName}
                      style={
                        labelStyle
                      }
                    >
                      <span
                        style={
                          labelText
                        }
                      >
                        {
                          labels[
                            fieldIndex
                          ]
                        }
                      </span>

                      {fieldName ===
                      "status" ? (
                        <select
                          value={
                            value ||
                            "UYGUN"
                          }
                          onChange={(
                            event
                          ) =>
                            changeItem(
                              index,
                              field,
                              event
                                .target
                                .value
                            )
                          }
                          style={
                            inputStyle
                          }
                        >
                          <option value="UYGUN">
                            Uygun
                          </option>

                          <option value="BAKIM_GEREKLI">
                            Bakım
                            Gerekli
                          </option>

                          <option value="EKSIK">
                            Eksik
                          </option>
                        </select>
                      ) : (
                        <input
                          type={
                            fieldName
                              .toLowerCase()
                              .includes(
                                "date"
                              )
                              ? "date"
                              : fieldName ===
                                    "quantity" ||
                                  fieldName ===
                                    "capacity"
                              ? "number"
                              : "text"
                          }
                          value={value}
                          onChange={(
                            event
                          ) =>
                            changeItem(
                              index,
                              field,
                              event
                                .target
                                .value
                            )
                          }
                          style={
                            inputStyle
                          }
                        />
                      )}
                    </label>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onChange(
                  items.filter(
                    (
                      _,
                      itemIndex
                    ) =>
                      itemIndex !==
                      index
                  )
                )
              }
              style={{
                marginTop: 10,
                minHeight: 34,
                borderRadius: 9,
                border:
                  "1px solid #fecaca",
                background:
                  "#fef2f2",
                color: "#b91c1c",
                padding:
                  "0 10px",
                display:
                  "inline-flex",
                alignItems:
                  "center",
                gap: 6,
                cursor:
                  "pointer",
              }}
            >
              <Trash2 size={14} />
              Sil
            </button>
          </article>
        )
      )}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              ...emptyItem,
            },
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
          justifyContent:
            "center",
          alignItems: "center",
          gap: 7,
          cursor: "pointer",
        }}
      >
        <Plus size={15} />
        Yeni Satır
      </button>

      <style jsx>{`
        @media (max-width: 760px) {
          .editableGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </div>
  );
}