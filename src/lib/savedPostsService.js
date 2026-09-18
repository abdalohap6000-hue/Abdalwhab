// Supabase-backed per-user saved posts library.
import { supabase } from "@/integrations/supabase/client";

export const SavedPost = {
  list: async (_sortKey = "-created_date", limit = 50) => {
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("SavedPost.list error:", error);
      return [];
    }
    // Map created_at → created_date for existing UI code compatibility
    return (data || []).map((r) => ({ ...r, created_date: r.created_at }));
  },

  create: async (data) => {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) throw new Error("يجب تسجيل الدخول أولاً");

    const payload = {
      user_id: authData.user.id,
      platform: data.platform,
      tone: data.tone ?? null,
      post_type: data.post_type ?? null,
      user_input: data.user_input ?? null,
      content: data.content,
    };
    const { data: inserted, error } = await supabase
      .from("saved_posts")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("SavedPost.create error:", error);
      throw error;
    }
    return { ...inserted, created_date: inserted.created_at };
  },

  delete: async (id) => {
    const { error } = await supabase.from("saved_posts").delete().eq("id", id);
    if (error) {
      console.error("SavedPost.delete error:", error);
      throw error;
    }
  },
};
