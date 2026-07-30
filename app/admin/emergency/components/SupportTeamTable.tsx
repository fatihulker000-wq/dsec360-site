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
  | "ISVEREN_VEKILI"
  | "ACIL_DURUM_KOORDINATORU"
  | "KORUMA"
  | "ARAMA_KURTARMA_TAHLIYE"
  | "YANGIN"
  | "ILK_YARDIM"
  | "HABERLESME";

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
  requirementType:
    | "SINGLE"
    | "CALCULATED";
};

const TEAM_DEFINITIONS: TeamDefinition[] = [
  {
    type: "ISVEREN_VEKILI",
    title:
      "İşveren / İşveren Vekili",
    description:
      "Acil durum yönetiminin en üst sorumlusudur ve organizasyonun yürütülmesini sağlar.",
    requirementType: "SINGLE",
  },
  {
    type:
      "ACIL_DURUM_KOORDINATORU",
    title:
      "Acil Durum Koordinatörü",
    description:
      "Acil durum ekipleri arasındaki yönetim, iletişim ve koordinasyonu yürütür.",
    requirementType: "SINGLE",
  },
  {
    type: "KORUMA",
    title: "Koruma Ekibi",
    description:
      "Acil durum alanının güvenliğini sağlar ve izinsiz girişleri engeller.",
    requirementType: "CALCULATED",
  },
  {
    type:
      "ARAMA_KURTARMA_TAHLIYE",
    title:
      "Arama, Kurtarma ve Tahliye Ekibi",
    description:
      "Acil durumda arama, kurtarma ve güvenli tahliye faaliyetlerini yürütür.",
    requirementType: "CALCULATED",
  },
  {
    type: "YANGIN",
    title:
      "Yangınla Mücadele Ekibi",
    description:
      "Yangına ilk müdahale ve söndürme çalışmalarını yürütür.",
    requirementType: "CALCULATED",
  },
  {
    type: "ILK_YARDIM",
    title: "İlk Yardım Ekibi",
    description:
      "Yaralanan veya sağlık sorunu yaşayan kişilere ilk yardım uygular.",
    requirementType: "CALCULATED",
  },
  {
    type: "HABERLESME",
    title: "Haberleşme Ekibi",
    description:
      "Acil durum sırasında kurum içi ve kurum dışı haberleşme faaliyetlerini yürütür.",
    requirementType: "SINGLE",
  },
];

function normalizeTeamType(
  value:
    | EmergencyTeamType
    | string
    | null
    | undefined
): StandardTeamType {
  const normalized = String(
    value || ""
  )
    .trim()
    .toLocaleUpperCase("tr-TR");

  switch (normalized) {
    case "ISVEREN_VEKILI":
    case "İŞVEREN_VEKİLİ":
    case "ISVEREN":
    case "İŞVEREN":
      return "ISVEREN_VEKILI";

    case "ACIL_DURUM_KOORDINATORU":
    case "ACİL_DURUM_KOORDİNATÖRÜ":
    case "ACIL_DURUM_KOORDİNATORU":
    case "ACIL_DURUM_KOORDINATÖRÜ":
      return "ACIL_DURUM_KOORDINATORU";

    case "ARAMA_KURTARMA":
    case "ARAMA_KURTARMA_TAHLIYE":
    case "ARAMA_KURTARMA_TAHLİYE":
    case "KURTARMA_TAHLIYE":
    case "KURTARMA_TAHLİYE":
    case "TAHLIYE":
    case "TAHLİYE":
      return "ARAMA_KURTARMA_TAHLIYE";

    case "YANGIN":
    case "YANGIN_EKIBI":
    case "YANGIN_EKİBİ":
    case "YANGINLA_MUCADELE":
    case "YANGINLA_MÜCADELE":
      return "YANGIN";

    case "ILKYARDIM":
    case "İLKYARDIM":
    case "ILK_YARDIM":
    case "İLK_YARDIM":
    case "ILK_YARDIM_EKIBI":
    case "İLK_YARDIM_EKİBİ":
      return "ILK_YARDIM";

    case "KORUMA":
    case "KORUMA_EKIBI":
    case "KORUMA_EKİBİ":
      return "KORUMA";

    case "HABERLESME":
    case "HABERLEŞME":
    case "HABERLESME_EKIBI":
    case "HABERLEŞME_EKİBİ":
      return "HABERLESME";

    default:
      return "ARAMA_KURTARMA_TAHLIYE";
  }
}

function getRoleLabel(
  role: EmergencySupportMember["teamRole"]
): string {
  const normalizedRole = String(
    role || ""
  )
    .trim()
    .toUpperCase();

  switch (normalizedRole) {
    case "EKIP_LIDERI":
      return "Ekip Lideri";

    case "YARDIMCI_LIDER":
      return "Yardımcı Lider";

    case "ASIL_UYE":
      return "Asıl Üye";

    case "YEDEK_UYE":
      return "Yedek Üye";

    case "EKIP_UYESI":
    default:
      return "Ekip Üyesi";
  }
}

function getSignatureLabel(
  status: EmergencySupportMember["signatureStatus"]
): string {
  const normalizedStatus = String(
    status || ""
  )
    .trim()
    .toUpperCase();

  switch (normalizedStatus) {
    case "IMZALANDI":
      return "İmzalandı";

    case "REDDEDILDI":
      return "Reddedildi";

    case "GEREKMIYOR":
      return "İmza Gerekmiyor";

    case "IMZA_BEKLIYOR":
    default:
      return "İmza Bekliyor";
  }
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

function getTeamRequiredCount(
  team: TeamDefinition,
  calculatedCount: number
): number {
  if (
    team.requirementType ===
    "SINGLE"
  ) {
    return 1;
  }

  return calculatedCount;
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
  const visibleMembers = data;

  const activeMembers =
    visibleMembers.filter(
      (member) =>
        member.isActive !== false
    );

  const calculatedRequiredCount =
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
          value={
            visibleMembers.length
          }
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
            calculatedRequiredCount
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
              visibleMembers.filter(
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

            const requiredCount =
              getTeamRequiredCount(
                team,
                calculatedRequiredCount
              );

            const missingCount =
              Math.max(
                0,
                requiredCount -
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
                    {requiredCount}{" "}
                    aktif kayıt
                    öneriliyor.{" "}

                    {missingCount} kayıt
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
                      Bu bölüm için
                      henüz kayıt
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