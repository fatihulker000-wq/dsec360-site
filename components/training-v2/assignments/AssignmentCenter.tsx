"use client";

import { useMemo } from "react";
import styles from "./AssignmentCenter.module.css";

export type EmployeeRow = {
  id: string;
  firm_id: string;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  active: boolean;
};

export type AssignResponse = {
  success?: boolean;
  insertedCount?: number;
  skippedCount?: number;
  emailedCount?: number;
  mailFailedCount?: number;
  noEmailCount?: number;
  trainingTitle?: string | null;
  message?: string;
  mailResults?: Array<{
    userId: string;
    email: string | null;
    ok: boolean;
    reason?: string;
  }>;
  error?: string;
};

type AssignmentCenterProps = {
  companySelected: boolean;
  employees: EmployeeRow[];
  employeesLoading: boolean;
  search: string;
  selectedEmployees: string[];
  employeeTrainingMap: Record<string, any[]>;
  selectedTrainingTitle: string;
  trainingSelected: boolean;
  assigning: boolean;
  assignSummary: AssignResponse | null;
  onSelectedEmployeesChange: (ids: string[]) => void;
  onAssign: () => Promise<void> | void;
};

function normalizeTrainingTypeText(value?: string | null) {
  const type = String(value || "").toLocaleLowerCase("tr-TR");

  if (type.includes("asenkron") || type.includes("online")) {
    return "Asenkron";
  }

  if (type.includes("senkron")) return "Senkron";
  if (type.includes("orgun") || type.includes("örgün")) return "Örgün";
  if (type.includes("ozel") || type.includes("özel")) return "Özel";

  return "Eğitim";
}

function isAppTrainingRecord(item: any) {
  const source = String(item?.source || "").toLowerCase();
  const type = String(item?.type || "").toLowerCase();
  const status = String(item?.status || "").toLowerCase();

  return (
    source.includes("app") ||
    status === "app_record" ||
    type.includes("orgun") ||
    type.includes("örgün") ||
    type.includes("ozel") ||
    type.includes("özel")
  );
}

function getTrainingStatusLabel(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") return "Tamamlandı";
  if (value === "in_progress") return "Devam ediyor";
  if (value === "app_record") return "App Kaydı";

  return "Başlamadı";
}

function formatTrainingDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTrainingDurationText(value?: number | null) {
  if (!value || value <= 0) return "Süre yok";
  return `${value} dk`;
}

function TrainingHistoryBlock({
  title,
  subtitle,
  records,
  tone,
}: {
  title: string;
  subtitle: string;
  records: any[];
  tone: "portal" | "app";
}) {
  return (
    <div
      className={`${styles.historyBlock} ${
        tone === "app" ? styles.historyApp : styles.historyPortal
      }`}
    >
      <div className={styles.historyHeader}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      {records.length === 0 ? (
        <div className={styles.historyEmpty}>Kayıt bulunmuyor.</div>
      ) : (
        <div className={styles.historyList}>
          {records.map((item: any, index: number) => (
            <div
              key={`${item.training_id || item.assignment_id || index}`}
              className={styles.historyItem}
            >
              <div>
                <strong>{item.title || "Eğitim"}</strong>
                <span>
                  {normalizeTrainingTypeText(item.type)} •{" "}
                  {tone === "app" ? "App Kaydı" : "Portal Eğitimi"}
                </span>
                <span>
                  Süre: {getTrainingDurationText(item.duration_minutes)} •
                  Tarih:{" "}
                  {formatTrainingDate(
                    item.completed_at ||
                      item.started_at ||
                      item.created_at
                  )}
                </span>
              </div>

              <em
                className={
                  item.status === "completed"
                    ? styles.statusCompleted
                    : item.status === "in_progress"
                      ? styles.statusProgress
                      : tone === "app"
                        ? styles.statusApp
                        : styles.statusPending
                }
              >
                {tone === "app"
                  ? "App Kaydı"
                  : getTrainingStatusLabel(item.status)}
              </em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssignmentCenter({
  companySelected,
  employees,
  employeesLoading,
  search,
  selectedEmployees,
  employeeTrainingMap,
  selectedTrainingTitle,
  trainingSelected,
  assigning,
  assignSummary,
  onSelectedEmployeesChange,
  onAssign,
}: AssignmentCenterProps) {
  const visibleEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return employees
      .filter((employee) => employee.active)
      .filter((employee) => {
        if (!query) return true;

        return [
          employee.full_name,
          employee.email,
          employee.phone,
          employee.job_title,
          employee.registry_no,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(query);
      });
  }, [employees, search]);

  const visibleIds = visibleEmployees.map((employee) => employee.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedEmployees.includes(id));

  const selectedEmployeeRows = employees.filter((employee) =>
    selectedEmployees.includes(employee.id)
  );

  const missingEmailCount = selectedEmployeeRows.filter(
    (employee) => !employee.email
  ).length;

  const toggleEmployee = (employeeId: string, checked: boolean) => {
    onSelectedEmployeesChange(
      checked
        ? Array.from(new Set([...selectedEmployees, employeeId]))
        : selectedEmployees.filter((id) => id !== employeeId)
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      const visibleSet = new Set(visibleIds);
      onSelectedEmployeesChange(
        selectedEmployees.filter((id) => !visibleSet.has(id))
      );
      return;
    }

    onSelectedEmployeesChange(
      Array.from(new Set([...selectedEmployees, ...visibleIds]))
    );
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Training Assignment Center</span>
            <h2>Çalışan Eğitim Yönetimi</h2>
            <p>
              Çalışan seçin, portal eğitimlerini atayın ve çalışanların
              geçmiş eğitim kayıtlarını tek merkezden takip edin.
            </p>
          </div>

          <div className={styles.headerStats}>
            <div>
              <span>Görünen çalışan</span>
              <strong>{visibleEmployees.length}</strong>
            </div>
            <div>
              <span>Seçilen</span>
              <strong>{selectedEmployees.length}</strong>
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <label>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              disabled={visibleEmployees.length === 0}
              onChange={(event) =>
                toggleAllVisible(event.target.checked)
              }
            />
            Görünen çalışanları seç
          </label>

          <button
            type="button"
            onClick={() => onSelectedEmployeesChange([])}
            disabled={selectedEmployees.length === 0}
          >
            Seçimi Temizle
          </button>
        </div>

        {!companySelected ? (
          <div className={styles.emptyState}>
            Önce firma seçin. Eğitim ataması yalnızca seçilen firmaya
            bağlı çalışanlara yapılabilir.
          </div>
        ) : employeesLoading ? (
          <div className={styles.emptyState}>
            Çalışanlar yükleniyor...
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className={styles.emptyState}>
            Seçilen firma ve arama kriterlerine uygun aktif çalışan
            bulunamadı.
          </div>
        ) : (
          <div className={styles.employeeGrid}>
            {visibleEmployees.map((employee) => {
              const checked = selectedEmployees.includes(employee.id);
              const records = employeeTrainingMap[employee.id] || [];
              const appRecords = records.filter(isAppTrainingRecord);
              const portalRecords = records.filter(
                (item: any) => !isAppTrainingRecord(item)
              );

              return (
                <article
                  key={employee.id}
                  className={`${styles.employeeCard} ${
                    checked ? styles.employeeCardSelected : ""
                  }`}
                >
                  <label className={styles.employeeHeader}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        toggleEmployee(
                          employee.id,
                          event.target.checked
                        )
                      }
                    />

                    <div>
                      <h3>{employee.full_name}</h3>
                      <p>
                        {employee.job_title || "Ünvan yok"} •{" "}
                        {employee.email || "E-posta yok"}
                      </p>
                    </div>

                    <span
                      className={
                        checked
                          ? styles.selectedBadge
                          : styles.activeBadge
                      }
                    >
                      {checked ? "Seçildi" : "Aktif"}
                    </span>
                  </label>

                  <div className={styles.employeeMeta}>
                    <span>{employee.phone || "Telefon yok"}</span>
                    <span>Sicil: {employee.registry_no || "-"}</span>
                  </div>

                  <div className={styles.historyGrid}>
                    <TrainingHistoryBlock
                      title="Portal Eğitim Atamaları"
                      subtitle="Asenkron / Senkron"
                      records={portalRecords}
                      tone="portal"
                    />

                    <TrainingHistoryBlock
                      title="App Eğitim Kayıtları"
                      subtitle="Örgün / Özel"
                      records={appRecords}
                      tone="app"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.assignmentPanel}>
        <div className={styles.summaryGrid}>
          <div>
            <span>Seçilen eğitim</span>
            <strong>{selectedTrainingTitle || "-"}</strong>
          </div>
          <div>
            <span>Seçilen çalışan</span>
            <strong>{selectedEmployees.length}</strong>
          </div>
          <div>
            <span>E-posta eksik</span>
            <strong>{missingEmailCount}</strong>
          </div>
          <div>
            <span>Atama durumu</span>
            <strong>
              {!trainingSelected
                ? "Eğitim seçilmedi"
                : selectedEmployees.length === 0
                  ? "Çalışan seçilmedi"
                  : "Hazır"}
            </strong>
          </div>
        </div>

        <div className={styles.assignFooter}>
          <div>
            <h3>Atama Özeti</h3>
            <p>
              Eğitim: <strong>{selectedTrainingTitle || "-"}</strong>
              <br />
              Çalışan: <strong>{selectedEmployees.length}</strong>
            </p>
          </div>

          <button
            type="button"
            className={styles.assignButton}
            disabled={
              !trainingSelected ||
              selectedEmployees.length === 0 ||
              assigning
            }
            onClick={() => void onAssign()}
          >
            {assigning ? "Atanıyor..." : "Eğitimi Ata"}
          </button>
        </div>
      </div>

      {assignSummary ? (
        <div
          className={`${styles.resultPanel} ${
            assignSummary.success
              ? styles.resultSuccess
              : styles.resultError
          }`}
        >
          <div className={styles.resultHeader}>
            <div>
              <span>Atama sonucu</span>
              <h3>
                {assignSummary.message ||
                  assignSummary.error ||
                  "İşlem sonucu hazır."}
              </h3>
            </div>

            <strong>
              {assignSummary.success ? "Başarılı" : "Hata"}
            </strong>
          </div>

          <div className={styles.resultStats}>
            {[
              ["Yeni Atama", assignSummary.insertedCount || 0],
              ["Atlandı", assignSummary.skippedCount || 0],
              ["Mail Başarılı", assignSummary.emailedCount || 0],
              ["Mail Başarısız", assignSummary.mailFailedCount || 0],
              ["Mail Yok", assignSummary.noEmailCount || 0],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.mailList}>
            <h4>Mail Sonuç Listesi</h4>

            {!assignSummary.mailResults ||
            assignSummary.mailResults.length === 0 ? (
              <div className={styles.mailEmpty}>
                Mail sonuç verisi bulunamadı.
              </div>
            ) : (
              assignSummary.mailResults.map((item, index) => (
                <div
                  key={`${item.userId}-${index}`}
                  className={styles.mailItem}
                >
                  <div>
                    <strong>
                      {item.email || "E-posta tanımlı değil"}
                    </strong>
                    {item.reason ? <span>{item.reason}</span> : null}
                  </div>

                  <em
                    className={
                      item.ok
                        ? styles.mailSuccess
                        : styles.mailError
                    }
                  >
                    {item.ok ? "Gönderildi" : "Başarısız"}
                  </em>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
