// Settings tab: edits semester rules, reminder time, and backup files.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import GlassCard from '../components/GlassCard';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { AppState, DEFAULT_STATE } from '../types';

// Format a native Date picker value into the YYYY-MM-DD format used by app state.
function toDateInputStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function SettingsScreen() {
  const { state, setSemesterRange, setRequiredPercent, setReminderTime, replaceState } = useApp();

  const [startDate, setStartDate] = useState(state.semesterStartDate ? new Date(state.semesterStartDate) : new Date());
  const [endDate, setEndDate] = useState(state.semesterEndDate ? new Date(state.semesterEndDate) : new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [targetPercent, setTargetPercent] = useState(String(state.requiredAttendancePercent));
  const [reminderTime, setReminderTimeLocal] = useState(state.reminderTime ? new Date(`1970-01-01T${state.reminderTime}:00`) : new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Save academic settings and schedule/replace the daily native reminder.
  async function handleSave() {
    setSemesterRange(toDateInputStr(startDate), toDateInputStr(endDate));
    const pct = parseInt(targetPercent, 10);
    setRequiredPercent(isNaN(pct) ? 80 : pct);
    const hh = String(reminderTime.getHours()).padStart(2, '0');
    const mm = String(reminderTime.getMinutes()).padStart(2, '0');
    await setReminderTime(`${hh}:${mm}`);
    Alert.alert('Saved', 'Academic configuration and reminders saved successfully!');
  }

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Serialize the current state into JSON and open the phone's share sheet.
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!baseDir) throw new Error('No writable directory available on this device.');

      const path = baseDir + 'volttrack_backup.json';
      await FileSystem.writeAsStringAsync(path, JSON.stringify(state, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Export VoltTrack Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Exported', `Sharing isn't available on this device. Backup saved at:\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ? String(e.message) : String(e));
    } finally {
      setExporting(false);
    }
  }

  // Pick a JSON file, validate its logs, merge missing fields, and restore it.
  async function handleImport() {
    if (importing) return;
    setImporting(true);
    try {
      // '*/*' avoids Android file pickers that don't correctly tag .json mime types
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.name && !asset.name.toLowerCase().endsWith('.json')) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Not a .json file',
            `"${asset.name}" doesn't look like a VoltTrack backup. Try anyway?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Try anyway', onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
      }

      const content = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object' || !parsed.logs) {
        throw new Error('This file is not a valid VoltTrack backup (missing "logs" data).');
      }
      const next: AppState = {
        ...DEFAULT_STATE,
        ...parsed,
        logs: parsed.logs || {},
        timetable: parsed.timetable || {},
        cancellations: parsed.cancellations || {},
      };
      replaceState(next);
      Alert.alert('Restored', 'Data backup restored!');
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ? String(e.message) : String(e));
    } finally {
      setImporting(false);
    }
  }

  // Render academic controls first and data backup controls below them.
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Academic Control Center</Text>
        <GlassCard style={{ padding: 18, gap: 14 }}>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Semester Start</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateBtnText}>{toDateInputStr(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Semester End</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateBtnText}>{toDateInputStr(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              onChange={(_, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d) setStartDate(d); }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              onChange={(_, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d) setEndDate(d); }}
            />
          )}

          <View>
            <Text style={styles.label}>Required Minimum Attendance %</Text>
            <TextInput
              value={targetPercent}
              onChangeText={setTargetPercent}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.divider} />

          <View>
            <View style={styles.reminderLabelRow}>
              <Text style={[styles.label, { color: colors.pink }]}>Daily App Reminder Time</Text>
              <Ionicons name="notifications-outline" size={14} color={colors.pink} />
            </View>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dateBtnText}>
                {String(reminderTime.getHours()).padStart(2, '0')}:{String(reminderTime.getMinutes()).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                onChange={(_, d) => { setShowTimePicker(Platform.OS === 'ios'); if (d) setReminderTimeLocal(d); }}
              />
            )}
            <Text style={styles.helperText}>
              You'll get a daily notification at this time to log attendance.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Parameters & Reminders</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Data Backup</Text>
        <GlassCard style={{ padding: 18 }}>
          <View style={styles.backupRow}>
            <TouchableOpacity style={[styles.backupBtn, exporting && styles.backupBtnDisabled]} onPress={handleExport} disabled={exporting}>
              <Ionicons name="download-outline" size={16} color={colors.lavender} />
              <Text style={styles.backupBtnText}>{exporting ? 'Exporting…' : 'Backup'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.backupBtn, importing && styles.backupBtnDisabled]} onPress={handleImport} disabled={importing}>
              <Ionicons name="cloud-upload-outline" size={16} color={colors.pink} />
              <Text style={styles.backupBtnText}>{importing ? 'Restoring…' : 'Restore'}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.textMuted, textTransform: 'uppercase', paddingHorizontal: 2 },
  dateRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  dateBtn: {
    backgroundColor: '#0B0813', borderWidth: 1, borderColor: 'rgba(255,138,174,0.2)',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  dateBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#0B0813', borderWidth: 1, borderColor: 'rgba(255,138,174,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 13,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  reminderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  helperText: { fontSize: 10, color: colors.textMuted, marginTop: 8 },
  saveBtn: {
    backgroundColor: colors.pink, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#0B0813', fontWeight: '800', fontSize: 13 },
  backupRow: { flexDirection: 'row', gap: 10 },
  backupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingVertical: 14,
  },
  backupBtnText: { color: '#E5E7EB', fontSize: 12, fontWeight: '700' },
  backupBtnDisabled: { opacity: 0.5 },
});
