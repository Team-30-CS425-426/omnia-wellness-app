import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/app/screens/settings';

// Mock the ReminderManager module used by settings.tsx
jest.mock('@/src/services/ReminderManager', () => ({
  loadReminderSettings: jest.fn().mockResolvedValue({
    enabled: true,
    time: { hour: 9, minute: 0 },
  }),
  scheduleDailyCheckInReminder: jest.fn().mockResolvedValue(undefined),
  disableDailyCheckInReminder: jest.fn().mockResolvedValue(undefined),
  scheduleOneTimeTestReminder: jest.fn().mockResolvedValue(undefined),
}));

import { loadReminderSettings } from '@/src/services/ReminderManager';

describe('SettingsScreen', () => {
  test('loads reminder settings on screen mount', async () => {
    render(<SettingsScreen />);

    await waitFor(() => {
      expect(loadReminderSettings).toHaveBeenCalledTimes(1);
    });
  });
});