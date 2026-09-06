import type {
  EmployeeIntegrationData,
} from "./types";

export function mapIntegrationToProfileProps(
  integration?: EmployeeIntegrationData | null
) {

  return {

    trainingItems:
      integration?.trainingItems || [],

    healthItems:
      integration?.healthItems || [],

    ppeItems:
      integration?.ppeItems || [],

    riskItems:
      integration?.riskItems || [],

    auditItems:
      integration?.auditItems || [],

    accidentItems:
      integration?.accidentItems || [],

    documentItems:
      integration?.documentItems || [],

    agendaItems:
      integration?.agendaItems || [],

    sgkItems:
      integration?.sgkItems || [],

    ibysItems:
      integration?.ibysItems || [],

    activityItems:
      integration?.activityItems || [],

    healthAccess: {
      role: integration?.access?.role,
      detailsAllowed:
        integration?.access?.health_details_allowed ??
        integration?.summary?.health_details_allowed ??
        false,
      privacyLevel:
        integration?.access?.health_privacy_level ??
        integration?.summary?.health_privacy_level ??
        "METADATA_ONLY",
    },

  };

}

export function mapIntegrationToEmployeeSummary(
  integration?: EmployeeIntegrationData | null
) {

  return (

    integration?.summary ||

    {

      training_status: "UNKNOWN",

      health_status: "UNKNOWN",

      health_record_count: 0,
      health_examination_count: 0,
      health_ek2_count: 0,
      health_last_exam_at: undefined,
      health_last_ek2_at: undefined,
      health_next_due_at: undefined,
      health_days_until_due: undefined,
      health_details_allowed: false,
      health_privacy_level: "METADATA_ONLY",

      ppe_status: "UNKNOWN",

      document_status: "UNKNOWN",

      risk_status: "UNKNOWN",

      training_completion_rate: undefined,

      ppe_completion_rate: undefined,

      open_risk_count: 0,

      open_action_count: 0,

      accident_count: 0,

      upcoming_count: 0,

    }

  );

}