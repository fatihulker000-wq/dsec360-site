import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase servis bilgileri eksik."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function requireAdmin() {
  const store = await cookies();

  const auth =
    store.get("dsec_admin_auth")?.value;

  const role =
    store.get("dsec_admin_role")?.value;

  if (
    auth !== "ok" ||
    ![
      "super_admin",
      "company_admin",
    ].includes(String(role || ""))
  ) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    role: String(role || ""),
    actor:
      store.get("dsec_admin_name")?.value ||
      store.get("dsec_admin_email")?.value ||
      "D-SEC Yönetici",
  };
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function createCertificateNo() {
  const year = new Date().getFullYear();

  const token = randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `DSEC-TRN-${year}-${token}`;
}

function createVerificationCode() {
  return randomBytes(12)
    .toString("hex")
    .toUpperCase();
}

function createDocumentHash(
  payload: Record<string, unknown>
) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function baseUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } =
      new URL(request.url);

    const trainingId = text(
      searchParams.get("trainingId")
    );

    const supabase = getSupabase();

    let query = supabase
      .from("training_certificates_v2")
      .select("*")
      .order("issued_at", {
        ascending: false,
      })
      .limit(500);

    if (trainingId) {
      query = query.eq(
        "training_id",
        trainingId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      return NextResponse.json(
        {
          error:
            "Sertifikalar alınamadı.",
          detail: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const rows = (await Promise.all(
  (data ?? []).map(async (row: Row) => ({
    ...row,

    qr_data_url: await QRCode.toDataURL(
      String(row.qr_payload ?? ""),
      {
        margin: 1,
        width: 220,
        errorCorrectionLevel: "M",
      }
    ),
  }))
)) as Row[];

    const summary = {
      total: rows.length,

      issued: rows.filter(
        (row) =>
          row.status === "ISSUED"
      ).length,

      revoked: rows.filter(
        (row) =>
          row.status === "REVOKED"
      ).length,

      renewed: rows.filter(
        (row) =>
          row.status === "RENEWED"
      ).length,

      expired: rows.filter(
        (row) =>
          row.valid_until &&
          new Date(
            row.valid_until
          ).getTime() <
            new Date().setHours(
              0,
              0,
              0,
              0
            )
      ).length,
    };

    return NextResponse.json({
      success: true,

      summary,

      data: rows,
    });

  } catch (error: any) {

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Sunucu hatası oluştu.",

        detail:
          error?.message || null,
      },
      {
        status: 500,
      }
    );
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();

    const assignmentId = text(
      body.assignmentId
    );

    const validUntil =
      text(body.validUntil) || null;

    if (!assignmentId) {
      return NextResponse.json(
        {
          error:
            "assignmentId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from("training_assignments")
      .select("*")
      .eq("id", assignmentId)
      .maybeSingle();

    if (
      assignmentError ||
      !assignment
    ) {
      return NextResponse.json(
        {
          error:
            "Eğitim atama kaydı bulunamadı.",

          detail:
            assignmentError?.message ||
            null,
        },
        {
          status: 404,
        }
      );
    }

    /*
      Sertifika üretilebilmesi için
      eğitim tamamlanmış olmalıdır.
    */

    if (!assignment.completed_at) {
      return NextResponse.json(
        {
          error:
            "Eğitim tamamlanmadan sertifika üretilemez.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      Final sınavı başarı şartı
    */

    if (
      assignment.final_exam_passed ===
        false ||
      assignment.final_exam_passed ==
        null
    ) {
      return NextResponse.json(
        {
          error:
            "Final sınavı başarıyla tamamlanmadan sertifika üretilemez.",
        },
        {
          status: 409,
        }
      );
    }

    /*
      Eğitim bilgisi,
      çalışan bilgisi
      ve daha önce sertifika
      oluşturulup oluşturulmadığı
      kontrol edilir.
    */

    const [
      trainingResult,
      userResult,
      existingResult,
    ] = await Promise.all([

      supabase
        .from("trainings")
        .select(
          "id,title,type,duration_minutes"
        )
        .eq(
          "id",
          assignment.training_id
        )
        .maybeSingle(),

      supabase
        .from("users")
        .select(
          "id,employee_id,full_name,email,company,company_id"
        )
        .eq(
          "id",
          assignment.user_id
        )
        .maybeSingle(),

      supabase
        .from(
          "training_certificates_v2"
        )
        .select("*")
        .eq(
          "assignment_id",
          assignmentId
        )
        .neq(
          "status",
          "REVOKED"
        )
        .order(
          "revision_no",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),

    ]);

    if (
      trainingResult.error ||
      !trainingResult.data
    ) {
      return NextResponse.json(
        {
          error:
            "Eğitim bilgisi bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      userResult.error ||
      !userResult.data
    ) {
      return NextResponse.json(
        {
          error:
            "Çalışan bilgisi bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Aynı atama için
      aktif sertifika varsa
      ikinci kez üretme.
    */

    if (existingResult.data) {
      return NextResponse.json(
        {
          error:
            "Bu eğitim ataması için aktif sertifika zaten mevcut.",

          existing:
            existingResult.data,
        },
        {
          status: 409,
        }
      );
    }
        const certificateNo =
      createCertificateNo();

    const verificationCode =
      createVerificationCode();

    const verificationUrl =
      `${baseUrl(request)}/certificate/verify/` +
      verificationCode;

    const training =
      trainingResult.data;

    const user =
      userResult.data;

    const certificatePayload = {
      assignment_id:
        assignmentId,

      training_id:
        assignment.training_id,

      user_id:
        assignment.user_id,

      employee_id:
        user.employee_id || null,

      company_id:
        user.company_id || null,

      certificate_no:
        certificateNo,

      verification_code:
        verificationCode,

      issued_at:
        new Date().toISOString(),

      valid_until:
        validUntil,

      training_title:
        training.title,

      employee_name:
        user.full_name,

      company_name:
        user.company || null,

      duration_minutes:
        training.duration_minutes || null,

      final_score:
        assignment.final_exam_score || null,

      revision_no: 1,
    };

    /*
      SHA-256 belge hash'i
    */

    const documentHash =
      createDocumentHash(
        certificatePayload
      );

    /*
      Veritabanına kayıt
    */

    const {
      data,
      error,
    } = await supabase
      .from(
        "training_certificates_v2"
      )
      .insert({

        ...certificatePayload,

        status: "ISSUED",

        valid_from:
          new Date()
            .toISOString()
            .slice(0, 10),

        qr_payload:
          verificationUrl,

        document_hash:
          documentHash,

        issued_by:
          admin.actor,

        issued_by_role:
          admin.role,

        metadata: {

          employee_email:
            user.email || null,

          training_type:
            training.type || null,

          source:
            "certificate_engine_v2",

        },

      })
      .select("*")
      .single();

    if (error) {

      return NextResponse.json(
        {

          error:
            "Sertifika oluşturulamadı.",

          detail:
            error.message,

        },
        {
          status: 500,
        }
      );

    }

    /*
      QR Görseli oluştur
    */

    const qrDataUrl =
      await QRCode.toDataURL(
        verificationUrl,
        {

          margin: 1,

          width: 220,

          errorCorrectionLevel: "M",

        }
      );

    return NextResponse.json({

      success: true,

      data: {

        ...data,

        qr_data_url:
          qrDataUrl,

      },

    });

  } catch (error: any) {

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {

      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );

    }

    return NextResponse.json(
      {

        error:
          "Sunucu hatası oluştu.",

        detail:
          error?.message || null,

      },
      {
        status: 500,
      }
    );

  }
}
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();

    const certificateId = text(body.certificateId);
    const action = text(body.action).toUpperCase();

    if (!certificateId || !action) {
      return NextResponse.json(
        {
          error:
            "certificateId ve action zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const {
      data: current,
      error: currentError,
    } = await supabase
      .from("training_certificates_v2")
      .select("*")
      .eq("id", certificateId)
      .maybeSingle();

    if (currentError || !current) {
      return NextResponse.json(
        {
          error: "Sertifika bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * SERTİFİKA İPTALİ
     */

    if (action === "REVOKE") {
      const reason = text(body.reason);

      if (!reason) {
        return NextResponse.json(
          {
            error:
              "İptal nedeni zorunludur.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data,
        error,
      } = await supabase
        .from("training_certificates_v2")
        .update({
          status: "REVOKED",

          revoked_at:
            new Date().toISOString(),

          revoked_reason: reason,

          metadata: {
            ...(current.metadata || {}),

            revoked_by:
              admin.actor,

            revoked_role:
              admin.role,
          },
        })
        .eq("id", certificateId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }

    /*
     * SERTİFİKA YENİLEME
     */

    if (action === "RENEW") {

      if (
        current.status ===
        "REVOKED"
      ) {

        return NextResponse.json(
          {
            error:
              "İptal edilmiş sertifika yenilenemez.",
          },
          {
            status: 409,
          }
        );

      }

      const verificationCode =
        createVerificationCode();

      const certificateNo =
        createCertificateNo();

      const verificationUrl =
        `${baseUrl(request)}/certificate/verify/` +
        verificationCode;

      const validUntil =
        text(body.validUntil) || null;

      const revisionNo =
        Number(
          current.revision_no || 1
        ) + 1;

      const renewedPayload = {

        assignment_id:
          current.assignment_id,

        training_id:
          current.training_id,

        user_id:
          current.user_id,

        employee_id:
          current.employee_id,

        company_id:
          current.company_id,

        certificate_no:
          certificateNo,

        verification_code:
          verificationCode,

        status: "ISSUED",

        issued_at:
          new Date().toISOString(),

        valid_from:
          new Date()
            .toISOString()
            .slice(0, 10),

        valid_until:
          validUntil,

        revision_no:
          revisionNo,

        renewed_from_id:
          current.id,

        training_title:
          current.training_title,

        employee_name:
          current.employee_name,

        company_name:
          current.company_name,

        duration_minutes:
          current.duration_minutes,

        final_score:
          current.final_score,

        qr_payload:
          verificationUrl,

        issued_by:
          admin.actor,

        issued_by_role:
          admin.role,

        metadata: {

          ...(current.metadata || {}),

          renewed_by:
            admin.actor,

        },

      };
            /*
       * SHA-256 Belge Hash'i
       */

      const documentHash =
        createDocumentHash(
          renewedPayload
        );

      /*
       * Yeni sertifikayı oluştur
       */

      const {
        data: renewed,
        error: renewedError,
      } = await supabase
        .from("training_certificates_v2")
        .insert({
          ...renewedPayload,

          document_hash:
            documentHash,
        })
        .select("*")
        .single();

      if (renewedError) {
        throw renewedError;
      }

      /*
       * Eski sertifikayı
       * yenilenmiş olarak işaretle
       */

      await supabase
        .from("training_certificates_v2")
        .update({

          status: "RENEWED",

          metadata: {

            ...(current.metadata || {}),

            renewed_certificate_id:
              renewed.id,

            renewed_at:
              new Date().toISOString(),

            renewed_by:
              admin.actor,

          },

        })
        .eq(
          "id",
          current.id
        );

      /*
       * Yeni sertifikayı döndür
       */

      return NextResponse.json({

        success: true,

        data: renewed,

      });

    }

    /*
     * Desteklenmeyen işlem
     */

    return NextResponse.json(
      {

        error:
          "Desteklenmeyen işlem.",

      },
      {
        status: 400,
      }
    );

  } catch (error: any) {

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {

      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );

    }

    console.error(
      "training-certificates-v2:",
      error
    );

    return NextResponse.json(
      {

        error:
          "Sunucu hatası oluştu.",

        detail:
          error?.message || null,

      },
      {
        status: 500,
      }
    );

  }
}