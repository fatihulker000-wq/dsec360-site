import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "inspection-evidence";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function clean(v: unknown) { return String(v ?? "").trim(); }
function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function safe(v: string) {
  return v.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "photo";
}

async function authorize(firmId: string) {
  const c = await cookies();
  const userId = clean(c.get("dsec_user_id")?.value);
  const cookieCompanyId = clean(c.get("dsec_company_id")?.value);
  const role = clean(c.get("dsec_user_role")?.value || c.get("dsec_admin_role")?.value).toLowerCase();
  if (!userId) return { ok: false as const, status: 401, error: "Oturum bulunamadı." };
  if (!firmId) return { ok: false as const, status: 400, error: "Firma seçilmelidir." };

  const supabase = db();
  const [{ data: accessRows, error: accessError }, { data: userRow, error: userError }] = await Promise.all([
    supabase.from("user_firm_access").select("firm_id").eq("user_id", userId),
    supabase.from("users").select("company_id").eq("id", userId).maybeSingle(),
  ]);
  if (accessError) throw new Error(accessError.message);
  if (userError) throw new Error(userError.message);
  const allowed = new Set([...(accessRows || []).map((x: any) => clean(x.firm_id)), clean(userRow?.company_id), cookieCompanyId].filter(Boolean));
  if (role !== "super_admin" && !allowed.has(firmId)) return { ok: false as const, status: 403, error: "Bu firmaya erişim yetkiniz yok." };
  const { data: company, error } = await supabase.from("companies").select("id").eq("id", firmId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!company) return { ok: false as const, status: 404, error: "Firma bulunamadı." };
  return { ok: true as const };
}

async function ensureBucket() {
  const supabase = db();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED),
  });
  if (error && !clean(error.message).toLowerCase().includes("already")) throw error;
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const firmId = clean(fd.get("firmId"));
    const formId = clean(fd.get("formId"));
    const itemId = clean(fd.get("itemId"));
    const file = fd.get("file");

    const auth = await authorize(firmId);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!formId || !itemId) return NextResponse.json({ success: false, error: "Form ve denetim maddesi bilgisi zorunludur." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: "Fotoğraf seçilmelidir." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ success: false, error: "Yalnızca JPG, PNG veya WEBP fotoğraf yüklenebilir." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: "Fotoğraf boyutu 0'dan büyük ve en fazla 10 MB olmalıdır." }, { status: 400 });

    const supabase = db();
    const { data: form, error: formError } = await supabase.from("inspection_forms").select("id,firm_id,visibility,status").eq("id", formId).eq("deleted", false).maybeSingle();
    if (formError) throw new Error(formError.message);
    if (!form || clean(form.status).toUpperCase() !== "PUBLISHED") return NextResponse.json({ success: false, error: "Yayınlanmış denetim formu bulunamadı." }, { status: 404 });
    if (clean(form.visibility).toUpperCase() !== "GLOBAL" && clean(form.firm_id) !== firmId) return NextResponse.json({ success: false, error: "Seçilen form bu firmaya ait değil." }, { status: 403 });

    const { data: item, error: itemError } = await supabase.from("inspection_form_items").select("id").eq("id", itemId).eq("form_id", formId).maybeSingle();
    if (itemError) throw new Error(itemError.message);
    if (!item) return NextResponse.json({ success: false, error: "Denetim maddesi form ile eşleşmiyor." }, { status: 400 });

    await ensureBucket();
    const ext = safe(file.name).split(".").pop() || (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");
    const path = `${safe(firmId)}/${safe(formId)}/${safe(itemId)}/${randomUUID()}.${safe(ext)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    return NextResponse.json({
      success: true,
      photoPath: path,
      photoUrl: `storage://${BUCKET}/${path}`,
      bucket: BUCKET,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Fotoğraf yüklenemedi.", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
