// code written by Daisy Madera
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const REMINDER_ENABLED_KEY = 'dailyReminderEnabled';
const REMINDER_TIME_KEY = 'dailyReminderTime';

export type ReminderTime = {
    hour: number;
    minute: number;
};

export type ReminderSettings = {
    enabled: boolean;
    time: ReminderTime;
};

const DEFAULT_TIME: ReminderTime = { hour: 20, minute: 0};

export async function requestNotificationPermissionsAsync(): Promise<boolean>{
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted'){
        return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status == 'granted';
}

export async function scheduleDailyCheckInReminder(time: ReminderTime): Promise<string | null>{
    const hasPermission = await requestNotificationPermissionsAsync();
    if (!hasPermission){
        return null;
    }
    
    await Notifications.cancelAllScheduledNotificationsAsync();

    const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Daily check-in',
            body: 'How are you doing today? Tap to log your mood, stress, and habits.',
            sound: 'default',
        },
        trigger,
    });
    await AsyncStorage.multiSet ([
        [REMINDER_ENABLED_KEY, 'true'],
        [REMINDER_TIME_KEY, JSON.stringify(time)],
    ]);
    return id;
}
export async function disableDailyCheckInReminder(): Promise<void>{
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.multiSet([
        [REMINDER_ENABLED_KEY, 'false'],
        [REMINDER_TIME_KEY, JSON.stringify(DEFAULT_TIME)],
    ]);
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
    const [enabledStr, timeStr] = await AsyncStorage.multiGet([
        REMINDER_ENABLED_KEY,
        REMINDER_TIME_KEY,
    ]);

    const enabledValue = enabledStr?. [1];
    const timeValue = timeStr?. [1];

    let enabled = false;
    let time: ReminderTime = DEFAULT_TIME;

    if (enabledValue == 'true'){
        enabled = true;
    }

    if (timeValue){
        try{
            const parsed = JSON.parse(timeValue);
            if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number'){
                time = parsed;
            }
        }catch (e){
        }
    }
    return { enabled, time };
}

export async function scheduleOneTimeTestReminder(
    time: ReminderTime
): Promise<string | null>{
    const hasPermission = await requestNotificationPermissionsAsync();
    if (!hasPermission){
        return null;
    }
    const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.hour,
        minute: time.minute,
        repeats: false,
    };
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Test check-in reminder',
            body: 'This is a one-time test notification to make sure reminders are working.',
            sound: 'default',
        },
        trigger,
    });
    return id;
}
