import { IncidentRepository } from "./IncidentRepository";

export interface IncidentAiAnalysis {

    riskScore: number;

    repeatProbability: number;

    severity: number;

    confidence: number;

    riskLevel:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

    suggestedRootCauses: string[];

    suggestedActions: string[];

    suggestedTrainings: string[];

    suggestedInspections: string[];

    requiredNotifications: string[];

}

export class IncidentAIService {

    static async analyze(

        incident: any

    ): Promise<IncidentAiAnalysis> {

        const history =
            await IncidentRepository.getAll(
                incident.company_id
            );

        const similar =
            history.filter(

                (x: any) =>

                    x.incident_type ===
                    incident.incident_type

            );

        let score = 100;

        score -=
            similar.length * 3;

        score -=
            (incident.severity ?? 1) * 10;

        if (incident.lost_time)
            score -= 20;

        if (incident.fatal)
            score -= 40;

        score =
            Math.max(
                0,
                Math.min(score, 100)
            );

        return {

            riskScore: score,

            repeatProbability:
                Math.min(
                    similar.length * 8,
                    95
                ),

            severity:
                incident.severity ?? 1,

            confidence: 91,

            riskLevel:

                score >= 80
                    ? "LOW"

                    : score >= 60
                    ? "MEDIUM"

                    : score >= 40
                    ? "HIGH"

                    : "CRITICAL",

            suggestedRootCauses: [

                "Yetersiz Risk Değerlendirmesi",

                "Eğitim Eksikliği",

                "Prosedür Uygunsuzluğu",

                "Davranışsal Güvensizlik",

            ],

            suggestedActions: [

                "DÖF Oluştur",

                "Risk Değerlendirmesini Güncelle",

                "Saha Denetimi Yap",

                "KKD Kontrolü",

            ],

            suggestedTrainings: [

                "İSG Eğitimi",

                "KKD Eğitimi",

                "Forklift Eğitimi",

                "Acil Durum Eğitimi",

            ],

            suggestedInspections: [

                "Saha Denetimi",

                "Makine Denetimi",

                "5S Denetimi",

            ],

            requiredNotifications: [

                "SGK",

                "İBYS",

                "İşveren",

            ],

        };

    }

}