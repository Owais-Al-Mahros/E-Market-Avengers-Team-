/* ==========================================================
   📦 Orders API Layer — كل نداءات Edge Functions
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
   🚀 Edge Function caller (موحّد)
   ═══════════════════════════════════════════ */
async function callEdgeFunction(path, payload, { useAuth = true } = {}) {
    try {
        const headers = useAuth
            ? await getAuthHeaders()
            : {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_KEY}`,
            };

        const url = `${SUPABASE_URL}/functions/v1/${path}`;
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        const rawText = await response.text();
        let data = {};
        try {
            data = JSON.parse(rawText);
        } catch {
            console.error(`[${path}] Non-JSON response:`, rawText.slice(0, 200));
        }

        if (!response.ok) {
            return {
                success: false,
                error:
                    data?.error ||
                    `Server error (${response.status}). Bitte später erneut versuchen.`,
            };
        }

        return data;
    } catch (err) {
        console.error(`[${path}] network error:`, { message: err.message });

        if (err.message?.includes("Failed to fetch")) {
            return {
                success: false,
                error:
                    "Verbindung zum Server fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.",
            };
        }
        return {
            success: false,
            error: "Unerwarteter Fehler. Bitte versuchen Sie es erneut.",
        };
    }
}
/* ═══════════════════════════════════════════
   📞 Customer Facing (Public)
   ═══════════════════════════════════════════ */

export async function verifyOrderAccess(orderNumber, email) {
    const cleanNumber = String(orderNumber || "").trim().toUpperCase();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanNumber) return { success: false, error: "Bestellnummer fehlt." };
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        return { success: false, error: "Bitte geben Sie eine gültige E-Mail ein." };
    }

    return callEdgeFunction(
        "verify-order-access",
        { orderNumber: cleanNumber, email: cleanEmail },
        { useAuth: false }
    );
}

export async function cancelOrder(orderId, email) {
    if (!orderId || !email) return { success: false, error: "Fehlende Parameter." };
    return callEdgeFunction("cancel-order", { orderId, email }, { useAuth: false });
}

export async function applyAmendment(payload) {
    return callEdgeFunction("apply-amendment", payload, { useAuth: false });
}

export async function applyWiderruf(payload) {
    return callEdgeFunction("apply-widerruf", payload, { useAuth: false });
}

/* ═══════════════════════════════════════════
   🔐 Admin Facing
   ═══════════════════════════════════════════ */

export async function processRefund(orderId) {
    return callEdgeFunction("process-refund", { orderId });
}

export async function capturePayment(orderId) {
    return callEdgeFunction("capture-payment", { orderId });
}

export async function processWiderruf(payload) {
    return callEdgeFunction("process-widerruf", payload);
}

export async function sendOrderEmail(orderId, type) {
    return callEdgeFunction("send-order-email", { orderId, type });
}