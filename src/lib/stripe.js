import { loadStripe } from "@stripe/stripe-js";

// ✅ يُحمَّل مرة واحدة فقط — أفضل للمشروع
export const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);