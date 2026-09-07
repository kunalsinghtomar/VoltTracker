// Timetable tab: stores recurring classes for planning and reference only.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { WEEKDAY_LABELS } from '../types';

export default function TimetableScreen() {
  const { state, addLecture, removeLecture } = useApp();
  const [activeDay, setActiveDay] = useState(0);
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');

  const lectures = state.timetable[activeDay] || [];

  // Validate the subject, apply a default time, and add the lecture through the provider.
  function handleAdd() {
    if (!subject.trim()) return;
    const cleanTime = time.trim() || '09:00';
    addLecture(activeDay, subject.trim(), cleanTime);
    setSubject('');
    setTime('');
  }

  // Render weekday selectors, the add form, and the selected day's removable lectures.
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Weekly Timetable</Text>
      <Text style={styles.helper}>
        Add recurring classes and times for each day. This timetable is separate from attendance tracking
        and never changes your attendance calculation.
      </Text>

      <View style={styles.dayTabs}>
        {WEEKDAY_LABELS.map((label, idx) => {
          const isActive = idx === activeDay;
          const count = (state.timetable[idx] || []).length;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
              onPress={() => setActiveDay(idx)}
            >
              <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={styles.countDot}>
                  <Text style={styles.countDotText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassCard style={{ padding: 16, gap: 10 }}>
        <Text style={styles.formLabel}>Add lecture for {WEEKDAY_LABELS[activeDay]}</Text>
        <View style={styles.formRow}>
          <TextInput
            placeholder="Subject (e.g. Circuit Theory)"
            placeholderTextColor="#6B7280"
            value={subject}
            onChangeText={setSubject}
            style={[styles.input, { flex: 2 }]}
          />
          <TextInput
            placeholder="09:00"
            placeholderTextColor="#6B7280"
            value={time}
            onChangeText={setTime}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={16} color="#0B0813" />
          <Text style={styles.addBtnText}>Add Lecture</Text>
        </TouchableOpacity>
      </GlassCard>

      <View style={{ gap: 8 }}>
        {lectures.length === 0 ? (
          <Text style={styles.emptyText}>No lectures added for {WEEKDAY_LABELS[activeDay]} yet.</Text>
        ) : (
          lectures.map((lec) => (
            <GlassCard key={lec.id} style={styles.lectureCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lectureName}>{lec.subject}</Text>
                <Text style={styles.lectureTime}>{lec.time}</Text>
              </View>
              <TouchableOpacity onPress={() => removeLecture(activeDay, lec.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.red} />
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase' },
  helper: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  dayTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayTab: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(24,18,43,0.5)', borderWidth: 1, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  dayTabActive: { backgroundColor: colors.pink, borderColor: colors.pink },
  dayTabText: { fontSize: 11, fontWeight: '700', color: '#D1D5DB' },
  dayTabTextActive: { color: '#0B0813' },
  countDot: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1 },
  countDotText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  formLabel: { fontSize: 11, fontWeight: '700', color: '#E5E7EB' },
  formRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: '#0B0813', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 12,
  },
  addBtn: {
    backgroundColor: colors.pink, borderRadius: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addBtnText: { color: '#0B0813', fontWeight: '800', fontSize: 12 },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  lectureCard: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  lectureName: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  lectureTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
});
