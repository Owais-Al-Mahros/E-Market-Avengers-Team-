import { useState, useEffect, useCallback } from "react";
import { fetchAllRecordsForAdmin, fetchAllDriversList } from "../../../../api/haccp";
import { formatDateTimeDE as formatDateTime } from "../../../../lib/haccpHelpers";
import RecordDetailsExpanded from "./RecordDetailsExpanded";

const TYPE_META = {
    vehicle_check: { icon: "🚗", label: "Vehicle Check" },
    temperature: { icon: "🌡️", label: "Temperature" },
    cleaning: { icon: "🧽", label: "Cleaning" },
    product_check: { icon: "📦", label: "Product Check" },
    cooling_check: { icon: "❄️", label: "Cooling Equipment" },
    violation: { icon: "⚠️", label: "Violation" },
};

const STATUS_META = {
    passed: { label: "Passed", class: "ok" },
    failed: { label: "Failed", class: "fail" },
    compliant: { label: "Compliant", class: "ok" },
    non_compliant: { label: "Non-Compliant", class: "fail" },
    review_needed: { label: "Review Needed", class: "warn" },
    pending: { label: "Pending", class: "warn" },
    resolved: { label: "Resolved", class: "ok" },
    escalated: { label: "Escalated", class: "fail" },
};

const SEVERITY_META = {
    critical: { label: "Critical", class: "fail" },
    minor: { label: "Minor", class: "warn" },
};

const TIME_FILTERS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All" },
];

function getDateRange(filterKey) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterKey === "today") return { from: startOfToday.toISOString() };
    if (filterKey === "week") {
        const day = now.getDay() || 7;
        const monday = new Date(startOfToday);
        monday.setDate(monday.getDate() - (day - 1));
        return { from: monday.toISOString() };
    }
    if (filterKey === "month") {
        return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
    }
    return { from: null };
}

export default function AdminRecordsView() {
    const [records, setRecords] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState("week");
    const [typeFilter, setTypeFilter] = useState("all");
    const [driverFilter, setDriverFilter] = useState("");

    // Load drivers list once (this is lightweight — no records)
    useEffect(() => {
        (async () => {
            const res = await fetchAllDriversList();
            if (res.success) setDrivers(res.data);
        })();
    }, []);

    const load = useCallback(async () => {
        // ✅ DO NOT LOAD ANYTHING UNTIL DRIVER IS SELECTED
        if (!driverFilter) {
            setRecords([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const range = getDateRange(timeFilter);

        const res = await fetchAllRecordsForAdmin({
            driverId: driverFilter,
            dateFrom: range.from,
            type: typeFilter === "all" ? null : typeFilter,
        });

        if (res.success) setRecords(res.data);
        else setError(res.error);

        setLoading(false);
    }, [timeFilter, typeFilter, driverFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const selectedDriver = drivers.find((d) => d.id === driverFilter);

    return (
        <div>
            {/* Filters */}
            <div className="haccp-filters-bar">
                <select
                    className="haccp-select"
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                >
                    <option value="">— Select Driver —</option>
                    {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name || d.email || "—"}
                        </option>
                    ))}
                </select>

                {driverFilter && (
                    <>
                        <div className="haccp-filter-group">
                            {TIME_FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    className={`haccp-filter-btn ${timeFilter === f.key ? "active" : ""}`}
                                    onClick={() => setTimeFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <select
                            className="haccp-select"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {Object.entries(TYPE_META).map(([key, meta]) => (
                                <option key={key} value={key}>
                                    {meta.icon} {meta.label}
                                </option>
                            ))}
                        </select>

                        <span className="haccp-count">
                            {records.length} {records.length === 1 ? "entry" : "entries"}
                        </span>
                    </>
                )}
            </div>

            {/* Empty: no driver selected */}
            {!driverFilter && (
                <div className="haccp-state">
                    <span className="material-symbols-outlined">person_search</span>
                    <p>Please select a driver to view their HACCP records</p>
                </div>
            )}

            {/* Loading */}
            {driverFilter && loading && (
                <div className="haccp-state">
                    <div className="haccp-spinner" />
                    <p>Loading {selectedDriver?.name}'s records...</p>
                </div>
            )}

            {/* Error */}
            {driverFilter && !loading && error && (
                <div className="haccp-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Empty results */}
            {driverFilter && !loading && !error && records.length === 0 && (
                <div className="haccp-state">
                    <span className="material-symbols-outlined">inbox</span>
                    <p>No records for this filter</p>
                </div>
            )}

            {/* Timeline */}
            {driverFilter && !loading && !error && records.length > 0 && (
                <div className="haccp-timeline">
                    {records.map((record) => (
                        <AdminRecordCard key={`${record.type}-${record.id}`} record={record} />
                    ))}
                </div>
            )}
        </div>
    );
}

function AdminRecordCard({ record }) {
    const [expanded, setExpanded] = useState(false);
    const typeMeta = TYPE_META[record.type] || { icon: "•", label: record.type };

    let statusMeta;
    if (record.type === "violation" && record.severity === "critical" && record.status === "pending") {
        statusMeta = SEVERITY_META.critical;
    } else {
        statusMeta = STATUS_META[record.status] || { label: record.status || "—", class: "info" };
    }

    return (
        <article className={`haccp-record ${statusMeta.class} ${expanded ? "is-expanded" : ""}`}>
            <div className="haccp-record-icon">{typeMeta.icon}</div>

            <div className="haccp-record-content">
                <div className="haccp-record-head">
                    <span className="haccp-record-type">{typeMeta.label}</span>
                    <span className="haccp-record-time">{formatDateTime(record.timestamp)}</span>
                </div>

                <span className="haccp-record-driver">
                    <span className="material-symbols-outlined">person</span>
                    {record.driver?.name || "—"}
                </span>

                <span className="haccp-record-title">{record.title}</span>
                {record.subtitle && (
                    <span className="haccp-record-subtitle">{record.subtitle}</span>
                )}

                <div className="haccp-record-badges">
                    <span className={`haccp-badge ${statusMeta.class}`}>{statusMeta.label}</span>
                    <button
                        type="button"
                        className="haccp-toggle-btn"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        <span>{expanded ? "Less" : "Details"}</span>
                        <span className="material-symbols-outlined">
                            {expanded ? "expand_less" : "expand_more"}
                        </span>
                    </button>
                </div>

                {expanded && <RecordDetailsExpanded record={record} />}
            </div>
        </article>
    );
}