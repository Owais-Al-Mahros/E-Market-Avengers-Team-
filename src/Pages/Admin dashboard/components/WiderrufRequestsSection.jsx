import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import "./WiderrufRequestsSection.css";

export default function WiderrufRequestsSection() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState("pending");
    const [processing, setProcessing] = useState(false);

    // ============================================
    // Fetch
    // ============================================
    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("order_amendments")
            .select(`
                *,
                orders:order_id (
                    order_number,
                    customer_info,
                    total_price,
                    payment_method,
                    payment_intent_id
                )
            `)
            .eq("amendment_type", "widerruf")
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            toast.error("Failed to load requests");
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // ============================================
    // Approve / Reject
    // ============================================
    const handleAction = async (action) => {
        if (!selected) return;

        let rejectionReason = "";
        if (action === "reject") {
            rejectionReason = window.prompt(
                "Reason for rejection:\n\n" +
                "Example: 'Perishable products are excluded from the right of withdrawal (§ 312g Abs. 2 Nr. 2 BGB).'",
                "The right of withdrawal is legally excluded for the ordered products."
            );
            if (rejectionReason === null) return;
            if (!rejectionReason.trim()) {
                toast.error("Please provide a reason");
                return;
            }
        } else {
            const ok = window.confirm(
                `Confirm withdrawal?\n\n` +
                `Refund amount: €${Math.abs(parseFloat(selected.price_delta || 0)).toFixed(2)}\n\n` +
                `⚠️ The refund will be processed in Stripe.`
            );
            if (!ok) return;
        }

        setProcessing(true);
        const toastId = toast.loading(
            action === "approve"
                ? "Processing refund..."
                : "Rejecting request..."
        );

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-widerruf`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        amendmentId: selected.id,
                        action,
                        rejectionReason,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                toast.error(result.error, { id: toastId });
                return;
            }

            if (action === "approve") {
                toast.success(
                    `✅ Refunded: €${result.refund_amount.toFixed(2)}\n` +
                    `${result.stripe_refund_id ? `Stripe: ${result.stripe_refund_id}` : ""}`,
                    { id: toastId, duration: 8000 }
                );
            } else {
                toast.success("✅ Request rejected", { id: toastId });
            }

            setSelected(null);
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error("Connection error", { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    // ============================================
    // Filter
    // ============================================
    const filtered = requests.filter((r) => {
        if (filter === "all") return true;
        return r.status === filter;
    });

    const counts = {
        all: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    };

    return (
        <div className="wf-section">
            {/* Header */}
            <div className="wf-header">
                <div>
                    <h3>↩️ Withdrawal Requests</h3>
                    <p>Customer returns under § 355 BGB</p>
                </div>
                {counts.pending > 0 && (
                    <span className="wf-badge-new">{counts.pending} new</span>
                )}
            </div>

            {/* Filters */}
            <div className="wf-filters">
                {[
                    { key: "pending", label: "⏳ Pending" },
                    { key: "approved", label: "✅ Approved" },
                    { key: "rejected", label: "❌ Rejected" },
                    { key: "all", label: "📋 All" },
                ].map((f) => (
                    <button
                        key={f.key}
                        className={`wf-filter-btn ${filter === f.key ? "active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {counts[f.key] > 0 && (
                            <span className="wf-filter-count">{counts[f.key]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
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
                        <div
                            key={req.id}
                            className={`wf-card wf-card-${req.status}`}
                            onClick={() => setSelected(req)}
                        >
                            <div className="wf-card-header">
                                <span className="wf-card-id">
                                    {req.amendment_number}
                                </span>
                                <span className={`wf-status-badge status-${req.status}`}>
                                    {req.status === "pending"
                                        ? "⏳ Pending"
                                        : req.status === "approved"
                                            ? "✅ Approved"
                                            : "❌ Rejected"}
                                </span>
                            </div>
                            <div className="wf-card-body">
                                <strong>
                                    {req.orders?.customer_info?.first_name}{" "}
                                    {req.orders?.customer_info?.last_name}
                                </strong>
                                <span>{req.orders?.customer_info?.email}</span>
                            </div>
                            <div className="wf-card-meta">
                                <span>#{req.orders?.order_number}</span>
                                <span className="wf-amount">
                                    €{Math.abs(parseFloat(req.price_delta || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="wf-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="wf-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wf-modal-header">
                            <h2>
                                Withdrawal {selected.amendment_number}
                            </h2>
                            <button
                                className="wf-modal-close"
                                onClick={() => setSelected(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="wf-modal-body">
                            {/* Customer */}
                            <div className="wf-info-block">
                                <strong>Customer</strong>
                                <p>
                                    {selected.orders?.customer_info?.first_name}{" "}
                                    {selected.orders?.customer_info?.last_name}
                                    <br />
                                    {selected.orders?.customer_info?.email}
                                </p>
                            </div>

                            {/* Order */}
                            <div className="wf-info-block">
                                <strong>Order</strong>
                                <p>#{selected.orders?.order_number}</p>
                            </div>

                            {/* Items */}
                            <div className="wf-info-block">
                                <strong>
                                    Products ({selected.items_snapshot?.returned_items?.length || 0})
                                </strong>
                                <div className="wf-items-list">
                                    {(selected.items_snapshot?.returned_items || []).map(
                                        (item, idx) => (
                                            <div key={idx} className="wf-item-row">
                                                <span>{item.product_name}</span>
                                                <span className="wf-item-qty">{item.quantity}×</span>
                                                <span className="wf-item-price">
                                                    €{parseFloat(item.total_price || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Reason */}
                            {selected.items_snapshot?.reason && (
                                <div className="wf-info-block">
                                    <strong>Reason</strong>
                                    <p>{selected.items_snapshot.reason}</p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {selected.rejection_reason && (
                                <div className="wf-info-block">
                                    <strong>Rejection Reason</strong>
                                    <p>{selected.rejection_reason}</p>
                                </div>
                            )}

                            {/* Amount */}
                            <div className="wf-amount-box">
                                <span>Refund Amount</span>
                                <strong>
                                    €{Math.abs(parseFloat(selected.price_delta || 0)).toFixed(2)}
                                </strong>
                            </div>

                            {/* Stripe Refund ID (if approved) */}
                            {selected.stripe_refund_id && (
                                <div className="wf-info-block">
                                    <strong>Stripe Refund ID</strong>
                                    <p style={{ fontFamily: "monospace", fontSize: "13px" }}>
                                        {selected.stripe_refund_id}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {selected.status === "pending" && (
                            <div className="wf-modal-actions">
                                <button
                                    className="wf-btn wf-btn-reject"
                                    onClick={() => handleAction("reject")}
                                    disabled={processing}
                                >
                                    ❌ Reject
                                </button>
                                <button
                                    className="wf-btn wf-btn-approve"
                                    onClick={() => handleAction("approve")}
                                    disabled={processing}
                                >
                                    {processing ? "Processing..." : "✅ Approve & Refund"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}