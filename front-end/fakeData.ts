// seedNutrition.js
// Run once with: node seedNutrition.js
//
// Requirements:
//   npm install @supabase/supabase-js
//
// Fill in your SUPABASE_URL, SUPABASE_SERVICE_KEY, and USER_ID below.

const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbHR2aXNiYmxnaXVkZ2VjZ3N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ1OTIzNSwiZXhwIjoyMDgwMDM1MjM1fQ.DsKXEaGAeqx3K8STns6ao0uUz9puGpIaJ6AI2rmzjSI'
const SUPABASE_URL = 'https://omltvisbblgiudgecgsv.supabase.co'
import { createClient } from "@supabase/supabase-js";


// ─── Config ────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Targets ────────────────────────────────────────────────────────────────
const TARGET = { calories: 2600, protein: 180, carbs: 300, fat: 70 };

const MEALS = [
  { mealName: "Breakfast", nutritionEventType: 1, time: "07:30:00", split: 0.25 },
  { mealName: "Lunch",     nutritionEventType: 1, time: "12:30:00", split: 0.35 },
  { mealName: "Dinner",    nutritionEventType: 1, time: "18:30:00", split: 0.30 },
  { mealName: "Snack",     nutritionEventType: 2, time: "15:00:00", split: 0.10 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const fluctuate = (value: number, pct: number) => Math.round(value * rand(1 - pct, 1 + pct));

function getDateDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

// ─── Generate rows ───────────────────────────────────────────────────────────
function generateRows() {
  const rows = [];

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = getDateDaysAgo(daysAgo);

    // Daily-level fluctuation (±10% calories, ±15% macros)
    const dailyCalories = fluctuate(TARGET.calories, 0.10);
    const dailyProtein  = fluctuate(TARGET.protein,  0.15);
    const dailyCarbs    = fluctuate(TARGET.carbs,    0.15);
    const dailyFat      = fluctuate(TARGET.fat,      0.15);

    for (const meal of MEALS) {
      const noise = rand(0.92, 1.08); // small per-meal variation on top
      rows.push({
        date,
        time:                meal.time,
        calories:            Math.round(dailyCalories * meal.split * noise),
        protein:             Math.round(dailyProtein  * meal.split * noise),
        carbs:               Math.round(dailyCarbs    * meal.split * noise),
        fat:                 Math.round(dailyFat      * meal.split * noise),
        nutritionEventType:  meal.nutritionEventType,
        userID:              '088d9af5-2e5d-4f36-a3a3-863bfa8a0c54',
        mealName:            meal.mealName,
      });
    }
  }

  return rows;
}

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  const rows = generateRows();
  console.log(`Inserting ${rows.length} rows…`);

  const { error } = await supabase
    .from("NutritionLog")
    .insert(rows);

  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Done! Inserted ${rows.length} rows across 30 days.`);
}

seed();