// ==========================================================
// 💬 Contact Messages API
// ==========================================================

import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ═══════════════════════════════════════════
   🌍 Public — إرسال رسالة (Edge Function)
   ═══════════════════════════════════════════ */
export async function sendContactMessage(payload) {
    const clean = {
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim().toLowerCase(),
        phone: String(payload.phone || "").trim(),
        subject: String(payload.subject || "").trim(),
        message: String(payload.message || "").trim(),
        category: payload.category || "general",
    };

    // ✅ تحقق أساسي
    if (!clean.name || !clean.email || !clean.subject || !clean.message) {
        return { success: false, error: "Bitte füllen Sie alle Pflichtfelder aus." };
    }
    if (!/^\S+@\S+\.\S+$/.test(clean.email)) {
        return { success: false, error: "Bitte geben Sie eine gültige E-Mail ein." };
    }
    if (clean.message.length < 10) {
        return { success: false, error: "Die Nachricht ist zu kurz." };
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/send-contact-message`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify(clean),
            }
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            return {
                success: false,
                error: data?.error || "Nachricht konnte nicht gesendet werden.",
            };
        }
        return data;
    } catch (err) {
        console.error("sendContactMessage:", err);
        return {
            success: false,
            error: "Verbindungsfehler. Bitte versuchen Sie es erneut.",
        };
    }
}

/* ═══════════════════════════════════════════
   🔐 Admin — قراءة + تحديث
   ═══════════════════════════════════════════ */
export async function fetchContactMessages() {
    const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function updateMessageStatus(id, status) {
    const { error } = await supabase
        .from("contact_messages")
        .update({ status })
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function replyToMessage(id, replyText, adminUserId) {
    const { error } = await supabase
        .from("contact_messages")
        .update({
            admin_reply: replyText,
            replied_at: new Date().toISOString(),
            replied_by: adminUserId,
            status: "replied",
        })
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteMessage(id) {
    const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}