import { validateDailyReminderRequest } from '../reminderValidation';

describe('validateDailyReminderRequest', () => {
  test('fails when notifications are disabled', () => {
    const res = validateDailyReminderRequest({
      selectedDate: new Date('2026-03-04T12:00:00Z'),
      now: new Date('2026-03-04T11:00:00Z'),
      notificationsEnabled: false,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe(
        'Notification Disabled Please enable and allow notifications in Settings.'
      );
    }
  });

  test('fails when selected time is not in the future', () => {
    const res = validateDailyReminderRequest({
      selectedDate: new Date('2026-03-04T11:00:00Z'),
      now: new Date('2026-03-04T11:00:30Z'),
      notificationsEnabled: true,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe('Invalid time. Please enter a valid time.');
    }
  });

  test('passes when notifications are enabled and time is in the future', () => {
    const res = validateDailyReminderRequest({
      selectedDate: new Date('2026-03-04T12:05:00Z'),
      now: new Date('2026-03-04T12:00:00Z'),
      notificationsEnabled: true,
    });

    expect(res.ok).toBe(true);
  });
});