export async function sendOrderEmail(orderId, type) {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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