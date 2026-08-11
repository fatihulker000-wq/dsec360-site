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

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function booleanValue(
  value: unknown,
  fallback: boolean
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  return fallback;
}

const VALID_ROLES = new Set([
  "ISVEREN_VEKILI",
  "ISG_UZMANI",
  "ISYERI_HEKIMI",
  "CALISAN_TEMSILCISI",
  "DESTEK_ELEMANI",
  "BIRIM_TEMSILCISI",
  "DIGER",
]);

function normalizeRole(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

/* =========================================================
GET
DORA RİSK DEĞERLENDİRME EKİBİ
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

    const role =
      normalizeRole(
        searchParams.get(
          "role"
        )
      );

    if (
      !firmId &&
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya ekip üyesi ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_risk_team_members"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        );

      if (firmId) {
        query =
          query.eq(
            "firm_id",
            firmId
          );
      }

      const {
        data,
        error,
      } = await query
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA risk ekibi üyesi bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        member: data,
      });
    }

    let query = supabase
      .from(
        "dora_risk_team_members"
      )
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      );

    if (role) {
      query =
        query.eq(
          "role_type",
          role
        );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "created_at_millis",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      members:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA RISK TEAM GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA risk ekibi alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ EKİP ÜYESİ
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

    const roleType =
      normalizeRole(
        body.roleType ??
          body.role_type
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

    if (
      !VALID_ROLES.has(
        roleType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz risk değerlendirme ekibi rolü.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from(
        "dora_firms"
      )
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

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_risk_team_members"
      )
      .insert({
        firm_id:
          firmId,

        full_name:
          fullName,

        title:
          text(
            body.title
          ),

        role_type:
          roleType,

        certificate_no:
          text(
            body.certificateNo ??
              body.certificate_no
          ),

        phone:
          text(
            body.phone
          ),

        email:
          text(
            body.email
          ),

        note:
          text(
            body.note
          ),

        show_in_report:
          booleanValue(
            body.showInReport ??
              body.show_in_report,
            true
          ),

        sort_order:
          nullableNumber(
            body.sortOrder ??
              body.sort_order
          ) ?? 0,

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
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      member: data,
    });
  } catch (error) {
    console.error(
      "DORA RISK TEAM POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA risk ekibi üyesi oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
EKİP ÜYESİNİ GÜNCELLE
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
            "Ekip üyesi ID zorunludur.",
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
      > = {};

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
      body.title !==
      undefined
    ) {
      updateData.title =
        text(
          body.title
        );
    }

    if (
      body.roleType !==
        undefined ||
      body.role_type !==
        undefined
    ) {
      const roleType =
        normalizeRole(
          body.roleType ??
            body.role_type
        );

      if (
        !VALID_ROLES.has(
          roleType
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz ekip rolü.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.role_type =
        roleType;
    }

    if (
      body.certificateNo !==
        undefined ||
      body.certificate_no !==
        undefined
    ) {
      updateData.certificate_no =
        text(
          body.certificateNo ??
            body.certificate_no
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
      body.note !==
      undefined
    ) {
      updateData.note =
        text(
          body.note
        );
    }

    if (
      body.showInReport !==
        undefined ||
      body.show_in_report !==
        undefined
    ) {
      updateData.show_in_report =
        booleanValue(
          body.showInReport ??
            body.show_in_report,
          true
        );
    }

    if (
      body.sortOrder !==
        undefined ||
      body.sort_order !==
        undefined
    ) {
      updateData.sort_order =
        nullableNumber(
          body.sortOrder ??
            body.sort_order
        ) ?? 0;
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
      .from(
        "dora_risk_team_members"
      )
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
      member: data,
    });
  } catch (error) {
    console.error(
      "DORA RISK TEAM PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA risk ekibi üyesi güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
SOFT DELETE
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
            "Ekip üyesi ID zorunludur.",
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
      .from(
        "dora_risk_team_members"
      )
      .update({
        is_deleted:
          true,

        is_active:
          false,

        deleted_at_millis:
          now,
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
      "DORA RISK TEAM DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA risk ekibi üyesi silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}