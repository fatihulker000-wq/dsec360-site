"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  Users,
  Vote,
  X,
} from "lucide-react";

import type {
  BoardMeeting,
  BoardMeetingMethod,
  BoardMeetingStatus,
  BoardMeetingType,
} from "@/lib/documentation/board/types";

type Row = Record<string, unknown>;
type Tab = "GENERAL" | "AGENDA" | "PARTICIPANTS" | "DECISIONS" | "MINUTES" | "ARCHIVE";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  orderNo: number;
  presenter: string | null;
  durationMinutes: number | null;
  isCompleted: boolean;
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
  isOverdue: boolean;
};

type BundleResponse = {
  success?: boolean;
  meeting?: BoardMeeting;
  agenda?: unknown[];
  participants?: unknown[];
  decisions?: unknown[];
  data?: {
    meeting?: BoardMeeting;
    agenda?: unknown[];
    participants?: unknown[];
    decisions?: unknown[];
  };
  error?: string;
  message?: string;
};

type MeetingForm = {
  meetingNo: string;
  meetingTitle: string;
  meetingType: BoardMeetingType;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingMethod: BoardMeetingMethod;
  chairperson: string;
  secretary: string;
  description: string;
  status: BoardMeetingStatus;
  quorumRequired: string;
  quorumReached: boolean;
};

const STATUS_LABELS: Record<BoardMeetingStatus, string> = {
  DRAFT: "Taslak",
  PLANNED: "Planlandı",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  ARCHIVED: "Arşivlendi",
};

const clean = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const bool = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";
const nullable = (value: unknown) => clean(value) || null;

function dateInput(millis?: number | null) {
  if (!millis) return "";
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(millis?: number | null) {
  if (!millis) return "-";
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeAgenda(rows: unknown): AgendaItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((raw) => {
      const row = raw as Row;
      return {
        id: clean(row.id),
        title: clean(row.title ?? row.agendaTitle ?? row.agenda_title),
        description: nullable(row.description),
        orderNo: num(row.orderNo ?? row.order_no),
        presenter: nullable(row.presenter),
        durationMinutes:
          row.durationMinutes == null && row.duration_minutes == null
            ? null
            : num(row.durationMinutes ?? row.duration_minutes),
        isCompleted: bool(row.isCompleted ?? row.is_completed),
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => a.orderNo - b.orderNo);
}

function normalizeParticipants(rows: unknown): ParticipantItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((raw) => {
      const row = raw as Row;
      return {
        id: clean(row.id),
        fullName: clean(row.fullName ?? row.full_name ?? row.name),
        title: nullable(row.title),
        department: nullable(row.department),
        participantRole: nullable(row.participantRole ?? row.participant_role ?? row.role),
        hasVotingRight: bool(row.hasVotingRight ?? row.has_voting_right),
        signedAtMillis:
          row.signedAtMillis == null && row.signed_at_millis == null
            ? null
            : num(row.signedAtMillis ?? row.signed_at_millis),
      };
    })
    .filter((item) => item.id);
}

function normalizeDecisions(rows: unknown): DecisionItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((raw) => {
      const row = raw as Row;
      const dueDateMillis =
        row.dueDateMillis == null && row.due_date_millis == null
          ? null
          : num(row.dueDateMillis ?? row.due_date_millis);
      const decisionStatus = clean(row.decisionStatus ?? row.decision_status ?? "OPEN");
      return {
        id: clean(row.id),
        decisionNo: clean(row.decisionNo ?? row.decision_no),
        title: clean(row.title),
        description: nullable(row.description),
        responsiblePerson: nullable(row.responsiblePerson ?? row.responsible_person),
        responsibleDepartment: nullable(row.responsibleDepartment ?? row.responsible_department),
        decisionStatus,
        dueDateMillis,
        completionRate: num(row.completionRate ?? row.completion_rate),
        isOverdue:
          bool(row.isOverdue) ||
          (dueDateMillis !== null &&
            dueDateMillis < Date.now() &&
            !["COMPLETED", "CANCELLED"].includes(decisionStatus)),
      };
    })
    .filter((item) => item.id);
}

export default function BoardMeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = clean(params?.id);

  const [tab, setTab] = useState<Tab>("GENERAL");
  const [meeting, setMeeting] = useState<BoardMeeting | null>(null);
  const [form, setForm] = useState<MeetingForm | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [dialog, setDialog] = useState<"AGENDA" | "PARTICIPANT" | "DECISION" | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBundle = useCallback(
    async (silent = false) => {
      if (!meetingId) return;
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/documentation/board/bundle/${meetingId}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as BundleResponse;
        if (!response.ok || json.success === false) {
          throw new Error(json.error || json.message || "Toplantı bilgileri alınamadı.");
        }

        const source = json.data ?? json;
        if (!source.meeting) throw new Error("Toplantı kaydı bulunamadı.");

        setMeeting(source.meeting);
        setAgenda(normalizeAgenda(source.agenda));
        setParticipants(normalizeParticipants(source.participants));
        setDecisions(normalizeDecisions(source.decisions));
        setForm({
          meetingNo: source.meeting.meetingNo,
          meetingTitle: source.meeting.meetingTitle,
          meetingType: source.meeting.meetingType,
          meetingDate: dateInput(source.meeting.meetingDateMillis),
          startTime: source.meeting.startTime ?? "",
          endTime: source.meeting.endTime ?? "",
          location: source.meeting.location ?? "",
          meetingMethod: source.meeting.meetingMethod,
          chairperson: source.meeting.chairperson ?? "",
          secretary: source.meeting.secretary ?? "",
          description: source.meeting.description ?? "",
          status: source.meeting.status,
          quorumRequired: String(source.meeting.quorumRequired ?? 1),
          quorumReached: source.meeting.quorumReached,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Toplantı yüklenemedi.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [meetingId]
  );

  useEffect(() => {
    void loadBundle();
  }, [loadBundle]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const openDecisionCount = useMemo(
    () => decisions.filter((item) => !["COMPLETED", "CANCELLED"].includes(item.decisionStatus)).length,
    [decisions]
  );

  const overdueDecisionCount = useMemo(
    () => decisions.filter((item) => item.isOverdue).length,
    [decisions]
  );

  async function api(url: string, options: RequestInit) {
    const response = await fetch(url, options);
    const json = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      message?: string;
    };
    if (!response.ok || json.success === false) {
      throw new Error(json.error || json.message || "İşlem tamamlanamadı.");
    }
  }

  async function saveMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meeting || !form) return;
    setSaving(true);
    setError("");

    try {
      await api(`/api/admin/documentation/board/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId: meeting.firmId,
          meetingNo: form.meetingNo.trim(),
          meetingTitle: form.meetingTitle.trim(),
          meetingType: form.meetingType,
          meetingDateMillis: new Date(`${form.meetingDate}T${form.startTime || "00:00"}:00`).getTime(),
          startTime: nullable(form.startTime),
          endTime: nullable(form.endTime),
          location: nullable(form.location),
          meetingMethod: form.meetingMethod,
          chairperson: nullable(form.chairperson),
          secretary: nullable(form.secretary),
          description: nullable(form.description),
          status: form.status,
          quorumRequired: Math.max(1, num(form.quorumRequired, 1)),
          quorumReached: form.quorumReached,
        }),
      });
      setSuccess("Toplantı bilgileri güncellendi.");
      await loadBundle(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Toplantı güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(kind: "agenda" | "participants" | "decisions", id: string) {
    if (!window.confirm("Bu kayıt silinsin mi?")) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/documentation/board/${kind}/${id}`, { method: "DELETE" });
      setSuccess("Kayıt silindi.");
      await loadBundle(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Kayıt silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-slate-600" />
      </main>
    );
  }

  if (!meeting || !form) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <AlertCircle className="h-6 w-6" />
          <p className="mt-3">{error || "Toplantı bulunamadı."}</p>
          <Link href="/admin/documentation/board" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Kurul Merkezine Dön
          </Link>
        </div>
      </main>
    );
  }

  const tabs: Array<{ value: Tab; label: string; icon: React.ElementType; count?: number }> = [
    { value: "GENERAL", label: "Genel Bilgiler", icon: CalendarDays },
    { value: "AGENDA", label: "Gündem", icon: ClipboardList, count: agenda.length },
    { value: "PARTICIPANTS", label: "Katılımcılar", icon: Users, count: participants.length },
    { value: "DECISIONS", label: "Kararlar", icon: Vote, count: decisions.length },
    { value: "MINUTES", label: "Tutanak / PDF", icon: FileText },
    { value: "ARCHIVE", label: "Arşiv", icon: Archive },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link href="/admin/documentation/board" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> İSG Kurul Merkezi
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold">
                    {STATUS_LABELS[meeting.status]}
                  </span>
                  <span className="text-xs text-slate-300">{meeting.meetingNo}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{meeting.meetingTitle}</h1>
                <p className="mt-3 text-sm text-slate-300">
                  {formatDate(meeting.meetingDateMillis)} · {meeting.startTime || "Saat belirtilmedi"}
                  {meeting.endTime ? ` – ${meeting.endTime}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadBundle(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15 disabled:opacity-60"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Yenile
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-7 lg:p-9">
            {success ? (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5" /> {success}
              </div>
            ) : null}

            {error ? (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5" /> {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Gündem", agenda.length, "Toplam madde"],
                ["Katılımcı", participants.length, "Kurul katılımcısı"],
                ["Açık Karar", openDecisionCount, `${decisions.length} toplam karar`],
                ["Geciken", overdueDecisionCount, "Termin kontrolü"],
              ].map(([label, value, detail]) => (
                <article key={String(label)} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
                  <p className="mt-2 text-xs text-slate-500">{detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200 p-2">
              <div className="flex min-w-max gap-2">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTab(item.value)}
                      className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                        active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                      {item.count !== undefined ? <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{item.count}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              {tab === "GENERAL" ? (
                <form onSubmit={saveMeeting} className="rounded-2xl border border-slate-200">
                  <div className="grid gap-5 p-5 sm:grid-cols-2">
                    <Field label="Toplantı No">
                      <input value={form.meetingNo} onChange={(e) => setForm({ ...form, meetingNo: e.target.value })} className="input" />
                    </Field>
                    <Field label="Durum">
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BoardMeetingStatus })} className="input">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label="Toplantı Başlığı" wide>
                      <input value={form.meetingTitle} onChange={(e) => setForm({ ...form, meetingTitle: e.target.value })} className="input" />
                    </Field>
                    <Field label="Toplantı Türü">
                      <select value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value as BoardMeetingType })} className="input">
                        <option value="ORDINARY">Olağan</option>
                        <option value="EXTRAORDINARY">Olağanüstü</option>
                      </select>
                    </Field>
                    <Field label="Toplantı Yöntemi">
                      <select value={form.meetingMethod} onChange={(e) => setForm({ ...form, meetingMethod: e.target.value as BoardMeetingMethod })} className="input">
                        <option value="FACE_TO_FACE">Yüz yüze</option>
                        <option value="ONLINE">Çevrim içi</option>
                        <option value="HYBRID">Hibrit</option>
                      </select>
                    </Field>
                    <Field label="Toplantı Tarihi">
                      <input type="date" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} className="input" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Başlangıç"><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" /></Field>
                      <Field label="Bitiş"><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" /></Field>
                    </div>
                    <Field label="Toplantı Yeri" wide>
                      <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
                    </Field>
                    <Field label="Kurul Başkanı"><input value={form.chairperson} onChange={(e) => setForm({ ...form, chairperson: e.target.value })} className="input" /></Field>
                    <Field label="Sekreter"><input value={form.secretary} onChange={(e) => setForm({ ...form, secretary: e.target.value })} className="input" /></Field>
                    <Field label="Toplantı Yeter Sayısı"><input type="number" min={1} value={form.quorumRequired} onChange={(e) => setForm({ ...form, quorumRequired: e.target.value })} className="input" /></Field>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                      <input type="checkbox" checked={form.quorumReached} onChange={(e) => setForm({ ...form, quorumReached: e.target.checked })} />
                      <span className="text-sm font-semibold text-slate-700">Toplantı yeter sayısı sağlandı</span>
                    </label>
                    <Field label="Açıklama" wide>
                      <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-32 py-3" />
                    </Field>
                  </div>
                  <div className="flex justify-end border-t border-slate-200 p-5">
                    <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Değişiklikleri Kaydet
                    </button>
                  </div>
                </form>
              ) : null}

              {tab === "AGENDA" ? (
                <Section title="Gündem Maddeleri" button="Gündem Ekle" onAdd={() => setDialog("AGENDA")}>
                  {agenda.length === 0 ? <Empty text="Henüz gündem maddesi eklenmedi." /> : agenda.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 border-t border-slate-100 p-5 first:border-t-0">
                      <div>
                        <h3 className="font-bold text-slate-950">{item.orderNo}. {item.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{item.description || "Açıklama yok"}</p>
                      </div>
                      <button type="button" onClick={() => void deleteRecord("agenda", item.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </Section>
              ) : null}

              {tab === "PARTICIPANTS" ? (
                <Section title="Katılımcılar" button="Katılımcı Ekle" onAdd={() => setDialog("PARTICIPANT")}>
                  {participants.length === 0 ? <Empty text="Henüz katılımcı eklenmedi." /> : (
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                      {participants.map((item) => (
                        <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <UserRound className="h-5 w-5 text-slate-500" />
                              <div><h3 className="font-bold">{item.fullName}</h3><p className="text-xs text-slate-500">{item.title || item.participantRole || "Kurul üyesi"}</p></div>
                            </div>
                            <button type="button" onClick={() => void deleteRecord("participants", item.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </Section>
              ) : null}

              {tab === "DECISIONS" ? (
                <Section title="Kurul Kararları" button="Karar Ekle" onAdd={() => setDialog("DECISION")}>
                  {decisions.length === 0 ? <Empty text="Henüz karar eklenmedi." /> : decisions.map((item) => (
                    <article key={item.id} className="border-t border-slate-100 p-5 first:border-t-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex gap-2"><strong>{item.decisionNo}</strong>{item.isOverdue ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Gecikti</span> : null}</div>
                          <h3 className="mt-2 font-bold">{item.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{item.description || "Açıklama yok"}</p>
                          <p className="mt-3 text-xs text-slate-500">Sorumlu: {item.responsiblePerson || item.responsibleDepartment || "-"} · Termin: {formatDate(item.dueDateMillis)} · %{item.completionRate}</p>
                        </div>
                        <button type="button" onClick={() => void deleteRecord("decisions", item.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </article>
                  ))}
                </Section>
              ) : null}

              {tab === "MINUTES" ? <Placeholder icon={FileText} title="Tutanak ve PDF Merkezi" text="Toplantı tutanağı, katılım listesi ve karar listesi PDF çıktıları buraya bağlanacak." /> : null}
              {tab === "ARCHIVE" ? <Placeholder icon={Archive} title="Kurul Arşivi" text="Tamamlanan toplantılar ve imzalı belgeler Dokümantasyon arşivine buradan aktarılacak." /> : null}
            </div>
          </div>
        </section>
      </div>

      {dialog ? <QuickDialog kind={dialog} meetingId={meetingId} agenda={agenda} saving={saving} setSaving={setSaving} setError={setError} setSuccess={setSuccess} close={() => setDialog(null)} reload={() => loadBundle(true)} /> : null}

      <style jsx global>{`
        .input { height: 44px; width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; background: white; padding: 0 12px; font-size: 14px; color: #1e293b; outline: none; }
        .input:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,.15); }
      `}</style>
    </main>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "block sm:col-span-2" : "block"}><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

function Section({ title, button, onAdd, children }: { title: string; button: string; onAdd: () => void; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onAdd} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />{button}</button></div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><ClipboardList className="h-10 w-10 text-slate-400" /><p className="mt-3 text-sm text-slate-500">{text}</p></div>;
}

function Placeholder({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 p-8 text-center"><Icon className="h-10 w-10 text-slate-500" /><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 max-w-xl text-sm text-slate-500">{text}</p></section>;
}

function QuickDialog({
  kind,
  meetingId,
  agenda,
  saving,
  setSaving,
  setError,
  setSuccess,
  close,
  reload,
}: {
  kind: "AGENDA" | "PARTICIPANT" | "DECISION";
  meetingId: string;
  agenda: AgendaItem[];
  saving: boolean;
  setSaving: (value: boolean) => void;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
  close: () => void;
  reload: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    description: "",
    fullName: "",
    decisionNo: "",
    responsiblePerson: "",
    dueDate: "",
    agendaId: "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = kind === "AGENDA" ? "/api/admin/documentation/board/agenda" : kind === "PARTICIPANT" ? "/api/admin/documentation/board/participants" : "/api/admin/documentation/board/decisions";
      const payload = kind === "AGENDA"
        ? { meetingId, title: values.title, description: nullable(values.description), orderNo: agenda.length + 1, isCompleted: false }
        : kind === "PARTICIPANT"
        ? { meetingId, fullName: values.fullName, participantRole: "MEMBER", attendanceStatus: "PRESENT", hasVotingRight: true, signedAtMillis: null }
        : { meetingId, agendaId: nullable(values.agendaId), decisionNo: values.decisionNo, title: values.title, description: nullable(values.description), responsiblePerson: nullable(values.responsiblePerson), priority: "NORMAL", decisionStatus: "OPEN", dueDateMillis: values.dueDate ? new Date(`${values.dueDate}T23:59:59`).getTime() : null, completionRate: 0, voteResult: "NO_VOTE", yesVoteCount: 0, noVoteCount: 0, abstainVoteCount: 0 };

      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string; message?: string };
      if (!response.ok || json.success === false) throw new Error(json.error || json.message || "Kayıt eklenemedi.");
      close();
      setSuccess("Kayıt başarıyla eklendi.");
      await reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Kayıt eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-xl font-bold">{kind === "AGENDA" ? "Gündem Ekle" : kind === "PARTICIPANT" ? "Katılımcı Ekle" : "Karar Ekle"}</h2><button type="button" onClick={close}><X className="h-5 w-5" /></button></div>
        <form onSubmit={submit} className="space-y-4 p-5">
          {kind === "PARTICIPANT" ? (
            <Field label="Ad Soyad *"><input required value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} className="input" /></Field>
          ) : (
            <>
              {kind === "DECISION" ? <Field label="Karar No *"><input required value={values.decisionNo} onChange={(e) => setValues({ ...values, decisionNo: e.target.value })} className="input" /></Field> : null}
              {kind === "DECISION" ? <Field label="Gündem Maddesi"><select value={values.agendaId} onChange={(e) => setValues({ ...values, agendaId: e.target.value })} className="input"><option value="">Bağlantı yok</option>{agenda.map((item) => <option key={item.id} value={item.id}>{item.orderNo}. {item.title}</option>)}</select></Field> : null}
              <Field label={kind === "AGENDA" ? "Gündem Başlığı *" : "Karar Başlığı *"}><input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className="input" /></Field>
              <Field label="Açıklama"><textarea rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} className="input min-h-28 py-3" /></Field>
              {kind === "DECISION" ? <><Field label="Sorumlu Kişi"><input value={values.responsiblePerson} onChange={(e) => setValues({ ...values, responsiblePerson: e.target.value })} className="input" /></Field><Field label="Termin Tarihi"><input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} className="input" /></Field></> : null}
            </>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={close} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold">Vazgeç</button><button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Kaydet</button></div>
        </form>
      </div>
    </div>
  );
}