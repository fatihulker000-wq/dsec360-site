"use client";

import {
  AlertTriangle,
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

import type {
  EmergencySupportMember,
  EmergencyTeamType,
} from "../types";

type DangerClass =
  | "AZ_TEHLIKELI"
  | "TEHLIKELI"
  | "COK_TEHLIKELI";

type StandardTeamType =
  | "ARAMA_KURTARMA"
  | "YANGIN"
  | "ILK_YARDIM"
  | "KORUMA";

type Props = {
  data: EmergencySupportMember[];
  employeeCount: number;
  dangerClass: DangerClass;
  deletingId?: string;
  onAdd: () => void;
  onEdit: (
    member: EmergencySupportMember
  ) => void;
  onDelete: (
    member: EmergencySupportMember
  ) => void;
};

type TeamDefinition = {
  type: StandardTeamType;
  title: string;
  description: string;
};

const TEAM_DEFINITIONS: TeamDefinition[] = [
  {
    type: "ARAMA_KURTARMA",
    title:
      "Arama, Kurtarma ve Tahliye",
    description:
      "Acil durumda arama, kurtarma ve güvenli tahliye işlemlerini yürütür.",
  },
  {
    type: "YANGIN",
    title: "Yangınla Mücadele",
    description:
      "Yangına ilk müdahale ve söndürme çalışmalarını yürütür.",
  },
  {
    type: "ILK_YARDIM",
    title: "İlk Yardım",
    description:
      "Yaralanan veya sağlık sorunu yaşayan kişilere ilk yardım uygular.",
  },
  {
    type: "KORUMA",
    title: "Koruma Ekibi",
    description:
      "Acil durum alanının güvenliğini sağlar ve izinsiz girişleri engeller.",
  },
];

function normalizeTeamType(
  value: EmergencyTeamType | string
): StandardTeamType {
  const normalized = String(value || "")
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (
    normalized ===
      "ARAMA_KURTARMA" ||
    normalized ===
      "ARAMA_KURTARMA_TAHLIYE" ||
    normalized ===
      "ARAMA_KURTARMA_TAHLİYE" ||
    normalized === "TAHLIYE" ||
    normalized === "TAHLİYE"
  ) {
    return "ARAMA_KURTARMA";
  }

  if (
    normalized === "YANGIN" ||
    normalized ===
      "YANGINLA_MUCADELE" ||
    normalized ===
      "YANGINLA_MÜCADELE"
  ) {
    return "YANGIN";
  }

  if (
    normalized === "ILKYARDIM" ||
    normalized === "ILK_YARDIM"
  ) {
    return "ILK_YARDIM";
  }

  if (
    normalized === "KORUMA" ||
    normalized ===
      "KORUMA_EKIBI" ||
    normalized ===
      "KORUMA_EKİBİ" ||
    normalized ===
      "HABERLESME"
  ) {
    return "KORUMA";
  }

  return "ARAMA_KURTARMA";
}

function getRoleLabel(
  role:
    EmergencySupportMember["teamRole"]
): string {
  switch (role) {
    case "EKIP_LIDERI":
      return "Ekip Lideri";

    case "YEDEK_UYE":
      return "Yedek Üye";

    case "EKIP_UYESI":
    default:
      return "Ekip Üyesi";
  }
}

function getSignatureLabel(
  status:
    EmergencySupportMember["signatureStatus"]
): string {
  return status === "IMZALANDI"
    ? "İmzalandı"
    : "İmza Bekliyor";
}

function calculateRequiredMemberCount(
  employeeCount: number,
  dangerClass: DangerClass
): number {
  const count = Math.max(
    0,
    Number(employeeCount || 0)
  );

  if (count === 0) {
    return 0;
  }

  if (
    dangerClass ===
    "COK_TEHLIKELI"
  ) {
    return Math.max(
      1,
      Math.ceil(count / 30)
    );
  }

  if (
    dangerClass === "TEHLIKELI"
  ) {
    return Math.max(
      1,
      Math.ceil(count / 40)
    );
  }

  return Math.max(
    1,
    Math.ceil(count / 50)
  );
}

function getDangerClassLabel(
  dangerClass: DangerClass
): string {
  switch (dangerClass) {
    case "COK_TEHLIKELI":
      return "Çok Tehlikeli";

    case "TEHLIKELI":
      return "Tehlikeli";

    case "AZ_TEHLIKELI":
    default:
      return "Az Tehlikeli";
  }
}

export default function SupportTeamTable({
  data,
  employeeCount,
  dangerClass,
  deletingId = "",
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const activeMembers =
    data.filter(
      (member) =>
        member.isActive !== false
    );

  const requiredMemberCount =
    calculateRequiredMemberCount(
      employeeCount,
      dangerClass
    );

  const signedMemberCount =
    activeMembers.filter(
      (member) =>
        member.signatureStatus ===
        "IMZALANDI"
    ).length;

  return (
    <section
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <header
        style={{
          borderRadius: 18,
          border:
            "1px solid #dbe3ec",
          background: "#ffffff",
          padding: 16,
          display: "flex",
          flexWrap: "wrap",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#0f172a",
              fontSize: 19,
              fontWeight: 950,
            }}
          >
            <ShieldCheck
              size={20}
            />
            Acil Durum Destek
            Ekipleri
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: "#64748b",
              fontSize: 12,
            }}
          >
            Çalışan sayısı:{" "}
            <strong>
              {employeeCount}
            </strong>
            {" · "}
            Tehlike sınıfı:{" "}
            <strong>
              {getDangerClassLabel(
                dangerClass
              )}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={{
            minHeight: 43,
            borderRadius: 12,
            border: 0,
            background: "#047857",
            color: "#ffffff",
            padding: "0 15px",
            fontWeight: 900,
            display:
              "inline-flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <Plus size={17} />
          Ekip Üyesi Ekle
        </button>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: 10,
        }}
      >
        <SummaryCard
          icon={
            <Users size={18} />
          }
          title="Toplam Kayıt"
          value={data.length}
        />

        <SummaryCard
          icon={
            <UserCheck
              size={18}
            />
          }
          title="Aktif Üye"
          value={
            activeMembers.length
          }
        />

        <SummaryCard
          icon={
            <ShieldCheck
              size={18}
            />
          }
          title="İmzalanan"
          value={signedMemberCount}
        />

        <SummaryCard
          icon={
            <AlertTriangle
              size={18}
            />
          }
          title="Ekip Başına Asgari"
          value={
            requiredMemberCount
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 14,
        }}
        className="supportTeamCardsGrid"
      >
        {TEAM_DEFINITIONS.map(
          (team) => {
            const teamMembers =
              data.filter(
                (member) =>
                  normalizeTeamType(
                    member.teamType
                  ) === team.type
              );

            const activeTeamMembers =
              teamMembers.filter(
                (member) =>
                  member.isActive !==
                  false
              );

            const missingCount =
              Math.max(
                0,
                requiredMemberCount -
                  activeTeamMembers.length
              );

            return (
              <article
                key={team.type}
                style={{
                  borderRadius: 18,
                  border:
                    missingCount > 0
                      ? "1px solid #fcd34d"
                      : "1px solid #bbf7d0",
                  background:
                    missingCount > 0
                      ? "#fffbeb"
                      : "#f0fdf4",
                  overflow: "hidden",
                }}
              >
                <header
                  style={{
                    padding: 14,
                    borderBottom:
                      missingCount >
                      0
                        ? "1px solid #fde68a"
                        : "1px solid #bbf7d0",
                    background:
                      "#ffffff",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: 10,
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        color:
                          "#0f172a",
                        fontSize: 16,
                        fontWeight: 950,
                      }}
                    >
                      {team.title}
                    </h4>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#64748b",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      {
                        team.description
                      }
                    </p>
                  </div>

                  <div
                    style={{
                      minWidth: 48,
                      height: 36,
                      borderRadius: 10,
                      background:
                        missingCount >
                        0
                          ? "#fef3c7"
                          : "#dcfce7",
                      color:
                        missingCount >
                        0
                          ? "#92400e"
                          : "#166534",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      fontWeight: 950,
                    }}
                  >
                    {
                      activeTeamMembers.length
                    }
                  </div>
                </header>

                {missingCount > 0 ? (
                  <div
                    style={{
                      margin:
                        "12px 12px 0",
                      borderRadius: 11,
                      border:
                        "1px solid #fde68a",
                      background:
                        "#ffffff",
                      color:
                        "#92400e",
                      padding:
                        "9px 10px",
                      display: "flex",
                      gap: 7,
                      alignItems:
                        "center",
                      fontSize: 11,
                      fontWeight: 850,
                    }}
                  >
                    <AlertTriangle
                      size={15}
                    />
                    En az{" "}
                    {
                      requiredMemberCount
                    }{" "}
                    aktif üye
                    öneriliyor.{" "}
                    {missingCount} üye
                    eksik.
                  </div>
                ) : null}

                <div
                  style={{
                    padding: 12,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {teamMembers.length ===
                  0 ? (
                    <div
                      style={{
                        minHeight: 105,
                        borderRadius: 12,
                        border:
                          "1px dashed #cbd5e1",
                        background:
                          "#ffffff",
                        color:
                          "#64748b",
                        display:
                          "grid",
                        placeItems:
                          "center",
                        textAlign:
                          "center",
                        padding: 14,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      Bu ekip için
                      henüz üye
                      eklenmedi.
                    </div>
                  ) : (
                    teamMembers.map(
                      (member) => (
                        <MemberRow
                          key={
                            member.id
                          }
                          member={
                            member
                          }
                          deleting={
                            deletingId ===
                            member.id
                          }
                          onEdit={
                            onEdit
                          }
                          onDelete={
                            onDelete
                          }
                        />
                      )
                    )
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .supportTeamCardsGrid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        borderRadius: 15,
        border:
          "1px solid #e2e8f0",
        background: "#ffffff",
        padding: 13,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: "#f1f5f9",
          color: "#475569",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#64748b",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 2,
            color: "#0f172a",
            fontSize: 21,
            fontWeight: 950,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  deleting,
  onEdit,
  onDelete,
}: {
  member: EmergencySupportMember;
  deleting: boolean;
  onEdit: (
    member: EmergencySupportMember
  ) => void;
  onDelete: (
    member: EmergencySupportMember
  ) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border:
          "1px solid #e2e8f0",
        background: "#ffffff",
        padding: 11,
        display: "grid",
        gap: 9,
        opacity:
          member.isActive === false
            ? 0.65
            : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 950,
            }}
          >
            {member.fullName ||
              "İsimsiz üye"}
          </div>

          <div
            style={{
              marginTop: 3,
              color: "#64748b",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            {member.duty ||
              "Görev belirtilmedi"}

            {member.department
              ? ` · ${member.department}`
              : ""}
          </div>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "5px 8px",
            background:
              member.isActive ===
              false
                ? "#f1f5f9"
                : "#dcfce7",
            color:
              member.isActive ===
              false
                ? "#64748b"
                : "#166534",
            fontSize: 10,
            fontWeight: 900,
            whiteSpace:
              "nowrap",
          }}
        >
          {member.isActive ===
          false
            ? "Pasif"
            : "Aktif"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <Badge
          text={getRoleLabel(
            member.teamRole
          )}
        />

        <Badge
          text={getSignatureLabel(
            member.signatureStatus
          )}
        />

        {member.phone ? (
          <Badge
            text={member.phone}
          />
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: 7,
        }}
      >
        <button
          type="button"
          onClick={() =>
            onEdit(member)
          }
          style={{
            minHeight: 34,
            borderRadius: 9,
            border:
              "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "0 10px",
            display:
              "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 850,
            cursor: "pointer",
          }}
        >
          <Edit3 size={14} />
          Düzenle
        </button>

        <button
          type="button"
          disabled={deleting}
          onClick={() =>
            onDelete(member)
          }
          style={{
            minHeight: 34,
            borderRadius: 9,
            border:
              "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "0 10px",
            display:
              "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 850,
            cursor: deleting
              ? "wait"
              : "pointer",
            opacity: deleting
              ? 0.65
              : 1,
          }}
        >
          <Trash2 size={14} />
          {deleting
            ? "Siliniyor"
            : "Sil"}
        </button>
      </div>
    </div>
  );
}

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "4px 7px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}