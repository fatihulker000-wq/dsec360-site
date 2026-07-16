"use client";

import { useState } from "react";

import EmployeeProfileActivity from "./EmployeeProfileActivity";
import EmployeeProfileKpis from "./EmployeeProfileKpis";
import EmployeeProfileModulePanel from "./EmployeeProfileModulePanel";
import EmployeeProfileOverview from "./EmployeeProfileOverview";
import EmployeeProfileSidebar from "./EmployeeProfileSidebar";
import EmployeeProfileTabs from "./EmployeeProfileTabs";

import type {
  EmployeeProfileActivity as EmployeeProfileActivityItem,
  EmployeeProfileEmployee,
  EmployeeProfileModuleItem,
  EmployeeProfileTab,
} from "./types";

export default function EmployeeProfile({
  employee,
  trainingItems,
  healthItems,
  ppeItems,
  riskItems,
  auditItems,
  accidentItems,
  documentItems,
  agendaItems,
  sgkItems,
  ibysItems,
  activityItems,
  onEdit,
  onClose,
}: {
  employee: EmployeeProfileEmployee;

  trainingItems?: EmployeeProfileModuleItem[];
  healthItems?: EmployeeProfileModuleItem[];
  ppeItems?: EmployeeProfileModuleItem[];
  riskItems?: EmployeeProfileModuleItem[];
  auditItems?: EmployeeProfileModuleItem[];
  accidentItems?: EmployeeProfileModuleItem[];
  documentItems?: EmployeeProfileModuleItem[];
  agendaItems?: EmployeeProfileModuleItem[];
  sgkItems?: EmployeeProfileModuleItem[];
  ibysItems?: EmployeeProfileModuleItem[];

  activityItems?: EmployeeProfileActivityItem[];

  onEdit?(): void;
  onClose?(): void;
}) {
  const [activeTab, setActiveTab] =
    useState<EmployeeProfileTab>("OVERVIEW");

  return (
    <section
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(260px,320px) minmax(0,1fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 16,
          }}
        >
          <EmployeeProfileSidebar
            employee={employee}
            onEdit={onEdit}
            onClose={onClose}
          />
        </div>

        <main
          style={{
            display: "grid",
            gap: 16,
            minWidth: 0,
          }}
        >
          <EmployeeProfileKpis
            employee={employee}
          />

          <EmployeeProfileTabs
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "OVERVIEW" && (
            <EmployeeProfileOverview
              employee={employee}
            />
          )}

          {activeTab === "IDENTITY" && (
            <EmployeeProfileModulePanel
              title="Kimlik Bilgileri"
              description="Çalışanın kimlik, sicil ve temel personel bilgileri."
              items={[
                {
                  id: "tc",
                  title: "T.C. Kimlik No",
                  description:
                    employee.tc_no || "-",
                },
                {
                  id: "registry",
                  title: "Sicil No",
                  description:
                    employee.registry_no || "-",
                },
                {
                  id: "gender",
                  title: "Cinsiyet",
                  description:
                    employee.gender || "-",
                },
                {
                  id: "birth",
                  title: "Doğum Tarihi",
                  description:
                    employee.birth_date || "-",
                },
                {
                  id: "education",
                  title: "Öğrenim Durumu",
                  description:
                    employee.education_level || "-",
                },
              ]}
            />
          )}

          {activeTab === "CONTACT" && (
            <EmployeeProfileModulePanel
              title="İletişim Bilgileri"
              description="Çalışanın telefon ve e-posta bilgileri."
              items={[
                {
                  id: "phone",
                  title: "Telefon",
                  description:
                    employee.phone || "-",
                },
                {
                  id: "email",
                  title: "E-posta",
                  description:
                    employee.email || "-",
                },
              ]}
            />
          )}

          {activeTab === "TRAINING" && (
            <EmployeeProfileModulePanel
              title="Eğitimler"
              description="Çalışanın tamamlanan, devam eden ve yaklaşan eğitim kayıtları."
              items={trainingItems}
            />
          )}

          {activeTab === "HEALTH" && (
            <EmployeeProfileModulePanel
              title="Sağlık"
              description="İşe giriş, periyodik muayene ve sağlık takip kayıtları."
              items={healthItems}
            />
          )}

          {activeTab === "PPE" && (
            <EmployeeProfileModulePanel
              title="KKD"
              description="KKD teslim, zimmet ve yenileme kayıtları."
              items={ppeItems}
            />
          )}

          {activeTab === "RISK" && (
            <EmployeeProfileModulePanel
              title="Risk"
              description="Çalışana bağlı riskler ve açık aksiyonlar."
              items={riskItems}
            />
          )}

          {activeTab === "AUDITS" && (
            <EmployeeProfileModulePanel
              title="Denetimler"
              description="Çalışanla ilişkili denetim ve saha kontrol kayıtları."
              items={auditItems}
            />
          )}

          {activeTab === "ACCIDENTS" && (
            <EmployeeProfileModulePanel
              title="İş Kazaları"
              description="Çalışanın taraf olduğu kaza ve olay kayıtları."
              items={accidentItems}
            />
          )}

          {activeTab === "DOCUMENTS" && (
            <EmployeeProfileModulePanel
              title="Belgeler"
              description="Çalışan evrakları ve belge geçerlilik kayıtları."
              items={documentItems}
            />
          )}

          {activeTab === "AGENDA" && (
            <EmployeeProfileModulePanel
              title="Ajanda"
              description="Çalışana bağlı görev ve yaklaşan işlemler."
              items={agendaItems}
            />
          )}

          {activeTab === "SGK" && (
            <EmployeeProfileModulePanel
              title="SGK"
              description="Çalışanla ilişkili SGK kayıt ve bildirim durumu."
              items={sgkItems}
            />
          )}

          {activeTab === "IBYS" && (
            <EmployeeProfileModulePanel
              title="İBYS"
              description="Çalışan için İBYS hazırlık ve aktarım durumu."
              items={ibysItems}
            />
          )}

          {activeTab === "ACTIVITY" && (
            <EmployeeProfileActivity
              items={activityItems}
            />
          )}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          section > div {
            grid-template-columns: 1fr !important;
          }

          section > div > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </section>
  );
}
