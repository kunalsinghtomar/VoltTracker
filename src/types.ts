// Core data model: these types describe every kind of information VoltTrack stores.

export type LogType = 'present' | 'holiday' | 'official';

export interface DayLog {
  // One day's overall attendance choice, plus an optional explanation for a bunk.
  type: LogType;
  reason?: string;
}

// Weekday index: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
export interface LectureSlot {
  // One recurring class in the weekly timetable.
  id: string;
  subject: string;
  time: string; // "HH:MM"
}

export type Timetable = Record<number, LectureSlot[]>;

// dateKey ("YYYY-MM-DD") -> array of cancelled lecture ids for that specific date
export type CancellationMap = Record<string, string[]>;

export interface AppState {
  // Complete saved app data. Screens edit this through AppContext actions.
  semesterStartDate: string;
  semesterEndDate: string;
  requiredAttendancePercent: number;
  reminderTime: string;
  logs: Record<string, DayLog>;
  timetable: Timetable;
  cancellations: CancellationMap;
}

// Starting values used for a new install and for incomplete/older backups.
export const DEFAULT_STATE: AppState = {
  semesterStartDate: '',
  semesterEndDate: '',
  requiredAttendancePercent: 80,
  reminderTime: '',
  logs: {},
  timetable: {},
  cancellations: {},
};

// Display names use Monday-first indexes, matching the calendar and timetable.
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
