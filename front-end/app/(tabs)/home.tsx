import { WellnessDashboards } from "../components/home/dashboard";
import Title from "../components/home/title";
import { useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import useActiveEnergyDisplayed from "@/src/hooks/useHealthKit/activeEnergyDisplayed";
import { exportDataToCsv } from "@/src/hooks/useHealthKit/exportData";
import { supabase } from "@/config/supabaseConfig";
import { getYesterdaySleepHours } from "@/src/services/sleepLogService";

export default function HomeScreen() {
  const [sleepToday, setSleepToday] = useState(0);
  const [sleepLoading, setSleepLoading] = useState(false);
  const [sleepError, setSleepError] = useState<string | null>(null);

  const didWarmSteps30 = useRef(false);
  const didWarmActive30 = useRef(false);

  const stepsHealth = useStepsDisplayed(true);
  const activeEnergyHealth = useActiveEnergyDisplayed(true);

  useEffect(() => {
    let cancelled = false;
  
    async function warmCaches() {
      try {
        // First make sure Steps is authorized
        if (!stepsHealth.isAuthorized && !stepsHealth.loading) {
          await stepsHealth.connectAndImport();
          return;
        }
  
        // Then make sure Active Energy is authorized
        if (!activeEnergyHealth.isAuthorized && !activeEnergyHealth.loading) {
          await activeEnergyHealth.connectAndImport();
          return;
        }
  
        // Warm 30-day Steps cache once per app session
        if (
          !cancelled &&
          stepsHealth.isAuthorized &&
          !stepsHealth.loading &&
          !didWarmSteps30.current
        ) {
          didWarmSteps30.current = true;
          await stepsHealth.loadRange(30);
        }
  
        // Warm 30-day Active Energy cache once per app session
        if (
          !cancelled &&
          activeEnergyHealth.isAuthorized &&
          !activeEnergyHealth.loading &&
          !didWarmActive30.current
        ) {
          didWarmActive30.current = true;
          await activeEnergyHealth.loadRange(30);
        }
      } catch (e) {
        console.error("Failed to warm HealthKit caches on home screen:", e);
      }
    }
  
    warmCaches();
  
    return () => {
      cancelled = true;
    };
  }, [
    stepsHealth.isAuthorized,
    stepsHealth.loading,
    activeEnergyHealth.isAuthorized,
    activeEnergyHealth.loading,
  ]);

  useEffect(() => {
    async function loadSleep() {
      try {
        setSleepLoading(true);
        setSleepError(null);
  
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");
  
        const hours = await getYesterdaySleepHours(user.id);
        setSleepToday(hours);
      } catch (e: any) {
        setSleepToday(0);
        setSleepError(e?.message || "Failed to load sleep.");
      } finally {
        setSleepLoading(false);
      }
    }
  
    loadSleep();
  }, []);

  const handleExport = async () => {
    if (!stepsHealth.isAuthorized) {
      Alert.alert("Connect Apple Health first", "Then try exporting again.");
      return;
    }

    //try {
      //await exportDataToCsv(stepsHealth.stepsRange, sleepHealth.sleepRange);
      //Alert.alert("Export started", "Generating CSV for last 30 days...");
    //} catch {
      //Alert.alert("Export failed", "Please try again.");
    //}

    const handleExport = async () => {
      Alert.alert(
        "Sleep export not updated yet",
        "Sleep now comes from manual logs, so this export needs to be updated separately."
      );
    };
  };

  const health = {
    isAuthorized:
      stepsHealth.isAuthorized ||
      activeEnergyHealth.isAuthorized,

    loading:
      stepsHealth.loading ||
      sleepLoading ||
      activeEnergyHealth.loading,

    error:
      stepsHealth.error ||
      sleepError ||
      activeEnergyHealth.error,

    stepsToday: stepsHealth.stepsToday,
    sleepToday,
    activeEnergyToday: activeEnergyHealth.activeEnergyToday,

    stepsRange: stepsHealth.stepsRange,
    activeEnergyRange: activeEnergyHealth.activeEnergyRange,

    stepsDayBins: stepsHealth.stepsDayBins,

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