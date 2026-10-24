import { useState, useEffect, useCallback } from "react";
import { fetchAllShiftChecks, fetchAllCleaningLogs, fetchAllDriversList } from "../../../../api/haccp";
import "./HaccpSection.css";

const CHECK_LABELS = {
    area_clean: "Transportbereich sauber",
    no_odors: "Keine Gerüche/Schädlinge",
    no_damages: "Keine Beschädigungen",
    boxes_intact: "Boxen unbeschädigt",
    food_protected: "Lebensmittel geschützt",
    hygiene_ok: "Hygiene eingehalten",
};

export default function HaccpSection() {
    const [activeTab, setActiveTab] = useState("checks");
    const [data, setData] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchAllDriversList().then(res => {
            if (res.success) setDrivers(res.data);
        });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setExpandedId(null);
        const fetcher = activeTab === "checks" ? fetchAllShiftChecks : fetchAllCleaningLogs;
        const res = await fetcher({ driverId: selectedDriver || null });
        if (res.success) setData(res.data);
        setLoading(false);
    }, [activeTab, selectedDriver]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="haccp-admin-wrap">
            <header className="haccp-admin-header">
                <div>
                    <h2>🛡️ HACCP & Fahrerprotokolle</h2>
                    <p>Überwachen Sie die täglichen Checks und Reinigungsprotokolle der Fahrer</p>
                </div>
            </header>

            <nav className="haccp-admin-tabs">
                <button className={`haccp-admin-tab ${activeTab === "checks" ? "active" : ""}`} onClick={() => setActiveTab("checks")}>
                    <span className="material-symbols-outlined">fact_check</span> Tägliche Checks
                </button>
                <button className={`haccp-admin-tab ${activeTab === "cleaning" ? "active" : ""}`} onClick={() => setActiveTab("cleaning")}>
                    <span className="material-symbols-outlined">cleaning_services</span> Reinigungsprotokolle
                </button>
            </nav>

            <div className="haccp-filters-bar">
                <select className="haccp-select" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                    <option value="">Alle Fahrer</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <span className="haccp-count">{data.length} Einträge</span>
            </div>

            <div className="haccp-admin-content">
                {loading ? (
                    <div className="haccp-state"><div className="haccp-spinner" /><p>Lade Daten...</p></div>
                ) : data.length === 0 ? (
                    <div className="haccp-state"><span className="material-symbols-outlined">inbox</span><p>Keine Einträge gefunden.</p></div>
                ) : (
                    <div className="haccp-timeline">
                        {data.map(item => {
                            const isExpanded = expandedId === item.id;
                            return (
                                <article key={item.id} className="haccp-record ok">
                                    {/* رأس البطاقة */}
                                    <div className="haccp-record-header-row" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                        <div className="haccp-record-icon">{activeTab === "checks" ? "🚚" : "🧽"}</div>
                                        <div className="haccp-record-content">
                                            <div className="haccp-record-head">
                                                <span className="haccp-record-type">{activeTab === "checks" ? "Fahrercheck" : "Reinigung"}</span>
                                                <span className="haccp-record-time">{new Date(item.created_at).toLocaleString("de-DE")}</span>
                                            </div>
                                            <span className="haccp-record-driver">
                                                <span className="material-symbols-outlined">person</span>
                                                {item.driver?.name || "Unbekannt"}
                                            </span>
                                            {activeTab === "checks" ? (
                                                <span className="haccp-record-title">Fahrzeug: {item.vehicle_number} | Tour: {item.tour_number}</span>
                                            ) : (
                                                <span className="haccp-record-title">{item.is_cleaned ? "✅ Gereinigt" : "❌ Nicht gereinigt"}</span>
                                            )}
                                        </div>
                                        <span className="material-symbols-outlined haccp-chevron">
                                            {isExpanded ? "expand_less" : "expand_more"}
                                        </span>
                                    </div>

                                    {/* التفاصيل */}
                                    {isExpanded && (
                                        <div className="haccp-record-details">
                                            {activeTab === "checks" ? (
                                                <>
                                                    <h4 className="haccp-details-title">Prüfpunkte & Probleme</h4>
                                                    <div className="haccp-checks-list">
                                                        {Object.entries(CHECK_LABELS).map(([key, label]) => {
                                                            const val = item.checklist?.[key];
                                                            const note = item.checklist?.notes?.[key]; // جلب الملاحظة الخاصة بهذه النقطة

                                                            return (
                                                                <div key={key} className="haccp-check-block">
                                                                    {/* الصف الأساسي للنقطة */}
                                                                    <div className={`haccp-check-row ${val ? "is-ok" : "is-fail"}`}>
                                                                        <span className="material-symbols-outlined">
                                                                            {val ? "check_circle" : "cancel"}
                                                                        </span>
                                                                        <span className="haccp-check-text">{label}</span>
                                                                        <span className={`haccp-check-badge ${val ? "bg-ok" : "bg-fail"}`}>
                                                                            {val ? "Ja" : "Nein"}
                                                                        </span>
                                                                    </div>

                                                                    {!val && note && (
                                                                        <div className="haccp-check-problem">
                                                                            <span className="material-symbols-outlined">warning</span>
                                                                            <div>
                                                                                <strong>Problem / Notiz:</strong>
                                                                                <p>{note}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {item.has_cooling_boxes && item.cooling_boxes?.length > 0 && (
                                                        <>
                                                            <h4 className="haccp-details-title" style={{ marginTop: '24px' }}>Kühlgeräte & Temperatur</h4>
                                                            <div className="haccp-boxes-grid">
                                                                {item.cooling_boxes.map((box, idx) => (
                                                                    <div key={idx} className="haccp-box-card">
                                                                        <div className="haccp-box-header">
                                                                            <span className="haccp-box-name">Kühlbox {box.box_number}</span>
                                                                            <span className="haccp-box-temp">{box.actual_temp} °C</span>
                                                                        </div>
                                                                        <div className="haccp-box-status">
                                                                            <span>{box.device_working ? "✅ Gerät OK" : "❌ Gerät Defekt"}</span>
                                                                            <span>{box.temp_reached ? "✅ Temp OK" : "❌ Temp nicht erreicht"}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                // ... قسم التنظيف يبقى كما هو ...
                                                <div className="haccp-cleaning-details">
                                                    <p className="haccp-cleaning-status">
                                                        Status: <strong>{item.is_cleaned ? "✅ Erfolgreich gereinigt" : "❌ Fehlgeschlagen"}</strong>
                                                    </p>
                                                    {item.notes && (
                                                        <p className="haccp-cleaning-notes">
                                                            <strong>Notiz:</strong> {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}