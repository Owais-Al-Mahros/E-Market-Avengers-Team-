import { useState } from "react";
import toast from "react-hot-toast";
import { cancelOrder } from "../../../../api/orders";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import WiderrufModal from "../modals/WiderrufModal";
import AmendmentModal from "../modals/AmendmentModal";
import { useNavigate } from "react-router-dom";
import "./OrderActionsPanel.css";

// ============================================
// ✅ حساب مدة Widerruf محليًا (بدل الاعتماد على DB)
// ============================================
const WIDERRUF_DAYS = 14;

function getWiderrufInfo(order) {
    if (!order || order.status !== "delivered") {
        return { canWiderruf: false, daysSince: 0, daysLeft: 0 };
    }

    // ✅ نستخدم delivered_at إن وُجد، وإلا updated_at
    const refDate = order.delivered_at || order.updated_at;
    if (!refDate) {
        return { canWiderruf: false, daysSince: 0, daysLeft: 0 };
    }

    const daysSince = Math.floor(
        (Date.now() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = Math.max(0, WIDERRUF_DAYS - daysSince);

    return {
        canWiderruf: daysLeft > 0,
        daysSince,
        daysLeft,
    };
}

export default function OrderActionsPanel({ order, onRefresh }) {
    const navigate = useNavigate();
    const [showWiderruf, setShowWiderruf] = useState(false);
    const [showAmendment, setShowAmendment] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const status = order.status;

    // ============================================
    // ✅ Cancel Order Flow
    // ============================================
    const handleCancelClick = () => setShowCancelConfirm(true);

    const performCancel = async () => {
        setIsCancelling(true);
        const toastId = toast.loading("Bestellung wird storniert...");

        try {
            const result = await cancelOrder(
                order.id,
                order.customer_info?.email
            );

            if (!result.success) {
                toast.error(result.error || "Stornierung fehlgeschlagen", {
                    id: toastId,
                    duration: 7000,
                });
                setIsCancelling(false);
                setShowCancelConfirm(false);
                return;
            }

            // رسالة نجاح حسب نوع الاسترداد
            let successMsg = "✅ Bestellung erfolgreich storniert!";
            if (result.refund_type === "refunded") {
                successMsg += `\n💰 €${result.refund_amount?.toFixed(2)} werden innerhalb von 3-5 Werktagen erstattet.`;
            } else if (result.refund_type === "authorization_cancelled") {
                successMsg += `\n💳 Reservierter Betrag (€${result.refund_amount?.toFixed(2)}) wurde freigegeben.`;
            } else if (result.refund_type === "no_payment") {
                successMsg += "\n💵 Kein Betrag zu erstatten (Zahlung bei Lieferung).";
            }

            toast.success(successMsg, { id: toastId, duration: 8000 });

            setShowCancelConfirm(false);
            setIsCancelling(false);

            onRefresh?.();
        } catch (err) {
            console.error("Cancel failed:", err);
            toast.error("Verbindungsfehler. Bitte versuchen Sie es später.", {
                id: toastId,
            });
            setIsCancelling(false);
            setShowCancelConfirm(false);
        }
    };

    // ============================================
    // === PENDING أو CONFIRMED ===
    // ============================================
    // ============================================
    // === AWAITING_PAYMENT ===
    // ============================================
    if (status === "awaiting_payment") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">credit_card</span>
                    Zahlung abschließen
                </h3>

                <div className="oap-notice oap-notice-warning">
                    <span className="material-symbols-outlined">warning</span>
                    <div>
                        <strong>Zahlung noch nicht abgeschlossen</strong>
                        <p>
                            Ihre Bestellung wurde reserviert, aber die Zahlung ist
                            noch nicht erfolgt. Bitte schließen Sie die Zahlung ab,
                            damit wir Ihre Bestellung bearbeiten können.
                        </p>
                    </div>
                </div>

                <div className="oap-actions">
                    <button
                        className="oap-btn oap-btn-pay"
                        onClick={() =>
                            navigate(`/Cart&Payments/BillAndPayment/${order.id}`)
                        }
                    >
                        <span className="material-symbols-outlined">
                            arrow_forward
                        </span>
                        <div>
                            <strong>Zahlung fortsetzen</strong>
                            <small>
                                Weiter zur Zahlungsseite für Bestellung #
                                {order.order_number}
                            </small>
                        </div>
                    </button>

                    <button
                        className="oap-btn oap-btn-cancel"
                        onClick={handleCancelClick}
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        <div>
                            <strong>Bestellung stornieren</strong>
                            <small>Reservierung aufheben</small>
                        </div>
                    </button>
                </div>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={showCancelConfirm}
                    title={`Bestellung #${order.order_number} wirklich stornieren?`}
                    message={
                        <p>
                            Die Reservierung wird aufgehoben. Es wurde noch kein
                            Betrag belastet.
                        </p>
                    }
                    variant="danger"
                    icon="cancel"
                    confirmLabel="Ja, stornieren"
                    cancelLabel="Nein, behalten"
                    isLoading={isCancelling}
                    onConfirm={performCancel}
                    onCancel={() => setShowCancelConfirm(false)}
                />
            </div>
        );
    }
    /* ═══ PENDING — كل الإجراءات متاحة ═══ */
    if (status === "pending") {
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
                            <small>Artikel entfernen oder Mengen anpassen</small>
                        </div>
                    </button>

                    <button
                        className="oap-btn oap-btn-cancel"
                        onClick={handleCancelClick}
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        <div>
                            <strong>Bestellung stornieren</strong>
                            <small>Bestellung vollständig abbrechen</small>
                        </div>
                    </button>
                </div>

                {/* ... Amendment Modal + Confirm Dialog (كما هي) ... */}
            </div>
        );
    }

    /* ═══ CONFIRMED — التعديل/الإلغاء مقفلان ═══ */
    if (status === "confirmed") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">lock</span>
                    Bestellung in Bearbeitung
                </h3>

                <div className="oap-notice oap-notice-info">
                    <span className="material-symbols-outlined">info</span>
                    <div>
                        <strong>Ihre Bestellung wird vorbereitet</strong>
                        <p>
                            Änderungen oder Stornierungen sind ab diesem Zeitpunkt
                            nicht mehr möglich. Bitte kontaktieren Sie unseren
                            Support bei dringenden Anliegen.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // === SHIPPED ===
    // ============================================
    if (status === "shipped") {
        return (
            <div className="order-actions-panel">
                <h3 className="oap-title">
                    <span className="material-symbols-outlined">
                        local_shipping
                    </span>
                    Bestellung ist unterwegs
                </h3>

                <div className="oap-notice oap-notice-info">
                    <span className="material-symbols-outlined">info</span>
                    <div>
                        <strong>Ihre Bestellung wurde versandt</strong>
                        <p>
                            Änderungen sind nach dem Versand nicht mehr möglich.
                            Sie erhalten Ihre Lieferung am gewählten Termin.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // === DELIVERED ===
    // ============================================
    if (status === "delivered") {
        // ✅ حساب معلومات Widerruf محليًا
        const { canWiderruf, daysSince, daysLeft } = getWiderrufInfo(order);

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
                            <span className="material-symbols-outlined">
                                assignment_return
                            </span>
                            <div>
                                <strong>Produkte zurückgeben</strong>
                                <small>
                                    Sie haben noch {daysLeft}{" "}
                                    {daysLeft === 1 ? "Tag" : "Tage"}{" "}
                                    (Widerrufsfrist: {WIDERRUF_DAYS} Tage)
                                </small>
                            </div>
                        </button>

                        <div className="oap-notice oap-notice-warning">
                            <span className="material-symbols-outlined">
                                warning
                            </span>
                            <p>
                                <strong>Hinweis:</strong> Frischeprodukte (Obst,
                                Gemüse, Fleisch, Fisch) sind gemäß § 312g Abs. 2
                                Nr. 2 BGB vom Widerrufsrecht ausgeschlossen.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="oap-notice oap-notice-danger">
                        <span className="material-symbols-outlined">
                            event_busy
                        </span>
                        <div>
                            <strong>Widerrufsfrist abgelaufen</strong>
                            <p>
                                Die {WIDERRUF_DAYS}-tägige Widerrufsfrist ist
                                abgelaufen ({daysSince} Tage seit Lieferung). Bei
                                Mängeln kontaktieren Sie bitte unseren Support.
                            </p>
                        </div>
                    </div>
                )}

                {/* ============ Widerruf Modal ============ */}
                {showWiderruf && (
                    <WiderrufModal
                        order={order}
                        onClose={() => setShowWiderruf(false)}
                        onSuccess={() => {
                            setShowWiderruf(false);
                            onRefresh?.();
                        }}
                    />
                )}
            </div>
        );
    }

    // ============================================
    // === CANCELLED ===
    // ============================================
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
                        Diese Bestellung wurde storniert. Bei Fragen kontaktieren
                        Sie bitte unseren Support.
                    </p>
                </div>
            </div>
        );
    }

    // ============================================
    // === UNKNOWN STATUS ===
    // ============================================
    return null;
}