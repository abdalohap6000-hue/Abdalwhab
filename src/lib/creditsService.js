// خدمة النقاط والاشتراك — تقرأ من جدول user_credits (القراءة فقط؛ الخصم على الخادم).
import { supabase } from "@/integrations/supabase/client";

export const FREE_MODEL = "google/gemini-2.5-flash-lite";
export const SIGNUP_CREDITS = 5;
export const PRO_MONTHLY_CREDITS = 500;

export const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

export function isModelLocked(modelId, plan) {
  if (plan === "pro") return false;
  return modelId !== FREE_MODEL;
}

export async function fetchCredits() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_credits")
    .select("balance, plan, monthly_grant, renews_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("fetchCredits error:", error);
    return null;
  }
  return data ?? { balance: 0, plan: "free", monthly_grant: 0, renews_at: null };
}

export async function isAdmin() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
