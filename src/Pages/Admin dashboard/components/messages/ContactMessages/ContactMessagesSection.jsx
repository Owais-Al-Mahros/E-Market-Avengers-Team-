import { useState, useMemo } from "react";
import { useMessages } from "../../../../../context/MessagesContext";
import ContactMessageCard from "./ContactMessageCard";
import ContactMessageModal from "./ContactMessageModal";
import "./ContactMessagesSection.css";

const FILTERS = [
    { key: "pending", label: "Pending", icon: "⏳" },
    { key: "read", label: "Read", icon: "👁️" },
    { key: "replied", label: "Replied", icon: "✅" },
    { key: "all", label: "All", icon: "📋" },
];

export default function ContactMessagesSection() {
    const { messages, loading, error, counts, refresh } = useMessages();
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);

    const filtered = useMemo(() => {
        if (filter === "all") return messages;
        return messages.filter((m) => m.status === filter);
    }, [messages, filter]);

    if (error) {
        return (
            <div className="cmsg-section">
                <div className="cmsg-error">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button
                        type="button"
                        className="cmsg-retry-btn"
                        onClick={refresh}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cmsg-section">
            <header className="cmsg-header">
                <div>
                    <h3>
                        <span className="material-symbols-outlined">mail</span>
                        Contact Messages
                    </h3>
                    <p>Messages from customers and visitors</p>
                </div>
                {counts.pending > 0 && (
                    <span className="cmsg-badge-new">{counts.pending} new</span>
                )}
            </header>

            <div className="cmsg-filters">
                {FILTERS.map((f) => {
                    const count = counts[f.key] ?? 0;
                    return (
                        <button
                            key={f.key}
                            type="button"
                            className={`cmsg-filter-btn ${filter === f.key ? "active" : ""
                                }`}
                            onClick={() => setFilter(f.key)}
                        >
                            <span>{f.label}</span>
                            {count > 0 && (
                                <span className="cmsg-filter-count">{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="cmsg-state">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="cmsg-state">
                    <span className="material-symbols-outlined">inbox</span>
                    <p>No messages found</p>
                </div>
            ) : (
                <div className="cmsg-list">
                    {filtered.map((msg) => (
                        <ContactMessageCard
                            key={msg.id}
                            message={msg}
                            onClick={() => setSelected(msg)}
                        />
                    ))}
                </div>
            )}

            {selected && (
                <ContactMessageModal
                    message={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}