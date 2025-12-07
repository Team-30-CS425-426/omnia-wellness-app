import { useState } from "react";
import { Platform } from 'react-native';
import AppleHealthKit, {
    HealthKitPermissions,
    HealthValue,
} from 'react-native-health';
import { exportHealthCsv } from "../services/healthCSVExport";
const UI_DAYS_WINDOW = 7;
const EXPORT_DAYS_WINDOW = 30;
const { Permissions } = AppleHealthKit.Constants;
const healthPermissions: HealthKitPermissions = {
    permissions: {
        read: [
            Permissions.Steps,
            Permissions.SleepAnalysis,
        ],
        write: [],
    },
};
const useHealthData = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [steps7d, setSteps7d] = useState<HealthValue[]>([]);
    const [sleep7d, setSleep7d] = useState<HealthValue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const connectAndImport = () => {
        setError(null);
        setLoading(true);
        const hasInit = 
        Platform.OS === 'ios' &&
        AppleHealthKit && 
        typeof (AppleHealthKit as any).initHealthKit === 'function';
        if (!hasInit){
            console.warn (
                'AppleHealthKit.initHealthKit is not available - using demo data instead.'
            );
            setLoading(false);
            setError(
                'HealthKit is not available in this dev build. Showing demo data instead.'
            );
            //fake data
            const today = new Date();
            const fakeSteps: HealthValue[] = [];
            for (let i=0; i<7; i++){
                const d= new Date(today);
                d.setDate(today.getDate()-i);

                fakeSteps.push({
                    startDate: d.toISOString(),
                    endDate: d.toISOString(),
                    value: 5000 + i * 800,
                } as any);
            }
            setIsAuthorized(true);
            setSteps7d(fakeSteps);
            setSleep7d([]);
            return;
        }
        (AppleHealthKit as any).initHealthKit(
            healthPermissions,
            (err: any)=>{
                if (err){
                    setLoading(false);
                    setError('Health permissions not granted');
                    return;
                }
                setIsAuthorized(true);
                importLast7Days();
            }
        );
    };
    const importLast7Days = () => {
        const end = new Date ();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        const options = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };
        (AppleHealthKit as any).getDailyStepCountSamples(
            options, 
            (err: any, results: HealthValue[])=> {
                if (err){
                    setError('Error loading steps');
                    setLoading(false);
                    return;
                }
                const samples = results || [];
                const byDate: Record<string, number> = {};
                samples.forEach((sample: any) =>{
                    const dateKey = sample.startDate.slice(0,10);
                    const rawValue = sample.value;
                    const value = 
                        typeof rawValue == 'number'
                        ? rawValue
                        : Number (rawValue) || 0;
                    byDate[dateKey]=(byDate[dateKey] || 0) + value;
                });
                const aggregated: HealthValue[] = Object.keys(byDate)
                .sort ((a,b) => (a < b ? 1 : -1))
                .map ((dateKey)=>
                ({ 
                    startDate: dateKey,
                    endDate: dateKey,
                    value: byDate[dateKey],
                } as any)
                );
                setSteps7d(aggregated);

                (AppleHealthKit as any).getSleepSamples(
                    options,
                    (sleepErr: any, sleepResults: any[])=>{
                        setLoading(false);
                        if (sleepErr){
                            setError('Error loading sleep');
                            return;
                        }
                        const sleepByDate: Record<string, number> = {};
                        (sleepResults || []).forEach((sample) => {
                            const start = new Date(sample.startDate);
                            const end = new Date(sample.endDate);
                            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                            const dateKey = sample.startDate.slice(0,10);
                            sleepByDate[dateKey] = (sleepByDate[dateKey] || 0) + durationHours;
                        })
                        const aggregatedSleep: HealthValue[] = Object.keys(sleepByDate)
                        .sort ((a,b) => (a < b ? 1 : -1))
                        .map((dateKey) => ({
                            startDate: dateKey,
                            endDate: dateKey,
                            value: sleepByDate[dateKey],
                        } as any)
                        );
                        setSleep7d(aggregatedSleep);
                    }
                );
            }
        );
    };
    const exportToCsv = () =>{
        if (!isAuthorized){
            setError("Please connect Apple Health first.");
            return;
        }
        setError(null);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - EXPORT_DAYS_WINDOW);
        const options = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };
        (AppleHealthKit as any).getDailyStepCountSamples(
            options,
            (err: any, stepResults: HealthValue[]) => {
                if (err){
                    setError("Error loading steps for export");
                    return;
                }
                const stepSamples = stepResults || [];
                const stepsByDate: Record < string, number> = {};
                stepSamples.forEach((sample: any) => {
                    const dateKey = sample.startDate.slice(0,10);
                    const rawValue = sample.value;
                    const value = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
                    stepsByDate[dateKey] = (stepsByDate[dateKey] || 0) + value;
                });
                const steps30d: HealthValue [] = Object.keys(stepsByDate)
                .sort((a,b) => (a<b ? 1 : -1))
                .map((dateKey) => ({
                    startDate: dateKey,
                    endDate: dateKey,
                    value: stepsByDate[dateKey],
                }as any)
            );
            (AppleHealthKit as any).getSleepSamples(
                options,
                async(sleepErr: any, sleepResults: any[]) => {
                    if(sleepErr){
                        setError("Error loading sleep for export");
                        return;
                    }
                    const sleepByDate: Record<string, number> = {};
                    (sleepResults || []).forEach((sample) => {
                        const start = new Date(sample.startDate);
                        const end = new Date(sample.endDate);
                        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        const dateKey = sample.startDate.slice(0,10);
                        sleepByDate[dateKey] = (sleepByDate[dateKey] || 0) + durationHours;
                    });
                    const sleep30d: HealthValue[] = Object.keys(sleepByDate)
                    .sort((a,b) => (a < b ? 1 : -1))
                    .map((dateKey) => ({
                        startDate: dateKey,
                        endDate: dateKey,
                        value: sleepByDate[dateKey],
                    }as any));
                    try{
                        await exportHealthCsv(steps30d, sleep30d);
                    }catch(e: any){
                        console.error("Error exporting CSV", e);
                        setError(e?.message || "Error exporting CSV");
                    }
                }
            );

            }
        );
    };
    return {
        isAuthorized,
        loading,
        error,
        steps7d,
        sleep7d,
        connectAndImport,
        exportToCsv,
    };
};
export default useHealthData;
