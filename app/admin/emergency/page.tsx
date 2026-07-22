"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import EmergencyDashboard from "./components/EmergencyDashboard";
import EmergencyTabs from "./components/EmergencyTabs";
import ActionPlanTable from "./components/ActionPlanTable";
import ActionPlanDialog from "./components/ActionPlanDialog";
import SupportTeamTable from "./components/SupportTeamTable";
import SupportTeamDialog from "./components/SupportTeamDialog";

import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
} from "./types";

import {
  deleteEmergencyPlan,
  deleteSupportMember,
  getEmergencyDrills,
  getEmergencyPlans,
  getSupportTeams,
  saveEmergencyPlan,
  saveSupportMember,
} from "./services";

type EmergencyTab =
  | "plans"
  | "teams"
  | "drills"
  | "reports";

const EMPTY_PLAN: Partial<EmergencyPlan> = {
  planTitle: "Acil Durum Eylem Planı",
  workplaceTitle: "",
  workplaceAddress: "",
  dangerClass: "AZ_TEHLIKELI",
  employeeCount: 0,
  planDateMillis: Date.now(),
  validUntilMillis: null,
  revisionDateMillis: null,
  revisionNo: "R0",
  assemblyArea: "",
  emergencyCoordinator: "",
  preparedBy: "",
  approvedBy: "",
  assemblyAreaPhotoUri: null,
  emergencyExitRoutePhotoUri: null,
  fireEquipmentPhotoUri: null,
  emergencyBoardPhotoUri: null,
  fireScenario: "",
  earthquakeScenario: "",
  floodScenario: "",
  accidentScenario: "",
  evacuationScenario: "",
  createdAtMillis: Date.now(),
  updatedAtMillis: Date.now(),

};

const EMPTY_MEMBER: Partial<EmergencySupportMember> = {
  employeeId: null,
  teamType: "YANGIN",
  teamRole: "EKIP_UYESI",
  fullName: "",
  duty: "",
  department: "",
  phone: "",
  certificateInfo: "",
  assignedDateMillis: Date.now(),
  signatureStatus: "IMZA_BEKLIYOR",
  isActive: true,
  createdAtMillis: Date.now(),
};

function resolveInitialFirmId() {
  if (typeof window === "undefined") return "";

  const queryFirmId = new URLSearchParams(
    window.location.search
  ).get("firmId");

  if (queryFirmId) {
    return queryFirmId;
  }



  return (
    window.localStorage.getItem("selectedFirmId") ||
    window.localStorage.getItem("selectedCompanyId") ||
    window.localStorage.getItem("firmId") ||
    ""
  );
}

export default function EmergencyPage() {
  const [tab, setTab] =
    useState<EmergencyTab>("plans");

  const [firmId, setFirmId] = useState("");

  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [teams, setTeams] =
    useState<EmergencySupportMember[]>([]);
  const [drills, setDrills] =
    useState<EmergencyDrill[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlanId, setDeletingPlanId] =
    useState<string>("");
  const [error, setError] = useState("");

  const [showPlanDialog, setShowPlanDialog] =
    useState(false);

  const [editingPlan, setEditingPlan] =
    useState<Partial<EmergencyPlan>>(EMPTY_PLAN);


  const [showMemberDialog, setShowMemberDialog] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState<Partial<EmergencySupportMember>>(
      EMPTY_MEMBER
    );

  const [savingMember, setSavingMember] =
    useState(false);

  const [deletingMemberId, setDeletingMemberId] =
    useState("");

  useEffect(() => {
    setFirmId(resolveInitialFirmId());
  }, []);

  const loadEmergencyData = async (
    selectedFirmId = firmId
  ) => {
    if (!selectedFirmId) {
      setPlans([]);
      setTeams([]);
      setDrills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        planRecords,
        teamRecords,
        drillRecords,
      ] = await Promise.all([
        getEmergencyPlans(selectedFirmId),
        getSupportTeams(selectedFirmId),
        getEmergencyDrills(selectedFirmId),
      ]);

      setPlans(
        Array.isArray(planRecords)
          ? planRecords
          : []
      );

      setTeams(
        Array.isArray(teamRecords)
          ? teamRecords
          : []
      );

      setDrills(
        Array.isArray(drillRecords)
          ? drillRecords
          : []
      );
    } catch (loadError) {
      console.error(
        "Emergency module load error:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Acil durum verileri yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!firmId) {
      setLoading(false);
      return;
    }

    void loadEmergencyData(firmId);
  }, [firmId]);

  const dashboardStats = useMemo(() => {
    const now = Date.now();
    const currentYear =
      new Date().getFullYear();

    const activeTeams = new Set(
      teams
        .filter((member) => member.isActive)
        .map((member) => member.teamType)
    ).size;

    const activeMembers = teams.filter(
      (member) => member.isActive
    ).length;

    const upcomingDrills = drills.filter(
      (drill) =>
        drill.nextDrillDueMillis !== null &&
        drill.nextDrillDueMillis >= now
    ).length;

    const revisionRequired = plans.filter(
      (plan) =>
        plan.validUntilMillis !== null &&
        plan.validUntilMillis < now
    ).length;

    const pendingSignatures = teams.filter(
      (member) =>
        member.signatureStatus ===
        "IMZA_BEKLIYOR"
    ).length;

    const drillsThisYear = drills.filter(
      (drill) =>
        new Date(
          drill.drillDateMillis
        ).getFullYear() === currentYear
    ).length;

    const activePlans = plans.filter(
      (plan) =>
        plan.validUntilMillis === null ||
        plan.validUntilMillis >= now
    ).length;

    return {
      totalPlans: plans.length,
      activeTeams,
      activeMembers,
      upcomingDrills,
      revisionRequired,
      pendingSignatures,
      drillsThisYear,
      activePlans,
    };
  }, [plans, teams, drills]);

  const openNewPlan = () => {
    if (!firmId) {
      setError(
        "Yeni plan oluşturmak için önce firma seçilmelidir."
      );
      return;
    }

    setEditingPlan({
      ...EMPTY_PLAN,
      firmId,
      id: undefined,
      createdAtMillis: Date.now(),
      updatedAtMillis: Date.now(),
    });

    setShowPlanDialog(true);
  };

  const openEditPlan = (
    plan: EmergencyPlan
  ) => {
    setEditingPlan({
      ...plan,
    });

    setShowPlanDialog(true);
  };

  const updatePlanField = (
    field: keyof EmergencyPlan,
    value: unknown
  ) => {
    setEditingPlan((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSavePlan = async () => {
    if (!firmId) {
      setError("Firma seçimi bulunamadı.");
      return;
    }

    if (
      !String(
        editingPlan.planTitle || ""
      ).trim()
    ) {
      setError("Plan başlığı zorunludur.");
      return;
    }

    try {
      setSavingPlan(true);
      setError("");

      const now = Date.now();

      await saveEmergencyPlan({
        ...editingPlan,
        firmId,
        planTitle: String(
          editingPlan.planTitle ||
            "Acil Durum Eylem Planı"
        ).trim(),
        workplaceTitle: String(
          editingPlan.workplaceTitle || ""
        ).trim(),
        workplaceAddress: String(
          editingPlan.workplaceAddress || ""
        ).trim(),
        assemblyArea: String(
          editingPlan.assemblyArea || ""
        ).trim(),
        emergencyCoordinator: String(
          editingPlan.emergencyCoordinator ||
            ""
        ).trim(),
        preparedBy: String(
          editingPlan.preparedBy || ""
        ).trim(),
        approvedBy: String(
          editingPlan.approvedBy || ""
        ).trim(),
        updatedAtMillis: now,
        createdAtMillis:
          editingPlan.createdAtMillis ||
          now,
      });

      setShowPlanDialog(false);
      setEditingPlan(EMPTY_PLAN);

      await loadEmergencyData(firmId);
    } catch (saveError) {
      console.error(
        "Emergency plan save error:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Acil durum planı kaydedilemedi."
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (
    plan: EmergencyPlan
  ) => {
    const accepted = window.confirm(
      `"${plan.planTitle}" planı silinecek. Emin misiniz?`
    );

    if (!accepted) return;

    try {
      setDeletingPlanId(plan.id);
      setError("");

      await deleteEmergencyPlan(plan.id);
      await loadEmergencyData(firmId);
    } catch (deleteError) {
      console.error(
        "Emergency plan delete error:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Acil durum planı silinemedi."
      );
    } finally {
      setDeletingPlanId("");
    }
  };

  const openNewMember = () => {
    if (!firmId) {
      setError(
        "Yeni ekip üyesi eklemek için firma seçilmelidir."
      );
      return;
    }

    setEditingMember({
      ...EMPTY_MEMBER,
      firmId,
      id: undefined,
      createdAtMillis: Date.now(),
      assignedDateMillis: Date.now(),
    });

    setShowMemberDialog(true);
  };

  const openEditMember = (
    member: EmergencySupportMember
  ) => {
    setEditingMember({ ...member });
    setShowMemberDialog(true);
  };

  const updateMemberField = (
    field: keyof EmergencySupportMember,
    value: unknown
  ) => {
    setEditingMember(
      (
        current: Partial<EmergencySupportMember>
      ) => ({
        ...current,
        [field]: value,
      })
    );
  };

  const handleSaveMember = async () => {
    if (!firmId) {
      setError("Firma seçimi bulunamadı.");
      return;
    }

    if (
      !String(
        editingMember.fullName || ""
      ).trim()
    ) {
      setError("Ad soyad zorunludur.");
      return;
    }

    if (
      !String(
        editingMember.teamType || ""
      ).trim()
    ) {
      setError("Ekip türü zorunludur.");
      return;
    }

    try {
      setSavingMember(true);
      setError("");

      await saveSupportMember({
        ...editingMember,
        firmId,
        fullName: String(
          editingMember.fullName || ""
        ).trim(),
        teamType: String(
          editingMember.teamType || "YANGIN"
        ),
        teamRole: String(
          editingMember.teamRole ||
            "EKIP_UYESI"
        ),
        createdAtMillis:
          editingMember.createdAtMillis ||
          Date.now(),
      });

      setShowMemberDialog(false);
      setEditingMember(EMPTY_MEMBER);

      await loadEmergencyData(firmId);
    } catch (saveError) {
      console.error(
        "Support member save error:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Destek ekibi üyesi kaydedilemedi."
      );
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (
    member: EmergencySupportMember
  ) => {
    const accepted = window.confirm(
      `"${member.fullName}" destek ekibinden silinecek. Emin misiniz?`
    );

    if (!accepted) return;

    try {
      setDeletingMemberId(member.id);
      setError("");

      await deleteSupportMember(member.id);
      await loadEmergencyData(firmId);
    } catch (deleteError) {
      console.error(
        "Support member delete error:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Destek ekibi üyesi silinemedi."
      );
    } finally {
      setDeletingMemberId("");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1540,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            borderRadius: 28,
            padding: 24,
            color: "#ffffff",
            background:
              "linear-gradient(135deg, #7f1d1d 0%, #111827 58%, #991b1b 100%)",
            boxShadow:
              "0 24px 60px rgba(127,29,29,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "7px 11px",
                  background:
                    "rgba(255,255,255,0.12)",
                  fontSize: 12,
                  fontWeight: 850,
                  marginBottom: 12,
                }}
              >
                <ShieldAlert size={16} />
                D-SEC Acil Durum Yönetimi
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                }}
              >
                Acil Durum Yönetim Merkezi
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  maxWidth: 760,
                  color:
                    "rgba(255,255,255,0.82)",
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                Eylem planlarını, destek
                ekiplerini ve tatbikatları
                mobil uygulamayla uyumlu
                şekilde yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadEmergencyData(firmId)
              }
              disabled={loading || !firmId}
              style={{
                minHeight: 44,
                borderRadius: 14,
                padding: "0 15px",
                border:
                  "1px solid rgba(255,255,255,0.24)",
                background:
                  "rgba(255,255,255,0.13)",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 850,
                cursor:
                  loading || !firmId
                    ? "wait"
                    : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="emergencySpin"
                />
              ) : (
                <RefreshCw size={17} />
              )}

              Yenile
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {[
              [
                "Toplam Plan",
                dashboardStats.totalPlans,
              ],
              [
                "Aktif Ekip",
                dashboardStats.activeTeams,
              ],
              [
                "Toplam Üye",
                dashboardStats.activeMembers,
              ],
              [
                "Yaklaşan Tatbikat",
                dashboardStats.upcomingDrills,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background:
                    "rgba(255,255,255,0.1)",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color:
                      "rgba(255,255,255,0.68)",
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {!firmId ? (
          <section
            style={{
              borderRadius: 16,
              padding: 14,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            Firma seçimi bulunamadı. Modülü
            firma ekranından açın veya URL’ye
            <code>?firmId=FIRMA_ID</code> ekleyin.
          </section>
        ) : null}

        {error ? (
          <section
            style={{
              borderRadius: 16,
              padding: 14,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </section>
        ) : null}

        <EmergencyDashboard />

        <EmergencyTabs
          value={tab}
          onChange={(value) =>
            setTab(value as EmergencyTab)
          }
        />

        {loading ? (
          <section
            style={{
              minHeight: 300,
              borderRadius: 22,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              display: "grid",
              placeItems: "center",
              color: "#64748b",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Loader2
                size={28}
                className="emergencySpin"
              />

              <div
                style={{
                  marginTop: 10,
                  fontWeight: 850,
                }}
              >
                Acil durum verileri
                yükleniyor...
              </div>
            </div>
          </section>
        ) : null}

        {!loading && tab === "plans" ? (
          <ActionPlanTable
            data={plans}
            onAdd={openNewPlan}
            onEdit={openEditPlan}
            onDelete={(plan) =>
              void handleDeletePlan(plan)
            }
          />
        ) : null}

        {!loading && tab === "teams" ? (
          <SupportTeamTable
            data={teams}
            deletingId={deletingMemberId}
            onAdd={openNewMember}
            onEdit={openEditMember}
            onDelete={(member) =>
              void handleDeleteMember(member)
            }
          />
        ) : null}

        {!loading && tab === "drills" ? (
          <section
            style={{
              minHeight: 280,
              borderRadius: 22,
              padding: 22,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow:
                "0 14px 35px rgba(15,23,42,0.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Acil Durum Tatbikatları
            </h2>

            <p
              style={{
                color: "#64748b",
                marginTop: 8,
              }}
            >
              {drills.length} tatbikat kaydı
              bulunmaktadır.
            </p>
          </section>
        ) : null}

        {!loading && tab === "reports" ? (
          <section
            style={{
              minHeight: 280,
              borderRadius: 22,
              padding: 22,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow:
                "0 14px 35px rgba(15,23,42,0.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Acil Durum Raporları
            </h2>

            <p
              style={{
                color: "#64748b",
                marginTop: 8,
              }}
            >
              Plan, ekip ve tatbikat
              raporları bu alanda
              oluşturulacaktır.
            </p>
          </section>
        ) : null}
      </div>

      <ActionPlanDialog
        open={showPlanDialog}
        plan={editingPlan}
        onClose={() => {
          if (!savingPlan) {
            setShowPlanDialog(false);
          }
        }}
        onSave={() =>
          void handleSavePlan()
        }
        onChange={updatePlanField}
      />

      <SupportTeamDialog
        open={showMemberDialog}
        member={editingMember}
        onClose={() => {
          if (!savingMember) {
            setShowMemberDialog(false);
          }
        }}
        onSave={() =>
          void handleSaveMember()
        }
        onChange={updateMemberField}
      />

      {deletingPlanId ? (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 130,
            borderRadius: 14,
            padding: "12px 15px",
            background: "#111827",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
            boxShadow:
              "0 16px 40px rgba(15,23,42,0.28)",
          }}
        >
          <Loader2
            size={16}
            className="emergencySpin"
          />
          Plan siliniyor...
        </div>
      ) : null}

      <style jsx>{`
        .emergencySpin {
          animation: emergency-spin 0.9s
            linear infinite;
        }

        @keyframes emergency-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}