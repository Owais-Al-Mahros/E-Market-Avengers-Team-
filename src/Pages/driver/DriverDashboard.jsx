import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { fetchMyOrders, updateOrderStatusByDriver } from "../../api/drivers";
import { updateBestSellers } from "../../lib/bestSellers";
import { getTodayShiftCheck } from "../../api/haccp";
import ShipOrderModal from "../../components/order/ShipOrderModal";
import DriverOrderDetailsModal from "./Modal/DriverOrderDetailsModal";
import DeliveryCoolingModal from "./Modal/DeliveryCoolingModal";
import ShiftStartModal from "./Modal/ShiftStartModal";
import ShiftSummaryModal from "./components/ShiftSummaryModal";
import ShiftCleaningModal from "./components/ShiftCleaningModal";
import DriverHistoryModal from "./components/DriverHistoryModal";
import "./DriverDashboard.css";

const TABS = [
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
    const [coolingDeliveryOrder, setCoolingDeliveryOrder] = useState(null);

    // حالات الفحص والسجلات
    const [hasShiftCheck, setHasShiftCheck] = useState(null);
    const [shiftCheckData, setShiftCheckData] = useState(null);

    // المودالات
    const [showSummary, setShowSummary] = useState(false);
    const [showCleaning, setShowCleaning] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // ✅ مودال السجل الجديد

    /* ═══ Load ═══ */
    const load = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
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

            // ✅ التحقق من الفحص اليومي
            const checkRes = await getTodayShiftCheck();
            if (checkRes.success && checkRes.data) {
                setHasShiftCheck(true);
                setShiftCheckData(checkRes.data);
            } else {
                setHasShiftCheck(false);
            }

            const res = await fetchMyOrders();
            if (res && res.success) setOrders(res.data);
            else if (res) toast.error(res.error);

        } catch (err) {
            console.error("Load error:", err);
            toast.error("Verbindungsfehler beim Laden.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    /* ═══ Deliver Flow ═══ */
    const handleDeliver = async (orderId, hasCooling) => {
        if (hasCooling) {
            const order = orders.find(o => o.id === orderId);
            setCoolingDeliveryOrder(order);
            return;
        }
        await processDelivery(orderId, null);
    };

    const processDelivery = async (orderId, measuredTemp) => {
        setProcessingId(orderId);
        const toastId = toast.loading("Wird zugestellt...");

        try {
            const res = await updateOrderStatusByDriver(orderId, "delivered");
            if (res.success) {
                await updateBestSellers(orderId);
                toast.success("Als zugestellt markiert", { id: toastId });
                setCoolingDeliveryOrder(null);
                await load();
            } else {
                toast.error(res.error, { id: toastId });
            }
        } catch (err) {
            toast.error("Fehler beim Zustellen", { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenShipModal = useCallback((order) => {
        setShipModalOrder(order);
    }, []);

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

    // إذا كان الفحص اليومي غير مكتمل، اعرض المودال الإجباري فقط
    if (hasShiftCheck === false) {
        return (
            <div className="dd-page">
                <ShiftStartModal
                    driverName={driver?.name || "Fahrer"}
                    onComplete={() => {
                        setHasShiftCheck(true);
                        load();
                    }}
                />
            </div>
        );
    }

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

                {/* أزرار الهيدر */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="dd-logout" onClick={() => setShowHistory(true)} title="Verlauf">
                        <span className="material-symbols-outlined">history</span>
                        <span className="hide-mobile">Verlauf</span>
                    </button>
                    <button className="dd-logout" onClick={() => setShowSummary(true)} title="Protokoll">
                        <span className="material-symbols-outlined">fact_check</span>
                        <span className="hide-mobile">Protokoll</span>
                    </button>
                    <button className="dd-logout" onClick={handleLogout} title="Abmelden">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <nav className="dd-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`dd-tab ${activeTab === t.key ? "active" : ""}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        <span className="dd-tab-count">{counts[t.key]}</span>
                    </button>
                ))}
            </nav>

            {/* Content */}
            <main className="dd-content">
                {loading ? (
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
                                onOpenShipModal={() => handleOpenShipModal(order)}
                                onDeliver={(orderId, hasCooling) => handleDeliver(orderId, hasCooling)}
                                onShowDetails={() => setDetailsOrder(order)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
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

            {coolingDeliveryOrder && (
                <DeliveryCoolingModal
                    order={coolingDeliveryOrder}
                    onClose={() => setCoolingDeliveryOrder(null)}
                    onConfirm={(temp) => processDelivery(coolingDeliveryOrder.id, temp)}
                    onSkip={() => processDelivery(coolingDeliveryOrder.id, null)}
                />
            )}

            {/* ✅ مودال سجل الوردية الحالي */}
            {showSummary && shiftCheckData && (
                <ShiftSummaryModal
                    checkData={shiftCheckData}
                    onClose={() => setShowSummary(false)}
                    onEndShift={() => {
                        setShowSummary(false);
                        setShowCleaning(true);
                    }}
                />
            )}

            {/* ✅ مودال تنظيف نهاية الوردية */}
            {showCleaning && (
                <ShiftCleaningModal
                    onClose={() => setShowCleaning(false)}
                    onSuccess={() => {
                        setShowCleaning(false);
                        toast.success("Schicht beendet.");
                    }}
                />
            )}

            {/* ✅ مودال السجل التاريخي للسائق */}
            {showHistory && (
                <DriverHistoryModal
                    onClose={() => setShowHistory(false)}
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
    onOpenShipModal,
    onDeliver,
    onShowDetails,
}) {
    const addr = order.shipping_address || {};
    const customer = order.customer_info || {};

    return (
        <article className="dd-card">
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

            <div className="dd-card-section">
                <h4>
                    <span className="material-symbols-outlined">inventory_2</span>
                    Produkte
                </h4>
                <p className="dd-card-hint">
                    {order.order_items?.length || 0} Positionen
                </p>
            </div>

            <footer className="dd-card-actions">
                {order.status === "confirmed" && (
                    <button
                        type="button"
                        className="dd-btn dd-btn-ship"
                        onClick={onOpenShipModal}
                        disabled={processing}
                    >
                        <span className="material-symbols-outlined">local_shipping</span>
                        Versand vorbereiten
                    </button>
                )}

                {order.status === "shipped" && (
                    <button
                        type="button"
                        className="dd-btn dd-btn-deliver"
                        onClick={() => onDeliver(order.id, order.has_cooling_items)}
                        disabled={processing}
                    >
                        <span className="material-symbols-outlined">task_alt</span>
                        {processing ? "..." : "Als zugestellt markieren"}
                    </button>
                )}

                {order.status === "delivered" && (
                    <span className="dd-card-done">
                        <span className="material-symbols-outlined">check_circle</span>
                        Zugestellt
                    </span>
                )}
            </footer>
        </article>
    );
}