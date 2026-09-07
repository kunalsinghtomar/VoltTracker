// Pure attendance calculations: no UI code lives here, so the math is reusable everywhere.
import { AppState } from '../types';

// Convert a Date into the stable key used by logs and cancellations.
export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Mon=0 ... Sun=6
// Convert JavaScript's Sunday-first weekday number to this app's Monday-first number.
export function getWeekdayIndex(d: Date): number {
  const jsDay = d.getDay(); // Sun=0..Sat=6
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Build every calendar date in the semester for lecture-by-lecture counting.
function dateRangeArray(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// The summary produced for the header and analytics screen.
export interface Stats {
  mode: 'day' | 'lecture';
  totalUnits: number;       // total working days OR total scheduled (non-cancelled) lectures
  attendedUnits: number;
  explicitBunkUnits: number; // days/lectures explicitly marked as bunk
  cancelledUnits: number;    // lectures cancelled by prof-absent toggle (lecture mode only)
  officialUnits: number;     // official holiday days
  percentage: number;
  requiredMin: number;
  safeBunksLeft: number;
}

// Attendance always uses one unit per calendar day. The timetable is planning data only.
export function computeStats(state: AppState): Stats {
  // No date range set — mirror the original web app's 90-day default.
  if (!state.semesterStartDate || !state.semesterEndDate) {
    return computeDayBased(state, null, null);
  }

  const start = new Date(state.semesterStartDate);
  const end = new Date(state.semesterEndDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return computeDayBased(state, null, null);
  }

  return computeDayBased(state, start, end);
}

// Original behavior: one attendance unit equals one semester day.
function computeDayBased(state: AppState, start: Date | null, end: Date | null): Stats {
  let attended = 0;
  let personalBunk = 0;
  let official = 0;

  // Only count logs whose date falls inside the configured semester window.
  // If no window is configured, fall back to counting everything (legacy behavior).
  const startKey = start ? formatDateKey(start) : null;
  const endKey = end ? formatDateKey(end) : null;

  Object.entries(state.logs).forEach(([dateKey, log]) => {
    if (startKey && endKey && (dateKey < startKey || dateKey > endKey)) {
      return; // outside the semester timeline — excluded entirely
    }
    if (log.type === 'present') attended++;
    else if (log.type === 'holiday') personalBunk++;
    else if (log.type === 'official') official++;
  });

  let baseTotalDays = 90;
  if (start && end) {
    baseTotalDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) + 1;
  }

  const totalUnits = Math.max(1, baseTotalDays - official);
  const percentage = Math.round((attended / totalUnits) * 100);
  const requiredMin = Math.ceil(totalUnits * (state.requiredAttendancePercent / 100));
  const safeBunksLeft = totalUnits - requiredMin - personalBunk;

  return {
    mode: 'day',
    totalUnits,
    attendedUnits: attended,
    explicitBunkUnits: personalBunk,
    cancelledUnits: 0,
    officialUnits: official,
    percentage: isFinite(percentage) ? percentage : 0,
    requiredMin,
    safeBunksLeft: Math.max(0, safeBunksLeft),
  };
}

// Lecture-granular engine — activates automatically once a timetable exists.
// A lecture toggled "Cancelled" (professor absent) is fully excluded from the
// denominator: it does not count toward total working classes at all.
// Timetable behavior: one attendance unit equals one scheduled, non-cancelled lecture.
function computeLectureBased(state: AppState, start: Date, end: Date): Stats {
  const days = dateRangeArray(start, end);

  let totalLectures = 0;
  let attendedLectures = 0;
  let explicitBunkLectures = 0;
  let cancelledLectures = 0;
  let officialDayLectures = 0;

  days.forEach((d) => {
    const key = formatDateKey(d);
    const weekday = getWeekdayIndex(d);
    const lecturesToday = state.timetable[weekday] || [];
    if (lecturesToday.length === 0) return;

    const log = state.logs[key];
    const cancelledIds = new Set(state.cancellations[key] || []);

    lecturesToday.forEach((lec) => {
      if (cancelledIds.has(lec.id)) {
        cancelledLectures++;
        return; // excluded from total working classes entirely
      }
      if (log?.type === 'official') {
        officialDayLectures++;
        return; // official holiday excludes the lecture too
      }
      totalLectures++;
      if (log?.type === 'present') attendedLectures++;
      else if (log?.type === 'holiday') explicitBunkLectures++;
      // unmarked lectures count toward total but not attended,
      // matching the original app's "projected if bunked" philosophy
    });
  });

  const totalUnits = Math.max(1, totalLectures);
  const percentage = Math.round((attendedLectures / totalUnits) * 100);
  const requiredMin = Math.ceil(totalUnits * (state.requiredAttendancePercent / 100));
  const safeBunksLeft = totalUnits - requiredMin - explicitBunkLectures;

  return {
    mode: 'lecture',
    totalUnits,
    attendedUnits: attendedLectures,
    explicitBunkUnits: explicitBunkLectures,
    cancelledUnits: cancelledLectures,
    officialUnits: officialDayLectures,
    percentage: isFinite(percentage) ? percentage : 0,
    requiredMin,
    safeBunksLeft: Math.max(0, safeBunksLeft),
  };
}
