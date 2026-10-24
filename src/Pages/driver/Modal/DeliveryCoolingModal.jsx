import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

export default function DeliveryCoolingModal({ order, onClose, onConfirm, onSkip }) {
    const [temp, setTemp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = () => {
        if (!temp || isNaN(temp)) {
            toast.error("Bitte geben Sie eine gültige Temperatur ein.");
            return;
        }
        setIsSubmitting(true);
        onConfirm(parseFloat(temp));
    };

    const handleSkip = () => {
        setIsSubmitting(true);
        onSkip();
    };

    return createPortal(
        <div className="ship-modal-overlay" onClick={onClose}>
            <div className="ship-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="ship-modal-header">
                    <div className="ship-modal-header-left">
                        <span className="material-symbols-outlined ship-header-icon">ac_unit</span>
                        <h2>Temperatur prüfen</h2>
                    </div>
                </div>

                <div className="ship-modal-body" style={{ padding: '24px' }}>
                    <p style={{ marginBottom: '20px', fontSize: '15px', color: '#4a5b56' }}>
                        Dieser Auftrag (<strong>#{order.order_number}</strong>) enthält Kühlware.
                        Bitte messen Sie die Temperatur vor der Übergabe.
                    </p>

                    <div className="ship-field">
                        <label>Gemessene Temperatur (°C) *</label>
                        <div className="ship-input-wrap">
                            <input
                                type="number"
                                step="0.1"
                                value={temp}
                                onChange={(e) => setTemp(e.target.value)}
                                placeholder="z.B. 4.5"
                                autoFocus
                            />
                            <span className="ship-unit">°C</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #ddf4ea' }}>
                        <p style={{ fontSize: '12px', color: '#6b7a77', marginBottom: '10px' }}>
                            Wurde die Kühlware im Auto durch etwas anderes ersetzt?
                        </p>
                        <button
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Dieser Auftrag enthält tatsächlich keine Kühlware (Überspringen)
                        </button>
                    </div>
                </div>

                <div className="ship-modal-footer">
                    <button className="ship-btn-ship" onClick={handleConfirm} disabled={isSubmitting}>
                        <span className="material-symbols-outlined">check_circle</span>
                        {isSubmitting ? "Wird verarbeitet..." : "Zustellung bestätigen"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}