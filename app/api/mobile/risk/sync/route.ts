import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RiskRecord = {
  localId?: number | null;
  remoteId?: string | null;
  syncKey: string;

  firmId?: number | null;
  webFirmId?: string | null;

  riskType?: string;

  title?: string;
  hazard?: string;
  consequence?: string | null;
  control?: string | null;

  probability?: number | null;
  severity?: number | null;
  score?: number | null;
  level?: string | null;

  action?: string | null;

  dofStatus?: string | null;
  dofAction?: string | null;
  dofResponsible?: string | null;
  dofDueDate?: number | null;
  dofClosedDate?: number | null;
  dofNote?: string | null;

  source?: string | null;

  isDeleted?: boolean;
  deletedAt?: number | null;

  createdAt?: number | null;
  updatedAt?: number | null;
};

function dbRowToRiskDto(row: any): RiskRecord {
  return {
    localId: null,
    remoteId: row.remote_id ?? row.id ?? null,
    syncKey: row.sync_key,

    firmId: row.firm_id ?? null,
    webFirmId: row.web_firm_id ?? null,

    riskType: "MATRIX",

    title: row.title ?? "",
    hazard: row.hazard ?? "",
    consequence: row.consequence ?? null,
    control: row.control ?? null,

    probability: row.probability ?? null,
    severity: row.severity ?? null,
    score: row.score ?? 0,
    level: row.level ?? null,

    action: row.dof_action ?? null,

    dofStatus: row.dof_status ?? "OPEN",
    dofAction: row.dof_action ?? null,
    dofResponsible: row.dof_responsible ?? null,
    dofDueDate: row.dof_due_date_millis ?? null,
    dofClosedDate: row.dof_closed_at_millis ?? null,
    dofNote: row.dof_note ?? null,

    source: row.source ?? "WEB",

    isDeleted: row.deleted === true,
    deletedAt: row.deleted_at_millis ?? null,

    createdAt: row.created_at_millis ?? Date.now(),
    updatedAt: row.updated_at_millis ?? Date.now(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyId = Number(
      body.companyId ??
        body.firmId ??
        0
    );

    const webCompanyId =
      typeof body.webCompanyId === "string"
        ? body.webCompanyId.trim()
        : "";

    const cursor = Number(
      body.cursor ??
        body.lastSync ??
        0
    );

    const records: RiskRecord[] =
      Array.isArray(body.records)
        ? body.records
        : Array.isArray(body.items)
          ? body.items
          : [];

    const deletedRecords: string[] =
      Array.isArray(body.deletedRecords)
        ? body.deletedRecords
            .map((id: unknown) => String(id ?? "").trim())
            .filter(Boolean)
        : [];

    if (companyId <= 0 && !webCompanyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma bilgisi bulunamadı.",
          syncedRemoteIds: [],
          insertRecords: [],
          updateRecords: [],
          deleteRecords: [],
          warnings: [],
          conflicts: [],
          cursor: String(Date.now()),
        },
        { status: 400 }
      );
    }

    const syncedRemoteIds: string[] = [];
    const insertRecords: RiskRecord[] = [];
    const updateRecords: RiskRecord[] = [];
    const warnings: string[] = [];
    const conflicts: any[] = [];

    /*
     * 1. APP → WEB
     * Android worker içindeki records listesi işlenir.
     */
    for (const record of records) {
      const syncKey = String(record.syncKey ?? "").trim();

      if (!syncKey) {
        warnings.push("syncKey bulunmayan kayıt atlandı.");
        continue;
      }

      const now = Date.now();

      const { data: existing, error: existingError } =
        await supabase
          .from("risk_matrix")
          .select("*")
          .eq("sync_key", syncKey)
          .maybeSingle();

      if (existingError) {
        warnings.push(
          `${syncKey}: Mevcut kayıt kontrol edilemedi: ${existingError.message}`
        );
        continue;
      }

      const isDeleted = record.isDeleted === true;

      const remoteId =
        String(
          record.remoteId ??
            existing?.remote_id ??
            crypto.randomUUID()
        ).trim();

      const payload = {
        sync_key: syncKey,
        remote_id: remoteId,

        firm_id:
          Number(record.firmId ?? companyId) ||
          companyId,

        web_firm_id:
          record.webFirmId ??
          webCompanyId ??
          null,

        title: record.title ?? "",
        hazard: record.hazard ?? "",
        consequence: record.consequence ?? null,

        probability: record.probability ?? null,
        severity: record.severity ?? null,
        score: Number(record.score ?? 0),
        level: record.level ?? null,

        control: record.control ?? null,

        dof_status: record.dofStatus ?? "OPEN",
        dof_action:
          record.dofAction ??
          record.action ??
          null,

        dof_responsible:
          record.dofResponsible ?? null,

        dof_due_date_millis:
          record.dofDueDate ?? null,

        dof_closed_at_millis:
          record.dofClosedDate ?? null,

        dof_note:
          record.dofNote ?? null,

        source:
          record.source ?? "APP",

        deleted: isDeleted,

        deleted_at_millis:
          isDeleted
            ? record.deletedAt ?? now
            : null,

        created_at_millis:
          record.createdAt ??
          existing?.created_at_millis ??
          now,

        updated_at_millis:
          record.updatedAt ?? now,
      };

      const { data: saved, error: saveError } =
        await supabase
          .from("risk_matrix")
          .upsert(payload, {
            onConflict: "sync_key",
          })
          .select("*")
          .single();

      if (saveError || !saved) {
        warnings.push(
          `${syncKey}: ${saveError?.message ?? "Kayıt kaydedilemedi."}`
        );
        continue;
      }

      syncedRemoteIds.push(
        saved.remote_id ?? remoteId
      );

      const dto = dbRowToRiskDto(saved);

      if (existing) {
        updateRecords.push(dto);
      } else {
        insertRecords.push(dto);
      }
    }

    /*
     * 2. Android worker tarafından ayrıca gönderilen
     * deletedRecords listesi işlenir.
     */
    for (const remoteId of deletedRecords) {
      const now = Date.now();

      const query = supabase
        .from("risk_matrix")
        .update({
          deleted: true,
          deleted_at_millis: now,
          updated_at_millis: now,
        })
        .eq("remote_id", remoteId);

      if (webCompanyId) {
        query.eq("web_firm_id", webCompanyId);
      } else if (companyId > 0) {
        query.eq("firm_id", companyId);
      }

      const { error } = await query;

      if (error) {
        warnings.push(
          `${remoteId}: Silme işlemi başarısız: ${error.message}`
        );
      } else {
        syncedRemoteIds.push(remoteId);
      }
    }

    /*
     * 3. WEB → APP
     * Cursor tarihinden sonra değişen kayıtlar getirilir.
     */
    let webQuery = supabase
      .from("risk_matrix")
      .select("*")
      .gt("updated_at_millis", cursor)
      .order("updated_at_millis", {
        ascending: true,
      });

    if (webCompanyId) {
      webQuery = webQuery.eq(
        "web_firm_id",
        webCompanyId
      );
    } else {
      webQuery = webQuery.eq(
        "firm_id",
        companyId
      );
    }

    const {
      data: changedRows,
      error: changedError,
    } = await webQuery;

    if (changedError) {
      throw changedError;
    }

    const changed = changedRows ?? [];

    const remoteDeleteRecords = changed
      .filter((row) => row.deleted === true)
      .map((row) =>
        String(row.remote_id ?? row.id)
      )
      .filter(Boolean);

    const activeChangedRecords = changed
      .filter((row) => row.deleted !== true)
      .map(dbRowToRiskDto);

    /*
     * App'in gönderdiği kayıtlar cevapta da dönsün.
     * Tekrarlanan kayıtlar syncKey üzerinden ayıklanır.
     */
    const allInsertRecords = [
      ...insertRecords,
      ...activeChangedRecords,
    ].filter(
      (record, index, array) =>
        array.findIndex(
          (item) =>
            item.syncKey === record.syncKey
        ) === index
    );

    const allDeleteRecords = [
      ...deletedRecords,
      ...remoteDeleteRecords,
    ].filter(
      (id, index, array) =>
        array.indexOf(id) === index
    );

    const serverTime = Date.now();

    return NextResponse.json({
      success: true,

      syncedRemoteIds: [
        ...new Set(syncedRemoteIds),
      ],

      insertRecords: allInsertRecords,
      updateRecords,

      deleteRecords: allDeleteRecords,

      warnings,
      conflicts,

      cursor: String(serverTime),

      message:
        warnings.length > 0
          ? "Senkronizasyon uyarılarla tamamlandı."
          : "Risk senkronizasyonu tamamlandı.",
    });
  } catch (error: any) {
    console.error(
      "Risk sync hatası:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        syncedRemoteIds: [],
        insertRecords: [],
        updateRecords: [],
        deleteRecords: [],
        warnings: [],
        conflicts: [],

        cursor: String(Date.now()),

        message:
          error?.message ??
          "Risk senkronizasyonu sırasında hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}