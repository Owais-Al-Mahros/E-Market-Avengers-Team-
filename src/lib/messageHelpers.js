// ==========================================================
// 💬 Contact Messages — Helpers & Constants (Admin-facing)
// ==========================================================

export const MESSAGE_CATEGORIES = [
    { key: "general", label: "General Question", icon: "mail" },
    { key: "complaint", label: "Complaint", icon: "report" },
    { key: "request", label: "Request", icon: "support_agent" },
    { key: "feedback", label: "Feedback", icon: "rate_review" },
];

export const MESSAGE_STATUSES = {
    pending: { label: "Pending", class: "status-pending", icon: "⏳" },
    read: { label: "Read", class: "status-read", icon: "👁️" },
    replied: { label: "Replied", class: "status-replied", icon: "✅" },
    archived: { label: "Archived", class: "status-archived", icon: "📦" },
};

export function getMessageCategory(key) {
    return MESSAGE_CATEGORIES.find((c) => c.key === key) || MESSAGE_CATEGORIES[0];
}

export function getMessageStatus(key) {
    return MESSAGE_STATUSES[key] || MESSAGE_STATUSES.pending;
}

export function formatMessageDate(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function countByStatus(messages) {
    const counts = { pending: 0, read: 0, replied: 0, archived: 0, all: 0 };
    messages.forEach((m) => {
        counts.all++;
        if (counts[m.status] !== undefined) counts[m.status]++;
    });
    return counts;
}