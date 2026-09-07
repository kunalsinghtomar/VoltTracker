// Shared state layer: screens call these actions instead of editing data directly.
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppState, DEFAULT_STATE, DayLog, LogType, LectureSlot } from '../types';
import { loadState, saveState } from '../storage';
import { computeStats, Stats } from '../utils/calculations';
import { scheduleDailyReminder } from '../utils/notifications';

interface AppContextValue {
  state: AppState;
  ready: boolean;
  stats: Stats;
  setSemesterRange: (start: string, end: string) => void;
  setRequiredPercent: (percent: number) => void;
  setReminderTime: (time: string) => Promise<void>;
  setDayLog: (dateKey: string, type: LogType | 'clear', reason?: string) => void;
  addLecture: (weekday: number, subject: string, time: string) => void;
  removeLecture: (weekday: number, lectureId: string) => void;
  toggleLectureCancelled: (dateKey: string, lectureId: string) => void;
  replaceState: (next: AppState) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // `state` is the single source of truth; `ready` prevents saving before loading finishes.
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  // Load the saved state once when the provider first appears.
  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setState(loaded);
      setReady(true);
    })();
  }, []);

  // Persist every state change so edits survive an app restart.
  useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  // Keep all screens in sync with one calculated attendance result.
  const stats = useMemo(() => computeStats(state), [state]);

  // Settings actions update only the relevant part of the shared state.
  const setSemesterRange = useCallback((start: string, end: string) => {
    setState((prev) => ({ ...prev, semesterStartDate: start, semesterEndDate: end }));
  }, []);

  const setRequiredPercent = useCallback((percent: number) => {
    setState((prev) => ({ ...prev, requiredAttendancePercent: percent }));
  }, []);

  const setReminderTime = useCallback(async (time: string) => {
    setState((prev) => ({ ...prev, reminderTime: time }));
    await scheduleDailyReminder(time);
  }, []);

  // Add, replace, or remove a day-level attendance record.
  const setDayLog = useCallback((dateKey: string, type: LogType | 'clear', reason?: string) => {
    setState((prev) => {
      const logs = { ...prev.logs };
      if (type === 'clear') {
        delete logs[dateKey];
      } else {
        const entry: DayLog = { type };
        if (type === 'holiday') entry.reason = reason || 'Personal Bunk';
        logs[dateKey] = entry;
      }
      return { ...prev, logs };
    });
  }, []);

  // Add a recurring lecture and keep that weekday's list ordered by time.
  const addLecture = useCallback((weekday: number, subject: string, time: string) => {
    setState((prev) => {
      const timetable = { ...prev.timetable };
      const existing = timetable[weekday] ? [...timetable[weekday]] : [];
      const newLecture: LectureSlot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        subject,
        time,
      };
      existing.push(newLecture);
      existing.sort((a, b) => a.time.localeCompare(b.time));
      timetable[weekday] = existing;
      return { ...prev, timetable };
    });
  }, []);

  // Remove one recurring lecture from the timetable.
  const removeLecture = useCallback((weekday: number, lectureId: string) => {
    setState((prev) => {
      const timetable = { ...prev.timetable };
      timetable[weekday] = (timetable[weekday] || []).filter((l) => l.id !== lectureId);
      return { ...prev, timetable };
    });
  }, []);

  // Core of the new feature: toggle a specific lecture on a specific date as
  // "Professor Absent / Class Cancelled" so it's excluded from totals.
  const toggleLectureCancelled = useCallback((dateKey: string, lectureId: string) => {
    setState((prev) => {
      const cancellations = { ...prev.cancellations };
      const current = new Set(cancellations[dateKey] || []);
      if (current.has(lectureId)) {
        current.delete(lectureId);
      } else {
        current.add(lectureId);
      }
      if (current.size === 0) {
        delete cancellations[dateKey];
      } else {
        cancellations[dateKey] = Array.from(current);
      }
      return { ...prev, cancellations };
    });
  }, []);

  // Import/restore replaces all saved data with a validated backup state.
  const replaceState = useCallback((next: AppState) => {
    setState(next);
    if (next.reminderTime) scheduleDailyReminder(next.reminderTime);
  }, []);

  const value: AppContextValue = {
    state,
    ready,
    stats,
    setSemesterRange,
    setRequiredPercent,
    setReminderTime,
    setDayLog,
    addLecture,
    removeLecture,
    toggleLectureCancelled,
    replaceState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
