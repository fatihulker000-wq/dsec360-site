import { IncidentFormData } from "./types";
import { calculateIncidentCompleteness } from "./IncidentCompletenessEngine";

export interface WizardStep {

    id: number;

    title: string;

    required: boolean;

    completed: boolean;

    locked: boolean;

}

export interface WizardState {

    currentStep: number;

    progress: number;

    steps: WizardStep[];

    canFinish: boolean;

}

const titles = [

    "Genel Bilgiler",

    "Sınıflandırma",

    "Yaralananlar",

    "Tanıklar",

    "Lokasyon",

    "Çevre",

    "Ekipman",

    "KKD",

    "Fotoğraflar",

    "Videolar",

    "Belgeler",

    "İlişkili Kayıtlar",

    "Önizleme",

];

export function buildWizardState(

    form: IncidentFormData,

    currentStep: number

): WizardState {

    const completeness =
        calculateIncidentCompleteness(form as any);

    const completed = completeness.items;

    const steps: WizardStep[] = titles.map(

        (title, index) => ({

            id: index,

            title,

            required: index < 11,

            completed:
                completed[index]?.completed ?? false,

            locked:
                index > currentStep + 1,

        })

    );

    return {

        currentStep,

        progress:
            completeness.completedPercent,

        canFinish:
            completeness.canClose,

        steps,

    };

}

export function nextStep(

    current: number

) {

    return Math.min(

        current + 1,

        titles.length - 1

    );

}

export function previousStep(

    current: number

) {

    return Math.max(

        current - 1,

        0

    );

}

export function canOpenStep(

    state: WizardState,

    step: number

) {

    return !state.steps[step].locked;

}