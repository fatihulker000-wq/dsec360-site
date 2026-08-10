import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* =========================================================
HELPERS
========================================================= */

function text(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function booleanValue(
  value: unknown,
  fallback = true
): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized =
    text(value).toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "evet"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "hayır" ||
    normalized === "hayir"
  ) {
    return false;
  }

  return fallback;
}

function createSyncKey(
  firmId: string
) {
  return [
    "DORA",
    "EMPLOYEE",
    firmId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA ÇALIŞANLARINI GETİR
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const firmId =
      text(
        searchParams.get(
          "firmId"
        )
      );

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    if (!firmId && !id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya çalışan ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Tek çalışan
     */
    if (id) {
      let query = supabase
        .from("dora_employees")
        .select("*")
        .eq("id", id)
        .eq(
          "is_deleted",
          false
        );

      if (firmId) {
        query = query.eq(
          "firm_id",
          firmId
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA çalışanı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        employee: data,
      });
    }

    /*
     * Firma çalışan listesi
     */
    const {
      data,
      error,
    } = await supabase
      .from("dora_employees")
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .order(
        "is_active",
        {
          ascending: false,
        }
      )
      .order(
        "full_name",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      employees: data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA EMPLOYEES GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA çalışanları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA ÇALIŞANI
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    const fullName =
      text(
        body.fullName ??
          body.full_name
      );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ad soyad zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Firma gerçekten DORA firması mı?
     */
    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from("dora_firms")
      .select("id")
      .eq(
        "id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (firmError) {
      throw firmError;
    }

    if (!firm) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firması bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const now =
      Date.now();

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId
      );

    /*
     * Aynı sync_key ikinci kez oluşmasın
     */
    const {
      data: existingSync,
      error: existingSyncError,
    } = await supabase
      .from("dora_employees")
      .select("id")
      .eq(
        "sync_key",
        syncKey
      )
      .maybeSingle();

    if (existingSyncError) {
      throw existingSyncError;
    }

    if (existingSync) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu DORA çalışan senkronizasyon anahtarı zaten kullanılıyor.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("dora_employees")
      .insert({
        firm_id:
          firmId,

        sync_key:
          syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        app_firm_local_id:
          nullableNumber(
            body.appFirmLocalId ??
              body.app_firm_local_id
          ),

        full_name:
          fullName,

        tc_no:
          text(
            body.tcNo ??
              body.tc_no
          ),

        position:
          text(
            body.position
          ),

        department:
          text(
            body.department
          ),

        phone:
          text(
            body.phone
          ),

        email:
          text(
            body.email
          ),

        special_group:
          text(
            body.specialGroup ??
              body.special_group
          ),

        is_active:
          booleanValue(
            body.isActive ??
              body.is_active,
            true
          ),

        note:
          text(
            body.note
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,

        source:
          "WEB",

        created_at_millis:
          now,

        updated_at_millis:
          now,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      employee: data,
    });
  } catch (error) {
    console.error(
      "DORA EMPLOYEES POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA çalışanı oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA ÇALIŞANINI GÜNCELLE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA çalışan ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData:
      Record<
        string,
        unknown
      > = {
      updated_at_millis:
        Date.now(),

      source:
        "WEB",
    };

    if (
      body.fullName !==
        undefined ||
      body.full_name !==
        undefined
    ) {
      const fullName =
        text(
          body.fullName ??
            body.full_name
        );

      if (!fullName) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Ad soyad boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.full_name =
        fullName;
    }

    if (
      body.tcNo !==
        undefined ||
      body.tc_no !==
        undefined
    ) {
      updateData.tc_no =
        text(
          body.tcNo ??
            body.tc_no
        );
    }

    if (
      body.position !==
      undefined
    ) {
      updateData.position =
        text(
          body.position
        );
    }

    if (
      body.department !==
      undefined
    ) {
      updateData.department =
        text(
          body.department
        );
    }

    if (
      body.phone !==
      undefined
    ) {
      updateData.phone =
        text(
          body.phone
        );
    }

    if (
      body.email !==
      undefined
    ) {
      updateData.email =
        text(
          body.email
        );
    }

    if (
      body.specialGroup !==
        undefined ||
      body.special_group !==
        undefined
    ) {
      updateData.special_group =
        text(
          body.specialGroup ??
            body.special_group
        );
    }

    if (
      body.isActive !==
        undefined ||
      body.is_active !==
        undefined
    ) {
      updateData.is_active =
        booleanValue(
          body.isActive ??
            body.is_active,
          true
        );
    }

    if (
      body.note !==
      undefined
    ) {
      updateData.note =
        text(
          body.note
        );
    }

    const {
      data,
      error,
    } = await supabase
      .from("dora_employees")
      .update(
        updateData
      )
      .eq(
        "id",
        id
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      employee: data,
    });
  } catch (error) {
    console.error(
      "DORA EMPLOYEES PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA çalışanı güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
DORA ÇALIŞANI SOFT DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA çalışan ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from("dora_employees")
      .update({
        is_deleted:
          true,

        is_active:
          false,

        deleted_at_millis:
          now,

        updated_at_millis:
          now,

        source:
          "WEB",
      })
      .eq(
        "id",
        id
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error(
      "DORA EMPLOYEES DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA çalışanı silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}