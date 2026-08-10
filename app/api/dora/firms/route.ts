import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(
  value: unknown
): string {
  return String(value ?? "").trim();
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

    if (id) {
      const {
        data,
        error,
      } = await supabase
        .from("dora_firms")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .maybeSingle();

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

    const {
      data,
      error,
    } = await supabase
      .from("dora_firms")
      .select("*")
      .eq("is_deleted", false)
      .order(
        "updated_at_millis",
        {
          ascending: false,
        }
      );

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
          Math.max(
            0,
            Math.floor(
              numberValue(
                body.employeeCount ??
                  body.employee_count,
                0
              )
            )
          ),

        address:
          text(body.address),

        phone:
          text(body.phone),

        email:
          text(body.email),

        authorized_person:
          text(
            body.authorizedPerson ??
              body.authorized_person
          ),

        note:
          text(body.note),

        setup_score:
          0,

        setup_status:
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
      body.firmName !==
        undefined ||
      body.firm_name !==
        undefined
    ) {
      updateData.firm_name =
        text(
          body.firmName ??
            body.firm_name
        );
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
      body.sector !== undefined
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
      body.address !== undefined
    ) {
      updateData.address =
        text(body.address);
    }

    if (
      body.phone !== undefined
    ) {
      updateData.phone =
        text(body.phone);
    }

    if (
      body.email !== undefined
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
      body.note !== undefined
    ) {
      updateData.note =
        text(body.note);
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
      .eq("id", id)
      .eq("is_deleted", false)
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
      .eq("id", id)
      .eq("is_deleted", false)
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