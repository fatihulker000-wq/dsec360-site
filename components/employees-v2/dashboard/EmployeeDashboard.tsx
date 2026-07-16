"use client";

import { useMemo } from "react";
import EmployeeAlertsPanel from "./EmployeeAlertsPanel";
import EmployeeDistributionPanel from "./EmployeeDistributionPanel";
import EmployeeKpiGrid from "./EmployeeKpiGrid";
import type { EmployeeDashboardAlert, EmployeeDashboardEmployee } from "./types";

export default function EmployeeDashboard({
  employees,
  visibleEmployees,
  selectedCompanyName,
  onEmployeeClick,
}: {
  employees: EmployeeDashboardEmployee[];
  visibleEmployees?: EmployeeDashboardEmployee[];
  selectedCompanyName?: string;
  onEmployeeClick?(employeeId: string): void;
}) {
  const visible = visibleEmployees || employees;

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((item) => item.active);

    const male = activeEmployees.filter((item) =>
      ["erkek","e","male","bay"].includes(String(item.gender || "").trim().toLocaleLowerCase("tr-TR"))
    ).length;

    const female = activeEmployees.filter((item) =>
      ["kadın","kadin","k","female","bayan"].includes(String(item.gender || "").trim().toLocaleLowerCase("tr-TR"))
    ).length;

    const disabled = activeEmployees.filter((item) => {
      const value = String(item.disability_status || "").trim().toLocaleLowerCase("tr-TR");
      return !["","yok","hayır","hayir","0","false","değil","degil"].includes(value);
    }).length;

    const incomplete = employees.filter((item) => getMissingFields(item).length > 0).length;

    return {
      total: employees.length,
      active: activeEmployees.length,
      passive: employees.filter((item) => !item.active).length,
      male,
      female,
      disabled,
      incomplete,
      visible: visible.length,
    };
  }, [employees, visible.length]);

  const jobTitleDistribution = useMemo(
    () => buildDistribution(employees.map((item) => item.job_title || "Ünvan belirtilmemiş")),
    [employees]
  );

  const seniorityDistribution = useMemo(() => {
    const now = Date.now();
    return buildDistribution(employees.map((item) => {
      if (!item.start_date) return "İşe giriş belirtilmemiş";
      const start = new Date(item.start_date).getTime();
      if (Number.isNaN(start)) return "İşe giriş belirtilmemiş";
      const years = Math.max(0,(now-start)/(365.25*24*60*60*1000));
      if (years < 1) return "0–1 yıl";
      if (years < 3) return "1–3 yıl";
      if (years < 5) return "3–5 yıl";
      if (years < 10) return "5–10 yıl";
      return "10+ yıl";
    }));
  }, [employees]);

  const ageDistribution = useMemo(() => {
    const now = new Date();
    return buildDistribution(employees.map((item) => {
      if (!item.birth_date) return "Doğum tarihi belirtilmemiş";
      const birth = new Date(item.birth_date);
      if (Number.isNaN(birth.getTime())) return "Doğum tarihi belirtilmemiş";
      let age = now.getFullYear() - birth.getFullYear();
      const monthDifference = now.getMonth() - birth.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birth.getDate())) age -= 1;
      if (age < 25) return "25 yaş altı";
      if (age < 35) return "25–34";
      if (age < 45) return "35–44";
      if (age < 55) return "45–54";
      return "55+";
    }));
  }, [employees]);

  const alerts = useMemo<EmployeeDashboardAlert[]>(() =>
    employees.flatMap((employee) => {
      const missing = getMissingFields(employee);
      if (missing.length === 0) return [];
      return [{
        id: `missing-${employee.id}`,
        employeeId: employee.id,
        employeeName: employee.full_name || "Adsız çalışan",
        title: missing.length >= 4 ? "YÜKSEK" : missing.length >= 2 ? "ORTA" : "DÜŞÜK",
        description: `Eksik alanlar: ${missing.join(", ")}`,
        severity: missing.length >= 4 ? "HIGH" : missing.length >= 2 ? "MEDIUM" : "LOW",
      } satisfies EmployeeDashboardAlert];
    }), [employees]);

  return (
    <div style={{ display:"grid", gap:18 }}>
      <section style={{ padding:24, borderRadius:24, background:"linear-gradient(135deg,#111827 0%,#4a0d1a 52%,#b91c1c 100%)", color:"#fff", boxShadow:"0 18px 50px rgba(74,13,26,.18)" }}>
        <div style={{ fontSize:12, fontWeight:900, letterSpacing:1, opacity:.82 }}>D-SEC EMPLOYEE INTELLIGENCE</div>
        <h2 style={{ margin:"8px 0 0", fontSize:30, fontWeight:950 }}>Çalışan Yönetim Dashboard</h2>
        <p style={{ margin:"10px 0 0", maxWidth:850, lineHeight:1.7, opacity:.9 }}>
          {selectedCompanyName || "Tüm firmalar"} kapsamındaki çalışan kayıtlarını, aktiflik durumunu ve profil veri kalitesini tek ekranda izleyin.
        </p>
      </section>

      <EmployeeKpiGrid stats={stats} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:16 }}>
        <EmployeeDistributionPanel title="Ünvan Dağılımı" description="Çalışanların görev ve ünvan bazındaki dağılımı." items={jobTitleDistribution} accent="#b91c1c" />
        <EmployeeDistributionPanel title="Kıdem Dağılımı" description="İşe giriş tarihine göre çalışan kıdem grupları." items={seniorityDistribution} accent="#1d4ed8" />
        <EmployeeDistributionPanel title="Yaş Dağılımı" description="Doğum tarihine göre çalışan yaş grupları." items={ageDistribution} accent="#7c3aed" />
      </div>

      <EmployeeAlertsPanel alerts={alerts} onEmployeeClick={onEmployeeClick} />
    </div>
  );
}

function buildDistribution(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((value) => {
    const label = String(value || "Belirtilmemiş").trim() || "Belirtilmemiş";
    map.set(label,(map.get(label) || 0)+1);
  });
  return [...map.entries()]
    .map(([label,count]) => ({ label,count }))
    .sort((a,b) => b.count-a.count)
    .slice(0,8);
}

function getMissingFields(employee: EmployeeDashboardEmployee) {
  const missing: string[] = [];
  if (!employee.full_name?.trim()) missing.push("Ad Soyad");
  if (!employee.job_title?.trim()) missing.push("Ünvan");
  if (!employee.phone?.trim()) missing.push("Telefon");
  if (!employee.email?.trim()) missing.push("E-posta");
  if (!employee.registry_no?.trim()) missing.push("Sicil");
  if (!employee.tc_no?.trim()) missing.push("T.C.");
  if (!employee.start_date?.trim()) missing.push("İşe giriş");
  if (!employee.birth_date?.trim()) missing.push("Doğum tarihi");
  return missing;
}
