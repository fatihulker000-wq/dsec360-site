export type BoardMeetingType =
  | "ORDINARY"
  | "EXTRAORDINARY";

export type BoardMeetingMethod =
  | "FACE_TO_FACE"
  | "ONLINE"
  | "HYBRID";

export type BoardMeetingStatus =
  | "DRAFT"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type BoardAgendaStatus =
  | "PENDING"
  | "DISCUSSED"
  | "POSTPONED"
  | "CANCELLED";

export type BoardParticipantRole =
  | "CHAIRPERSON"
  | "SECRETARY"
  | "MEMBER"
  | "EMPLOYER_REPRESENTATIVE"
  | "OHS_SPECIALIST"
  | "WORKPLACE_PHYSICIAN"
  | "EMPLOYEE_REPRESENTATIVE"
  | "SUPPORT_PERSONNEL"
  | "GUEST"
  | "OTHER";

export type BoardAttendanceStatus =
  | "INVITED"
  | "ATTENDED"
  | "ABSENT"
  | "EXCUSED"
  | "ONLINE";

export type BoardSignatureStatus =
  | "NOT_REQUIRED"
  | "NOT_SIGNED"
  | "SIGNED"
  | "DIGITALLY_SIGNED";

export type BoardDecisionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type BoardDecisionStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED";

export type BoardVoteResult =
  | "UNANIMOUS"
  | "MAJORITY"
  | "REJECTED"
  | "NO_VOTE";

export type BoardRecordSource =
  | "WEB"
  | "APP";

export type BoardSyncStatus =
  | "PENDING"
  | "SYNCING"
  | "SYNCED"
  | "FAILED";

export type BoardMeeting = {
  id: string;

  firmId: string;
  localFirmId: number | null;

  syncKey: string;

  meetingNo: string;
  meetingTitle: string;

  meetingType: BoardMeetingType;

  meetingDateMillis: number;

  startTime: string | null;
  endTime: string | null;

  location: string | null;

  meetingMethod: BoardMeetingMethod;

  chairperson: string | null;
  secretary: string | null;

  description: string | null;
  generalNotes: string | null;

  status: BoardMeetingStatus;

  quorumRequired: number;
  quorumReached: boolean;

  participantCount: number;
  decisionCount: number;
  openDecisionCount: number;

  signedMinutesAvailable: boolean;

  source: BoardRecordSource;

  version: number;

  syncStatus: BoardSyncStatus;
  syncError: string | null;
  lastSyncedAtMillis: number | null;

  isDeleted: boolean;
  deletedAtMillis: number | null;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type BoardAgendaItem = {
  id: string;

  meetingId: string;

  firmId: string;
  localFirmId: number | null;

  syncKey: string;

  itemNo: number;

  title: string;
  description: string | null;

  presenter: string | null;
  durationMinutes: number | null;

  agendaStatus: BoardAgendaStatus;

  discussionNotes: string | null;

  source: BoardRecordSource;

  version: number;

  syncStatus: BoardSyncStatus;
  syncError: string | null;
  lastSyncedAtMillis: number | null;

  isDeleted: boolean;
  deletedAtMillis: number | null;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type BoardParticipant = {
  id: string;

  meetingId: string;

  firmId: string;
  localFirmId: number | null;

  syncKey: string;

  employeeId: string | null;
  employeeLocalId: number | null;

  fullName: string;

  title: string | null;
  department: string | null;

  participantRole: BoardParticipantRole;

  attendanceStatus: BoardAttendanceStatus;

  signatureStatus: BoardSignatureStatus;

  signedAtMillis: number | null;

  email: string | null;
  phone: string | null;

  notes: string | null;

  source: BoardRecordSource;

  version: number;

  syncStatus: BoardSyncStatus;
  syncError: string | null;
  lastSyncedAtMillis: number | null;

  isDeleted: boolean;
  deletedAtMillis: number | null;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type BoardDecision = {
  id: string;

  meetingId: string;
  agendaId: string | null;

  firmId: string;
  localFirmId: number | null;

  syncKey: string;

  decisionNo: string;

  title: string;
  description: string | null;

  responsiblePerson: string | null;
  responsibleDepartment: string | null;

  priority: BoardDecisionPriority;

  decisionStatus: BoardDecisionStatus;

  dueDateMillis: number | null;
  completedAtMillis: number | null;

  completionRate: number;

  completionNotes: string | null;

  voteResult: BoardVoteResult;

  yesVoteCount: number;
  noVoteCount: number;
  abstainVoteCount: number;

  relatedModule: string | null;
  relatedRecordId: string | null;

  source: BoardRecordSource;

  version: number;

  syncStatus: BoardSyncStatus;
  syncError: string | null;
  lastSyncedAtMillis: number | null;

  isDeleted: boolean;
  deletedAtMillis: number | null;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type BoardMeetingSavePayload = {
  id?: string;

  firmId: string;
  localFirmId?: number | null;

  syncKey?: string;

  meetingNo: string;
  meetingTitle: string;

  meetingType?: BoardMeetingType;

  meetingDateMillis: number;

  startTime?: string | null;
  endTime?: string | null;

  location?: string | null;

  meetingMethod?: BoardMeetingMethod;

  chairperson?: string | null;
  secretary?: string | null;

  description?: string | null;
  generalNotes?: string | null;

  status?: BoardMeetingStatus;

  quorumRequired?: number;
  quorumReached?: boolean;

  signedMinutesAvailable?: boolean;

  source?: BoardRecordSource;

  version?: number;
};

export type BoardAgendaSavePayload = {
  id?: string;

  meetingId: string;

  firmId: string;
  localFirmId?: number | null;

  syncKey?: string;

  itemNo: number;

  title: string;
  description?: string | null;

  presenter?: string | null;
  durationMinutes?: number | null;

  agendaStatus?: BoardAgendaStatus;

  discussionNotes?: string | null;

  source?: BoardRecordSource;

  version?: number;
};

export type BoardParticipantSavePayload = {
  id?: string;

  meetingId: string;

  firmId: string;
  localFirmId?: number | null;

  syncKey?: string;

  employeeId?: string | null;
  employeeLocalId?: number | null;

  fullName: string;

  title?: string | null;
  department?: string | null;

  participantRole?: BoardParticipantRole;

  attendanceStatus?: BoardAttendanceStatus;

  signatureStatus?: BoardSignatureStatus;

  signedAtMillis?: number | null;

  email?: string | null;
  phone?: string | null;

  notes?: string | null;

  source?: BoardRecordSource;

  version?: number;
};

export type BoardDecisionSavePayload = {
  id?: string;

  meetingId: string;
  agendaId?: string | null;

  firmId: string;
  localFirmId?: number | null;

  syncKey?: string;

  decisionNo: string;

  title: string;
  description?: string | null;

  responsiblePerson?: string | null;
  responsibleDepartment?: string | null;

  priority?: BoardDecisionPriority;

  decisionStatus?: BoardDecisionStatus;

  dueDateMillis?: number | null;
  completedAtMillis?: number | null;

  completionRate?: number;

  completionNotes?: string | null;

  voteResult?: BoardVoteResult;

  yesVoteCount?: number;
  noVoteCount?: number;
  abstainVoteCount?: number;

  relatedModule?: string | null;
  relatedRecordId?: string | null;

  source?: BoardRecordSource;

  version?: number;
};

export type BoardMeetingBundle = {
  meeting: BoardMeeting;

  agenda: BoardAgendaItem[];

  participants: BoardParticipant[];

  decisions: BoardDecision[];
};

export type BoardDashboard = {
  totalMeetings: number;

  meetingsThisYear: number;

  meetingsThisMonth: number;

  plannedMeetings: number;

  completedMeetings: number;

  openDecisions: number;

  completedDecisions: number;

  overdueDecisions: number;

  unsignedParticipants: number;

  totalParticipants: number;
};