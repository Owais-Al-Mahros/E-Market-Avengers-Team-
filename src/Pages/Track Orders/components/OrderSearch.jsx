import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import "./OrderSearch.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function OrderSearch({
    onOrderFound,
    initialOrderNumber = "",
    initialEmail = "",
    autoSubmit = false,
}) {
    const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastOrder, setLastOrder] = useState(null);

    // ✅ منع البحث التلقائي من التكرار
    const hasAutoSearchedRef = useRef(false);

    // ============================================
    // استرجاع آخر طلب مُتتبَّع
    // ============================================
    useEffect(() => {
        try {
            const saved = localStorage.getItem("lastTrackedOrder");
            if (saved) {
                const parsed = JSON.parse(saved);
                const daysSince = Math.floor(
                    (Date.now() - new Date(parsed.tracked_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                if (daysSince <= 30) {
                    setLastOrder(parsed);
                } else {
                    localStorage.removeItem("lastTrackedOrder");
                }
            }
        } catch (err) {
            console.warn("Failed to load last order:", err);
        }
    }, []);

    // ============================================
    // ✅ البحث التلقائي (عند القادم من BillAndPayment)
    // ============================================
    useEffect(() => {
        if (
            autoSubmit &&
            initialOrderNumber &&
            initialEmail &&
            !hasAutoSearchedRef.current
        ) {
            hasAutoSearchedRef.current = true;
            // تأخير بسيط لضمان تحميل الصفحة
            const timer = setTimeout(() => {
                performSearch(initialOrderNumber, initialEmail);
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSubmit, initialOrderNumber, initialEmail]);

    // ============================================
    // دالة البحث (مُستخرجة للاستخدام المتعدد)
    // ============================================
    const performSearch = async (num, mail) => {
        setError(null);

        if (!num.trim()) {
            setError("Bitte geben Sie die Bestellnummer ein.");
            return;
        }
        if (!mail.trim() || !/^\S+@\S+\.\S+$/.test(mail)) {
            setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/verify-order-access`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderNumber: num.trim(),
                        email: mail.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Bestellung nicht gefunden.");
                setLoading(false);
                return;
            }

            toast.success("✅ Bestellung gefunden!");
            onOrderFound(result.order);
        } catch (err) {
            console.error("Search failed:", err);
            setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // إرسال النموذج
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        performSearch(orderNumber, email);
    };

    // ============================================
    // متابعة آخر طلب محفوظ
    // ============================================
    const handleLastOrderClick = () => {
        if (!lastOrder) return;
        setOrderNumber(lastOrder.order_number);
        setEmail(lastOrder.email);
        setTimeout(() => {
            performSearch(lastOrder.order_number, lastOrder.email);
        }, 100);
    };

    // ============================================
    // Render
    // ============================================
    return (
        <div className="order-search-wrapper">
            {/* Hero */}
            <div className="order-search-hero">
                <div className="order-search-icon">
                    <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <h1 className="order-search-title">Bestellung verfolgen</h1>
                <p className="order-search-subtitle">
                    Geben Sie Ihre Bestellnummer und E-Mail-Adresse ein, um den Status
                    Ihrer Bestellung zu sehen.
                </p>
            </div>

            {/* آخر طلب محفوظ */}
            {lastOrder && !loading && (
                <div className="order-search-last">
                    <div className="order-search-last-info">
                        <span className="material-symbols-outlined">history</span>
                        <div>
                            <strong>Zuletzt verfolgte Bestellung</strong>
                            <span>#{lastOrder.order_number}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="order-search-last-btn"
                        onClick={handleLastOrderClick}
                        disabled={loading}
                    >
                        Fortsetzen
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            )}

            {/* نموذج البحث */}
            <form
                id="order-search-form"
                className="order-search-card"
                onSubmit={handleSubmit}
            >
                <div className="order-search-field">
                    <label htmlFor="order-number">
                        <span className="material-symbols-outlined">receipt_long</span>
                        Bestellnummer
                    </label>
                    <input
                        id="order-number"
                        type="text"
                        placeholder="z.B. ORD-20260916-1234"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                        disabled={loading}
                        autoComplete="off"
                        spellCheck="false"
                        required
                    />
                    <small className="order-search-hint">
                        Sie finden die Bestellnummer in Ihrer Bestätigungs-E-Mail.
                    </small>
                </div>

                <div className="order-search-field">
                    <label htmlFor="email">
                        <span className="material-symbols-outlined">mail</span>
                        E-Mail-Adresse
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="ihre@email.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        required
                    />
                    <small className="order-search-hint">
                        Die E-Mail-Adresse, die Sie bei der Bestellung verwendet haben.
                    </small>
                </div>

                {error && (
                    <div className="order-search-error">
                        <span className="material-symbols-outlined">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="order-search-submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="order-search-spinner" />
                            Wird gesucht...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">search</span>
                            Bestellung suchen
                        </>
                    )}
                </button>
            </form>

            {/* ملاحظة أمنية */}
            <div className="order-search-notice">
                <span className="material-symbols-outlined">lock</span>
                <p>
                    Aus Sicherheitsgründen benötigen wir sowohl Ihre Bestellnummer als
                    auch Ihre E-Mail-Adresse. Ihre Daten werden ausschließlich zur
                    Anzeige Ihrer Bestellung verwendet.
                </p>
            </div>
        </div>
    );
}