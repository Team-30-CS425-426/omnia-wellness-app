import React, { useEffect, useState } from 'react';
import { View, Switch, Button, Alert, StyleSheet } from 'react-native';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import{
    ReminderTime,
    loadReminderSettings,
    scheduleDailyCheckInReminder,
    disableDailyCheckInReminder,
} from '@/src/services/ReminderManager';

type PresetKey = 'morning' | 'afternoon' | 'evening';
const PRESET_TIMES: Record<PresetKey, ReminderTime> = {
    morning: { hour: 9, minute: 0},
    afternoon: { hour: 13, minute: 0},
    evening: { hour: 20, minute: 0},
};

export default function SettingsScreen(){
    const [enabled, setEnabled] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<PresetKey>('evening');
    const [loading, setLoading] = useState(true);

    useEffect (() => {
        (async () => {
            try{
                const settings = await loadReminderSettings();
                setEnabled(settings.enabled);

                const preset = findClosestPreset(settings.time);
                setSelectedPreset(preset);
            }catch (e){
                console.warn('Failed to load reminder settings', e);
            }finally {
                setLoading(false);
            }
        })();
    }, []);
    const findClosestPreset = (time: ReminderTime): PresetKey => {
        if (time.hour === PRESET_TIMES.morning.hour) return 'morning';
        if(time.hour === PRESET_TIMES.afternoon.hour) return 'afternoon';
        if (time.hour === PRESET_TIMES.evening.hour) return 'evening';
        return 'evening';
    };
    const handleToggle = async (value: boolean ) => {
        setEnabled (value);
        if(value){
            const chosenTime = PRESET_TIMES[selectedPreset];
            const id = await scheduleDailyCheckInReminder(chosenTime);
            if (!id){
                Alert.alert(
                    'Notifications disabled',
                    'We could not get permission to send notifications. Please enable notifications in Settings.',
                );
                setEnabled(false);
            }else{
                Alert.alert(
                    'Daily reminder on',
                    `We will remind you every day around ${formatTime(chosenTime)}.`,
                );
            }
        }else {
            await disableDailyCheckInReminder();
            Alert.alert('Daily reminder off', 'We will stop sending daily check-in reminders.');
        }
    };

    const handlePresetChange = async (preset: PresetKey) => {
        setSelectedPreset(preset);
        if(enabled){
            const chosenTime = PRESET_TIMES[preset];
            const id = await scheduleDailyCheckInReminder(chosenTime);
            if (!id){
                Alert.alert(
                    'Notifications disabled',
                    'We could not get permission to send notifications. Please enable notifications in Setting.',
                );
                setEnabled(false);
            }else{
                Alert.alert(
                    'Reminder updated',
                    `Daily check-in will now be around ${formatTime(chosenTime)}.`,
                );
            }
        }
    };
    const formatTime = (time: ReminderTime): string => {
        let hour = time.hour;
        const minute = time.minute.toString().padStart(2,'0');
        const ampm = hour >= 12? 'PM' : 'AM';
        if (hour == 0) hour = 12;
        else if (hour > 12) hour = hour - 12;
        return `${hour}:${minute} ${ampm}`;
    };

    if (loading){
        return (
            <ThemedView style = {styles.container}>
                <ThemedText>Loading settings...</ThemedText>
            </ThemedView>
        );
    }
    return (
        <ThemedView style = {styles.container}>
            <ThemedText style = {styles.title}>Daily Check-In Reminder</ThemedText>

            <View style = {styles.row}>
                <ThemedText style = {styles.label}>Enable daily reminder</ThemedText>
                <Switch value = {enabled} onValueChange={handleToggle} />
            </View>

            <ThemedText style = { styles.sectionTitle}>Reminder time</ThemedText>
            <ThemedText style = { styles.helper}>
                Choose when you'd like to be reminded to do your daily check-in.
            </ThemedText>

            <View style = { styles.buttonRow}>
                <Button
                title = "Morning (9 AM)"
                onPress = {() => handlePresetChange('morning')}
                color = {selectedPreset === 'morning' ? '#4CAF50' : undefined }
                />
            </View>

            <View style = {styles.buttonRow}>
                <Button
                title = "Afternoon (1 PM)"
                onPress = {() => handlePresetChange('afternoon')}
                color = {selectedPreset === 'afternoon' ? '#4CAF50' : undefined }
                />
            </View>

            <View style = {styles.buttonRow}>
                <Button
                title = "Evening (8 PM)"
                onPress = {() => handlePresetChange('evening')}
                color = {selectedPreset === 'evening' ? '#4CAF50' : undefined }
                />
            </View>
        </ThemedView>
    );
}
const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginTop: 24,
        marginBottom: 8,
    },
    helper: {
        marginBottom: 12,
        color: '#555',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label:{
        fontSize: 16,
    },
    buttonRow: {
        marginVertical: 4,
    },
});