import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function percent(
    part: number,
    total: number
) {
    if (total <= 0) return 0;

    return Math.round(
        (part / total) * 100
    );
}

export async function GET(
    request: NextRequest
) {

    try {

        const url =
            new URL(request.url);

        const companyId =
            url.searchParams.get(
                "companyId"
            );

        /*
         Eğitimler
        */

        let trainingQuery =
            supabase
                .from("trainings")
                .select("*");

        if (companyId) {

            trainingQuery =
                trainingQuery.eq(
                    "company_id",
                    companyId
                );

        }

        /*
         Eğitim Atamaları
        */

        let assignmentQuery =
            supabase
                .from(
                    "training_assignments"
                )
                .select("*");

        if (companyId) {

            assignmentQuery =
                assignmentQuery.eq(
                    "company_id",
                    companyId
                );

        }

        /*
         Sertifikalar
        */

        let certificateQuery =
            supabase
                .from(
                    "training_certificates"
                )
                .select("*");

        if (companyId) {

            certificateQuery =
                certificateQuery.eq(
                    "company_id",
                    companyId
                );

        }

        /*
         Audit
        */

        let auditQuery =
            supabase
                .from(
                    "training_audit"
                )
                .select("*");

        if (companyId) {

            auditQuery =
                auditQuery.eq(
                    "company_id",
                    companyId
                );

        }

        const [

            trainings,

            assignments,

            certificates,

            audits,

        ] =
            await Promise.all([

                trainingQuery,

                assignmentQuery,

                certificateQuery,

                auditQuery,

            ]);

        if (
            trainings.error ||
            assignments.error ||
            certificates.error ||
            audits.error
        ) {

            return NextResponse.json(

                {

                    success: false,

                    error:
                        "Veriler okunamadı.",

                },

                {
                    status: 500,
                }

            );

        }

        const trainingRows =
            trainings.data ?? [];

        const assignmentRows =
            assignments.data ?? [];

        const certificateRows =
            certificates.data ?? [];

        const auditRows =
            audits.data ?? [];
                    /*
         ==============================
         KPI ve AI Metric Hesaplamaları
         ==============================
        */

        const totalTrainings = trainingRows.length;

        const totalAssignments = assignmentRows.length;

        const completedAssignments =
            assignmentRows.filter(
                (item: any) =>
                    item.status === "COMPLETED"
            ).length;

        const inProgressAssignments =
            assignmentRows.filter(
                (item: any) =>
                    item.status === "IN_PROGRESS"
            ).length;

        const notStartedAssignments =
            assignmentRows.filter(
                (item: any) =>
                    item.status === "NOT_STARTED"
            ).length;

        const successfulFinalExams =
            assignmentRows.filter(
                (item: any) =>
                    item.final_exam_passed === true
            ).length;

        const failedFinalExams =
            assignmentRows.filter(
                (item: any) =>
                    item.final_exam_passed === false
            ).length;

        const finalExamCount =
            successfulFinalExams +
            failedFinalExams;

        const averageFinalScore =
            finalExamCount === 0
                ? 0
                : Math.round(

                    assignmentRows.reduce(

                        (sum: number, row: any) =>

                            sum +
                            Number(
                                row.final_exam_score ??
                                0
                            ),

                        0

                    ) /

                    finalExamCount

                );

        const averageEvidenceScore =
            auditRows.length === 0
                ? 0
                : Math.round(

                    auditRows.reduce(

                        (sum: number, row: any) =>

                            sum +
                            Number(
                                row.evidence_score ??
                                0
                            ),

                        0

                    ) /

                    auditRows.length

                );

        const certificatesIssued =
            certificateRows.filter(
                (item: any) =>
                    item.status === "ACTIVE"
            ).length;

        const certificatesRevoked =
            certificateRows.filter(
                (item: any) =>
                    item.status === "REVOKED"
            ).length;

        const certificatesExpired =
            certificateRows.filter(
                (item: any) =>
                    item.status === "EXPIRED"
            ).length;

        const trainingsWithVideo =
            trainingRows.filter(
                (item: any) =>
                    item.video_count > 0
            ).length;

        const trainingsWithFinalExam =
            trainingRows.filter(
                (item: any) =>
                    item.final_exam_count > 0
            ).length;

        const overdueAssignments =
            assignmentRows.filter(
                (item: any) =>
                    item.status === "OVERDUE"
            ).length;

        const expiringCertificates =
            certificateRows.filter(
                (item: any) =>
                    item.status === "EXPIRING"
            ).length;

        /*
         ==============================
         AI Metrics
         ==============================
        */

        const metrics = {

            totalTrainings,

            totalAssignments,

            completedAssignments,

            inProgressAssignments,

            notStartedAssignments,

            successfulFinalExams,

            failedFinalExams,

            finalExamCount,

            averageFinalScore,

            certificatesIssued,

            certificatesRevoked,

            certificatesExpired,

            averageEvidenceScore,

            contentReadyTrainings:
                trainingsWithVideo,

            trainingsWithVideo,

            trainingsWithFinalExam,

            overdueAssignments,

            expiringCertificates,

            renewalRequiredCount:
                certificatesExpired,

        };
                /*
        ===================================
        Trend Analizi (Son 12 Ay)
        ===================================
        */

        const monthNames = [
            "Ocak",
            "Şubat",
            "Mart",
            "Nisan",
            "Mayıs",
            "Haziran",
            "Temmuz",
            "Ağustos",
            "Eylül",
            "Ekim",
            "Kasım",
            "Aralık",
        ];

        const monthly = monthNames.map((month, index) => {

            const rows =
                assignmentRows.filter((row: any) => {

                    if (!row.completed_at) return false;

                    const date = new Date(row.completed_at);

                    return date.getMonth() === index;

                });

            const completed =
                rows.filter(
                    (r: any) =>
                        r.status === "COMPLETED"
                ).length;

            const assigned =
                Math.max(
                    completed,
                    rows.length
                );

            const finalRows =
                rows.filter(
                    (r: any) =>
                        r.final_exam_score != null
                );

            const averageFinal =
                finalRows.length === 0
                    ? 0
                    : Math.round(

                        finalRows.reduce(

                            (sum: number, row: any) =>

                                sum +
                                Number(
                                    row.final_exam_score
                                ),

                            0

                        ) /

                        finalRows.length

                    );

            const evidenceRows =
                auditRows.filter((audit: any) => {

                    if (!audit.created_at) return false;

                    const date = new Date(
                        audit.created_at
                    );

                    return date.getMonth() === index;

                });

            const evidence =
                evidenceRows.length === 0
                    ? 0
                    : Math.round(

                        evidenceRows.reduce(

                            (sum: number, row: any) =>

                                sum +
                                Number(
                                    row.evidence_score ??
                                    0
                                ),

                            0

                        ) /

                        evidenceRows.length

                    );

            const certificateCount =
                certificateRows.filter((c: any) => {

                    if (!c.issued_at) return false;

                    const date = new Date(
                        c.issued_at
                    );

                    return date.getMonth() === index;

                }).length;

            const completionRate =
                percent(
                    completed,
                    assigned
                );

            const aiScore =
                Math.round(

                    completionRate * 0.40 +

                    averageFinal * 0.25 +

                    evidence * 0.20 +

                    percent(
                        certificateCount,
                        Math.max(
                            completed,
                            1
                        )
                    ) *
                        0.15

                );

            return {

                month,

                assigned,

                completed,

                averageFinalScore:
                    averageFinal,

                certificateCount,

                evidenceScore:
                    evidence,

                aiScore,

            };

        });

        /*
        ===================================
        Departman Analizi
        ===================================
        */

        const departmentMap =
            new Map<
                string,
                any
            >();

        assignmentRows.forEach((row: any) => {

            const key =
                row.department ??
                "Tanımsız";

            if (
                !departmentMap.has(key)
            ) {

                departmentMap.set(

                    key,

                    {

                        id: key,

                        name: key,

                        employeeCount: 0,

                        assignedTrainings: 0,

                        completedTrainings: 0,

                        averageFinalScore: 0,

                        averageEvidenceScore:
                            averageEvidenceScore,

                        certificateCount: 0,

                        overdueTrainings: 0,

                        expiredCertificates: 0,

                    }

                );

            }

            const item =
                departmentMap.get(key);

            item.employeeCount++;

            item.assignedTrainings++;

            if (
                row.status ===
                "COMPLETED"
            ) {

                item.completedTrainings++;

            }

            if (
                row.status ===
                "OVERDUE"
            ) {

                item.overdueTrainings++;

            }

            if (
                row.final_exam_score !=
                null
            ) {

                item.averageFinalScore +=
                    Number(
                        row.final_exam_score
                    );

            }

        });

        const departments =
            Array.from(
                departmentMap.values()
            ).map((item: any) => ({

                ...item,

                averageFinalScore:
                    item.completedTrainings ===
                    0
                        ? 0
                        : Math.round(

                              item.averageFinalScore /
                                  item.completedTrainings

                          ),

            }));

        /*
        ===================================
        HeatMap
        ===================================
        */

        const heatmap =
            departments.map(
                (department: any) => ({

                    id: department.id,

                    title:
                        department.name,

                    department:
                        department.name,

                    employeeCount:
                        department.employeeCount,

                    completionRate:
                        percent(

                            department.completedTrainings,

                            Math.max(
                                department.assignedTrainings,
                                1
                            )

                        ),

                    averageExamScore:
                        department.averageFinalScore,

                    averageEvidenceScore:
                        averageEvidenceScore,

                    certificateRate:
                        percent(

                            certificatesIssued,

                            Math.max(
                                completedAssignments,
                                1
                            )

                        ),

                    overdueTrainingCount:
                        department.overdueTrainings,

                    expiredCertificateCount:
                        certificatesExpired,

                }))
        /*
        ===================================
        Executive Summary
        ===================================
        */

        const executiveSummary = {

            companyId:

                companyId ?? "ALL",

            generatedAt:
                new Date().toISOString(),

            completionRate:
                percent(
                    completedAssignments,
                    Math.max(
                        totalAssignments,
                        1
                    )
                ),

            certificateRate:
                percent(
                    certificatesIssued,
                    Math.max(
                        completedAssignments,
                        1
                    )
                ),

            evidenceScore:
                averageEvidenceScore,

            finalExamScore:
                averageFinalScore,

            aiHealthScore:

                Math.round(

                    percent(
                        completedAssignments,
                        Math.max(
                            totalAssignments,
                            1
                        )
                    ) *
                        0.40 +

                        averageFinalScore *
                            0.25 +

                        averageEvidenceScore *
                            0.20 +

                        percent(

                            certificatesIssued,

                            Math.max(
                                completedAssignments,
                                1
                            )

                        ) *
                            0.15

                ),

            riskLevel:

                overdueAssignments > 25
                    ? "CRITICAL"
                    : overdueAssignments > 10
                    ? "HIGH"
                    : overdueAssignments > 0
                    ? "MEDIUM"
                    : "LOW",

        };

        /*
        ===================================
        Response
        ===================================
        */

        return NextResponse.json({

            success: true,

            data: {

                metrics,

                monthly,

                departments,

                heatmap,

                executiveSummary,

            },

        });

    } catch (error) {

        console.error(
            error
        );

        return NextResponse.json(

            {

                success: false,

                error:
                    error instanceof Error
                        ? error.message
                        : "Training Intelligence API Error",

            },

            {

                status: 500,

            }

        );

    }

}