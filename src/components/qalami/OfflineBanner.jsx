// لافتة عالمية تظهر فقط عند انقطاع الإنترنت — إعلامية بالكامل، لا تتفاعل مع أي منطق.
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/i18n";

export default function OfflineBanner() {
  const { t, dir } = useI18n();
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-2 px-4 pointer-events-none"
          style={{
            background: "rgba(45,7,12,0.92)",
            borderBottom: "1px solid rgba(248,113,113,0.25)",
            backdropFilter: "blur(12px)",
          }}
          dir={dir}
        >
          <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[12px] font-bold text-red-300">
            {t("offline_banner")}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
