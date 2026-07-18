import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase yapılandırması eksik."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function normalizeFirmName(
  value: string
) {
  return normalizeKey(value)
    .replace(/\s+/g, " ")
    .replace(/a\.s\./g, "as")
    .replace(/a\.ş\./g, "as")
    .replace(
      /anonim sirketi/g,
      ""
    )
    .replace(
      /limited sirketi/g,
      ""
    )
    .replace(/ltd\.sti\./g, "")
    .replace(/ltd/g, "")
    .replace(/sti/g, "")
    .trim();
}

type AdminSession = {
  userId: string;
  role:
    | "super_admin"
    | "company_admin"
    | "demo_user";
  companyId: string;
  readOnly: boolean;
};

type CompanyRow = {
  id: string | number;
  name: string | null;
};

type CbsRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  message: string | null;
  created_at: string | null;
  status: string | null;
  category: string | null;
  firm_id:
    | string
    | number
    | null;
  assigned_to: string | null;
  resolution_note:
    | string
    | null;
  firma_adi: string | null;
  priority: string | null;
  sla_due_at: string | null;
  closed_at: string | null;
};

async function getAdminSession():
  Promise<AdminSession | null> {
  const cookieStore =
    await cookies();

  const auth = clean(
    cookieStore.get(
      "dsec_admin_auth"
    )?.value ||
      cookieStore.get(
        "dsec_user_auth"
      )?.value
  );

  const role = clean(
    cookieStore.get(
      "dsec_admin_role"
    )?.value ||
      cookieStore.get(
        "dsec_user_role"
      )?.value
  );

  const userId = clean(
    cookieStore.get(
      "dsec_user_id"
    )?.value
  );

  const companyIdFromCookie =
    clean(
      cookieStore.get(
        "dsec_company_id"
      )?.value
    );

  const allowedRoles = [
    "super_admin",
    "company_admin",
    "demo_user",
  ];

  if (
    auth !== "ok" ||
    !allowedRoles.includes(role)
  ) {
    return null;
  }

  if (role === "super_admin") {
    return {
      userId:
        userId || "cookie-admin",
      role: "super_admin",
      companyId: "",
      readOnly: false,
    };
  }

  if (!userId) {
    if (!companyIdFromCookie) {
      return null;
    }

    return {
      userId: "cookie-user",
      role:
        role === "demo_user"
          ? "demo_user"
          : "company_admin",
      companyId:
        companyIdFromCookie,
      readOnly:
        role === "demo_user",
    };
  }

  try {
    const supabase =
      getSupabase();

    const {
      data,
      error,
    } = await supabase
      .from("users")
      .select(
        "id, role, company_id, is_active"
      )
      .eq("id", userId)
      .maybeSingle();

    if (
      error ||
      !data ||
      data.is_active === false
    ) {
      return null;
    }

    const databaseRole =
      clean(data.role);

    if (databaseRole !== role) {
      return null;
    }

    let companyId = clean(
      data.company_id
    );

    if (!companyId) {
      const {
        data: primaryAccess,
      } = await supabase
        .from(
          "user_firm_access"
        )
        .select("firm_id")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle();

      companyId = clean(
        primaryAccess?.firm_id
      );
    }

    if (!companyId) {
      companyId =
        companyIdFromCookie;
    }

    if (!companyId) {
      return null;
    }

    return {
      userId: clean(data.id),
      role:
        role === "demo_user"
          ? "demo_user"
          : "company_admin",
      companyId,
      readOnly:
        role === "demo_user",
    };
  } catch (error) {
    console.error(
      "getAdminSession hata:",
      error
    );

    return null;
  }
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Yetkisiz erişim.",
    },
    { status: 401 }
  );
}

function readOnlyError() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Demo kullanıcısı ÇBS kayıtlarını değiştiremez.",
    },
    { status: 403 }
  );
}

async function getAuthorizedRecord(
  id: number,
  session: AdminSession
): Promise<{
  id: number;
  firm_id:
    | string
    | number
    | null;
} | null> {
  const supabase =
    getSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("cbs_forms")
    .select("id, firm_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (
    session.role ===
    "super_admin"
  ) {
    return data;
  }

  const recordFirmId = clean(
    data.firm_id
  );

  if (
    !recordFirmId ||
    recordFirmId !==
      session.companyId
  ) {
    return null;
  }

  return data;
}

function findSuggestedCompany(
  item: Pick<
    CbsRow,
    "firma_adi" | "firm_id"
  >,
  companies: CompanyRow[]
) {
  const rawFirmId = clean(
    item.firm_id
  );

  const rawCompanyName = clean(
    item.firma_adi
  );

  if (rawFirmId) {
    const exactIdMatch =
      companies.find(
        (company) =>
          clean(company.id) ===
          rawFirmId
      );

    if (exactIdMatch) {
      return {
        suggestedFirmId:
          clean(
            exactIdMatch.id
          ),
        suggestedFirmName:
          clean(
            exactIdMatch.name
          ) || null,
      };
    }
  }

  const normalizedInput =
    normalizeFirmName(
      rawCompanyName
    );

  if (!normalizedInput) {
    return {
      suggestedFirmId: null,
      suggestedFirmName: null,
    };
  }

  const exact =
    companies.find(
      (company) =>
        normalizeFirmName(
          clean(company.name)
        ) === normalizedInput
    );

  const matched =
    exact ||
    companies.find(
      (company) => {
        const databaseName =
          normalizeFirmName(
            clean(company.name)
          );

        return (
          databaseName.includes(
            normalizedInput
          ) ||
          normalizedInput.includes(
            databaseName
          )
        );
      }
    );

  if (matched?.id) {
    return {
      suggestedFirmId:
        clean(matched.id),
      suggestedFirmName:
        clean(matched.name) ||
        null,
    };
  }

  return {
    suggestedFirmId: null,
    suggestedFirmName: null,
  };
}

/* =========================
   GET
========================= */

export async function GET(
  req: Request
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return unauthorized();
    }

    const supabase =
      getSupabase();

    const url =
      new URL(req.url);

    const firmIdParam = clean(
      url.searchParams.get(
        "firmId"
      )
    );

    let query = supabase
      .from("cbs_forms")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (
      session.role ===
        "company_admin" ||
      session.role === "demo_user"
    ) {
      query = query.eq(
        "firm_id",
        session.companyId
      );
    } else if (
      firmIdParam &&
      firmIdParam !== "all"
    ) {
      query = query.eq(
        "firm_id",
        firmIdParam
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "CBS GET hata:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kayıtlar alınamadı.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    let companiesQuery =
      supabase
        .from("companies")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

    if (
      session.role ===
        "company_admin" ||
      session.role === "demo_user"
    ) {
      companiesQuery =
        companiesQuery.eq(
          "id",
          session.companyId
        );
    }

    const {
      data: companies,
      error: companiesError,
    } = await companiesQuery;

    if (companiesError) {
      console.error(
        "CBS companies hata:",
        companiesError
      );
    }

    const companyList:
      CompanyRow[] =
      companies || [];

    const formatted = (
      (data || []) as CbsRow[]
    ).map((item) => {
      const directFirmId =
        clean(item.firm_id) ||
        null;

      const {
        suggestedFirmId,
        suggestedFirmName,
      } =
        findSuggestedCompany(
          item,
          companyList
        );

      return {
        id: item.id,
        full_name:
          item.full_name || "",
        email:
          item.email || "",
        message:
          item.message || "",
        created_at:
          item.created_at,
        status:
          item.status || "new",
        category:
          item.category ||
          "Genel",
        firmId:
          directFirmId,
        assignedTo:
          item.assigned_to ||
          "",
        resolutionNote:
          item.resolution_note ||
          "",
        firma_adi:
          item.firma_adi || "",
        priority:
          item.priority ||
          "normal",
        sla_due_at:
          item.sla_due_at ||
          null,
        closed_at:
          item.closed_at ||
          null,
        suggestedFirmId,
        suggestedFirmName,
      };
    });

    return NextResponse.json({
      success: true,
      role: session.role,
      read_only:
        session.readOnly,
      data: formatted,
      companies:
        companyList.map(
          (company) => ({
            id: clean(
              company.id
            ),
            name: clean(
              company.name
            ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "CBS GET genel hata:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Sunucu hatası.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH
========================= */

export async function PATCH(
  req: Request
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return unauthorized();
    }

    if (session.readOnly) {
      return readOnlyError();
    }

    const body =
      await req.json();

    const id = Number(body?.id);
    const status = clean(
      body?.status
    );

    if (!id || !status) {
      return NextResponse.json(
        {
          error:
            "ID ve durum zorunludur.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "new",
      "read",
      "processing",
      "closed",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Geçersiz durum değeri.",
        },
        { status: 400 }
      );
    }

    const record =
      await getAuthorizedRecord(
        id,
        session
      );

    if (!record) {
      return NextResponse.json(
        {
          error:
            "Bu kayıt için yetkiniz yok.",
        },
        { status: 403 }
      );
    }

    const supabase =
      getSupabase();

    const updatePayload:
      Record<string, unknown> = {
      status,
      updated_at:
        new Date().toISOString(),
      closed_at:
        status === "closed"
          ? new Date().toISOString()
          : null,
    };

    const { error } =
      await supabase
        .from("cbs_forms")
        .update(updatePayload)
        .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error:
            "Durum güncellenemedi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CBS PATCH genel hata:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   PUT
========================= */

export async function PUT(
  req: Request
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return unauthorized();
    }

    if (session.readOnly) {
      return readOnlyError();
    }

    const body =
      await req.json();

    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const record =
      await getAuthorizedRecord(
        id,
        session
      );

    if (!record) {
      return NextResponse.json(
        {
          error:
            "Bu kayıt için yetkiniz yok.",
        },
        { status: 403 }
      );
    }

    const supabase =
      getSupabase();

    const updatePayload:
      Record<string, unknown> = {
      updated_at:
        new Date().toISOString(),
    };

    if (
      body?.category !== undefined
    ) {
      updatePayload.category =
        clean(body.category) ||
        null;
    }

    if (
      body?.assignedTo !==
      undefined
    ) {
      updatePayload.assigned_to =
        clean(body.assignedTo) ||
        null;
    }

    if (
      body?.resolutionNote !==
      undefined
    ) {
      updatePayload.resolution_note =
        clean(
          body.resolutionNote
        ) || null;
    }

    if (
      body?.priority !== undefined
    ) {
      const priority = clean(
        body.priority
      );

      const allowedPriorities = [
        "low",
        "normal",
        "high",
        "critical",
      ];

      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Geçersiz öncelik değeri.",
          },
          { status: 400 }
        );
      }

      updatePayload.priority =
        priority;
    }

    if (
      body?.firmId !== undefined
    ) {
      const firmId =
        clean(body.firmId) ||
        null;

      if (
        session.role !==
          "super_admin" &&
        firmId &&
        firmId !==
          session.companyId
      ) {
        return NextResponse.json(
          {
            error:
              "Sadece kendi firmanı bağlayabilirsin.",
          },
          { status: 403 }
        );
      }

      updatePayload.firm_id =
        firmId;

      if (firmId) {
        const {
          data: company,
          error: companyError,
        } = await supabase
          .from("companies")
          .select("id, name")
          .eq("id", firmId)
          .maybeSingle();

        if (companyError) {
          return NextResponse.json(
            {
              error:
                "Firma bilgisi alınamadı.",
            },
            { status: 500 }
          );
        }

        updatePayload.firma_adi =
          clean(company?.name) ||
          null;
      } else {
        updatePayload.firma_adi =
          null;
      }
    }

    const { error } =
      await supabase
        .from("cbs_forms")
        .update(updatePayload)
        .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error:
            "Güncelleme yapılamadı.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CBS PUT genel hata:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */

export async function DELETE(
  req: Request
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return unauthorized();
    }

    if (session.readOnly) {
      return readOnlyError();
    }

    const body =
      await req.json();

    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const record =
      await getAuthorizedRecord(
        id,
        session
      );

    if (!record) {
      return NextResponse.json(
        {
          error:
            "Bu kayıt için yetkiniz yok.",
        },
        { status: 403 }
      );
    }

    const supabase =
      getSupabase();

    const { error } =
      await supabase
        .from("cbs_forms")
        .delete()
        .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          error:
            "Kayıt silinemedi.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CBS DELETE genel hata:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}