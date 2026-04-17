import ThemedText from "@/app/components/ThemedText"
import { Link } from 'expo-router'
import { createContext, useState } from "react"
import { StyleProp, Text, View, ViewStyle } from "react-native"
import { Colors } from '../../../constants/Colors'
import { Habits } from "./habits"
import { KeyStats } from "./keystats"
import { Metrics } from "./metrics"


interface WellnessDashboardsProps {
    style?: StyleProp<ViewStyle>;
    health: any;
    onStepsPress?: () => void;
    onActiveEnergyPress?: () => void;
}


type DailyEntry ={
    id: string,
    created_at: string,
    datetime: string
}

export const EntryContext = createContext<any>(-1)


export function WellnessDashboards({
    style,
    health,
    onStepsPress,
    onActiveEnergyPress,
}: WellnessDashboardsProps) {

    const [entryId, setEntryId] = useState(-1)
    const [dropdownItems, setDropdownItems] = useState<DailyEntry[]>([])

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

            <Metrics
            style={{
                gap: 20,
            }}
            health={health}
            onStepsPress={onStepsPress}
            />
            <KeyStats style={{
                gap: 20
            }}
            health={health}
            onActiveEnergyPress={onActiveEnergyPress}
            />
            <Habits style={{
                gap: 20
            }}
            
            />
          
        </View>
    </EntryContext.Provider>
    );
}