import { useEffect, useState } from "react";
import { canStartRound } from "../../../api/haccp";
import "./RoundGateBanner.css";

export default function RoundGateBanner({ onStatusChange }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await canStartRound();
            if (res.success) {
                setStatus(res.data);
                onStatusChange?.(res.data);
            }
            setLoading(false);
        })();
    }, [onStatusChange]);

    if (loading || !status) return null;
    if (status.allowed) return null; // لا banner إذا الجولة مسموحة

    return (
        <div className="rgate rgate-blocked">
            <div className="rgate-icon">🚫</div>
            <div className="rgate-content">
                <strong>Tour kann nicht gestartet werden</strong>
                <ul>
                    {status.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                    ))}
                </ul>
                <span className="rgate-hint">
                    Bitte beheben Sie die Probleme im HACCP-Tab, bevor Sie die Tour beginnen.
                </span>
            </div>
        </div>
    );
}