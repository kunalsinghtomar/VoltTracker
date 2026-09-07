// Analytics tab: explains the calculated attendance totals with bars and stat chips.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import GlassCard from '../components/GlassCard';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';

// Reusable proportional bar for total, attended, bunked, and cancelled units.
function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  // Stats are already calculated centrally, so analytics only formats them for display.
  const { stats } = useApp();

  const unitLabel = stats.mode === 'lecture' ? 'Lectures' : 'Days';

  // Show bars first, then compact numeric facts for quick comparison.
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Analytics Dashboard</Text>

      <GlassCard style={{ padding: 18 }}>
        <Text style={styles.cardTitle}>
          Semester Track Projection ({stats.mode === 'lecture' ? 'Lecture-wise' : 'Day-wise'})
        </Text>

        <Bar label={`Total Working ${unitLabel}`} value={stats.totalUnits} total={stats.totalUnits} color={colors.lavender} />
        <Bar label={`Attended ${unitLabel}`} value={stats.attendedUnits} total={stats.totalUnits} color={colors.green} />
        <Bar label={`Bunked ${unitLabel}`} value={stats.explicitBunkUnits} total={stats.totalUnits} color={colors.red} />

        {stats.mode === 'lecture' && (
          <Bar
            label="Cancelled Lectures (Prof Absent)"
            value={stats.cancelledUnits}
            total={Math.max(stats.totalUnits, stats.cancelledUnits)}
            color={colors.amber}
          />
        )}
      </GlassCard>

      <GlassCard style={{ padding: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatChip label="Required Min" value={`${stats.requiredMin}`} />
        <StatChip label="Safe Bunks Left" value={`${stats.safeBunksLeft}`} />
        <StatChip label="Official Off" value={`${stats.officialUnits}`} />
        {stats.mode === 'lecture' && <StatChip label="Cancelled" value={`${stats.cancelledUnits}`} />}
      </GlassCard>
    </ScrollView>
  );
}

// Compact metric tile used below the chart.
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase' },
  cardTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 14 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: 12, color: '#D1D5DB' },
  barValue: { fontSize: 12, fontWeight: '800' },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: '#1F2937', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  chip: {
    backgroundColor: 'rgba(11,8,19,0.5)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', minWidth: '43%',
  },
  chipValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
  chipLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
