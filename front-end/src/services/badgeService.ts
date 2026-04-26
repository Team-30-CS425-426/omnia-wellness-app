// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

export type BadgeDefinition = {
  id: string;
  badge_key: string;
  title: string;
  description: string;
  category: string;
  icon: string | null;
  created_at: string;
};

export type UserBadgeRow = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  related_date: string | null;
  related_value: number | null;
  badge_definitions?: BadgeDefinition;
};

export async function getBadgeDefinitionByKey(badgeKey: string) {
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .eq("badge_key", badgeKey)
    .maybeSingle();

  if (error) throw error;
  return data as BadgeDefinition | null;
}

export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select(`
      *,
      badge_definitions (*)
    `)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserBadgeRow[];
}

export async function hasUserEarnedBadge(userId: string, badgeId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function awardBadge(
  userId: string,
  badgeKey: string,
  relatedDate?: string,
  relatedValue?: number
) {
  const badge = await getBadgeDefinitionByKey(badgeKey);

  console.log("✅ badge lookup:", badgeKey, badge);

  if (!badge) return null;

  const alreadyEarned = await hasUserEarnedBadge(userId, badge.id);

  console.log("✅ already earned:", alreadyEarned);

  if (alreadyEarned) return null;

  const { data, error } = await supabase
    .from("user_badges")
    .insert({
      user_id: userId,
      badge_id: badge.id,
      related_date: relatedDate ?? null,
      related_value: relatedValue ?? null,
    })
    .select(`
      *,
      badge_definitions (*)
    `)
    .single();

  if (error) {
    console.error("❌ awardBadge insert error:", error);
    throw error;
  }

  console.log("✅ badge inserted:", data);

  return data as UserBadgeRow;
}

/* =========================================================
   NEW: Fetch ALL badge definitions (for locked badges)
   ========================================================= */

export async function getAllBadgeDefinitions() {
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .order("category", { ascending: true });

  if (error) throw error;

  return (data ?? []) as BadgeDefinition[];
}

/* =========================================================
  NEW: Combine earned + locked badges
   ========================================================= */

export type FullBadge = {
  definition: BadgeDefinition;
  earned: boolean;
  earned_at?: string;
};

export async function getAllBadgesWithStatus(userId: string): Promise<FullBadge[]> {
  const [definitions, userBadges] = await Promise.all([
    getAllBadgeDefinitions(),
    getUserBadges(userId),
  ]);

  const badges = definitions.map((def) => {
    const earned = userBadges.find((b) => b.badge_id === def.id);

    return {
      definition: def,
      earned: !!earned,
      earned_at: earned?.earned_at,
    };
  });

  // ADDED: category display order for Profile badges
  const categoryOrder = ["mood", "nutrition", "workout", "sleep", "steps"];

  // ADDED: progression order based on badge key
  const getProgressionRank = (badgeKey: string) => {
    if (badgeKey.includes("goal_first")) return 1;
    if (badgeKey.includes("streak_2")) return 2;
    if (badgeKey.includes("streak_3")) return 3;
    if (badgeKey.includes("streak_7")) return 7;
    if (badgeKey.includes("streak_14")) return 14;
    if (badgeKey.includes("streak_30")) return 30;
    return 999;
  };

  // ADDED: sort by category → earned first within category → progression
  badges.sort((a, b) => {
    const categoryA = categoryOrder.indexOf(a.definition.category);
    const categoryB = categoryOrder.indexOf(b.definition.category);

    const safeCategoryA = categoryA === -1 ? 999 : categoryA;
    const safeCategoryB = categoryB === -1 ? 999 : categoryB;

    if (safeCategoryA !== safeCategoryB) {
      return safeCategoryA - safeCategoryB;
    }

    if (a.earned !== b.earned) {
      return a.earned ? -1 : 1;
    }

    return (
      getProgressionRank(a.definition.badge_key) -
      getProgressionRank(b.definition.badge_key)
    );
  });

  return badges;
}