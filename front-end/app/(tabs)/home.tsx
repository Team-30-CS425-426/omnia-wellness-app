import { WellnessDashboards } from "@/components/home/dashboard";
import Title from "@/components/home/title";
import { supabase } from "@/config/homeSupabaseConfig";
import { createContext, useContext, useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle, StyleSheet, ScrollView } from "react-native";
import { Dropdown } from "react-native-element-dropdown";


export default function HomeScreen() {
    return (
        <ScrollView style={{
            flex: 1,
            paddingHorizontal: '5%',
            paddingTop: '15%',
            backgroundColor: 'white'
        }}>
            <Title style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 20
            }}/>
            <WellnessDashboards style={{
                flex: 9,
                gap: 20,
                marginBottom: '30%'
            }}/>
        </ScrollView>
    );
}

