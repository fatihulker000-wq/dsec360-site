import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "employee-documents";
const PREFIX = `storage://${BUCKET}/`;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();

    const auth = clean(
      cookieStore.get("dsec_user_auth")?.value
    );
    const role = clean(
      cookieStore.get("dsec_user_role")?.value
    );
    const userId = clean(
      cookieStore.get("dsec_user_id")?.value
    );
    const cookieEmail = clean(
      cookieStore.get("dsec_user_email")?.value
    ).toLowerCase();

    if (
      auth !== "ok" ||
      role !== "training_user" ||
      !userId
    ) {
      return NextResponse.json(
        { error: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { assignmentId } =
      await context.params;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Belge atama ID bulunamadı." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select(
          "id,employee_id,email,company_id,role,is_active"
        )
        .eq("id", userId)
        .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Portal kullanıcı bilgisi alınamadı.",
          detail: userError?.message,
        },
        { status: userError ? 500 : 401 }
      );
    }

    const employeeId = clean(
      user.employee_id
    );
    const userEmail =
      clean(user.email).toLowerCase() ||
      cookieEmail;

    // Önce yalnızca assignment id ile kaydı alıyoruz.
    // Yetki kontrolünü sonrasında portal_user_id / employee_id / email
    // üzerinden yapıyoruz. Böylece magic-link oturumunda employee_id
    // eski veya boş olsa bile doğru kullanıcı kendi belgesine erişebilir.
    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from("employee_document_assignments")
      .select(
        "id,document_id,firm_id,employee_id,portal_user_id,employee_email,is_cancelled"
      )
      .eq("id", assignmentId)
      .eq("is_cancelled", false)
      .maybeSingle();

    if (
      assignmentError ||
      !assignment
    ) {
      return NextResponse.json(
        {
          error:
            "Belge ataması bulunamadı.",
          detail:
            assignmentError?.message,
        },
        {
          status: assignmentError
            ? 500
            : 404,
        }
      );
    }

    const assignedPortalUserId =
      clean(
        assignment.portal_user_id
      );

    const assignedEmployeeId =
      clean(
        assignment.employee_id
      );

    const assignedEmail =
      clean(
        assignment.employee_email
      ).toLowerCase();

    const hasAccess =
      assignedPortalUserId === userId ||
      (!!employeeId &&
        assignedEmployeeId ===
          employeeId) ||
      (!!userEmail &&
        assignedEmail ===
          userEmail);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Bu belgeye erişim yetkiniz yok.",
        },
        { status: 403 }
      );
    }

    // Atama daha önce eski employee_id üzerinden oluşturulmuş ama
    // portal_user_id boşsa, başarılı erişimde ilişkiyi kalıcı olarak düzelt.
    if (
      assignedPortalUserId !== userId
    ) {
      await supabase
        .from(
          "employee_document_assignments"
        )
        .update({
          portal_user_id: userId,
        })
        .eq("id", assignmentId);
    }

    const {
      data: document,
      error: documentError,
    } = await supabase
      .from("employee_documents")
      .select(
        "id,title,file_url,file_name,mime_type,is_deleted"
      )
      .eq(
        "id",
        assignment.document_id
      )
      .eq("is_deleted", false)
      .maybeSingle();

    if (
      documentError ||
      !document?.file_url
    ) {
      return NextResponse.json(
        {
          error:
            "Belge dosyası bulunamadı.",
          detail:
            documentError?.message,
        },
        {
          status: documentError
            ? 500
            : 404,
        }
      );
    }

    const fileUrl = clean(
      document.file_url
    );

    // Eski harici URL kaydı varsa mevcut davranışı koru.
    if (
      fileUrl.startsWith(
        "https://"
      ) ||
      fileUrl.startsWith(
        "http://"
      )
    ) {
      return NextResponse.redirect(
        fileUrl
      );
    }

    if (
      !fileUrl.startsWith(PREFIX)
    ) {
      return NextResponse.json(
        {
          error:
            "Belge depolama yolu geçersiz.",
        },
        { status: 400 }
      );
    }

    const storagePath =
      fileUrl.slice(
        PREFIX.length
      );

    // PDF.js'in signed URL yönlendirmesi / CORS problemi yaşamaması için
    // dosyayı server-side indirip aynı origin üzerinden byte olarak döndürüyoruz.
    const {
      data: fileBlob,
      error: downloadError,
    } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (
      downloadError ||
      !fileBlob
    ) {
      return NextResponse.json(
        {
          error:
            "Belge dosyası depodan alınamadı.",
          detail:
            downloadError?.message,
        },
        { status: 500 }
      );
    }

    const arrayBuffer =
      await fileBlob.arrayBuffer();

    const mimeType =
      clean(
        document.mime_type
      ) ||
      fileBlob.type ||
      "application/pdf";

    const fileName =
      clean(
        document.file_name
      ) ||
      `${clean(document.title) || "belge"}.pdf`;

    return new NextResponse(
      arrayBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            mimeType,
          "Content-Disposition":
            `inline; filename*=UTF-8''${encodeURIComponent(
              fileName
            )}`,
          "Cache-Control":
            "private, no-store, max-age=0",
          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          "Belge görüntüleme sırasında sunucu hatası oluştu.",
        detail:
          cause instanceof Error
            ? cause.message
            : "Bilinmeyen hata.",
      },
      { status: 500 }
    );
  }
}