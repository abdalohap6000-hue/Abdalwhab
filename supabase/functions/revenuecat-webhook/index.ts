// Edge Function: revenuecat-webhook
// مزامنة اشتراكات RevenueCat مع نظام النقاط.
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("RC_WEBHOOK_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return json({ error: "غير مصرّح" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => null);
    const event = body?.event;
    if (!event?.type) return json({ error: "حدث غير صالح" }, 400);

    const eventKey = event.id ? String(event.id) : `${event.type}:${event.transaction_id}`;

    const { error: insertError } = await admin
      .from("revenuecat_webhook_events")
      .insert({
        event_key: eventKey,
        event_type: String(event.type),
        app_user_id: event.app_user_id ? String(event.app_user_id) : null,
        raw: body,
      });

    if (insertError) {
      if (insertError.code === "23505") return json({ ok: true, duplicate: true });
      return json({ error: insertError.message }, 500);
    }

    const appUserId = String(event.app_user_id || "");
    if (!UUID_RE.test(appUserId)) {
      return json({ ok: true, skipped: "not_a_user_uuid" });
    }

    const productId = String(event.product_id || "");
    const months = productId === "qalami_premium_monthly" ? 1
      : productId === "qalami_premium_yearly" ? 12
      : null;

    const type = String(event.type);

    if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"].includes(type)) {
      if (months === null) return json({ ok: true, skipped: "unknown_product" });
      const { error } = await admin.rpc("grant_subscription", {
        _user_id: appUserId,
        _plan: "pro",
        _credits: 500,
        _months: months,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, granted: "pro", months });
    }

    if (type === "EXPIRATION") {
      const { error } = await admin.rpc("grant_subscription", {
        _user_id: appUserId,
        _plan: "free",
        _credits: 0,
        _months: 1,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, granted: "free" });
    }

    if (type === "CANCELLATION") {
      // إلغاء التجديد التلقائي: يبقى الاشتراك فعالاً حتى نهاية الفترة المدفوعة
      // (لا نغيّر الخطة)، لكن نصفّر renews_at حتى لا تمدّد دالة renew_credits
      // الاشتراك شهراً جديداً مجاناً إذا تأخر أو فشل حدث EXPIRATION.
      // عند وصول EXPIRATION لاحقاً تتحول الخطة إلى "free" كالمعتاد.
      const { error } = await admin
        .from("user_credits")
        .update({ renews_at: null })
        .eq("user_id", appUserId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, revoked_renewal: true });
    }

    return json({ ok: true, ignored: type });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "خطأ غير معروف" }, 500);
  }
});
