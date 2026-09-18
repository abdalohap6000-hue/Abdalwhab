import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

const types = [
  { id: "product_ad",    icon: "🛍️", color: "#FB923C", glow: "rgba(251,146,60,0.5)"  },
  { id: "golden_tip",    icon: "💡", color: "#FACC15", glow: "rgba(250,204,21,0.5)"  },
  { id: "bold_opinion",  icon: "🔥", color: "#F87171", glow: "rgba(248,113,113,0.5)" },
  { id: "special_offer", icon: "🎁", color: "#34D399", glow: "rgba(52,211,153,0.5)"  },
  { id: "personal_story",icon: "📖", color: "#C084FC", glow: "rgba(192,132,252,0.5)" },
  { id: "interactive_q", icon: "💬", color: "#60A5FA", glow: "rgba(96,165,250,0.5)"  },
];

export default function PostTypeGrid({ selected, onSelect }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{t("section_type")}</p>
      <div className="grid grid-cols-3 gap-2">
        {types.map((type, i) => {
          const isActive = selected === type.id;
          return (
            <motion.button key={type.id} onClick={() => onSelect(type.id)} whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-200"
              style={{ background: isActive ? `${type.color}12` : "rgba(255,255,255,0.025)",
                border: `1.5px solid ${isActive ? type.color : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? `0 0 16px ${type.glow}` : "none" }}>
              <span className="text-xl">{type.icon}</span>
              <span className="text-[11px] font-bold leading-tight text-center" style={{ color: isActive ? type.color : "rgba(255,255,255,0.4)" }}>
                {t(`type_${type.id}`)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
