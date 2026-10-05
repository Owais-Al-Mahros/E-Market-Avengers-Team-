import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./RejectionDialog.css";

const PRESET_REASONS = [
    {
        label: "Perishable products (§ 312g Abs. 2 Nr. 2 BGB)",
        value:
            "Perishable products are excluded from the right of withdrawal (§ 312g Abs. 2 Nr. 2 BGB).",
    },
    {
        label: "Sealed products — seal removed",
        value:
            "Sealed products that are not suitable for return due to health protection or hygiene reasons (seal was removed).",
    },
    {
        label: "Custom-made products",
        value: "Products made to customer specification.",
    },
];

/**
 * Reusable rejection dialog with preset reasons + custom input.
 */
export default function RejectionDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    requestNumber,
}) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setReason("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isValid = reason.trim().length >= 5;

    return createPortal(
        <div className="rj-overlay" onClick={onClose}>
            <div className="rj-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rj-header">
                    <span className="material-symbols-outlined">gavel</span>
                    <div>
                        <h3>Reject Withdrawal</h3>
                        <p>Request {requestNumber}</p>
                    </div>
                </div>

                <div className="rj-body">
                    <div className="rj-hint">
                        <span className="material-symbols-outlined">info</span>
                        <span>
                            Choose a preset reason or write a custom one. The
                            customer will see this message.
                        </span>
                    </div>

                    <div className="rj-presets">
                        {PRESET_REASONS.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                className={`rj-preset ${reason === preset.value ? "active" : ""}`}
                                onClick={() => setReason(preset.value)}
                                disabled={isLoading}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="rj-field">
                        <label>Reason *</label>
                        <textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why the withdrawal is rejected..."
                            disabled={isLoading}
                            maxLength={500}
                        />
                        <span className="rj-counter">
                            {reason.length} / 500
                        </span>
                    </div>
                </div>

                <div className="rj-actions">
                    <button
                        type="button"
                        className="rj-btn rj-btn-cancel"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rj-btn rj-btn-danger"
                        onClick={() => onConfirm(reason.trim())}
                        disabled={isLoading || !isValid}
                    >
                        {isLoading ? "Rejecting..." : "Reject Withdrawal"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}