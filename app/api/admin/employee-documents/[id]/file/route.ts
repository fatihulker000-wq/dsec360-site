import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "employee-documents";
const STORAGE_PREFIX = `storage://${BUCKET}/`;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAdminAllowed(role?: string) {
  return role === "super_admin" || role === "company_admin";
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  if (adminAuth !== "ok" || !isAdminAllowed(adminRole)) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const supabase = getSupabase();

  const { data: document, error } = await supabase
    .from("employee_documents")
    .select("id,file_url,is_deleted")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Belge kontrol edilemedi.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  if (!document?.file_url) {
    return NextResponse.json(
      { error: "Belge dosyası bulunamadı." },
      { status: 404 }
    );
  }

  const fileUrl = String(document.file_url);

  if (
    fileUrl.startsWith("https://") ||
    fileUrl.startsWith("http://")
  ) {
    return NextResponse.redirect(fileUrl);
  }

  if (!fileUrl.startsWith(STORAGE_PREFIX)) {
    return NextResponse.json(
      { error: "Belge depolama yolu geçersiz." },
      { status: 400 }
    );
  }

  const storagePath = fileUrl.slice(STORAGE_PREFIX.length);

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 300);

  if (signError || !data?.signedUrl) {
    return NextResponse.json(
      {
        error: "Belge için güvenli görüntüleme bağlantısı oluşturulamadı.",
        detail: signError?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}