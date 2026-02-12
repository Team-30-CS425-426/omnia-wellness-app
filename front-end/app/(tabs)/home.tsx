import { WellnessDashboards } from "../components/home/dashboard";
import Title from "../components/home/title";
//import { supabase } from "@/config/homeSupabaseConfig";
import { useEffect } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useHealthData from "@/src/hooks/useHealthData";

export default function HomeScreen() {
  const health = useHealthData();

  useEffect(() => {
    if (!health.isAuthorized && !health.loading) {
      health.connectAndImport();
    }
  }, [health.isAuthorized, health.loading]);

  const handleExport = () => {
    // Optionally block export until connected
    if (!health.isAuthorized) {
      Alert.alert("Connect Apple Health first", "Then try exporting again.");
      return;
    }

    health.exportToCsv();
    Alert.alert("Export started", "Generating CSV for last 30 days...");
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        paddingHorizontal: "5%",
        paddingTop: "15%",
        backgroundColor: "white",
      }}
    >

      <View
        style={{
          alignItems: "center",
          paddingVertical: 20,
        }}
      >
        <Title
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </View>

      <Pressable onPress={handleExport} hitSlop={10} style={{ padding: 8, position: "absolute", top: 20, right: "0%", zIndex: 10 }}>
        <Ionicons name="download-outline" size={24} color="black" />
      </Pressable>

      <WellnessDashboards
        style={{
          flex: 9,
          gap: 20,
          marginBottom: "30%",
        }}
        health={health}
      />
    </ScrollView>
  );
}
