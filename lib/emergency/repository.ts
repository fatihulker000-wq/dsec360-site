import type { SupabaseClient } from "@supabase/supabase-js";

import {
  drillToRow,
  mapDrill,
  mapPlan,
  mapTeam,
  planToRow,
  teamToRow,
} from "./mapper";

import type {
  EmergencyBundle,
  EmergencyEntity,
} from "./types";

const TABLE = {
  PLAN: "emergency_plans",
  TEAM: "emergency_support_members",
  DRILL: "emergency_drills",
} as const;

export async function getBundle(
  supabase: SupabaseClient,
  firmId: string
): Promise<EmergencyBundle> {
  const [
    plans,
    teams,
    drills,
  ] = await Promise.all([
    supabase
      .from(TABLE.PLAN)
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from(TABLE.TEAM)
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from(TABLE.DRILL)
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .order(
        "drill_date_millis",
        {
          ascending: false,
        }
      ),
  ]);

  if (plans.error) {
    throw new Error(
      plans.error.message
    );
  }

  if (teams.error) {
    throw new Error(
      teams.error.message
    );
  }

  if (drills.error) {
    throw new Error(
      drills.error.message
    );
  }

  return {
    plans: (plans.data || []).map(
      (row) => mapPlan(row)
    ),

    teams: (teams.data || []).map(
      (row) => mapTeam(row)
    ),

    drills: (drills.data || []).map(
      (row) => mapDrill(row)
    ),
  };
}

function rowFor(
  entity: EmergencyEntity,
  record: Record<string, unknown>
) {
  if (entity === "PLAN") {
    return planToRow(record);
  }

  if (entity === "TEAM") {
    return teamToRow(record);
  }

  return drillToRow(record);
}

function mapFor(
  entity: EmergencyEntity,
  row: Record<string, unknown>
) {
  if (entity === "PLAN") {
    return mapPlan(row);
  }

  if (entity === "TEAM") {
    return mapTeam(row);
  }

  return mapDrill(row);
}

export async function createRecord(
  supabase: SupabaseClient,
  entity: EmergencyEntity,
  record: Record<string, unknown>
) {
  const {
    data,
    error,
  } = await supabase
    .from(TABLE[entity])
    .insert({
      ...rowFor(entity, record),

      source: "WEB",
      sync_status: "SYNCED",
      sync_key: crypto.randomUUID(),
      version: 1,

      is_deleted: false,

      created_at:
        new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ||
        "Kayıt oluşturulamadı."
    );
  }

  return mapFor(entity, data);
}

export async function updateRecord(
  supabase: SupabaseClient,
  entity: EmergencyEntity,
  record: Record<string, unknown>,
  companyScopeId = ""
) {
  const id = String(
    record.id || ""
  ).trim();

  if (!id) {
    throw new Error(
      "Kayıt ID bilgisi eksik."
    );
  }

  let query = supabase
    .from(TABLE[entity])
    .update({
      ...rowFor(entity, record),

      source: "WEB",
      sync_status: "SYNCED",

      version:
        Number(
          record.version || 1
        ) + 1,
    })
    .eq("id", id)
    .eq("is_deleted", false);

  if (companyScopeId) {
    query = query.eq(
      "firm_id",
      companyScopeId
    );
  }

  const {
    data,
    error,
  } = await query
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Kayıt bulunamadı."
    );
  }

  return mapFor(entity, data);
}

export async function deleteRecord(
  supabase: SupabaseClient,
  entity: EmergencyEntity,
  id: string,
  companyScopeId = ""
) {
  let query = supabase
    .from(TABLE[entity])
    .update({
      is_deleted: true,

      deleted_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),

      source: "WEB",
      sync_status: "SYNCED",
    })
    .eq("id", id)
    .eq("is_deleted", false);

  if (companyScopeId) {
    query = query.eq(
      "firm_id",
      companyScopeId
    );
  }

  const {
    data,
    error,
  } = await query
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Kayıt bulunamadı."
    );
  }

  return String(data.id);
}