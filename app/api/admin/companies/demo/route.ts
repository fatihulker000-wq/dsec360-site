import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_COMPANY = {
  name: "D-SEC Demo Lojistik ve Depolama A.Ş.",
  yetkili: "Ayşe Yıldırım",
  phone: "0212 555 36 00",
  email: "demo@dsec360.com",
  address: "Gebze Organize Sanayi Bölgesi / Kocaeli",
  sgk_sicil_no: "1234567890123456789012",
  nace_kodu: "52.10.01",
  tehlike_sinifi: "Tehlikeli",
  calisan_sayisi: 10,
  sektor: "Lojistik ve Depolama",
  isg_uzmani: "Fatih Ülker",
  isyeri_hekimi: "Dr. Mehmet Kaya",
  dsp: "Ayşe Kara"
};

export async function POST(req: NextRequest) {
  try {

    //-------------------------------------------------------
    // Firma
    //-------------------------------------------------------

    let companyId: string | null = null;

    const existing = await supabase
      .from("companies")
      .select("id")
      .eq("name", DEMO_COMPANY.name)
      .maybeSingle();

    if (existing.error) {
      throw new Error(`Demo firma sorgulanamadı: ${existing.error.message}`);
    }

    if (existing.data?.id) {
      companyId = existing.data.id;

      await supabase
        .from("companies")
        .update({
          ...DEMO_COMPANY,
          is_active: true
        })
        .eq("id", companyId);
    } else {

      const created = await supabase
        .from("companies")
        .insert({
          ...DEMO_COMPANY,
          is_active: true
        })
        .select("id")
        .single();

      if (created.error || !created.data?.id) {
        throw new Error(
          `Demo firma oluşturulamadı: ${created.error?.message ?? "Firma kimliği dönmedi."}`
        );
      }

      companyId = created.data.id;
    }

    if (!companyId) {
      throw new Error("Demo firma kimliği belirlenemedi.");
    }

    //-------------------------------------------------------
    // Çalışanlar
    //-------------------------------------------------------

    const employees = [

      {
        full_name: "Ahmet Demir",
        department: "Depo",
        duty: "Forklift Operatörü"
      },

      {
        full_name: "Mehmet Kaya",
        department: "Depo",
        duty: "Sevkiyat"
      },

      {
        full_name: "Mustafa Can",
        department: "Depo",
        duty: "Depo Personeli"
      },

      {
        full_name: "Ali Şahin",
        department: "Yükleme",
        duty: "Operatör"
      },

      {
        full_name: "Hasan Çetin",
        department: "Yükleme",
        duty: "Operatör"
      },

      {
        full_name: "Zeynep Arslan",
        department: "Ofis",
        duty: "Muhasebe"
      },

      {
        full_name: "Elif Kaya",
        department: "İK",
        duty: "Uzman"
      },

      {
        full_name: "Emre Çelik",
        department: "Bakım",
        duty: "Teknisyen"
      },

      {
        full_name: "Burak Yılmaz",
        department: "Bakım",
        duty: "Elektrikçi"
      },

      {
        full_name: "Ayşe Aksoy",
        department: "Kalite",
        duty: "Kalite Uzmanı"
      }

    ];

    for (const employee of employees) {

      await supabase
        .from("employee_records")
        .upsert({

          company_id: companyId,
          company_name: DEMO_COMPANY.name,

          full_name: employee.full_name,
          department: employee.department,
          duty: employee.duty,

          status: "AKTIF"

        });

    }
    //-------------------------------------------------------
    // Kaza / Olay
    //-------------------------------------------------------

    const accidents = [

      {
        event_type: "İş Kazası",
        title: "Forklift ile raf teması",
        severity: 2,
        employee_name: "Ahmet Demir",
        department: "Depo",
        location: "A Blok",
        root_cause_category: "Operatör Hatası"
      },

      {
        event_type: "Ramak Kala",
        title: "Yük düşmesi",
        severity: 1,
        employee_name: "Ali Şahin",
        department: "Yükleme",
        location: "Rampa",
        root_cause_category: "İstifleme"
      }

    ];

    for (const item of accidents) {

      await supabase
        .from("accident_records")
        .upsert({

          web_firm_id: companyId,

          firm_id: 1,

          event_type: item.event_type,

          title: item.title,

          description: item.title,

          severity: item.severity,

          employee_name: item.employee_name,

          department: item.department,

          location: item.location,

          root_cause_category: item.root_cause_category,

          event_date: Date.now(),

          source: "WEB"

        });

    }

    //-------------------------------------------------------
    // Denetim
    //-------------------------------------------------------

    const inspections = [

      {
        template_type: "Genel İSG Denetimi",
        score: 92
      },

      {
        template_type: "Forklift Denetimi",
        score: 84
      },

      {
        template_type: "Yangın Güvenliği",
        score: 95
      }

    ];

    const inspectionIds: number[] = [];

    for (const inspection of inspections) {

      const inserted = await supabase
        .from("denetim_runs")
        .insert({

          firm_id: 1,

          firm_name: DEMO_COMPANY.name,

          template_type: inspection.template_type,

          total_score: inspection.score,

          status: "COMPLETED",

          app_run_id: Date.now()

        })
        .select("id")
        .single();

      if (inserted.error || !inserted.data?.id) {
        throw new Error(
          `Denetim kaydı oluşturulamadı (${inspection.template_type}): ${inserted.error?.message ?? "Denetim kimliği dönmedi."}`
        );
      }

      inspectionIds.push(inserted.data.id);

    }

    //-------------------------------------------------------
    // Denetim Cevapları
    //-------------------------------------------------------

    const answers = [

      {
        item_title: "Acil çıkış kapıları açık mı?",
        result: "UYGUN"
      },

      {
        item_title: "Yangın söndürücüler kontrol edilmiş mi?",
        result: "UYGUN"
      },

      {
        item_title: "Forklift günlük kontrolü yapılmış mı?",
        result: "KISMEN"
      },

      {
        item_title: "Yaya yolları işaretlenmiş mi?",
        result: "UYGUNSUZ"
      }

    ];

    for (const inspectionId of inspectionIds) {

      for (const answer of answers) {

        await supabase
          .from("denetim_answers")
          .insert({

            run_remote_id: inspectionId,

            item_title: answer.item_title,

            result: answer.result,

            note: "",

            recommended_action:
              answer.result === "UYGUN"
                ? ""
                : "Düzeltici faaliyet oluşturulmalı.",

            dof_status:
              answer.result === "UYGUN"
                ? "NONE"
                : "OPEN"

          });

      }

    }

    //-------------------------------------------------------
    // Eğitimler
    //-------------------------------------------------------

    const trainings = [

      "Temel İSG Eğitimi",

      "Yangın Eğitimi",

      "Yüksekte Çalışma",

      "Forklift Güvenliği"

    ];

    for (const title of trainings) {

      await supabase
        .from("training_assignments")
        .upsert({

          firm_id: companyId,

          company_name: DEMO_COMPANY.name,

          training_name: title,

          assigned_count: 10,

          completed_count: Math.floor(Math.random() * 10),

          status: "ACTIVE"

        });

    }
        //-------------------------------------------------------
    // ÇBS (Bildirimler)
    //-------------------------------------------------------

    const cbsForms = [
      {
        title: "Forklift ile yaya yolu kesişiminde tehlikeli durum",
        category: "Ramak Kala",
        priority: "high",
      },
      {
        title: "Yangın dolabı önü malzeme ile kapatılmış",
        category: "Uygunsuzluk",
        priority: "normal",
      },
    ];

    for (const form of cbsForms) {
      await supabase
        .from("cbs_forms")
        .upsert({
          firm_id: companyId,
          firma_adi: DEMO_COMPANY.name,

          title: form.title,
          category: form.category,
          priority: form.priority,

          status: "new",

          source_type: "WEB",
        });
    }

    //-------------------------------------------------------
    // Sağlık Kayıtları
    //-------------------------------------------------------

    const healthRecords = [
      {
        employee_name: "Ahmet Demir",
        examination_type: "Periyodik Muayene",
        result: "Uygun",
      },
      {
        employee_name: "Ali Şahin",
        examination_type: "İşe Giriş Muayenesi",
        result: "Uygun",
      },
    ];

    // health_records tablosu varsa kayıt oluştur
    const healthTable = await supabase
      .from("health_records")
      .select("id")
      .limit(1);

    if (!healthTable.error) {
      for (const item of healthRecords) {
        await supabase.from("health_records").upsert({
          firm_id: companyId,
          employee_name: item.employee_name,
          examination_type: item.examination_type,
          result: item.result,
        });
      }
    }

    //-------------------------------------------------------
    // İstatistikler
    //-------------------------------------------------------

    const totalEmployees = employees.length;
    const totalAccidents = accidents.length;
    const totalInspections = inspections.length;
    const totalCbs = cbsForms.length;

    //-------------------------------------------------------
    // Sonuç
    //-------------------------------------------------------

    return NextResponse.json({
      success: true,

      companyId,

      companyName: DEMO_COMPANY.name,

      statistics: {
        employees: totalEmployees,
        accidents: totalAccidents,
        inspections: totalInspections,
        cbs: totalCbs,
      },

      metrics: {
        employee_count: totalEmployees,
      },

      moduleRecords: {
        accidents: totalAccidents,
        inspections: totalInspections,
        cbs: totalCbs,
        errors: [],
      },

      message: "Demo firma başarıyla oluşturuldu."
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ?? "Demo oluşturulamadı."
      },
      {
        status: 500
      }
    );

  }
}