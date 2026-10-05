import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { fetchMyOrders, updateOrderStatusByDriver } from "../../api/drivers";
import ShipOrderModal from "../../components/order/ShipOrderModal";
import DriverOrderDetailsModal from "./Modal/DriverOrderDetailsModal";
import "./DriverDashboard.css";

const TABS = [
    { key: "confirmed", label: "Confirmed", icon: "✅", color: "#3b82f6" },
    { key: "shipped", label: "Shipped", icon: "🚚", color: "#8b5cf6" },
    { key: "delivered", label: "Delivered", icon: "🎉", color: "#10b981" },
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
            .select("name, email, role")
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
        const toastId = toast.loading("Wird aktualisiert...");

        const res = await updateOrderStatusByDriver(orderId, "delivered");

        if (res.success) {
            toast.success("Als zugestellt markiert", { id: toastId });
            await load();
        } else {
            toast.error(res.error, { id: toastId });
        }

        setProcessingId(null);
    };

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
            {/* ═══ Header ═══ */}
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

            {/* ═══ Stats ═══ */}
            <div className="dd-stats">
                {TABS.map((t) => (
                    <div key={t.key} className="dd-stat">
                        <span className="dd-stat-icon">{t.icon}</span>
                        <div>
                            <strong>{counts[t.key]}</strong>
                            <span>{t.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ Tabs ═══ */}
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

            {/* ═══ Content ═══ */}
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
                                onOpenShipModal={() => setShipModalOrder(order)}
                                onDeliver={() => handleDeliver(order.id)}
                                onShowDetails={() => setDetailsOrder(order)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* ═══ Ship Modal ═══ */}
            {shipModalOrder && (
                <ShipOrderModal
                    order={shipModalOrder}
                    viewerRole="driver"
                    onClose={() => setShipModalOrder(null)}
                    onSuccess={handleShipSuccess}
                />
            )}

            {/* ═══ Details Modal ═══ */}
            {detailsOrder && (
                <DriverOrderDetailsModal
                    order={detailsOrder}
                    onClose={() => setDetailsOrder(null)}
                />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   🚚 Order Card
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
            {/* ═══ Head ═══ */}
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
                                {
                                    day: "2-digit",
                                    month: "short",
                                }
                            )}
                            {order.delivery_time && ` · ${order.delivery_time}`}
                        </div>
                    )}

                    <button
                        type="button"
                        className="dd-details-btn"
                        onClick={onShowDetails}
                        aria-label="Details anzeigen"
                    >
                        <span className="material-symbols-outlined">visibility</span>
                        Details
                    </button>
                </div>
            </header>

            {/* ═══ Customer ═══ */}
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

            {/* ═══ Address ═══ */}
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

            {/* ═══ Items count ═══ */}
            <div className="dd-card-section">
                <h4>
                    <span className="material-symbols-outlined">inventory_2</span>
                    Produkte
                </h4>
                <p className="dd-card-hint">
                    {order.order_items?.length || 0} Positionen
                </p>
            </div>

            {/* ═══ Actions ═══ */}
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
                        onClick={onDeliver}
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