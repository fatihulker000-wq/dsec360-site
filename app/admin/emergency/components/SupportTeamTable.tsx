"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import type { EmergencySupportMember } from "../types";

type DangerClass = "AZ_TEHLIKELI" | "TEHLIKELI" | "COK_TEHLIKELI";

type Props = {
  data: EmergencySupportMember[];
  employeeCount: number;
  dangerClass: DangerClass;
  deletingId?: string;
  onAdd: () => void;
  onEdit: (member: EmergencySupportMember) => void;
  onDelete: (member: EmergencySupportMember) => void;
};

const TEAM_LABELS: Record<string, string> = {
  YANGIN: "Yangınla Mücadele",
  ARAMA_KURTARMA: "Arama ve Kurtarma",
  TAHLİYE: "Tahliye",
  TAHLIYE: "Tahliye",
  ILK_YARDIM: "İlk Yardım",
  ILKYARDIM: "İlk Yardım",
  KORUMA: "Koruma",
  HABERLESME: "Haberleşme",
};

const ROLE_LABELS: Record<string, string> = {
  EKIP_LIDERI: "Ekip Lideri",
  EKIP_UYESI: "Ekip Üyesi",
  YEDEK_UYE: "Yedek Üye",
};

const normalizeTeam = (value: string) => {
  if (value === "TAHLIYE") return "TAHLİYE";
  if (value === "ILKYARDIM") return "ILK_YARDIM";
  return value;
};

const emergencyDivisor = (dangerClass: DangerClass) =>
  dangerClass === "COK_TEHLIKELI" ? 30 : dangerClass === "TEHLIKELI" ? 40 : 50;

const firstAidDivisor = (dangerClass: DangerClass) =>
  dangerClass === "COK_TEHLIKELI" ? 10 : dangerClass === "TEHLIKELI" ? 15 : 20;

const required = (employeeCount: number, divisor: number) =>
  employeeCount <= 0 ? 0 : Math.max(1, Math.ceil(employeeCount / divisor));

export default function SupportTeamTable({
  data,
  employeeCount,
  dangerClass,
  deletingId = "",
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const active = data.filter((item) => item.isActive);
  const operationalRequired = required(employeeCount, emergencyDivisor(dangerClass));
  const firstAidRequired = required(employeeCount, firstAidDivisor(dangerClass));

  const analyses = [
    ["YANGIN", "Yangın", operationalRequired],
    ["ARAMA_KURTARMA", "Arama Kurtarma", operationalRequired],
    ["TAHLİYE", "Tahliye", operationalRequired],
    ["ILK_YARDIM", "İlk Yardım", firstAidRequired],
  ].map(([type, label, minimum]) => {
    const members = active.filter(
      (member) =>
        normalizeTeam(String(member.teamType)) === type &&
        String(member.teamRole) !== "YEDEK_UYE"
    );

    const leaders = members.filter(
      (member) => String(member.teamRole) === "EKIP_LIDERI"
    ).length;

    const current = members.length;
    const missing = Math.max(0, Number(minimum) - current);

    return {
      type: String(type),
      label: String(label),
      required: Number(minimum),
      current,
      missing,
      leaders,
      complete: missing === 0 && leaders > 0,
    };
  });

  const incomplete = analyses.filter((item) => !item.complete);

  return (
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, overflow: "hidden" }}>
      <header style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
            <Users size={20} color="#047857" /> Acil Durum Destek Ekipleri
          </h2>
          <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>
            {data.length} ekip üyesi · {employeeCount} çalışan
          </p>
        </div>

        <button type="button" onClick={onAdd} style={{ minHeight: 42, background: "#047857", color: "#fff", border: 0, borderRadius: 12, padding: "0 14px", fontWeight: 900 }}>
          <Plus size={17} /> Yeni Üye
        </button>
      </header>

      <div style={{ padding: 16, background: "#f8fafc", display: "grid", gap: 10 }}>
        <div className="teamAnalysisGrid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
          {analyses.map((item) => (
            <article
              key={item.type}
              style={{
                borderRadius: 14,
                border: item.complete ? "1px solid #a7f3d0" : "1px solid #fecaca",
                background: item.complete ? "#ecfdf5" : "#fef2f2",
                padding: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{item.label}</strong>
                {item.complete ? <CheckCircle2 size={17} color="#047857" /> : <AlertTriangle size={17} color="#b91c1c" />}
              </div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 950 }}>
                {item.current} / {item.required}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800 }}>
                {item.missing > 0
                  ? `${item.missing} kişi eksik`
                  : item.leaders === 0
                    ? "Ekip lideri eksik"
                    : "Yeterli"}
              </div>
            </article>
          ))}
        </div>

        {incomplete.length > 0 ? (
          <div style={{ border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", borderRadius: 13, padding: 12 }}>
            <AlertTriangle size={17} /> Destek ekiplerinde eksiklik bulunuyor: {incomplete
              .map((item) => {
                const parts = [];
                if (item.missing > 0) parts.push(`${item.missing} kişi`);
                if (item.leaders === 0) parts.push("lider");
                return `${item.label}: ${parts.join(" ve ")} eksik`;
              })
              .join(" · ")}
          </div>
        ) : (
          <div style={{ border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#047857", borderRadius: 13, padding: 12 }}>
            <CheckCircle2 size={17} /> Destek ekipleri yeterli.
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div style={{ minHeight: 240, display: "grid", placeItems: "center", textAlign: "center", color: "#94a3b8" }}>
          <div><ShieldCheck size={40} /><h3>Destek ekibi kaydı yok</h3></div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Ad Soyad", "Ekip", "Rol", "Görev", "Departman", "Telefon", "Sertifika", "İmza", "Durum", "İşlemler"].map((title) => (
                  <th key={title} style={{ padding: 12, textAlign: "left" }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((member) => (
                <tr key={member.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: 12 }}>
                    <strong>{member.fullName}</strong>
                    <div style={{ fontSize: 10, color: member.employeeId ? "#047857" : "#92400e" }}>
                      {member.employeeId ? "Firma çalışanı" : "Manuel kayıt"}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>{TEAM_LABELS[normalizeTeam(String(member.teamType))] || member.teamType}</td>
                  <td style={{ padding: 12 }}>{ROLE_LABELS[String(member.teamRole)] || member.teamRole}</td>
                  <td style={{ padding: 12 }}>{member.duty || "-"}</td>
                  <td style={{ padding: 12 }}>{member.department || "-"}</td>
                  <td style={{ padding: 12 }}>{member.phone || "-"}</td>
                  <td style={{ padding: 12 }}>{member.certificateInfo || "-"}</td>
                  <td style={{ padding: 12 }}><UserCheck size={13} /> {member.signatureStatus === "IMZALANDI" ? "İmzalandı" : "İmza Bekliyor"}</td>
                  <td style={{ padding: 12 }}>{member.isActive ? "Aktif" : "Pasif"}</td>
                  <td style={{ padding: 12 }}>
                    <button type="button" onClick={() => onEdit(member)}><Edit3 size={15} /></button>
                    <button type="button" onClick={() => onDelete(member)} disabled={deletingId === member.id}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .teamAnalysisGrid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          .teamAnalysisGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}