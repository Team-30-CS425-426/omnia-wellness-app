import { supabase } from "@/config/homeSupabaseConfig"
import { createContext, useEffect, useState } from "react"
import { StyleProp, View, ViewStyle, Text } from "react-native"
import { DateDropDown } from "./dropdown"
import { Metrics } from "./metrics"
import { KeyStats } from "./keystats"
import { Insights } from "./insights"

interface WellnessDashboardsProps {
    style?: StyleProp<ViewStyle>
    health: any;
}


type DailyEntry ={
    id: string,
    created_at: string,
    datetime: string
}


export const EntryContext = createContext<any>(-1)


export function WellnessDashboards({ style, health  }: WellnessDashboardsProps) {
    const [entryId, setEntryId] = useState(-1)
    const [dropdownItems, setDropdownItems] = useState<DailyEntry[]>([])

    async function fetchDailyEntries() {
        const response = await supabase
            .from('DailyEntries')
            .select()
        if (response['error']) {
            console.log(JSON.stringify(response['error']))
            return;
        }
        else {
            setDropdownItems(response['data']);
        }
    }
    
    useEffect(() => {
        fetchDailyEntries()
    }, [])

    return (
        <EntryContext.Provider value={{ entryId }}>
            <View style={style}>
                <View>
                    <Text style={{
                        fontFamily: 'timesnewroman',
                        fontWeight: 'bold',
                        fontSize: 20,
                    }}>
                        Daily Summary
                    </Text>
                </View>
                
                <Metrics style={{
                    gap: 20
                }}health={health}
                />
                <KeyStats style={{
                    gap: 20
                }}health={health}
                />
                <Insights style={{
                    gap: 20
                }}/>
            </View>
        </EntryContext.Provider>
    );
}