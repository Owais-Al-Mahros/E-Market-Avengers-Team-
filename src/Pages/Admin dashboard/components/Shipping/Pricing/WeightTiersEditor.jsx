import { useState } from "react";
import "./WeightTiersEditor.css";

/* ═══════════════════════════════════════════
   Overlap check helper
   ═══════════════════════════════════════════ */
const hasOverlap = (tiers, editedId, newFrom, newTo) => {
    return tiers.some((t) => {
        if (t.id === editedId) return false;
        return !(newTo <= t.from || newFrom >= t.to);
    });
};

export default function WeightTiersEditor({ tiers, onChange, maxWeight }) {
    const [draftTo, setDraftTo] = useState("");
    const [draftPrice, setDraftPrice] = useState("");
    const [editError, setEditError] = useState(null);

    const effectiveMax = parseFloat(maxWeight) || 0;

    const getNextFrom = () => {
        if (tiers.length === 0) return 0;
        const sorted = [...tiers].sort((a, b) => a.to - b.to);
        return sorted[sorted.length - 1].to;
    };

    const nextFrom = getNextFrom();
    const isMaxReached = effectiveMax > 0 && nextFrom >= effectiveMax;

    const draftToNum = parseFloat(draftTo);
    const draftPriceNum = parseFloat(draftPrice);

    const isDraftToValid =
        !isNaN(draftToNum) &&
        draftToNum > nextFrom &&
        (effectiveMax === 0 || draftToNum <= effectiveMax);

    const isDraftPriceValid = !isNaN(draftPriceNum) && draftPriceNum >= 0;
    const canAdd = isDraftToValid && isDraftPriceValid && !isMaxReached;

    const getValidationError = () => {
        if (isMaxReached)
            return `Maximum weight (${effectiveMax} kg) is already covered.`;
        if (draftTo && !isDraftToValid) {
            if (effectiveMax > 0 && draftToNum > effectiveMax)
                return `Cannot exceed maximum weight (${effectiveMax} kg).`;
            if (draftToNum <= nextFrom)
                return `"To" must be greater than ${nextFrom} kg.`;
        }
        if (draftPrice && !isDraftPriceValid)
            return `"Surcharge" must be 0 or more.`;
        return null;
    };

    const validationError = editError || getValidationError();

    const handleAdd = () => {
        if (!canAdd) return;

        const newTier = {
            id: crypto.randomUUID(),
            from: nextFrom,
            to: draftToNum,
            price: draftPriceNum,
        };

        onChange([...tiers, newTier].sort((a, b) => a.from - b.from));
        setDraftTo("");
        setDraftPrice("");
        setEditError(null);
    };

    const handleRemove = (id) => {
        onChange(tiers.filter((t) => t.id !== id));
        setEditError(null);
    };

    const handleEdit = (id, field, value) => {
        let parsedValue = parseFloat(value) || 0;

        if (field === "to" && effectiveMax > 0 && parsedValue > effectiveMax) {
            parsedValue = effectiveMax;
        }

        const current = tiers.find((t) => t.id === id);
        if (!current) return;

        const newFrom = field === "from" ? parsedValue : current.from;
        const newTo = field === "to" ? parsedValue : current.to;

        if (newFrom >= newTo) {
            setEditError(`"From" must be less than "To".`);
            return;
        }

        if (hasOverlap(tiers, id, newFrom, newTo)) {
            setEditError(`Overlaps with an existing tier.`);
            return;
        }

        setEditError(null);

        const updated = tiers
            .map((t) => (t.id === id ? { ...t, [field]: parsedValue } : t))
            .sort((a, b) => a.from - b.from);

        onChange(updated);
    };

    const sortedTiers = [...tiers].sort((a, b) => a.from - b.from);

    return (
        <div className="weight-tiers">
            <div className="weight-tiers-header">
                <h5>⚖️ Weight Tiers</h5>
                <span className="weight-tiers-hint">
                    Set a flat surcharge for each weight range.
                    {effectiveMax > 0 && (
                        <> Maximum allowed weight: <strong>{effectiveMax} kg</strong>.</>
                    )}{" "}
                    Use price <strong>0</strong> to make a range free.
                </span>
            </div>

            {sortedTiers.length > 0 ? (
                <div className="weight-tiers-list">
                    {sortedTiers.map((tier, idx) => (
                        <div
                            key={tier.id}
                            className={`weight-tier-row ${idx === sortedTiers.length - 1 ? "is-last" : ""}`}
                        >
                            <div className="weight-tier-field">
                                <label>From (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={tier.from}
                                    onChange={(e) => handleEdit(tier.id, "from", e.target.value)}
                                    readOnly={idx === 0 && tier.from === 0}
                                    className={idx === 0 && tier.from === 0 ? "readonly" : ""}
                                />
                            </div>

                            <div className="weight-tier-arrow">→</div>

                            <div className="weight-tier-field">
                                <label>To (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max={effectiveMax || undefined}
                                    value={tier.to}
                                    onChange={(e) => handleEdit(tier.id, "to", e.target.value)}
                                />
                            </div>

                            <div className="weight-tier-equals">=</div>

                            <div className="weight-tier-field">
                                <label>Surcharge (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tier.price}
                                    onChange={(e) => handleEdit(tier.id, "price", e.target.value)}
                                />
                            </div>

                            <button
                                type="button"
                                className="weight-tier-remove"
                                onClick={() => handleRemove(tier.id)}
                                title="Remove tier"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="weight-tiers-empty">
                    No weight tiers defined yet. Add your first range below
                    (e.g., <strong>0 – 15 kg → €0</strong>).
                </p>
            )}

            {isMaxReached ? (
                <div className="weight-tiers-complete">
                    <span className="material-symbols-outlined">check_circle</span>
                    <div>
                        <strong>All weights covered</strong>
                        <span>
                            Full range 0 – {effectiveMax} kg is now covered by tiers.
                            Orders above {effectiveMax} kg will be rejected at checkout.
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="weight-tier-add">
                        <div className="weight-tier-field">
                            <label>From (kg)</label>
                            <input type="number" value={nextFrom} readOnly className="readonly" />
                        </div>

                        <div className="weight-tier-arrow">→</div>

                        <div className="weight-tier-field">
                            <label>To (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                max={effectiveMax || undefined}
                                placeholder={effectiveMax > 0 ? `≤ ${effectiveMax}` : String(nextFrom + 5)}
                                value={draftTo}
                                onChange={(e) => setDraftTo(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && canAdd) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                className={draftTo && !isDraftToValid ? "has-error" : ""}
                            />
                        </div>

                        <div className="weight-tier-equals">=</div>

                        <div className="weight-tier-field">
                            <label>Surcharge (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={draftPrice}
                                onChange={(e) => setDraftPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && canAdd) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            className="weight-tier-add-btn"
                            onClick={handleAdd}
                            disabled={!canAdd}
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add
                        </button>
                    </div>

                    {validationError && (
                        <div className="weight-tiers-error">
                            <span className="material-symbols-outlined">error</span>
                            <span>{validationError}</span>
                        </div>
                    )}
                </>
            )}

            {sortedTiers.length > 0 && !isMaxReached && effectiveMax > 0 && (
                <div className="weight-tiers-info">
                    <span className="material-symbols-outlined">info</span>
                    <span>
                        Last covered weight: <strong>{nextFrom} kg</strong>. Remaining range:{" "}
                        <strong>{nextFrom} – {effectiveMax} kg</strong>.
                    </span>
                </div>
            )}
        </div>
    );
}