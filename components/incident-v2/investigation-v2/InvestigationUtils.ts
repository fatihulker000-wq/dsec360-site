import type {
  Attachment,
  IncidentOption,
  InvestigationFile,
  StageKey,
  StageStatus,
} from "./InvestigationTypes";

export const STAGES = [
  [
    "INITIAL",
    1,
    "Olayın İlk Değerlendirmesi",
    "Olay özeti, ilk müdahale ve ilk tespitler.",
  ],
  [
    "EVIDENCE",
    2,
    "Delil ve Doküman Yönetimi",
    "Fotoğraf, video, belge ve diğer kanıtlar.",
  ],
  [
    "WITNESSES",
    3,
    "Tanık ve İfade Tutanakları",
    "Tanık bilgileri, ifadeler ve imza durumu.",
  ],
  [
    "INTERVIEWS",
    4,
    "Görüşme Kayıtları",
    "Görüşme notları ve ek dosyalar.",
  ],
  [
    "ROOT_CAUSE",
    5,
    "Kök Neden Analizi",
    "5 Why, Balık Kılçığı veya RCA analizi.",
  ],
  [
    "ACTIONS",
    6,
    "DÖF ve Aksiyon Planı",
    "Sorumlu, termin, kapanış ve kanıtlar.",
  ],
  [
    "CONCLUSION",
    7,
    "Sonuç ve Onay",
    "Genel değerlendirme ve rapor.",
  ],
] as const;

export function emptyInvestigation(
  incident: IncidentOption
): InvestigationFile {
  const now = new Date().toISOString();

  return {
    incidentId: incident.id,
    incidentNo: incident.incidentNo,
    incidentTitle: incident.title,

    employeeName: incident.employeeName,
    eventDate: incident.eventDate,
    department: incident.department,
    location: incident.location,
    severity: incident.severity,

    initial: {
      eventSummary: incident.description || "",
      firstResponse: "",
      firstObservations: "",
      investigator: "",
      assessmentDate: "",
      attachments: [],
    },

    evidence: {
      description: "",
      attachments: [],
    },

    witnesses: [],

    interviews: [],

    rootCause: {
      method: "FIVE_WHY",
      analysisText: "",
      directCause: "",
      contributingCauses: "",
      systemicCause: "",
      finalRootCause: "",
      attachments: [],
    },

    actions: [],

    conclusion: {
      overallAssessment: "",
      legalAssessment: "",
      recommendations: "",
      recurrencePrevention: "",
      preparedBy: "",
      approvedBy: "",

      sgkNotified: false,
      ibysReady: false,
      actionCreated: false,
      documentsComplete: false,
      managerApproved: false,
    },

    completed: false,

    logs: [
      {
        id: crypto.randomUUID(),
        title: "Soruşturma dosyası oluşturuldu",
        createdAt: now,
      },
    ],

    createdAt: now,
    updatedAt: now,
  };
}

export function stageStatus(
  file: InvestigationFile,
  key: StageKey
): StageStatus {

  const filled = (values: string[]) =>
    values.filter((x) => x.trim()).length;

  switch (key) {

    case "INITIAL": {

      const values = [
        file.initial.eventSummary,
        file.initial.firstResponse,
        file.initial.firstObservations,
        file.initial.investigator,
        file.initial.assessmentDate,
      ];

      const count = filled(values);

      if (count === values.length)
        return "COMPLETED";

      if (
        count > 0 ||
        file.initial.attachments.length > 0
      )
        return "IN_PROGRESS";

      return "WAITING";
    }

    case "EVIDENCE": {

      const started =
        !!file.evidence.description.trim() ||
        file.evidence.attachments.length > 0;

      if (
        file.evidence.description.trim() &&
        file.evidence.attachments.length > 0
      ) {
        return "COMPLETED";
      }

      return started
        ? "IN_PROGRESS"
        : "WAITING";
    }

    case "WITNESSES": {

      const completed =
        file.witnesses.length > 0 &&
        file.witnesses.every(
          (x) =>
            x.fullName.trim() &&
            x.statement.trim() &&
            x.statementDate
        );

      if (completed)
        return "COMPLETED";

      return file.witnesses.length
        ? "IN_PROGRESS"
        : "WAITING";
    }

    case "INTERVIEWS": {

      const completed =
        file.interviews.length > 0 &&
        file.interviews.every(
          (x) =>
            x.personName.trim() &&
            x.interviewDate &&
            x.notes.trim()
        );

      if (completed)
        return "COMPLETED";

      return file.interviews.length
        ? "IN_PROGRESS"
        : "WAITING";
    }
        case "ROOT_CAUSE": {

      const values = [
        file.rootCause.analysisText,
        file.rootCause.directCause,
        file.rootCause.finalRootCause,
      ];

      const count = filled(values);

      if (count === values.length)
        return "COMPLETED";

      if (
        count > 0 ||
        file.rootCause.attachments.length > 0
      )
        return "IN_PROGRESS";

      return "WAITING";
    }

    case "ACTIONS": {

      const completed =
        file.actions.length > 0 &&
        file.actions.every(
          (x) =>
            x.title.trim() &&
            x.responsible.trim() &&
            x.dueDate &&
            x.status === "COMPLETED"
        );

      if (completed)
        return "COMPLETED";

      return file.actions.length
        ? "IN_PROGRESS"
        : "WAITING";
    }

    case "CONCLUSION": {

      const values = [
        file.conclusion.overallAssessment,
        file.conclusion.recommendations,
        file.conclusion.recurrencePrevention,
        file.conclusion.preparedBy,
        file.conclusion.approvedBy,
      ];

      const count = filled(values);

      if (count === values.length)
        return "COMPLETED";

      if (count > 0)
        return "IN_PROGRESS";

      return "WAITING";
    }

    default:
      return "WAITING";
  }
}

export function progress(
  file: InvestigationFile
) {

  const completed =
    STAGES.filter(
      ([key]) =>
        stageStatus(
          file,
          key as StageKey
        ) === "COMPLETED"
    ).length;

  return {
    completed,

    total: STAGES.length,

    percent: Math.round(
      (completed / STAGES.length) * 100
    ),
  };
}

export function loadInvestigation(
  incident: IncidentOption
): InvestigationFile {

  if (typeof window === "undefined") {
    return emptyInvestigation(
      incident
    );
  }

  const raw =
    localStorage.getItem(
      `dsec-investigation:${incident.id}`
    );

  if (!raw) {
    return emptyInvestigation(
      incident
    );
  }

  try {

    return {

      ...emptyInvestigation(
        incident
      ),

      ...JSON.parse(raw),

    };

  } catch {

    return emptyInvestigation(
      incident
    );

  }
}

export function saveInvestigation(
  file: InvestigationFile
) {

  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(

    `dsec-investigation:${file.incidentId}`,

    JSON.stringify({

      ...file,

      updatedAt:
        new Date().toISOString(),

    })
  );
}

export async function toAttachment(
  file: File
): Promise<Attachment> {

  const dataUrl =
    file.size <= 2 * 1024 * 1024

      ? await new Promise<string>(
          (
            resolve,
            reject
          ) => {

            const reader =
              new FileReader();

            reader.onload = () =>
              resolve(
                String(
                  reader.result || ""
                )
              );

            reader.onerror = () =>
              reject(
                reader.error
              );

            reader.readAsDataURL(
              file
            );

          }
        )

      : undefined;

  return {

    id: crypto.randomUUID(),

    name: file.name,

    type:
      file.type ||
      "application/octet-stream",

    size: file.size,

    addedAt:
      new Date().toISOString(),

    category:
      file.type.startsWith("image/")
        ? "PHOTO"
        : file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("audio/")
        ? "AUDIO"
        : file.type.includes("pdf") ||
          file.type.includes("word") ||
          file.type.includes("sheet") ||
          file.type.includes("excel")
        ? "DOCUMENT"
        : "OTHER",

    dataUrl,

  };
}