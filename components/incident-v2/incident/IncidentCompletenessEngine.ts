import { IncidentFormData } from "./types";

export interface CompletenessItem {

    title: string;

    score: number;

    completed: boolean;

}

export interface CompletenessResult {

    totalScore: number;

    completedPercent: number;

    canClose: boolean;

    items: CompletenessItem[];

}

function exists(value: any) {

    if (value === null || value === undefined)
        return false;

    if (typeof value === "string")
        return value.trim().length > 0;

    if (Array.isArray(value))
        return value.length > 0;

    return true;

}

export function calculateIncidentCompleteness(

    incident: any

): CompletenessResult {

    const items: CompletenessItem[] = [

        {

            title: "Genel Bilgiler",

            completed:

                exists(
                    incident.general?.companyName
                ) &&
                exists(
                    incident.general?.location
                ) &&
                exists(
                    incident.general?.incidentDate
                ),

            score: 15,

        },

        {

            title: "Sınıflandırma",

            completed:
                exists(
                    incident.general?.incidentType
                ),

            score: 10,

        },

        {

            title: "Yaralananlar",

            completed:
                exists(
                    incident.people
                ),

            score: 10,

        },

        {

            title: "Tanıklar",

            completed:
                exists(
                    incident.witnesses
                ),

            score: 10,

        },

        {

            title: "Fotoğraflar",

            completed:
                exists(
                    incident.photos
                ),

            score: 10,

        },

        {

            title: "Videolar",

            completed:
                exists(
                    incident.videos
                ),

            score: 5,

        },

        {

            title: "Belgeler",

            completed:
                exists(
                    incident.documents
                ),

            score: 10,

        },

        {

            title: "Kök Neden",

            completed:
                exists(
                    incident.rootCause
                ),

            score: 10,

        },

        {

            title: "DÖF",

            completed:
                exists(
                    incident.correctiveActions
                ),

            score: 10,

        },

        {

            title: "Timeline",

            completed:
                exists(
                    incident.timeline
                ),

            score: 5,

        },

        {

            title: "İlişkili Kayıtlar",

            completed:
                exists(
                    incident.relatedRiskAssessments
                ) ||
                exists(
                    incident.relatedInspections
                ),

            score: 5,

        },

    ];

    const total = items.reduce(

        (sum, item) =>

            sum +

            (item.completed ? item.score : 0),

        0

    );

    return {

        totalScore: total,

        completedPercent: total,

        canClose: total >= 90,

        items,

    };

}