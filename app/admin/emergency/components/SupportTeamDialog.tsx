"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Search, UserPlus, Users, X } from "lucide-react";
import type { EmergencySupportMember } from "../types";

type EmployeeRow = {
  id: string;
  full_name: string | null;
  job_title?: string | null;
  department?: string | null;
  phone?: string | null;
  registry_no?: string | null;
  active?: boolean | null;
};

type Props = {
  open: boolean;
  firmId: string;
  member: Partial<EmergencySupportMember>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChange: (field: keyof EmergencySupportMember, value: unknown) => void;
};

const inputStyle = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  padding: "0 12px",
  boxSizing: "border-box" as const,
};

export default function SupportTeamDialog({
  open,
  firmId,
  member,
  onClose,
  onSave,
  onChange,
}: Props) {
  const [mode, setMode] = useState<"EMPLOYEE" | "MANUAL">("EMPLOYEE");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(member.employeeId ? "EMPLOYEE" : "MANUAL");
    setSearch("");
  }, [open, member.id, member.employeeId]);

  useEffect(() => {
    if (!open || !firmId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/employees?firmId=${encodeURIComponent(firmId)}`,
          { credentials: "include", cache: "no-store" }
        );

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.error || json.message || "Çalışanlar alınamadı.");
        }

        if (!cancelled) {
          setEmployees(
            (Array.isArray(json.data) ? json.data : []).filter(
              (item: EmployeeRow) => item.active !== false
            )
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Çalışanlar alınamadı."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, firmId]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return employees;

    return employees.filter((employee) =>
      [
        employee.full_name,
        employee.job_title,
        employee.department,
        employee.registry_no,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query)
    );
  }, [employees, search]);

  if (!open) return null;

  const selectEmployee = (id: string) => {
    const employee = employees.find((item) => item.id === id);

    if (!employee) {
      onChange("employeeId", null);
      return;
    }

    onChange("employeeId", employee.id);
    onChange("fullName", employee.full_name || "");
    onChange("duty", employee.job_title || "");
    onChange("department", employee.department || "");
    onChange("phone", employee.phone || "");
  };

  const switchMode = (next: "EMPLOYEE" | "MANUAL") => {
    setMode(next);
    if (next === "MANUAL") onChange("employeeId", null);
  };

  const label = (title: string, child: React.ReactNode) => (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>
        {title}
      </span>
      {child}
    </label>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15,23,42,.62)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onClick={onClose}
    >
      <section
        style={{
          width: "min(900px,100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 24,
          background: "#fff",
          padding: 22,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <UserPlus size={21} /> Destek Ekibi Üyesi
            </h2>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>
              Firma çalışanından seçin veya manuel kayıt oluşturun.
            </p>
          </div>

          <button type="button" onClick={onClose} style={{ width: 40, height: 40 }}>
            <X size={18} />
          </button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => switchMode("EMPLOYEE")}
            style={{
              minHeight: 46,
              borderRadius: 12,
              border: mode === "EMPLOYEE" ? "2px solid #047857" : "1px solid #dbe3ec",
              background: mode === "EMPLOYEE" ? "#ecfdf5" : "#fff",
              fontWeight: 900,
            }}
          >
            <Users size={16} /> Firma Çalışanından Seç
          </button>

          <button
            type="button"
            onClick={() => switchMode("MANUAL")}
            style={{
              minHeight: 46,
              borderRadius: 12,
              border: mode === "MANUAL" ? "2px solid #6b1020" : "1px solid #dbe3ec",
              background: mode === "MANUAL" ? "#fff1f2" : "#fff",
              fontWeight: 900,
            }}
          >
            <UserPlus size={16} /> Manuel Ekle
          </button>
        </div>

        {mode === "EMPLOYEE" ? (
          <section
            style={{
              border: "1px solid #a7f3d0",
              background: "#f0fdf4",
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
              display: "grid",
              gap: 9,
            }}
          >
            {label(
              "Çalışan Ara",
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: 14 }} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ad, görev, departman veya sicil no"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              </div>
            )}

            {label(
              "Firma Çalışanı",
              <select
                value={member.employeeId ?? ""}
                onChange={(event) => selectEmployee(event.target.value)}
                disabled={loading}
                style={inputStyle}
              >
                <option value="">
                  {loading ? "Çalışanlar yükleniyor..." : "Çalışan seçin"}
                </option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name || "İsimsiz çalışan"}
                    {employee.job_title ? ` · ${employee.job_title}` : ""}
                  </option>
                ))}
              </select>
            )}

            {loading ? <div><Loader2 size={15} /> Çalışanlar yükleniyor</div> : null}
            {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
          </section>
        ) : null}

        <div className="supportTeamGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {label(
            "Ad Soyad",
            <input
              value={member.fullName ?? ""}
              readOnly={mode === "EMPLOYEE"}
              onChange={(event) => onChange("fullName", event.target.value)}
              style={inputStyle}
            />
          )}

          {label(
            "Ekip Türü",
            <select
              value={member.teamType ?? "YANGIN"}
              onChange={(event) => onChange("teamType", event.target.value)}
              style={inputStyle}
            >
              <option value="YANGIN">Yangınla Mücadele</option>
              <option value="ARAMA_KURTARMA">Arama ve Kurtarma</option>
              <option value="TAHLİYE">Tahliye</option>
              <option value="ILK_YARDIM">İlk Yardım</option>
              <option value="KORUMA">Koruma</option>
              <option value="HABERLESME">Haberleşme</option>
            </select>
          )}

          {label(
            "Ekip Rolü",
            <select
              value={member.teamRole ?? "EKIP_UYESI"}
              onChange={(event) => onChange("teamRole", event.target.value)}
              style={inputStyle}
            >
              <option value="EKIP_LIDERI">Ekip Lideri</option>
              <option value="EKIP_UYESI">Ekip Üyesi</option>
              <option value="YEDEK_UYE">Yedek Üye</option>
            </select>
          )}

          {label(
            "Görev / Unvan",
            <input
              value={member.duty ?? ""}
              onChange={(event) => onChange("duty", event.target.value)}
              style={inputStyle}
            />
          )}

          {label(
            "Departman",
            <input
              value={member.department ?? ""}
              onChange={(event) => onChange("department", event.target.value)}
              style={inputStyle}
            />
          )}

          {label(
            "Telefon",
            <input
              value={member.phone ?? ""}
              onChange={(event) => onChange("phone", event.target.value)}
              style={inputStyle}
            />
          )}

          {label(
            "Sertifika Bilgisi",
            <input
              value={member.certificateInfo ?? ""}
              onChange={(event) => onChange("certificateInfo", event.target.value)}
              style={inputStyle}
            />
          )}

          {label(
            "Atanma Tarihi",
            <input
              type="date"
              value={
                member.assignedDateMillis
                  ? new Date(member.assignedDateMillis).toISOString().slice(0, 10)
                  : ""
              }
              onChange={(event) =>
                onChange(
                  "assignedDateMillis",
                  event.target.value
                    ? new Date(`${event.target.value}T00:00:00`).getTime()
                    : Date.now()
                )
              }
              style={inputStyle}
            />
          )}

          {label(
            "İmza Durumu",
            <select
              value={member.signatureStatus ?? "IMZA_BEKLIYOR"}
              onChange={(event) => onChange("signatureStatus", event.target.value)}
              style={inputStyle}
            >
              <option value="IMZA_BEKLIYOR">İmza Bekliyor</option>
              <option value="IMZALANDI">İmzalandı</option>
            </select>
          )}

          {label(
            "Kayıt Durumu",
            <select
              value={member.isActive === false ? "false" : "true"}
              onChange={(event) => onChange("isActive", event.target.value === "true")}
              style={inputStyle}
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          )}
        </div>

        <footer style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose}>İptal</button>
          <button
            type="button"
            onClick={() => void onSave()}
            style={{ minHeight: 44, background: "#047857", color: "#fff", border: 0, borderRadius: 12, padding: "0 16px", fontWeight: 900 }}
          >
            <Save size={16} /> Üyeyi Kaydet
          </button>
        </footer>

        <style jsx>{`
          @media (max-width: 720px) {
            .supportTeamGrid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>
    </div>
  );
}