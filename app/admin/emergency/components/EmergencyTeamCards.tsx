"use client";

import {
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";

import type {
  EmergencySupportMember,
} from "../../../../lib/emergency/types";

type Props = {
  teams: EmergencySupportMember[];
  companyName: string;
  planNo?: string;
  revisionNo?: string;
  onPrint: () => void;
};

const TEAM_ORDER = [
  "YANGIN",
  "ARAMA_KURTARMA",
  "TAHLIYE",
  "TAHLİYE",
  "ILKYARDIM",
  "ILK_YARDIM",
  "KORUMA",
  "HABERLESME",
];

const TEAM_LABELS: Record<string, string> = {
  YANGIN: "Yangınla Mücadele Ekibi",
  ARAMA_KURTARMA: "Arama ve Kurtarma Ekibi",
  TAHLIYE: "Tahliye Ekibi",
  "TAHLİYE": "Tahliye Ekibi",
  ILKYARDIM: "İlk Yardım Ekibi",
  ILK_YARDIM: "İlk Yardım Ekibi",
  KORUMA: "Koruma Ekibi",
  HABERLESME: "Haberleşme Ekibi",
};

const ROLE_LABELS: Record<string, string> = {
  EKIP_LIDERI: "Ekip Lideri",
  EKIP_UYESI: "Ekip Üyesi",
  YEDEK_UYE: "Yedek Üye",
};

function normalizeTeamType(value: string) {
  if (value === "TAHLİYE") return "TAHLIYE";
  if (value === "ILK_YARDIM") return "ILKYARDIM";
  return value;
}

export default function EmergencyTeamCards({
  teams,
  companyName,
  planNo = "",
  revisionNo = "R0",
  onPrint,
}: Props) {
  const activeTeams = teams.filter(
    (member) => member.isActive
  );

  const grouped = TEAM_ORDER
    .filter(
      (type, index, array) =>
        array.indexOf(type) === index
    )
    .map((type) => {
      const members = activeTeams.filter(
        (member) =>
          normalizeTeamType(
            String(member.teamType)
          ) === normalizeTeamType(type)
      );

      return {
        type,
        title:
          TEAM_LABELS[type] ||
          type,
        members,
      };
    });

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
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 950,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Users
              size={19}
              color="#7f1d1d"
            />
            Kurumsal Acil Durum Ekip
            Tabloları
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: "#64748b",
              fontSize: 12,
            }}
          >
            {companyName || "Firma"} ·
            Plan No: {planNo || "-"} ·
            Revizyon: {revisionNo}
          </p>
        </div>

        <button
          type="button"
          onClick={onPrint}
          style={{
            minHeight: 42,
            borderRadius: 11,
            border: 0,
            background: "#7f1d1d",
            color: "#ffffff",
            padding: "0 14px",
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <FileText size={16} />
          Ekip Tablolarını PDF Al
        </button>
      </header>

      {grouped.map((group) => (
        <article
          key={group.type}
          style={{
            borderRadius: 18,
            border:
              "1px solid #dbe3ec",
            background: "#ffffff",
            overflow: "hidden",
            boxShadow:
              "0 10px 28px rgba(15,23,42,.04)",
          }}
        >
          <div
            style={{
              padding: "13px 15px",
              background: "#7f1d1d",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 10,
            }}
          >
            <strong
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <ShieldCheck size={17} />
              {group.title}
            </strong>

            <span
              style={{
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              {group.members.length} kişi
            </span>
          </div>

          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 1050,
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                  }}
                >
                  {[
                    "Sıra",
                    "Ad Soyad",
                    "Şirket İçi Görevi",
                    "Departman",
                    "Ekip Görevi",
                    "Telefon",
                    "Sertifika",
                    "İmza",
                  ].map((title) => (
                    <th
                      key={title}
                      style={{
                        padding:
                          "11px 12px",
                        textAlign: "left",
                        borderBottom:
                          "1px solid #e5e7eb",
                        color: "#475569",
                        fontSize: 11,
                        fontWeight: 900,
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {group.members.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 20,
                        color: "#94a3b8",
                        textAlign: "center",
                      }}
                    >
                      Bu ekip için kayıtlı
                      üye bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  group.members.map(
                    (member, index) => (
                      <tr
                        key={member.id}
                        style={{
                          borderBottom:
                            "1px solid #eef2f7",
                        }}
                      >
                        <td
                          style={{
                            padding: 12,
                            fontWeight: 850,
                          }}
                        >
                          {index + 1}
                        </td>

                        <td
                          style={{
                            padding: 12,
                            fontWeight: 900,
                          }}
                        >
                          {member.fullName}
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {member.duty || "-"}
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {member.department ||
                            "-"}
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {ROLE_LABELS[
                            member.teamRole
                          ] ||
                            member.teamRole}
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {member.phone || "-"}
                        </td>

                        <td
                          style={{
                            padding: 12,
                          }}
                        >
                          {member.certificateInfo ||
                            "-"}
                        </td>

                        <td
                          style={{
                            width: 150,
                            minHeight: 56,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              height: 38,
                              borderBottom:
                                "1px solid #94a3b8",
                            }}
                          />
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: 14,
              display: "grid",
              gridTemplateColumns:
                "repeat(3,minmax(0,1fr))",
              gap: 12,
              background: "#f8fafc",
            }}
          >
            {[
              "Ekip Lideri / İmza",
              "İSG Uzmanı / İmza",
              "İşveren Yetkilisi / Kaşe-İmza",
            ].map((label) => (
              <div
                key={label}
                style={{
                  minHeight: 82,
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: 10,
                  background: "#ffffff",
                  padding: 9,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 850,
                  color: "#475569",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}