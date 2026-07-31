"use client";

import {
  Archive,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

type Meeting = {
  id: string;
  firmId: string;
  meetingNo: string;
  meetingTitle: string;
  meetingDateMillis: number;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  chairperson?: string | null;
  secretary?: string | null;
  description?: string | null;
  status: string;
};

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  orderNo: number;
};

type ParticipantItem = {
  id: string;
  fullName: string;
  title: string | null;
  department: string | null;
  participantRole: string | null;
  hasVotingRight: boolean;
  signedAtMillis: number | null;
};

type DecisionItem = {
  id: string;
  decisionNo: string;
  title: string;
  description: string | null;
  responsiblePerson: string | null;
  responsibleDepartment: string | null;
  decisionStatus: string;
  dueDateMillis: number | null;
  completionRate: number;
};

type Props = {
  mode: "MINUTES" | "ARCHIVE";
  meeting: Meeting;
  agenda: AgendaItem[];
  participants: ParticipantItem[];
  decisions: DecisionItem[];
  onChanged?: () => Promise<void> | void;
};

function formatDate(value?: number | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function normalizePdfText(value: unknown) {
  return String(value ?? "")
    .replaceAll("İ", "I")
    .replaceAll("ı", "i")
    .replaceAll("Ş", "S")
    .replaceAll("ş", "s")
    .replaceAll("Ğ", "G")
    .replaceAll("ğ", "g")
    .replaceAll("Ü", "U")
    .replaceAll("ü", "u")
    .replaceAll("Ö", "O")
    .replaceAll("ö", "o")
    .replaceAll("Ç", "C")
    .replaceAll("ç", "c");
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    DRAFT: "Taslak",
    PLANNED: "Planlandi",
    IN_PROGRESS: "Devam Ediyor",
    COMPLETED: "Tamamlandi",
    CANCELLED: "Iptal Edildi",
    ARCHIVED: "Arsivlendi",
  };

  return labels[value] ?? value;
}

export default function MeetingMinutesArchivePanel({
  mode,
  meeting,
  agenda,
  participants,
  decisions,
  onChanged,
}: Props) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const isArchived = meeting.status === "ARCHIVED";
  const isCompleted =
    meeting.status === "COMPLETED" || meeting.status === "ARCHIVED";

  const signedCount = useMemo(
    () => participants.filter((item) => Boolean(item.signedAtMillis)).length,
    [participants]
  );

  const generatePdf = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margin = 15;
    const pageWidth = 210;
    const usableWidth = pageWidth - margin * 2;
    let y = 18;

    const addLine = (
      text: string,
      options?: {
        size?: number;
        bold?: boolean;
        gap?: number;
      }
    ) => {
      const size = options?.size ?? 10;
      const gap = options?.gap ?? 5;

      pdf.setFont("helvetica", options?.bold ? "bold" : "normal");
      pdf.setFontSize(size);

      const lines = pdf.splitTextToSize(
        normalizePdfText(text),
        usableWidth
      ) as string[];

      for (const line of lines) {
        if (y > 282) {
          pdf.addPage();
          y = 18;
        }

        pdf.text(line, margin, y);
        y += gap;
      }
    };

    addLine("IS SAGLIGI VE GUVENLIGI KURUL TOPLANTI TUTANAGI", {
      size: 14,
      bold: true,
      gap: 7,
    });

    addLine(`Toplanti No: ${meeting.meetingNo}`, { bold: true });
    addLine(`Toplanti Basligi: ${meeting.meetingTitle}`);
    addLine(`Tarih: ${formatDate(meeting.meetingDateMillis)}`);
    addLine(
      `Saat: ${meeting.startTime || "-"}${
        meeting.endTime ? ` - ${meeting.endTime}` : ""
      }`
    );
    addLine(`Yer: ${meeting.location || "-"}`);
    addLine(`Kurul Baskani: ${meeting.chairperson || "-"}`);
    addLine(`Sekreter: ${meeting.secretary || "-"}`);
    addLine(`Durum: ${statusLabel(meeting.status)}`);

    y += 3;
    addLine("GUNDEM MADDELERI", {
      size: 12,
      bold: true,
      gap: 6,
    });

    if (agenda.length === 0) {
      addLine("Gundem maddesi bulunmuyor.");
    } else {
      agenda.forEach((item) => {
        addLine(`${item.orderNo}. ${item.title}`, { bold: true });
        if (item.description) {
          addLine(item.description);
        }
        y += 1;
      });
    }

    y += 3;
    addLine("KATILIMCILAR", {
      size: 12,
      bold: true,
      gap: 6,
    });

    if (participants.length === 0) {
      addLine("Katilimci bulunmuyor.");
    } else {
      participants.forEach((item, index) => {
        addLine(
          `${index + 1}. ${item.fullName} - ${
            item.participantRole || item.title || "Katilimci"
          }${item.signedAtMillis ? " - Imzaladi" : " - Imza Bekliyor"}`
        );
      });
    }

    y += 3;
    addLine("KURUL KARARLARI", {
      size: 12,
      bold: true,
      gap: 6,
    });

    if (decisions.length === 0) {
      addLine("Kurul karari bulunmuyor.");
    } else {
      decisions.forEach((item) => {
        addLine(`${item.decisionNo} - ${item.title}`, { bold: true });

        if (item.description) {
          addLine(item.description);
        }

        addLine(
          `Sorumlu: ${
            item.responsiblePerson || item.responsibleDepartment || "-"
          } | Termin: ${formatDate(item.dueDateMillis)} | Durum: ${
            item.decisionStatus
          } | Tamamlanma: %${item.completionRate}`
        );

        y += 2;
      });
    }

    y += 4;
    addLine("IMZA BOLUMU", {
      size: 12,
      bold: true,
      gap: 7,
    });

    participants.forEach((item) => {
      addLine(
        `${item.fullName}  ______________________________`
      );
      y += 3;
    });

    pdf.save(
      `ISG-Kurul-Tutanagi-${normalizePdfText(meeting.meetingNo).replaceAll(
        "/",
        "-"
      )}.pdf`
    );
  };

  const printMinutes = () => {
    window.print();
  };

  const updateStatus = async (status: "COMPLETED" | "ARCHIVED") => {
    setWorking(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/documentation/board/${encodeURIComponent(meeting.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status,
            signedMinutesAvailable:
              status === "ARCHIVED" || signedCount === participants.length,
          }),
        }
      );

      const json = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || json.success === false) {
        throw new Error(
          json.error || json.message || "Toplantı durumu güncellenemedi."
        );
      }

      setMessage(
        status === "ARCHIVED"
          ? "Toplantı başarıyla arşivlendi."
          : "Toplantı tamamlandı olarak işaretlendi."
      );

      await onChanged?.();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "İşlem tamamlanamadı."
      );
    } finally {
      setWorking(false);
    }
  };

  if (mode === "ARCHIVE") {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            Kurul Arşivi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tamamlanan toplantıyı arşivleyin ve kayıt durumunu yönetin.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <InfoCard
            label="Toplantı Durumu"
            value={statusLabel(meeting.status)}
          />
          <InfoCard
            label="İmzalanan Katılımcı"
            value={`${signedCount} / ${participants.length}`}
          />
          <InfoCard
            label="Toplam Karar"
            value={String(decisions.length)}
          />
        </div>

        <div className="border-t border-slate-200 p-5">
          {message ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          {isArchived ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <p className="font-bold">
                  Toplantı arşivlendi
                </p>
                <p className="mt-1 text-sm">
                  Bu toplantı kurul arşivinde korunuyor.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              {!isCompleted ? (
                <button
                  type="button"
                  onClick={() => void updateStatus("COMPLETED")}
                  disabled={working}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {working ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Toplantıyı Tamamla
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void updateStatus("ARCHIVED")}
                disabled={working}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {working ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                Kurul Arşivine Aktar
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Tutanak ve PDF Merkezi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Toplantı tutanağını önizleyin, yazdırın veya PDF olarak indirin.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={printMinutes}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </button>

          <button
            type="button"
            onClick={generatePdf}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            PDF İndir
          </button>
        </div>
      </div>

      <article
        id="board-minutes-print-area"
        className="space-y-7 p-6 sm:p-8"
      >
        <div className="text-center">
          <FileText className="mx-auto h-9 w-9 text-slate-500" />
          <h1 className="mt-3 text-2xl font-black text-slate-950">
            İŞ SAĞLIĞI VE GÜVENLİĞİ KURUL TOPLANTI TUTANAĞI
          </h1>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 p-5 md:grid-cols-2">
          <Detail label="Toplantı No" value={meeting.meetingNo} />
          <Detail
            label="Tarih"
            value={formatDate(meeting.meetingDateMillis)}
          />
          <Detail
            label="Toplantı Başlığı"
            value={meeting.meetingTitle}
          />
          <Detail
            label="Saat"
            value={`${meeting.startTime || "-"}${
              meeting.endTime ? ` – ${meeting.endTime}` : ""
            }`}
          />
          <Detail label="Yer" value={meeting.location || "-"} />
          <Detail
            label="Kurul Başkanı"
            value={meeting.chairperson || "-"}
          />
          <Detail label="Sekreter" value={meeting.secretary || "-"} />
          <Detail
            label="Durum"
            value={statusLabel(meeting.status)}
          />
        </div>

        <MinutesSection title="Gündem Maddeleri">
          {agenda.length === 0 ? (
            <EmptyText text="Gündem maddesi bulunmuyor." />
          ) : (
            agenda.map((item) => (
              <div
                key={item.id}
                className="border-b border-slate-100 py-3 last:border-b-0"
              >
                <p className="font-bold text-slate-900">
                  {item.orderNo}. {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </MinutesSection>

        <MinutesSection title="Katılımcılar ve İmza Durumu">
          {participants.length === 0 ? (
            <EmptyText text="Katılımcı bulunmuyor." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="border border-slate-200 p-3">Ad Soyad</th>
                    <th className="border border-slate-200 p-3">Görev</th>
                    <th className="border border-slate-200 p-3">Oy Hakkı</th>
                    <th className="border border-slate-200 p-3">İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-slate-200 p-3 font-semibold">
                        {item.fullName}
                      </td>
                      <td className="border border-slate-200 p-3">
                        {item.participantRole || item.title || "-"}
                      </td>
                      <td className="border border-slate-200 p-3">
                        {item.hasVotingRight ? "Var" : "Yok"}
                      </td>
                      <td className="border border-slate-200 p-3">
                        {item.signedAtMillis
                          ? formatDate(item.signedAtMillis)
                          : "İmza bekliyor"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MinutesSection>

        <MinutesSection title="Kurul Kararları">
          {decisions.length === 0 ? (
            <EmptyText text="Kurul kararı bulunmuyor." />
          ) : (
            decisions.map((item) => (
              <div
                key={item.id}
                className="border-b border-slate-100 py-4 last:border-b-0"
              >
                <p className="font-bold text-slate-950">
                  {item.decisionNo} – {item.title}
                </p>

                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                ) : null}

                <p className="mt-3 text-xs text-slate-500">
                  Sorumlu:{" "}
                  {item.responsiblePerson ||
                    item.responsibleDepartment ||
                    "-"}{" "}
                  · Termin: {formatDate(item.dueDateMillis)} · Durum:{" "}
                  {item.decisionStatus} · Tamamlanma: %
                  {item.completionRate}
                </p>
              </div>
            ))
          )}
        </MinutesSection>

        <MinutesSection title="İmzalar">
          <div className="grid gap-8 pt-5 md:grid-cols-2">
            {participants.map((item) => (
              <div
                key={item.id}
                className="min-h-28 border-b border-slate-400 pb-3"
              >
                <p className="font-bold text-slate-900">
                  {item.fullName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.participantRole || item.title || "Katılımcı"}
                </p>
              </div>
            ))}
          </div>
        </MinutesSection>
      </article>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #board-minutes-print-area,
          #board-minutes-print-area * {
            visibility: visible !important;
          }

          #board-minutes-print-area {
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            color: black;
          }
        }
      `}</style>
    </section>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>
    </article>
  );
}

function MinutesSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="border-b-2 border-slate-900 pb-2 text-lg font-black text-slate-950">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
      {text}
    </p>
  );
}