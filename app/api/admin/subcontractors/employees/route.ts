import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function db() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function text(v: unknown) {
  return String(v ?? "").trim();
}

function num(v: unknown): number | null {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return null;
  }

  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : null;
}

function bool(
  v: unknown,
  fallback = false
): boolean {
  if (typeof v === "boolean") {
    return v;
  }

  if (typeof v === "number") {
    return v !== 0;
  }

  if (typeof v === "string") {
    const x =
      v.trim().toLowerCase();

    if (
      x === "true" ||
      x === "1" ||
      x === "yes" ||
      x === "evet"
    ) {
      return true;
    }

    if (
      x === "false" ||
      x === "0" ||
      x === "no" ||
      x === "hayır" ||
      x === "hayir"
    ) {
      return false;
    }
  }

  return fallback;
}

// =========================================================
// GET
// companyId + firmId ile çalışanları getir
// =========================================================

export async function GET(
  req: NextRequest
) {
  try {
    const firmId =
      text(
        req.nextUrl.searchParams.get(
          "firmId"
        )
      );

    const companyId =
      text(
        req.nextUrl.searchParams.get(
          "companyId"
        )
      );

    if (!firmId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId ve companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_employees"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "company_id",
          companyId
        )
        .eq(
          "is_deleted",
          false
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

    return NextResponse.json(
      {
        success: true,
        employees:
          data ?? [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "subcontractor employees GET error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Çalışanlar alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================================
// POST
// Yeni çalışan oluştur
// =========================================================

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    const fullName =
      text(body.fullName);

    if (
      !firmId ||
      !companyId ||
      !fullName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId, companyId ve fullName zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const syncKey =
      text(body.syncKey) ||
      `web-subemp-${crypto.randomUUID()}`;

    const supabase =
      db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_employees"
        )
        .insert({
          firm_id:
            firmId,

          company_id:
            companyId,

          app_local_id:
            null,

          app_company_local_id:
            null,

          sync_key:
            syncKey,

          full_name:
            fullName,

          tc_no:
            text(body.tcNo),

          position:
            text(body.position),

          phone:
            text(body.phone),

          entry_card_no:
            text(
              body.entryCardNo
            ),

          photo_url:
            text(body.photoUrl) ||
            null,

          is_inside:
            bool(
              body.isInside,
              false
            ),

          sgk_entry_ok:
            bool(
              body.sgkEntryOk,
              false
            ),

          isg_training_ok:
            bool(
              body.isgTrainingOk,
              false
            ),

          health_report_ok:
            bool(
              body.healthReportOk,
              false
            ),

          myk_certificate_ok:
            bool(
              body.mykCertificateOk,
              false
            ),

          kkd_delivery_ok:
            bool(
              body.kkdDeliveryOk,
              false
            ),

          site_orientation_ok:
            bool(
              body.siteOrientationOk,
              false
            ),

          work_at_height_ok:
            bool(
              body.workAtHeightOk,
              false
            ),

          access_blocked_note:
            text(
              body.accessBlockedNote
            ),

          employee_status:
            text(
              body.employeeStatus
            ) || "TASLAK",

          approval_status:
            text(
              body.approvalStatus
            ) || "BEKLIYOR",

          entry_permission:
            bool(
              body.entryPermission,
              false
            ),

          approved_at_millis:
            num(
              body.approvedAtMillis
            ),

          approved_by:
            text(
              body.approvedBy
            ),

          revision_note:
            text(
              body.revisionNote
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
      data,
    });
  } catch (error) {
    console.error(
      "subcontractor employees POST error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Çalışan eklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}


async function validateEntryPermission(
  supabase: ReturnType<typeof db>,
  args: {
    firmId: string;
    companyId: string;
    employeeId: string;
    body: any;
  }
) {
  const {
    firmId,
    companyId,
    employeeId,
    body,
  } = args;

  const now = Date.now();

  const [
    companyResult,
    employeeResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from("subcontractor_companies")
      .select(
        "id,is_active,approval_status,application_status,contract_end_millis"
      )
      .eq("id", companyId)
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .maybeSingle(),

    supabase
      .from("subcontractor_employees")
      .select("*")
      .eq("id", employeeId)
      .eq("firm_id", firmId)
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .maybeSingle(),

    supabase
      .from("subcontractor_employee_documents")
      .select(
        "id,is_required,status,valid_until_millis"
      )
      .eq("firm_id", firmId)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("is_deleted", false),
  ]);

  if (companyResult.error) {
    throw companyResult.error;
  }

  if (employeeResult.error) {
    throw employeeResult.error;
  }

  if (documentsResult.error) {
    throw documentsResult.error;
  }

  const company = companyResult.data;
  const employee = employeeResult.data;

  if (!company) {
    throw new Error(
      "Taşeron firma bulunamadı."
    );
  }

  if (!employee) {
    throw new Error(
      "Çalışan bulunamadı."
    );
  }

  if (company.is_active !== true) {
    throw new Error(
      "Firma aktif olmadığı için saha giriş yetkisi verilemez."
    );
  }

  if (
    text(company.approval_status)
      .toUpperCase() !== "ONAYLANDI"
  ) {
    throw new Error(
      "Firma onaylanmadan çalışana saha giriş yetkisi verilemez."
    );
  }

  if (
    company.contract_end_millis &&
    Number(
      company.contract_end_millis
    ) < now
  ) {
    throw new Error(
      "Firmanın sözleşme süresi dolduğu için saha giriş yetkisi verilemez."
    );
  }

  const effectiveApprovalStatus =
    body.approvalStatus !== undefined
      ? text(body.approvalStatus)
      : text(employee.approval_status);

  if (
    effectiveApprovalStatus
      .toUpperCase() !== "ONAYLANDI"
  ) {
    throw new Error(
      "Çalışan onaylanmadan saha giriş yetkisi verilemez."
    );
  }

  const getBool = (
    bodyKey: string,
    rowKey: string
  ) =>
    body[bodyKey] !== undefined
      ? bool(body[bodyKey])
      : employee[rowKey] === true;

  const compliance = [
    ["SGK girişi", getBool("sgkEntryOk", "sgk_entry_ok")],
    ["İSG eğitimi", getBool("isgTrainingOk", "isg_training_ok")],
    ["Sağlık raporu", getBool("healthReportOk", "health_report_ok")],
    ["MYK belgesi", getBool("mykCertificateOk", "myk_certificate_ok")],
    ["KKD teslimi", getBool("kkdDeliveryOk", "kkd_delivery_ok")],
    ["Saha oryantasyonu", getBool("siteOrientationOk", "site_orientation_ok")],
    ["Yüksekte çalışma", getBool("workAtHeightOk", "work_at_height_ok")],
  ] as const;

  const missingCompliance =
    compliance
      .filter(([, ok]) => !ok)
      .map(([label]) => label);

  if (missingCompliance.length > 0) {
    throw new Error(
      `Saha giriş yetkisi verilemez. Eksik uygunluk: ${missingCompliance.join(", ")}.`
    );
  }

  const requiredDocuments =
    (documentsResult.data ?? [])
      .filter(
        (doc: any) =>
          doc.is_required === true
      );

  const invalidDocuments =
    requiredDocuments.filter(
      (doc: any) =>
        text(doc.status)
          .toUpperCase() !== "TAM" ||
        (
          doc.valid_until_millis &&
          Number(
            doc.valid_until_millis
          ) < now
        )
    );

  if (invalidDocuments.length > 0) {
    throw new Error(
      "Çalışanın zorunlu evrakları eksik veya süresi dolmuş. Saha giriş yetkisi verilemez."
    );
  }

  const blockedNote =
    body.accessBlockedNote !== undefined
      ? text(body.accessBlockedNote)
      : text(
          employee.access_blocked_note
        );

  if (blockedNote) {
    throw new Error(
      "Giriş engel açıklaması bulunduğu için saha giriş yetkisi verilemez. Önce giriş engel açıklamasını temizleyin."
    );
  }
}

// =========================================================
// PATCH
// Çalışan güncelle
// =========================================================

export async function PATCH(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    if (
      !id ||
      !firmId ||
      !companyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id, firmId ve companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const payload:
      Record<string, unknown> = {
        updated_at_millis:
          Date.now(),

        source:
          "WEB",
      };

    const textMap:
      Record<string, string> = {
        fullName:
          "full_name",

        tcNo:
          "tc_no",

        position:
          "position",

        phone:
          "phone",

        entryCardNo:
          "entry_card_no",

        photoUrl:
          "photo_url",

        accessBlockedNote:
          "access_blocked_note",

        employeeStatus:
          "employee_status",

        approvalStatus:
          "approval_status",

        approvedBy:
          "approved_by",

        revisionNote:
          "revision_note",
      };

    for (
      const [
        from,
        to,
      ] of Object.entries(
        textMap
      )
    ) {
      if (
        body[from] !==
        undefined
      ) {
        payload[to] =
          text(body[from]);
      }
    }

    const booleanMap:
      Record<string, string> = {
        isInside:
          "is_inside",

        sgkEntryOk:
          "sgk_entry_ok",

        isgTrainingOk:
          "isg_training_ok",

        healthReportOk:
          "health_report_ok",

        mykCertificateOk:
          "myk_certificate_ok",

        kkdDeliveryOk:
          "kkd_delivery_ok",

        siteOrientationOk:
          "site_orientation_ok",

        workAtHeightOk:
          "work_at_height_ok",

        entryPermission:
          "entry_permission",
      };

    for (
      const [
        from,
        to,
      ] of Object.entries(
        booleanMap
      )
    ) {
      if (
        body[from] !==
        undefined
      ) {
        payload[to] =
          bool(body[from]);
      }
    }

    if (
      body.approvedAtMillis !==
      undefined
    ) {
      payload.approved_at_millis =
        num(
          body.approvedAtMillis
        );
    }

    const supabase =
      db();

    const requestedEntryPermission =
      body.entryPermission !== undefined
        ? bool(body.entryPermission)
        : undefined;

    if (
      requestedEntryPermission === true
    ) {
      await validateEntryPermission(
        supabase,
        {
          firmId,
          companyId,
          employeeId: id,
          body,
        }
      );

      payload.entry_permission = true;
      payload.employee_status =
        "SAHAYA_GIREBILIR";
      payload.approval_status =
        "ONAYLANDI";
      payload.approved_at_millis =
        Date.now();
      payload.access_blocked_note =
        "";
    }

    if (
      requestedEntryPermission === false
    ) {
      payload.entry_permission = false;

      if (
        text(body.employeeStatus)
          .toUpperCase() ===
        "SAHAYA_GIREBILIR"
      ) {
        payload.employee_status =
          "ONAYLANDI";
      }
    }

    if (
      body.approvalStatus !== undefined &&
      text(body.approvalStatus)
        .toUpperCase() ===
        "REDDEDILDI"
    ) {
      payload.entry_permission = false;
      payload.employee_status =
        "GIRIS_ENGELLI";
    }

    if (
      body.accessBlockedNote !== undefined &&
      text(body.accessBlockedNote)
    ) {
      payload.entry_permission = false;
      payload.employee_status =
        "GIRIS_ENGELLI";
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_employees"
        )
        .update(
          payload
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
          "company_id",
          companyId
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
      data,
    });
  } catch (error) {
    console.error(
      "subcontractor employees PATCH error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Çalışan güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================================
// DELETE
// Soft delete
// =========================================================

export async function DELETE(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    const companyId =
      text(body.companyId);

    if (
      !id ||
      !firmId ||
      !companyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id, firmId ve companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const supabase =
      db();

    const {
      error,
    } =
      await supabase
        .from(
          "subcontractor_employees"
        )
        .update({
          is_deleted:
            true,

          deleted_at_millis:
            now,

          is_inside:
            false,

          entry_permission:
            false,

          source:
            "WEB",

          updated_at_millis:
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
          "company_id",
          companyId
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "subcontractor employees DELETE error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Çalışan silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}