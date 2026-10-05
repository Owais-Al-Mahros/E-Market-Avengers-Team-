import "./WiderrufRequestCard.css";

/**
 * Single withdrawal request card (list item).
 */
export default function WiderrufRequestCard({ request, onClick }) {
    const { orders, status, amendment_number, price_delta } = request;

    const customerName =
        `${orders?.customer_info?.first_name || ""} ${orders?.customer_info?.last_name || ""
            }`.trim() || "Unknown";

    const refundAmount = Math.abs(parseFloat(price_delta || 0));

    const statusLabel = {
        pending: "⏳ Pending",
        approved: "✅ Approved",
        rejected: "❌ Rejected",
    }[status] || status;

    return (
        <button
            type="button"
            className={`wf-card wf-card-${status}`}
            onClick={onClick}
        >
            <div className="wf-card-header">
                <span className="wf-card-id">{amendment_number}</span>
                <span className={`wf-status-badge status-${status}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="wf-card-body">
                <strong>{customerName}</strong>
                <span>{orders?.customer_info?.email}</span>
            </div>

            <div className="wf-card-meta">
                <span>#{orders?.order_number}</span>
                <span className="wf-amount">€{refundAmount.toFixed(2)}</span>
            </div>
        </button>
    );
}