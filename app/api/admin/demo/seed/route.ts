import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DEMO_COMPANY_NAME =
  "D-SEC Demo Lojistik ve Depolama A.Ş.";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();

  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value;

  const adminRole =
    cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "admin" ||
      adminRole === "super_admin")
  );
}

async function insertFirstWorking(
  table: string,
  payloads: Record<string, unknown>[]
) {
  const supabase = getSupabase();
  const errors: string[] = [];

  for (const payload of payloads) {
    const { error } = await supabase
      .from(table)
      .insert(payload);

    if (!error) {
      return {
        success: true,
        error: null,
      };
    }

    errors.push(error.message);
  }

  return {
    success: false,
    error:
      errors.at(-1) ||
      `${table} kaydı oluşturulamadı.`,
  };
}

async function ensureDemoCompany() {
  const supabase = getSupabase();

  const {
    data: existing,
    error: findError,
  } = await supabase
    .from("companies")
    .select(
      "id, local_firm_id, name"
    )
    .ilike(
      "name",
      "%D-SEC Demo Lojistik%"
    )
    .maybeSingle();

  if (findError) {
    throw new Error(
      findError.message
    );
  }

  const payload = {
    name: DEMO_COMPANY_NAME,
    yetkili: "Ayşe Yıldırım",
    phone: "0212 555 36 00",
    email: "demo@dsec360.com",
    address:
      "Merkez Mahallesi, Lojistik Caddesi No: 12, İstanbul",
    calisan_sayisi: 25,
    nace_kodu: "52.10.01",
    tehlike_sinifi: "Tehlikeli",
    sgk_sicil_no:
      "2-1234-5678901-34-56-789",
    sektor:
      "Lojistik ve Depolama",
    isg_uzmani:
      "Fatih Ülker",
    isyeri_hekimi:
      "Dr. Selin Arslan",
    dsp: "Merve Kaya",
    is_active: true,
  };

  if (existing) {
    const {
      data,
      error,
    } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", existing.id)
      .select(
        "id, local_firm_id, name"
      )
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return data;
  }

  const {
    data,
    error,
  } = await supabase
    .from("companies")
    .insert(payload)
    .select(
      "id, local_firm_id, name"
    )
    .single();

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data;
}

const DEMO_EMPLOYEES = [
  [
    "Ahmet Yılmaz",
    "Depo Müdürü",
    "Depo",
  ],
  [
    "Mehmet Kaya",
    "Forklift Operatörü",
    "Depo",
  ],
  [
    "Emre Demir",
    "Forklift Operatörü",
    "Depo",
  ],
  [
    "Murat Şahin",
    "Sevkiyat Sorumlusu",
    "Sevkiyat",
  ],
  [
    "Burak Çelik",
    "Depo Personeli",
    "Depo",
  ],
  [
    "Serkan Aydın",
    "Depo Personeli",
    "Depo",
  ],
  [
    "Can Koç",
    "Depo Personeli",
    "Depo",
  ],
  [
    "Onur Yıldız",
    "Bakım Teknisyeni",
    "Bakım",
  ],
  [
    "Hakan Arslan",
    "Elektrik Teknisyeni",
    "Bakım",
  ],
  [
    "Ali Özdemir",
    "Paketleme Personeli",
    "Paketleme",
  ],
  [
    "Ayşe Yıldırım",
    "İnsan Kaynakları Uzmanı",
    "İK",
  ],
  [
    "Elif Kaya",
    "Kalite Uzmanı",
    "Kalite",
  ],
  [
    "Zeynep Aksoy",
    "Ofis Personeli",
    "İdari",
  ],
  [
    "Merve Kaya",
    "Diğer Sağlık Personeli",
    "İSG",
  ],
  [
    "Selin Arslan",
    "İşyeri Hekimi",
    "İSG",
  ],
  [
    "Fatih Ülker",
    "İSG Uzmanı",
    "İSG",
  ],
  [
    "Kemal Güneş",
    "Güvenlik Görevlisi",
    "Güvenlik",
  ],
  [
    "Tolga Eren",
    "Şoför",
    "Sevkiyat",
  ],
  [
    "Oğuz Kılıç",
    "Şoför",
    "Sevkiyat",
  ],
  [
    "Deniz Polat",
    "Satın Alma Uzmanı",
    "Satın Alma",
  ],
  [
    "Ece Kurt",
    "Muhasebe Personeli",
    "Muhasebe",
  ],
  [
    "Gökhan Taş",
    "Depo Personeli",
    "Depo",
  ],
  [
    "Umut Çetin",
    "Paketleme Personeli",
    "Paketleme",
  ],
  [
    "Seda Yalçın",
    "Kalite Personeli",
    "Kalite",
  ],
  [
    "Volkan Işık",
    "Bakım Personeli",
    "Bakım",
  ],
] as const;

async function seedEmployees(
  companyId: string,
  localFirmId: number | null
) {
  let inserted = 0;
  const errors: string[] = [];

  for (
    let index = 0;
    index <
    DEMO_EMPLOYEES.length;
    index += 1
  ) {
    const [
      fullName,
      title,
      department,
    ] =
      DEMO_EMPLOYEES[index];

    const result =
      await insertFirstWorking(
        "employees",
        [
          {
            firm_id: companyId,
            full_name: fullName,
            title,
            department,
            email:
              `demo${index + 1}@dsec360.com`,
            phone:
              `0532 555 ${1000 + index}`,
            active: true,
            created_at:
              new Date().toISOString(),
          },
          {
            firm_id: companyId,
            name: fullName,
            job_title: title,
            department,
            active: true,
          },
          {
            firm_id: localFirmId,
            full_name: fullName,
            title,
            department,
            active: true,
          },
        ]
      );

    if (result.success) {
      inserted += 1;
    } else {
      errors.push(
        `${fullName}: ${result.error}`
      );
    }
  }

  return {
    inserted,
    errors,
  };
}

async function seedAccidents(
  companyId: string,
  localFirmId: number | null
) {
  const examples = [
    {
      eventType: "RAMAK_KALA",
      severity: "DÜŞÜK",
      title:
        "Forklift-yaya güzergâhı kesişmesi",
      description:
        "Forklift geri manevra sırasında yaya geçiş alanına yaklaştı. Temas yaşanmadı.",
    },
    {
      eventType:
        "TEHLİKELİ_DURUM",
      severity: "ORTA",
      title:
        "Hasarlı raf dikmesi",
      description:
        "Depo B koridorunda raf dikmesinde deformasyon görüldü.",
    },
    {
      eventType:
        "İŞ_KAZASI",
      severity: "DÜŞÜK",
      title:
        "Paketleme alanında el sıkışması",
      description:
        "Çalışanın eli paketleme ekipmanında kısa süreli sıkıştı. Kayıp gün oluşmadı.",
    },
  ];

  let inserted = 0;
  const errors: string[] = [];

  for (const item of examples) {
    const result =
      await insertFirstWorking(
        "accident_records",
        [
          {
            firm_id:
              localFirmId,
            web_firm_id:
              companyId,
            event_type:
              item.eventType,
            severity:
              item.severity,
            title:
              item.title,
            description:
              item.description,
            is_active: 1,
            is_deleted: false,
            created_at:
              Date.now(),
            updated_at:
              Date.now(),
          },
          {
            firm_id:
              localFirmId,
            web_firm_id:
              companyId,
            event_type:
              item.eventType,
            severity:
              item.severity,
            olay_basligi:
              item.title,
            olay_aciklamasi:
              item.description,
            is_active: 1,
            is_deleted: false,
            created_at:
              Date.now(),
            updated_at:
              Date.now(),
          },
        ]
      );

    if (result.success) {
      inserted += 1;
    } else {
      errors.push(
        result.error ||
          item.title
      );
    }
  }

  return {
    inserted,
    errors,
  };
}

async function seedInspections(
  companyId: string,
  localFirmId: number | null
) {
  const examples = [
    [
      "Depo Genel İSG Denetimi",
      92,
      "COMPLETED",
    ],
    [
      "Yangın Güvenliği Denetimi",
      86,
      "COMPLETED",
    ],
    [
      "Forklift ve Yaya Trafiği Denetimi",
      78,
      "COMPLETED",
    ],
    [
      "Raf Sistemleri Güvenlik Kontrolü",
      72,
      "IN_PROGRESS",
    ],
    [
      "Paketleme Alanı Denetimi",
      95,
      "COMPLETED",
    ],
  ] as const;

  let inserted = 0;
  const errors: string[] = [];

  for (
    let index = 0;
    index < examples.length;
    index += 1
  ) {
    const [
      title,
      score,
      status,
    ] =
      examples[index];

    const runId =
      `DEMO-RUN-${index + 1}-${Date.now()}`;

    const result =
      await insertFirstWorking(
        "denetim_runs",
        [
          {
            firm_id:
              localFirmId,
            web_firm_id:
              companyId,
            remote_id:
              runId,
            title,
            score,
            status,
            created_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          },
          {
            firm_id:
              localFirmId,
            app_run_id:
              runId,
            form_title:
              title,
            total_score:
              score,
            status,
            created_at:
              new Date().toISOString(),
          },
        ]
      );

    if (result.success) {
      inserted += 1;
    } else {
      errors.push(
        result.error ||
          title
      );
    }
  }

  return {
    inserted,
    errors,
  };
}

async function seedCbs(
  companyId: string
) {
  const examples = [
    [
      "Forklift yolu üzerinde palet bırakılması",
      "OPEN",
      "HIGH",
    ],
    [
      "Acil çıkış kapısı önünde malzeme bulunması",
      "CLOSED",
      "CRITICAL",
    ],
    [
      "Depo aydınlatmasının yetersiz olması",
      "OPEN",
      "MEDIUM",
    ],
    [
      "Raf koruyucu bariyer eksikliği",
      "IN_PROGRESS",
      "HIGH",
    ],
  ] as const;

  let inserted = 0;
  const errors: string[] = [];

  for (const [
    title,
    status,
    priority,
  ] of examples) {
    const result =
      await insertFirstWorking(
        "cbs_forms",
        [
          {
            firm_id:
              companyId,
            title,
            description:
              `${title} için demo bildirimi.`,
            status,
            priority,
            created_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          },
          {
            firm_id:
              companyId,
            subject:
              title,
            detail:
              `${title} için demo bildirimi.`,
            status,
            priority,
            created_at:
              new Date().toISOString(),
          },
        ]
      );

    if (result.success) {
      inserted += 1;
    } else {
      errors.push(
        result.error ||
          title
      );
    }
  }

  return {
    inserted,
    errors,
  };
}

export async function POST() {
  try {
    const allowed =
      await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    const company =
      await ensureDemoCompany();

    const companyId =
      String(company.id);

    const localFirmId =
      company.local_firm_id ==
      null
        ? null
        : Number(
            company.local_firm_id
          );

    const [
      employees,
      accidents,
      inspections,
      cbs,
    ] = await Promise.all([
      seedEmployees(
        companyId,
        localFirmId
      ),
      seedAccidents(
        companyId,
        localFirmId
      ),
      seedInspections(
        companyId,
        localFirmId
      ),
      seedCbs(
        companyId
      ),
    ]);

    return NextResponse.json({
      success: true,
      company,
      keys: {
        companyId,
        localFirmId,
        webFirmId:
          companyId,
      },
      employees,
      accidents,
      inspections,
      cbs,
      message:
        "D-SEC Demo firma verileri oluşturuldu.",
    });
  } catch (
    errorValue
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Demo veri oluşturma hatası.",
      },
      {
        status: 500,
      }
    );
  }
}