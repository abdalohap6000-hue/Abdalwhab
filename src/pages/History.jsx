import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, CloudOff, RefreshCw } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";
import BottomNav from "../components/qalami/BottomNav";
import { SavedPost } from "../lib/savedPostsService";
import { useI18n } from "@/i18n";

const platformColors = {
  instagram: "#E4405F",
  tiktok: "#00EAFF",
  twitter: "#E7E9EA",
  youtube: "#FF0000",
  snapchat: "#FFFC00",
};

function groupByDate(posts, t) {
  const groups = {};
  const today = moment().startOf("day");
  const yesterday = moment().subtract(1, "day").startOf("day");
  const weekAgo = moment().subtract(7, "days").startOf("day");
  posts.forEach((post) => {
    const date = moment(post.created_date);
    let key;
    if (date.isSameOrAfter(today)) key = t("today");
    else if (date.isSameOrAfter(yesterday)) key = t("yesterday");
    else if (date.isSameOrAfter(weekAgo)) key = t("this_week");
    else key = date.format("YYYY/MM/DD");
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });
  return groups;
}

export default function History() {
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await SavedPost.list("-created_date", 50);
    if (data === null) setLoadError(true); // فشل الجلب (مثل انقطاع الشبكة)
    else { setLoadError(false); setPosts(data); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await SavedPost.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("deleted"));
    } catch (err) {
      toast.error(err?.message || "تعذّر الحذف");
    }
  };

  const groups = groupByDate(posts, t);
  const cfg = (platform) => ({ color: platformColors[platform] || "#7C4DFF", label: t(`platform_${platform}`) });

  return (
    <div className="min-h-screen font-cairo pb-28" style={{ background: "#020203" }} dir={dir}>
      <div className="glass-header sticky top-0 z-40">
        <div className="px-5 py-4 max-w-lg mx-auto">
          <h1 className="text-xl font-black gradient-text-white">{t("library_title")}</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-5 pt-5 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <CloudOff className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white/70">{t("library_load_error")}</h2>
            <button onClick={loadPosts} className="btn-generate-bg text-white font-bold px-6 py-3 rounded-2xl text-sm inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> {t("retry")}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">📖</div>
            <h2 className="text-lg font-bold text-white/70">{t("library_empty")}</h2>
            <button onClick={() => navigate("/home")} className="btn-generate-bg text-white font-bold px-6 py-3 rounded-2xl text-sm">{t("library_cta")}</button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([label, groupPosts]) => (
              <div key={label} className="space-y-2">
                <h3 className="text-[11px] font-bold text-white/25 uppercase tracking-widest">{label}</h3>
                <AnimatePresence>
                  {groupPosts.map((post) => {
                    const c = cfg(post.platform);
                    return (
                      <motion.div key={post.id} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                        className="relative group rounded-2xl p-4 cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${c.color}20` }}
                        onClick={() => setViewingPost(post)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${c.color}15`, color: c.color }}>{c.label}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                        <p className="text-sm text-white/65 line-clamp-2 leading-relaxed" dir="auto">{post.content}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {viewingPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ background: "rgba(2,2,3,0.92)", backdropFilter: "blur(20px)" }}
            onClick={() => setViewingPost(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="rounded-2xl p-5 w-full max-w-lg max-h-[80vh] overflow-auto"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cfg(viewingPost.platform).color}30` }}
              onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-white/80 leading-[1.9] whitespace-pre-wrap mb-5" dir="auto">{viewingPost.content}</p>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(viewingPost.content); toast.success(t("copied_toast")); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold btn-generate-bg text-white">📋 {t("copy")}</button>
                <button onClick={() => setViewingPost(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}>{t("close")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
