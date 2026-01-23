// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

// TypeScript type that represents one row in the SleepLog table
export type SleepLogRow = {
    id: number;
    date: string; // Date in "YYYY-MM-DD" format
    hoursSlept: number; // Decimal hours slept (ex: 7.08)
    sleepQuality: number; // Sleep quality from 1 (worst) to 5 (best)
    bedTime: string; // Bedtime in "HH:MM:SS"
    wakeTime: string; // Wake time in "HH:MM:SS"
    notes: string | null; // Optional notes
    userID: string;       // User ID (UUID)
};

// Allowed labels for sleep quality coming from the UI
export type SleepQualityLabel = "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";

// Helper function to always make numbers 2 digits 
const pad2 = (n: number) => String(n).padStart(2, "0");

// Convert a JavaScript date into a Postgres date string
function toPgDate(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toPgTime(d: Date) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// Calculates how many hours someone slept (decimal value)
// Handles sleeping past midnight
function computeHoursSlept(bed: Date, wake: Date): number {
    // Reference date so both times start on the same day
    const referenceDate = new Date(2000, 0, 1);

    // Bedtime and wake time applied to the same reference date
    const bedDateTime = new Date(referenceDate);
    bedDateTime.setHours(bed.getHours(), bed.getMinutes(), bed.getSeconds(), 0);

    const wakeDateTime = new Date(referenceDate);
    wakeDateTime.setHours(wake.getHours(), wake.getMinutes(), wake.getSeconds(), 0);

    // If wake time is earlier than bedtime, the user slept past midnight, add 1 day
    if (wakeDateTime.getTime() <= bedDateTime.getTime()) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
    }

    // Difference in milliseconds
    const diffMs = wakeDateTime.getTime() - bedDateTime.getTime();

    // Convert milliseconds to hours
    const diffHours = diffMs / (1000 * 60 * 60);

    // Return a positive number with 2 decimal places 
    return Math.max(0, Number(diffHours.toFixed(2)));
}

// Converts decimal hours into a readable format, ex: 7h 30min
export function formatHoursToHMin(decimalHours: number): string {
    const h = Math.floor(decimalHours); // Whole hours 
    let m = Math.round((decimalHours - h) * 60); // Remaining minutes

    // Rounding gives 60 minutes
    if (m === 60) {
        m = 0;
        return `${h + 1}h ${m}min`;
    }

    return `${h}h ${m}min`;
}

// Inserts a sleep log entry into the database
export async function insertSleepLog(
    userId: string,
    entry: {
        bedTime: Date;
        wakeTime: Date;
        sleepQualityLabel: SleepQualityLabel;
        notes?: string;
        date?: Date; // Defaults to today
    }
): Promise<{ success: boolean; data?: SleepLogRow; error?: string }> {
    try {
        if (!userId) return { success: false, error: "Missing user id." };
        if (!entry.sleepQualityLabel) return { success: false, error: "Sleep quality is required." };

        // Maps UI labels to numbers stored in the database
        const qualityMap: Record<SleepQualityLabel, number> = {
            "Very Poor": 1,
            "Poor": 2,
            "Fair": 3,
            "Good": 4,
            "Excellent": 5,
        };

        // Convert label (string) to number
        const sleepQualityInt = qualityMap[entry.sleepQualityLabel];
        
        // Calculate total hours slept
        const hoursSleptDec = computeHoursSlept(entry.bedTime, entry.wakeTime);

        // Use provided date or default to today
        const dateObj = entry.date ?? new Date();
        const dateStr = toPgDate(dateObj);

        // Convert times to Postgres format
        const bedTimeStr = toPgTime(entry.bedTime);
        const wakeTimeStr = toPgTime(entry.wakeTime);

        // Insert the sleep log into Supabase 
        const { data, error } = await supabase
            .from("SleepLog")
            .insert({
                userID: userId,
                date: dateStr,
                hoursSlept: hoursSleptDec,
                sleepQuality: sleepQualityInt,
                bedTime: bedTimeStr,
                wakeTime: wakeTimeStr,
                notes: entry.notes?.trim() ? entry.notes.trim() : null, // Trim notes or store null if empty
            })
            .select("*")
            .single();
        
        // Handle database error
        if (error) return { success: false, error: error.message };

        // Normalize returned data
        const normalized = data as any;
        const normalizedRow: SleepLogRow = {
            ...normalized,
            hoursSlept: Number(normalized.hoursSlept),
        };

        return { success: true, data: normalizedRow };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}
