import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  createRecord,
  deleteRecord,
  getBundle,
  updateRecord,
} from "../../../../lib/emergency/repository";

import { syncEmergencyRecords } from "../../../../lib/emergency/sync";

import type { EmergencyEntity } from "../../../../lib/emergency/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccessContext = {
  allowed: boolean;
  role: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ENV bulunamadı.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getAccessContext(): Promise<AccessContext> {
  const cookieStore = await cookies();

  const auth = String(
    cookieStore.get("dsec_admin_auth")?.value ||
      cookieStore.get("dsec_user_auth")?.value ||
      ""
  ).trim();

  const role = String(
    cookieStore.get("dsec_admin_role")?.value ||
      cookieStore.get("dsec_user_role")?.value ||
      ""
  ).trim();

  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  const allowedRoles = [
    "admin",
    "super_admin",
    "company_admin",
    "demo_user",
  ];

  const companyScoped =
    role === "company_admin" || role === "demo_user";

  return {
    allowed:
      auth === "ok" &&
      allowedRoles.includes(role) &&
      (!companyScoped || Boolean(companyId)),

    role,
    companyId,
    companyScoped,
    readOnly: role === "demo_user",
  };
}

function normalizeEntity(value: unknown): EmergencyEntity | null {
  const entity = String(value || "")
    .trim()
    .toUpperCase();

  if (
    entity === "PLAN" ||
    entity === "TEAM" ||
    entity === "DRILL"
  ) {
    return entity;
  }

  return null;
}

function validateRecord(
  entity: EmergencyEntity,
  record: Record<string, unknown>
) {
  if (!String(record.firmId || "").trim()) {
    return "Firma bilgisi zorunludur.";
  }

  if (
    entity === "PLAN" &&
    !String(record.planTitle || "").trim()
  ) {
    return "Plan başlığı zorunludur.";
  }

  if (
    entity === "TEAM" &&
    !String(record.fullName || "").trim()
  ) {
    return "Ad soyad zorunludur.";
  }

  if (
    entity === "DRILL" &&
    !Number(record.drillDateMillis || 0)
  ) {
    return "Tatbikat tarihi zorunludur.";
  }

  return "";
}

export async function GET(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    const url = new URL(request.url);

    const requestedFirmId = String(
      url.searchParams.get("firmId") || ""
    ).trim();

    const firmId = access.companyScoped
      ? access.companyId
      : requestedFirmId;

    if (!firmId) {
      return NextResponse.json({
        success: true,
        plans: [],
        teams: [],
        drills: [],
      });
    }

    const bundle = await getBundle(
      getSupabase(),
      firmId
    );

    return NextResponse.json({
      success: true,
      ...bundle,
    });
  } catch (error) {
    console.error("emergency GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Acil durum verileri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı kayıt oluşturamaz.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request
      .json()
      .catch(() => ({}));

    if (Array.isArray(body.records)) {
      const result = await syncEmergencyRecords(
        getSupabase(),
        body.records,
        access.companyScoped
          ? access.companyId
          : ""
      );

      return NextResponse.json({
        success:
          result.failedIndexes.length === 0,
        ...result,
      });
    }

    const entity = normalizeEntity(body.entity);

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          message: "Geçersiz kayıt türü.",
        },
        {
          status: 400,
        }
      );
    }

    const record =
      body.record &&
      typeof body.record === "object"
        ? { ...body.record }
        : {};

    if (access.companyScoped) {
      record.firmId = access.companyId;
    }

    const validationError =
      validateRecord(entity, record);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        {
          status: 400,
        }
      );
    }

    const saved = await createRecord(
      getSupabase(),
      entity,
      record
    );

    return NextResponse.json({
      success: true,
      record: saved,
    });
  } catch (error) {
    console.error("emergency POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Acil durum kaydı oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı kayıt düzenleyemez.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request
      .json()
      .catch(() => ({}));

    const entity = normalizeEntity(body.entity);

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          message: "Geçersiz kayıt türü.",
        },
        {
          status: 400,
        }
      );
    }

    const record =
      body.record &&
      typeof body.record === "object"
        ? { ...body.record }
        : {};

    if (access.companyScoped) {
      record.firmId = access.companyId;
    }

    const validationError =
      validateRecord(entity, record);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        {
          status: 400,
        }
      );
    }

    const saved = await updateRecord(
      getSupabase(),
      entity,
      record,
      access.companyScoped
        ? access.companyId
        : ""
    );

    return NextResponse.json({
      success: true,
      record: saved,
    });
  } catch (error) {
    console.error("emergency PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Acil durum kaydı güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı kayıt silemez.",
        },
        {
          status: 403,
        }
      );
    }

    const url = new URL(request.url);

    const entity = normalizeEntity(
      url.searchParams.get("entity")
    );

    const id = String(
      url.searchParams.get("id") || ""
    ).trim();

    if (!entity || !id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kayıt türü veya ID eksik.",
        },
        {
          status: 400,
        }
      );
    }

    const deletedId = await deleteRecord(
      getSupabase(),
      entity,
      id,
      access.companyScoped
        ? access.companyId
        : ""
    );

    return NextResponse.json({
      success: true,
      id: deletedId,
    });
  } catch (error) {
    console.error("emergency DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Acil durum kaydı silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}