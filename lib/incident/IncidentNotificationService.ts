import { IncidentRepository } from "./IncidentRepository";
import { IncidentTimelineService } from "./IncidentTimelineService";

export interface NotificationResult {

    sgk: boolean;

    ibys: boolean;

    employer: boolean;

    doctor: boolean;

    hseManager: boolean;

    messages: string[];

}

export class IncidentNotificationService {

    static async prepareNotifications(

        incidentId: string

    ): Promise<NotificationResult> {

        const incident =
            await IncidentRepository.getById(
                incidentId
            );

        const messages: string[] = [];

        let sgk = false;

        let ibys = false;

        let employer = true;

        let doctor = false;

        let hseManager = true;

        if (incident.lost_time) {

            sgk = true;

            messages.push(
                "SGK bildirimi hazırlanmalıdır."
            );

        }

        if (incident.severity >= 3) {

            ibys = true;

            messages.push(
                "İBYS bildirimi kontrol edilmelidir."
            );

        }

        if (incident.first_aid) {

            doctor = true;

            messages.push(
                "İşyeri hekimi bilgilendirilmelidir."
            );

        }

        await IncidentTimelineService.add(

            incidentId,

            "NOTIFICATION_CHECK",

            "Bildirim Kontrolü",

            messages.join("\n"),

            "INFO"

        );

        return {

            sgk,

            ibys,

            employer,

            doctor,

            hseManager,

            messages,

        };

    }

    static async markCompleted(

        incidentId: string,

        type:

            | "SGK"

            | "IBYS"

            | "EMPLOYER"

            | "DOCTOR"

    ) {

        await IncidentTimelineService.add(

            incidentId,

            "NOTIFICATION_COMPLETED",

            `${type} Bildirimi Tamamlandı`,

            "",

            "SUCCESS"

        );

        return true;

    }

}