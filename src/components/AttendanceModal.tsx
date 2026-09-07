// Modal for recording a day's status and cancelling individual timetable lectures.
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { getWeekdayIndex, formatDateKey } from '../utils/calculations';
import { WEEKDAY_LABELS } from '../types';

export default function AttendanceModal({
  dateKey,
  onClose,
}: {
  dateKey: string | null;
  onClose: () => void;
}) {
  const { state, setDayLog, toggleLectureCancelled } = useApp();
  const [reason, setReason] = useState('');
  const [showReasonBox, setShowReasonBox] = useState(false);

  // Clear temporary reason text whenever the user opens a different date.
  useEffect(() => {
    setReason('');
    setShowReasonBox(false);
  }, [dateKey]);

  if (!dateKey) return null;

  // Find that date's weekday lectures and existing attendance/cancellation choices.
  const dateObj = new Date(dateKey + 'T00:00:00');
  const weekday = getWeekdayIndex(dateObj);
  const lecturesToday = state.timetable[weekday] || [];
  const cancelledIds = new Set(state.cancellations[dateKey] || []);
  const existingLog = state.logs[dateKey];

  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Send the selected day action to shared state, then close the editor.
  function submit(type: 'present' | 'official' | 'holiday' | 'clear') {
    setDayLog(dateKey!, type, type === 'holiday' ? reason : undefined);
    onClose();
  }

  // Render day actions first, followed by optional bunk reason and lecture toggles.
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Log Daily Session</Text>
                <Text style={styles.dateLabel}>{dateLabel}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <ActionButton
                icon="checkmark-circle"
                label="Attended"
                color={colors.green}
                bg="rgba(34,197,94,0.08)"
                border="rgba(34,197,94,0.3)"
                onPress={() => submit('present')}
              />
              <ActionButton
                icon="close-circle"
                label="Bunk"
                color={colors.red}
                bg="rgba(239,68,68,0.08)"
                border="rgba(239,68,68,0.3)"
                onPress={() => setShowReasonBox(true)}
              />
              <ActionButton
                icon="business"
                label="Official Off"
                color={colors.blue}
                bg="rgba(59,130,246,0.08)"
                border="rgba(59,130,246,0.3)"
                onPress={() => submit('official')}
              />
            </View>

            {!!existingLog && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => submit('clear')}>
                <Text style={styles.clearBtnText}>Clear Day</Text>
              </TouchableOpacity>
            )}

            {showReasonBox && (
              <View style={styles.reasonBox}>
                <TextInput
                  placeholder="Reason..."
                  placeholderTextColor="#6B7280"
                  value={reason}
                  onChangeText={setReason}
                  style={styles.reasonInput}
                />
                <TouchableOpacity style={styles.confirmBunkBtn} onPress={() => submit('holiday')}>
                  <Text style={styles.confirmBunkText}>Confirm Bunk</Text>
                </TouchableOpacity>
              </View>
            )}

            {lecturesToday.length > 0 && (
              <View style={styles.lectureSection}>
                <View style={styles.lectureHeaderRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.amber} />
                  <Text style={styles.lectureHeaderText}>
                    {WEEKDAY_LABELS[weekday]}'s Lectures — mark cancelled if the professor is absent
                  </Text>
                </View>
                {lecturesToday.map((lec) => {
                  const isCancelled = cancelledIds.has(lec.id);
                  return (
                    <View key={lec.id} style={styles.lectureRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lectureName}>{lec.subject}</Text>
                        <Text style={styles.lectureTime}>{lec.time}</Text>
                      </View>
                      <Text style={[styles.cancelledLabel, { opacity: isCancelled ? 1 : 0.4 }]}>
                        {isCancelled ? 'Cancelled' : 'Scheduled'}
                      </Text>
                      <Switch
                        value={isCancelled}
                        onValueChange={() => toggleLectureCancelled(dateKey!, lec.id)}
                        trackColor={{ false: '#374151', true: colors.amber }}
                        thumbColor="#fff"
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Reusable colored action button for the three attendance choices.
function ActionButton({
  icon, label, color, bg, border, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  border: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  sheet: {
    backgroundColor: '#18122B', borderRadius: 24, padding: 20, maxHeight: '80%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '800', color: '#fff' },
  dateLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  actionBtn: {
    flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 6,
  },
  actionLabel: { fontSize: 10, fontWeight: '700' },
  clearBtn: { marginTop: 10, backgroundColor: '#1F2937', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  clearBtnText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  reasonBox: { marginTop: 14, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 14 },
  reasonInput: {
    backgroundColor: '#0B0813', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 12,
  },
  confirmBunkBtn: { backgroundColor: colors.red, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  confirmBunkText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  lectureSection: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  lectureHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  lectureHeaderText: { fontSize: 10, color: colors.amber, flex: 1, fontWeight: '600' },
  lectureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  lectureName: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  lectureTime: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  cancelledLabel: { fontSize: 9, fontWeight: '700', color: colors.amber, width: 60, textAlign: 'right' },
});
