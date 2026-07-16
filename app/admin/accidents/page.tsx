"use client";

import { useEffect, useMemo, useState } from "react";

import { IncidentAnalyticsCenter } from "@/components/incident-v2/analytics";

import type { IncidentAnalyticsRecord } from "@/components/incident-v2/analytics";

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
  | "RECORDS"
  | "ANALYTICS";

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
      "RECORDS"
    );

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
          normalizeIncidentType(
            item.eventType
          ) === "WORK_ACCIDENT"
      ).length,

      nearMiss: rows.filter(
        (item) =>
          normalizeIncidentType(
            item.eventType
          ) === "NEAR_MISS"
      ).length,

      danger: rows.filter(
        (item) =>
          normalizeIncidentType(
            item.eventType
          ) ===
          "UNSAFE_CONDITION"
      ).length,

      totalLostDays,

      last30Count: rows.filter(
        (item) =>
          normalizeTimestamp(
            item.eventDate ||
              item.createdAt
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
          title="Kaza ve Olay Kayıtları"
          active={
            activeTab === "RECORDS"
          }
          onClick={() =>
            setActiveTab("RECORDS")
          }
        />

        <PageTabButton
          title="Analytics Merkezi"
          active={
            activeTab ===
            "ANALYTICS"
          }
          onClick={() =>
            setActiveTab(
              "ANALYTICS"
            )
          }
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
      ) : activeTab ===
        "ANALYTICS" ? (
        <IncidentAnalyticsCenter
          incidents={
            analyticsRecords
          }
          workedHours={0}
          employeeCount={0}
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
            <StatCard
              title="Toplam Kayıt"
              value={stats.total}
            />

            <StatCard
              title="İş Kazası"
              value={stats.accident}
            />

            <StatCard
              title="Ramak Kala"
              value={stats.nearMiss}
            />

            <StatCard
              title="Tehlikeli Durum"
              value={stats.danger}
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

function normalizeIncidentType(
  value?: string | null
) {
  const type = String(
    value || ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (
    type === "KAZA" ||
    type === "İŞ_KAZASI" ||
    type === "IS_KAZASI" ||
    type === "WORK_ACCIDENT"
  ) {
    return "WORK_ACCIDENT";
  }

  if (
    type === "RAMAK_KALA" ||
    type === "NEAR_MISS"
  ) {
    return "NEAR_MISS";
  }

  if (
    type ===
      "TEHLIKELI_DURUM" ||
    type ===
      "TEHLİKELİ_DURUM" ||
    type ===
      "UNSAFE_CONDITION"
  ) {
    return "UNSAFE_CONDITION";
  }

  if (
    type ===
      "MESLEK_HASTALIGI" ||
    type ===
      "MESLEK_HASTALIĞI" ||
    type ===
      "OCCUPATIONAL_DISEASE"
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