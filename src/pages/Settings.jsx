import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, LogOut } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import BottomNav from "../components/qalami/BottomNav";
import { isAdmin } from "../lib/creditsService";
import { toast } from "sonner";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

const items = [
  { id: "reminders", icon: "🔔", key: "set_reminders", type: "toggle" },
  { id: "language",  icon: "🌐", key: "set_language",  type: "language" },
  { id: "d1", type: "divider" },
  { id: "share",   icon: "📤", key: "set_share",   type: "link" },
  { id: "contact", icon: "📧", key: "set_contact", type: "link" },
  { id: "privacy", icon: "📄", key: "set_privacy", type: "link" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang, setLang, dir } = useI18n();
  const [toggles, setToggles] = useState({ reminders: true });
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    isAdmin().then(setAdmin);
  }, []);

  const handleShare = async () => {
    const isNative = Capacitor.isNativePlatform();
    const shareUrl = isNative || window.location.origin.includes("localhost")
      ? "https://play.google.com/store/apps/details?id=com.qalami.app"
      : window.location.origin;

    const shareData = {
      title: lang === "ar" ? "تطبيق قلمي AI" : "Qalami AI App",
      text: lang === "ar"
        ? "جرّب تطبيق قلمي لصناعة المحتوى بالذكاء الاصطناعي ✨"
        : "Try Qalami AI for smart content generation ✨",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(lang === "ar" ? "تم نسخ رابط التطبيق إلى الحافظة بنجاح! 📋" : "App link copied to clipboard! 📋");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success(lang === "ar" ? "تم نسخ رابط التطبيق إلى الحافظة بنجاح! 📋" : "App link copied to clipboard! 📋");
      }
    } catch {
      toast.error(lang === "ar" ? "تعذّر نسخ الرابط" : "Failed to copy link");
    }
  };

  const handleClick = (id) => {
    if (id === "share") handleShare();
    if (id === "contact") window.location.href = "mailto:abdalohap6000@gmail.com?subject=Qalami AI";
    if (id === "privacy") window.open("https://sites.google.com/view/qalamil", "_blank", "noopener,noreferrer");
  };

  const changeLang = (next) => {
    if (next === lang) return;
    setLang(next);
    // نعرض الرسالة بلغة الهدف
    toast.success(next === "ar" ? "تم تغيير اللغة إلى العربية" : "Language switched to English");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("signed_out"));
    navigate("/auth", { replace: true });
  };

  const Chevron = <ChevronLeft className={`w-4 h-4 text-white/20 ${dir === "ltr" ? "rotate-180" : ""}`} />;

  return (
    <div className="min-h-screen font-cairo pb-28" style={{ background: "#020203" }} dir={dir}>
      <div className="glass-header sticky top-0 z-40">
        <div className="px-5 py-4 max-w-lg mx-auto">
          <h1 className="text-xl font-black gradient-text-white">{t("settings_title")}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-5 space-y-1 relative z-10">
        {user && (
          <div className="px-4 py-4 rounded-2xl mb-3"
               style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                     style={{ background: "linear-gradient(135deg, rgba(124,77,255,0.3), rgba(59,130,246,0.2))" }}>
                  👤
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">{t("signed_in_as")}</p>
                  <p className="text-sm font-semibold text-white/85 truncate" dir="ltr">{user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                <LogOut className="w-3.5 h-3.5" /> {t("sign_out")}
              </button>
            </div>
          </div>
        )}

        {admin && (
          <div onClick={() => navigate("/admin")}
            className="flex items-center justify-between px-4 py-4 rounded-2xl mb-3 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <span className="text-base">🛠️</span>
              <span className="text-sm font-semibold text-white/75">{t("admin_panel")}</span>
            </div>
            {Chevron}
          </div>
        )}

        {items.map((item, i) => {
          if (item.type === "divider") return <div key={item.id} className="my-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => handleClick(item.id)}
              className="flex items-center justify-between px-4 py-4 rounded-2xl mb-1.5 cursor-pointer hover:bg-white/[0.03]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-semibold text-white/75">{t(item.key)}</span>
              </div>
              {item.type === "toggle" && (
                <button onClick={(e) => { e.stopPropagation(); setToggles(p => ({ ...p, [item.id]: !p[item.id] })); }}
                  className="w-10 h-6 rounded-full transition-colors relative"
                  style={{ background: toggles[item.id] ? "#7C4DFF" : "rgba(255,255,255,0.1)" }}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: toggles[item.id] ? "22px" : "2px" }} />
                </button>
              )}
              {item.type === "language" && (
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} onClick={(e) => e.stopPropagation()}>
                  {[{ id: "ar", label: t("lang_arabic") }, { id: "en", label: t("lang_english") }].map((opt) => (
                    <button key={opt.id} onClick={() => changeLang(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${lang === opt.id ? "text-white" : "text-white/40"}`}
                      style={lang === opt.id ? { background: "rgba(124,77,255,0.35)" } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {item.type === "link" && Chevron}
            </motion.div>
          );
        })}
        <div className="text-center pt-10 pb-4">
          <p className="text-[11px] text-white/15">{t("version")}</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
