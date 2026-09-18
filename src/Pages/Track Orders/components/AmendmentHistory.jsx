import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import "./AmendmentHistory.css";

export default function AmendmentHistory({ orderId }) {
    const [amendments, setAmendments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (!orderId) return;
            const { data, error } = await supabase
                .from("order_amendments")
                .select("*")
                .eq("order_id", orderId)
                .order("created_at", { ascending: true });

            if (!error) setAmendments(data || []);
            setLoading(false);
        };
        fetch();
    }, [orderId]);

    if (loading) {
        return (
            <div className="ah-container">
                <h3 className="ah-title">
                    <span className="material-symbols-outlined">history</span>
                    Verlauf
                </h3>
                <p className="ah-loading">Lade Verlauf...</p>
            </div>
        );
    }

    if (amendments.length === 0) return null;

    return (
        <div className="ah-container">
            <h3 className="ah-title">
                <span className="material-symbols-outlined">history</span>
                Verlauf ({amendments.length})
            </h3>

            <div className="ah-timeline">
                {amendments.map((amd) => {
                    const isWiderruf = amd.amendment_type === "widerruf";
                    const delta = parseFloat(amd.price_delta || 0);

                    return (
                        <div key={amd.id} className="ah-item">
                            <div className={`ah-dot ${isWiderruf ? "ah-dot-return" : "ah-dot-edit"}`}>
                                <span className="material-symbols-outlined">
                                    {isWiderruf ? "assignment_return" : "edit"}
                                </span>
                            </div>
                            <div className="ah-content">
                                <div className="ah-header">
                                    <span className="ah-number">{amd.amendment_number}</span>
                                    <span className="ah-date">
                                        {new Date(amd.created_at).toLocaleDateString("de-DE", {
                                            day: "2-digit",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <p className="ah-summary">
                                    {amd.changes_summary || (isWiderruf ? "Rückgabe" : "Änderung")}
                                </p>
                                <div className="ah-meta">
                                    <span className={`ah-badge ${amd.status === "pending" ? "ah-badge-pending" : "ah-badge-approved"}`}>
                                        {amd.status === "pending" ? "⏳ Ausstehend" : "✅ Bestätigt"}
                                    </span>
                                    {delta !== 0 && (
                                        <span className={`ah-delta ${delta >= 0 ? "ah-delta-up" : "ah-delta-down"}`}>
                                            {delta >= 0 ? "+" : ""}€{delta.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}