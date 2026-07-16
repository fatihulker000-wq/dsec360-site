export type InvestigationStatus =
    | "DRAFT"
    | "OPEN"
    | "INVESTIGATION"
    | "ROOT_CAUSE"
    | "ACTION_PLAN"
    | "APPROVAL"
    | "COMPLETED"
    | "CLOSED";

export type InvestigationPriority =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

export type InvestigationSeverity =
    | 1
    | 2
    | 3
    | 4
    | 5;

export interface InvestigationPerson {

    id: string;

    fullName: string;

    department: string;

    title: string;

    role:
        | "INJURED"
        | "WITNESS"
        | "INVESTIGATOR"
        | "SUPERVISOR"
        | "EMPLOYER"
        | "OTHER";

}

export interface InvestigationEvidence {

    id: string;

    type:
        | "PHOTO"
        | "VIDEO"
        | "DOCUMENT"
        | "AUDIO";

    fileName: string;

    url: string;

    uploadedAt: string;

    uploadedBy: string;

}

export interface InvestigationInterview {

    id: string;

    personId: string;

    interviewDate: string;

    interviewer: string;

    summary: string;

    statement: string;

}

export interface InvestigationWhy {

    id: string;

    level: number;

    question: string;

    answer: string;

}

export interface FishboneCategory {

    title: string;

    causes: string[];

}

export interface RootCauseItem {

    id: string;

    title: string;

    category: string;

    probability: number;

    selected: boolean;

}

export interface InvestigationAction {

    id: string;

    title: string;

    responsible: string;

    dueDate: string;

    status:
        | "OPEN"
        | "IN_PROGRESS"
        | "COMPLETED";

}

export interface InvestigationReport {

    id: string;

    incidentId: string;

    investigationNo: string;

    status: InvestigationStatus;

    priority: InvestigationPriority;

    severity: InvestigationSeverity;

    startedAt: string;

    completedAt?: string;

    investigator: string;

    summary: string;

    findings: string;

    recommendations: string;

    aiScore: number;

    people: InvestigationPerson[];

    interviews: InvestigationInterview[];

    evidences: InvestigationEvidence[];

    fiveWhy: InvestigationWhy[];

    fishbone: FishboneCategory[];

    rootCauses: RootCauseItem[];

    actions: InvestigationAction[];

}