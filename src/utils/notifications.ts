// Native reminder service: schedules one repeating daily attendance notification.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Decide how a notification is displayed while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// A stable id lets us cancel/replace the previous reminder instead of duplicating it.
const REMINDER_ID = 'volttrack-daily-reminder';

export async function scheduleDailyReminder(timeString: string): Promise<void> {
  // Clear any existing reminder first, then request permission and schedule the new time.
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});

  if (!timeString) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'VoltTrack Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const [hour, minute] = timeString.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'VoltTrack Attendance',
      body: 'Did you attend all your classes today? Log it now to keep your projection accurate!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
