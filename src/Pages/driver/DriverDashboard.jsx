import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { fetchMyOrders, updateOrderStatusByDriver } from "../../api/drivers";
import { updateBestSellers } from "../../lib/bestSellers";
import { canDeliverOrder, canStartRound } from "../../api/haccp";
import ShipOrderModal from "../../components/order/ShipOrderModal";
import DriverOrderDetailsModal from "./Modal/DriverOrderDetailsModal";
import ProductReceiptCheck from "./Haccp/ProductReceiptCheck";
import HaccpPanel from "./Haccp/HaccpPanel";
import RoundGateBanner from "./Haccp/RoundGateBanner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import "./DriverDashboard.css";

const TABS = [
    { key: "haccp", label: "HACCP & Hygiene", icon: "🛡️" },
    { key: "confirmed", label: "Bestätigt", icon: "✅" },
    { key: "shipped", label: "Unterwegs", icon: "🚚" },
    { key: "delivered", label: "Zugestellt", icon: "🎉" },
];

export default function DriverDashboard() {
    const navigate = useNavigate();

    const [driver, setDriver] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("confirmed");

    const [processingId, setProcessingId] = useState(null);
    const [shipModalOrder, setShipModalOrder] = useState(null);
    const [detailsOrder, setDetailsOrder] = useState(null);
    const [receiptCheckOrder, setReceiptCheckOrder] = useState(null);
    const [pendingDeliveryOrder, setPendingDeliveryOrder] = useState(null);

    // ✅ حالة الجولة — null = لم يُتحقق، false = محظور، true = مسموح
    const [roundAllowed, setRoundAllowed] = useState(null);

    /* ═══ Load ═══ */
    const load = async () => {
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/login");
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "driver") {
            toast.error("Zugriff verweigert.");
            navigate("/");
            return;
        }

        setDriver(profile);

        const res = await fetchMyOrders();
        if (res.success) setOrders(res.data);
        else toast.error(res.error);

        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ═══ تحديث حالة الجولة ═══ */
    const refreshRoundStatus = useCallback(async () => {
        const res = await canStartRound();
        if (res.success) {
            setRoundAllowed(res.data.allowed === true);
        } else {
            // عند الفشل — احترازًا: اعتبر الجولة محظورة
            setRoundAllowed(false);
        }
    }, []);

    /* ═══ Logout ═══ */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
    };

    /* ═══ Ship success ═══ */
    const handleShipSuccess = async () => {
        setShipModalOrder(null);
        toast.success("Bestellung versandt!");
        await load();
    };

    /* ═══ Deliver ═══ */
    const handleDeliver = async (orderId) => {
        setProcessingId(orderId);
        const toastId = toast.loading("Prüfe HACCP-Status...");

        const gate = await canDeliverOrder(orderId);

        if (!gate.success) {
            toast.error(gate.error || "Prüfung fehlgeschlagen", { id: toastId });
            setProcessingId(null);
            return;
        }

        if (!gate.data.allowed) {
            toast.dismiss(toastId);
            setPendingDeliveryOrder({
                orderId,
                reasons: gate.data.reasons,
                violations: gate.data.violations,
            });
            setProcessingId(null);
            return;
        }

        toast.loading("Wird aktualisiert...", { id: toastId });
        const res = await updateOrderStatusByDriver(orderId, "delivered");

        if (res.success) {
            try {
                await updateBestSellers(orderId);
            } catch (err) {
                console.warn("Best sellers update failed:", err);
            }
            toast.success("Als zugestellt markiert", { id: toastId });
            await load();
        } else {
            toast.error(res.error, { id: toastId });
        }

        setProcessingId(null);
    };

    /* ═══ فتح Modals — تحقق من الفحص ═══ */
    const handleOpenShipModal = useCallback(
        (order) => {
            if (!roundAllowed) {
                toast.error(
                    "Bitte führen Sie zuerst den HACCP-Fahrzeugcheck durch.",
                    { icon: "🚫", duration: 4000 }
                );
                setActiveTab("haccp");
                return;
            }
            setShipModalOrder(order);
        },
        [roundAllowed]
    );

    const handleOpenReceiptCheck = useCallback(
        (order) => {
            if (!roundAllowed) {
                toast.error(
                    "Bitte führen Sie zuerst den HACCP-Fahrzeugcheck durch.",
                    { icon: "🚫", duration: 4000 }
                );
                setActiveTab("haccp");
                return;
            }
            setReceiptCheckOrder(order);
        },
        [roundAllowed]
    );

    /* ═══ Derived ═══ */
    const filtered = useMemo(
        () => orders.filter((o) => o.status === activeTab),
        [orders, activeTab]
    );

    const counts = useMemo(() => {
        const c = { confirmed: 0, shipped: 0, delivered: 0 };
        orders.forEach((o) => {
            if (c[o.status] !== undefined) c[o.status]++;
        });
        return c;
    }, [orders]);

    /* ═══ Render ═══ */
    return (
        <div className="dd-page">
            {/* Header */}
            <header className="dd-header">
                <div className="dd-header-info">
                    <div className="dd-avatar">
                        {driver?.name?.[0]?.toUpperCase() || "🚚"}
                    </div>
                    <div>
                        <h1>{driver?.name || "Fahrer"}</h1>
                        <p>{driver?.email}</p>
                    </div>
                </div>
                <button className="dd-logout" onClick={handleLogout}>
                    <span className="material-symbols-outlined">logout</span>
                    <span>Abmelden</span>
                </button>
            </header>

            {/* Banner */}
            <RoundGateBanner onStatusChange={(s) => setRoundAllowed(s.allowed === true)} />

            {/* Tabs */}
            <nav className="dd-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`dd-tab ${activeTab === t.key ? "active" : ""}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        {t.key !== "haccp" && (
                            <span className="dd-tab-count">{counts[t.key]}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Content */}
            <main className="dd-content">
                {activeTab === "haccp" ? (
                    <HaccpPanel
                        driverId={driver?.id}
                        onCheckCompleted={refreshRoundStatus}
                    />
                ) : loading ? (
                    <div className="dd-state">Lade Bestellungen...</div>
                ) : filtered.length === 0 ? (
                    <div className="dd-state">
                        <span className="material-symbols-outlined">inbox</span>
                        <p>Keine Bestellungen in dieser Kategorie</p>
                    </div>
                ) : (
                    <div className="dd-orders">
                        {filtered.map((order) => (
                            <DriverOrderCard
                                key={order.id}
                                order={order}
                                processing={processingId === order.id}
                                canAct={roundAllowed === true}
                                onOpenReceiptCheck={() => handleOpenReceiptCheck(order)}
                                onOpenShipModal={() => handleOpenShipModal(order)}
                                onDeliver={() => handleDeliver(order.id)}
                                onShowDetails={() => setDetailsOrder(order)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            {receiptCheckOrder && (
                <ProductReceiptCheck
                    order={receiptCheckOrder}
                    onClose={() => setReceiptCheckOrder(null)}
                    onSuccess={() => {
                        setReceiptCheckOrder(null);
                        toast.success("Produktprüfung gespeichert");
                    }}
                />
            )}

            {shipModalOrder && (
                <ShipOrderModal
                    order={shipModalOrder}
                    viewerRole="driver"
                    onClose={() => setShipModalOrder(null)}
                    onSuccess={handleShipSuccess}
                />
            )}

            {detailsOrder && (
                <DriverOrderDetailsModal
                    order={detailsOrder}
                    onClose={() => setDetailsOrder(null)}
                />
            )}

            {pendingDeliveryOrder && (
                <ConfirmDialog
                    isOpen={true}
                    title="Lieferung blockiert"
                    message={
                        <>
                            <p>
                                <strong>HACCP-Sperre aktiv:</strong> Für diese Bestellung
                                bestehen offene Verstöße. Die Lieferung kann erst nach Behebung
                                freigegeben werden.
                            </p>
                            <p style={{ marginTop: 10 }}>
                                <strong>Offene Verstöße:</strong>
                            </p>
                            <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                                {pendingDeliveryOrder.reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                            <p style={{ marginTop: 10, fontSize: 13, color: "#6b7a77" }}>
                                Bitte wenden Sie sich an den Administrator, um die Verstöße zu
                                klären.
                            </p>
                        </>
                    }
                    variant="danger"
                    icon="block"
                    confirmLabel="Verstanden"
                    cancelLabel={null}
                    isLoading={false}
                    onConfirm={() => setPendingDeliveryOrder(null)}
                    onCancel={() => setPendingDeliveryOrder(null)}
                />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   🚚 Driver Order Card
   ══════════════════════════════════════════════════════════ */
function DriverOrderCard({
    order,
    processing,
    canAct,
    onOpenReceiptCheck,
    onOpenShipModal,
    onDeliver,
    onShowDetails,
}) {
    const addr = order.shipping_address || {};
    const customer = order.customer_info || {};

    return (
        <article className="dd-card">
            {/* Head */}
            <header className="dd-card-head">
                <div>
                    <span className="dd-card-num">#{order.order_number}</span>
                    <span className={`dd-card-status dd-status-${order.status}`}>
                        {order.status}
                    </span>
                </div>

                <div className="dd-card-head-right">
                    {order.delivery_date && (
                        <div className="dd-card-delivery">
                            <span className="material-symbols-outlined">event</span>
                            {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString(
                                "de-DE",
                                { day: "2-digit", month: "short" }
                            )}
                            {order.delivery_time && ` · ${order.delivery_time}`}
                        </div>
                    )}

                    <button
                        type="button"
                        className="dd-details-btn"
                        onClick={onShowDetails}
                    >
                        <span className="material-symbols-outlined">visibility</span>
                        Details
                    </button>
                </div>
            </header>

            {/* Customer */}
            <div className="dd-card-section">
                <h4>
                    <span className="material-symbols-outlined">person</span>
                    Kunde
                </h4>
                <p>
                    <strong>
                        {customer.first_name} {customer.last_name}
                    </strong>
                </p>
                {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="dd-card-link">
                        📞 {customer.phone}
                    </a>
                )}
            </div>

            {/* Address */}
            <div className="dd-card-section">
                <h4>
                    <span className="material-symbols-outlined">location_on</span>
                    Lieferadresse
                </h4>
                <p>
                    {addr.street} {addr.house_number}
                    <br />
                    {addr.postal_code} {addr.city}
                </p>
                {addr.floor !== undefined && addr.floor !== null && (
                    <p className="dd-card-hint">
                        Etage {addr.floor}
                        {addr.has_elevator ? " (Aufzug)" : " (kein Aufzug)"}
                        {addr.doorbell_name && ` · 🔔 ${addr.doorbell_name}`}
                    </p>
                )}
                {addr.notes && <p className="dd-card-note">📝 {addr.notes}</p>}
            </div>

            {/* Items count */}
            <div className="dd-card-section">
                <h4>
                    <span className="material-symbols-outlined">inventory_2</span>
                    Produkte
                </h4>
                <p className="dd-card-hint">
                    {order.order_items?.length || 0} Positionen
                </p>
            </div>

            {/* Actions */}
            <footer className="dd-card-actions">
                {/* ✅ Confirmed + فحص صالح → أزرار */}
                {order.status === "confirmed" && canAct && (
                    <>
                        <button
                            type="button"
                            className="dd-btn dd-btn-ship"
                            onClick={onOpenShipModal}
                            disabled={processing}
                        >
                            <span className="material-symbols-outlined">
                                local_shipping
                            </span>
                            Versand vorbereiten
                        </button>
                    </>
                )}

                {/* ✅ Confirmed + فحص غير صالح → لا شيء (لا أزرار، لا رسالة) */}
                {/* (الفراغ مقصود) */}

                {/* Shipped → زر التسليم */}
                {order.status === "shipped" && (
                    <button
                        type="button"
                        className="dd-btn dd-btn-deliver"
                        onClick={onDeliver}
                        disabled={processing}
                    >
                        <span className="material-symbols-outlined">task_alt</span>
                        {processing ? "..." : "Als zugestellt markieren"}
                    </button>
                )}

                {order.status === "delivered" && (
                    <span className="dd-card-done">
                        <span className="material-symbols-outlined">
                            check_circle
                        </span>
                        Zugestellt
                    </span>
                )}
            </footer>
        </article>
    );
}