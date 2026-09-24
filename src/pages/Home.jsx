import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PlatformSelector from "../components/qalami/PlatformSelector";
import ToneSelector from "../components/qalami/ToneSelector";
import PostTypeGrid from "../components/qalami/PostTypeGrid";
import ContentInput from "../components/qalami/ContentInput";
import LengthLanguageSelector from "../components/qalami/LengthLanguageSelector";
import GenerateButton from "../components/qalami/GenerateButton";
import CreditsPill from "../components/qalami/CreditsPill";
import BottomNav from "../components/qalami/BottomNav";
import { generateContent, getSelectedModel } from "../lib/generationService";
import { fetchCredits, isModelLocked, FREE_MODEL } from "../lib/creditsService";
import { useI18n } from "@/i18n";
import appIcon from "@/assets/app-icon-small.png.asset.json";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { t, fmt, dir } = useI18n();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedTone, setSelectedTone] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [userInput, setUserInput] = useState("");
  const [length, setLength] = useState("medium");
  const [language, setLanguage] = useState("ar");
  const [model, setModel] = useState(getSelectedModel());
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  const plan = credits?.plan ?? "free";
  const balance = credits?.balance ?? 0;

  useEffect(() => {
    let alive = true;
    fetchCredits().then((c) => {
      if (!alive) return;
      setCredits(c);
      setLoadingCredits(false);
      // إن كان النموذج المحفوظ مقفلاً، ارجع للنموذج المجاني
      if (c && isModelLocked(getSelectedModel(), c.plan)) setModel(FREE_MODEL);
    });
    return () => { alive = false; };
  }, []);

  const togglePlatform = useCallback((id) => {
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }, []);

  const cost = selectedPlatforms.length;
  const canGenerate = selectedPlatforms.length > 0 && selectedTone && selectedType && userInput.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) { toast.error(t("fill_all")); return; }

    if (isModelLocked(model, plan)) {
      toast.error(t("model_needs_pro"), { description: t("model_needs_pro_desc") });
      navigate("/premium");
      return;
    }

    if (balance < cost) {
      toast.error(t("not_enough_credits", { cost: fmt(cost), balance: fmt(balance) }), {
        description: t("not_enough_credits_desc"),
      });
      navigate("/premium");
      return;
    }

    setIsLoading(true);
    const { results, errors, balance: newBalance } = await generateContent({
      platforms: selectedPlatforms, tone: selectedTone, postType: selectedType, userInput, length, language, model,
    });
    setIsLoading(false);

    if (typeof newBalance === "number") setCredits((c) => ({ ...(c || {}), balance: newBalance }));
    else fetchCredits().then((c) => c && setCredits(c));

    if (errors.length) {
      const allFailed = errors.length === selectedPlatforms.length;
      const isBilling = errors[0].code === "NO_CREDITS" || errors[0].code === "MODEL_LOCKED";
      toast.error(t("generation_failed", { platforms: errors.map((e) => e.platform)
        .join("، ") }), {
        description: errors[0].message,
        duration: 8000,
        // زر إعادة المحاولة فقط عند فشل كل المنصات بسبب خطأ غير مرتبط بالفوترة.
        // في الفشل الجزئي تُعرض النتائج الناجحة في صفحة النتائج، وإعادة التوليد الكاملة هنا قد تخصم نقاطاً إضافية.
        ...(allFailed && !isBilling ? {
          action: { label: t("retry"), onClick: () => { handleGenerate(); } },
        } : {}),
      });
      if (allFailed) {
        if (isBilling) navigate("/premium");
        return;
      }
    }

    sessionStorage.setItem("qalami_results", JSON.stringify({ results, platforms: selectedPlatforms, tone: selectedTone, postType: selectedType, userInput, model, length, language }));
    navigate("/results");
  };

  return (
    <div className="min-h-screen font-cairo pb-28" style={{ background: "#020203" }} dir={dir}>
      <div className="bg-orb w-[400px] h-[400px] top-[-100px] right-[-100px] opacity-[0.06]" style={{ background: "#7C4DFF" }} />
      <div className="glass-header sticky top-0 z-40">
        <div className="flex items-center justify-between px-5 py-3.5 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <img src={appIcon.url} alt="Qalami AI" className="w-7 h-7 rounded-lg" />
            <span className="text-lg font-black gradient-text-white">{t("app_name")}</span>
          </div>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate("/premium")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700" }}>
            👑 {plan === "pro" ? "Pro" : t("upgrade")}
          </motion.button>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-6 space-y-7 relative z-10">
        <CreditsPill credits={credits} loading={loadingCredits} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <PlatformSelector selected={selectedPlatforms} onToggle={togglePlatform} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ToneSelector selected={selectedTone} onSelect={setSelectedTone} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <PostTypeGrid selected={selectedType} onSelect={setSelectedType} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <LengthLanguageSelector length={length} onLengthChange={setLength} language={language} onLanguageChange={setLanguage} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ContentInput value={userInput} onChange={setUserInput} model={model} onModelChange={setModel} plan={plan} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GenerateButton onClick={handleGenerate} isLoading={isLoading} disabled={!canGenerate} />
          {cost > 0 && (
            <p className="text-center text-[11px] mt-2 text-white/30 font-semibold">
              {t("cost_line", { cost: fmt(cost) })}
            </p>
          )}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
