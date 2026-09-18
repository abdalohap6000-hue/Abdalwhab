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
      setProgress((p) => (p >= 100 ? 100 : p + 2));
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
      <div className="bg-orb w-[500px] h-[500px] top-[-100px] left-1/2 -translate-x-1/2 opacity-[0.08]" style={{ background: "radial-gradient(circle, #7C4DFF, #3B82F6)" }} />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
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
