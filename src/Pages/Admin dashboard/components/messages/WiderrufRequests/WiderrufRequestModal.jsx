import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useWiderruf } from "../../../../../context/WiderrufContext";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import RejectionDialog from "./RejectionDialog";
import "./WiderrufRequestModal.css";

export default function WiderrufRequestModal({ request, onClose }) {
    const { processRequest } = useWiderruf();

    const [processing, setProcessing] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    if (!request) return null;

    const customer = request.orders?.customer_info || {};
    const items = request.items_snapshot?.returned_items || [];
    const refundAmount = Math.abs(parseFloat(request.price_delta || 0));

    /* ═══ Approve ═══ */
    const handleApprove = async () => {
        setProcessing(true);
        const toastId = toast.loading("Processing refund...");

        const result = await processRequest({
            amendmentId: request.id,
            action: "approve",
        });

        if (result.success) {
            toast.success(
                `Refunded €${result.refund_amount?.toFixed(2) || refundAmount.toFixed(2)}`,
                { id: toastId, duration: 6000 }
            );
            setShowApproveConfirm(false);
            onClose();
        } else {
            toast.error(result.error || "Failed to process refund", {
                id: toastId,
            });
        }
        setProcessing(false);
    };

    /* ═══ Reject ═══ */
    const handleReject = async (reason) => {
        setProcessing(true);
        const toastId = toast.loading("Rejecting request...");

        const result = await processRequest({
            amendmentId: request.id,
            action: "reject",
            rejectionReason: reason,
        });

        if (result.success) {
            toast.success("Request rejected", { id: toastId });
            setShowRejectDialog(false);
            onClose();
        } else {
            toast.error(result.error || "Failed to reject", { id: toastId });
        }
        setProcessing(false);
    };

    return createPortal(
        <>
            <div className="wfm-overlay" onClick={onClose}>
                <div className="wfm-modal" onClick={(e) => e.stopPropagation()}>
                    {/* ═══ Header ═══ */}
                    <div className="wfm-header">
                        <div>
                            <h2>Withdrawal {request.amendment_number}</h2>
                            <p>Order #{request.orders?.order_number}</p>
                        </div>
                        <button className="wfm-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* ═══ Body ═══ */}
                    <div className="wfm-body">
                        {/* Customer */}
                        <div className="wfm-block">
                            <span className="wfm-label">Customer</span>
                            <strong>
                                {customer.first_name} {customer.last_name}
                            </strong>
                            <span className="wfm-sub">{customer.email}</span>
                        </div>

                        {/* Products */}
                        <div className="wfm-block">
                            <span className="wfm-label">
                                Products ({items.length})
                            </span>
                            <div className="wfm-items">
                                {items.map((item, idx) => (
                                    <div key={idx} className="wfm-item">
                                        <span className="wfm-item-name">
                                            {item.product_name}
                                        </span>
                                        <span className="wfm-item-qty">
                                            {item.quantity}×
                                        </span>
                                        <span className="wfm-item-price">
                                            €{parseFloat(item.total_price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reason */}
                        {request.items_snapshot?.reason && (
                            <div className="wfm-block">
                                <span className="wfm-label">Reason</span>
                                <p className="wfm-reason">
                                    {request.items_snapshot.reason}
                                </p>
                            </div>
                        )}

                        {/* Rejection reason (if rejected) */}
                        {request.rejection_reason && (
                            <div className="wfm-block">
                                <span className="wfm-label">Rejection Reason</span>
                                <p className="wfm-reason">{request.rejection_reason}</p>
                            </div>
                        )}

                        {/* Refund Amount */}
                        <div className="wfm-amount">
                            <span>Refund Amount</span>
                            <strong>€{refundAmount.toFixed(2)}</strong>
                        </div>

                        {/* Stripe Refund ID */}
                        {request.stripe_refund_id && (
                            <div className="wfm-block">
                                <span className="wfm-label">Stripe Refund ID</span>
                                <code className="wfm-code">
                                    {request.stripe_refund_id}
                                </code>
                            </div>
                        )}
                    </div>

                    {/* ═══ Actions (pending only) ═══ */}
                    {request.status === "pending" && (
                        <div className="wfm-actions">
                            <button
                                className="wfm-btn wfm-btn-reject"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={processing}
                            >
                                <span className="material-symbols-outlined">close</span>
                                Reject
                            </button>
                            <button
                                className="wfm-btn wfm-btn-approve"
                                onClick={() => setShowApproveConfirm(true)}
                                disabled={processing}
                            >
                                <span className="material-symbols-outlined">check</span>
                                Approve & Refund
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Approve Confirm ═══ */}
            <ConfirmDialog
                isOpen={showApproveConfirm}
                title="Approve withdrawal?"
                message={
                    <>
                        <p>
                            Refund <strong>€{refundAmount.toFixed(2)}</strong> to the
                            customer.
                        </p>
                        <p>
                            The refund will be processed in Stripe. This action cannot
                            be undone.
                        </p>
                    </>
                }
                variant="warning"
                icon="assignment_return"
                confirmLabel="Approve & Refund"
                cancelLabel="Cancel"
                isLoading={processing}
                onConfirm={handleApprove}
                onCancel={() => setShowApproveConfirm(false)}
            />

            {/* ═══ Reject Dialog ═══ */}
            <RejectionDialog
                isOpen={showRejectDialog}
                onClose={() => setShowRejectDialog(false)}
                onConfirm={handleReject}
                isLoading={processing}
                requestNumber={request.amendment_number}
            />
        </>,
        document.body
    );
}