import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { appendTrainingAuditEvent } from "../../../../lib/training-audit";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status: string | null;
  started_at: string | null;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const userId = String(
      cookieStore.get("dsec_user_id")?.value || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Yetkisiz" },
        { status: 401 }
      );
    }

    const body = await request
      .json()
      .catch(() => ({}));

    const trainingId = String(
      body?.trainingId || ""
    ).trim();

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId gerekli" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    /*
     * --------------------------------------------------
     * 1. MEVCUT ATAMA VAR MI?
     * --------------------------------------------------
     *
     * Admin panelinden yapılan normal eğitim atamalarında
     * training_assignments kaydı zaten vardır.
     *
     * Eski kod burada kaydı bulunca direkt dönüyordu.
     * Bu yüzden:
     *
     * not_started -> in_progress
     *
     * geçişi gerçekleşmiyordu.
     */
    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("training_assignments")
      .select(
        "id,user_id,training_id,status,started_at"
      )
      .eq("user_id", userId)
      .eq("training_id", trainingId)
      .maybeSingle<AssignmentRow>();

    if (existingError) {
      console.error(
        "TRAINING START READ ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          error:
            "Eğitim ataması kontrol edilemedi.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * 2. ATAMA ZATEN VAR
     * --------------------------------------------------
     */
    if (existing) {
      /*
       * Daha önce başlatılmışsa hiçbir şey yazma.
       *
       * Böylece sayfa yenileme:
       *
       * STARTED
       * STARTED
       * STARTED
       *
       * şeklinde duplicate audit üretmez.
       */
      if (existing.started_at) {
        return NextResponse.json({
          success: true,
          id: existing.id,
          alreadyStarted: true,
          startedAt: existing.started_at,
        });
      }

      /*
       * İlk gerçek giriş.
       */
      const startedAt =
        new Date().toISOString();

      const {
        data: updatedAssignment,
        error: updateError,
      } = await supabase
        .from("training_assignments")
        .update({
          status: "in_progress",
          started_at: startedAt,
          last_opened_at: startedAt,
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select(
          "id,user_id,training_id,status,started_at"
        )
        .single<AssignmentRow>();

      if (updateError) {
        console.error(
          "TRAINING START UPDATE ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Eğitim başlangıcı kaydedilemedi.",
          },
          { status: 500 }
        );
      }

      /*
       * ------------------------------------------------
       * AUDIT
       * ------------------------------------------------
       *
       * Audit sistemi ana eğitim akışını ASLA
       * durdurmamalıdır.
       */
      try {
        await appendTrainingAuditEvent({
          assignmentId:
            updatedAssignment.id,

          trainingId:
            updatedAssignment.training_id,

          userId:
            updatedAssignment.user_id,

          eventType: "STARTED",

          eventLabel:
            "Eğitim başlatıldı",

          eventStatus: "info",

          occurredAt: startedAt,

          source:
            "api/training/start",

          previousData: {
            status:
              existing.status ||
              "not_started",

            started_at:
              existing.started_at,
          },

          currentData: {
            status: "in_progress",
            started_at: startedAt,
          },

          metadata: {
            first_start: true,
          },
        });
      } catch (auditError) {
        console.error(
          "TRAINING STARTED AUDIT ERROR:",
          auditError
        );
      }

      return NextResponse.json({
        success: true,
        id: updatedAssignment.id,
        started: true,
        startedAt,
      });
    }

    /*
     * --------------------------------------------------
     * 3. ESKİ / LEGACY SENARYO
     * --------------------------------------------------
     *
     * Mevcut sistem davranışını bozmamak için,
     * assignment hiç yoksa eski davranış korunuyor
     * ve kayıt oluşturuluyor.
     *
     * Ancak artık "started" yerine sistemin diğer
     * bölümleriyle uyumlu "in_progress" kullanıyoruz.
     */
    const startedAt =
      new Date().toISOString();

    const {
      data: createdAssignment,
      error: createError,
    } = await supabase
      .from("training_assignments")
      .insert({
        user_id: userId,
        training_id: trainingId,
        status: "in_progress",
        started_at: startedAt,
        last_opened_at: startedAt,
      })
      .select(
        "id,user_id,training_id,status,started_at"
      )
      .single<AssignmentRow>();

    if (createError) {
      console.error(
        "TRAINING START INSERT ERROR:",
        createError
      );

      return NextResponse.json(
        {
          error: createError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Yeni oluşturulan legacy assignment için de
     * STARTED audit kaydı.
     */
    try {
      await appendTrainingAuditEvent({
        assignmentId:
          createdAssignment.id,

        trainingId:
          createdAssignment.training_id,

        userId:
          createdAssignment.user_id,

        eventType: "STARTED",

        eventLabel:
          "Eğitim başlatıldı",

        eventStatus: "info",

        occurredAt: startedAt,

        source:
          "api/training/start",

        previousData: null,

        currentData: {
          status: "in_progress",
          started_at: startedAt,
        },

        metadata: {
          first_start: true,
          assignment_created_on_start: true,
        },
      });
    } catch (auditError) {
      console.error(
        "TRAINING STARTED AUDIT ERROR:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      id: createdAssignment.id,
      started: true,
      startedAt,
    });
  } catch (err) {
    console.error(
      "TRAINING START GENERAL ERROR:",
      err
    );

    return NextResponse.json(
      {
        error: "Sunucu hatası",
      },
      { status: 500 }
    );
  }
}