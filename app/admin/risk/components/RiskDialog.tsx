"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronRight,
  Loader2,
  Save,
  X,
} from "lucide-react";

import type {
  RiskLevel,
  RiskMethod,
} from "../types";

import RiskGeneralTab from "./RiskGeneralTab";
import RiskAnalysisTab from "./RiskAnalysisTab";
import RiskControlsTab from "./RiskControlsTab";
import RiskDofTab from "./RiskDofTab";
import RiskSummaryPanel from "./RiskSummaryPanel";

export type RiskFormState = {
  id?: string;
  firmId: string;
  company: string;
  department: string;
  process: string;
  activity: string;
  hazard: string;
  consequence: string;
  existingControl: string;
  proposedControl: string;
  responsible: string;
  dueDateMillis: number | null;
  completed: boolean;
  probability: number;
  frequency: number;
  severity: number;
  score: number;
  method: RiskMethod;
  level: RiskLevel;
  photoUrl: string | null;
  attachmentUrl: string | null;
};

type TabId =
  | "GENERAL"
  | "ANALYSIS"
  | "CONTROLS"
  | "DOF";

type Props = {
  open: boolean;
  form: RiskFormState;
  saving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (
    form: RiskFormState
  ) => void | Promise<void>;
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "GENERAL", label: "Genel Bilgiler" },
  { id: "ANALYSIS", label: "Risk Analizi" },
  { id: "CONTROLS", label: "Kontroller" },
  { id: "DOF", label: "DÖF ve Termin" },
];

function calculateLevel(
  score: number,
  method: RiskMethod
): RiskLevel {
  if (method === "MATRIX_5X5") {
    if (score <= 6) return "LOW";
    if (score <= 12) return "MEDIUM";
    if (score <= 16) return "HIGH";
    if (score <= 20) return "VERY_HIGH";
    return "INTOLERABLE";
  }

  if (score < 20) return "LOW";
  if (score < 70) return "MEDIUM";
  if (score < 200) return "HIGH";
  if (score < 400) return "VERY_HIGH";
  return "INTOLERABLE";
}

function calculateScore(
  method: RiskMethod,
  probability: number,
  frequency: number,
  severity: number
) {
  const result =
    method === "FINE_KINNEY"
      ? probability * frequency * severity
      : probability * severity;

  return Math.round(result * 100) / 100;
}

function suggestedDays(score: number) {
  if (score >= 400) return 0;
  if (score >= 200) return 7;
  if (score >= 70) return 30;
  if (score >= 20) return 90;
  return 180;
}

export default function RiskDialog({
  open,
  form,
  saving,
  onClose,
  onSave,
}: Props) {
  const [tab, setTab] = useState<TabId>("GENERAL");
  const [draft, setDraft] = useState<RiskFormState>(form);

  // Uncontrolled input/textarea değerlerini senkron tutar.
  // Böylece Kaydet'e basıldığında React state güncellemesini beklemeyiz.
  const draftRef = useRef<RiskFormState>(form);

  useEffect(() => {
    if (!open) return;

    draftRef.current = form;
    setDraft(form);
    setTab("GENERAL");
  }, [open, form]);

  const commitField = useCallback(
    <K extends keyof RiskFormState>(
      field: K,
      value: RiskFormState[K]
    ) => {
      // Ref senkron güncellenir; kaydetme her zaman son değeri görür.
      draftRef.current = {
        ...draftRef.current,
        [field]: value,
      };

      setDraft(draftRef.current);
    },
    []
  );

  const updateScoreField = useCallback(
    (
      field: "probability" | "frequency" | "severity",
      value: number
    ) => {
      const next = {
        ...draftRef.current,
        [field]: value,
      };

      next.score = calculateScore(
        next.method,
        next.probability,
        next.frequency,
        next.severity
      );

      next.level = calculateLevel(next.score, next.method);

      draftRef.current = next;
      setDraft(next);
    },
    []
  );

  const changeMethod = useCallback((method: RiskMethod) => {
    const next = {
      ...draftRef.current,
      method,
    };

    if (method === "MATRIX_5X5") {
      next.probability = Math.min(
        5,
        Math.max(1, next.probability)
      );
      next.frequency = 1;
      next.severity = Math.min(
        5,
        Math.max(1, next.severity)
      );
    }

    next.score = calculateScore(
      next.method,
      next.probability,
      next.frequency,
      next.severity
    );

    next.level = calculateLevel(
      next.score,
      next.method
    );

    draftRef.current = next;
    setDraft(next);
  }, []);

  if (!open) return null;

  const currentIndex = TABS.findIndex((item) => item.id === tab);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        background: "rgba(15,23,42,.64)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        style={{
          width: "min(1380px,100%)",
          maxHeight: "95vh",
          overflow: "hidden",
          borderRadius: 24,
          background: "#ffffff",
          boxShadow: "0 34px 100px rgba(15,23,42,.38)",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0,1fr) auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              {draft.id
                ? "Risk Kaydını Düzenle"
                : "Yeni Risk Değerlendirmesi"}
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Risk kaydını adım adım tamamlayın.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: 0,
              background: "#f1f5f9",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <nav
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {TABS.map((item) => {
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                style={{
                  minHeight: 39,
                  borderRadius: 11,
                  border: active
                    ? "1px solid #6b1020"
                    : "1px solid #dbe3ec",
                  background: active ? "#6b1020" : "#ffffff",
                  color: active ? "#ffffff" : "#475569",
                  padding: "0 13px",
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="riskDialogBody"
          style={{
            overflowY: "auto",
            padding: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 320px",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {tab === "GENERAL" ? (
              <RiskGeneralTab
                department={draft.department}
                process={draft.process}
                activity={draft.activity}
                responsible={draft.responsible}
                onFieldCommit={(field, value) =>
                  commitField(field, value)
                }
              />
            ) : null}

            {tab === "ANALYSIS" ? (
              <RiskAnalysisTab
                method={draft.method}
                hazard={draft.hazard}
                consequence={draft.consequence}
                probability={draft.probability}
                frequency={draft.frequency}
                severity={draft.severity}
                onMethodChange={changeMethod}
                onTextCommit={(field, value) =>
                  commitField(field, value)
                }
                onScoreChange={updateScoreField}
              />
            ) : null}

            {tab === "CONTROLS" ? (
              <RiskControlsTab
                existingControl={draft.existingControl}
                proposedControl={draft.proposedControl}
                onTextCommit={(field, value) =>
                  commitField(field, value)
                }
              />
            ) : null}

            {tab === "DOF" ? (
              <RiskDofTab
                completed={draft.completed}
                dueDateMillis={draft.dueDateMillis}
                suggestedDays={suggestedDays(draft.score)}
                onCompletedChange={(value) =>
                  commitField("completed", value)
                }
                onDueDateChange={(value) =>
                  commitField("dueDateMillis", value)
                }
              />
            ) : null}
          </div>

          <RiskSummaryPanel
            method={draft.method}
            probability={draft.probability}
            frequency={draft.frequency}
            severity={draft.severity}
            score={draft.score}
            level={draft.level}
            legislation={[]}
          />
        </div>

        <footer
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              if (currentIndex > 0) {
                setTab(TABS[currentIndex - 1].id);
              }
            }}
            style={{
              minHeight: 42,
              borderRadius: 11,
              border: "1px solid #dbe3ec",
              background: "#ffffff",
              padding: "0 14px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Önceki
          </button>

          <div style={{ display: "flex", gap: 9 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                minHeight: 42,
                borderRadius: 11,
                border: "1px solid #dbe3ec",
                background: "#ffffff",
                padding: "0 14px",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              İptal
            </button>

            {tab !== "DOF" ? (
              <button
                type="button"
                onClick={() =>
                  setTab(TABS[currentIndex + 1].id)
                }
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: 0,
                  background: "#334155",
                  color: "#ffffff",
                  padding: "0 15px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Sonraki
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void onSave(draftRef.current)
                }
                disabled={saving}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: 0,
                  background: "#6b1020",
                  color: "#ffffff",
                  padding: "0 17px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? (
                  <Loader2 size={16} className="riskSpin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Kaydediliyor" : "Riski Kaydet"}
              </button>
            )}
          </div>
        </footer>

        <style jsx>{`
          .riskSpin {
            animation: risk-spin .9s linear infinite;
          }

          @keyframes risk-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 980px) {
            .riskDialogBody {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}