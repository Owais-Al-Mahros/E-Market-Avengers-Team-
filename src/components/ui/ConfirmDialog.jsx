import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDialog.css";

/**
 * Custom confirm dialog — يستبدل window.confirm()
 *
 * @param {boolean} isOpen
 * @param {string} title
 * @param {node|string} message - نص أو JSX
 * @param {string} confirmLabel
 * @param {string} cancelLabel
 * @param {"default"|"warning"|"danger"} variant
 * @param {string} icon - material symbol name
 * @param {function} onConfirm
 * @param {function} onCancel
 * @param {boolean} isLoading
 */
export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Bestätigen",
    cancelLabel = "Abbrechen",
    variant = "default",
    icon = "help",
    onConfirm,
    onCancel,
    isLoading = false,
}) {
    // ✅ ESC لإغلاق
    useEffect(() => {
        if (!isOpen || isLoading) return;

        const handleEsc = (e) => {
            if (e.key === "Escape") onCancel?.();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, isLoading, onCancel]);

    // ✅ قفل scroll الصفحة
    useEffect(() => {
        if (!isOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = () => {
        if (!isLoading) onCancel?.();
    };

    return createPortal(
        <div className="cd-overlay" onClick={handleOverlayClick}>
            <div
                className={`cd-modal cd-modal-${variant}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cd-title"
            >
                <div className={`cd-icon cd-icon-${variant}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>

                <h3 id="cd-title" className="cd-title">
                    {title}
                </h3>

                {message && (
                    <div className="cd-message">
                        {typeof message === "string" ? <p>{message}</p> : message}
                    </div>
                )}

                <div className="cd-actions">
                    <button
                        type="button"
                        className="cd-btn cd-btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={`cd-btn cd-btn-confirm cd-btn-confirm-${variant}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="cd-spinner" />
                                Wird ausgeführt...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">{icon}</span>
                                {confirmLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}