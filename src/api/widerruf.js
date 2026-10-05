/* ==========================================================
   📮 Widerruf API Layer — Withdrawal Requests
   ========================================================== */

import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* ═══════════════════════════════════════════
   🔐 Auth Helper
   ═══════════════════════════════════════════ */
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error("Not authenticated");
    }
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
    };
}

/* ═══════════════════════════════════════════
   📥 Fetch Requests
   ═══════════════════════════════════════════ */
export async function fetchWiderrufRequests() {
    const { data, error } = await supabase
        .from("order_amendments")
        .select(`
            *,
            orders:order_id (
                order_number,
                customer_info,
                total_price,
                payment_method,
                payment_intent_id
            )
        `)
        .eq("amendment_type", "widerruf")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("fetchWiderrufRequests:", error);
        throw new Error("Failed to load requests");
    }

    return data || [];
}

/* ═══════════════════════════════════════════
   🚀 Process Request (Approve / Reject)
   ═══════════════════════════════════════════ */
export async function processWiderrufRequest({
    amendmentId,
    action,
    rejectionReason = null,
    adminNotes = null,
}) {
    if (!amendmentId || !["approve", "reject"].includes(action)) {
        return { success: false, error: "Invalid request parameters" };
    }

    try {
        const headers = await getAuthHeaders();

        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/process-widerruf`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    amendmentId,
                    action,
                    rejectionReason,
                    adminNotes,
                }),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            return {
                success: false,
                error: data?.error || `Error (${response.status})`,
            };
        }

        return data;
    } catch (err) {
        console.error("processWiderrufRequest failed:", err);
        return {
            success: false,
            error: "Connection error. Please try again.",
        };
    }
}