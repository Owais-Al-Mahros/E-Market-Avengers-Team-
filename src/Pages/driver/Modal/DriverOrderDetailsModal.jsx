import { createPortal } from "react-dom";
import "./DriverOrderDetailsModal.css";

export default function DriverOrderDetailsModal({ order, onClose }) {
    if (!order) return null;

    const customer = order.customer_info || {};
    const addr = order.shipping_address || {};
    const items = order.order_items || [];

    return createPortal(
        <div className="dod-overlay" onClick={onClose}>
            <div className="dod-modal" onClick={(e) => e.stopPropagation()}>
                {/* ═══ Header ═══ */}
                <header className="dod-header">
                    <div>
                        <h2>Bestelldetails</h2>
                        <p>#{order.order_number}</p>
                    </div>
                    <button className="dod-close" onClick={onClose} aria-label="Schließen">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {/* ═══ Body ═══ */}
                <div className="dod-body">
                    {/* Delivery Time */}
                    {order.delivery_date && (
                        <section className="dod-section dod-delivery">
                            <span className="material-symbols-outlined">schedule</span>
                            <div>
                                <span className="dod-label">Liefertermin</span>
                                <strong>
                                    {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString(
                                        "de-DE",
                                        {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        }
                                    )}
                                </strong>
                                {order.delivery_time && <em>um {order.delivery_time} Uhr</em>}
                            </div>
                        </section>
                    )}

                    {/* Customer */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">person</span>
                            Kunde
                        </h3>
                        <div className="dod-content">
                            <p className="dod-strong">
                                {customer.first_name} {customer.last_name}
                            </p>
                            {customer.phone && (
                                <a href={`tel:${customer.phone}`} className="dod-link">
                                    <span className="material-symbols-outlined">call</span>
                                    {customer.phone}
                                </a>
                            )}
                            {customer.email && (
                                <a href={`mailto:${customer.email}`} className="dod-link">
                                    <span className="material-symbols-outlined">mail</span>
                                    {customer.email}
                                </a>
                            )}
                        </div>
                    </section>

                    {/* Address */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">location_on</span>
                            Lieferadresse
                        </h3>
                        <div className="dod-content">
                            <p className="dod-strong">
                                {addr.street} {addr.house_number}
                                <br />
                                {addr.postal_code} {addr.city}
                            </p>

                            <div className="dod-meta-grid">
                                {addr.floor !== undefined && addr.floor !== null && (
                                    <div className="dod-meta">
                                        <span className="material-symbols-outlined">apartment</span>
                                        <div>
                                            <span className="dod-meta-label">Etage</span>
                                            <strong>{addr.floor}</strong>
                                        </div>
                                    </div>
                                )}
                                <div className="dod-meta">
                                    <span className="material-symbols-outlined">
                                        {addr.has_elevator ? "elevator" : "stairs"}
                                    </span>
                                    <div>
                                        <span className="dod-meta-label">Aufzug</span>
                                        <strong>{addr.has_elevator ? "Ja" : "Nein"}</strong>
                                    </div>
                                </div>
                                {addr.doorbell_name && (
                                    <div className="dod-meta">
                                        <span className="material-symbols-outlined">
                                            notifications_active
                                        </span>
                                        <div>
                                            <span className="dod-meta-label">Klingelname</span>
                                            <strong>{addr.doorbell_name}</strong>
                                        </div>
                                    </div>
                                )}
                                {addr.apartment && (
                                    <div className="dod-meta">
                                        <span className="material-symbols-outlined">meeting_room</span>
                                        <div>
                                            <span className="dod-meta-label">Wohnung</span>
                                            <strong>{addr.apartment}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {addr.notes && (
                                <div className="dod-note">
                                    <span className="material-symbols-outlined">sticky_note_2</span>
                                    <div>
                                        <span className="dod-note-label">Kundennotiz</span>
                                        <p>{addr.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Items */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">inventory_2</span>
                            Produkte ({items.length})
                        </h3>
                        <div className="dod-items">
                            {items.length === 0 ? (
                                <p className="dod-empty">Keine Produkte</p>
                            ) : (
                                items.map((item, idx) => {
                                    const isRemoved = item.status === "removed";
                                    const displayQty =
                                        item.actual_weight ??
                                        item.actual_quantity ??
                                        item.quantity;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`dod-item ${isRemoved ? "is-removed" : ""}`}
                                        >
                                            <span className="dod-item-num">{idx + 1}</span>
                                            <div className="dod-item-info">
                                                <span className="dod-item-name">
                                                    {item.product_name}
                                                </span>
                                                {item.substitution_note && (
                                                    <span className="dod-item-sub">
                                                        ⇄ {item.substitution_note}
                                                    </span>
                                                )}
                                                {isRemoved && (
                                                    <span className="dod-item-removed">Nicht verfügbar</span>
                                                )}
                                            </div>
                                            <span className="dod-item-qty">
                                                {displayQty} {item.weight_unit || "Stk"}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">payments</span>
                            Zahlung
                        </h3>
                        <div className="dod-content">
                            <p>
                                {order.payment_method === "cod"
                                    ? "💵 Barzahlung bei Lieferung"
                                    : order.payment_method === "bank_transfer"
                                        ? "🏦 Banküberweisung"
                                        : order.payment_method
                                            ? `💳 ${order.payment_method}`
                                            : "—"}
                            </p>
                            {order.payment_method === "cod" && (
                                <p className="dod-cod-amount">
                                    <strong>Zu kassieren: €{Number(order.total_price || 0).toFixed(2)}</strong>
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                {/* ═══ Footer ═══ */}
                <footer className="dod-footer">
                    {customer.phone && (
                        <a
                            href={`tel:${customer.phone}`}
                            className="dod-btn dod-btn-secondary"
                        >
                            <span className="material-symbols-outlined">call</span>
                            Anrufen
                        </a>
                    )}
                    <button className="dod-btn dod-btn-primary" onClick={onClose}>
                        Schließen
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}