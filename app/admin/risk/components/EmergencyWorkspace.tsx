"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";

import ActionPlanTable from "../../emergency/components/ActionPlanTable";
import ActionPlanDialog from "../../emergency/components/ActionPlanDialog";
import SupportTeamTable from "../../emergency/components/SupportTeamTable";
import SupportTeamDialog from "../../emergency/components/SupportTeamDialog";
import EmergencyDrillTable from "./EmergencyDrillTable";
import EmergencyDrillDialog from "./EmergencyDrillDialog";

import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
} from "../../emergency/types";

import {
  deleteEmergencyDrill,
  deleteEmergencyPlan,
  deleteSupportMember,
  getEmergencyDrills,
  getEmergencyPlans,
  getSupportTeams,
  saveEmergencyDrill,
  saveEmergencyPlan,
  saveSupportMember,
} from "../../emergency/services";

type SubTab = "plans" | "teams" | "drills";

type Props = {
  firmId: string;
  companyName?: string;
};

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

const EMPTY_DRILL: Partial<EmergencyDrill> = {
  drillType: "YANGIN_TAHLIYE",
  drillTitle: "",
  drillDateMillis: Date.now(),
  nextDrillDueMillis: null,
  participantCount: 0,
  durationMinutes: 0,
  result: "",
  deficiencies: "",
  correctiveActions: "",
  responsible: "",
  status: "GEÇERLİ",
  createdAtMillis: Date.now(),
  updatedAtMillis: Date.now(),
};

export default function EmergencyWorkspace({
  firmId,
  companyName = "",
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("plans");
  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [teams, setTeams] = useState<EmergencySupportMember[]>([]);
  const [drills, setDrills] = useState<EmergencyDrill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<Partial<EmergencyPlan>>(EMPTY_PLAN);
  const [savingPlan, setSavingPlan] = useState(false);

  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [editingMember, setEditingMember] =
    useState<Partial<EmergencySupportMember>>(EMPTY_MEMBER);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState("");

  const [showDrillDialog, setShowDrillDialog] = useState(false);
  const [editingDrill, setEditingDrill] =
    useState<Partial<EmergencyDrill>>(EMPTY_DRILL);
  const [savingDrill, setSavingDrill] = useState(false);
  const [deletingDrillId, setDeletingDrillId] = useState("");

  const loadData = async () => {
    if (!firmId) {
      setPlans([]);
      setTeams([]);
      setDrills([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [planRows, teamRows, drillRows] = await Promise.all([
        getEmergencyPlans(firmId),
        getSupportTeams(firmId),
        getEmergencyDrills(firmId),
      ]);

      setPlans(planRows);
      setTeams(teamRows);
      setDrills(drillRows);
    } catch (loadError) {
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
    void loadData();
  }, [firmId]);

  const stats = useMemo(() => {
    const now = Date.now();
    const year = new Date().getFullYear();

    return {
      plans: plans.length,
      activeMembers: teams.filter((item) => item.isActive).length,
      pendingSignatures: teams.filter(
        (item) => item.signatureStatus === "IMZA_BEKLIYOR"
      ).length,
      drillsThisYear: drills.filter(
        (item) => new Date(item.drillDateMillis).getFullYear() === year
      ).length,
      upcomingDrills: drills.filter(
        (item) =>
          item.nextDrillDueMillis !== null &&
          item.nextDrillDueMillis >= now
      ).length,
      expiredPlans: plans.filter(
        (item) =>
          item.validUntilMillis !== null &&
          item.validUntilMillis < now
      ).length,
    };
  }, [plans, teams, drills]);

  const savePlan = async () => {
    if (!firmId) return;

    if (!String(editingPlan.planTitle || "").trim()) {
      setError("Plan başlığı zorunludur.");
      return;
    }

    try {
      setSavingPlan(true);
      setError("");

      await saveEmergencyPlan({
        ...editingPlan,
        firmId,
        workplaceTitle:
          editingPlan.workplaceTitle || companyName,
        updatedAtMillis: Date.now(),
        createdAtMillis:
          editingPlan.createdAtMillis || Date.now(),
      });

      setShowPlanDialog(false);
      setEditingPlan(EMPTY_PLAN);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Plan kaydedilemedi."
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const removePlan = async (plan: EmergencyPlan) => {
    if (!window.confirm(`"${plan.planTitle}" planı silinsin mi?`)) return;

    try {
      setError("");
      await deleteEmergencyPlan(plan.id);
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Plan silinemedi."
      );
    }
  };

  const saveMember = async () => {
    if (!firmId) return;

    if (!String(editingMember.fullName || "").trim()) {
      setError("Ad soyad zorunludur.");
      return;
    }

    try {
      setSavingMember(true);
      setError("");

      await saveSupportMember({
        ...editingMember,
        firmId,
        createdAtMillis:
          editingMember.createdAtMillis || Date.now(),
      });

      setShowMemberDialog(false);
      setEditingMember(EMPTY_MEMBER);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Ekip üyesi kaydedilemedi."
      );
    } finally {
      setSavingMember(false);
    }
  };

  const removeMember = async (member: EmergencySupportMember) => {
    if (!window.confirm(`"${member.fullName}" silinsin mi?`)) return;

    try {
      setDeletingMemberId(member.id);
      setError("");
      await deleteSupportMember(member.id);
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ekip üyesi silinemedi."
      );
    } finally {
      setDeletingMemberId("");
    }
  };

  const saveDrill = async () => {
    if (!firmId) return;

    if (!editingDrill.drillDateMillis) {
      setError("Tatbikat tarihi zorunludur.");
      return;
    }

    try {
      setSavingDrill(true);
      setError("");

      await saveEmergencyDrill({
        ...editingDrill,
        firmId,
        updatedAtMillis: Date.now(),
        createdAtMillis:
          editingDrill.createdAtMillis || Date.now(),
      });

      setShowDrillDialog(false);
      setEditingDrill(EMPTY_DRILL);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Tatbikat kaydedilemedi."
      );
    } finally {
      setSavingDrill(false);
    }
  };

  const removeDrill = async (drill: EmergencyDrill) => {
    if (!window.confirm(`"${drill.drillTitle || "Tatbikat"}" silinsin mi?`)) {
      return;
    }

    try {
      setDeletingDrillId(drill.id);
      setError("");
      await deleteEmergencyDrill(drill.id);
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Tatbikat silinemedi."
      );
    } finally {
      setDeletingDrillId("");
    }
  };

  if (!firmId) {
    return (
      <section
        style={{
          borderRadius: 18,
          border: "1px solid #fde68a",
          background: "#fffbeb",
          color: "#92400e",
          padding: 16,
          display: "flex",
          gap: 10,
          alignItems: "center",
          fontWeight: 800,
        }}
      >
        <AlertTriangle size={18} />
        Acil durum kayıtlarını görüntülemek için risk listesinden bir firma seçin.
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section
        style={{
          borderRadius: 22,
          padding: 18,
          background:
            "linear-gradient(135deg, #7f1d1d 0%, #111827 70%)",
          color: "#ffffff",
          boxShadow: "0 18px 44px rgba(127,29,29,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 23, fontWeight: 950 }}>
              Acil Durum Yönetimi
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(255,255,255,0.76)",
                fontSize: 13,
              }}
            >
              {companyName || "Seçili firma"} · Mobil uygulama ile ortak veri
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              padding: "0 14px",
              fontWeight: 850,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? <Loader2 size={16} className="emergencySpin" /> : <RefreshCw size={16} />}
            Yenile
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {[
            ["Toplam Plan", stats.plans, <ClipboardCheck size={17} />],
            ["Aktif Üye", stats.activeMembers, <Users size={17} />],
            ["İmza Bekleyen", stats.pendingSignatures, <UserCheck size={17} />],
            ["Bu Yıl Tatbikat", stats.drillsThisYear, <CalendarClock size={17} />],
            ["Yaklaşan Tatbikat", stats.upcomingDrills, <ShieldAlert size={17} />],
            ["Revizyon Gereken", stats.expiredPlans, <AlertTriangle size={17} />],
          ].map(([label, value, icon]) => (
            <div
              key={String(label)}
              style={{
                borderRadius: 16,
                padding: 13,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {icon}
                {label}
              </div>
              <div style={{ marginTop: 5, fontSize: 23, fontWeight: 950 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <section
          style={{
            borderRadius: 14,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: 13,
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontWeight: 800,
          }}
        >
          <AlertTriangle size={17} />
          {error}
        </section>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        {[
          ["plans", "Eylem Planları"],
          ["teams", "Destek Ekipleri"],
          ["drills", "Tatbikatlar"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSubTab(value as SubTab)}
            style={{
              minHeight: 42,
              borderRadius: 12,
              border:
                subTab === value
                  ? "1px solid #7f1d1d"
                  : "1px solid #dbe3ec",
              background: subTab === value ? "#7f1d1d" : "#ffffff",
              color: subTab === value ? "#ffffff" : "#475569",
              padding: "0 15px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <section
          style={{
            minHeight: 260,
            borderRadius: 22,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "grid",
            placeItems: "center",
            color: "#64748b",
          }}
        >
          <Loader2 size={28} className="emergencySpin" />
        </section>
      ) : null}

      {!loading && subTab === "plans" ? (
        <ActionPlanTable
          data={plans}
          onAdd={() => {
            setEditingPlan({
              ...EMPTY_PLAN,
              firmId,
              workplaceTitle: companyName,
              id: undefined,
            });
            setShowPlanDialog(true);
          }}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setShowPlanDialog(true);
          }}
          onDelete={(plan) => void removePlan(plan)}
        />
      ) : null}

      {!loading && subTab === "teams" ? (
        <SupportTeamTable
          data={teams}
          deletingId={deletingMemberId}
          onAdd={() => {
            setEditingMember({
              ...EMPTY_MEMBER,
              firmId,
              id: undefined,
            });
            setShowMemberDialog(true);
          }}
          onEdit={(member) => {
            setEditingMember(member);
            setShowMemberDialog(true);
          }}
          onDelete={(member) => void removeMember(member)}
        />
      ) : null}

      {!loading && subTab === "drills" ? (
        <EmergencyDrillTable
          data={drills}
          deletingId={deletingDrillId}
          onAdd={() => {
            setEditingDrill({
              ...EMPTY_DRILL,
              firmId,
              id: undefined,
            });
            setShowDrillDialog(true);
          }}
          onEdit={(drill) => {
            setEditingDrill(drill);
            setShowDrillDialog(true);
          }}
          onDelete={(drill) => void removeDrill(drill)}
        />
      ) : null}

      <ActionPlanDialog
        open={showPlanDialog}
        plan={editingPlan}
        onClose={() => {
          if (!savingPlan) setShowPlanDialog(false);
        }}
        onSave={savePlan}
        onChange={(field, value) =>
          setEditingPlan((current) => ({
            ...current,
            [field]: value,
          }))
        }
      />

      <SupportTeamDialog
        open={showMemberDialog}
        member={editingMember}
        onClose={() => {
          if (!savingMember) setShowMemberDialog(false);
        }}
        onSave={saveMember}
        onChange={(field, value) =>
          setEditingMember((current) => ({
            ...current,
            [field]: value,
          }))
        }
      />

      <EmergencyDrillDialog
        open={showDrillDialog}
        drill={editingDrill}
        saving={savingDrill}
        onClose={() => {
          if (!savingDrill) setShowDrillDialog(false);
        }}
        onSave={saveDrill}
        onChange={(field, value) =>
          setEditingDrill((current) => ({
            ...current,
            [field]: value,
          }))
        }
      />

      <style jsx>{`
        .emergencySpin {
          animation: emergency-spin 0.9s linear infinite;
        }

        @keyframes emergency-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}