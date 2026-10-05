// src/lib/bestSellers.js
import { supabase } from "./supabase";

async function callUpdateBestSellers(orderId, action) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        console.error("updateBestSellers: no session");
        return false;
    }

    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-best-sellers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ orderId, action }),
        }
    );

    const data = await res.json().catch(() => ({ success: false }));
    return data.success === true;
}

export async function updateBestSellers(orderId) {
    return callUpdateBestSellers(orderId, "increment");
}

export async function decrementBestSellers(orderId) {
    return callUpdateBestSellers(orderId, "decrement");
}