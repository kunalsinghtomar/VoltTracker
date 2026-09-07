// Root mobile entry point: builds the shared app shell and chooses the active tab.
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider } from './src/context/AppContext';
import { colors } from './src/theme';
import StatsCard from './src/components/StatsCard';
import BottomNav, { ScreenKey } from './src/components/BottomNav';
import TrackerScreen from './src/screens/TrackerScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function Shell() {
  // The selected screen is local UI state; attendance data lives in AppContext.
  const [screen, setScreen] = useState<ScreenKey>('tracker');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {/* Shared header shown above every screen. */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>B.Tech Electrical Eng.</Text>
          <Text style={styles.title}>
            Volt<Text style={{ color: colors.pink }}>Track</Text>
          </Text>
        </View>
        <View style={styles.logoBubble}>
          <Ionicons name="flash" size={18} color={colors.pink} />
        </View>
      </View>

      {/* Shared summary plus the one screen selected by the bottom navigation. */}
      <View style={styles.content}>
        <StatsCard />
        <View style={{ marginTop: 20, flex: 1 }}>
          {screen === 'tracker' && <TrackerScreen />}
          {screen === 'timetable' && <TimetableScreen />}
          {screen === 'analytics' && <AnalyticsScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </View>
      </View>

      <BottomNav active={screen} onChange={setScreen} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

// Layout and colors for the app shell; individual screens own their own styles.
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  eyebrow: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  logoBubble: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(24,18,43,0.7)', borderWidth: 1, borderColor: 'rgba(255,138,174,0.2)',
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },
});
