import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
    fetchAllViolations,
    closeViolation,
    escalateViolation,
} from "../../../../api/haccp";
import { formatDateTimeDE as formatDateTime } from "../../../../lib/haccpHelpers";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import ViolationCloseModal from "./ViolationCloseModal";

const FILTERS = [
    { key: "pending", label: "⏳ Pending" },
    { key: "escalated", label: "🚨 Escalated" },
    { key: "resolved", label: "✅ Resolved" },
    { key: "all", label: "📋 All" },
];

export default function ViolationsPanel() {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [closeTarget, setCloseTarget] = useState(null);
    const [escalateTarget, setEscalateTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const status = filter === "all" ? null : filter;
        const res = await fetchAllViolations({ status });
        if (res.success) setViolations(res.data);
        else toast.error(res.error);
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleClose = async ({ corrective_action_keys, notes }) => {
        setProcessing(true);
        const res = await closeViolation(closeTarget.id, { corrective_action_keys, notes });
        setProcessing(false);

        if (res.success) {
            toast.success("✅ Violation closed");
            setCloseTarget(null);
            load();
        } else {
            toast.error(res.error);
        }
    };

    const handleEscalate = async () => {
        setProcessing(true);
        const res = await escalateViolation(escalateTarget.id);
        setProcessing(false);

        if (res.success) {
            toast.success("🚨 Violation escalated");
            setEscalateTarget(null);
            load();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div>
            <div className="haccp-filters-bar">
                <div className="haccp-filter-group">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            className={`haccp-filter-btn ${filter === f.key ? "active" : ""}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="haccp-count">
                    {violations.length} {violations.length === 1 ? "entry" : "entries"}
                </span>
            </div>

            {loading ? (
                <div className="haccp-state">
                    <div className="haccp-spinner" />
                    <p>Loading...</p>
                </div>
            ) : violations.length === 0 ? (
                <div className="haccp-state">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p>No violations in this category</p>
                </div>
            ) : (
                <div className="haccp-timeline">
                    {violations.map((v) => (
                        <ViolationCard
                            key={v.id}
                            violation={v}
                            onClose={() => setCloseTarget(v)}
                            onEscalate={() => setEscalateTarget(v)}
                        />
                    ))}
                </div>
            )}

            {closeTarget && (
                <ViolationCloseModal
                    violation={closeTarget}
                    onClose={() => setCloseTarget(null)}
                    onSubmit={handleClose}
                    processing={processing}
                />
            )}

            {escalateTarget && (
                <ConfirmDialog
                    isOpen={true}
                    title="Escalate violation?"
                    message="The violation will be marked as escalated. Please contact the driver."
                    variant="warning"
                    icon="priority_high"
                    confirmLabel="Escalate"
                    cancelLabel="Cancel"
                    isLoading={processing}
                    onConfirm={handleEscalate}
                    onCancel={() => setEscalateTarget(null)}
                />
            )}
        </div>
    );
}

function ViolationCard({ violation, onClose, onEscalate }) {
    const v = violation;
    const isCritical = v.severity === "critical";
    const isPending = v.status === "pending";
    const isEscalated = v.status === "escalated";
    const isResolved = v.status === "resolved";

    const statusClass = isResolved ? "ok" : isEscalated ? "fail" : isPending ? "warn" : "info";
    const statusLabel = isResolved ? "Resolved" : isEscalated ? "Escalated" : "Pending";

    return (
        <article className={`haccp-record ${statusClass}`}>
            <div className="haccp-record-icon">{isCritical ? "🚨" : "⚠️"}</div>

            <div className="haccp-record-content">
                <div className="haccp-record-head">
                    <span className="haccp-record-type">
                        {isCritical ? "Critical Violation" : "Violation"}
                    </span>
                    <span className="haccp-record-time">{formatDateTime(v.created_at)}</span>
                </div>

                <span className="haccp-record-driver">
                    <span className="material-symbols-outlined">person</span>
                    {v.driver?.name || "—"}
                </span>

                <span className="haccp-record-title">{v.violation_type}</span>

                {v.order?.order_number && (
                    <span className="haccp-record-subtitle">
                        Order #{v.order.order_number}
                    </span>
                )}

                {v.corrective_action_taken && (
                    <span className="haccp-record-subtitle">
                        Action: {v.corrective_action_taken}
                    </span>
                )}

                <div className="haccp-record-badges">
                    <span className={`haccp-badge ${statusClass}`}>{statusLabel}</span>

                    {isPending && (
                        <>
                            <button
                                type="button"
                                className="haccp-toggle-btn"
                                onClick={onClose}
                                style={{ background: "#10b981", color: "#fff", borderColor: "#10b981" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    check_circle
                                </span>
                                <span>Close</span>
                            </button>

                            <button
                                type="button"
                                className="haccp-toggle-btn"
                                onClick={onEscalate}
                                style={{ background: "#f59e0b", color: "#fff", borderColor: "#f59e0b" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    priority_high
                                </span>
                                <span>Escalate</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}