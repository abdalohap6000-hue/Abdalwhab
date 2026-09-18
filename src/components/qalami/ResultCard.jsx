import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const platformConfig = {
  instagram: { color: "#E4405F", glow: "rgba(228,64,95,0.3)", bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  tiktok: { color: "#00EAFF", glow: "rgba(0,234,255,0.3)", bg: "#010101",
    icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.75a4.86 4.86 0 0 1-1.02-.06z"/></svg> },
  twitter: { color: "#E7E9EA", glow: "rgba(200,200,210,0.3)", bg: "#000000",
    icon: <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
};

export default function ResultCard({ platform, content, index, onRegenerate }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [isRegen, setIsRegen] = useState(false);
  const config = platformConfig[platform] || { color: "#7C4DFF", glow: "rgba(124,77,255,0.3)", bg: "#111", icon: "📝" };
  const label = t(`platform_${platform}`) === `platform_${platform}` ? platform : t(`platform_${platform}`);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true); toast.success(t("copied_toast"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ text: content });
    else handleCopy();
  };

  const handleRegen = async () => { setIsRegen(true); await onRegenerate(); setIsRegen(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${config.color}30`, boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${config.color}15` }}>
      <div className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: `linear-gradient(135deg, ${config.color}18, transparent)`, borderBottom: `1px solid ${config.color}20` }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: config.bg, border: `1px solid ${config.color}40` }}>
          {config.icon}
        </div>
        <span className="text-sm font-bold" style={{ color: config.color }}>{label}</span>
        <div className="flex-1" />
        <button onClick={handleRegen} disabled={isRegen} className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${isRegen ? "spin-slow" : ""}`} />
        </button>
      </div>
      <div className="px-4 py-4">
        <p className="text-sm text-white/80 leading-[1.85] whitespace-pre-wrap" dir="auto">{content}</p>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleCopy}
          className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
          style={{ background: copied ? `${config.color}20` : "rgba(255,255,255,0.04)",
            border: `1px solid ${copied ? config.color : "rgba(255,255,255,0.08)"}`,
            color: copied ? config.color : "rgba(255,255,255,0.5)" }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t("copied") : t("copy")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleShare}
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Share2 className="w-3.5 h-3.5 text-white/40" />
        </motion.button>
      </div>
    </motion.div>
  );
}