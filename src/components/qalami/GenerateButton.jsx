import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";

export default function GenerateButton({ onClick, isLoading, disabled }) {
  const { t } = useI18n();
  return (
    <motion.button onClick={onClick} disabled={disabled || isLoading} whileTap={!disabled ? { scale: 0.97 } : {}}
      className="relative w-full h-[64px] rounded-2xl font-black text-lg text-white overflow-hidden"
      style={{ opacity: disabled ? 0.35 : 1 }}>
      <div className="absolute inset-0 btn-generate-bg" style={{ filter: disabled ? "grayscale(1)" : "none" }} />
      {!disabled && !isLoading && <div className="absolute inset-0 rounded-2xl btn-generate" style={{ pointerEvents: "none" }} />}
      {!disabled && <div className="absolute inset-0 shimmer" />}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {isLoading ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin-slow" /><span className="font-bold text-base">{t("generating")}</span></>
        ) : (
          <><Sparkles className="w-5 h-5" /><span>{t("generate")}</span></>
        )}
      </div>
    </motion.button>
  );
}
