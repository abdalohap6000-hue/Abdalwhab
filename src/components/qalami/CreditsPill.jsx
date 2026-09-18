import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Crown } from "lucide-react";
import { useI18n } from "@/i18n";

export default function CreditsPill({ credits, loading }) {
  const navigate = useNavigate();
  const { t, fmt } = useI18n();
  const balance = credits?.balance ?? 0;
  const isPro = credits?.plan === "pro";
  const isLow = balance <= 1;

  const color = isPro ? "#FFD700" : isLow ? "#FB923C" : "rgba(255,255,255,0.45)";
  const bg = isPro
    ? "rgba(255,215,0,0.07)"
    : isLow
    ? "rgba(251,146,60,0.07)"
    : "rgba(255,255,255,0.025)";
  const border = isPro
    ? "rgba(255,215,0,0.28)"
    : isLow
    ? "rgba(251,146,60,0.3)"
    : "rgba(255,255,255,0.07)";

  const label = loading
    ? t("credits_loading")
    : balance === 0
    ? t("credits_empty")
    : isPro
    ? t("credits_pro", { n: fmt(balance) })
    : t("credits_free", { n: fmt(balance) });

  return (
    <motion.button
      onClick={() => navigate("/premium")}
      whileTap={{ scale: 0.97 }}
      className="w-full py-3 rounded-2xl flex items-center justify-center gap-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {isPro ? <Crown className="w-3.5 h-3.5" style={{ color }} /> : <Zap className="w-3.5 h-3.5" style={{ color }} />}
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </motion.button>
  );
}
