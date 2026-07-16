import {
  IncidentAuditFilters,
  IncidentAuditLog,
  IncidentAuditSeverity,
  IncidentAuditStatus,
  IncidentAuditSummary,
} from "./types";

export class IncidentAuditEngine {

  static summary(
    logs: IncidentAuditLog[]
  ): IncidentAuditSummary {

    const today = new Date();

    const sevenDays = new Date();

    sevenDays.setDate(
      sevenDays.getDate() - 7
    );

    return {

      total: logs.length,

      today: logs.filter(log =>

        this.sameDay(
          new Date(log.createdAt),
          today
        )

      ).length,

      lastSevenDays: logs.filter(log =>

        new Date(log.createdAt) >= sevenDays

      ).length,

      critical: logs.filter(log =>

        log.severity === "CRITICAL"

      ).length,

      failed: logs.filter(log =>

        log.status === "FAILED"

      ).length,

      successful: logs.filter(log =>

        log.status === "SUCCESS"

      ).length,

      uniqueUsers: new Set(

        logs.map(x => x.userName)

      ).size,

      uniqueIncidents: new Set(

        logs.map(x => x.incidentId)

      ).size,

    };

  }

  static filter(

    logs: IncidentAuditLog[],

    filters: IncidentAuditFilters

  ) {

    return logs.filter(log => {

      if (

        filters.incidentId &&

        log.incidentId !== filters.incidentId

      )

        return false;

      if (

        filters.companyId &&

        log.companyId !== filters.companyId

      )

        return false;

      if (

        filters.action &&

        log.action !== filters.action

      )

        return false;

      if (

        filters.status &&

        log.status !== filters.status

      )

        return false;

      if (

        filters.severity &&

        log.severity !== filters.severity

      )

        return false;

      if (

        filters.module &&

        log.module !== filters.module

      )

        return false;

      if (

        filters.userName &&

        !log.userName
          .toLowerCase()
          .includes(
            filters.userName.toLowerCase()
          )

      )

        return false;

      if (filters.search) {

        const search =
          filters.search.toLowerCase();

        const text = [

          log.title,

          log.description,

          log.userName,

          log.incidentNo,

        ]
          .join(" ")
          .toLowerCase();

        if (!text.includes(search))
          return false;

      }

      if (

        filters.startDate &&

        new Date(log.createdAt) <
          new Date(filters.startDate)

      )

        return false;

      if (

        filters.endDate &&

        new Date(log.createdAt) >
          new Date(filters.endDate)

      )

        return false;

      return true;

    });

  }

  static sortNewest(

    logs: IncidentAuditLog[]

  ) {

    return [...logs].sort(

      (a, b) =>

        new Date(
          b.createdAt
        ).getTime() -

        new Date(
          a.createdAt
        ).getTime()

    );

  }

  static create(

    data: Omit<
      IncidentAuditLog,
      "id" | "createdAt"
    >

  ): IncidentAuditLog {

    return {

      ...data,

      id: crypto.randomUUID(),

      createdAt:
        new Date().toISOString(),

    };

  }

  static severityFromStatus(
    status: IncidentAuditStatus
  ): IncidentAuditSeverity {

    switch (status) {

      case "FAILED":

        return "CRITICAL";

      case "WARNING":

        return "HIGH";

      case "INFO":

        return "LOW";

      default:

        return "MEDIUM";

    }

  }

  private static sameDay(
    a: Date,
    b: Date
  ) {

    return (

      a.getDate() === b.getDate() &&

      a.getMonth() === b.getMonth() &&

      a.getFullYear() ===
        b.getFullYear()

    );

  }

}