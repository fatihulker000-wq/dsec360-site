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

  const id = Number(formData.get("id"));

  const supabase = getSupabase();

  await supabase
    .from("denetim_runs")
    .update({
      firm_name: formData.get("firm_name"),
      template_type: formData.get("template_type"),
      eval_mode: formData.get("eval_mode"),
      inspector_name: formData.get("inspector_name"),
      responsible: formData.get("responsible"),
      location: formData.get("location"),
      report_no: formData.get("report_no"),
      general_note: formData.get("general_note"),
    })
    .eq("id", id);

  redirect("/admin/denetimler");
}

export default async function Page({ params }: any) {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("id", Number(params.id))
    .single();

  if (!data) return <div>Bulunamadı</div>;

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>
        Denetim Düzenle
      </h1>

      <form action={updateAction} style={{ marginTop: 20 }}>
        <input type="hidden" name="id" value={data.id} />

        <Input label="Firma" name="firm_name" defaultValue={data.firm_name} />
        <Input label="Şablon" name="template_type" defaultValue={data.template_type} />
        <Input label="Tür" name="eval_mode" defaultValue={data.eval_mode} />
        <Input label="Denetçi" name="inspector_name" defaultValue={data.inspector_name} />
        <Input label="Sorumlu" name="responsible" defaultValue={data.responsible} />
        <Input label="Lokasyon" name="location" defaultValue={data.location} />
        <Input label="Rapor No" name="report_no" defaultValue={data.report_no} />
        <Input label="Not" name="general_note" defaultValue={data.general_note} />

        <button
          type="submit"
          style={{
            marginTop: 20,
            padding: "12px 18px",
            borderRadius: 12,
            border: 0,
            background: "#c62828",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Kaydet
        </button>
      </form>

      <Link href="/admin/denetimler">← Geri</Link>
    </main>
  );
}

function Input({ label, name, defaultValue }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 800 }}>{label}</div>
      <input
        name={name}
        defaultValue={defaultValue}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}