import { supabase } from "@/config/supabaseConfig"
import { createContext, useEffect, useState } from "react"
import { StyleProp, View, ViewStyle, Text } from "react-native"
import { DateDropDown } from "./dropdown"
import { Metrics } from "./metrics"
import { KeyStats } from "./keystats"
import { Link, router} from 'expo-router';
import ThemedButton from "@/app/components/ThemedButton"
import ThemedText from "@/app/components/ThemedText"
import {Colors} from '../../../constants/Colors'

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
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: Colors.default.darkBlue,
                    fontFamily: 'timesnewroman',
                    fontWeight: 'bold',
                    fontSize: 20,
                    flex: 1
                }}>
                    Daily Summary
                </Text>
                
                <View style={{
                    width:2,
                    height: 30,
                    backgroundColor: Colors.default.darkBlue,
                    marginHorizontal: 10
                }} />
                
                <View style={{
                    flex: 1,
                    alignItems: 'center'
                }}>
                    <Link href={"/insights"}>
                        <ThemedText 
                            style={{
                                color: Colors.default.berryPurple, 
                                fontWeight: '600',
                                fontSize: 20
                            }}> 
                            Insights 
                        </ThemedText>
                    </Link>
                </View>
            </View>

            <Metrics style={{
                gap: 20
            }} health={health}
            />
            <KeyStats style={{
                gap: 20
            }} health={health}
            />
        </View>
    </EntryContext.Provider>
    );
}