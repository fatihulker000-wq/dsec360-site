import { InvestigationWhy } from "./types";

export interface FiveWhyResult {

    completed: boolean;

    score: number;

    rootCause: string;

    recommendations: string[];

}

export class FiveWhyEngine {

    static analyze(

        whyList: InvestigationWhy[]

    ): FiveWhyResult {

        const answered =

            whyList.filter(

                x =>

                    x.answer.trim().length > 0

            );

        const score =

            Math.round(

                (answered.length /

                    Math.max(
                        whyList.length,
                        1
                    )) * 100

            );

        const rootCause =

            answered.length === 0

                ? ""

                : answered[
                    answered.length - 1
                  ].answer;

        const recommendations: string[] = [];

        if (score < 40) {

            recommendations.push(
                "5 Why analizi yetersiz."
            );

        }

        if (answered.length < 5) {

            recommendations.push(
                "En az 5 neden tamamlanmalıdır."
            );

        }

        if (
            rootCause.length < 15
        ) {

            recommendations.push(
                "Kök neden daha ayrıntılı yazılmalıdır."
            );

        }

        if (
            recommendations.length === 0
        ) {

            recommendations.push(
                "5 Why analizi yeterli görünüyor."
            );

        }

        return {

            completed:
                score >= 80,

            score,

            rootCause,

            recommendations,

        };

    }

    static createTemplate(): InvestigationWhy[] {

        return [

            {

                id: crypto.randomUUID(),

                level: 1,

                question:
                    "Neden olay meydana geldi?",

                answer: "",

            },

            {

                id: crypto.randomUUID(),

                level: 2,

                question:
                    "Bu neden oluştu?",

                answer: "",

            },

            {

                id: crypto.randomUUID(),

                level: 3,

                question:
                    "Temel sebep nedir?",

                answer: "",

            },

            {

                id: crypto.randomUUID(),

                level: 4,

                question:
                    "Bu durum neden engellenemedi?",

                answer: "",

            },

            {

                id: crypto.randomUUID(),

                level: 5,

                question:
                    "Gerçek kök neden nedir?",

                answer: "",

            },

        ];

    }

}