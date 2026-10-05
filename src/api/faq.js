// ==========================================================
// 📚 FAQ API — Public read + Admin CRUD
// ==========================================================

import { supabase } from "../lib/supabase";

const TABLE = "faq_questions";

/* ═══════════════════════════════════════════
   🌍 Public — قراءة الأسئلة المنشورة
   ═══════════════════════════════════════════ */
export async function fetchPublicFaq() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("id, question, answer, category, display_order")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

    if (error) {
        console.error("fetchPublicFaq:", error);
        return { success: false, error: "FAQ konnte nicht geladen werden." };
    }
    return { success: true, data: data || [] };
}

/* ═══════════════════════════════════════════
   🔐 Admin — كل الأسئلة (منشور + مخفي)
   ═══════════════════════════════════════════ */
export async function fetchAllFaq() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("display_order", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function createFaq(payload) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert([payload])
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function updateFaq(id, payload) {
    const { data, error } = await supabase
        .from(TABLE)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function deleteFaq(id) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function toggleFaqPublished(id, isPublished) {
    return updateFaq(id, { is_published: isPublished });
}