// Tracker tab: combines the calendar with the modal used to log attendance.
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import CalendarGrid from '../components/CalendarGrid';
import AttendanceModal from '../components/AttendanceModal';

export default function TrackerScreen() {
  // The selected date controls whether the attendance modal is visible.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <CalendarGrid onSelectDate={setSelectedDate} />
      <AttendanceModal dateKey={selectedDate} onClose={() => setSelectedDate(null)} />
    </ScrollView>
  );
}
