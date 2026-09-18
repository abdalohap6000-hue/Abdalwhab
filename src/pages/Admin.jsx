import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, PRO_MONTHLY_CREDITS } from "../lib/creditsService";
import { useI18n } from "@/i18n";

async function callAdmin(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-grant-subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
  return json;
}

export default function Admin() {
  const navigate = useNavigate();
  const { t, fmt, lang, dir } = useI18n();
  const [allowed, setAllowed] = useState(null);
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null);
  const [creditsInput, setCreditsInput] = useState(PRO_MONTHLY_CREDITS);
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => { isAdmin().then(setAllowed); }, []);

  if (allowed === null) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#020203" }}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin" />
    </div>;
  }

  if (!allowed) {
    return <div className="min-h-screen flex items-center justify-center font-cairo text-white/50 text-sm" style={{ background: "#020203" }} dir={dir}>
      {t("admin_only")}
    </div>;
  }

  const lookup = async () => {
    setBusy(true);
    try {
      const res = await callAdmin({ action: "lookup", email });
      setFound(res);
    } catch (e) { toast.error(e.message); setFound(null); }
    setBusy(false);
  };

  const grant = async (plan) => {
    if (!found?.user?.id) return;
    setBusy(true);
    try {
      await callAdmin({ action: "grant", user_id: found.user.id, plan, credits: Number(creditsInput), months: Number(months) });
      toast.success(plan === "pro" ? t("admin_granted") : t("admin_revoked"));
      await lookup();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const box = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="min-h-screen font-cairo pb-20" style={{ background: "#020203" }} dir={dir}>
      <div className="glass-header sticky top-0 z-40">
        <div className="flex items-center gap-3 px-5 py-3.5 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)}><ChevronLeft className={`w-5 h-5 text-white/50 ${dir === "rtl" ? "rotate-180" : ""}`} /></button>
          <span className="text-base font-black text-white/85">{t("admin_panel")}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6 space-y-4">
        <div className="rounded-2xl p-4 space-y-3" style={box}>
          <label className="text-xs font-bold text-white/40">{t("admin_user_email")}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" placeholder="user@example.com"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white/85 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <button onClick={lookup} disabled={busy || !email}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "rgba(124,77,255,0.25)", border: "1px solid rgba(124,77,255,0.4)" }}>
            {t("search")}
          </button>
        </div>

        {found && (
          <div className="rounded-2xl p-4 space-y-3" style={box}>
            <p className="text-sm font-bold text-white/80">{found.user.full_name || found.user.email}</p>
            <p className="text-xs text-white/40" dir="ltr">{found.user.email}</p>
            <p className="text-xs text-white/50">
              {t("admin_plan")}: <b className="text-white/80">{found.credits?.plan === "pro" ? "Pro" : t("plan_free")}</b> ·
              {" "}{t("admin_balance")}: <b className="text-white/80">{fmt(found.credits?.balance ?? 0)}</b>
              {found.credits?.renews_at && <> · {t("admin_renews")}: {new Date(found.credits.renews_at).toLocaleDateString(lang)}</>}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-white/35">{t("admin_credits_count")}</label>
                <input type="number" value={creditsInput} onChange={(e) => setCreditsInput(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white/85 outline-none mt-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div>
                <label className="text-[11px] text-white/35">{t("admin_months")}</label>
                <input type="number" value={months} onChange={(e) => setMonths(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white/85 outline-none mt-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => grant("pro")} disabled={busy}
                className="py-2.5 rounded-xl text-sm font-black text-black disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #FFD700, #FF6B35)" }}>
                {t("admin_grant_pro")}
              </button>
              <button onClick={() => grant("free")} disabled={busy}
                className="py-2.5 rounded-xl text-sm font-bold text-white/70 disabled:opacity-40"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {t("admin_revoke")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
