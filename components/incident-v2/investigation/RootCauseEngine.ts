import { RootCauseItem } from "./types";

export interface RootCauseAnalysis {

    score: number;

    completed: boolean;

    selectedRootCauses: RootCauseItem[];

    primaryRootCause?: RootCauseItem;

    recommendations: string[];

}

export class RootCauseEngine {

    static createTemplate(): RootCauseItem[] {

        return [

            {
                id: crypto.randomUUID(),
                title: "Eğitim Eksikliği",
                category: "İnsan",
                probability: 0,
                selected: false,
            },

            {
                id: crypto.randomUUID(),
                title: "Prosedür Eksikliği",
                category: "Metot",
                probability: 0,
                selected: false,
            },

            {
                id: crypto.randomUUID(),
                title: "Risk Değerlendirmesi Eksik",
                category: "Yönetim",
                probability: 0,
                selected: false,
            },

            {
                id: crypto.randomUUID(),
                title: "Makine Arızası",
                category: "Makine",
                probability: 0,
                selected: false,
            },

            {
                id: crypto.randomUUID(),
                title: "KKD Kullanılmaması",
                category: "İnsan",
                probability: 0,
                selected: false,
            },

            {
                id: crypto.randomUUID(),
                title: "Çevresel Koşullar",
                category: "Çevre",
                probability: 0,
                selected: false,
            },

        ];

    }

    static analyze(

        causes: RootCauseItem[]

    ): RootCauseAnalysis {

        const selected =

            causes.filter(

                x => x.selected

            );

        const recommendations: string[] = [];

        if (selected.length === 0) {

            recommendations.push(

                "En az bir kök neden seçilmelidir."

            );

        }

        if (

            selected.every(

                x => x.probability === 0

            )

        ) {

            recommendations.push(

                "Olasılık puanları girilmelidir."

            );

        }

        const ordered =

            [...selected].sort(

                (a, b) =>

                    b.probability -

                    a.probability

            );

        const primary = ordered[0];

        const score =

            Math.min(

                100,

                selected.length * 25

            );

        if (

            recommendations.length === 0

        ) {

            recommendations.push(

                "Kök neden analizi tamamlandı."

            );

        }

        return {

            score,

            completed: score >= 75,

            selectedRootCauses: ordered,

            primaryRootCause: primary,

            recommendations,

        };

    }

    static toggle(

        causes: RootCauseItem[],

        id: string

    ) {

        return causes.map(c =>

            c.id === id

                ? {

                      ...c,

                      selected: !c.selected,

                  }

                : c

        );

    }

    static updateProbability(

        causes: RootCauseItem[],

        id: string,

        probability: number

    ) {

        return causes.map(c =>

            c.id === id

                ? {

                      ...c,

                      probability,

                  }

                : c

        );

    }

}