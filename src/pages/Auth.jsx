import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import appIcon from "@/assets/app-icon-small.png.asset.json";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, dir } = useI18n();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/home", { replace: true });
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t("auth_need_fields")); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // على الموبايل: رابط العودة عبر deep link — لا يمكن استخدام origin لأنه
            // https://localhost داخل WebView فيفتح صفحة خطأ في متصفح الهاتف
            emailRedirectTo: Capacitor.isNativePlatform()
              ? 'com.qalami.app://auth-callback'
              : `${window.location.origin}/home`,
            data: { full_name: fullName || null },
          },
        });
        if (error) throw error;
        toast.success(t("auth_created"));
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth_welcome_back"));
        navigate("/home", { replace: true });
      }
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        toast.error(t("auth_not_confirmed"));
      } else if (msg.toLowerCase().includes("invalid login")) {
        toast.error(t("auth_invalid"));
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already")) {
        toast.error(t("auth_exists"));
      } else {
        toast.error(msg || t("auth_generic_error"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const isNative = Capacitor.isNativePlatform();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: isNative
          ? 'com.qalami.app://auth-callback'
          : `${window.location.origin}/home`,
        // على الموبايل: نجلب الرابط فقط ثم نفتحه بمتصفح النظام —
        // جوجل ترفض OAuth داخل WebView (disallowed_useragent)
        skipBrowserRedirect: isNative,
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    if (isNative && data?.url) {
      try {
        await Browser.open({ url: data.url });
      } catch {
        toast.error(t("auth_generic_error"));
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen font-cairo flex flex-col items-center justify-center px-5" style={{ background: "#020203" }} dir={dir}>
      <div className="bg-orb w-[400px] h-[400px] top-[-100px] left-1/2 -translate-x-1/2 opacity-[0.08]" style={{ background: "#7C4DFF" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-3xl p-6 space-y-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

        <div className="text-center space-y-1">
          <img src={appIcon.url} alt="Qalami AI" className="w-16 h-16 rounded-2xl mx-auto mb-2" style={{ boxShadow: "0 0 30px rgba(124,77,255,0.3)" }} />
          <h1 className="text-2xl font-black gradient-text-white">{t("app_name")}</h1>
          <p className="text-xs text-white/40">
            {mode === "signin" ? t("auth_signin_sub") : t("auth_signup_sub")}
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <button onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${mode === "signin" ? "text-white" : "text-white/40"}`}
            style={mode === "signin" ? { background: "rgba(124,77,255,0.25)" } : {}}>
            {t("auth_signin")}
          </button>
          <button onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${mode === "signup" ? "text-white" : "text-white/40"}`}
            style={mode === "signup" ? { background: "rgba(124,77,255,0.25)" } : {}}>
            {t("auth_signup")}
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === "signup" && (
            <input type="text" placeholder={t("auth_name_ph")} value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          )}
          <input type="email" placeholder={t("auth_email_ph")} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth_password_ph")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-3 pe-10 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" disabled={busy}
            className="w-full h-12 rounded-2xl text-sm font-bold btn-generate-bg text-white disabled:opacity-50">
            {busy ? "..." : mode === "signin" ? t("auth_enter") : t("auth_create")}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-[10px] text-white/30">{t("or")}</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button onClick={handleGoogle} disabled={busy}
          className="w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t("auth_google")}
        </button>
      </motion.div>
    </div>
  );
}
