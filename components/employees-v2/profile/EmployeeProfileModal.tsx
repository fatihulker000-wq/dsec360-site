"use client";

import EmployeeProfile from "./EmployeeProfile";

import type {
  EmployeeProfileActivity,
  EmployeeProfileEmployee,
  EmployeeProfileModuleItem,
} from "./types";

export default function EmployeeProfileModal({
  employee,
  open,
  onClose,
  onEdit,
  ...moduleProps
}: {
  employee: EmployeeProfileEmployee | null;
  open: boolean;
  onClose(): void;
  onEdit?(): void;

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
  activityItems?: EmployeeProfileActivity[];
}) {
  if (!open || !employee) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        padding: 18,
        background:
          "rgba(15,23,42,.65)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        style={{
          width: "min(1500px,100%)",
          margin: "0 auto",
          padding: 20,
          borderRadius: 26,
          background: "#f8fafc",
          boxShadow:
            "0 32px 90px rgba(0,0,0,.28)",
        }}
      >
        <EmployeeProfile
          employee={employee}
          onClose={onClose}
          onEdit={onEdit}
          {...moduleProps}
        />
      </div>
    </div>
  );
}
