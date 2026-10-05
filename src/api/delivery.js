/* ==========================================================
   🚚 Delivery API Layer
   ========================================================== */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Calculate delivery cost via Edge Function.
 * @param {object} payload - { customerAddress, itemsWeight, floor, hasElevator, cartSubtotal }
 */
export async function calculateDelivery(payload) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/calculate-delivery`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                success: false,
                error: data?.error || `Error (${response.status})`,
            };
        }

        return data;
    } catch (err) {
        console.error("[calculate-delivery] failed:", err);
        return {
            success: false,
            error: "Connection error. Please try again.",
        };
    }
}