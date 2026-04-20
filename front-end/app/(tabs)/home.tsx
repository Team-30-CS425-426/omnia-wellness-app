import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { WellnessDashboards } from "../components/home/dashboard";
import Title from "../components/home/title";

import { supabase } from "@/config/supabaseConfig";
import useActiveEnergyDisplayed from "@/src/hooks/useHealthKit/activeEnergyDisplayed";
import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import { getYesterdaySleepHours } from "@/src/services/sleepLogService";
import { exportWellnessCsv } from '@/src/services/wellnessCSVExport';

import { router } from "expo-router";

import {
  AuthorizationRequestStatus,
  useHealthkitAuthorization,
} from "@kingstinct/react-native-healthkit";

export default function HomeScreen() {
  const [sleepToday, setSleepToday] = useState(0);
  const [sleepLoading, setSleepLoading] = useState(false);
  const [sleepError, setSleepError] = useState<string | null>(null);

  const didWarmSteps30 = useRef(false);
  const didWarmActive30 = useRef(false);

  const stepsHealth = useStepsDisplayed(true);
  const activeEnergyHealth = useActiveEnergyDisplayed(true);

  const [authorizationStatus] = useHealthkitAuthorization({
    toRead: [
      "HKQuantityTypeIdentifierStepCount",
      "HKCategoryTypeIdentifierSleepAnalysis",
      "HKQuantityTypeIdentifierActiveEnergyBurned",
    ],
    toWrite: [],
  });

  useEffect(() => {
    let cancelled = false;
  
    async function warmCaches() {
      try {
        // Only warm Steps cache if already authorized
       
        if (
          !cancelled &&
          authorizationStatus === AuthorizationRequestStatus.unnecessary &&
          !stepsHealth.loading &&
          !didWarmSteps30.current
        ) {
          didWarmSteps30.current = true;
          await stepsHealth.loadRange(30);
        }
        // Only warm Active Energy cache if already authorized
        if (
          !cancelled &&
          authorizationStatus === AuthorizationRequestStatus.unnecessary &&
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
    authorizationStatus,
    stepsHealth.loading,
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

  const requireHealthKitAccess = () => {
    const hasHealthPermission =
      authorizationStatus === AuthorizationRequestStatus.unnecessary;
  
    if (!hasHealthPermission) {
      Alert.alert(
        "Apple HealthKit not enabled",
        "Enable Apple HealthKit in Settings to view Steps and Active Energy.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => router.push("/screens/settings"),
          },
        ]
      );
      return false;
    }
  
    return true;
  };

  const handleStepsPress = () => {
    if (!requireHealthKitAccess()) return;
    router.push("/historicalStepData");
  };
  
  const handleActiveEnergyPress = () => {
    if (!requireHealthKitAccess()) return;
    router.push("/screens/activeEnergy");
  };

  const handleExport = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found.');
  
      await exportWellnessCsv(user.id);
    } catch (e: any) {
      Alert.alert(
        'Export failed',
        e?.message || 'Could not export wellness data.'
      );
    }
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
      onStepsPress={handleStepsPress}
      onActiveEnergyPress={handleActiveEnergyPress}
    />
    </ScrollView>
  );
}