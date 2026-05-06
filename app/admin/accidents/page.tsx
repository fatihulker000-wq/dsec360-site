"use client";

import { useEffect, useMemo, useState } from "react";

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
  app_record_id?: number | string | null;
  name?: string | null;
  title?: string | null;
  company_name?: string | null;
  localId?: number | null;
};

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
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AccidentRow[]>([]);
  const [error, setError] = useState("");
  const [selectedRow, setSelectedRow] = useState<AccidentRow | null>(null);
  const [editRow, setEditRow] = useState<AccidentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
  selectedFirmId === "all"
    ? "/api/admin/accidents"
    : `/api/admin/accidents?firmId=${encodeURIComponent(selectedFirmId)}`;

    const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Veriler alınamadı");
      }

      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (err: any) {
      setError(err?.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
  if (!editRow) return;

  try {
    setSaving(true);

    const res = await fetch("/api/admin/accidents/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editRow),
    });

    const json = await res.json();

    if (!res.ok || !json?.success) {
      throw new Error(json?.error || "Güncelleme yapılamadı");
    }

    setEditRow(null);
    setSelectedRow(null);
    await loadData();
  } catch (err: any) {
    alert(err?.message || "Güncelleme hatası");
  } finally {
    setSaving(false);
  }
};

const passiveDelete = async (id: number) => {
  const ok = window.confirm("Bu kayıt pasifleştirilecek. Devam edilsin mi?");
  if (!ok) return;

  try {
    setDeleting(true);

    const res = await fetch("/api/admin/accidents/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!res.ok || !json?.success) {
      throw new Error(json?.error || "Kayıt pasifleştirilemedi");
    }

    setSelectedRow(null);
    await loadData();
  } catch (err: any) {
    alert(err?.message || "Silme hatası");
  } finally {
    setDeleting(false);
  }
};

const loadCompanies = async () => {
  try {
    const res = await fetch("/api/admin/companies", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));
    const list = json?.data || json?.rows || json?.companies || [];

    const normalized = (Array.isArray(list) ? list : []).map((firm: any) => {
      const name = String(firm.name || firm.title || firm.company_name || "").trim();

      return {
        id: firm.id,
        name,

        // GEÇİCİ KÖPRÜ: accident_records.firm_id şu an BIGINT olduğu için
        // firmaları web şirket adıyla local firma ID’ye bağlıyoruz.
        localId:
          name === "App Yazılım"
            ? 1
            : name === "Ülker Danışmanlık"
            ? 1033038177
            : null,
      };
    });

    setCompanies(normalized);
  } catch {
    setCompanies([]);
  }
};


useEffect(() => {
  void loadCompanies();
}, []);
  
  useEffect(() => {
  void loadData();
}, [selectedFirmId]);

  
  const stats = useMemo(() => {
    const last30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const totalLostDays = rows.reduce((sum, x) => sum + Number(x.lostWorkDays || 0), 0);

    const departmentMap = new Map<string, number>();
    const rootMap = new Map<string, number>();

    rows.forEach((x) => {
      const dep = x.department?.trim() || "Belirtilmemiş";
      const root = x.rootCauseCategory?.trim() || "Belirtilmemiş";

      departmentMap.set(dep, (departmentMap.get(dep) || 0) + 1);
      rootMap.set(root, (rootMap.get(root) || 0) + 1);
    });

    const topDepartment =
      [...departmentMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const topRoot =
      [...rootMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total: rows.length,
      accident: rows.filter((x) => x.eventType === "KAZA").length,
      nearMiss: rows.filter((x) => x.eventType === "RAMAK_KALA").length,
      danger: rows.filter((x) => x.eventType === "TEHLIKELI_DURUM").length,
      totalLostDays,
      last30Count: rows.filter((x) => Number(x.eventDate || 0) >= last30).length,
      topDepartment,
      topRoot,
    };
  }, [rows]);

  const departmentRows = useMemo(() => groupRows(rows, "department"), [rows]);
  const rootRows = useMemo(() => groupRows(rows, "rootCauseCategory"), [rows]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 60%, ${BRAND.redBright} 100%)`,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.85, marginBottom: 8 }}>
          D-SEC Kaza Merkezi
        </div>
        <div style={{ fontSize: 36, fontWeight: 950, lineHeight: 1.1 }}>
          Kaza ve Olay Yönetimi
        </div>
        <div style={{ marginTop: 10, fontSize: 15, opacity: 0.92, maxWidth: 900 }}>
          İş kazaları, ramak kala kayıtları, olay bildirimleri ve tehlikeli durum kayıtlarını merkezi olarak yönetin.
        </div>
      </div>

      <div
  style={{
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    border: `1px solid ${BRAND.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  }}
>
  <div>
    <div style={{ fontSize: 13, color: BRAND.muted, fontWeight: 800 }}>
      Firma Filtresi
    </div>
    <div style={{ fontSize: 16, color: BRAND.text, fontWeight: 950 }}>
      Süper Admin kayıt görünümü
    </div>
  </div>

  <select
    value={selectedFirmId}
    onChange={(e) => setSelectedFirmId(e.target.value)}
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
    <option value="all">Tüm Firmalar</option>
    {companies.map((firm) => (
  <option
    key={String(firm.id)}
    value={String(firm.localId || firm.id)}
  >
    {firm.name || firm.title || firm.company_name || `Firma #${firm.id}`}
  </option>
))}
  </select>
</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16 }}>
        <StatCard title="Toplam Kayıt" value={stats.total} />
        <StatCard title="İş Kazası" value={stats.accident} />
        <StatCard title="Ramak Kala" value={stats.nearMiss} />
        <StatCard title="Tehlikeli Durum" value={stats.danger} />
        <StatCard title="Toplam Kayıp Gün" value={stats.totalLostDays} color={BRAND.redBright} />
        <StatCard title="Son 30 Gün" value={stats.last30Count} color={BRAND.blue} />
        <StatCard title="Riskli Departman" valueText={stats.topDepartment} color={BRAND.amber} />
        <StatCard title="Sık Kök Neden" valueText={stats.topRoot} color={BRAND.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <MiniPanel title="Departman Dağılımı" rows={departmentRows} />
        <MiniPanel title="Kök Neden Dağılımı" rows={rootRows} />
      </div>

      <div style={{ background: "#fff", borderRadius: 20, padding: 18, border: `1px solid ${BRAND.border}`, overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 20, fontWeight: 800 }}>Veriler yükleniyor...</div>
        ) : error ? (
          <div style={{ padding: 20, color: "#b91c1c", fontWeight: 800 }}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: BRAND.muted, fontWeight: 700 }}>
            Henüz kayıt bulunmuyor.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
            <thead>
              <tr style={{ background: "#faf5f5" }}>
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
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                  <Td>{row.title || "-"}</Td>
                  <Td>{row.employeeName || "-"}</Td>
                  <Td><TypeBadge type={row.eventType || "-"} /></Td>
                  <Td>{row.location || "-"}</Td>
                  <Td><SeverityBadge value={Number(row.severity ?? 0)} /></Td>
                  <Td>{formatDate(row.eventDate)}</Td>
                  <Td>{row.lostWorkDays ?? 0}</Td>
                  <Td>{row.department || "-"}</Td>
                  <Td>{row.shift || "-"}</Td>
                  <Td>{row.injuryType || row.injuryBodyPart || "-"}</Td>
                  <Td>{row.rootCauseCategory || "-"}</Td>
                  <Td>
                    <button
                      onClick={() => setSelectedRow(row)}
                      style={{
                        border: "none",
                        borderRadius: 999,
                        padding: "8px 12px",
                        background: BRAND.redBright,
                        color: "#fff",
                        fontWeight: 800,
                        cursor: "pointer",
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
          onClick={() => setSelectedRow(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 22,
              padding: 22,
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 950 }}>{selectedRow.title || "Kaza/Olay Detayı"}</div>
                <div style={{ marginTop: 6, color: BRAND.muted }}>
                  {selectedRow.employeeName || "-"} • {formatDate(selectedRow.eventDate)}
                </div>
              </div>

<button
  onClick={() => setEditRow(selectedRow)}
  style={{
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: BRAND.blue,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  }}
>
  Düzenle
</button>

<button
  onClick={() => passiveDelete(selectedRow.id)}
  disabled={deleting}
  style={{
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: deleting ? "not-allowed" : "pointer",
  }}
>
  {deleting ? "İşleniyor..." : "Pasifleştir"}
</button>

              <button
                onClick={() => setSelectedRow(null)}
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
                Kapat
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <Detail label="Tür" value={selectedRow.eventType} />
              <Detail label="Lokasyon" value={selectedRow.location} />
              <Detail label="Şiddet" value={String(selectedRow.severity ?? "-")} />
              <Detail label="Kayıp Gün" value={String(selectedRow.lostWorkDays ?? 0)} />
              <Detail label="Departman" value={selectedRow.department} />
              <Detail label="Vardiya" value={selectedRow.shift} />
              <Detail label="Yaralanan Bölge" value={selectedRow.injuryBodyPart} />
              <Detail label="Yaralanma Türü" value={selectedRow.injuryType} />
              <Detail label="Kök Neden" value={selectedRow.rootCauseCategory} />
              <Detail label="Olay Saati" value={selectedRow.eventHour != null ? `${selectedRow.eventHour}:00` : "-"} />
              <Detail label="Haftanın Günü" value={selectedRow.eventWeekDay} />
              <Detail label="Kaynak" value={selectedRow.source} />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.muted, marginBottom: 8 }}>
                Açıklama
              </div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, background: "#f9fafb", borderRadius: 16, padding: 14 }}>
                {selectedRow.description || "-"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

{editRow ? (
  <div
    onClick={() => setEditRow(null)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.45)",
      zIndex: 10000,
      display: "grid",
      placeItems: "center",
      padding: 20,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "min(920px, 100%)",
        maxHeight: "90vh",
        overflow: "auto",
        background: "#fff",
        borderRadius: 22,
        padding: 22,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 950, marginBottom: 16 }}>
        Kaza / Olay Kaydı Düzenle
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <EditField label="Başlık" value={editRow.title || ""} onChange={(v) => setEditRow({ ...editRow, title: v })} />
        <EditField label="Çalışan" value={editRow.employeeName || ""} onChange={(v) => setEditRow({ ...editRow, employeeName: v })} />
        <EditField label="Tür" value={editRow.eventType || ""} onChange={(v) => setEditRow({ ...editRow, eventType: v })} />
        <EditField label="Lokasyon" value={editRow.location || ""} onChange={(v) => setEditRow({ ...editRow, location: v })} />
        <EditField label="Şiddet" value={String(editRow.severity ?? 0)} onChange={(v) => setEditRow({ ...editRow, severity: Number(v || 0) })} />
        <EditField label="Kayıp Gün" value={String(editRow.lostWorkDays ?? 0)} onChange={(v) => setEditRow({ ...editRow, lostWorkDays: Number(v || 0) })} />
        <EditField label="Departman" value={editRow.department || ""} onChange={(v) => setEditRow({ ...editRow, department: v })} />
        <EditField label="Vardiya" value={editRow.shift || ""} onChange={(v) => setEditRow({ ...editRow, shift: v })} />
        <EditField label="Yaralanan Bölge" value={editRow.injuryBodyPart || ""} onChange={(v) => setEditRow({ ...editRow, injuryBodyPart: v })} />
        <EditField label="Yaralanma Türü" value={editRow.injuryType || ""} onChange={(v) => setEditRow({ ...editRow, injuryType: v })} />
        <EditField label="Kök Neden" value={editRow.rootCauseCategory || ""} onChange={(v) => setEditRow({ ...editRow, rootCauseCategory: v })} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 800, marginBottom: 6 }}>
          Açıklama
        </div>

        <textarea
          value={editRow.description || ""}
          onChange={(e) => setEditRow({ ...editRow, description: e.target.value })}
          rows={6}
          style={{
            width: "100%",
            border: `1px solid ${BRAND.border}`,
            borderRadius: 14,
            padding: 12,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
        <button
          onClick={() => setEditRow(null)}
          style={{
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#f3f4f6",
            color: BRAND.text,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Vazgeç
        </button>

        <button
          onClick={saveEdit}
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            background: BRAND.redBright,
            color: "#fff",
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  </div>
) : null}

    </div>
  );
}

function groupRows(rows: AccidentRow[], field: "department" | "rootCauseCategory") {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[field] || "Belirtilmemiş").trim() || "Belirtilmemiş";
    map.set(label, (map.get(label) || 0) + 1);
  });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}

function formatDate(value?: number | null) {
  return value ? new Date(value).toLocaleDateString("tr-TR") : "-";
}

function StatCard({ title, value, valueText, color = BRAND.text }: { title: string; value?: number; valueText?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 18, border: `1px solid ${BRAND.border}` }}>
      <div style={{ fontSize: 13, color: BRAND.muted, fontWeight: 800, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: valueText ? 20 : 30, fontWeight: 950, color }}>{valueText ?? value}</div>
    </div>
  );
}

function MiniPanel({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  const max = rows[0]?.count || 1;

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 18, border: `1px solid ${BRAND.border}` }}>
      <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 14 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ color: BRAND.muted }}>Veri bulunamadı.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((row) => (
            <div key={row.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
                <span>{row.label}</span>
                <span>{row.count}</span>
              </div>
              <div style={{ height: 9, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${Math.max(8, Math.round((row.count / max) * 100))}%`, height: "100%", background: BRAND.redBright }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const color = type === "KAZA" ? BRAND.redBright : type === "RAMAK_KALA" ? BRAND.amber : BRAND.blue;

  return <span style={{ color, fontWeight: 900 }}>{type}</span>;
}

function SeverityBadge({ value }: { value: number }) {
  const color = value >= 3 ? BRAND.redBright : value === 2 ? BRAND.amber : BRAND.green;

  return <span style={{ color, fontWeight: 950 }}>{value}</span>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 14, padding: 12, border: `1px solid ${BRAND.border}` }}>
      <div style={{ fontSize: 12, color: BRAND.muted, fontWeight: 800 }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 900 }}>{value || "-"}</div>
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
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: BRAND.muted, fontWeight: 800 }}>
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: `1px solid ${BRAND.border}`,
          borderRadius: 14,
          padding: 12,
          fontSize: 14,
        }}
      />
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: 14, fontSize: 13, color: "#374151" }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: 14, fontSize: 14, color: BRAND.text, verticalAlign: "top" }}>{children}</td>;
}