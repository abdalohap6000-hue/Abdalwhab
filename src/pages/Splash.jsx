import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import appIcon from "@/assets/app-icon.png.asset.json";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // 2.5% كل 55ms = 100% عند 2200ms تماماً — يكتمل الشريط مع لحظة الانتقال
      setProgress((p) => (p >= 100 ? 100 : p + 2.5));
    }, 55);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(user ? "/home" : "/auth", { replace: true });
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center font-cairo" style={{ background: "#020203" }}>
      {/* أسود بحواف بنفسجية متوهجة — نفس أسلوب شاشة الإقلاع في index.html للانتقال السلس */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(2,2,3,0) 52%, rgba(124,77,255,0.14) 78%, rgba(124,77,255,0.30) 100%)",
          boxShadow: "inset 0 0 80px rgba(124,77,255,0.25)",
          border: "1px solid rgba(124,77,255,0.20)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* نبدأ من 0.9 بدلاً من 0 — يمنع ظاهرة اختفاء الأيقونة وإعادة ظهورها بعد شاشة الإقلاع */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-[28px] overflow-hidden"
          style={{ border: "1px solid rgba(124,77,255,0.3)", boxShadow: "0 0 40px rgba(124,77,255,0.3)" }}>
          <img src={appIcon.url} alt="Qalami AI" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center space-y-1">
          <h1 className="text-4xl font-black gradient-text-white">{t("app_name")}</h1>
          <p className="text-sm text-white/30 font-light">{t("app_tagline")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-40">
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #7C4DFF, #C084FC)", width: `${progress}%`, transition: "width 0.1s linear" }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
