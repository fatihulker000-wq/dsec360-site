import { cookies } from "next/headers";

type SupabaseLike = any;

export type ReportAuthScope = {
  role: string;
  userId: string | null;
  isGlobalAdmin: boolean;
  allowedCompanyIds: string[];
  selectedCompanyId: string;
};

const GLOBAL_ROLES = new Set(["admin", "super_admin"]);
const COMPANY_ROLES = new Set(["company_admin", "demo_user"]);

function text(v: unknown) {
  return String(v ?? "").trim();
}

export async function resolveReportScope(
  supabase: SupabaseLike,
  requestedCompanyIdRaw?: string | null,
): Promise<
  | { ok: true; scope: ReportAuthScope }
  | { ok: false; status: number; error: string }
> {
  const store = await cookies();

  const auth = text(
    store.get("dsec_admin_auth")?.value ||
      store.get("dsec_user_auth")?.value
  );

  const role = text(
    store.get("dsec_admin_role")?.value ||
      store.get("dsec_user_role")?.value
  );

  const userId = text(store.get("dsec_user_id")?.value) || null;
  const requestedCompanyId = text(requestedCompanyIdRaw);

  if (
    auth !== "ok" ||
    (!GLOBAL_ROLES.has(role) && !COMPANY_ROLES.has(role))
  ) {
    return { ok: false, status: 401, error: "Yetkisiz erişim." };
  }

  if (GLOBAL_ROLES.has(role)) {
    return {
      ok: true,
      scope: {
        role,
        userId,
        isGlobalAdmin: true,
        allowedCompanyIds: [],
        selectedCompanyId: requestedCompanyId || "ALL",
      },
    };
  }

  if (!userId) {
    return {
      ok: false,
      status: 401,
      error: "Kullanıcı bilgisi bulunamadı.",
    };
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id,role,company_id,is_active")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return {
      ok: false,
      status: 500,
      error: "Kullanıcı firma yetkileri alınamadı.",
    };
  }

  if (!userRow) {
    return { ok: false, status: 404, error: "Kullanıcı bulunamadı." };
  }

  if (userRow.is_active === false) {
    return {
      ok: false,
      status: 403,
      error: "Kullanıcı pasif durumda.",
    };
  }

  if (text(userRow.role) !== role) {
    return {
      ok: false,
      status: 403,
      error: "Oturum rolü ile kullanıcı rolü uyuşmuyor.",
    };
  }

  const ids = new Set<string>();

  const direct = text(userRow.company_id);
  if (direct && direct !== "ALL") ids.add(direct);

  const { data: accesses, error: accessError } = await supabase
    .from("user_firm_access")
    .select("firm_id")
    .eq("user_id", userId);

  if (accessError) {
    return {
      ok: false,
      status: 500,
      error: "Firma erişim yetkileri alınamadı.",
    };
  }

  for (const row of accesses ?? []) {
    const id = text(row?.firm_id);
    if (id && id !== "ALL") ids.add(id);
  }

  const allowedCompanyIds = [...ids];

  if (!allowedCompanyIds.length) {
    return {
      ok: false,
      status: 403,
      error: "Bu kullanıcıya bağlı firma bulunamadı.",
    };
  }

  if (!requestedCompanyId) {
    if (allowedCompanyIds.length !== 1) {
      return {
        ok: false,
        status: 400,
        error: "Rapor için firma seçilmelidir.",
      };
    }

    return {
      ok: true,
      scope: {
        role,
        userId,
        isGlobalAdmin: false,
        allowedCompanyIds,
        selectedCompanyId: allowedCompanyIds[0],
      },
    };
  }

  if (requestedCompanyId === "ALL") {
    return {
      ok: false,
      status: 403,
      error: "Bu kullanıcı tüm firmalar raporunu görüntüleyemez.",
    };
  }

  if (!allowedCompanyIds.includes(requestedCompanyId)) {
    return {
      ok: false,
      status: 403,
      error: "Seçilen firma için rapor erişim yetkiniz yok.",
    };
  }

  return {
    ok: true,
    scope: {
      role,
      userId,
      isGlobalAdmin: false,
      allowedCompanyIds,
      selectedCompanyId: requestedCompanyId,
    },
  };
}
