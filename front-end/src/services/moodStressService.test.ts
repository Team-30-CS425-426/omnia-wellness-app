// code written by Alexis Mae Asuncion

// front-end/src/services/moodStressService.test.ts

// Mock supabaseConfig BEFORE importing the service under test
// This prevents Jest from loading AsyncStorage in supabaseConfig.ts
jest.mock("../../config/supabaseConfig", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { insertStressLog } from "./moodStressService";

test("insertStressLog rejects invalid stress level", async () => {
  const result = await insertStressLog("test-user", {
    moodLabel: "Good",
    stressLevel: 11,
  });

  expect(result.success).toBe(false);
  expect(result.error).toBe("Stress level must be between 1 and 10.");
});