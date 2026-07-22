"use client";

import {
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

import type { EmergencySupportMember } from "../types";

type Props = {
  data: EmergencySupportMember[];
  deletingId?: string;
  onAdd: () => void;
  onEdit: (member: EmergencySupportMember) => void;
  onDelete: (member: EmergencySupportMember) => void;
};

const TEAM_LABELS: Record<string, string> = {
  YANGIN: "Yangınla Mücadele",
  ARAMA_KURTARMA: "Arama ve Kurtarma",
  TAHLİYE: "Tahliye",
  ILK_YARDIM: "İlk Yardım",
  KORUMA: "Koruma",
  HABERLESME: "Haberleşme",
};

const ROLE_LABELS: Record<string, string> = {
  EKIP_LIDERI: "Ekip Lideri",
  EKIP_UYESI: "Ekip Üyesi",
  YEDEK_UYE: "Yedek Üye",
};

export default function SupportTeamTable({
  data,
  deletingId = "",
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          padding: 18,
          borderBottom: "1px solid #eef2f7",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: 19,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Users size={20} color="#047857" />
            Acil Durum Destek Ekipleri
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            {data.length} ekip üyesi kayıtlı
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={{
            minHeight: 42,
            borderRadius: 12,
            border: 0,
            background: "#047857",
            color: "#ffffff",
            padding: "0 15px",
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Plus size={17} />
          Yeni Üye
        </button>
      </div>

      {data.length === 0 ? (
        <div
          style={{
            minHeight: 280,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
            padding: 24,
          }}
        >
          <div>
            <ShieldCheck size={40} />
            <h3
              style={{
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Destek ekibi kaydı yok
            </h3>
            <p style={{ margin: 0 }}>
              Yeni ekip üyesi ekleyerek başlayın.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1050,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "Ad Soyad",
                  "Ekip",
                  "Rol",
                  "Görev",
                  "Departman",
                  "Telefon",
                  "Sertifika",
                  "İmza",
                  "Durum",
                  "İşlemler",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 900,
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((member) => (
                <tr
                  key={member.id}
                  style={{
                    borderBottom: "1px solid #eef2f7",
                  }}
                >
                  <td style={{ padding: 14 }}>
                    <div
                      style={{
                        color: "#0f172a",
                        fontWeight: 900,
                      }}
                    >
                      {member.fullName}
                    </div>

                    {member.employeeId ? (
                      <div
                        style={{
                          marginTop: 4,
                          color: "#94a3b8",
                          fontSize: 11,
                        }}
                      >
                        Çalışan ID: {member.employeeId}
                      </div>
                    ) : null}
                  </td>

                  <td style={{ padding: 14 }}>
                    {TEAM_LABELS[member.teamType] || member.teamType}
                  </td>

                  <td style={{ padding: 14 }}>
                    {ROLE_LABELS[member.teamRole] || member.teamRole}
                  </td>

                  <td style={{ padding: 14 }}>
                    {member.duty || "-"}
                  </td>

                  <td style={{ padding: 14 }}>
                    {member.department || "-"}
                  </td>

                  <td style={{ padding: 14 }}>
                    {member.phone || "-"}
                  </td>

                  <td style={{ padding: 14 }}>
                    {member.certificateInfo || "-"}
                  </td>

                  <td style={{ padding: 14 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 999,
                        padding: "5px 9px",
                        background:
                          member.signatureStatus === "IMZALANDI"
                            ? "#ecfdf5"
                            : "#fffbeb",
                        color:
                          member.signatureStatus === "IMZALANDI"
                            ? "#047857"
                            : "#92400e",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      <UserCheck size={13} />
                      {member.signatureStatus === "IMZALANDI"
                        ? "İmzalandı"
                        : "İmza Bekliyor"}
                    </span>
                  </td>

                  <td style={{ padding: 14 }}>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 9px",
                        background: member.isActive
                          ? "#ecfdf5"
                          : "#f1f5f9",
                        color: member.isActive
                          ? "#047857"
                          : "#64748b",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      {member.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>

                  <td style={{ padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        title="Düzenle"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "1px solid #dbe3ec",
                          background: "#ffffff",
                          color: "#475569",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(member)}
                        disabled={deletingId === member.id}
                        title="Sil"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          display: "grid",
                          placeItems: "center",
                          cursor:
                            deletingId === member.id
                              ? "wait"
                              : "pointer",
                          opacity:
                            deletingId === member.id
                              ? 0.6
                              : 1,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}