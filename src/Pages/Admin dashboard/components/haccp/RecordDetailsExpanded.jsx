const VEHICLE_LABELS = {
    is_vehicle_suitable: "Vehicle suitable for food transport",
    is_cargo_clean: "Cargo area clean and dry",
    no_dirt_or_contaminants: "No dirt or contaminants",
    no_abnormal_odors: "No abnormal odors",
    no_chemicals: "No chemicals in transport area",
    boxes_clean_and_intact: "Transport boxes clean and intact",
    no_pests: "No signs of pests",
    no_damaged_food: "No damaged food",
    driver_hygiene_compliant: "Driver personal hygiene compliant",
    no_health_issues: "No health restrictions",
};

const PRODUCT_LABELS = {
    products_match_order: "Products match the order",
    packaging_intact: "Packaging intact",
    no_open_or_leaking_packages: "No open or leaking packages",
    no_visible_damage_or_spoilage: "No visible damage or spoilage",
    chilled_products_stored_correctly: "Chilled products stored correctly",
    frozen_products_not_thawed: "Frozen products not thawed",
    no_cross_contamination_risk: "No cross-contamination risk",
};

const COOLING_LABELS = {
    box_clean: "Cooling box clean",
    box_intact: "Cooling box intact",
    cooling_unit_working: "Cooling unit working",
    thermometer_working: "Thermometer working",
    required_temp_achieved: "Required temperature achieved",
    products_in_correct_compartment: "Products in correct compartment",
    no_cross_contamination_risk: "No cross-contamination risk",
};

function formatTemp(val) {
    if (val === null || val === undefined || val === "") return "—";
    return `${Number(val).toFixed(1).replace(".", ",")} °C`;
}

function formatDateTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatActionKey(key) {
    return String(key || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecordDetailsExpanded({ record }) {
    const raw = record.raw;

    if (record.type === "vehicle_check") {
        return (
            <div className="haccp-details">
                <div className="haccp-checks-grid">
                    {Object.entries(VEHICLE_LABELS).map(([k, label]) => (
                        <CheckRow key={k} label={label} value={raw[k]} />
                    ))}
                </div>
                {raw.notes && <NoteBlock label="Notes" text={raw.notes} />}
                {raw.corrective_actions && (
                    <NoteBlock label="Corrective Actions" text={raw.corrective_actions} />
                )}
            </div>
        );
    }

    if (record.type === "temperature") {
        return (
            <div className="haccp-details">
                <InfoRow
                    label="Category"
                    value={raw.category?.label_de || raw.product_type || "—"}
                />
                {raw.category && (
                    <InfoRow
                        label="Allowed Range"
                        value={`${formatTemp(raw.category.min_temp)} – ${formatTemp(raw.category.max_temp)}`}
                    />
                )}
                <InfoRow label="Target" value={formatTemp(raw.required_temp)} />
                <InfoRow label="Actual" value={formatTemp(raw.actual_temp)} emphasis />
                <InfoRow label="Round Number" value={raw.round_number || "—"} />
                <InfoRow label="Cooling Box" value={raw.box_number || "—"} />
                {raw.notes && <NoteBlock label="Notes" text={raw.notes} />}
            </div>
        );
    }

    if (record.type === "cleaning") {
        return (
            <div className="haccp-details">
                <InfoRow label="Equipment" value={raw.equipment_name} />
                <InfoRow label="Method" value={raw.cleaning_method} />
                <InfoRow
                    label="Result"
                    value={raw.result === "passed" ? "✅ Passed" : "❌ Failed"}
                />
                {raw.notes && <NoteBlock label="Notes" text={raw.notes} />}
            </div>
        );
    }

    if (record.type === "product_check") {
        return (
            <div className="haccp-details">
                <div className="haccp-checks-grid">
                    {Object.entries(PRODUCT_LABELS).map(([k, label]) => (
                        <CheckRow key={k} label={label} value={raw[k]} />
                    ))}
                </div>
                {raw.affected_products?.length > 0 && (
                    <ListBlock
                        label="Affected Products"
                        items={raw.affected_products.map((p) => p.product_name || "—")}
                    />
                )}
                {raw.corrective_action_keys?.length > 0 && (
                    <ListBlock
                        label="Corrective Actions"
                        items={raw.corrective_action_keys.map(formatActionKey)}
                    />
                )}
                {raw.notes && <NoteBlock label="Notes" text={raw.notes} />}
            </div>
        );
    }

    if (record.type === "cooling_check") {
        return (
            <div className="haccp-details">
                <InfoRow label="Box" value={raw.box_number || "—"} />
                {raw.round_number && <InfoRow label="Round" value={raw.round_number} />}
                <div className="haccp-checks-grid">
                    {Object.entries(COOLING_LABELS).map(([k, label]) => (
                        <CheckRow key={k} label={label} value={raw[k]} />
                    ))}
                </div>
                {raw.notes && <NoteBlock label="Notes" text={raw.notes} />}
            </div>
        );
    }

    if (record.type === "violation") {
        return (
            <div className="haccp-details">
                <InfoRow label="Type" value={raw.violation_type} />
                <InfoRow
                    label="Severity"
                    value={raw.severity === "critical" ? "Critical" : "Minor"}
                />
                <InfoRow
                    label="Status"
                    value={
                        raw.status === "resolved"
                            ? "Resolved"
                            : raw.status === "escalated"
                                ? "Escalated"
                                : "Pending"
                    }
                />
                {raw.affected_products?.length > 0 && (
                    <ListBlock
                        label="Affected Products"
                        items={raw.affected_products.map((p) => p.product_name || "—")}
                    />
                )}
                {raw.corrective_action_keys?.length > 0 && (
                    <ListBlock
                        label="Corrective Actions"
                        items={raw.corrective_action_keys.map(formatActionKey)}
                    />
                )}
                {raw.corrective_action_taken && (
                    <NoteBlock label="Action Taken" text={raw.corrective_action_taken} />
                )}
                {raw.closed_at && (
                    <InfoRow label="Closed At" value={formatDateTime(raw.closed_at)} />
                )}
            </div>
        );
    }

    return null;
}

function CheckRow({ label, value }) {
    const ok = value === true;
    return (
        <div className={`haccp-check-row ${ok ? "is-ok" : "is-fail"}`}>
            <span className="haccp-check-icon">{ok ? "✓" : "✕"}</span>
            <span>{label}</span>
        </div>
    );
}

function InfoRow({ label, value, emphasis }) {
    return (
        <div className="haccp-info-row">
            <span className="haccp-info-label">{label}</span>
            <span className={`haccp-info-value ${emphasis ? "haccp-info-emphasis" : ""}`}>
                {value}
            </span>
        </div>
    );
}

function NoteBlock({ label, text }) {
    return (
        <div className="haccp-note-block">
            <span className="haccp-block-label">{label}</span>
            <p className="haccp-note-text">{text}</p>
        </div>
    );
}

function ListBlock({ label, items }) {
    return (
        <div className="haccp-note-block">
            <span className="haccp-block-label">{label}</span>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
                {items.map((it, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#15312b", lineHeight: 1.5 }}>
                        {it}
                    </li>
                ))}
            </ul>
        </div>
    );
}