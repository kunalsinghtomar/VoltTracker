// Monthly calendar: displays logged days and opens the attendance editor.
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { formatDateKey } from '../utils/calculations';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Map each attendance status to its calendar color.
function typeStyle(type?: string) {
  switch (type) {
    case 'present':
      return { backgroundColor: colors.green };
    case 'holiday':
      return { backgroundColor: colors.red };
    case 'official':
      return { backgroundColor: colors.blue };
    default:
      return { backgroundColor: colors.cardEmpty, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' };
  }
}

export default function CalendarGrid({ onSelectDate }: { onSelectDate: (dateKey: string) => void }) {
  const { state } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Move the visible calendar month while correctly crossing year boundaries.
  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 11) { m = 0; y++; }
    else if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  }

  const rangeStartKey = state.semesterStartDate || null;
  const rangeEndKey = state.semesterEndDate || null;
  const hasRange = !!(rangeStartKey && rangeEndKey);

  // Build blank leading cells plus every day in the visible month.
  const cells = useMemo(() => {
    const firstDayJs = new Date(year, month, 1).getDay(); // 0=Sun
    const leadingBlanks = firstDayJs === 0 ? 6 : firstDayJs - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const items: { key: string; day: number; type?: string; outOfRange: boolean }[] = [];
    for (let i = 0; i < leadingBlanks; i++) items.push({ key: `blank-${i}`, day: 0, outOfRange: false });

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const key = formatDateKey(d);
      const log = state.logs[key];
      const outOfRange = hasRange ? (key < rangeStartKey! || key > rangeEndKey!) : false;
      items.push({ key, day, type: log?.type, outOfRange });
    }
    return items;
  }, [year, month, state.logs, hasRange, rangeStartKey, rangeEndKey]);

  // Prevent logging outside configured semester dates; otherwise open the modal.
  function handlePress(cell: { key: string; outOfRange: boolean }) {
    if (cell.outOfRange) {
      Alert.alert(
        'Outside Semester Timeline',
        "This date is outside your semester start/end range set in Settings, so it can't be logged and won't affect your attendance %. Adjust the semester dates first if this is wrong."
      );
      return;
    }
    onSelectDate(cell.key);
  }

  // Render month controls, weekday headers, day buttons, and the status legend.
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Attendance Calendar</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={14} color="#E5E7EB" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month].slice(0, 3)} {year}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={14} color="#E5E7EB" />
          </TouchableOpacity>
        </View>
      </View>

      <GlassCard style={{ padding: 14 }}>
        <View style={styles.weekHeaderRow}>
          {WEEKDAY_HEADERS.map((w) => (
            <Text key={w} style={styles.weekHeaderText}>{w}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((cell) =>
            cell.day === 0 ? (
              <View key={cell.key} style={styles.cell} />
            ) : (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.cell,
                  styles.dayBtn,
                  typeStyle(cell.type),
                  cell.outOfRange && styles.dayBtnOutOfRange,
                ]}
                onPress={() => handlePress(cell)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayText,
                    cell.type ? { color: '#fff' } : { color: '#9CA3AF' },
                    cell.outOfRange && { color: '#4B5563' },
                  ]}
                >
                  {cell.day}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </GlassCard>

      <View style={styles.legendRow}>
        <Legend color={colors.green} label="Attended" />
        <Legend color={colors.red} label="Bunk" />
        <Legend color={colors.blue} label="Official" />
      </View>
    </View>
  );
}

// Small reusable explanation of a calendar color.
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = '13.8%';

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(24,18,43,0.6)', borderWidth: 1, borderColor: colors.glassBorder,
  },
  monthLabel: { fontSize: 13, fontWeight: '600', color: '#E5E7EB', minWidth: 78, textAlign: 'center' },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekHeaderText: { width: CELL_SIZE, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#6B7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  cell: { width: CELL_SIZE, aspectRatio: 1 },
  dayBtn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayBtnOutOfRange: { opacity: 0.35 },
  dayText: { fontSize: 12, fontWeight: '700' },
  legendRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(24,18,43,0.35)', padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 9, color: colors.textMuted },
});
