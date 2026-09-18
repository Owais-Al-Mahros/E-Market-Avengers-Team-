import { useState } from "react";
import toast from "react-hot-toast";
import WiderrufModal from "./WiderrufModal";
import AmendmentModal from "./AmendmentModal";
import "./OrderActionsPanel.css";

export default function OrderActionsPanel({ order, onRefresh }) {
    const [showWiderruf, setShowWiderruf] = useState(false);
    const [showAmendment, setShowAmendment] = useState(false);

    const status = order.status;

    // ============================================
    // Handlers
    // ============================================
    const handleCancelOrder = async () => {
        const confirmed = window.confirm(
            `Bestellung #${order.order_number} wirklich stornieren?\n\n` +
            `⚠️ Die Bestellung wird endgültig abgebrochen.\n` +
            `Bereits reservierte oder bezahlte Beträge werden automatisch erstattet.`
        );
        if (!confirmed) return;

        const toastId = toast.loading("Bestellung wird storniert...");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: order.id,
                        email: order.customer_info?.email,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                toast.error(result.error || "Stornierung fehlgeschlagen", {
                    id: toastId,
                    duration: 7000,
                });
                return;
            }

            // رسالة نجاح حسب نوع الاسترداد
            let successMsg = "✅ Bestellung erfolgreich storniert!";
            if (result.refund_type === "refunded") {
                successMsg += `\n💰 €${result.refund_amount.toFixed(2)} werden innerhalb von 3-5 Werktagen erstattet.`;
            } else if (result.refund_type === "authorization_cancelled") {
                successMsg += `\n💳 Reservierter Betrag (€${result.refund_amount.toFixed(2)}) wurde freigegeben.`;
            } else if (result.refund_type === "no_payment") {
                successMsg += "\n💵 Kein Betrag zu erstatten (Zahlung bei Lieferung).";
            }

            toast.success(successMsg, { id: toastId, duration: 8000 });

            onRefresh();
        } catch (err) {
            console.error("Cancel failed:", err);
            toast.error("Verbindungsfehler. Bitte versuchen Sie es später.", {
                id: toastId,
            });
        }
    };
    // ============================================
    // Render حسب الحالة
    // ============================================

    // === PENDING أو CONFIRMED ===
    if (status === "pending" || status === "confirmed") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">bolt</span>
                    Verfügbare Aktionen
                </h3>

                <div className="oap-actions">
                    <button
                        className="oap-btn oap-btn-edit"
                        onClick={() => setShowAmendment(true)}
                    >
                        <span className="material-symbols-outlined">edit</span>
                        <div>
                            <strong>Bestellung ändern</strong>
                            <small>Artikel hinzufügen, entfernen oder Mengen anpassen</small>
                        </div>
                    </button>

                    <button
                        className="oap-btn oap-btn-cancel"
                        onClick={handleCancelOrder}
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        <div>
                            <strong>Bestellung stornieren</strong>
                            <small>Bestellung vollständig abbrechen</small>
                        </div>
                    </button>
                </div>

                {status === "confirmed" && (
                    <div className="oap-notice oap-notice-info">
                        <span className="material-symbols-outlined">info</span>
                        <p>
                            Ihre Bestellung wird gerade vorbereitet. Änderungen sind bis zum
                            Versand möglich.
                        </p>
                    </div>
                )}

                {showAmendment && (
                    <AmendmentModal
                        order={order}
                        onClose={() => setShowAmendment(false)}
                        onSuccess={() => {
                            setShowAmendment(false);
                            onRefresh();
                        }}
                    />
                )}
            </div>
        );
    }

    // === SHIPPED ===
    if (status === "shipped") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">local_shipping</span>
                    Bestellung ist unterwegs
                </h3>

                <div className="oap-notice oap-notice-info">
                    <span className="material-symbols-outlined">info</span>
                    <div>
                        <strong>Ihre Bestellung wurde versandt</strong>
                        <p>
                            Änderungen sind nach dem Versand nicht mehr möglich. Sie erhalten
                            Ihre Lieferung am gewählten Termin.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // === DELIVERED ===
    if (status === "delivered") {
        const daysSince = order.daysSinceDelivery ?? 0;
        const deadline = order.widerrufDeadline ?? 14;
        const canWiderruf = order.canWiderruf ?? true;

        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">bolt</span>
                    Verfügbare Aktionen
                </h3>

                {canWiderruf ? (
                    <>
                        <button
                            className="oap-btn oap-btn-return"
                            onClick={() => setShowWiderruf(true)}
                        >
                            <span className="material-symbols-outlined">assignment_return</span>
                            <div>
                                <strong>Produkte zurückgeben</strong>
                                <small>
                                    Sie haben noch {deadline} {deadline === 1 ? "Tag" : "Tage"}{" "}
                                    (Widerrufsfrist: 14 Tage)
                                </small>
                            </div>
                        </button>

                        <div className="oap-notice oap-notice-warning">
                            <span className="material-symbols-outlined">warning</span>
                            <p>
                                <strong>Hinweis:</strong> Frischeprodukte (Obst, Gemüse,
                                Fleisch, Fisch) sind gemäß § 312g Abs. 2 Nr. 2 BGB vom
                                Widerrufsrecht ausgeschlossen.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="oap-notice oap-notice-danger">
                        <span className="material-symbols-outlined">event_busy</span>
                        <div>
                            <strong>Widerrufsfrist abgelaufen</strong>
                            <p>
                                Die 14-tägige Widerrufsfrist ist abgelaufen ({daysSince} Tage
                                seit Lieferung). Bei Mängeln kontaktieren Sie bitte unseren
                                Support.
                            </p>
                        </div>
                    </div>
                )}

                {showWiderruf && (
                    <WiderrufModal
                        order={order}
                        onClose={() => setShowWiderruf(false)}
                        onSuccess={() => {
                            setShowWiderruf(false);
                            onRefresh();
                        }}
                    />
                )}
            </div>
        );
    }

    // === CANCELLED ===
    if (status === "cancelled") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">cancel</span>
                    Bestellung storniert
                </h3>

                <div className="oap-notice oap-notice-danger">
                    <span className="material-symbols-outlined">info</span>
                    <p>
                        Diese Bestellung wurde storniert. Bei Fragen kontaktieren Sie bitte
                        unseren Support.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}