import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function mobileAuthorized(request: NextRequest) {
  const expected =
    process.env.DSEC_MOBILE_API_KEY ??
    "dsec_mobile_123";

  const actual =
    request.headers.get("x-api-key") ?? "";

  return actual === expected;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/*
 * ============================================================
 * DORA MOBILE FIRM RESOLVER
 * ============================================================
 *
 * Desteklenen GET çağrıları:
 *
 * 1)
 * /api/dora/mobile/firm-resolve?bootstrap=1
 *
 * App ilk açılışında web'deki aktif DORA firmasını getirir.
 *
 * 2)
 * /api/dora/mobile/firm-resolve?appLocalId=12
 *
 * Lokal app firma ID'sine bağlı DORA web firmasını getirir.
 *
 * POST:
 * App firmasını web DORA firmasıyla eşleştirir veya oluşturur.
 *
 * DİKKAT:
 * Bu endpoint yalnız public.dora_firms kullanır.
 * Ana D-SEC firma / DÖF / Risk / Ajanda tablolarına dokunmaz.
 */

export async function GET(request: NextRequest) {
  try {
    if (!mobileAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz mobil istek.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const bootstrap =
      searchParams.get("bootstrap") === "1";

    /*
     * ========================================================
     * BOOTSTRAP MODE
     * ========================================================
     *
     * AiIsgAsistaniScreen şu anda bunu kullanıyor:
     *
     * /firm-resolve?bootstrap=1
     */
    if (bootstrap) {
      const {
        data,
        error,
      } = await supabase
        .from("dora_firms")
        .select(`
          id,
          sync_key,
          app_local_id,
          firm_name,
          sgk_no,
          tax_no,
          tax_office,
          mersis_no,
          nace_code,
          sector,
          danger_class,
          employee_count,
          address,
          phone,
          email,
          authorized_person,
          note,
          setup_score,
          setup_status,
          is_active,
          source,
          created_at_millis,
          updated_at_millis
        `)
        .eq(
          "is_deleted",
          false
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "updated_at_millis",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Web'de aktif DORA firması bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        mode: "BOOTSTRAP",
        firm: data,
      });
    }

    /*
     * ========================================================
     * APP LOCAL ID MODE
     * ========================================================
     */

    const appLocalId =
      Number(
        searchParams.get("appLocalId")
      );

    if (
      !Number.isFinite(appLocalId) ||
      appLocalId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "bootstrap=1 veya geçerli appLocalId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("dora_firms")
      .select(`
        id,
        sync_key,
        app_local_id,
        firm_name,
        sgk_no,
        tax_no,
        tax_office,
        mersis_no,
        nace_code,
        sector,
        danger_class,
        employee_count,
        address,
        phone,
        email,
        authorized_person,
        note,
        setup_score,
        setup_status,
        is_active,
        source,
        created_at_millis,
        updated_at_millis
      `)
      .eq(
        "app_local_id",
        appLocalId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      mode: "APP_LOCAL_ID",
      firm: data ?? null,
    });
  } catch (error) {
    console.error(
      "DORA MOBILE FIRM RESOLVE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA web firma eşleştirmesi yapılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!mobileAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz mobil istek.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const appLocalId =
      numberOrZero(
        body.appLocalId
      );

    const firmName =
      text(
        body.firmName
      );

    if (
      appLocalId <= 0 ||
      !firmName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "appLocalId ve firmName zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * 1. LOCAL ID İLE MEVCUT EŞLEŞME
     * ========================================================
     */

    const {
      data: byLocalId,
      error: byLocalIdError,
    } = await supabase
      .from("dora_firms")
      .select("*")
      .eq(
        "app_local_id",
        appLocalId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (byLocalIdError) {
      throw byLocalIdError;
    }

    if (byLocalId) {
      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from("dora_firms")
        .update({
          firm_name:
            firmName,

          sgk_no:
            text(body.sgkNo),

          tax_no:
            text(body.taxNo),

          tax_office:
            text(body.taxOffice),

          mersis_no:
            text(body.mersisNo),

          nace_code:
            text(body.naceCode),

          sector:
            text(body.sector),

          danger_class:
            text(body.dangerClass),

          employee_count:
            Math.max(
              0,
              numberOrZero(
                body.employeeCount
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
              body.authorizedPerson
            ),

          note:
            text(body.note),

          is_active:
            true,

          source:
            "APP",

          updated_at_millis:
            Date.now(),
        })
        .eq(
          "id",
          byLocalId.id
        )
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        created: false,
        linkedExisting: false,
        firm: updated,
      });
    }

    /*
     * ========================================================
     * 2. AYNI İSİMLİ DORA FİRMASI VAR MI?
     * ========================================================
     */

    const {
      data: sameName,
      error: sameNameError,
    } = await supabase
      .from("dora_firms")
      .select("*")
      .eq(
        "firm_name",
        firmName
      )
      .eq(
        "is_deleted",
        false
      )
      .order(
        "updated_at_millis",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (sameNameError) {
      throw sameNameError;
    }

    if (sameName) {
      const {
        data: linked,
        error: linkError,
      } = await supabase
        .from("dora_firms")
        .update({
          app_local_id:
            appLocalId,

          is_active:
            true,

          source:
            "APP",

          updated_at_millis:
            Date.now(),
        })
        .eq(
          "id",
          sameName.id
        )
        .select("*")
        .single();

      if (linkError) {
        throw linkError;
      }

      return NextResponse.json({
        success: true,
        created: false,
        linkedExisting: true,
        firm: linked,
      });
    }

    /*
     * ========================================================
     * 3. YENİ DORA FİRMASI
     * ========================================================
     */

    const now =
      Date.now();

    const {
      data: inserted,
      error: insertError,
    } = await supabase
      .from("dora_firms")
      .insert({
        app_local_id:
          appLocalId,

        firm_name:
          firmName,

        sgk_no:
          text(body.sgkNo),

        tax_no:
          text(body.taxNo),

        tax_office:
          text(body.taxOffice),

        mersis_no:
          text(body.mersisNo),

        nace_code:
          text(body.naceCode),

        sector:
          text(body.sector),

        danger_class:
          text(body.dangerClass),

        employee_count:
          Math.max(
            0,
            numberOrZero(
              body.employeeCount
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
            body.authorizedPerson
          ),

        note:
          text(body.note),

        setup_score:
          0,

        setup_status:
          "BASLANGIC",

        is_active:
          true,

        is_deleted:
          false,

        source:
          "APP",

        created_at_millis:
          now,

        updated_at_millis:
          now,
      })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      created: true,
      linkedExisting: false,
      firm: inserted,
    });
  } catch (error) {
    console.error(
      "DORA MOBILE FIRM RESOLVE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA web firma eşleştirmesi yapılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}