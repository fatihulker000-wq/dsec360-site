"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import InvestigationCenter from "@/components/incident-v2/investigation-v2/InvestigationCenter";

import type {
  IncidentOption,
} from "@/components/incident-v2/investigation-v2/InvestigationTypes";

import { IncidentAnalyticsCenter } from "@/components/incident-v2/analytics";

import type { IncidentAnalyticsRecord } from "@/components/incident-v2/analytics";

import { WorkflowCenter } from "@/components/incident-v2/workflow";
import { SgkCenter } from "@/components/incident-v2/sgk";
import { IbysCenter } from "@/components/incident-v2/ibys";
import { IncidentAuditCenter } from "@/components/incident-v2/audit";

const WorkflowCenterView = WorkflowCenter as ComponentType<any>;
const SgkCenterView = SgkCenter as ComponentType<any>;
const IbysCenterView = IbysCenter as ComponentType<any>;
const IncidentAuditCenterView = IncidentAuditCenter as ComponentType<any>;

type AccidentRow = {
  id: number;
  title?: string | null;
  employeeName?: string | null;
  eventType?: string | null;
  location?: string | null;
  severity?: number | null;
  eventDate?: number | null;
  createdAt?: number | null;
  lostWorkDays?: number | null;
  department?: string | null;
  shift?: string | null;
  injuryBodyPart?: string | null;
  injuryType?: string | null;
  rootCauseCategory?: string | null;
  eventHour?: number | null;
  eventWeekDay?: string | null;
  description?: string | null;
  source?: string | null;
  firmId?: number | string | null;
};

type CompanyRow = {
  id: number | string;
  firm_id?: number | string | null;
  local_firm_id?: number | string | null;
  app_record_id?: number | string | null;
  name?: string | null;
  title?: string | null;
  company_name?: string | null;
  localId?: number | string | null;
};

type AccidentPageTab =
  | "OVERVIEW"
  | "RECORDS"
  | "ANALYTICS"
  | "INVESTIGATION"
  | "WORKFLOW"
  | "SGK"
  | "IBYS"
  | "AUDIT"
  | "REPORTS";

const BRAND = {
  redDark: "#4a0d1a",
  red: "#7a0017",
  redBright: "#b91c1c",
  bg: "#fafafa",
  text: "#111827",
  muted: "#6b7280",
  border: "#ececec",
  green: "#166534",
  amber: "#92400e",
  blue: "#1d4ed8",
};

export default function AdminAccidentsPage() {
  const [loading, setLoading] =
    useState(true);

  const [rows, setRows] =
    useState<AccidentRow[]>([]);

  const [error, setError] =
    useState("");

  const [
    selectedRow,
    setSelectedRow,
  ] = useState<AccidentRow | null>(
    null
  );

  const [editRow, setEditRow] =
    useState<AccidentRow | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [companies, setCompanies] =
    useState<CompanyRow[]>([]);

  const [
    selectedFirmId,
    setSelectedFirmId,
  ] = useState<string>("all");

  const [activeTab, setActiveTab] =
    useState<AccidentPageTab>(
      "OVERVIEW"
    );

  const [selectedIncidentId, setSelectedIncidentId] =
    useState<string>("");

  const [sgkItems, setSgkItems] =
    useState<any[]>([]);

  const [ibysItems, setIbysItems] =
    useState<any[]>([]);

  const [auditLogs, setAuditLogs] =
    useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        selectedFirmId === "all"
          ? "/api/admin/accidents"
          : `/api/admin/accidents?firmId=${encodeURIComponent(
              selectedFirmId
            )}`;

      const response = await fetch(
        url,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.error ||
            "Kaza ve olay verileri alınamadı."
        );
      }

      setRows(
        Array.isArray(json.rows)
          ? json.rows
          : []
      );
    } catch (errorValue: unknown) {
      const message =
        errorValue instanceof Error
          ? errorValue.message
          : "Bilinmeyen veri yükleme hatası.";

      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch(
        "/api/admin/companies",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      const list =
        json?.data ||
        json?.rows ||
        json?.companies ||
        [];

      const normalized: CompanyRow[] =
        (
          Array.isArray(list)
            ? list
            : []
        ).map((firm: any) => {
          const name = String(
            firm.name ||
              firm.title ||
              firm.company_name ||
              ""
          ).trim();

          return {
            id: firm.id,

            firm_id:
              firm.firm_id ??
              firm.id ??
              null,

            name,

            title:
              firm.title || null,

            company_name:
              firm.company_name ||
              null,

            local_firm_id:
              firm.local_firm_id ??
              firm.localId ??
              null,

            localId:
              firm.local_firm_id ??
              firm.localId ??
              null,

            app_record_id:
              firm.app_record_id ??
              null,
          };
        });

      setCompanies(normalized);
    } catch {
      setCompanies([]);
    }
  };

  const saveEdit = async () => {
    if (!editRow) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/accidents/update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify(editRow),
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.error ||
            "Güncelleme yapılamadı."
        );
      }

      setEditRow(null);
      setSelectedRow(null);

      await loadData();
    } catch (errorValue: unknown) {
      const message =
        errorValue instanceof Error
          ? errorValue.message
          : "Güncelleme hatası.";

      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const passiveDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Bu kayıt pasifleştirilecek. Devam edilsin mi?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        "/api/admin/accidents/delete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ id }),
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.error ||
            "Kayıt pasifleştirilemedi."
        );
      }

      setSelectedRow(null);

      await loadData();
    } catch (errorValue: unknown) {
      const message =
        errorValue instanceof Error
          ? errorValue.message
          : "Pasifleştirme hatası.";

      window.alert(message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  useEffect(() => {
    void loadData();
  }, [selectedFirmId]);

  const stats = useMemo(() => {
    const last30 =
      Date.now() -
      30 *
        24 *
        60 *
        60 *
        1000;

    const totalLostDays =
      rows.reduce(
        (sum, item) =>
          sum +
          Number(
            item.lostWorkDays || 0
          ),
        0
      );

    const departmentMap =
      new Map<string, number>();

    const rootMap =
      new Map<string, number>();

    rows.forEach((item) => {
      const department =
        item.department?.trim() ||
        "Belirtilmemiş";

      const rootCause =
        item.rootCauseCategory?.trim() ||
        "Belirtilmemiş";

      departmentMap.set(
        department,
        (departmentMap.get(
          department
        ) || 0) + 1
      );

      rootMap.set(
        rootCause,
        (rootMap.get(rootCause) ||
          0) + 1
      );
    });

    const topDepartment =
      [
        ...departmentMap.entries(),
      ].sort(
        (first, second) =>
          second[1] - first[1]
      )[0]?.[0] || "-";

    const topRoot =
      [...rootMap.entries()].sort(
        (first, second) =>
          second[1] - first[1]
      )[0]?.[0] || "-";

    return {
  total: rows.length,

  accident: rows.filter(
    (item) =>
      normalizeIncidentType(item.eventType) ===
      "WORK_ACCIDENT"
  ).length,

  nearMiss: rows.filter(
    (item) =>
      normalizeIncidentType(item.eventType) ===
      "NEAR_MISS"
  ).length,

  danger: rows.filter(
    (item) =>
      normalizeIncidentType(item.eventType) ===
      "UNSAFE_CONDITION"
  ).length,

  eventNotice: rows.filter(
    (item) =>
      normalizeIncidentType(item.eventType) ===
      "EVENT_NOTIFICATION"
  ).length,

  totalLostDays,

  last30Count: rows.filter(
    (item) =>
      normalizeTimestamp(
        item.eventDate || item.createdAt
      ) >= last30
  ).length,

  topDepartment,

  topRoot,
};
  }, [rows]);

  const departmentRows =
    useMemo(
      () =>
        groupRows(
          rows,
          "department"
        ),
      [rows]
    );

  const rootRows =
    useMemo(
      () =>
        groupRows(
          rows,
          "rootCauseCategory"
        ),
      [rows]
    );

  const analyticsRecords =
    useMemo<
      IncidentAnalyticsRecord[]
    >(() => {
      return rows.map((row) => {
        const severity =
          Number(
            row.severity || 0
          );

        const lostWorkDays =
          Number(
            row.lostWorkDays || 0
          );

        return {
          id: row.id,

          title:
            row.title ||
            `Kaza/Olay #${row.id}`,

          incidentType:
            normalizeIncidentType(
              row.eventType
            ),

          department:
            row.department?.trim() ||
            "Belirtilmemiş",

          location:
            row.location?.trim() ||
            "Belirtilmemiş",

          shift:
            row.shift?.trim() ||
            "Belirtilmemiş",

          severity,

          lostWorkDays,

          eventDate:
            normalizeTimestamp(
              row.eventDate ||
                row.createdAt ||
                Date.now()
            ),

          injuryBodyPart:
            row.injuryBodyPart?.trim() ||
            "Belirtilmemiş",

          injuryType:
            row.injuryType?.trim() ||
            "Belirtilmemiş",

          rootCauseCategory:
            row.rootCauseCategory?.trim() ||
            "Belirtilmemiş",

          status: "OPEN",

          investigationStatus:
            "OPEN",

          correctiveActionStatus:
            "OPEN",

          isFatal:
            severity >= 5,

          isLostTime:
            lostWorkDays > 0,

          isMedicalTreatment:
            Boolean(
              row.injuryType
            ),

          isRestrictedWork: false,
        };
      });
    }, [rows]);


const investigationIncidents =
  useMemo<IncidentOption[]>(() => {
    return rows.map((row) => ({
      id: String(row.id),

      incidentNo: `INC-${row.id}`,

      title:
        row.title ||
        `Kaza / Olay #${row.id}`,

      employeeName:
        row.employeeName || "",

      eventDate: row.eventDate
        ? new Date(
            normalizeTimestamp(
              row.eventDate
            )
          ).toISOString()
        : row.createdAt
        ? new Date(
            normalizeTimestamp(
              row.createdAt
            )
          ).toISOString()
        : undefined,

      department:
        row.department ||
        "Belirtilmemiş",

      location:
        row.location ||
        "Belirtilmemiş",

      severity:
        Number(row.severity || 0),

      description:
        row.description ||
        row.title ||
        "",
    }));
  }, [rows]);
  
  
    const activeIncident =
    useMemo(() => {
      const selected = rows.find(
        (row) =>
          String(row.id) === selectedIncidentId
      );

      return selected || rows[0] || null;
    }, [rows, selectedIncidentId]);

  const workflowContext =
    useMemo(() => {
      if (!activeIncident) {
        return null;
      }

      return {
        incidentId:
          String(activeIncident.id),
        incidentNo:
          `INC-${activeIncident.id}`,
        companyId:
          selectedFirmId === "all"
            ? String(
                activeIncident.firmId || "ALL"
              )
            : selectedFirmId,
        companyName:
          selectedFirmId === "all"
            ? "Tüm Firmalar"
            : companies.find((firm) => {
                const key =
                  firm.local_firm_id ||
                  firm.localId ||
                  firm.firm_id ||
                  firm.id;

                return String(key) ===
                  selectedFirmId;
              })?.name || "Seçili Firma",
        title:
          activeIncident.title ||
          `Kaza/Olay #${activeIncident.id}`,
        description:
          activeIncident.description || "",
        incidentType:
          normalizeIncidentType(
            activeIncident.eventType
          ),
        severity:
          Number(activeIncident.severity || 0),
        department:
          activeIncident.department ||
          "Belirtilmemiş",
        location:
          activeIncident.location ||
          "Belirtilmemiş",
        employeeName:
          activeIncident.employeeName || "",
        occurredAt:
          new Date(
            normalizeTimestamp(
              activeIncident.eventDate ||
                activeIncident.createdAt ||
                Date.now()
            )
          ).toISOString(),
        createdBy: "SYSTEM",
        lostWorkDays:
          Number(
            activeIncident.lostWorkDays || 0
          ),
        isFatal:
          Number(activeIncident.severity || 0) >= 5,
        isLostTime:
          Number(
            activeIncident.lostWorkDays || 0
          ) > 0,
        rootCauseCategory:
          activeIncident.rootCauseCategory || "",
      };
    }, [
      activeIncident,
      companies,
      selectedFirmId,
    ]);

  useEffect(() => {
    if (
      !selectedIncidentId &&
      rows.length > 0
    ) {
      setSelectedIncidentId(
        String(rows[0].id)
      );
    }

    const nextSgkItems = rows.map((row) => {
      const incidentDate = new Date(
        normalizeTimestamp(
          row.eventDate ||
            row.createdAt ||
            Date.now()
        )
      );

      const deadline = new Date(
        incidentDate
      );

      deadline.setDate(
        deadline.getDate() + 3
      );

      return {
        incidentId: String(row.id),
        employeeName:
          row.employeeName || "",
        tcNo: "",
        companyName:
          selectedFirmId === "all"
            ? "Firma bilgisi bekleniyor"
            : "Seçili Firma",
        incidentDate:
          incidentDate.toISOString(),
        notificationDeadline:
          deadline.toISOString(),
        lostDay:
          Number(row.lostWorkDays || 0),
        fatal:
          Number(row.severity || 0) >= 5,
        occupationalDisease:
          normalizeIncidentType(
            row.eventType
          ) === "OCCUPATIONAL_DISEASE",
        hospitalReport: false,
        status: "MISSING_INFORMATION",
        missingFields: [
          "T.C.",
          "Firma",
        ],
      };
    });

    setSgkItems(nextSgkItems);

    const nextIbysItems = rows.map((row) => {
      const date = new Date(
        normalizeTimestamp(
          row.eventDate ||
            row.createdAt ||
            Date.now()
        )
      );

      return {
        incidentId: String(row.id),
        incidentNo: `INC-${row.id}`,
        companyId:
          String(row.firmId || selectedFirmId),
        companyName:
          selectedFirmId === "all"
            ? "Firma bilgisi bekleniyor"
            : "Seçili Firma",
        workplaceSgkNo: "",
        naceCode: "",
        employeeId: "",
        employeeName:
          row.employeeName || "",
        employeeTcNo: "",
        incidentType:
          normalizeIncidentType(
            row.eventType
          ),
        incidentDate:
          date.toISOString().slice(0, 10),
        incidentTime:
          row.eventHour != null
            ? `${String(row.eventHour).padStart(
                2,
                "0"
              )}:00`
            : "00:00",
        department:
          row.department || "",
        location:
          row.location || "",
        description:
          row.description || row.title || "",
        severity:
          Number(row.severity || 0),
        lostDay:
          Number(row.lostWorkDays || 0),
        fatal:
          Number(row.severity || 0) >= 5,
        hospitalTransfer: false,
        investigationCompleted: false,
        rootCauseCompleted:
          Boolean(row.rootCauseCategory),
        correctiveActionCreated: false,
        missingFields: [],
        status: "DRAFT",
      };
    });

    setIbysItems(nextIbysItems);

    const now =
      new Date().toISOString();

    setAuditLogs(
      rows.map((row) => ({
        id: `audit-${row.id}`,
        incidentId: String(row.id),
        incidentNo: `INC-${row.id}`,
        companyId:
          String(row.firmId || selectedFirmId),
        companyName:
          selectedFirmId === "all"
            ? "Tüm Firmalar"
            : "Seçili Firma",
        action: "INCIDENT_CREATED",
        title: "Kaza/Olay kaydı görüntülendi",
        description:
          row.title ||
          `Kaza/Olay #${row.id}`,
        status: "INFO",
        severity:
          Number(row.severity || 0) >= 4
            ? "HIGH"
            : "LOW",
        userName: "SYSTEM",
        module: "INCIDENT",
        createdAt:
          row.createdAt || row.eventDate
            ? new Date(
                normalizeTimestamp(
                  row.createdAt ||
                    row.eventDate
                )
              ).toISOString()
            : now,
      }))
    );
  }, [rows, selectedFirmId]);

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: BRAND.bg,
        minHeight: "100%",
      }}
    >
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 60%, ${BRAND.redBright} 100%)`,
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            opacity: 0.85,
            marginBottom: 8,
          }}
        >
          D-SEC Kaza Merkezi
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 950,
            lineHeight: 1.1,
          }}
        >
          Kaza ve Olay Yönetimi
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 15,
            opacity: 0.92,
            maxWidth: 900,
            lineHeight: 1.7,
          }}
        >
          İş kazaları, ramak kala
          kayıtları, olay bildirimleri
          ve tehlikeli durum
          kayıtlarını merkezi olarak
          yönetin.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          padding: 8,
          borderRadius: 16,
          background: "#fff",
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <PageTabButton
          title="Genel Bakış"
          active={activeTab === "OVERVIEW"}
          onClick={() => setActiveTab("OVERVIEW")}
        />

        <PageTabButton
          title="Kayıtlar"
          active={activeTab === "RECORDS"}
          onClick={() => setActiveTab("RECORDS")}
        />

        <PageTabButton
          title="Analytics"
          active={activeTab === "ANALYTICS"}
          onClick={() => setActiveTab("ANALYTICS")}
        />

        <PageTabButton
          title="Soruşturmalar"
          active={activeTab === "INVESTIGATION"}
          onClick={() => setActiveTab("INVESTIGATION")}
        />

        <PageTabButton
          title="Workflow"
          active={activeTab === "WORKFLOW"}
          onClick={() => setActiveTab("WORKFLOW")}
        />

        <PageTabButton
          title="SGK"
          active={activeTab === "SGK"}
          onClick={() => setActiveTab("SGK")}
        />

        <PageTabButton
          title="İBYS"
          active={activeTab === "IBYS"}
          onClick={() => setActiveTab("IBYS")}
        />

        <PageTabButton
          title="Audit"
          active={activeTab === "AUDIT"}
          onClick={() => setActiveTab("AUDIT")}
        />

        <PageTabButton
          title="Raporlar"
          active={activeTab === "REPORTS"}
          onClick={() => setActiveTab("REPORTS")}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 16,
          border: `1px solid ${BRAND.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: BRAND.muted,
              fontWeight: 800,
            }}
          >
            Firma Filtresi
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 16,
              color: BRAND.text,
              fontWeight: 950,
            }}
          >
            Süper Admin kayıt görünümü
          </div>
        </div>

        <select
          value={selectedFirmId}
          onChange={(event) =>
            setSelectedFirmId(
              event.target.value
            )
          }
          style={{
            minWidth: 260,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 14,
            fontWeight: 800,
            color: BRAND.text,
            background: "#fff",
          }}
        >
          <option value="all">
            Tüm Firmalar
          </option>

          {companies.map((firm) => {
            const filterId =
              firm.local_firm_id ||
              firm.localId ||
              firm.firm_id ||
              firm.id;

            return (
              <option
                key={String(firm.id)}
                value={
                  filterId
                    ? String(filterId)
                    : ""
                }
                disabled={!filterId}
              >
                {firm.name ||
                  firm.title ||
                  firm.company_name ||
                  `Firma #${firm.id}`}

                {!filterId
                  ? " - eşleşme yok"
                  : ""}
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <div
          style={{
            padding: 24,
            borderRadius: 18,
            background: "#fff",
            border: `1px solid ${BRAND.border}`,
            fontWeight: 800,
          }}
        >
          Kaza ve olay verileri
          yükleniyor...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            background: "#fff7f7",
            border:
              "1px solid #fecaca",
            color: "#991b1b",
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      ) : activeTab === "OVERVIEW" ? (
        <IncidentOverview
          rows={rows}
          stats={stats}
          onOpenRecords={() =>
            setActiveTab("RECORDS")
          }
          onOpenAnalytics={() =>
            setActiveTab("ANALYTICS")
          }
          onOpenInvestigation={() =>
            setActiveTab("INVESTIGATION")
          }
        />
      ) : activeTab === "ANALYTICS" ? (
        <IncidentAnalyticsCenter
          incidents={analyticsRecords}
          workedHours={0}
          employeeCount={0}
        />
      ) : activeTab === "INVESTIGATION" ? (
  <InvestigationCenter
    incidents={investigationIncidents}
    initialIncidentId={
      selectedIncidentId ||
      investigationIncidents[0]?.id
    }
    onSave={(investigationFile) => {
      console.info(
        "Soruşturma dosyası kaydedildi:",
        investigationFile
      );
    }}
  />
      ) : activeTab === "WORKFLOW" ? (
        <ModuleShell
          title="Workflow Merkezi"
          description="Seçilen olay için soruşturma, risk, denetim, eğitim, DÖF, ajanda, bildirim ve İBYS adımlarını izleyin."
        >
          <IncidentSelector
            rows={rows}
            selectedIncidentId={selectedIncidentId}
            onChange={setSelectedIncidentId}
          />

          {workflowContext ? (
            <WorkflowCenterView
              context={workflowContext}
            />
          ) : (
            <EmptyModule
              text="Workflow başlatmak için bir olay kaydı seçin."
            />
          )}
        </ModuleShell>
      ) : activeTab === "SGK" ? (
        <ModuleShell
          title="SGK Bildirim Merkezi"
          description="İş kazası bildirim hazırlığı, eksik alanlar, bildirim süresi ve gönderim durumlarını yönetin."
        >
          <SgkCenterView
            items={sgkItems}
            onChange={setSgkItems}
          />
        </ModuleShell>
      ) : activeTab === "IBYS" ? (
        <ModuleShell
          title="İBYS Hazırlık Merkezi"
          description="Olay verilerini doğrulayın, eksik alanları tamamlayın ve mevcut İBYS Entegrasyon Merkezi için veri paketi hazırlayın."
        >
          <IbysCenterView
            items={ibysItems}
            onChange={setIbysItems}
            onPayloadPrepared={(payload: unknown) => {
              console.info(
                "İBYS payload hazırlandı:",
                payload
              );
            }}
          />
        </ModuleShell>
      ) : activeTab === "AUDIT" ? (
        <ModuleShell
          title="Audit ve İzlenebilirlik Merkezi"
          description="Kaza ve olay modülünde gerçekleştirilen işlemleri kullanıcı, tarih, durum ve önem düzeyine göre izleyin."
        >
          <IncidentAuditCenterView
            logs={auditLogs}
          />
        </ModuleShell>
      ) : activeTab === "REPORTS" ? (
        <IncidentReportsCenter
          rows={rows}
          analyticsRecords={analyticsRecords}
        />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(190px,1fr))",
              gap: 16,
            }}
          >
            <PremiumStatCard
              title="Toplam Kayıt"
              value={stats.total}
              subtitle="Tüm kaza ve olay kayıtları"
              accent="#111827"
              icon="Σ"
            />

            <PremiumStatCard
              title="İş Kazası"
              value={stats.accident}
              subtitle="Kayıp günlü ve kayıpsız kazalar"
              accent={BRAND.redBright}
              icon="!"
            />

            <PremiumStatCard
              title="Ramak Kala"
              value={stats.nearMiss}
              subtitle="Kazaya dönüşmeden bildirilen olaylar"
              accent={BRAND.amber}
              icon="↗"
            />

            <PremiumStatCard
              title="Tehlikeli Durum"
              value={stats.danger}
              subtitle="Sahada tespit edilen riskli durumlar"
              accent={BRAND.blue}
              icon="⚠"
            />

            <PremiumStatCard
              title="Olay Bildirimi"
              value={stats.eventNotice}
              subtitle="Genel olay ve uygunsuzluk bildirimleri"
              accent="#7c3aed"
              icon="i"
            />

            <StatCard
              title="Toplam Kayıp Gün"
              value={
                stats.totalLostDays
              }
              color={
                BRAND.redBright
              }
            />

            <StatCard
              title="Son 30 Gün"
              value={
                stats.last30Count
              }
              color={BRAND.blue}
            />

            <StatCard
              title="Riskli Departman"
              valueText={
                stats.topDepartment
              }
              color={BRAND.amber}
            />

            <StatCard
              title="Sık Kök Neden"
              valueText={
                stats.topRoot
              }
              color={BRAND.green}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(320px,1fr))",
              gap: 16,
            }}
          >
            <MiniPanel
              title="Departman Dağılımı"
              rows={departmentRows}
            />

            <MiniPanel
              title="Kök Neden Dağılımı"
              rows={rootRows}
            />
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 18,
              border: `1px solid ${BRAND.border}`,
              overflowX: "auto",
            }}
          >
            {rows.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: BRAND.muted,
                  fontWeight: 700,
                }}
              >
                Henüz kayıt
                bulunmuyor.
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 1180,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#faf5f5",
                    }}
                  >
                    <Th>Kayıt</Th>
                    <Th>Çalışan</Th>
                    <Th>Tür</Th>
                    <Th>Lokasyon</Th>
                    <Th>Şiddet</Th>
                    <Th>Tarih</Th>
                    <Th>Kayıp Gün</Th>
                    <Th>Departman</Th>
                    <Th>Vardiya</Th>
                    <Th>Yaralanma</Th>
                    <Th>Kök Neden</Th>
                    <Th>Detay</Th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom:
                          "1px solid #f1f1f1",
                      }}
                    >
                      <Td>
                        {row.title ||
                          "-"}
                      </Td>

                      <Td>
                        {row.employeeName ||
                          "-"}
                      </Td>

                      <Td>
                        <TypeBadge
                          type={
                            row.eventType ||
                            "-"
                          }
                        />
                      </Td>

                      <Td>
                        {row.location ||
                          "-"}
                      </Td>

                      <Td>
                        <SeverityBadge
                          value={Number(
                            row.severity ??
                              0
                          )}
                        />
                      </Td>

                      <Td>
                        {formatDate(
                          row.eventDate
                        )}
                      </Td>

                      <Td>
                        {row.lostWorkDays ??
                          0}
                      </Td>

                      <Td>
                        {row.department ||
                          "-"}
                      </Td>

                      <Td>
                        {row.shift || "-"}
                      </Td>

                      <Td>
                        {row.injuryType ||
                          row.injuryBodyPart ||
                          "-"}
                      </Td>

                      <Td>
                        {row.rootCauseCategory ||
                          "-"}
                      </Td>

                      <Td>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRow(
                              row
                            )
                          }
                          style={{
                            border: "none",
                            borderRadius:
                              999,
                            padding:
                              "8px 12px",
                            background:
                              BRAND.redBright,
                            color: "#fff",
                            fontWeight:
                              800,
                            cursor:
                              "pointer",
                          }}
                        >
                          Aç
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedRow ? (
            <div
              onClick={() =>
                setSelectedRow(null)
              }
              style={{
                position: "fixed",
                inset: 0,
                background:
                  "rgba(15,23,42,0.45)",
                zIndex: 9999,
                display: "grid",
                placeItems: "center",
                padding: 20,
              }}
            >
              <div
                onClick={(event) =>
                  event.stopPropagation()
                }
                style={{
                  width:
                    "min(920px, 100%)",
                  maxHeight: "90vh",
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 22,
                  padding: 22,
                  border: `1px solid ${BRAND.border}`,
                  boxShadow:
                    "0 30px 80px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 12,
                    marginBottom: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 950,
                      }}
                    >
                      {selectedRow.title ||
                        "Kaza/Olay Detayı"}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        color:
                          BRAND.muted,
                      }}
                    >
                      {selectedRow.employeeName ||
                        "-"}{" "}
                      •{" "}
                      {formatDate(
                        selectedRow.eventDate
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setEditRow(
                          selectedRow
                        )
                      }
                      style={{
                        border: "none",
                        borderRadius:
                          12,
                        padding:
                          "10px 14px",
                        background:
                          BRAND.blue,
                        color: "#fff",
                        fontWeight:
                          900,
                        cursor:
                          "pointer",
                      }}
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        passiveDelete(
                          selectedRow.id
                        )
                      }
                      disabled={deleting}
                      style={{
                        border: "none",
                        borderRadius:
                          12,
                        padding:
                          "10px 14px",
                        background:
                          "#111827",
                        color: "#fff",
                        fontWeight:
                          900,
                        cursor: deleting
                          ? "not-allowed"
                          : "pointer",
                        opacity: deleting
                          ? 0.6
                          : 1,
                      }}
                    >
                      {deleting
                        ? "İşleniyor..."
                        : "Pasifleştir"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRow(
                          null
                        )
                      }
                      style={{
                        border: "none",
                        borderRadius:
                          12,
                        padding:
                          "10px 14px",
                        background:
                          BRAND.redBright,
                        color: "#fff",
                        fontWeight:
                          900,
                        cursor:
                          "pointer",
                      }}
                    >
                      Kapat
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 12,
                  }}
                >
                  <Detail
                    label="Tür"
                    value={
                      selectedRow.eventType
                    }
                  />

                  <Detail
                    label="Lokasyon"
                    value={
                      selectedRow.location
                    }
                  />

                  <Detail
                    label="Şiddet"
                    value={String(
                      selectedRow.severity ??
                        "-"
                    )}
                  />

                  <Detail
                    label="Kayıp Gün"
                    value={String(
                      selectedRow.lostWorkDays ??
                        0
                    )}
                  />

                  <Detail
                    label="Departman"
                    value={
                      selectedRow.department
                    }
                  />

                  <Detail
                    label="Vardiya"
                    value={
                      selectedRow.shift
                    }
                  />

                  <Detail
                    label="Yaralanan Bölge"
                    value={
                      selectedRow.injuryBodyPart
                    }
                  />

                  <Detail
                    label="Yaralanma Türü"
                    value={
                      selectedRow.injuryType
                    }
                  />

                  <Detail
                    label="Kök Neden"
                    value={
                      selectedRow.rootCauseCategory
                    }
                  />

                  <Detail
                    label="Olay Saati"
                    value={
                      selectedRow.eventHour !=
                      null
                        ? `${selectedRow.eventHour}:00`
                        : "-"
                    }
                  />

                  <Detail
                    label="Haftanın Günü"
                    value={
                      selectedRow.eventWeekDay
                    }
                  />

                  <Detail
                    label="Kaynak"
                    value={
                      selectedRow.source
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color:
                        BRAND.muted,
                      marginBottom: 8,
                    }}
                  >
                    Açıklama
                  </div>

                  <div
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      lineHeight: 1.7,
                      background:
                        "#f9fafb",
                      borderRadius: 16,
                      padding: 14,
                    }}
                  >
                    {selectedRow.description ||
                      "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {editRow ? (
            <div
              onClick={() =>
                setEditRow(null)
              }
              style={{
                position: "fixed",
                inset: 0,
                background:
                  "rgba(15,23,42,0.45)",
                zIndex: 10000,
                display: "grid",
                placeItems: "center",
                padding: 20,
              }}
            >
              <div
                onClick={(event) =>
                  event.stopPropagation()
                }
                style={{
                  width:
                    "min(920px, 100%)",
                  maxHeight: "90vh",
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 22,
                  padding: 22,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 950,
                    marginBottom: 16,
                  }}
                >
                  Kaza / Olay Kaydı
                  Düzenle
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(240px,1fr))",
                    gap: 12,
                  }}
                >
                  <EditField
                    label="Başlık"
                    value={
                      editRow.title ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        title: value,
                      })
                    }
                  />

                  <EditField
                    label="Çalışan"
                    value={
                      editRow.employeeName ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        employeeName:
                          value,
                      })
                    }
                  />

                  <EditField
                    label="Tür"
                    value={
                      editRow.eventType ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        eventType: value,
                      })
                    }
                  />

                  <EditField
                    label="Lokasyon"
                    value={
                      editRow.location ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        location: value,
                      })
                    }
                  />

                  <EditField
                    label="Şiddet"
                    value={String(
                      editRow.severity ??
                        0
                    )}
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        severity:
                          Number(
                            value || 0
                          ),
                      })
                    }
                  />

                  <EditField
                    label="Kayıp Gün"
                    value={String(
                      editRow.lostWorkDays ??
                        0
                    )}
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        lostWorkDays:
                          Number(
                            value || 0
                          ),
                      })
                    }
                  />

                  <EditField
                    label="Departman"
                    value={
                      editRow.department ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        department:
                          value,
                      })
                    }
                  />

                  <EditField
                    label="Vardiya"
                    value={
                      editRow.shift ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        shift: value,
                      })
                    }
                  />

                  <EditField
                    label="Yaralanan Bölge"
                    value={
                      editRow.injuryBodyPart ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        injuryBodyPart:
                          value,
                      })
                    }
                  />

                  <EditField
                    label="Yaralanma Türü"
                    value={
                      editRow.injuryType ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        injuryType:
                          value,
                      })
                    }
                  />

                  <EditField
                    label="Kök Neden"
                    value={
                      editRow.rootCauseCategory ||
                      ""
                    }
                    onChange={(value) =>
                      setEditRow({
                        ...editRow,
                        rootCauseCategory:
                          value,
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        BRAND.muted,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    Açıklama
                  </div>

                  <textarea
                    value={
                      editRow.description ||
                      ""
                    }
                    onChange={(event) =>
                      setEditRow({
                        ...editRow,
                        description:
                          event.target
                            .value,
                      })
                    }
                    rows={6}
                    style={{
                      width: "100%",
                      border: `1px solid ${BRAND.border}`,
                      borderRadius: 14,
                      padding: 12,
                      fontSize: 14,
                      fontFamily:
                        "inherit",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEditRow(null)
                    }
                    style={{
                      border: "none",
                      borderRadius: 12,
                      padding:
                        "10px 14px",
                      background:
                        "#f3f4f6",
                      color:
                        BRAND.text,
                      fontWeight: 900,
                      cursor:
                        "pointer",
                    }}
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving}
                    style={{
                      border: "none",
                      borderRadius: 12,
                      padding:
                        "10px 14px",
                      background:
                        BRAND.redBright,
                      color: "#fff",
                      fontWeight: 900,
                      cursor: saving
                        ? "not-allowed"
                        : "pointer",
                      opacity: saving
                        ? 0.6
                        : 1,
                    }}
                  >
                    {saving
                      ? "Kaydediliyor..."
                      : "Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function IncidentOverview({
  rows,
  stats,
  onOpenRecords,
  onOpenAnalytics,
  onOpenInvestigation,
}: {
  rows: AccidentRow[];
  stats: {
  total: number;
  accident: number;
  nearMiss: number;
  danger: number;
  eventNotice: number;
  totalLostDays: number;
  last30Count: number;
  topDepartment: string;
  topRoot: string;
};
  onOpenRecords(): void;
  onOpenAnalytics(): void;
  onOpenInvestigation(): void;
}) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: 16,
        }}
      >
        <StatCard title="Toplam Kayıt" value={stats.total} />
        <StatCard title="İş Kazası" value={stats.accident} color={BRAND.redBright} />
        <StatCard title="Ramak Kala" value={stats.nearMiss} color={BRAND.amber} />
        <StatCard title="Tehlikeli Durum" value={stats.danger} color={BRAND.blue} />
       <StatCard  title="Olay Bildirimi"  value={stats.eventNotice} color="#7c3aed" />
        <StatCard title="Toplam Kayıp Gün" value={stats.totalLostDays} color={BRAND.redBright} />
        <StatCard title="Son 30 Gün" value={stats.last30Count} color={BRAND.blue} />
        <StatCard title="Riskli Departman" valueText={stats.topDepartment} color={BRAND.amber} />
        <StatCard title="Sık Kök Neden" valueText={stats.topRoot} color={BRAND.green} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: 16,
        }}
      >
        <QuickAction
          title="Kaza ve Olay Kayıtları"
          description={`${rows.length} kaydı görüntüle, düzenle ve pasifleştir.`}
          button="Kayıtlara Git"
          onClick={onOpenRecords}
        />

        <QuickAction
          title="Analytics Merkezi"
          description="KPI, trend, risk haritası, kök neden ve yönetici özetini incele."
          button="Analitiği Aç"
          onClick={onOpenAnalytics}
        />

        <QuickAction
          title="Soruşturma Merkezi"
          description="Delil, tanık, görüşme, 5 Why, Fishbone ve kök neden süreçlerini yönet."
          button="Soruşturmaları Aç"
          onClick={onOpenInvestigation}
        />
      </div>
    </div>
  );
}

function QuickAction({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick(): void;
}) {
  return (
    <article
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 950 }}>
        {title}
      </div>

      <p
        style={{
          minHeight: 48,
          margin: "10px 0 16px",
          color: BRAND.muted,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        style={{
          border: "none",
          borderRadius: 12,
          padding: "10px 14px",
          background: BRAND.redBright,
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {button}
      </button>
    </article>
  );
}


function ModuleShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "grid", gap: 20 }}>
      <header
        style={{
          padding: 22,
          borderRadius: 20,
          background:
            "linear-gradient(135deg,#111827,#4a0d1a,#b91c1c)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 950 }}>
          {title}
        </div>

        <div
          style={{
            marginTop: 8,
            maxWidth: 900,
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          {description}
        </div>
      </header>

      {children}
    </section>
  );
}

function IncidentSelector({
  rows,
  selectedIncidentId,
  onChange,
}: {
  rows: AccidentRow[];
  selectedIncidentId: string;
  onChange(value: string): void;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <label style={{ display: "grid", gap: 8 }}>
        <span
          style={{
            color: BRAND.muted,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          İŞLEM YAPILACAK KAZA / OLAY
        </span>

        <select
          value={selectedIncidentId}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            minHeight: 46,
            borderRadius: 12,
            border: `1px solid ${BRAND.border}`,
            padding: "10px 12px",
            background: "#fff",
            fontWeight: 800,
          }}
        >
          {rows.length === 0 ? (
            <option value="">
              Kayıt bulunamadı
            </option>
          ) : (
            rows.map((row) => (
              <option
                key={row.id}
                value={String(row.id)}
              >
                {`INC-${row.id} • ${
                  row.title || "Başlıksız kayıt"
                } • ${
                  row.employeeName || "Çalışan yok"
                }`}
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}

function EmptyModule({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        padding: 36,
        textAlign: "center",
        borderRadius: 18,
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        color: BRAND.muted,
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

function IncidentReportsCenter({
  rows,
  analyticsRecords,
}: {
  rows: AccidentRow[];
  analyticsRecords: IncidentAnalyticsRecord[];
}) {
  const totalLostDays = rows.reduce(
    (sum, row) =>
      sum + Number(row.lostWorkDays || 0),
    0
  );

  function exportCsv() {
    const header = [
      "Kayıt No",
      "Başlık",
      "Çalışan",
      "Tür",
      "Tarih",
      "Lokasyon",
      "Departman",
      "Şiddet",
      "Kayıp Gün",
      "Kök Neden",
    ];

    const body = rows.map((row) => [
      `INC-${row.id}`,
      row.title || "",
      row.employeeName || "",
      row.eventType || "",
      formatDate(row.eventDate),
      row.location || "",
      row.department || "",
      Number(row.severity || 0),
      Number(row.lostWorkDays || 0),
      row.rootCauseCategory || "",
    ]);

    const csv = [header, ...body]
      .map((line) =>
        line
          .map((cell) =>
            `"${String(cell).replace(/"/g, '""')}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: "text/csv;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "dsec-kaza-olay-raporu.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            generatedAt:
              new Date().toISOString(),
            totalRecords: rows.length,
            totalLostDays,
            records: analyticsRecords,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "dsec-kaza-olay-raporu.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <ModuleShell
      title="Kurumsal Rapor Merkezi"
      description="Kaza ve olay kayıtlarını CSV ve JSON formatında dışa aktarın. PDF için yalnızca bu rapor görünümünü yazdırın."
    >
      <div
        className="incident-report-print-area"
        style={{
          padding: 24,
          borderRadius: 20,
          background: "#fff",
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: 14,
          }}
        >
          <StatCard
            title="Toplam Kayıt"
            value={rows.length}
          />

          <StatCard
            title="Toplam Kayıp Gün"
            value={totalLostDays}
            color={BRAND.redBright}
          />

          <StatCard
            title="Rapor Tarihi"
            valueText={new Date().toLocaleDateString(
              "tr-TR"
            )}
            color={BRAND.blue}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <Th>No</Th>
                <Th>Başlık</Th>
                <Th>Çalışan</Th>
                <Th>Tür</Th>
                <Th>Departman</Th>
                <Th>Şiddet</Th>
                <Th>Kayıp Gün</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom:
                      "1px solid #e5e7eb",
                  }}
                >
                  <Td>{`INC-${row.id}`}</Td>
                  <Td>{row.title || "-"}</Td>
                  <Td>
                    {row.employeeName || "-"}
                  </Td>
                  <Td>{row.eventType || "-"}</Td>
                  <Td>
                    {row.department || "-"}
                  </Td>
                  <Td>
                    {Number(row.severity || 0)}
                  </Td>
                  <Td>
                    {Number(
                      row.lostWorkDays || 0
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => window.print()}
          style={reportButtonStyle(
            "#111827"
          )}
        >
          PDF / Yazdır
        </button>

        <button
          type="button"
          onClick={exportCsv}
          style={reportButtonStyle(
            "#166534"
          )}
        >
          Excel / CSV
        </button>

        <button
          type="button"
          onClick={exportJson}
          style={reportButtonStyle(
            "#1d4ed8"
          )}
        >
          JSON
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .incident-report-print-area,
          .incident-report-print-area * {
            visibility: visible !important;
          }

          .incident-report-print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4 landscape;
            margin: 12mm;
          }
        }
      `}</style>
    </ModuleShell>
  );
}

function reportButtonStyle(
  background: string
): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    background,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function normalizeIncidentType(
  value?: string |null
) {
  const type = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  // İş Kazası
  if (
    type === "KAZA" ||
    type === "İŞ_KAZASI" ||
    type === "IS_KAZASI" ||
    type === "WORK_ACCIDENT"
  ) {
    return "WORK_ACCIDENT";
  }

  // Ramak Kala
  if (
    type === "RAMAK_KALA" ||
    type === "NEAR_MISS"
  ) {
    return "NEAR_MISS";
  }

  // Tehlikeli Durum
  if (
    type === "TEHLIKELI_DURUM" ||
    type === "TEHLİKELİ_DURUM" ||
    type === "UNSAFE_CONDITION"
  ) {
    return "UNSAFE_CONDITION";
  }

  // Olay Bildirimi
  if (
    type === "OLAY_BILDIRIMI" ||
    type === "OLAY_BİLDİRİMİ" ||
    type === "OLAY_BILDIRIM" ||
    type === "OLAY_BİLDİRİM" ||
    type === "EVENT_NOTICE" ||
    type === "EVENT_NOTIFICATION"
  ) {
    return "EVENT_NOTIFICATION";
  }

  // Meslek Hastalığı
  if (
    type === "MESLEK_HASTALIGI" ||
    type === "MESLEK_HASTALIĞI" ||
    type === "OCCUPATIONAL_DISEASE"
  ) {
    return "OCCUPATIONAL_DISEASE";
  }

  return type || "OTHER";
}

function normalizeTimestamp(
  value?: number | string | null
) {
  if (value == null) {
    return Date.now();
  }

  if (typeof value === "number") {
    if (value > 0 && value < 10_000_000_000) {
      return value * 1000;
    }

    return value;
  }

  const parsed =
    new Date(value).getTime();

  return Number.isNaN(parsed)
    ? Date.now()
    : parsed;
}

function groupRows(
  rows: AccidentRow[],
  field:
    | "department"
    | "rootCauseCategory"
) {
  const map =
    new Map<string, number>();

  rows.forEach((row) => {
    const label =
      String(
        row[field] ||
          "Belirtilmemiş"
      ).trim() ||
      "Belirtilmemiş";

    map.set(
      label,
      (map.get(label) || 0) + 1
    );
  });

  return [...map.entries()]
    .map(([label, count]) => ({
      label,
      count,
    }))
    .sort(
      (first, second) =>
        second.count - first.count
    )
    .slice(0, 6);
}

function formatDate(
  value?: number | null
) {
  if (!value) {
    return "-";
  }

  const timestamp =
    normalizeTimestamp(value);

  const date = new Date(timestamp);

  return Number.isNaN(
    date.getTime()
  )
    ? "-"
    : date.toLocaleDateString(
        "tr-TR"
      );
}

function PageTabButton({
  title,
  active,
  onClick,
}: {
  title: string;
  active: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 12,
        padding: "12px 18px",
        background: active
          ? BRAND.redBright
          : "#f3f4f6",
        color: active
          ? "#fff"
          : BRAND.text,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {title}
    </button>
  );
}

function PremiumStatCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  accent: string;
  icon: string;
}) {
  return (
    <article
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: 150,
        padding: 20,
        borderRadius: 22,
        background: `linear-gradient(145deg,#ffffff 0%,${accent}10 100%)`,
        border: `1px solid ${accent}33`,
        boxShadow: "0 14px 34px rgba(15,23,42,.07)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: accent,
          color: "#fff",
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        {icon}
      </div>

      <div style={{ color: BRAND.muted, fontSize: 13, fontWeight: 900 }}>
        {title}
      </div>

      <div style={{ marginTop: 12, color: accent, fontSize: 38, fontWeight: 950 }}>
        {value}
      </div>

      <div style={{ marginTop: 8, maxWidth: 190, color: BRAND.muted, lineHeight: 1.45, fontSize: 12 }}>
        {subtitle}
      </div>
    </article>
  );
}

function StatCard({
  title,
  value,
  valueText,
  color = BRAND.text,
}: {
  title: string;
  value?: number;
  valueText?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 18,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: BRAND.muted,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: valueText
            ? 20
            : 30,
          fontWeight: 950,
          color,
        }}
      >
        {valueText ?? value ?? 0}
      </div>
    </div>
  );
}

function MiniPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    label: string;
    count: number;
  }>;
}) {
  const max =
    rows[0]?.count || 1;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 18,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 950,
          marginBottom: 14,
        }}
      >
        {title}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            color: BRAND.muted,
          }}
        >
          Veri bulunamadı.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {rows.map((row) => (
            <div key={row.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                <span>
                  {row.label}
                </span>

                <span>
                  {row.count}
                </span>
              </div>

              <div
                style={{
                  height: 9,
                  background:
                    "#f1f5f9",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(
                      8,
                      Math.round(
                        (row.count /
                          max) *
                          100
                      )
                    )}%`,
                    height: "100%",
                    background:
                      BRAND.redBright,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: string;
}) {
  const normalized =
    normalizeIncidentType(type);

  const color =
    normalized ===
    "WORK_ACCIDENT"
      ? BRAND.redBright
      : normalized ===
        "NEAR_MISS"
      ? BRAND.amber
      : normalized ===
        "UNSAFE_CONDITION"
      ? BRAND.blue
      : BRAND.text;

  return (
    <span
      style={{
        color,
        fontWeight: 900,
      }}
    >
      {type}
    </span>
  );
}

function SeverityBadge({
  value,
}: {
  value: number;
}) {
  const color =
    value >= 3
      ? BRAND.redBright
      : value === 2
      ? BRAND.amber
      : BRAND.green;

  return (
    <span
      style={{
        color,
        fontWeight: 950,
      }}
    >
      {value}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 14,
        padding: 12,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: BRAND.muted,
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontWeight: 900,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(
    value: string
  ): void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: BRAND.muted,
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        style={{
          width: "100%",
          border: `1px solid ${BRAND.border}`,
          borderRadius: 14,
          padding: 12,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 14,
        fontSize: 13,
        color: "#374151",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: 14,
        fontSize: 14,
        color: BRAND.text,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}