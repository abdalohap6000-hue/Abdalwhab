import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

export const LENGTHS = [{ id: "short" }, { id: "medium" }, { id: "long" }];

export const LANGUAGES = [
  { id: "ar", flag: "🇸🇦" },
  { id: "ar_eg", flag: "🇪🇬" },
  { id: "ar_gulf", flag: "🇦🇪" },
  { id: "en", flag: "🇺🇸" },
  { id: "fr", flag: "🇫🇷" },
];

function Pill({ active, color, onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${active ? color : "rgba(255,255,255,0.07)"}`,
        color: active ? color : "rgba(255,255,255,0.45)",
        boxShadow: active ? `0 0 14px ${color}55` : "none",
      }}
    >
      {children}
    </motion.button>
  );
}

export default function LengthLanguageSelector({ length, onLengthChange, language, onLanguageChange }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{t("section_length")}</p>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <Pill key={l.id} active={length === l.id} color="#38BDF8" onClick={() => onLengthChange(l.id)}>
              {t(`length_${l.id}`)}{" "}
              <span className="opacity-60 text-[10px] font-semibold">{t(`length_${l.id}_hint`)}</span>
            </Pill>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{t("section_language")}</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lg) => (
            <Pill key={lg.id} active={language === lg.id} color="#A78BFA" onClick={() => onLanguageChange(lg.id)}>
              <span>{lg.flag}</span> {t(`content_lang_${lg.id}`)}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}
