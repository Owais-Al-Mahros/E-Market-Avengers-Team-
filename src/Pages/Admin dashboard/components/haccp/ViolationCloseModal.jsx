import { useState } from "react";
import { createPortal } from "react-dom";
import { useHaccp } from "../../../../context/HaccpContext";

/* تنسيق مفتاح الإجراء التصحيحي إلى نص مقروء */
function formatActionKey(key) {
    return String(key || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ViolationCloseModal({ violation, onClose, onSubmit, processing }) {
    const { correctiveActions } = useHaccp();
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [notes, setNotes] = useState("");

    const toggle = (key) =>
        setSelectedKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );

    const canSubmit = selectedKeys.length > 0 && notes.trim().length >= 3;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({ corrective_action_keys: selectedKeys, notes: notes.trim() });
    };

    return createPortal(
        <div className="haccp-modal-overlay" onClick={onClose}>
            <div className="haccp-modal" onClick={(e) => e.stopPropagation()}>
                <div className="haccp-modal-head">
                    <div>
                        <h3>Close Violation</h3>
                        <p style={{ fontSize: 12, color: "#b9e769", margin: "4px 0 0", fontFamily: "Courier New, monospace" }}>
                            {violation.violation_type} · {violation.driver?.name || "—"}
                        </p>
                    </div>
                    <button className="haccp-modal-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="haccp-modal-body">
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#15312b",
                                textTransform: "uppercase",
                                marginBottom: 8,
                            }}
                        >
                            Corrective Actions *
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {correctiveActions.map((a) => {
                                const active = selectedKeys.includes(a.key);
                                return (
                                    <button
                                        key={a.key}
                                        type="button"
                                        onClick={() => toggle(a.key)}
                                        style={{
                                            padding: "8px 14px",
                                            background: active ? "#145c4a" : "#f7faf8",
                                            color: active ? "#fff" : "#15312b",
                                            border: `1.5px solid ${active ? "#145c4a" : "#ddf4ea"}`,
                                            borderRadius: 20,
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        {active ? "✓ " : ""}
                                        {formatActionKey(a.key)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#15312b",
                                textTransform: "uppercase",
                                marginBottom: 8,
                            }}
                        >
                            Notes *
                        </label>
                        <textarea
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the actions taken..."
                            maxLength={500}
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                border: "2px solid #e1ebe7",
                                borderRadius: 10,
                                fontFamily: "inherit",
                                fontSize: 14,
                                resize: "vertical",
                                boxSizing: "border-box",
                            }}
                        />
                        <div style={{ fontSize: 11, color: "#6b7a77", textAlign: "right", marginTop: 4 }}>
                            {notes.length} / 500
                        </div>
                    </div>
                </div>

                <div className="haccp-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        style={{
                            flex: 1,
                            padding: "14px 20px",
                            background: "#fff",
                            color: "#145c4a",
                            border: "2px solid #ddf4ea",
                            borderRadius: 12,
                            fontSize: 14.5,
                            fontWeight: 800,
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing || !canSubmit}
                        style={{
                            flex: 1,
                            padding: "14px 20px",
                            background: "#145c4a",
                            color: "#fff",
                            border: "none",
                            borderRadius: 12,
                            fontSize: 14.5,
                            fontWeight: 800,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                            opacity: canSubmit && !processing ? 1 : 0.5,
                            fontFamily: "inherit",
                        }}
                    >
                        {processing ? "Closing..." : "Close Violation"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}