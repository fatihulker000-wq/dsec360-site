import { FishboneCategory } from "./types";

export interface FishboneResult {

    score: number;

    completed: boolean;

    totalCauses: number;

    strongestCategory: string;

    recommendations: string[];

}

export class FishboneEngine {

    static createTemplate(): FishboneCategory[] {

        return [

            {
                title: "İnsan",
                causes: [],
            },

            {
                title: "Makine",
                causes: [],
            },

            {
                title: "Metot",
                causes: [],
            },

            {
                title: "Malzeme",
                causes: [],
            },

            {
                title: "Çevre",
                causes: [],
            },

            {
                title: "Yönetim",
                causes: [],
            },

        ];

    }

    static analyze(

        categories: FishboneCategory[]

    ): FishboneResult {

        let totalCauses = 0;

        let max = 0;

        let strongestCategory = "-";

        categories.forEach(category => {

            totalCauses += category.causes.length;

            if (category.causes.length > max) {

                max = category.causes.length;

                strongestCategory = category.title;

            }

        });

        const score = Math.min(

            100,

            totalCauses * 10

        );

        const recommendations: string[] = [];

        if (totalCauses < 6) {

            recommendations.push(

                "Balık kılçığı analizine daha fazla neden eklenmelidir."

            );

        }

        categories.forEach(category => {

            if (category.causes.length === 0) {

                recommendations.push(

                    `"${category.title}" kategorisi boş bırakılmış.`

                );

            }

        });

        if (recommendations.length === 0) {

            recommendations.push(

                "Fishbone analizi yeterli seviyededir."

            );

        }

        return {

            score,

            completed: score >= 80,

            totalCauses,

            strongestCategory,

            recommendations,

        };

    }

    static addCause(

        categories: FishboneCategory[],

        categoryTitle: string,

        cause: string

    ) {

        return categories.map(category =>

            category.title === categoryTitle

                ? {

                      ...category,

                      causes: [

                          ...category.causes,

                          cause,

                      ],

                  }

                : category

        );

    }

    static removeCause(

        categories: FishboneCategory[],

        categoryTitle: string,

        index: number

    ) {

        return categories.map(category => {

            if (category.title !== categoryTitle)

                return category;

            return {

                ...category,

                causes: category.causes.filter(

                    (_, i) => i !== index

                ),

            };

        });

    }

}