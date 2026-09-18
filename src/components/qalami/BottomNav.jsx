import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";

const tabs = [
  { path: "/home",     icon: "⚡", key: "nav_create"   },
  { path: "/history",  icon: "📚", key: "nav_library"  },
  { path: "/premium",  icon: "👑", key: "nav_pro"      },
  { path: "/settings", icon: "⚙️", key: "nav_settings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50" style={{ width: "calc(100% - 32px)", maxWidth: "400px" }}>
      <div className="glass-nav flex items-center justify-around h-[60px] rounded-[20px] px-2"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button key={tab.path} onClick={() => navigate(tab.path)} whileTap={{ scale: 0.88 }}
              className="flex flex-col items-center gap-0.5 relative py-1 px-4">
              {isActive && (
                <motion.div layoutId="nav-pill" className="absolute inset-x-0 inset-y-0 rounded-2xl"
                  style={{ background: "rgba(124,77,255,0.18)", boxShadow: "0 0 12px rgba(124,77,255,0.3)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
              <motion.span className="text-base relative z-10"
                animate={{ scale: isActive ? 1.1 : 1, filter: isActive ? "none" : "grayscale(0.4) opacity(0.5)" }}>
                {tab.icon}
              </motion.span>
              <span className="text-[9px] font-bold relative z-10" style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)" }}>
                {t(tab.key)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
