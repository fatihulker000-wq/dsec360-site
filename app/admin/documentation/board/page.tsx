"use client";


import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import type {
  BoardDashboard,
  BoardMeeting,
  BoardMeetingMethod,
  BoardMeetingSavePayload,
  BoardMeetingStatus,
  BoardMeetingType,
} from "@/lib/documentation/board/types";

type ApiRecord = Record<string, unknown>;

type MeetingListResponse = {
  success?: boolean;
  meetings?: BoardMeeting[];
  data?: BoardMeeting[];
  records?: BoardMeeting[];
  error?: string;
  message?: string;
};

type DashboardResponse = {
  success?: boolean;
  dashboard?: BoardDashboard;
  data?: BoardDashboard;
  error?: string;
  message?: string;
};

type MeetingCreateResponse = {
  success?: boolean;
  meeting?: BoardMeeting;
  data?: BoardMeeting;
  record?: BoardMeeting;
  error?: string;
  message?: string;
};

type MeetingFormState = {
  firmId: string;
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
  quorumRequired: string;
};

const EMPTY_DASHBOARD: BoardDashboard = {
  totalMeetings: 0,
  meetingsThisYear: 0,
  meetingsThisMonth: 0,
  plannedMeetings: 0,
  completedMeetings: 0,
  openDecisions: 0,
  completedDecisions: 0,
  overdueDecisions: 0,
  unsignedParticipants: 0,
  totalParticipants: 0,
};

const STATUS_OPTIONS: Array<{
  value: "ALL" | BoardMeetingStatus;
  label: string;
}> = [
  {
    value: "ALL",
    label: "Tüm durumlar",
  },
  {
    value: "DRAFT",
    label: "Taslak",
  },
  {
    value: "PLANNED",
    label: "Planlandı",
  },
  {
    value: "IN_PROGRESS",
    label: "Devam ediyor",
  },
  {
    value: "COMPLETED",
    label: "Tamamlandı",
  },
  {
    value: "CANCELLED",
    label: "İptal edildi",
  },
  {
    value: "ARCHIVED",
    label: "Arşivlendi",
  },
];

const MEETING_STATUS_LABELS: Record<
  BoardMeetingStatus,
  string
> = {
  DRAFT: "Taslak",
  PLANNED: "Planlandı",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  ARCHIVED: "Arşivlendi",
};

const MEETING_TYPE_LABELS: Record<
  BoardMeetingType,
  string
> = {
  ORDINARY: "Olağan",
  EXTRAORDINARY: "Olağanüstü",
};

const MEETING_METHOD_LABELS: Record<
  BoardMeetingMethod,
  string
> = {
  FACE_TO_FACE: "Yüz yüze",
  ONLINE: "Çevrim içi",
  HYBRID: "Hibrit",
};

function createInitialForm(
  firmId = ""
): MeetingFormState {
  const now = new Date();

  const localDate = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000
  )
    .toISOString()
    .slice(0, 10);

  return {
    firmId,
    meetingNo: "",
    meetingTitle: "",
    meetingType: "ORDINARY",
    meetingDate: localDate,
    startTime: "10:00",
    endTime: "",
    location: "",
    meetingMethod: "FACE_TO_FACE",
    chairperson: "",
    secretary: "",
    description: "",
    quorumRequired: "1",
  };
}

function normalizeText(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function normalizeNumber(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function resolveArray(
  response: MeetingListResponse
): BoardMeeting[] {
  if (
    Array.isArray(response.meetings)
  ) {
    return response.meetings;
  }

  if (
    Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (
    Array.isArray(response.records)
  ) {
    return response.records;
  }

  return [];
}

function resolveDashboard(
  response: DashboardResponse
): BoardDashboard {
  const candidate =
    response.dashboard ??
    response.data;

  if (
    !candidate ||
    typeof candidate !== "object"
  ) {
    return EMPTY_DASHBOARD;
  }

  return {
    totalMeetings:
      normalizeNumber(
        candidate.totalMeetings
      ),

    meetingsThisYear:
      normalizeNumber(
        candidate.meetingsThisYear
      ),

    meetingsThisMonth:
      normalizeNumber(
        candidate.meetingsThisMonth
      ),

    plannedMeetings:
      normalizeNumber(
        candidate.plannedMeetings
      ),

    completedMeetings:
      normalizeNumber(
        candidate.completedMeetings
      ),

    openDecisions:
      normalizeNumber(
        candidate.openDecisions
      ),

    completedDecisions:
      normalizeNumber(
        candidate.completedDecisions
      ),

    overdueDecisions:
      normalizeNumber(
        candidate.overdueDecisions
      ),

    unsignedParticipants:
      normalizeNumber(
        candidate.unsignedParticipants
      ),

    totalParticipants:
      normalizeNumber(
        candidate.totalParticipants
      ),
  };
}

function findFirmIdInValue(
  value: unknown,
  depth = 0
): string {
  if (
    value == null ||
    depth > 5
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const candidate =
      normalizeText(value);

    return /^\d+$/.test(candidate)
      ? candidate
      : "";
  }

  if (
    typeof value !== "object"
  ) {
    return "";
  }

  const record =
    value as ApiRecord;

  const preferredKeys = [
    "firmId",
    "firm_id",
    "activeFirmId",
    "active_firm_id",
    "selectedFirmId",
    "selected_firm_id",
    "companyId",
    "company_id",
    "activeCompanyId",
    "selectedCompanyId",
    "id",
  ];

  for (
    const key of preferredKeys
  ) {
    if (!(key in record)) {
      continue;
    }

    const direct =
      findFirmIdInValue(
        record[key],
        depth + 1
      );

    if (direct) {
      return direct;
    }
  }

  const nestedKeys = [
    "activeFirm",
    "selectedFirm",
    "firm",
    "company",
    "activeCompany",
    "selectedCompany",
    "data",
    "state",
    "value",
    "current",
    "profile",
  ];

  for (
    const key of nestedKeys
  ) {
    if (!(key in record)) {
      continue;
    }

    const nested =
      findFirmIdInValue(
        record[key],
        depth + 1
      );

    if (nested) {
      return nested;
    }
  }

  return "";
}

function readFirmIdFromStorage(
  storage: Storage
): string {
  const directKeys = [
    "activeFirmId",
    "active_firm_id",
    "selectedFirmId",
    "selected_firm_id",
    "firmId",
    "firm_id",
    "companyId",
    "company_id",
    "activeCompanyId",
    "selectedCompanyId",
    "dsec_active_firm_id",
    "dsec.selectedFirmId",
    "dsec:selectedFirmId",
    "dsec_active_company_id",
  ];

  for (
    const key of directKeys
  ) {
    const raw =
      storage.getItem(key);

    if (!raw) {
      continue;
    }

    const direct =
      findFirmIdInValue(raw);

    if (direct) {
      return direct;
    }

    try {
      const parsed =
        JSON.parse(raw);

      const parsedId =
        findFirmIdInValue(parsed);

      if (parsedId) {
        return parsedId;
      }
    } catch {
      // Düz metin değer olabilir.
    }
  }

  const objectKeys = [
    "activeFirm",
    "selectedFirm",
    "currentFirm",
    "firm",
    "activeCompany",
    "selectedCompany",
    "currentCompany",
    "dsec_active_firm",
    "dsec.selectedFirm",
    "dsec:selectedFirm",
    "activeFirmStore",
    "ActiveFirmStore",
    "profile",
    "userProfile",
  ];

  for (
    const key of objectKeys
  ) {
    const raw =
      storage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(raw);

      const value =
        findFirmIdInValue(parsed);

      if (value) {
        return value;
      }
    } catch {
      const value =
        findFirmIdInValue(raw);

      if (value) {
        return value;
      }
    }
  }

  for (
    let index = 0;
    index < storage.length;
    index += 1
  ) {
    const key =
      storage.key(index);

    if (!key) {
      continue;
    }

    const normalizedKey =
      key.toLocaleLowerCase(
        "tr-TR"
      );

    if (
      !normalizedKey.includes("firm") &&
      !normalizedKey.includes("company") &&
      !normalizedKey.includes("firma")
    ) {
      continue;
    }

    const raw =
      storage.getItem(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(raw);

      const value =
        findFirmIdInValue(parsed);

      if (value) {
        return value;
      }
    } catch {
      const value =
        findFirmIdInValue(raw);

      if (value) {
        return value;
      }
    }
  }

  return "";
}

function getStoredFirmId(): string {
  if (typeof window === "undefined") return "";

  // Yeni ActiveFirmStore
  const activeFirm =
    localStorage.getItem("activeFirm") ??
    sessionStorage.getItem("activeFirm");

  if (activeFirm) {
    try {
      const parsed = JSON.parse(activeFirm);

      if (parsed?.id) return String(parsed.id);
      if (parsed?.firmId) return String(parsed.firmId);
      if (parsed?.webId) return String(parsed.webId);
    } catch {}
  }

  // Eski sistem uyumluluğu
  return (
    localStorage.getItem("activeFirmId") ??
    sessionStorage.getItem("activeFirmId") ??
    ""
  );
}

function dateInputToMillis(
  date: string,
  time?: string
): number {
  if (!date) {
    return Date.now();
  }

  const safeTime =
    time || "00:00";

  const parsed =
    new Date(
      `${date}T${safeTime}:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return Date.now();
  }

  return parsed.getTime();
}

function formatDate(
  millis: number
): string {
  if (
    !millis ||
    !Number.isFinite(millis)
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(millis));
}

function formatShortDate(
  millis: number
): string {
  if (
    !millis ||
    !Number.isFinite(millis)
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(new Date(millis));
}

function formatTimeRange(
  meeting: BoardMeeting
): string {
  if (
    meeting.startTime &&
    meeting.endTime
  ) {
    return `${meeting.startTime} – ${meeting.endTime}`;
  }

  return (
    meeting.startTime ??
    meeting.endTime ??
    "Saat belirtilmedi"
  );
}

function statusClass(
  status: BoardMeetingStatus
): string {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PLANNED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    case "ARCHIVED":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-violet-200 bg-violet-50 text-violet-700";
  }
}

function priorityLabel(
  meeting: BoardMeeting
): string {
  if (
    meeting.openDecisionCount > 0
  ) {
    return `${meeting.openDecisionCount} açık karar`;
  }

  if (
    meeting.decisionCount > 0
  ) {
    return `${meeting.decisionCount} karar`;
  }

  return "Karar bulunmuyor";
}

export default function BoardCenterPage() {
  const [
    meetings,
    setMeetings,
  ] = useState<BoardMeeting[]>([]);

  const [
    dashboard,
    setDashboard,
  ] = useState<BoardDashboard>(
    EMPTY_DASHBOARD
  );

  const [
    activeFirmId,
    setActiveFirmId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "ALL" | BoardMeetingStatus
  >("ALL");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    createDialogOpen,
    setCreateDialogOpen,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<MeetingFormState>(
    createInitialForm()
  );

  const loadData =
    useCallback(
      async (
        options?: {
          silent?: boolean;
          firmId?: string;
        }
      ) => {
        const silent =
          options?.silent ??
          false;

        const firmId =
          normalizeText(
            options?.firmId ??
              activeFirmId
          );

        if (!firmId) {
          setMeetings([]);
          setDashboard(
            EMPTY_DASHBOARD
          );
          setError(
            "Aktif firma belirlenemedi. Önce üst menüden bir firma seçin. Firma seçiliyse sayfayı yenileyin."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const meetingParams =
            new URLSearchParams();

          const dashboardParams =
            new URLSearchParams();

          if (firmId) {
            meetingParams.set(
              "firmId",
              firmId
            );

            dashboardParams.set(
              "firmId",
              firmId
            );
          }

          const meetingsUrl =
            meetingParams.size > 0
              ? `/api/admin/documentation/board?${meetingParams.toString()}`
              : "/api/admin/documentation/board";

          const dashboardUrl =
            dashboardParams.size > 0
              ? `/api/admin/documentation/board/dashboard?${dashboardParams.toString()}`
              : "/api/admin/documentation/board/dashboard";

          const [
            meetingsResponse,
            dashboardResponse,
          ] = await Promise.all([
            fetch(meetingsUrl, {
              cache: "no-store",
            }),

            fetch(dashboardUrl, {
              cache: "no-store",
            }),
          ]);

          const meetingsJson =
            (await meetingsResponse.json()) as MeetingListResponse;

          const dashboardJson =
            (await dashboardResponse.json()) as DashboardResponse;

          if (
            !meetingsResponse.ok ||
            meetingsJson.success === false
          ) {
            throw new Error(
              meetingsJson.error ||
                meetingsJson.message ||
                "Kurul toplantıları alınamadı."
            );
          }

          if (
            !dashboardResponse.ok ||
            dashboardJson.success === false
          ) {
            throw new Error(
              dashboardJson.error ||
                dashboardJson.message ||
                "Kurul özet bilgileri alınamadı."
            );
          }

          setMeetings(
            resolveArray(meetingsJson)
          );

          setDashboard(
            resolveDashboard(
              dashboardJson
            )
          );
        } catch (loadError) {
          console.error(
            "Kurul Merkezi veri yükleme hatası:",
            loadError
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kurul Merkezi verileri yüklenemedi."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [activeFirmId]
    );

  useEffect(() => {
    const firmId =
      getStoredFirmId();

    setActiveFirmId(firmId);

    setForm(
      createInitialForm(firmId)
    );

    void loadData({
      firmId,
    });
  }, [loadData]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4_000);

    return () =>
      window.clearTimeout(timer);
  }, [successMessage]);

  const filteredMeetings =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return meetings.filter(
        (meeting) => {
          const statusMatches =
            statusFilter === "ALL" ||
            meeting.status ===
              statusFilter;

          if (!statusMatches) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchable =
            [
              meeting.meetingNo,
              meeting.meetingTitle,
              meeting.location,
              meeting.chairperson,
              meeting.secretary,
              MEETING_STATUS_LABELS[
                meeting.status
              ],
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase(
                "tr-TR"
              );

          return searchable.includes(
            normalizedSearch
          );
        }
      );
    }, [
      meetings,
      search,
      statusFilter,
    ]);

  const upcomingMeetings =
    useMemo(() => {
      const now = Date.now();

      return meetings
        .filter(
          (meeting) =>
            !meeting.isDeleted &&
            meeting.meetingDateMillis >=
              now -
                24 *
                  60 *
                  60 *
                  1_000 &&
            [
              "DRAFT",
              "PLANNED",
              "IN_PROGRESS",
            ].includes(
              meeting.status
            )
        )
        .sort(
          (a, b) =>
            a.meetingDateMillis -
            b.meetingDateMillis
        )
        .slice(0, 4);
    }, [meetings]);

  const totalOpenDecisionCount =
    useMemo(
      () =>
        meetings.reduce(
          (total, meeting) =>
            total +
            normalizeNumber(
              meeting.openDecisionCount
            ),
          0
        ),
      [meetings]
    );

  function openCreateDialog() {
    setFormError("");

    setForm(
      createInitialForm(
        activeFirmId
      )
    );

    setCreateDialogOpen(true);
  }

  function closeCreateDialog() {
    if (saving) {
      return;
    }

    setCreateDialogOpen(false);
    setFormError("");
  }

  function updateForm<
    Key extends keyof MeetingFormState
  >(
    key: Key,
    value: MeetingFormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreateMeeting(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const firmId =
      normalizeText(
        form.firmId ||
          activeFirmId
      );

    if (!firmId) {
      setFormError(
        "Aktif firma belirlenemedi. Firma ID alanını doldurun veya firma seçimi yapın."
      );

      return;
    }

    setActiveFirmId(firmId);

    if (
      typeof window !== "undefined"
    ) {
      window.localStorage.setItem(
        "activeFirmId",
        firmId
      );
    }

    if (
      !normalizeText(
        form.meetingNo
      )
    ) {
      setFormError(
        "Toplantı numarası zorunludur."
      );

      return;
    }

    if (
      !normalizeText(
        form.meetingTitle
      )
    ) {
      setFormError(
        "Toplantı başlığı zorunludur."
      );

      return;
    }

    if (!form.meetingDate) {
      setFormError(
        "Toplantı tarihi zorunludur."
      );

      return;
    }

    const payload: BoardMeetingSavePayload =
      {
        firmId,

        meetingNo:
          form.meetingNo.trim(),

        meetingTitle:
          form.meetingTitle.trim(),

        meetingType:
          form.meetingType,

        meetingDateMillis:
          dateInputToMillis(
            form.meetingDate,
            form.startTime
          ),

        startTime:
          normalizeText(
            form.startTime
          ) || null,

        endTime:
          normalizeText(
            form.endTime
          ) || null,

        location:
          normalizeText(
            form.location
          ) || null,

        meetingMethod:
          form.meetingMethod,

        chairperson:
          normalizeText(
            form.chairperson
          ) || null,

        secretary:
          normalizeText(
            form.secretary
          ) || null,

        description:
          normalizeText(
            form.description
          ) || null,

        status: "PLANNED",

        quorumRequired:
          Math.max(
            1,
            normalizeNumber(
              form.quorumRequired,
              1
            )
          ),

        quorumReached: false,

        signedMinutesAvailable:
          false,

        source: "WEB",

        version: 1,
      };

    setSaving(true);

    try {
      const response =
        await fetch(
          "/api/admin/documentation/board",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const responseJson =
        (await response.json()) as MeetingCreateResponse;

      if (
        !response.ok ||
        responseJson.success ===
          false
      ) {
        throw new Error(
          responseJson.error ||
            responseJson.message ||
            "Toplantı oluşturulamadı."
        );
      }

      const createdMeeting =
        responseJson.meeting ??
        responseJson.record ??
        responseJson.data;

      setCreateDialogOpen(false);

      setSuccessMessage(
        "Kurul toplantısı başarıyla oluşturuldu."
      );

      setForm(
        createInitialForm(
          firmId
        )
      );

      await loadData({
        silent: true,
        firmId,
      });

      if (
        createdMeeting?.id
      ) {
        window.setTimeout(() => {
          window.location.href =
            `/admin/documentation/board/${createdMeeting.id}`;
        }, 700);
      }
    } catch (createError) {
      console.error(
        "Kurul toplantısı oluşturma hatası:",
        createError
      );

      setFormError(
        createError instanceof Error
          ? createError.message
          : "Toplantı oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  const statCards = [
    {
      label: "Toplam Toplantı",
      value:
        dashboard.totalMeetings,
      detail: `${dashboard.meetingsThisYear} toplantı bu yıl`,
      icon: CalendarDays,
    },
    {
      label: "Planlanan",
      value:
        dashboard.plannedMeetings,
      detail: `${dashboard.meetingsThisMonth} toplantı bu ay`,
      icon: Clock3,
    },
    {
      label: "Açık Kararlar",
      value:
        dashboard.openDecisions ||
        totalOpenDecisionCount,
      detail: `${dashboard.completedDecisions} karar tamamlandı`,
      icon: FileText,
    },
    {
      label: "Geciken Kararlar",
      value:
        dashboard.overdueDecisions,
      detail:
        dashboard.overdueDecisions >
        0
          ? "Takip edilmesi gerekiyor"
          : "Geciken karar bulunmuyor",
      icon: AlertCircle,
    },
    {
      label: "Katılımcılar",
      value:
        dashboard.totalParticipants,
      detail: `${dashboard.unsignedParticipants} imza bekliyor`,
      icon: Users,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-6 text-white sm:px-7 lg:px-9">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  <ShieldCheck className="h-4 w-4" />

                  Dokümantasyon Merkezi
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  İSG Kurul Merkezi
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Kurul toplantılarını,
                  gündem maddelerini,
                  katılımcıları, kararları ve
                  tamamlanma süreçlerini tek
                  merkezden yönetin.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void loadData({
                      silent: true,
                    })
                  }
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  Yenile
                </button>

                <button
                  type="button"
                  onClick={
                    openCreateDialog
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  <Plus className="h-4 w-4" />

                  Yeni Toplantı
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7 lg:p-9">
            {successMessage ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <span>
                  {successMessage}
                </span>
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">
                      Veriler yüklenemedi
                    </p>

                    <p className="mt-1">
                      {error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadData()
                  }
                  className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Tekrar dene
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map(
                ({
                  label,
                  value,
                  detail,
                  icon: Icon,
                }) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {label}
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-950">
                          {loading
                            ? "—"
                            : value}
                        </p>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      {detail}
                    </p>
                  </article>
                )
              )}
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        Kurul Toplantıları
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Toplam{" "}
                        {
                          filteredMeetings.length
                        }{" "}
                        kayıt görüntüleniyor.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          value={search}
                          onChange={(event) =>
                            setSearch(
                              event.target
                                .value
                            )
                          }
                          placeholder="Toplantı ara..."
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 sm:w-64"
                        />
                      </label>

                      <select
                        value={
                          statusFilter
                        }
                        onChange={(event) =>
                          setStatusFilter(
                            event.target
                              .value as
                              | "ALL"
                              | BoardMeetingStatus
                          )
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                      >
                        {STATUS_OPTIONS.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[360px] items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-500" />

                      <p className="mt-3 text-sm text-slate-500">
                        Kurul toplantıları
                        yükleniyor...
                      </p>
                    </div>
                  </div>
                ) : filteredMeetings.length ===
                  0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <CalendarDays className="h-8 w-8 text-slate-500" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-900">
                      Toplantı bulunamadı
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Arama ölçütlerini
                      değiştirin veya ilk kurul
                      toplantısını oluşturarak
                      süreci başlatın.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openCreateDialog
                      }
                      className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />

                      Yeni Toplantı
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredMeetings.map(
                      (meeting) => (
                        <Link
                          key={meeting.id}
                          href={`/admin/documentation/board/${meeting.id}?firmId=${encodeURIComponent(activeFirmId)}`}
                          className="group block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                    meeting.status
                                  )}`}
                                >
                                  {
                                    MEETING_STATUS_LABELS[
                                      meeting
                                        .status
                                    ]
                                  }
                                </span>

                                <span className="text-xs font-semibold text-slate-500">
                                  {
                                    meeting.meetingNo
                                  }
                                </span>

                                <span className="text-xs text-slate-400">
                                  {
                                    MEETING_TYPE_LABELS[
                                      meeting
                                        .meetingType
                                    ]
                                  }
                                </span>
                              </div>

                              <h3 className="mt-3 truncate text-base font-bold text-slate-950 group-hover:text-slate-700">
                                {
                                  meeting.meetingTitle
                                }
                              </h3>

                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="h-4 w-4" />

                                  {formatDate(
                                    meeting.meetingDateMillis
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="h-4 w-4" />

                                  {formatTimeRange(
                                    meeting
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Users className="h-4 w-4" />

                                  {
                                    meeting.participantCount
                                  }{" "}
                                  katılımcı
                                </span>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-between gap-5 lg:justify-end">
                              <div className="text-right">
                                <p
                                  className={`text-sm font-semibold ${
                                    meeting.openDecisionCount >
                                    0
                                      ? "text-amber-700"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {priorityLabel(
                                    meeting
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    MEETING_METHOD_LABELS[
                                      meeting
                                        .meetingMethod
                                    ]
                                  }
                                </p>
                              </div>

                              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                            </div>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </section>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Yaklaşan Toplantılar
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        En yakın kurul
                        planları
                      </p>
                    </div>

                    <CalendarDays className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {upcomingMeetings.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                        <CircleDashed className="mx-auto h-6 w-6 text-slate-400" />

                        <p className="mt-2 text-sm text-slate-500">
                          Yaklaşan toplantı
                          bulunmuyor.
                        </p>
                      </div>
                    ) : (
                      upcomingMeetings.map(
                        (meeting) => (
                          <Link
                            key={
                              meeting.id
                            }
                            href={`/admin/documentation/board/${meeting.id}?firmId=${encodeURIComponent(activeFirmId)}`}
                            className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
                                <span className="text-sm font-bold text-slate-900">
                                  {new Date(
                                    meeting.meetingDateMillis
                                  )
                                    .getDate()
                                    .toString()
                                    .padStart(
                                      2,
                                      "0"
                                    )}
                                </span>

                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                  {new Intl.DateTimeFormat(
                                    "tr-TR",
                                    {
                                      month:
                                        "short",
                                    }
                                  ).format(
                                    new Date(
                                      meeting.meetingDateMillis
                                    )
                                  )}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {
                                    meeting.meetingTitle
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatTimeRange(
                                    meeting
                                  )}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-400">
                                  {meeting.location ||
                                    MEETING_METHOD_LABELS[
                                      meeting
                                        .meetingMethod
                                    ]}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )
                      )
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Hızlı Durum
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Takip edilmesi gereken
                        kayıtlar
                      </p>
                    </div>

                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Açık karar
                        </p>

                        <p className="mt-1 text-xs text-amber-700">
                          Sonuç bekleyen
                          kararlar
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-amber-900">
                        {
                          dashboard.openDecisions
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Geciken karar
                        </p>

                        <p className="mt-1 text-xs text-red-700">
                          Termin tarihi aşılmış
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-red-900">
                        {
                          dashboard.overdueDecisions
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          İmza bekleyen
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Katılımcı imzaları
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-slate-900">
                        {
                          dashboard.unsignedParticipants
                        }
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                  <Archive className="h-6 w-6 text-slate-300" />

                  <h2 className="mt-4 font-bold">
                    Kurul arşivi
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Tamamlanan toplantılar,
                    kararlar ve imzalı tutanaklar
                    kurul detay ekranından
                    arşivlenebilecek.
                  </p>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>

      {createDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Yeni Kurul Toplantısı
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Toplantının temel bilgilerini
                  girin. Gündem, katılımcı ve
                  kararlar detay ekranından
                  eklenecek.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateDialog
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateMeeting
              }
              className="max-h-[calc(92vh-88px)] overflow-y-auto"
            >
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                {formError ? (
                  <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>
                      {formError}
                    </span>
                  </div>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Firma ID *
                  </span>

                  <input
                    value={form.firmId}
                    onChange={(event) =>
                      updateForm(
                        "firmId",
                        event.target.value
                      )
                    }
                    placeholder="Aktif firma ID"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı No *
                  </span>

                  <input
                    value={
                      form.meetingNo
                    }
                    onChange={(event) =>
                      updateForm(
                        "meetingNo",
                        event.target.value
                      )
                    }
                    placeholder="Örn. 2026/01"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Başlığı *
                  </span>

                  <input
                    value={
                      form.meetingTitle
                    }
                    onChange={(event) =>
                      updateForm(
                        "meetingTitle",
                        event.target.value
                      )
                    }
                    placeholder="İSG Kurulu Temmuz Ayı Toplantısı"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Türü
                  </span>

                  <select
                    value={
                      form.meetingType
                    }
                    onChange={(event) =>
                      updateForm(
                        "meetingType",
                        event.target
                          .value as BoardMeetingType
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="ORDINARY">
                      Olağan
                    </option>

                    <option value="EXTRAORDINARY">
                      Olağanüstü
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Yöntemi
                  </span>

                  <select
                    value={
                      form.meetingMethod
                    }
                    onChange={(event) =>
                      updateForm(
                        "meetingMethod",
                        event.target
                          .value as BoardMeetingMethod
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="FACE_TO_FACE">
                      Yüz yüze
                    </option>

                    <option value="ONLINE">
                      Çevrim içi
                    </option>

                    <option value="HYBRID">
                      Hibrit
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Tarihi *
                  </span>

                  <input
                    type="date"
                    value={
                      form.meetingDate
                    }
                    onChange={(event) =>
                      updateForm(
                        "meetingDate",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Başlangıç
                    </span>

                    <input
                      type="time"
                      value={
                        form.startTime
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "startTime",
                          event.target
                            .value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Bitiş
                    </span>

                    <input
                      type="time"
                      value={
                        form.endTime
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "endTime",
                          event.target
                            .value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                </div>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Yeri
                  </span>

                  <input
                    value={
                      form.location
                    }
                    onChange={(event) =>
                      updateForm(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder="Toplantı salonu veya çevrim içi bağlantı bilgisi"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Kurul Başkanı
                  </span>

                  <input
                    value={
                      form.chairperson
                    }
                    onChange={(event) =>
                      updateForm(
                        "chairperson",
                        event.target.value
                      )
                    }
                    placeholder="Ad Soyad"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Sekreter
                  </span>

                  <input
                    value={
                      form.secretary
                    }
                    onChange={(event) =>
                      updateForm(
                        "secretary",
                        event.target.value
                      )
                    }
                    placeholder="Ad Soyad"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Toplantı Yeter Sayısı
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      form.quorumRequired
                    }
                    onChange={(event) =>
                      updateForm(
                        "quorumRequired",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Açıklama
                  </span>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Toplantının amacı ve genel açıklaması"
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCreateDialog
                  }
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {saving
                    ? "Kaydediliyor..."
                    : "Toplantıyı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}