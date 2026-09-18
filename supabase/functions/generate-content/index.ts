// Edge Function: generate-content
// وسيط آمن لاستدعاء Lovable AI Gateway + التحقق من المستخدم وخصم النقاط.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const DEFAULT_MODEL = Deno.env.get("VITE_AI_MODEL") || "google/gemini-3-flash-preview";

// النموذج المجاني الوحيد المتاح لغير المشتركين
const FREE_MODEL = "google/gemini-2.5-flash-lite";

const ALLOWED_MODELS = new Set([
  "google/gemini-3-flash-preview",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return json({ error: "LOVABLE_API_KEY غير مضبوط في الخادم. أضِفه من Supabase → Edge Functions → Secrets." }, 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // ── 1) التحقق من المستخدم ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return json({ error: "يجب تسجيل الدخول لاستخدام التوليد.", code: "UNAUTHENTICATED" }, 401);
    }

    const body = await req.json().catch(() => null);
    const prompt = body?.prompt;
    const system = body?.system;
    const requestedModel = typeof body?.model === "string" ? body.model : undefined;

    if (!prompt || typeof prompt !== "string") {
      return json({ error: "الحقل prompt مطلوب" }, 400);
    }

    const model = requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;

    // ── 2) قراءة الرصيد والخطة (مع تجديد الباقة إن حان موعدها) ─────────────
    await admin.rpc("renew_credits", { _user_id: user.id });
    const { data: credits } = await admin
      .from("user_credits")
      .select("balance, plan, renews_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = credits?.plan ?? "free";
    const isPro = plan === "pro";

    // ── 3) قفل النماذج ─────────────────────────────────────────────────────
    if (!isPro && model !== FREE_MODEL) {
      return json({
        error: "هذا النموذج متاح لمشتركي Pro فقط — النموذج المجاني هو Gemini 2.5 Flash Lite.",
        code: "MODEL_LOCKED",
        model,
      }, 403);
    }

    // ── 4) خصم نقطة واحدة (نقطة لكل منصة = طلب واحد لكل منصة) ─────────────
    const { data: newBalance, error: consumeErr } = await admin.rpc("consume_credits", {
      _user_id: user.id,
      _amount: 1,
      _model: model,
    });

    if (consumeErr) {
      const noCredits = String(consumeErr.message || "").includes("NO_CREDITS");
      return json({
        error: noCredits
          ? "انتهت نقاطك — اشترك في Pro للحصول على باقة نقاط شهرية."
          : `تعذّر خصم النقاط: ${consumeErr.message}`,
        code: noCredits ? "NO_CREDITS" : "CREDITS_ERROR",
      }, noCredits ? 402 : 500);
    }

    const refund = async (reason: string) => {
      await admin.rpc("refund_credits", { _user_id: user.id, _amount: 1, _reason: reason });
    };

    // ── 5) معاملات التوليد ─────────────────────────────────────────────────
    const num = (v: unknown, fallback: number, min: number, max: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

    const isProModel = model.includes("-pro");
    const isLite = model.includes("-lite");
    const defaults = isProModel
      ? { temperature: 0.9, top_p: 0.97, frequency_penalty: 0.2, presence_penalty: 0.3 }
      : isLite
      ? { temperature: 0.6, top_p: 0.9, frequency_penalty: 0.4, presence_penalty: 0.15 }
      : { temperature: 0.75, top_p: 0.95, frequency_penalty: 0.3, presence_penalty: 0.2 };

    const params = {
      temperature: num(body?.temperature, defaults.temperature, 0, 2),
      top_p: num(body?.top_p, defaults.top_p, 0, 1),
      frequency_penalty: num(body?.frequency_penalty, defaults.frequency_penalty, -2, 2),
      presence_penalty: num(body?.presence_penalty, defaults.presence_penalty, -2, 2),
    };

    const messages: Array<{ role: string; content: string }> = [];
    if (system && typeof system === "string") messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });

    let upstream: Response;
    try {
      upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, ...params }),
      });
    } catch (e) {
      await refund("فشل الاتصال بمزود الذكاء الاصطناعي");
      return json({ error: "تعذّر الاتصال بمزود الذكاء الاصطناعي — أعد المحاولة.", details: String(e) }, 502);
    }

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      let upstreamMsg = "";
      try {
        const parsed = JSON.parse(errText);
        upstreamMsg = parsed?.error?.message || parsed?.message || parsed?.title || "";
      } catch { /* نص خام */ }

      let message: string;
      switch (upstream.status) {
        case 400:
          message = `طلب غير صالح للنموذج ${model}${upstreamMsg ? ` — ${upstreamMsg}` : ""}`;
          break;
        case 401:
          message = "مفتاح الذكاء الاصطناعي غير صالح أو منتهي — يجب تحديثه في أسرار الخادم.";
          break;
        case 402:
          message = "انتهى رصيد الذكاء الاصطناعي — أضِف رصيداً للمساحة ثم أعد المحاولة.";
          break;
        case 403:
          message = "الوصول إلى الذكاء الاصطناعي محظور بسياسة المساحة (تعطيل أو حد رصيد).";
          break;
        case 429:
          message = "تم تجاوز حد الطلبات — انتظر قليلاً ثم أعد المحاولة.";
          break;
        default:
          message = upstream.status >= 500
            ? `عطل مؤقت في مزود الذكاء الاصطناعي (${upstream.status}) — أعد المحاولة بعد لحظات.`
            : `فشل الاتصال بـ AI (${upstream.status})${upstreamMsg ? ` — ${upstreamMsg}` : ""}`;
      }
      await refund("فشل التوليد");
      return json({ error: message, details: upstreamMsg || errText, model, params }, upstream.status);
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!text) {
      await refund("رد فارغ من النموذج");
      return json({ error: `لم يُرجِع النموذج ${model} أي نص — جرّب نموذجاً آخر.`, model }, 502);
    }

    return json({ text, model, balance: newBalance, plan });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "خطأ غير معروف" }, 500);
  }
});
