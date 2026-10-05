// ==========================================================
// 📚 FAQ — Helpers & Constants (Admin-facing)
// ==========================================================

export const FAQ_CATEGORIES = [
    { key: "general", label: "General", icon: "help" },
    { key: "delivery", label: "Delivery", icon: "local_shipping" },
    { key: "payment", label: "Payment", icon: "credit_card" },
    { key: "returns", label: "Returns & Withdrawal", icon: "assignment_return" },
    { key: "products", label: "Products", icon: "inventory_2" },
    { key: "account", label: "Account", icon: "person" },
];

export function getFaqCategory(key) {
    return FAQ_CATEGORIES.find((c) => c.key === key) || FAQ_CATEGORIES[0];
}

export function groupFaqByCategory(items) {
    const groups = {};
    items.forEach((item) => {
        const cat = item.category || "general";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });
    return groups;
}

export function sortFaqItems(items) {
    return [...items].sort((a, b) => {
        if (a.display_order !== b.display_order)
            return a.display_order - b.display_order;
        return a.question.localeCompare(b.question);
    });
}

export function filterFaqBySearch(items, term) {
    const t = String(term || "").trim().toLowerCase();
    if (!t) return items;
    return items.filter(
        (item) =>
            item.question.toLowerCase().includes(t) ||
            item.answer.toLowerCase().includes(t)
    );
}