import { WellnessDashboards } from "../components/home/dashboard";
import Title from "../components/home/title";
import { useEffect } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import useSleepDisplayed from "@/src/hooks/useHealthKit/sleepDisplayed";
import useActiveEnergyDisplayed from "@/src/hooks/useHealthKit/activeEnergyDisplayed";
import { exportDataToCsv } from "@/src/hooks/useHealthKit/exportData";

export default function HomeScreen() {
  const stepsHealth = useStepsDisplayed();
  const sleepHealth = useSleepDisplayed();
  const activeEnergyHealth = useActiveEnergyDisplayed();

  useEffect(() => {
    if (!stepsHealth.isAuthorized && !stepsHealth.loading) {
      stepsHealth.connectAndImport();
    }

    if (!sleepHealth.isAuthorized && !sleepHealth.loading) {
      sleepHealth.connectAndImport();
    }

    if (!activeEnergyHealth.isAuthorized && !activeEnergyHealth.loading) {
      activeEnergyHealth.connectAndImport();
    }
  }, [
    stepsHealth.isAuthorized,
    stepsHealth.loading,
    sleepHealth.isAuthorized,
    sleepHealth.loading,
    activeEnergyHealth.isAuthorized,
    activeEnergyHealth.loading,
  ]);

  const handleExport = async () => {
    if (!stepsHealth.isAuthorized || !sleepHealth.isAuthorized) {
      Alert.alert("Connect Apple Health first", "Then try exporting again.");
      return;
    }

    try {
      await exportDataToCsv(stepsHealth.stepsRange, sleepHealth.sleepRange);
      Alert.alert("Export started", "Generating CSV for last 30 days...");
    } catch {
      Alert.alert("Export failed", "Please try again.");
    }
  };

  const health = {
    isAuthorized:
      stepsHealth.isAuthorized ||
      sleepHealth.isAuthorized ||
      activeEnergyHealth.isAuthorized,

    loading:
      stepsHealth.loading ||
      sleepHealth.loading ||
      activeEnergyHealth.loading,

    error:
      stepsHealth.error ||
      sleepHealth.error ||
      activeEnergyHealth.error,

    stepsToday: stepsHealth.stepsToday,
    sleepToday: sleepHealth.sleepToday,
    activeEnergyToday: activeEnergyHealth.activeEnergyToday,

    stepsRange: stepsHealth.stepsRange,
    sleepRange: sleepHealth.sleepRange,
    activeEnergyRange: activeEnergyHealth.activeEnergyRange,

    stepsDayBins: stepsHealth.stepsDayBins,
    sleepDayBins: sleepHealth.sleepDayBins,
    sleepDaySpan: sleepHealth.sleepDaySpan,

    rangeDays: stepsHealth.rangeDays,
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

      <Pressable
        onPress={handleExport}
        hitSlop={10}
        style={{
          padding: 8,
          position: "absolute",
          top: 20,
          right: "0%",
          zIndex: 10,
        }}
      >
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