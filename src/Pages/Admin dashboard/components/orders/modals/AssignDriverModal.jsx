import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { fetchAllDrivers } from "../../../../../api/drivers";
import "./AssignDriverModal.css";

export default function AssignDriverModal({ order, onClose, onConfirm, isConfirming }) {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetchAllDrivers();
            if (cancelled) return;
            if (res.success) setDrivers(res.data);
            else toast.error(res.error);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return drivers;
        return drivers.filter(
            (d) =>
                d.name?.toLowerCase().includes(term) ||
                d.email?.toLowerCase().includes(term)
        );
    }, [drivers, search]);

    const handleConfirm = () => {
        if (!selected) {
            toast.error("Bitte wählen Sie einen Fahrer aus.");
            return;
        }
        onConfirm(selected);
    };

    return createPortal(
        <div className="adm-driver-overlay" onClick={onClose}>
            <div className="adm-driver-modal" onClick={(e) => e.stopPropagation()}>
                <header className="adm-driver-head">
                    <div>
                        <h3>Fahrer zuweisen</h3>
                        <p>Bestellung #{order.order_number}</p>
                    </div>
                    <button className="adm-driver-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="adm-driver-body">
                    {loading ? (
                        <p className="adm-driver-state">Lade Fahrer...</p>
                    ) : drivers.length === 0 ? (
                        <div className="adm-driver-empty">
                            <span className="material-symbols-outlined">person_off</span>
                            <h4>Keine Fahrer verfügbar</h4>
                            <p>Fügen Sie zuerst einen Fahrer hinzu.</p>
                        </div>
                    ) : (
                        <>
                            <div className="adm-driver-search">
                                <span className="material-symbols-outlined">search</span>
                                <input
                                    type="text"
                                    placeholder="Fahrer suchen..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="adm-driver-list">
                                {filtered.map((d) => (
                                    <label
                                        key={d.id}
                                        className={`adm-driver-item ${selected === d.id ? "is-selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="driver"
                                            value={d.id}
                                            checked={selected === d.id}
                                            onChange={() => setSelected(d.id)}
                                        />
                                        <div className="adm-driver-avatar">
                                            {d.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div className="adm-driver-info">
                                            <strong>{d.name || "Fahrer"}</strong>
                                            <span>{d.email}</span>
                                            {d.phone && <span>📞 {d.phone}</span>}
                                        </div>
                                        {selected === d.id && (
                                            <span className="material-symbols-outlined adm-driver-check">
                                                check_circle
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <footer className="adm-driver-footer">
                    <button className="adm-driver-btn adm-driver-btn-secondary" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button
                        className="adm-driver-btn adm-driver-btn-primary"
                        onClick={handleConfirm}
                        disabled={!selected || isConfirming}
                    >
                        {isConfirming ? "Bestätige..." : "Bestätigen & Zuweisen"}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}