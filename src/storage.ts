// Device persistence: keeps attendance data available after the app is closed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_STATE } from './types';

// The key is the name under which the JSON state is stored on the device.
const STORAGE_KEY = 'volttrack_state_v1';

export async function loadState(): Promise<AppState> {
  // Read and safely merge saved data with defaults, so new fields do not break old data.
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      logs: parsed.logs || {},
      timetable: parsed.timetable || {},
      cancellations: parsed.cancellations || {},
    };
  } catch (e) {
    console.error('VoltTrack: failed to load state', e);
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: AppState): Promise<void> {
  // Convert the complete state to JSON and write it to local device storage.
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('VoltTrack: failed to save state', e);
  }
}
