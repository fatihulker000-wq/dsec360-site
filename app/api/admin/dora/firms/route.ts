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

function nullableText(
  value: unknown
): string | null {
  const result = text(value);

  return result || null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
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

function createSyncKey() {
  return [
    "DORA",
    "FIRM",
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA FİRMALARINI GETİR
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      text(
        searchParams.get("id")
      );

    const includeDeleted =
      searchParams.get(
        "includeDeleted"
      ) === "true";

    /*
     * Tek firma isteniyorsa.
     */
    if (id) {
      let query = supabase
        .from("dora_firms")
        .select("*")
        .eq("id", id);

      if (!includeDeleted) {
        query = query.eq(
          "is_deleted",
          false
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
              "DORA firması bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        firm: data,
      });
    }

    /*
     * Firma listesi.
     */
    let query = supabase
      .from("dora_firms")
      .select("*")
      .order(
        "updated_at_millis",
        {
          ascending: false,
        }
      );

    if (!includeDeleted) {
      query = query.eq(
        "is_deleted",
        false
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      firms: data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA FIRMS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA firmaları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DORA FİRMASI
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmName =
      text(
        body.firmName ??
          body.firm_name
      );

    if (!firmName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma ünvanı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) || createSyncKey();

    /*
     * Aynı sync_key ile ikinci
     * kayıt oluşturulmasını engelle.
     */
    const {
      data: existingSync,
      error: existingSyncError,
    } = await supabase
      .from("dora_firms")
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
            "Bu DORA senkronizasyon anahtarı zaten kullanılıyor.",
        },
        {
          status: 409,
        }
      );
    }

    const employeeCount =
      Math.max(
        0,
        Math.floor(
          numberValue(
            body.employeeCount ??
              body.employee_count,
            0
          )
        )
      );

    const setupScore =
      Math.min(
        100,
        Math.max(
          0,
          Math.floor(
            numberValue(
              body.setupScore ??
                body.setup_score,
              0
            )
          )
        )
      );

    const {
      data,
      error,
    } = await supabase
      .from("dora_firms")
      .insert({
        sync_key:
          syncKey,

        app_local_id:
          body.appLocalId ??
          body.app_local_id ??
          null,

        /*
         * DORA BAĞIMSIZDIR.
         *
         * Ana D-SEC firm ID'si
         * burada tutulmaz.
         */

        owner_user_id:
          body.ownerUserId ??
          body.owner_user_id ??
          null,

        firm_name:
          firmName,

        sgk_no:
          text(
            body.sgkNo ??
              body.sgk_no
          ),

        tax_no:
          text(
            body.taxNo ??
              body.tax_no
          ),

        tax_office:
          text(
            body.taxOffice ??
              body.tax_office
          ),

        mersis_no:
          text(
            body.mersisNo ??
              body.mersis_no
          ),

        nace_code:
          text(
            body.naceCode ??
              body.nace_code
          ),

        sector:
          text(
            body.sector
          ),

        danger_class:
          text(
            body.dangerClass ??
              body.danger_class
          ).toUpperCase(),

        employee_count:
          employeeCount,

        address:
          text(
            body.address
          ),

        phone:
          text(
            body.phone
          ),

        email:
          text(
            body.email
          ),

        authorized_person:
          text(
            body.authorizedPerson ??
              body.authorized_person
          ),

        note:
          text(
            body.note
          ),

        setup_score:
          setupScore,

        setup_status:
          text(
            body.setupStatus ??
              body.setup_status
          ).toUpperCase() ||
          "BASLANGIC",

        is_active:
          booleanValue(
            body.isActive ??
              body.is_active,
            true
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,

        source:
          "WEB",

        updated_at_millis:
          now,

        created_at_millis:
          now,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      firm: data,
    });
  } catch (error) {
    console.error(
      "DORA FIRMS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA firması oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DORA FİRMASINI GÜNCELLE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(body.id);

    if (!id) {
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

    const updateData:
      Record<
        string,
        unknown
      > = {
      updated_at_millis:
        now,

      source:
        "WEB",
    };

    if (
      body.firmName !==
        undefined ||
      body.firm_name !==
        undefined
    ) {
      const firmName =
        text(
          body.firmName ??
            body.firm_name
        );

      if (!firmName) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Firma ünvanı boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.firm_name =
        firmName;
    }

    if (
      body.sgkNo !== undefined ||
      body.sgk_no !== undefined
    ) {
      updateData.sgk_no =
        text(
          body.sgkNo ??
            body.sgk_no
        );
    }

    if (
      body.taxNo !== undefined ||
      body.tax_no !== undefined
    ) {
      updateData.tax_no =
        text(
          body.taxNo ??
            body.tax_no
        );
    }

    if (
      body.taxOffice !==
        undefined ||
      body.tax_office !==
        undefined
    ) {
      updateData.tax_office =
        text(
          body.taxOffice ??
            body.tax_office
        );
    }

    if (
      body.mersisNo !==
        undefined ||
      body.mersis_no !==
        undefined
    ) {
      updateData.mersis_no =
        text(
          body.mersisNo ??
            body.mersis_no
        );
    }

    if (
      body.naceCode !==
        undefined ||
      body.nace_code !==
        undefined
    ) {
      updateData.nace_code =
        text(
          body.naceCode ??
            body.nace_code
        );
    }

    if (
      body.sector !==
      undefined
    ) {
      updateData.sector =
        text(body.sector);
    }

    if (
      body.dangerClass !==
        undefined ||
      body.danger_class !==
        undefined
    ) {
      updateData.danger_class =
        text(
          body.dangerClass ??
            body.danger_class
        ).toUpperCase();
    }

    if (
      body.employeeCount !==
        undefined ||
      body.employee_count !==
        undefined
    ) {
      updateData.employee_count =
        Math.max(
          0,
          Math.floor(
            numberValue(
              body.employeeCount ??
                body.employee_count,
              0
            )
          )
        );
    }

    if (
      body.address !==
      undefined
    ) {
      updateData.address =
        text(body.address);
    }

    if (
      body.phone !==
      undefined
    ) {
      updateData.phone =
        text(body.phone);
    }

    if (
      body.email !==
      undefined
    ) {
      updateData.email =
        text(body.email);
    }

    if (
      body.authorizedPerson !==
        undefined ||
      body.authorized_person !==
        undefined
    ) {
      updateData.authorized_person =
        text(
          body.authorizedPerson ??
            body.authorized_person
        );
    }

    if (
      body.note !==
      undefined
    ) {
      updateData.note =
        text(body.note);
    }

    if (
      body.setupScore !==
        undefined ||
      body.setup_score !==
        undefined
    ) {
      updateData.setup_score =
        Math.min(
          100,
          Math.max(
            0,
            Math.floor(
              numberValue(
                body.setupScore ??
                  body.setup_score,
                0
              )
            )
          )
        );
    }

    if (
      body.setupStatus !==
        undefined ||
      body.setup_status !==
        undefined
    ) {
      updateData.setup_status =
        text(
          body.setupStatus ??
            body.setup_status
        ).toUpperCase();
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

    const {
      data,
      error,
    } = await supabase
      .from("dora_firms")
      .update(updateData)
      .eq(
        "id",
        id
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
      firm: data,
    });
  } catch (error) {
    console.error(
      "DORA FIRMS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA firması güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
DORA FİRMASI SOFT DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(body.id);

    if (!id) {
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
      .from("dora_firms")
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
      "DORA FIRMS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA firması silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}