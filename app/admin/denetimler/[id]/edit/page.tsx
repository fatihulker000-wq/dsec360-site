import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function updateAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id") || 0);

  if (!id) {
    redirect("/admin/denetimler");
  }

  const supabase = getSupabase();

  await supabase
    .from("denetim_runs")
    .update({
      firm_name: String(formData.get("firm_name") || ""),
      template_type: String(formData.get("template_type") || ""),
      eval_mode: String(formData.get("eval_mode") || ""),
      inspector_name: String(formData.get("inspector_name") || ""),
      responsible: String(formData.get("responsible") || ""),
      location: String(formData.get("location") || ""),
      report_no: String(formData.get("report_no") || ""),
      general_note: String(formData.get("general_note") || ""),
    })
    .eq("id", id);

  redirect("/admin/denetimler");
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabase();
  const { id } = await params;
  const requestedId = Number(id || 0);

  if (!requestedId) {
    return <main style={{ padding: 32 }}>Geçersiz kayıt.</main>;
  }

  let { data } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("id", requestedId)
    .maybeSingle();

  if (!data) {
    const fallback = await supabase
      .from("denetim_runs")
      .select("*")
      .eq("app_run_id", requestedId)
      .maybeSingle();

    data = fallback.data;
  }

  if (!data) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Kayıt bulunamadı</h1>
        <Link href="/admin/denetimler">Denetim listesine dön</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 32,
        background: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <Link
        href="/admin/denetimler"
        style={{
          display: "inline-flex",
          padding: "11px 16px",
          borderRadius: 14,
          background: "linear-gradient(135deg,#5a0f1f,#8f172c)",
          color: "#fff",
          fontWeight: 900,
          textDecoration: "none",
          marginBottom: 22,
        }}
      >
        Denetim Listesine Dön
      </Link>

      <section
        style={{
          maxWidth: 760,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 24,
          padding: 26,
          boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: 1000, margin: 0 }}>
          Denetim Kaydı Düzenle
        </h1>

        <p style={{ color: "#64748b", fontWeight: 700 }}>
          Firma, tür, şablon, denetçi ve rapor bilgilerini güncelle.
        </p>

        <form action={updateAction} style={{ marginTop: 22 }}>
          <input type="hidden" name="id" value={data.id} />

          <Input label="Firma" name="firm_name" defaultValue={data.firm_name} />
          <Input label="Şablon" name="template_type" defaultValue={data.template_type} />
          <Input label="Tür" name="eval_mode" defaultValue={data.eval_mode} />
          <Input label="Denetçi" name="inspector_name" defaultValue={data.inspector_name} />
          <Input label="Sorumlu" name="responsible" defaultValue={data.responsible} />
          <Input label="Lokasyon" name="location" defaultValue={data.location} />
          <Input label="Rapor No" name="report_no" defaultValue={data.report_no} />
          <Input label="Genel Not" name="general_note" defaultValue={data.general_note} />

          <button
            type="submit"
            style={{
              marginTop: 18,
              width: "100%",
              padding: "13px 18px",
              borderRadius: 14,
              border: 0,
              background: "linear-gradient(135deg,#5a0f1f,#c62828)",
              color: "#fff",
              fontWeight: 1000,
              cursor: "pointer",
            }}
          >
            Kaydet ve Listeye Dön
          </button>
        </form>
      </section>
    </main>
  );
}

function Input({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <label style={{ display: "block", marginBottom: 13 }}>
      <div
        style={{
          fontWeight: 900,
          color: "#334155",
          marginBottom: 6,
          fontSize: 13,
        }}
      >
        {label}
      </div>
      <input
        name={name}
        defaultValue={defaultValue || ""}
        style={{
          width: "100%",
          padding: "12px 13px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          fontWeight: 750,
          outline: "none",
        }}
      />
    </label>
  );
}