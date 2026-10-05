import { useState } from "react";
import { useWiderruf } from "../../../../../context/WiderrufContext";
import WiderrufRequestCard from "./WiderrufRequestCard";
import WiderrufRequestModal from "./WiderrufRequestModal";
import "./WiderrufRequestsSection.css";

const FILTERS = [
    { key: "pending", label: "⏳ Pending" },
    { key: "approved", label: "✅ Approved" },
    { key: "rejected", label: "❌ Rejected" },
    { key: "all", label: "📋 All" },
];

export default function WiderrufRequestsSection() {
    const { requests, loading, error, counts, fetchRequests } = useWiderruf();
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);

    /* ═══ Filtered list ═══ */
    const filtered =
        filter === "all"
            ? requests
            : requests.filter((r) => r.status === filter);

    /* ═══ Modal close → close + clear ═══ */
    const handleCloseModal = () => setSelected(null);

    /* ═══ Error state ═══ */
    if (error) {
        return (
            <div className="wf-section">
                <div className="wf-error">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button
                        type="button"
                        className="wf-retry-btn"
                        onClick={fetchRequests}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="wf-section">
            {/* ═══ Header ═══ */}
            <div className="wf-header">
                <div>
                    <h3>
                        <span className="material-symbols-outlined">assignment_return</span>
                        Withdrawal Requests
                    </h3>
                    <p>Customer returns under § 355 BGB</p>
                </div>
                {counts.pending > 0 && (
                    <span className="wf-badge-new">
                        {counts.pending} new
                    </span>
                )}
            </div>

            {/* ═══ Filters ═══ */}
            <div className="wf-filters">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        className={`wf-filter-btn ${filter === f.key ? "active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {counts[f.key] > 0 && (
                            <span className="wf-filter-count">
                                {counts[f.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ List ═══ */}
            {loading ? (
                <div className="wf-state">Loading requests...</div>
            ) : filtered.length === 0 ? (
                <div className="wf-state">
                    <span className="material-symbols-outlined">inbox</span>
                    <p>No requests found</p>
                </div>
            ) : (
                <div className="wf-list">
                    {filtered.map((req) => (
                        <WiderrufRequestCard
                            key={req.id}
                            request={req}
                            onClick={() => setSelected(req)}
                        />
                    ))}
                </div>
            )}

            {/* ═══ Detail Modal ═══ */}
            {selected && (
                <WiderrufRequestModal
                    request={selected}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}