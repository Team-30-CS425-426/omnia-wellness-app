export type ReminderValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateDailyReminderRequest(params: {
  selectedDate: Date;
  now?: Date; // injected for testing
  notificationsEnabled: boolean;
}): ReminderValidationResult {
  const now = params.now ?? new Date();

  if (!params.notificationsEnabled) {
    return {
      ok: false,
      message:
        'Notification Disabled Please enable and allow notifications in Settings.',
    };
  }

  // Must be in the future (at least 1 minute from now)
  const diffMs = params.selectedDate.getTime() - now.getTime();
  if (diffMs < 60_000) {
    return { ok: false, message: 'Invalid time. Please enter a valid time.' };
  }

  return { ok: true };
}