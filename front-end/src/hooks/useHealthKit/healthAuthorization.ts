import { Platform, Linking } from "react-native";
import { requestAuthorization } from "@kingstinct/react-native-healthkit";

export const isHealthKitAvailable = Platform.OS === "ios";

export async function authorizeHealthKit() {
  if (!isHealthKitAvailable) {
    throw new Error("HealthKit only works on iOS.");
  }

  const ok = await requestAuthorization({
    toRead: [
      "HKQuantityTypeIdentifierStepCount",
      "HKCategoryTypeIdentifierSleepAnalysis",
      "HKQuantityTypeIdentifierActiveEnergyBurned",
    ],
    toWrite: [],
  } as any);

  if (!ok) {
    throw new Error("Health permissions not granted");
  }

  return true;
}

export async function openAppSettings() {
  await Linking.openSettings();
}