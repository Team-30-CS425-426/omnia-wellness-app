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

  // ADDED: debug log
  console.log("✅ badge lookup:", badgeKey, badge);

  if (!badge) return null;

  const alreadyEarned = await hasUserEarnedBadge(userId, badge.id);

  // ADDED: debug log
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
    // ADDED: debug log
    console.error("❌ awardBadge insert error:", error);
    throw error;
  }

  // ADDED: debug log
  console.log("✅ badge inserted:", data);

  return data as UserBadgeRow;
}