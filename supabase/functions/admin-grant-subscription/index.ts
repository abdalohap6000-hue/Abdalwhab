// Edge Function: admin-grant-subscription
// تفعيل/إلغاء اشتراك Pro يدويًا — للأدمن فقط.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: userData } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (!caller) return json({ error: "غير مصرّح — سجّل الدخول." }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "هذه العملية للأدمن فقط." }, 403);

    const body = await req.json().catch(() => null);
    const action = body?.action;

    // بحث عن مستخدم بالبريد
    if (action === "lookup") {
      const email = String(body?.email || "").trim().toLowerCase();
      if (!email) return json({ error: "البريد مطلوب" }, 400);

      const { data: profile } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", email)
        .maybeSingle();

      if (!profile) return json({ error: "لا يوجد مستخدم بهذا البريد" }, 404);

      const { data: credits } = await admin
        .from("user_credits")
        .select("balance, plan, monthly_grant, renews_at")
        .eq("user_id", profile.id)
        .maybeSingle();

      return json({ user: profile, credits: credits ?? null });
    }

    // تفعيل / إلغاء
    if (action === "grant") {
      const userId = String(body?.user_id || "");
      const plan = body?.plan === "pro" ? "pro" : "free";
      const credits = Number.isFinite(body?.credits) ? Math.max(0, Math.min(100000, Number(body.credits))) : 500;
      const months = Number.isFinite(body?.months) ? Math.max(1, Math.min(24, Number(body.months))) : 1;
      if (!userId) return json({ error: "user_id مطلوب" }, 400);

      const { data, error } = await admin.rpc("grant_subscription", {
        _user_id: userId,
        _plan: plan,
        _credits: credits,
        _months: months,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, credits: data });
    }

    return json({ error: "action غير معروف" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "خطأ غير معروف" }, 500);
  }
});
