import { IncidentRepository } from "./IncidentRepository";

export type TimelineStatus =
    | "SUCCESS"
    | "INFO"
    | "WARNING"
    | "ERROR";

export interface IncidentTimelineRecord {

    id: string;

    incidentId: string;

    eventCode: string;

    title: string;

    description?: string;

    status: TimelineStatus;

    createdBy?: string;

    createdAt: string;

}

export class IncidentTimelineService {

    static async add(

        incidentId: string,

        eventCode: string,

        title: string,

        description?: string,

        status: TimelineStatus = "INFO",

        createdBy?: string

    ) {

        const timeline = {

            incident_id: incidentId,

            event_code: eventCode,

            title,

            description,

            status,

            created_by: createdBy,

            created_at: new Date().toISOString(),

        };

        return IncidentRepository.insertTimeline(
            timeline
        );

    }

    static async getTimeline(

        incidentId: string

    ) {

        return IncidentRepository.getTimeline(
            incidentId
        );

    }

    static async addIncidentCreated(

        incidentId: string,

        user?: string

    ) {

        return this.add(

            incidentId,

            "INCIDENT_CREATED",

            "Olay Kaydı Oluşturuldu",

            "Yeni olay sisteme kaydedildi.",

            "SUCCESS",

            user

        );

    }

    static async addInvestigationStarted(

        incidentId: string,

        user?: string

    ) {

        return this.add(

            incidentId,

            "INVESTIGATION_STARTED",

            "Soruşturma Başladı",

            "Olay araştırması başlatıldı.",

            "INFO",

            user

        );

    }

    static async addRootCauseCompleted(

        incidentId: string,

        user?: string

    ) {

        return this.add(

            incidentId,

            "ROOT_CAUSE",

            "Kök Neden Analizi Tamamlandı",

            "",

            "SUCCESS",

            user

        );

    }

    static async addCorrectiveAction(

        incidentId: string,

        user?: string

    ) {

        return this.add(

            incidentId,

            "CORRECTIVE_ACTION",

            "DÖF Oluşturuldu",

            "",

            "WARNING",

            user

        );

    }

    static async addClosed(

        incidentId: string,

        user?: string

    ) {

        return this.add(

            incidentId,

            "INCIDENT_CLOSED",

            "Olay Kapatıldı",

            "",

            "SUCCESS",

            user

        );

    }

}