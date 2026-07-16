import { IncidentRepository } from "./IncidentRepository";
import { calculateIncidentAiScore } from "@/components/incident-v2/dashboard/incidentAiScoreEngine";

export class IncidentDashboardService {

    static async getDashboard(companyId?: string) {

        const incidents =
            await IncidentRepository.getAll(companyId);

        const total =
            incidents.length;

        const accidents =
            incidents.filter(
                (x: any) =>
                    x.incident_type === "WORK_ACCIDENT"
            ).length;

        const nearMiss =
            incidents.filter(
                (x: any) =>
                    x.incident_type === "NEAR_MISS"
            ).length;

        const dangerousConditions =
            incidents.filter(
                (x: any) =>
                    x.incident_type === "UNSAFE_CONDITION"
            ).length;

        const occupationalDisease =
            incidents.filter(
                (x: any) =>
                    x.incident_type === "OCCUPATIONAL_DISEASE"
            ).length;

        const firstAidCases =
            incidents.filter(
                (x: any) =>
                    x.first_aid === true
            ).length;

        const lostTime =
            incidents.filter(
                (x: any) =>
                    x.lost_time === true
            ).length;

        const fatal =
            incidents.filter(
                (x: any) =>
                    x.fatal === true
            ).length;

        const openInvestigations =
            incidents.filter(
                (x: any) =>
                    x.workflow_status === "INVESTIGATION"
            ).length;

        const openActions =
            incidents.filter(
                (x: any) =>
                    x.workflow_status === "CORRECTIVE_ACTION"
            ).length;

        const overdueActions =
            incidents.filter(
                (x: any) =>
                    x.action_overdue === true
            ).length;

        const repeatedEvents =
            incidents.filter(
                (x: any) =>
                    x.repeat_incident === true
            ).length;

        const metrics = {

            totalEvents: total,

            accidents,

            nearMiss,

            dangerousConditions,

            occupationalDisease,

            firstAidCases,

            medicalTreatmentCases: 0,

            restrictedWorkCases: 0,

            lostTimeInjuries: lostTime,

            fatalities: fatal,

            totalLostDays:
                incidents.reduce(
                    (s: number, x: any) =>
                        s + (x.lost_days ?? 0),
                    0
                ),

            severityAverage:
                incidents.length === 0
                    ? 0
                    : incidents.reduce(
                          (s: number, x: any) =>
                              s + (x.severity ?? 0),
                          0
                      ) / incidents.length,

            openInvestigations,

            completedInvestigations:
                incidents.filter(
                    (x: any) =>
                        x.workflow_status === "CLOSED"
                ).length,

            openCorrectiveActions:
                openActions,

            overdueCorrectiveActions:
                overdueActions,

            repeatedEvents,

            rootCauseClosedRate: 82,

        };

        const ai =
            calculateIncidentAiScore(metrics);

        return {

            metrics,

            ai,

            trend:
                this.buildMonthlyTrend(
                    incidents
                ),

            departments:
                this.buildDepartmentChart(
                    incidents
                ),

            rootCauses:
                this.buildRootCauseChart(
                    incidents
                ),

            recent:
                incidents.slice(0, 10),

            investigations:
                incidents.filter(
                    (x: any) =>
                        x.workflow_status ===
                        "INVESTIGATION"
                ),

        };

    }

    static buildMonthlyTrend(data: any[]) {

        return [];

    }

    static buildDepartmentChart(data: any[]) {

        return [];

    }

    static buildRootCauseChart(data: any[]) {

        return [];

    }

}