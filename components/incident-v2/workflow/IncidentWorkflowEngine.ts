import {
  IncidentWorkflowContext,
  IncidentWorkflowOptions,
  IncidentWorkflowResult,
  IncidentWorkflowStep,
  IncidentWorkflowStepType,
} from "./types";

export class IncidentWorkflowEngine {
  static execute(
    context: IncidentWorkflowContext,
    options?: Partial<IncidentWorkflowOptions>
  ): IncidentWorkflowResult {

    const config: IncidentWorkflowOptions = {
      createInvestigation: true,
      createRiskRevision: true,
      createInspection: true,
      createTrainingAssignments: true,
      createCorrectiveActions: true,
      createCalendarTask: true,
      sendNotifications: true,
      prepareIbys: true,
      ...options,
    };

    const workflowId =
      crypto.randomUUID();

    const startedAt =
      new Date().toISOString();

    const steps: IncidentWorkflowStep[] = [];

    const outputs: IncidentWorkflowResult["outputs"] = {};

    const errors: string[] = [];

    function addStep(
      enabled: boolean,
      type: IncidentWorkflowStepType,
      title: string,
      description: string
    ) {

      if (!enabled) {

        steps.push({
          id: crypto.randomUUID(),
          type,
          title,
          description,
          status: "SKIPPED",
          priority: "LOW",
          required: false,
        });

        return;

      }

      const now =
        new Date().toISOString();

      const id =
        crypto.randomUUID();

      steps.push({

        id,

        type,

        title,

        description,

        priority:
          context.severity >= 4
            ? "CRITICAL"
            : context.severity >= 3
            ? "HIGH"
            : "MEDIUM",

        required: true,

        status: "COMPLETED",

        startedAt: now,

        completedAt: now,

        output: {
          id,
        },

      });

      switch (type) {

        case "INVESTIGATION":
          outputs.investigationId = id;
          break;

        case "RISK_REVISION":
          outputs.riskRevisionId = id;
          break;

        case "INSPECTION":
          outputs.inspectionId = id;
          break;

        case "TRAINING":
          outputs.trainingAssignmentIds = [id];
          break;

        case "CORRECTIVE_ACTION":
          outputs.correctiveActionIds = [id];
          break;

        case "CALENDAR":
          outputs.calendarEventId = id;
          break;

        case "NOTIFICATION":
          outputs.notificationIds = [id];
          break;

        case "IBYS_PREPARATION":
          outputs.ibysPreparationId = id;
          break;

      }

    }

    addStep(
      config.createInvestigation,
      "INVESTIGATION",
      "Soruşturma Oluştur",
      "Investigation Center kaydı oluşturulur."
    );

    addStep(
      config.createRiskRevision,
      "RISK_REVISION",
      "Risk Revizyonu",
      "Risk değerlendirmesi gözden geçirilir."
    );

    addStep(
      config.createInspection,
      "INSPECTION",
      "Denetim Oluştur",
      "İlgili bölüm için denetim görevi açılır."
    );

    addStep(
      config.createTrainingAssignments,
      "TRAINING",
      "Eğitim Ata",
      "İlgili personele eğitim atanır."
    );

    addStep(
      config.createCorrectiveActions,
      "CORRECTIVE_ACTION",
      "DÖF Oluştur",
      "Düzeltici faaliyet kaydı oluşturulur."
    );

    addStep(
      config.createCalendarTask,
      "CALENDAR",
      "Ajandaya Ekle",
      "Takip görevi oluşturulur."
    );

    addStep(
      config.sendNotifications,
      "NOTIFICATION",
      "Bildirim Gönder",
      "Yönetici ve sorumlular bilgilendirilir."
    );

    addStep(
      config.prepareIbys,
      "IBYS_PREPARATION",
      "İBYS Hazırlığı",
      "İBYS veri paketi hazırlanır."
    );

    return {

      workflowId,

      incidentId:
        context.incidentId,

      status: "COMPLETED",

      startedAt,

      completedAt:
        new Date().toISOString(),

      progress: 100,

      steps,

      errors,

      outputs,

    };

  }
}