/* ==========================================
   📋 ORDER STATUS — Helpers موحّدة
   ========================================== */

/* ═══════════════════════════════════════════
   Status Flow — ما هي الانتقالات المسموحة
   ═══════════════════════════════════════════ */
export const STATUS_FLOW = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "pending", "cancelled"],
    shipped: ["delivered", "confirmed", "cancelled"],
    delivered: ["shipped"],
    cancelled: ["confirmed"],
};

export function canUpdateTo(currentStatus, targetStatus) {
    return STATUS_FLOW[currentStatus]?.includes(targetStatus) || false;
}

/* ═══════════════════════════════════════════
   Status Labels & Classes
   ═══════════════════════════════════════════ */
export const STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

/* ═══════════════════════════════════════════
   Item Status (inside order_items)
   ═══════════════════════════════════════════ */
export const ITEM_STATUS = {
    pending: { icon: "⏳", label: "Pending", class: "pending" },
    scanned: { icon: "✓", label: "OK", class: "scanned" },
    substituted: { icon: "⇄", label: "Sub.", class: "substituted" },
    removed: { icon: "✕", label: "Removed", class: "removed" },
};

export function getItemStatusBadge(status) {
    return ITEM_STATUS[status] || { icon: "•", label: status, class: "default" };
}

/* ═══════════════════════════════════════════
   Delivery Formatting & Urgency
   ═══════════════════════════════════════════ */
export function formatDeliveryDate(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function getDeliveryUrgency(order) {
    if (!order?.delivery_date) return null;

    const deliveryDate = new Date(`${order.delivery_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
        (deliveryDate - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { label: "Überfällig", class: "overdue" };
    if (diffDays === 0) return { label: "Heute", class: "today" };
    if (diffDays === 1) return { label: "Morgen", class: "tomorrow" };
    if (diffDays <= 3) return { label: `In ${diffDays} Tagen`, class: "soon" };
    return { label: `In ${diffDays} Tagen`, class: "later" };
}

/* ═══════════════════════════════════════════
   Sorting
   ═══════════════════════════════════════════ */
export function sortByDeliveryUrgency(orders) {
    return [...orders].sort((a, b) => {
        const da = a.delivery_date
            ? new Date(`${a.delivery_date}T${a.delivery_time || "00:00"}`)
            : new Date(8640000000000000);
        const db = b.delivery_date
            ? new Date(`${b.delivery_date}T${b.delivery_time || "00:00"}`)
            : new Date(8640000000000000);
        return da - db;
    });
}

export function sortOrderItemsByPriority(items) {
    const priority = { pending: 0, scanned: 1, substituted: 2, removed: 3 };
    return [...items].sort((a, b) => {
        const aP = priority[a.status] ?? 4;
        const bP = priority[b.status] ?? 4;
        if (aP !== bP) return aP - bP;
        return (b.total_weight || 0) - (a.total_weight || 0);
    });
}