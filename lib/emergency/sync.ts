import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EmergencyEntity,
} from "./types";

import {
  createRecord,
  updateRecord,
} from "./repository";

export type EmergencySyncItem = {
  entity: EmergencyEntity;
  record: Record<string, unknown>;
};

export async function syncEmergencyRecords(
  supabase: SupabaseClient,
  items: EmergencySyncItem[],
  companyScopeId = ""
) {
  let successCount = 0;

  const failedIndexes: number[] = [];
  const errors: string[] = [];

  for (
    let index = 0;
    index < items.length;
    index += 1
  ) {
    try {
      const item = items[index];

      if (item.record.id) {
        await updateRecord(
          supabase,
          item.entity,
          item.record,
          companyScopeId
        );
      } else {
        await createRecord(
          supabase,
          item.entity,
          item.record
        );
      }

      successCount += 1;
    } catch (error) {
      failedIndexes.push(index);

      errors.push(
        error instanceof Error
          ? error.message
          : "Senkronizasyon hatası"
      );
    }
  }

  return {
    successCount,
    failedIndexes,
    errors,
  };
}