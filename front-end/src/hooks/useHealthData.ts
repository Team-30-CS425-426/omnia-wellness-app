import { useState } from "react";
import { Platform } from 'react-native';

import AppleHealthKit, { 
    HealthKitPermissions,
    HealthValue,
} from 'react-native-health';
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
                    (sleepErr: any, sleepResults: HealthValue[])=>{
                        setLoading(false);
                        if (sleepErr){
                            setError('Error loading sleep');
                            return;
                        }
                        setSleep7d(sleepResults || []);
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
    };
};
export default useHealthData;
