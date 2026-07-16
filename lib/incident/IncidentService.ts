import { IncidentRepository } from "./IncidentRepository";

export class IncidentService {

    static async list(companyId?: string) {

        return IncidentRepository.getAll(
            companyId
        );

    }

    static async detail(id: string) {

        return IncidentRepository.getById(
            id
        );

    }

    static async create(record: any) {

        record.incident_no =
            await this.generateIncidentNo();

        record.created_at =
            new Date().toISOString();

        record.updated_at =
            new Date().toISOString();

        record.ai_status = "PENDING";

        record.workflow_status = "OPEN";

        return IncidentRepository.create(
            record
        );

    }

    static async update(
        id: string,
        update: any
    ) {

        update.updated_at =
            new Date().toISOString();

        return IncidentRepository.update(
            id,
            update
        );

    }

    static async close(id: string) {

        return IncidentRepository.update(id, {

            workflow_status: "CLOSED",

            closed_at:
                new Date().toISOString(),

            updated_at:
                new Date().toISOString(),

        });

    }

    static async archive(id: string) {

        return IncidentRepository.update(id, {

            workflow_status: "ARCHIVED",

            archived_at:
                new Date().toISOString(),

        });

    }

    static async statistics(companyId?: string) {

        return IncidentRepository.getStatistics(
            companyId
        );

    }

    static async generateIncidentNo() {

        const year =
            new Date().getFullYear();

        const incidents =
            await IncidentRepository.getAll();

        const next =
            incidents.length + 1;

        return `INC-${year}-${String(next)
            .padStart(6, "0")}`;

    }

    static async reopen(id: string) {

        return IncidentRepository.update(id, {

            workflow_status: "OPEN",

            reopened_at:
                new Date().toISOString(),

        });

    }

    static async assign(

        id: string,

        assignedUserId: string

    ) {

        return IncidentRepository.update(id, {

            assigned_user_id:
                assignedUserId,

            assigned_at:
                new Date().toISOString(),

        });

    }

    static async approve(

        id: string,

        approvedBy: string

    ) {

        return IncidentRepository.update(id, {

            approved_by:
                approvedBy,

            approved_at:
                new Date().toISOString(),

            workflow_status:
                "APPROVED",

        });

    }

    static async reject(

        id: string,

        reason: string

    ) {

        return IncidentRepository.update(id, {

            reject_reason:
                reason,

            workflow_status:
                "REJECTED",

        });

    }

}