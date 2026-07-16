import "server-only";

import { createClient } from "@supabase/supabase-js";

export type TrainingAuditEventInput = {
  assignmentId?: string | null;
  trainingId?: string | null;
  userId?: string | null;
  employeeId?: string | null;
  companyId?: string | null;

  eventType: string;
  eventLabel: string;

  eventStatus?:
    | "info"
    | "success"
    | "warning"
    | "error";

  occurredAt?: string;

  source?: string;

  requestId?: string | null;

  metadata?: Record<string, unknown>;

  previousData?: Record<string, unknown> | null;

  currentData?: Record<string, unknown> | null;
};

function getClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase servis bilgileri eksik."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function appendTrainingAuditEvent(
  input: TrainingAuditEventInput
) {
  const supabase = getClient();

  const { data, error } =
    await supabase.rpc(
      "append_training_audit_event",
      {
        p_assignment_id:
          input.assignmentId || null,

        p_training_id:
          input.trainingId || null,

        p_user_id:
          input.userId || null,

        p_employee_id:
          input.employeeId || null,

        p_company_id:
          input.companyId || null,

        p_event_type:
          input.eventType,

        p_event_label:
          input.eventLabel,

        p_event_status:
          input.eventStatus || "info",

        p_occurred_at:
          input.occurredAt ||
          new Date().toISOString(),

        p_source:
          input.source || "server",

        p_request_id:
          input.requestId || null,

        p_metadata:
          input.metadata || {},

        p_previous_data:
          input.previousData || null,

        p_current_data:
          input.currentData || null,
      }
    );

  if (error) {
    throw new Error(
      `Eğitim audit kaydı oluşturulamadı: ${error.message}`
    );
  }

  return String(data || "");
}