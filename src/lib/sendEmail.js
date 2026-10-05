// src/lib/sendEmail.js
import { supabase } from "./supabase";

export async function sendOrderEmail(orderId, type) {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            console.error("sendOrderEmail: no active session");
            return false;
        }

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ orderId, type }),
            }
        );

        const result = await response.json();

        if (!result.success) {
            console.error("Email failed:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Email error:", error);
        return false;
    }
}