import { useState } from "react";
import "./DistanceTiersEditor.css";

export default function DistanceTiersEditor({ tiers, onChange, maxDistance }) {
    const [draftTo, setDraftTo] = useState("");
    const [draftPrice, setDraftPrice] = useState("");

    // ✅ الحد الأقصى الفعلي
    const effectiveMax = parseFloat(maxDistance) || 0;

    // ✅ احسب نقطة البداية تلقائياً
    const getNextFrom = () => {
        if (tiers.length === 0) return 0;
        const sorted = [...tiers].sort((a, b) => a.to - b.to);
        return sorted[sorted.length - 1].to;
    };

    const nextFrom = getNextFrom();

    // ✅ هل وصلنا للحد الأقصى؟
    const isMaxReached =
        effectiveMax > 0 && nextFrom >= effectiveMax;

    // ✅ هل draftTo صالح؟
    const draftToNum = parseFloat(draftTo);
    const draftPriceNum = parseFloat(draftPrice);

    const isDraftToValid =
        !isNaN(draftToNum) &&
        draftToNum > nextFrom &&
        (effectiveMax === 0 || draftToNum <= effectiveMax);

    const isDraftPriceValid = !isNaN(draftPriceNum) && draftPriceNum >= 0;

    const canAdd = isDraftToValid && isDraftPriceValid && !isMaxReached;

    // ✅ رسالة التحقق
    const getValidationError = () => {
        if (isMaxReached) {
            return `Max distance (${effectiveMax} km) is already covered.`;
        }
        if (draftTo && !isDraftToValid) {
            if (effectiveMax > 0 && draftToNum > effectiveMax) {
                return `Cannot exceed max delivery distance (${effectiveMax} km).`;
            }
            return `"To" must be greater than ${nextFrom} km.`;
        }
        return null;
    };

    const validationError = getValidationError();

    const handleAdd = () => {
        if (!canAdd) return;

        const newTier = {
            id: Date.now().toString(),
            from: nextFrom,
            to: draftToNum,
            price: draftPriceNum,
        };

        onChange([...tiers, newTier].sort((a, b) => a.from - b.from));
        setDraftTo("");
        setDraftPrice("");
    };

    const handleRemove = (id) => {
        onChange(tiers.filter((t) => t.id !== id));
    };

    const handleEdit = (id, field, value) => {
        let parsedValue = parseFloat(value) || 0;

        // ✅ منع التعديل الذي يتجاوز maxDistance
        if (field === "to" && effectiveMax > 0 && parsedValue > effectiveMax) {
            parsedValue = effectiveMax;
        }

        const updated = tiers
            .map((t) => (t.id === id ? { ...t, [field]: parsedValue } : t))
            .sort((a, b) => a.from - b.from);
        onChange(updated);
    };

    const sortedTiers = [...tiers].sort((a, b) => a.from - b.from);

    return (
        <div className="distance-tiers">
            <div className="distance-tiers-header">
                <h5>🚗 Distance Tiers</h5>
                <span className="distance-tiers-hint">
                    Define a flat price for each distance range.
                    {effectiveMax > 0 && (
                        <>
                            {" "}
                            Maximum allowed distance:{" "}
                            <strong>{effectiveMax} km</strong>.
                        </>
                    )}
                </span>
            </div>

            {sortedTiers.length > 0 ? (
                <div className="distance-tiers-list">
                    {sortedTiers.map((tier, idx) => (
                        <div
                            key={tier.id}
                            className={`distance-tier-row ${idx === sortedTiers.length - 1 ? "is-last" : ""
                                }`}
                        >
                            <div className="distance-tier-field">
                                <label>From (km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={tier.from}
                                    onChange={(e) =>
                                        handleEdit(
                                            tier.id,
                                            "from",
                                            e.target.value
                                        )
                                    }
                                    readOnly={idx === 0 && tier.from === 0}
                                    className={
                                        idx === 0 && tier.from === 0
                                            ? "readonly"
                                            : ""
                                    }
                                />
                            </div>

                            <div className="distance-tier-arrow">→</div>

                            <div className="distance-tier-field">
                                <label>To (km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max={effectiveMax || undefined}
                                    value={tier.to}
                                    onChange={(e) =>
                                        handleEdit(
                                            tier.id,
                                            "to",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="distance-tier-equals">=</div>

                            <div className="distance-tier-field">
                                <label>Price (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tier.price}
                                    onChange={(e) =>
                                        handleEdit(
                                            tier.id,
                                            "price",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                className="distance-tier-remove"
                                onClick={() => handleRemove(tier.id)}
                                title="Remove tier"
                            >
                                <span className="material-symbols-outlined">
                                    delete
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="distance-tiers-empty">
                    No tiers defined yet. Start by adding your first range below.
                </p>
            )}

            {/* ===== حالة الوصول للحد الأقصى ===== */}
            {isMaxReached ? (
                <div className="distance-tiers-complete">
                    <span className="material-symbols-outlined">
                        check_circle
                    </span>
                    <div>
                        <strong>All distances covered</strong>
                        <span>
                            Full range 0 – {effectiveMax} km is now covered by
                            tiers. All distances beyond {effectiveMax} km will
                            be rejected at checkout.
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    {/* ===== Add new tier ===== */}
                    <div className="distance-tier-add">
                        <div className="distance-tier-field">
                            <label>From (km)</label>
                            <input
                                type="number"
                                value={nextFrom}
                                readOnly
                                className="readonly"
                                title="Auto-filled from previous tier"
                            />
                        </div>

                        <div className="distance-tier-arrow">→</div>

                        <div className="distance-tier-field">
                            <label>To (km)</label>
                            <input
                                type="number"
                                step="0.1"
                                max={effectiveMax || undefined}
                                placeholder={
                                    effectiveMax > 0
                                        ? `≤ ${effectiveMax}`
                                        : String(nextFrom + 10)
                                }
                                value={draftTo}
                                onChange={(e) => setDraftTo(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && canAdd) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                className={
                                    draftTo && !isDraftToValid
                                        ? "has-error"
                                        : ""
                                }
                            />
                        </div>

                        <div className="distance-tier-equals">=</div>

                        <div className="distance-tier-field">
                            <label>Price (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="35.00"
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
                            className="distance-tier-add-btn"
                            onClick={handleAdd}
                            disabled={!canAdd}
                        >
                            <span className="material-symbols-outlined">
                                add
                            </span>
                            Add
                        </button>
                    </div>

                    {/* ===== خطأ التحقق ===== */}
                    {validationError && (
                        <div className="distance-tiers-error">
                            <span className="material-symbols-outlined">
                                error
                            </span>
                            <span>{validationError}</span>
                        </div>
                    )}
                </>
            )}

            {/* ===== Info footer ===== */}
            {sortedTiers.length > 0 && !isMaxReached && (
                <div className="distance-tiers-info">
                    <span className="material-symbols-outlined">info</span>
                    <span>
                        Last covered distance:{" "}
                        <strong>{nextFrom} km</strong>. The next tier must
                        start here.
                        {effectiveMax > 0 && (
                            <>
                                {" "}
                                Remaining range:{" "}
                                <strong>
                                    {nextFrom} – {effectiveMax} km
                                </strong>
                                .
                            </>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
}