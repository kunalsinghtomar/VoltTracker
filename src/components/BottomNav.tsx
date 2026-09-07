// Shared bottom tab bar for switching between the four app screens.
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type ScreenKey = 'tracker' | 'timetable' | 'analytics' | 'settings';

// Keeping tab definitions in one list makes labels, icons, and navigation consistent.
const TABS: { key: ScreenKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'tracker', label: 'Tracker', icon: 'calendar' },
  { key: 'timetable', label: 'Timetable', icon: 'time' },
  { key: 'analytics', label: 'Analytics', icon: 'pie-chart' },
  { key: 'settings', label: 'Settings', icon: 'options' },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: ScreenKey;
  onChange: (key: ScreenKey) => void;
}) {
  // Highlight the active tab and notify the app shell when another tab is tapped.
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.row}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onChange(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={20} color={isActive ? colors.pink : '#6B7280'} />
              <Text style={[styles.tabLabel, { color: isActive ? colors.pink : '#6B7280' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: colors.glassBorder,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 18, 43, 0.6)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
