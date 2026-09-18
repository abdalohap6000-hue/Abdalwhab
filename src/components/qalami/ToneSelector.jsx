import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

const tones = [
  { id: "exciting",     color: "#FF6B35", glow: "rgba(255,107,53,0.5)" },
  { id: "funny",        color: "#FACC15", glow: "rgba(250,204,21,0.5)" },
  { id: "professional", color: "#60A5FA", glow: "rgba(96,165,250,0.5)" },
  { id: "educational",  color: "#34D399", glow: "rgba(52,211,153,0.5)" },
  { id: "promotional",  color: "#C084FC", glow: "rgba(192,132,252,0.5)" },
  { id: "emotional",    color: "#F472B6", glow: "rgba(244,114,182,0.5)" },
];

export default function ToneSelector({ selected, onSelect }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{t("section_tone")}</p>
      <div className="flex flex-wrap gap-2">
        {tones.map((tone) => {
          const isActive = selected === tone.id;
          return (
            <motion.button key={tone.id} onClick={() => onSelect(tone.id)} whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={{ background: isActive ? `${tone.color}15` : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${isActive ? tone.color : "rgba(255,255,255,0.07)"}`,
                color: isActive ? tone.color : "rgba(255,255,255,0.45)",
                boxShadow: isActive ? `0 0 14px ${tone.glow}` : "none" }}>
              {t(`tone_${tone.id}`)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
