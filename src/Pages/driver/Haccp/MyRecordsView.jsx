// src/Pages/driver/Haccp/MyRecordsView.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchMyRecords } from "../../../api/haccp";
import "./MyRecordsView.css";

/* ══════════════════════════════════════════════════════════
   🎨 Metadata
   ══════════════════════════════════════════════════════════ */
const TYPE_META = {
    vehicle_check: { icon: "🚗", label: "Fahrzeugcheck" },
    temperature: { icon: "🌡️", label: "Temperatur" },
    cleaning: { icon: "🧽", label: "Reinigung" },
    product_check: { icon: "📦", label: "Produktprüfung" },
    cooling_check: { icon: "❄️", label: "Kühlgeräte" },
    violation: { icon: "⚠️", label: "Verstoß" },
};

const STATUS_META = {
    passed: { label: "Bestanden", class: "ok" },
    failed: { label: "Fehlgeschlagen", class: "fail" },
    compliant: { label: "Konform", class: "ok" },
    non_compliant: { label: "Nicht konform", class: "fail" },
    review_needed: { label: "Prüfung nötig", class: "warn" },
    pending: { label: "Ausstehend", class: "warn" },
    resolved: { label: "Gelöst", class: "ok" },
    escalated: { label: "Eskaliert", class: "fail" },
};

const SEVERITY_META = {
    critical: { label: "Kritisch", class: "fail" },
    minor: { label: "Gering", class: "warn" },
};

/* ══════════════════════════════════════════════════════════
   🏷️ Labels الخانات (للعرض التفصيلي)
   ══════════════════════════════════════════════════════════ */
const VEHICLE_LABELS = {
    is_vehicle_suitable: "Fahrzeug für Lebensmitteltransport geeignet",
    is_cargo_clean: "Laderaum sauber und trocken",
    no_dirt_or_contaminants: "Keine Verschmutzungen oder Verunreinigungen",
    no_abnormal_odors: "Keine anormalen Gerüche",
    no_chemicals: "Keine Chemikalien im Transportbereich",
    boxes_clean_and_intact: "Transportboxen sauber und unbeschädigt",
    no_pests: "Keine Spuren von Schädlingen",
    no_damaged_food: "Keine beschädigten Lebensmittel",
    driver_hygiene_compliant: "Fahrer hält persönliche Hygiene ein",
    no_health_issues: "Keine gesundheitlichen Einschränkungen",
};

const PRODUCT_LABELS = {
    products_match_order: "Produkte stimmen mit Bestellung überein",
    packaging_intact: "Verpackungen unbeschädigt",
    no_open_or_leaking_packages: "Keine geöffneten / auslaufenden Verpackungen",
    no_visible_damage_or_spoilage: "Keine sichtbaren Schäden / Verderb",
    chilled_products_stored_correctly: "Gekühlte Produkte korrekt gelagert",
    frozen_products_not_thawed: "Tiefkühlprodukte nicht aufgetaut",
    no_cross_contamination_risk: "Keine Kreuzkontaminationsgefahr",
};

const COOLING_LABELS = {
    box_clean: "Kühlbox sauber",
    box_intact: "Kühlbox unbeschädigt",
    cooling_unit_working: "Kühlgerät funktioniert",
    thermometer_working: "Thermometer funktioniert",
    required_temp_achieved: "Erforderliche Temperatur erreicht",
    products_in_correct_compartment: "Produkte im richtigen Fach",
    no_cross_contamination_risk: "Keine Kreuzkontaminationsgefahr",
};

/* ══════════════════════════════════════════════════════════
   📅 Time filters
   ══════════════════════════════════════════════════════════ */
const TIME_FILTERS = [
    { key: "today", label: "Heute" },
    { key: "week", label: "Diese Woche" },
    { key: "month", label: "Dieser Monat" },
    { key: "all", label: "Alle" },
];

function getDateRange(filterKey) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterKey === "today") {
        return { from: startOfToday.toISOString() };
    }
    if (filterKey === "week") {
        const day = now.getDay() || 7;
        const monday = new Date(startOfToday);
        monday.setDate(monday.getDate() - (day - 1));
        return { from: monday.toISOString() };
    }
    if (filterKey === "month") {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: firstOfMonth.toISOString() };
    }
    return { from: null };
}

/* ══════════════════════════════════════════════════════════
   🕒 Formatting
   ══════════════════════════════════════════════════════════ */
function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTemp(val) {
    if (val === null || val === undefined || val === "") return "—";
    return `${Number(val).toFixed(1).replace(".", ",")} °C`;
}

/* ══════════════════════════════════════════════════════════
   🎯 Main Component
   ══════════════════════════════════════════════════════════ */
export default function MyRecordsView() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState("today");
    const [typeFilter, setTypeFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        const range = getDateRange(timeFilter);
        const res = await fetchMyRecords({ dateFrom: range.from });

        if (res.success) {
            setRecords(res.data);
        } else {
            setError(res.error);
            setRecords([]);
        }
        setLoading(false);
    }, [timeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        if (typeFilter === "all") return records;
        return records.filter((r) => r.type === typeFilter);
    }, [records, typeFilter]);

    return (
        <div className="mrv-wrap">
            {/* Filters */}
            <div className="mrv-filters">
                <div className="mrv-filter-group">
                    {TIME_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            className={`mrv-filter-btn ${timeFilter === f.key ? "active" : ""}`}
                            onClick={() => setTimeFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <select
                    className="mrv-type-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">Alle Typen</option>
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                        <option key={key} value={key}>
                            {meta.icon} {meta.label}
                        </option>
                    ))}
                </select>

                <span className="mrv-count">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "Eintrag" : "Einträge"}
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="mrv-loader">
                    <div className="mrv-spinner" />
                    <span>Wird geladen...</span>
                </div>
            ) : error ? (
                <div className="mrv-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="mrv-state">
                    <span className="material-symbols-outlined">inbox</span>
                    <p>Keine Einträge für diesen Filter</p>
                </div>
            ) : (
                <div className="mrv-timeline">
                    {filtered.map((record) => (
                        <RecordCard key={`${record.type}-${record.id}`} record={record} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   🃏 RecordCard — سجل واحد مع تفاصيل قابلة للتوسيع
   ══════════════════════════════════════════════════════════ */
function RecordCard({ record }) {
    const [expanded, setExpanded] = useState(false);

    const typeMeta = TYPE_META[record.type] || { icon: "•", label: record.type };

    let statusMeta;
    if (record.type === "violation") {
        if (record.severity === "critical" && record.status === "pending") {
            statusMeta = SEVERITY_META.critical;
        } else {
            statusMeta = STATUS_META[record.status] || { label: record.status, class: "info" };
        }
    } else {
        statusMeta = STATUS_META[record.status] || { label: record.status || "—", class: "info" };
    }

    return (
        <article className={`mrv-card ${statusMeta.class} ${expanded ? "is-expanded" : ""}`}>
            <div className="mrv-icon">{typeMeta.icon}</div>

            <div className="mrv-content">
                <div className="mrv-head">
                    <span className="mrv-type">{typeMeta.label}</span>
                    <span className="mrv-time">{formatDateTime(record.timestamp)}</span>
                </div>

                <span className="mrv-title">{record.title}</span>

                {record.subtitle && (
                    <span className="mrv-subtitle">{record.subtitle}</span>
                )}

                <div className="mrv-badge-row">
                    <span className={`mrv-badge ${statusMeta.class}`}>
                        {statusMeta.label}
                    </span>

                    <button
                        type="button"
                        className="mrv-toggle-btn"
                        onClick={() => setExpanded((v) => !v)}
                        aria-expanded={expanded}
                    >
                        <span>{expanded ? "Weniger anzeigen" : "Details anzeigen"}</span>
                        <span className="material-symbols-outlined">
                            {expanded ? "expand_less" : "expand_more"}
                        </span>
                    </button>
                </div>

                {/* ✅ التفاصيل الموسّعة */}
                {expanded && <RecordDetails record={record} />}
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════════════════
   📋 RecordDetails — تفاصيل حسب النوع
   ══════════════════════════════════════════════════════════ */
function RecordDetails({ record }) {
    const raw = record.raw;

    switch (record.type) {
        case "vehicle_check":
            return <VehicleCheckDetails raw={raw} />;
        case "temperature":
            return <TemperatureDetails raw={raw} />;
        case "cleaning":
            return <CleaningDetails raw={raw} />;
        case "product_check":
            return <ProductCheckDetails raw={raw} />;
        case "cooling_check":
            return <CoolingCheckDetails raw={raw} />;
        case "violation":
            return <ViolationDetails raw={raw} />;
        default:
            return null;
    }
}

/* ══════════════════════════════════════════════════════════
   🚗 Vehicle Check Details
   ══════════════════════════════════════════════════════════ */
function VehicleCheckDetails({ raw }) {
    return (
        <div className="mrv-details">
            <div className="mrv-details-grid">
                {Object.entries(VEHICLE_LABELS).map(([key, label]) => (
                    <CheckRow key={key} label={label} value={raw[key]} />
                ))}
            </div>
            {raw.notes && <NoteBlock label="Notizen" text={raw.notes} />}
            {raw.corrective_actions && (
                <NoteBlock label="Korrekturmaßnahmen" text={raw.corrective_actions} />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   🌡️ Temperature Details
   ══════════════════════════════════════════════════════════ */
function TemperatureDetails({ raw }) {
    const category = raw.category;
    return (
        <div className="mrv-details">
            <div className="mrv-info-row">
                <span className="mrv-info-label">Kategorie</span>
                <span className="mrv-info-value">
                    {category?.label_de || raw.product_type || "—"}
                </span>
            </div>
            {category && (
                <div className="mrv-info-row">
                    <span className="mrv-info-label">Zulässiger Bereich</span>
                    <span className="mrv-info-value">
                        {formatTemp(category.min_temp)} – {formatTemp(category.max_temp)}
                    </span>
                </div>
            )}
            <div className="mrv-info-row">
                <span className="mrv-info-label">Soll-Temperatur</span>
                <span className="mrv-info-value">{formatTemp(raw.required_temp)}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Ist-Temperatur</span>
                <span className="mrv-info-value mrv-info-emphasis">
                    {formatTemp(raw.actual_temp)}
                </span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Tournummer</span>
                <span className="mrv-info-value">{raw.round_number || "—"}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Kühlbox</span>
                <span className="mrv-info-value">{raw.box_number || "—"}</span>
            </div>
            {raw.notes && <NoteBlock label="Notizen" text={raw.notes} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   🧽 Cleaning Details
   ══════════════════════════════════════════════════════════ */
function CleaningDetails({ raw }) {
    return (
        <div className="mrv-details">
            <div className="mrv-info-row">
                <span className="mrv-info-label">Ausrüstung</span>
                <span className="mrv-info-value">{raw.equipment_name}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Reinigungsmethode</span>
                <span className="mrv-info-value">{raw.cleaning_method}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Ergebnis</span>
                <span className="mrv-info-value">{raw.result === "passed" ? "✅ Bestanden" : "❌ Fehlgeschlagen"}</span>
            </div>
            {raw.notes && <NoteBlock label="Notizen" text={raw.notes} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   📦 Product Check Details
   ══════════════════════════════════════════════════════════ */
function ProductCheckDetails({ raw }) {
    return (
        <div className="mrv-details">
            <div className="mrv-details-grid">
                {Object.entries(PRODUCT_LABELS).map(([key, label]) => (
                    <CheckRow key={key} label={label} value={raw[key]} />
                ))}
            </div>

            {raw.affected_products && raw.affected_products.length > 0 && (
                <div className="mrv-list-block">
                    <span className="mrv-block-label">Betroffene Produkte</span>
                    <ul className="mrv-list">
                        {raw.affected_products.map((p, i) => (
                            <li key={i}>{p.product_name || "—"}</li>
                        ))}
                    </ul>
                </div>
            )}

            {raw.corrective_action_keys && raw.corrective_action_keys.length > 0 && (
                <div className="mrv-list-block">
                    <span className="mrv-block-label">Korrekturmaßnahmen</span>
                    <ul className="mrv-list">
                        {raw.corrective_action_keys.map((k, i) => (
                            <li key={i}>{k}</li>
                        ))}
                    </ul>
                </div>
            )}

            {raw.notes && <NoteBlock label="Notizen" text={raw.notes} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   ❄️ Cooling Check Details
   ══════════════════════════════════════════════════════════ */
function CoolingCheckDetails({ raw }) {
    return (
        <div className="mrv-details">
            <div className="mrv-info-row">
                <span className="mrv-info-label">Kühlbox</span>
                <span className="mrv-info-value">{raw.box_number || "—"}</span>
            </div>
            {raw.round_number && (
                <div className="mrv-info-row">
                    <span className="mrv-info-label">Tournummer</span>
                    <span className="mrv-info-value">{raw.round_number}</span>
                </div>
            )}

            <div className="mrv-details-grid">
                {Object.entries(COOLING_LABELS).map(([key, label]) => (
                    <CheckRow key={key} label={label} value={raw[key]} />
                ))}
            </div>

            {raw.notes && <NoteBlock label="Notizen" text={raw.notes} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   ⚠️ Violation Details
   ══════════════════════════════════════════════════════════ */
function ViolationDetails({ raw }) {
    const severity = SEVERITY_META[raw.severity] || { label: raw.severity };
    const status = STATUS_META[raw.status] || { label: raw.status };

    return (
        <div className="mrv-details">
            <div className="mrv-info-row">
                <span className="mrv-info-label">Typ</span>
                <span className="mrv-info-value">{raw.violation_type}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Schweregrad</span>
                <span className="mrv-info-value">{severity.label}</span>
            </div>
            <div className="mrv-info-row">
                <span className="mrv-info-label">Status</span>
                <span className="mrv-info-value">{status.label}</span>
            </div>

            {raw.affected_products && raw.affected_products.length > 0 && (
                <div className="mrv-list-block">
                    <span className="mrv-block-label">Betroffene Produkte</span>
                    <ul className="mrv-list">
                        {raw.affected_products.map((p, i) => (
                            <li key={i}>{p.product_name || "—"}</li>
                        ))}
                    </ul>
                </div>
            )}

            {raw.corrective_action_keys && raw.corrective_action_keys.length > 0 && (
                <div className="mrv-list-block">
                    <span className="mrv-block-label">Korrekturmaßnahmen</span>
                    <ul className="mrv-list">
                        {raw.corrective_action_keys.map((k, i) => (
                            <li key={i}>{k}</li>
                        ))}
                    </ul>
                </div>
            )}

            {raw.corrective_action_taken && (
                <NoteBlock label="Durchgeführte Maßnahme" text={raw.corrective_action_taken} />
            )}

            {raw.closed_at && (
                <div className="mrv-info-row">
                    <span className="mrv-info-label">Geschlossen am</span>
                    <span className="mrv-info-value">{formatDateTime(raw.closed_at)}</span>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   ✅ CheckRow — سطر واحد لخانة boolean
   ══════════════════════════════════════════════════════════ */
function CheckRow({ label, value }) {
    const ok = value === true;
    return (
        <div className={`mrv-check-row ${ok ? "is-ok" : "is-fail"}`}>
            <span className="mrv-check-icon">{ok ? "✓" : "✕"}</span>
            <span className="mrv-check-label">{label}</span>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   📝 NoteBlock — قسم ملاحظات
   ══════════════════════════════════════════════════════════ */
function NoteBlock({ label, text }) {
    return (
        <div className="mrv-note-block">
            <span className="mrv-block-label">{label}</span>
            <p className="mrv-note-text">{text}</p>
        </div>
    );
}