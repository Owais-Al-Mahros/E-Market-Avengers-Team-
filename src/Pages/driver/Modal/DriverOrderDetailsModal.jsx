import { createPortal } from "react-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatEuro, formatWeight } from "../../../lib/format";
import { toBaseUnit } from "../../../lib/units";

import "./DriverOrderDetailsModal.css";

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */
const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const getUrgency = (dateStr) => {
    if (!dateStr) return null;
    const delivery = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((delivery - today) / 86400000);

    if (diff < 0) return { label: "Überfällig", class: "overdue" };
    if (diff === 0) return { label: "Heute", class: "today" };
    if (diff === 1) return { label: "Morgen", class: "tomorrow" };
    if (diff <= 3) return { label: `In ${diff} Tagen`, class: "soon" };
    return { label: `In ${diff} Tagen`, class: "later" };
};

const ITEM_STATUS = {
    pending: { icon: "⏳", label: "Ausstehend", class: "pending" },
    scanned: { icon: "✓", label: "Geladen", class: "scanned" },
    substituted: { icon: "⇄", label: "Ersetzt", class: "substituted" },
    removed: { icon: "✕", label: "Nicht verfügbar", class: "removed" },
};

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */
export default function DriverOrderDetailsModal({ order, onClose }) {
    const [copied, setCopied] = useState(null);

    if (!order) return null;

    const customer = order.customer_info || {};
    const addr = order.shipping_address || {};
    const items = order.order_items || [];

    /* ═══ Total weight & items ═══ */
    // ✅ FIX: تحويل للوحدة الأساسية (kg / L) قبل الجمع
    const totalWeight = items
        .filter((i) => i.status !== "removed")
        .reduce((sum, item) => {
            const qty =
                parseFloat(item.actual_quantity ?? item.quantity) || 0;
            const unitWInBase = toBaseUnit(item.weight, item.weight_unit);
            return sum + unitWInBase * qty;
        }, 0);

    const totalItems = items
        .filter((i) => i.status !== "removed")
        .reduce((sum, item) => {
            const qty =
                parseFloat(item.actual_quantity ?? item.quantity) || 0;
            return sum + qty;
        }, 0);

    const urgency = getUrgency(order.delivery_date);

    /* ═══ Full address ═══ */
    const fullAddress = [
        `${addr.street || ""} ${addr.house_number || ""}`.trim(),
        `${addr.postal_code || ""} ${addr.city || ""}`.trim(),
    ]
        .filter(Boolean)
        .join(", ");

    /* ═══ Handlers ═══ */
    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            toast.success("Kopiert!");
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error("Kopieren fehlgeschlagen");
        }
    };

    const handleNavigate = () => {
        const query = encodeURIComponent(
            `${addr.street || ""} ${addr.house_number || ""}, ${addr.postal_code || ""
            } ${addr.city || ""}, Deutschland`
        );
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${query}`,
            "_blank"
        );
    };

    return createPortal(
        <div className="dod-overlay" onClick={onClose}>
            <div className="dod-modal" onClick={(e) => e.stopPropagation()}>
                {/* ═══════════════════════════════════════════
                    HEADER
                ═══════════════════════════════════════════ */}
                <header className="dod-header">
                    <div className="dod-header-left">
                        <span className="material-symbols-outlined dod-header-icon">
                            receipt_long
                        </span>
                        <div>
                            <h2>Bestelldetails</h2>
                            <button
                                type="button"
                                className="dod-order-number"
                                onClick={() =>
                                    copyToClipboard(
                                        order.order_number,
                                        "order"
                                    )
                                }
                                title="Bestellnummer kopieren"
                            >
                                #{order.order_number}
                                <span className="material-symbols-outlined">
                                    {copied === "order"
                                        ? "check"
                                        : "content_copy"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="dod-header-right">
                        <span
                            className={`dod-status dod-status-${order.status}`}
                        >
                            {order.status}
                        </span>
                        <button
                            className="dod-close"
                            onClick={onClose}
                            aria-label="Schließen"
                        >
                            <span className="material-symbols-outlined">
                                close
                            </span>
                        </button>
                    </div>
                </header>

                {/* ═══════════════════════════════════════════
                    BODY
                ═══════════════════════════════════════════ */}
                <div className="dod-body">
                    {/* ═══ Delivery Time Banner ═══ */}
                    {order.delivery_date && (
                        <section
                            className={`dod-banner dod-banner-${urgency?.class || "default"
                                }`}
                        >
                            <div className="dod-banner-icon">
                                <span className="material-symbols-outlined">
                                    schedule
                                </span>
                            </div>
                            <div className="dod-banner-content">
                                <span className="dod-banner-label">
                                    Liefertermin
                                </span>
                                <strong className="dod-banner-date">
                                    {fmtDate(order.delivery_date)}
                                </strong>
                                {order.delivery_time && (
                                    <span className="dod-banner-time">
                                        <span className="material-symbols-outlined">
                                            alarm
                                        </span>
                                        {order.delivery_time.slice(0, 5)} Uhr
                                    </span>
                                )}
                            </div>
                            {urgency && (
                                <span
                                    className={`dod-banner-badge dod-banner-badge-${urgency.class}`}
                                >
                                    {urgency.label}
                                </span>
                            )}
                        </section>
                    )}

                    {/* ═══ Quick Actions ═══ */}
                    <section className="dod-actions-grid">
                        {customer.phone && (
                            <a
                                href={`tel:${customer.phone}`}
                                className="dod-action-btn dod-action-call"
                            >
                                <span className="material-symbols-outlined">
                                    call
                                </span>
                                <span>Anrufen</span>
                            </a>
                        )}
                        <button
                            type="button"
                            className="dod-action-btn dod-action-nav"
                            onClick={handleNavigate}
                        >
                            <span className="material-symbols-outlined">
                                navigation
                            </span>
                            <span>Navigieren</span>
                        </button>
                        <button
                            type="button"
                            className="dod-action-btn dod-action-copy"
                            onClick={() =>
                                copyToClipboard(fullAddress, "address")
                            }
                        >
                            <span className="material-symbols-outlined">
                                {copied === "address"
                                    ? "check"
                                    : "content_copy"}
                            </span>
                            <span>
                                {copied === "address"
                                    ? "Kopiert"
                                    : "Adresse kopieren"}
                            </span>
                        </button>
                    </section>

                    {/* ═══ Summary Row ═══ */}
                    <section className="dod-summary-grid">
                        <div className="dod-summary-card">
                            <span className="material-symbols-outlined dod-summary-icon">
                                inventory_2
                            </span>
                            <div>
                                <strong>{totalItems}</strong>
                                <span>Artikel</span>
                            </div>
                        </div>
                        <div className="dod-summary-card">
                            <span className="material-symbols-outlined dod-summary-icon">
                                scale
                            </span>
                            <div>
                                <strong>{totalWeight.toFixed(2)} kg</strong>
                                <span>Gesamtgewicht</span>
                            </div>
                        </div>
                        <div className="dod-summary-card">
                            <span className="material-symbols-outlined dod-summary-icon">
                                payments
                            </span>
                            <div>
                                <strong>
                                    {order.payment_method === "card"
                                        ? "Karte"
                                        : order.payment_method === "cod"
                                            ? "Bar"
                                            : order.payment_method ===
                                                "bank_transfer"
                                                ? "Überweisung"
                                                : "—"}
                                </strong>
                                <span>Zahlung</span>
                            </div>
                        </div>
                    </section>

                    {/* ═══ Customer ═══ */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">
                                person
                            </span>
                            Kunde
                        </h3>
                        <div className="dod-content">
                            <p className="dod-strong">
                                {customer.first_name} {customer.last_name}
                            </p>
                            {customer.phone && (
                                <a
                                    href={`tel:${customer.phone}`}
                                    className="dod-link"
                                >
                                    <span className="material-symbols-outlined">
                                        call
                                    </span>
                                    {customer.phone}
                                </a>
                            )}
                            {customer.email && (
                                <a
                                    href={`mailto:${customer.email}`}
                                    className="dod-link"
                                >
                                    <span className="material-symbols-outlined">
                                        mail
                                    </span>
                                    {customer.email}
                                </a>
                            )}
                        </div>
                    </section>

                    {/* ═══ Address ═══ */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">
                                location_on
                            </span>
                            Lieferadresse
                        </h3>
                        <div className="dod-content">
                            <p className="dod-strong">
                                {addr.street} {addr.house_number}
                                <br />
                                {addr.postal_code} {addr.city}
                            </p>

                            <div className="dod-meta-grid">
                                {addr.floor !== undefined &&
                                    addr.floor !== null && (
                                        <div className="dod-meta">
                                            <span className="material-symbols-outlined">
                                                apartment
                                            </span>
                                            <div>
                                                <span className="dod-meta-label">
                                                    Etage
                                                </span>
                                                <strong>{addr.floor}</strong>
                                            </div>
                                        </div>
                                    )}
                                <div className="dod-meta">
                                    <span className="material-symbols-outlined">
                                        {addr.has_elevator
                                            ? "elevator"
                                            : "stairs"}
                                    </span>
                                    <div>
                                        <span className="dod-meta-label">
                                            Aufzug
                                        </span>
                                        <strong>
                                            {addr.has_elevator
                                                ? "Ja"
                                                : "Nein"}
                                        </strong>
                                    </div>
                                </div>
                                {addr.doorbell_name && (
                                    <div className="dod-meta">
                                        <span className="material-symbols-outlined">
                                            notifications_active
                                        </span>
                                        <div>
                                            <span className="dod-meta-label">
                                                Klingel
                                            </span>
                                            <strong>
                                                {addr.doorbell_name}
                                            </strong>
                                        </div>
                                    </div>
                                )}
                                {addr.apartment && (
                                    <div className="dod-meta">
                                        <span className="material-symbols-outlined">
                                            meeting_room
                                        </span>
                                        <div>
                                            <span className="dod-meta-label">
                                                Wohnung
                                            </span>
                                            <strong>{addr.apartment}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {addr.notes && (
                                <div className="dod-note">
                                    <span className="material-symbols-outlined">
                                        sticky_note_2
                                    </span>
                                    <div>
                                        <span className="dod-note-label">
                                            Kundennotiz
                                        </span>
                                        <p>{addr.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ═══ Items ═══ */}
                    {/* ═══ Items ═══ */}
                    <section className="dod-section">
                        <h3 className="dod-title">
                            <span className="material-symbols-outlined">
                                inventory_2
                            </span>
                            Produkte ({items.length})
                        </h3>
                        <div className="dod-items">
                            {items.length === 0 ? (
                                <p className="dod-empty">
                                    Keine Produkte
                                </p>
                            ) : (
                                items.map((item, idx) => {
                                    const status =
                                        ITEM_STATUS[item.status] ||
                                        ITEM_STATUS.pending;
                                    const isRemoved = item.status === "removed";
                                    const displayQty =
                                        parseFloat(
                                            item.actual_quantity ??
                                            item.quantity
                                        ) || 0;
                                    const unitW = parseFloat(item.weight) || 0;
                                    const totalW = displayQty * unitW;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`dod-item dod-item-${status.class}`}
                                        >
                                            <span className="dod-item-num">
                                                {idx + 1}
                                            </span>

                                            <div className="dod-item-info">
                                                <div className="dod-item-name-row">
                                                    <span className="dod-item-name">
                                                        {item.product_name}
                                                    </span>
                                                    <span
                                                        className={`dod-item-status dod-item-status-${status.class}`}
                                                    >
                                                        {status.icon}
                                                    </span>
                                                </div>

                                                {/* ✅ FIX: رقم المنتج */}
                                                {item.product_number || item.product?.product_number ? (
                                                    <span className="dod-item-artnr">
                                                        Art.-Nr. {item.product_number || item.product?.product_number}
                                                    </span>
                                                ) : null}

                                                {item.substitution_note && (
                                                    <span className="dod-item-sub">
                                                        ⇄{" "}
                                                        {item.substitution_note}
                                                    </span>
                                                )}

                                                <div className="dod-item-meta">
                                                    <span className="dod-item-qty">
                                                        {displayQty}×
                                                    </span>
                                                    {unitW > 0 && (
                                                        <span className="dod-item-weight">
                                                            {formatWeight(
                                                                unitW,
                                                                item.weight_unit
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {!isRemoved && totalW > 0 && (
                                                <div className="dod-item-total">
                                                    <span className="dod-item-total-label">
                                                        Gesamt
                                                    </span>
                                                    <strong>
                                                        {formatWeight(
                                                            totalW,
                                                            item.weight_unit
                                                        )}
                                                    </strong>
                                                </div>
                                            )}

                                            {isRemoved && (
                                                <span className="dod-item-removed-label">
                                                    Entfernt
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                {/* ═══════════════════════════════════════════
                    FOOTER
                ═══════════════════════════════════════════ */}
                <footer className="dod-footer">
                    {customer.phone && (
                        <a
                            href={`tel:${customer.phone}`}
                            className="dod-btn dod-btn-secondary"
                        >
                            <span className="material-symbols-outlined">
                                call
                            </span>
                            Anrufen
                        </a>
                    )}
                    <button
                        className="dod-btn dod-btn-primary"
                        onClick={onClose}
                    >
                        Schließen
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}