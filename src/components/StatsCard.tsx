// Main attendance summary shown above every tab.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import ProgressRing from './ProgressRing';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';

export default function StatsCard() {
  // Read live state and calculated statistics so this card updates after every edit.
  const { state, stats } = useApp();
  const isSafe = stats.percentage >= state.requiredAttendancePercent;

  // Show percentage, safety status, progress ring, safe bunks, and cancelled lecture info.
  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Projected Final %</Text>
          <View style={styles.pctRow}>
            <Text style={styles.pctText}>{stats.percentage}%</Text>
            <View style={[styles.pill, { backgroundColor: isSafe ? colors.greenBg : colors.redBg }]}>
              <Text style={{ color: isSafe ? colors.green : colors.red, fontSize: 11, fontWeight: '700' }}>
                {isSafe ? 'Safe' : 'Below Target'}
              </Text>
            </View>
          </View>
          <Text style={styles.subLabel}>
            Target: {state.requiredAttendancePercent}%{' '}
            {stats.mode === 'lecture' ? '· lecture-wise' : '· if you bunk all remaining days'}
          </Text>
        </View>
        <ProgressRing percentage={stats.percentage} target={state.requiredAttendancePercent} />
      </View>

      <View style={styles.holidayRow}>
        <View style={styles.holidayLeft}>
          <View style={styles.iconBubble}>
            <Ionicons name="sunny-outline" size={16} color={colors.lavender} />
          </View>
          <View>
            <Text style={styles.holidayTitle}>Safe Bunks Left</Text>
            <Text style={styles.holidaySub}>
              {stats.mode === 'lecture' ? 'Lectures you can still skip' : 'Days you can still afford'}
            </Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stats.safeBunksLeft}</Text>
        </View>
      </View>

      {stats.mode === 'lecture' && stats.cancelledUnits > 0 && (
        <View style={styles.cancelledNote}>
          <Ionicons name="close-circle-outline" size={14} color={colors.amber} />
          <Text style={styles.cancelledNoteText}>
            {stats.cancelledUnits} lecture{stats.cancelledUnits === 1 ? '' : 's'} cancelled (prof
            absent) — excluded from totals
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase' },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  pctText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  subLabel: { fontSize: 11, color: colors.textMuted, marginTop: 8, maxWidth: 190 },
  holidayRow: {
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(177,175,255,0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(11,8,19,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holidayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(177,175,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayTitle: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  holidaySub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  countBadge: {
    backgroundColor: 'rgba(24,18,43,0.7)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countText: { fontSize: 20, fontWeight: '900', color: colors.pink },
  cancelledNote: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelledNoteText: { fontSize: 10, color: colors.amber, flex: 1 },
});
