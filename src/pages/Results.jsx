import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookMarked } from "lucide-react";
import ResultCard from "../components/qalami/ResultCard";
import BottomNav from "../components/qalami/BottomNav";
import { generateContent } from "../lib/generationService";
import { fetchCredits } from "../lib/creditsService";
import { SavedPost } from "../lib/savedPostsService";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

export default function Results() {
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const [data, setData] = useState(null);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("qalami_results");
    if (!stored) { navigate("/home", { replace: true }); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.platforms) || !parsed.results) throw new Error("bad shape");
      setData(parsed);
    } catch {
      sessionStorage.removeItem("qalami_results");
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const runRegenerate = async (platforms, tag) => {
    if (regeneratingPlatform) return;
    const credits = await fetchCredits();
    if (!credits || credits.balance < platforms.length) {
      toast.error(t("regen_no_credits"));
      navigate("/premium");
      return;
    }
    setRegeneratingPlatform(tag);
    try {
      const { results, errors } = await generateContent({
        platforms,
        tone: data.tone,
        postType: data.postType,
        userInput: data.userInput,
        model: data.model,
        length: data.length || "medium",
        language: data.language || "ar",
      });
      if (errors.length) toast.error(t("regen_failed"), { description: errors[0].message, duration: 8000 });
      const newData = { ...data, results: { ...data.results, ...results } };
      setData(newData);
      sessionStorage.setItem("qalami_results", JSON.stringify(newData));
    } catch (err) {
      toast.error(t("regen_failed"), { description: err?.message, duration: 8000 });
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  const handleRegenerate = async (platform) => {
    if (!data) return;
    await runRegenerate([platform], platform);
  };

  const handleRegenerateAll = async () => {
    if (!data) return;
    await runRegenerate(data.platforms, "all");
  };


  const handleSaveAll = async () => {
    if (!data || saving) return;
    setSaving(true);
    try {
      for (const platform of data.platforms) {
        const content = data.results[platform];
        if (content && !content.startsWith("⚠️")) {
          await SavedPost.create({ platform, tone: data.tone, post_type: data.postType, user_input: data.userInput, content });
        }
      }
      toast.success(t("saved_library"));
    } catch (err) {
      toast.error(err?.message || "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;

  return (
    <div className="min-h-screen font-cairo pb-28" style={{ background: "#020203" }} dir={dir}>
      <div className="glass-header sticky top-0 z-40">
        <div className="flex items-center gap-3 px-5 py-3.5 max-w-lg mx-auto">
          <button onClick={() => navigate("/home")} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ArrowRight className={`w-4 h-4 text-white/60 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </button>
          <div>
            <h1 className="text-base font-black text-white leading-tight">{t("results_title")}</h1>
            <p className="text-[11px] text-white/35">{t("results_sub")}</p>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4 relative z-10">
        {data.platforms.map((platform, i) => (
          <ResultCard key={platform} platform={platform} content={data.results[platform] || ""} index={i} onRegenerate={() => handleRegenerate(platform)} />
        ))}
        <div className="flex gap-3 pt-1">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleRegenerateAll} disabled={regeneratingPlatform === "all"}
            className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "rgba(124,77,255,0.07)", border: "1.5px solid rgba(124,77,255,0.3)", color: "rgba(192,132,252,0.9)" }}>
            {t("regenerate_all")}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveAll} disabled={saving}
            className="flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "rgba(255,215,0,0.07)", border: "1.5px solid rgba(255,215,0,0.25)", color: "#FFD700" }}>
            <BookMarked className="w-4 h-4" />
            {saving ? t("saving") : t("save_all")}
          </motion.button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}