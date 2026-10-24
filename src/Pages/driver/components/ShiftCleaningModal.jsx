import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { saveShiftCleaning } from "../../../api/haccp";
import "./ShiftSummaryModal.css";

export default function ShiftCleaningModal({ onClose, onSuccess }) {
    const [isCleaned, setIsCleaned] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!isCleaned) return toast.error("Bitte bestätigen Sie die Reinigung.");
        setLoading(true);
        const res = await saveShiftCleaning({ is_cleaned: isCleaned, notes });
        if (res.success) {
            toast.success("Tour erfolgreich beendet!");
            onSuccess();
        } else {
            toast.error(res.error);
            setLoading(false);
        }
    };

    return createPortal(
        <div className="shift-sum-overlay" onClick={onClose}>
            <div className="shift-sum-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto' }}>
                <header className="shift-sum-header" style={{ background: 'linear-gradient(135deg, #145c4a, #0f4a3b)' }}>
                    <div>
                        <h2 style={{ color: '#fff' }}>Tour beenden</h2>
                        <p style={{ color: '#b9e769' }}>Bitte reinigen Sie das Fahrzeug vor Feierabend.</p>
                    </div>
                    <button onClick={onClose} className="shift-sum-close">✕</button>
                </header>
                <div className="shift-sum-body" style={{ padding: '24px' }}>
                    <div style={{ background: '#f0f7f4', padding: '16px', borderRadius: '12px', border: '1px solid #ddf4ea' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isCleaned}
                                onChange={e => setIsCleaned(e.target.checked)}
                                style={{ width: '20px', height: '20px', accentColor: '#145c4a', marginTop: '2px' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#15312b' }}>
                                Transportbereich und verwendete Boxen gemäß Reinigungsplan gereinigt und kontrolliert.
                            </span>
                        </label>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#6b7a77', textTransform: 'uppercase' }}>Bemerkungen (optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="z.B. Box 2 beschädigt..."
                            style={{ padding: '12px', border: '2px solid #e1ebe7', borderRadius: '10px', outline: 'none' }}
                        />
                    </div>
                </div>
                <footer style={{ padding: '20px', display: 'flex', gap: '10px', borderTop: '1px solid #ddf4ea' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#f0f7f4', color: '#145c4a', fontWeight: 'bold', cursor: 'pointer' }}>Abbrechen</button>
                    <button onClick={handleSubmit} disabled={loading || !isCleaned} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#145c4a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: (!isCleaned || loading) ? 0.5 : 1 }}>
                        {loading ? "..." : "Bestätigen"}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}