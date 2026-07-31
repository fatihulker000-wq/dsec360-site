"use client";

import type { ReactNode } from "react";
import {
  Building2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AttendanceStatus =
  | "INVITED"
  | "ATTENDED"
  | "NOT_ATTENDED"
  | "EXCUSED"
  | "ONLINE";

type ParticipantSource = "BOARD_MEMBER" | "MANUAL";

type BoardMember = {
  id: string;
  fullName: string;
  title: string | null;
  department: string | null;
  boardRole: string;
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  hasVotingRight: boolean;
  isActive: boolean;
};

type MeetingParticipant = {
  id: string;
  meetingId: string;
  firmId: string;
  boardMemberId: string | null;
  participantSource: ParticipantSource;
  fullName: string;
  organizationName: string | null;
  title: string | null;
  participantRole: string | null;
  phone: string | null;
  email: string | null;
  attendanceStatus: AttendanceStatus;
  hasVotingRight: boolean;
  notes?: string | null;
};

type ManualForm = {
  id?: string;
  fullName: string;
  organizationName: string;
  title: string;
  participantRole: string;
  phone: string;
  email: string;
  attendanceStatus: AttendanceStatus;
  hasVotingRight: boolean;
  notes: string;
};

type ApiErrorBody = {
  error?: string;
  message?: string;
};

type Props = {
  meetingId: string;
  firmId: string;
  onChanged?: () => void;
};

const EMPTY_MANUAL_FORM: ManualForm = {
  fullName: "",
  organizationName: "",
  title: "",
  participantRole: "",
  phone: "",
  email: "",
  attendanceStatus: "INVITED",
  hasVotingRight: false,
  notes: "",
};

const ATTENDANCE_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  { value: "INVITED", label: "Davet Edildi" },
  { value: "ATTENDED", label: "Katıldı" },
  { value: "NOT_ATTENDED", label: "Katılmadı" },
  { value: "EXCUSED", label: "Mazeretli" },
  { value: "ONLINE", label: "Çevrim İçi" },
];

const ROLE_LABELS: Record<string, string> = {
  CHAIRPERSON: "Kurul Başkanı",
  SECRETARY: "Kurul Sekreteri",
  EMPLOYER: "İşveren",
  EMPLOYER_REPRESENTATIVE: "İşveren Vekili",
  OHS_SPECIALIST: "İş Güvenliği Uzmanı",
  WORKPLACE_PHYSICIAN: "İşyeri Hekimi",
  HUMAN_RESOURCES: "İnsan Kaynakları",
  EMPLOYEE_REPRESENTATIVE: "Çalışan Temsilcisi",
  SUPPORT_PERSONNEL: "Destek Elemanı",
  MEMBER: "Kurul Üyesi",
  GUEST: "Misafir",
  OTHER: "Diğer",
};

const roleLabel = (value: string | null | undefined) =>
  value ? ROLE_LABELS[value] ?? value : "Görev belirtilmedi";

const normalizeText = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase("tr-TR");

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export default function MeetingParticipantsTab({
  meetingId,
  firmId,
  onChanged,
}: Props) {
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"BOARD" | "MANUAL">("BOARD");

  const [search, setSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [selectedBoardMemberIds, setSelectedBoardMemberIds] = useState<string[]>(
    []
  );
  const [bulkAttendanceStatus, setBulkAttendanceStatus] =
    useState<AttendanceStatus>("INVITED");
  const [manualForm, setManualForm] =
    useState<ManualForm>(EMPTY_MANUAL_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!meetingId || !firmId) {
      setParticipants([]);
      setBoardMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [participantResponse, boardMemberResponse] = await Promise.all([
        fetch(
          `/api/admin/documentation/board/participants?meetingId=${encodeURIComponent(
            meetingId
          )}&firmId=${encodeURIComponent(firmId)}`,
          { credentials: "include", cache: "no-store" }
        ),
        fetch(
          `/api/admin/documentation/board/members?firmId=${encodeURIComponent(
            firmId
          )}`,
          { credentials: "include", cache: "no-store" }
        ),
      ]);

      const participantJson = await readJson<{
        participants?: MeetingParticipant[];
        data?: MeetingParticipant[];
      } & ApiErrorBody>(participantResponse);

      const boardMemberJson = await readJson<{
        members?: BoardMember[];
      } & ApiErrorBody>(boardMemberResponse);

      if (!participantResponse.ok) {
        throw new Error(
          participantJson.error ||
            participantJson.message ||
            "Katılımcılar alınamadı."
        );
      }

      if (!boardMemberResponse.ok) {
        throw new Error(
          boardMemberJson.error ||
            boardMemberJson.message ||
            "Kurul üyeleri alınamadı."
        );
      }

      setParticipants(
        Array.isArray(participantJson.participants)
          ? participantJson.participants
          : Array.isArray(participantJson.data)
          ? participantJson.data
          : []
      );

      setBoardMembers(
        (Array.isArray(boardMemberJson.members)
          ? boardMemberJson.members
          : []
        ).filter((item) => item.isActive !== false)
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Katılımcı verileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [meetingId, firmId]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filteredParticipants = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return participants;

    return participants.filter((participant) =>
      normalizeText(
        [
          participant.fullName,
          participant.organizationName,
          participant.title,
          participant.participantRole,
          participant.phone,
          participant.email,
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(query)
    );
  }, [participants, search]);

  const alreadyAddedBoardMemberIds = useMemo(
    () =>
      new Set(
        participants
          .map((participant) => participant.boardMemberId)
          .filter((value): value is string => Boolean(value))
      ),
    [participants]
  );

  const selectableBoardMembers = useMemo(() => {
    const query = normalizeText(boardSearch);

    return boardMembers.filter((member) => {
      if (alreadyAddedBoardMemberIds.has(member.id)) return false;
      if (!query) return true;

      return normalizeText(
        [
          member.fullName,
          member.title,
          member.department,
          member.organizationName,
          roleLabel(member.boardRole),
          member.email,
          member.phone,
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(query);
    });
  }, [boardMembers, alreadyAddedBoardMemberIds, boardSearch]);

  const totals = useMemo(
    () => ({
      all: participants.length,
      attended: participants.filter(
        (item) =>
          item.attendanceStatus === "ATTENDED" ||
          item.attendanceStatus === "ONLINE"
      ).length,
      board: participants.filter(
        (item) => item.participantSource === "BOARD_MEMBER"
      ).length,
      manual: participants.filter(
        (item) => item.participantSource === "MANUAL"
      ).length,
    }),
    [participants]
  );

  const openBoardDialog = () => {
    setDialogMode("BOARD");
    setSelectedBoardMemberIds([]);
    setBulkAttendanceStatus("INVITED");
    setBoardSearch("");
    setManualForm(EMPTY_MANUAL_FORM);
    setError("");
    setDialogOpen(true);
  };

  const openManualDialog = () => {
    setDialogMode("MANUAL");
    setManualForm(EMPTY_MANUAL_FORM);
    setSelectedBoardMemberIds([]);
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setSelectedBoardMemberIds([]);
    setManualForm(EMPTY_MANUAL_FORM);
    setBoardSearch("");
  };

  const toggleBoardMember = (id: string) => {
    setSelectedBoardMemberIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const selectAllVisibleBoardMembers = () => {
    const visibleIds = selectableBoardMembers.map((member) => member.id);

    setSelectedBoardMemberIds((current) => {
      const allSelected = visibleIds.every((id) => current.includes(id));
      if (allSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const addSelectedBoardMembers = async () => {
    if (selectedBoardMemberIds.length === 0) {
      setError("En az bir kurul üyesi seçilmelidir.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/documentation/board/participants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "ADD_BOARD_MEMBERS",
            meetingId,
            firmId,
            boardMemberIds: selectedBoardMemberIds,
            attendanceStatus: bulkAttendanceStatus,
          }),
        }
      );

      const json = await readJson<ApiErrorBody & { insertedCount?: number }>(
        response
      );

      if (!response.ok) {
        throw new Error(
          json.error ||
            json.message ||
            "Kurul üyeleri toplantıya eklenemedi."
        );
      }

      setSuccess(
        `${json.insertedCount ?? selectedBoardMemberIds.length} kurul üyesi toplantıya eklendi.`
      );
      setDialogOpen(false);
      setSelectedBoardMemberIds([]);
      await load();
      onChanged?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Kurul üyeleri toplantıya eklenemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveManualParticipant = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!manualForm.fullName.trim()) {
      setError("Ad soyad zorunludur.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const url = manualForm.id
        ? `/api/admin/documentation/board/participants/${encodeURIComponent(
            manualForm.id
          )}`
        : "/api/admin/documentation/board/participants";

      const response = await fetch(url, {
        method: manualForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "ADD_MANUAL",
          meetingId,
          firmId,
          participantSource: "MANUAL",
          ...manualForm,
          fullName: manualForm.fullName.trim(),
          organizationName: manualForm.organizationName.trim() || null,
          title: manualForm.title.trim() || null,
          participantRole: manualForm.participantRole.trim() || null,
          phone: manualForm.phone.trim() || null,
          email: manualForm.email.trim() || null,
          notes: manualForm.notes.trim() || null,
        }),
      });

      const json = await readJson<ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Katılımcı kaydedilemedi."
        );
      }

      setSuccess(
        manualForm.id
          ? "Katılımcı güncellendi."
          : "Manuel katılımcı eklendi."
      );
      setDialogOpen(false);
      setManualForm(EMPTY_MANUAL_FORM);
      await load();
      onChanged?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Katılımcı kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const editParticipant = (participant: MeetingParticipant) => {
    setDialogMode("MANUAL");
    setManualForm({
      id: participant.id,
      fullName: participant.fullName,
      organizationName: participant.organizationName ?? "",
      title: participant.title ?? "",
      participantRole: participant.participantRole ?? "",
      phone: participant.phone ?? "",
      email: participant.email ?? "",
      attendanceStatus: participant.attendanceStatus,
      hasVotingRight: participant.hasVotingRight,
      notes: participant.notes ?? "",
    });
    setError("");
    setDialogOpen(true);
  };

  const updateAttendance = async (
    participant: MeetingParticipant,
    attendanceStatus: AttendanceStatus
  ) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/documentation/board/participants/${encodeURIComponent(
          participant.id
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ attendanceStatus }),
        }
      );

      const json = await readJson<ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Katılım durumu güncellenemedi."
        );
      }

      await load();
      onChanged?.();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Katılım durumu güncellenemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeParticipant = async (participant: MeetingParticipant) => {
    if (
      !window.confirm(
        `${participant.fullName} toplantı katılımcılarından çıkarılsın mı?`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/documentation/board/participants/${encodeURIComponent(
          participant.id
        )}`,
        { method: "DELETE", credentials: "include" }
      );

      const json = await readJson<ApiErrorBody>(response);

      if (!response.ok) {
        throw new Error(
          json.error || json.message || "Katılımcı silinemedi."
        );
      }

      setSuccess("Katılımcı toplantıdan çıkarıldı.");
      await load();
      onChanged?.();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Katılımcı silinemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Toplantı Katılımcıları
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kurul üyelerini seçin veya toplantıya özel manuel katılımcı ekleyin.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openBoardDialog}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Users className="h-4 w-4" />
              Kurul Üyelerinden Seç
            </button>

            <button
              type="button"
              onClick={openManualDialog}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Manuel Katılımcı
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Toplam Katılımcı" value={totals.all} />
          <Kpi label="Katılan / Online" value={totals.attended} />
          <Kpi label="Kurul Üyesi" value={totals.board} />
          <Kpi label="Manuel Katılımcı" value={totals.manual} />
        </div>

        <div className="border-b border-slate-200 p-5">
          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ad, firma, görev, telefon veya e-posta ara"
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </label>
        </div>

        {error ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <Users className="h-10 w-10 text-slate-400" />
            <h3 className="mt-4 font-bold text-slate-900">
              Katılımcı bulunamadı
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Kurul üyelerinden seçim yapın veya toplantıya özel manuel katılımcı ekleyin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Ad Soyad</th>
                  <th className="px-4 py-3">Görev / Unvan</th>
                  <th className="px-4 py-3">Firma / Kurum</th>
                  <th className="px-4 py-3">İletişim</th>
                  <th className="px-4 py-3">Katılım</th>
                  <th className="px-4 py-3">Oy</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <SourceBadge source={participant.participantSource} />
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {participant.fullName}
                    </td>
                    <td className="px-4 py-4">
                      <div>{participant.participantRole || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {participant.title || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {participant.organizationName || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {participant.phone || "-"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {participant.email || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={participant.attendanceStatus}
                        onChange={(event) =>
                          void updateAttendance(
                            participant,
                            event.target.value as AttendanceStatus
                          )
                        }
                        disabled={saving}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none disabled:opacity-50"
                      >
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      {participant.hasVotingRight ? "Var" : "Yok"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => editParticipant(participant)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                          aria-label="Katılımcıyı düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeParticipant(participant)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label="Katılımcıyı sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {manualForm.id ? "Katılımcıyı Düzenle" : "Katılımcı Ekle"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kurul üyelerinden seçim yapın veya toplantıya özel kişi ekleyin.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={saving}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!manualForm.id ? (
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50 p-2">
                <button
                  type="button"
                  onClick={() => setDialogMode("BOARD")}
                  className={`h-11 rounded-xl text-sm font-bold ${
                    dialogMode === "BOARD"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Kurul Üyelerinden Seç
                </button>
                <button
                  type="button"
                  onClick={() => setDialogMode("MANUAL")}
                  className={`h-11 rounded-xl text-sm font-bold ${
                    dialogMode === "MANUAL"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Manuel Katılımcı
                </button>
              </div>
            ) : null}

            {dialogMode === "BOARD" && !manualForm.id ? (
              <div className="grid max-h-[calc(94vh-180px)] gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="overflow-y-auto border-r border-slate-200 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="relative block flex-1">
                      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        value={boardSearch}
                        onChange={(event) => setBoardSearch(event.target.value)}
                        placeholder="Kurul üyesi ara"
                        className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={selectAllVisibleBoardMembers}
                      className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Görünenleri Seç
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectableBoardMembers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                        Eklenebilecek aktif kurul üyesi bulunmuyor.
                      </div>
                    ) : (
                      selectableBoardMembers.map((member) => {
                        const checked = selectedBoardMemberIds.includes(
                          member.id
                        );

                        return (
                          <label
                            key={member.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                              checked
                                ? "border-slate-950 bg-slate-50"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBoardMember(member.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-950">
                                {member.fullName}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-600">
                                {roleLabel(member.boardRole)}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {member.title || member.department || "-"}
                              </div>
                            </div>
                            <UserCheck className="h-5 w-5 text-slate-400" />
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex flex-col bg-slate-50">
                  <div className="flex-1 overflow-y-auto p-5">
                    <h3 className="font-bold text-slate-950">
                      Seçilen Kurul Üyeleri
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedBoardMemberIds.length} kişi seçildi.
                    </p>

                    <div className="mt-4 space-y-2">
                      {selectedBoardMemberIds.map((id) => {
                        const member = boardMembers.find(
                          (item) => item.id === id
                        );
                        if (!member) return null;

                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">
                                {member.fullName}
                              </div>
                              <div className="mt-1 truncate text-xs text-slate-500">
                                {roleLabel(member.boardRole)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleBoardMember(id)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <Field label="Varsayılan Katılım Durumu" className="mt-5">
                      <select
                        value={bulkAttendanceStatus}
                        onChange={(event) =>
                          setBulkAttendanceStatus(
                            event.target.value as AttendanceStatus
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        {ATTENDANCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="border-t border-slate-200 bg-white p-5">
                    <button
                      type="button"
                      onClick={() => void addSelectedBoardMembers()}
                      disabled={saving || selectedBoardMemberIds.length === 0}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Seçilenleri Toplantıya Ekle
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={saveManualParticipant}
                className="max-h-[calc(94vh-180px)] overflow-y-auto"
              >
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <Field label="Ad Soyad *">
                    <input
                      required
                      value={manualForm.fullName}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="Firma / Kurum">
                    <input
                      value={manualForm.organizationName}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          organizationName: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="Görevi">
                    <input
                      value={manualForm.participantRole}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          participantRole: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="Unvanı">
                    <input
                      value={manualForm.title}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="Telefon">
                    <input
                      value={manualForm.phone}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="E-posta">
                    <input
                      type="email"
                      value={manualForm.email}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </Field>

                  <Field label="Katılım Durumu">
                    <select
                      value={manualForm.attendanceStatus}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          attendanceStatus:
                            event.target.value as AttendanceStatus,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      {ATTENDANCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={manualForm.hasVotingRight}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          hasVotingRight: event.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Oy hakkı var
                    </span>
                  </label>

                  <Field label="Açıklama" className="sm:col-span-2">
                    <textarea
                      rows={4}
                      value={manualForm.notes}
                      onChange={(event) =>
                        setManualForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                    />
                  </Field>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={saving}
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function SourceBadge({ source }: { source: ParticipantSource }) {
  return source === "BOARD_MEMBER" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
      <Users className="h-3.5 w-3.5" />
      Kurul
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
      <Building2 className="h-3.5 w-3.5" />
      Manuel
    </span>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}