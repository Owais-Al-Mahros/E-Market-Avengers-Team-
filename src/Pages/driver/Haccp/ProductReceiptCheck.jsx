import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useHaccp } from "../../../context/HaccpContext";
import { saveProductReceiptCheck } from "../../../api/haccp";
import { computeProductReceiptStatus } from "../../../lib/haccpHelpers";
import "./ProductReceiptCheck.css";

/* ══════════════════════════════════════════════════════════
   📦 فحص المنتجات عند الاستلام — بند 3
   ══════════════════════════════════════════════════════════ */
export default function ProductReceiptCheck({ order, onClose, onSuccess }) {
    const { correctiveActions } = useHaccp();

    /* الخانات السبع */
    const [checks, setChecks] = useState({
        products_match_order: false,
        packaging_intact: false,
        no_open_or_leaking_packages: false,
        no_visible_damage_or_spoilage: false,
        chilled_products_stored_correctly: false,
        frozen_products_not_thawed: false,
        no_cross_contamination_risk: false,
    });

    const [affectedIds, setAffectedIds] = useState([]);
    const [selectedActions, setSelectedActions] = useState([]);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const overallStatus = useMemo(
        () => computeProductReceiptStatus(checks),
        [checks]
    );

    const hasFailure = overallStatus === "failed";
    const orderItems = order?.order_items || [];

    /* ═══════ Handlers ═══════ */
    const toggleCheck = (key) => {
        setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAffected = (itemId) => {
        setAffectedIds((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleAction = (key) => {
        setSelectedActions((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    /* ═══════ Submit ═══════ */
    const handleSubmit = async () => {
        // تحقق
        if (hasFailure && affectedIds.length === 0) {
            toast.error("Bitte wählen Sie die betroffenen Produkte aus.");
            return;
        }
        if (hasFailure && selectedActions.length === 0) {
            toast.error("Bitte wählen Sie mindestens eine Korrekturmaßnahme.");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Produktprüfung wird gespeichert...");

        const affectedProducts = affectedIds.map((id) => {
            const item = orderItems.find((i) => i.id === id);
            return {
                product_id: item?.product_id,
                product_name: item?.product_name,
            };
        });

        const payload = {
            ...checks,
            order_id: order.id,
            affected_products: hasFailure ? affectedProducts : null,
            corrective_action_keys: hasFailure ? selectedActions : [],
            notes: notes.trim() || null,
        };

        const result = await saveProductReceiptCheck(payload);

        if (!result.success) {
            toast.error(result.error || "Fehler beim Speichern", { id: toastId });
            setSubmitting(false);
            return;
        }

        if (hasFailure) {
            toast.error(
                "⚠️ Produktprüfung fehlgeschlagen — Verstoß gemeldet",
                { id: toastId, duration: 5000 }
            );
        } else {
            toast.success("✅ Produktprüfung bestanden", { id: toastId });
        }

        setSubmitting(false);
        onSuccess?.();
    };

    /* ═══════ Render ═══════ */
    return createPortal(
        <div className="prc-overlay" onClick={onClose}>
            <div className="prc-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className="prc-header">
                    <div>
                        <h2>📦 Produktprüfung bei Annahme</h2>
                        <p>Bestellung #{order.order_number}</p>
                    </div>
                    <button
                        type="button"
                        className="prc-close"
                        onClick={onClose}
                        aria-label="Schließen"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {/* Body */}
                <div className="prc-body">
                    {/* Checklist */}
                    <div className="prc-checklist">
                        <h3>
                            <span className="material-symbols-outlined">checklist</span>
                            Prüfpunkte (7)
                        </h3>

                        <CheckItem
                            checked={checks.products_match_order}
                            onToggle={() => toggleCheck("products_match_order")}
                            label="Produkte stimmen mit der Bestellung überein"
                            failed={hasFailure && !checks.products_match_order}
                        />
                        <CheckItem
                            checked={checks.packaging_intact}
                            onToggle={() => toggleCheck("packaging_intact")}
                            label="Verpackungen sind unbeschädigt"
                            failed={hasFailure && !checks.packaging_intact}
                        />
                        <CheckItem
                            checked={checks.no_open_or_leaking_packages}
                            onToggle={() => toggleCheck("no_open_or_leaking_packages")}
                            label="Keine geöffneten oder auslaufenden Verpackungen"
                            failed={hasFailure && !checks.no_open_or_leaking_packages}
                        />
                        <CheckItem
                            checked={checks.no_visible_damage_or_spoilage}
                            onToggle={() => toggleCheck("no_visible_damage_or_spoilage")}
                            label="Keine sichtbaren Schäden oder Verderb"
                            failed={hasFailure && !checks.no_visible_damage_or_spoilage}
                        />
                        <CheckItem
                            checked={checks.chilled_products_stored_correctly}
                            onToggle={() => toggleCheck("chilled_products_stored_correctly")}
                            label="Gekühlte Produkte korrekt gelagert"
                            failed={hasFailure && !checks.chilled_products_stored_correctly}
                        />
                        <CheckItem
                            checked={checks.frozen_products_not_thawed}
                            onToggle={() => toggleCheck("frozen_products_not_thawed")}
                            label="Tiefkühlprodukte nicht aufgetaut"
                            failed={hasFailure && !checks.frozen_products_not_thawed}
                        />
                        <CheckItem
                            checked={checks.no_cross_contamination_risk}
                            onToggle={() => toggleCheck("no_cross_contamination_risk")}
                            label="Keine Kreuzkontaminationsgefahr"
                            failed={hasFailure && !checks.no_cross_contamination_risk}
                        />
                    </div>

                    {/* Failed → اختر المنتجات + الإجراءات */}
                    {hasFailure && (
                        <div className="prc-fail-section">
                            <div className="prc-fail-title">
                                <span className="material-symbols-outlined">warning</span>
                                Abweichung erkannt — bitte dokumentieren
                            </div>

                            {/* المنتجات المتأثرة */}
                            <div className="prc-field">
                                <label>Betroffene Produkte *</label>
                                {orderItems.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#6b7a77", margin: 0 }}>
                                        Keine Produkte in dieser Bestellung.
                                    </p>
                                ) : (
                                    <div className="prc-products">
                                        {orderItems.map((item) => {
                                            const selected = affectedIds.includes(item.id);
                                            return (
                                                <label
                                                    key={item.id}
                                                    className={`prc-product ${selected ? "is-selected" : ""}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => toggleAffected(item.id)}
                                                    />
                                                    <span className="prc-product-name">
                                                        {item.product_name}
                                                    </span>
                                                    <span className="prc-product-qty">
                                                        {item.quantity}×
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* الإجراءات التصحيحية */}
                            <div className="prc-field">
                                <label>Korrekturmaßnahmen *</label>
                                <div className="prc-chips">
                                    {correctiveActions.map((action) => {
                                        const active = selectedActions.includes(action.key);
                                        return (
                                            <button
                                                key={action.key}
                                                type="button"
                                                className={`prc-chip ${active ? "is-active" : ""}`}
                                                onClick={() => toggleAction(action.key)}
                                            >
                                                {active ? "✓ " : ""}
                                                {action.label_de}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ملاحظات */}
                            <div className="prc-field">
                                <label>Notizen</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Beschreiben Sie das Problem..."
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="prc-footer">
                    <button
                        type="button"
                        className="prc-btn prc-btn-cancel"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Abbrechen
                    </button>
                    <button
                        type="button"
                        className="prc-btn prc-btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="prc-spinner" />
                                Wird gespeichert...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                {hasFailure ? "Abweichung melden" : "Prüfung bestätigen"}
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════════════════
   ✅ CheckItem — عنصر فحص واحد
   ══════════════════════════════════════════════════════════ */
function CheckItem({ checked, onToggle, label, failed }) {
    return (
        <label className={`prc-check-item ${failed ? "is-failed" : ""}`}>
            <input type="checkbox" checked={checked} onChange={onToggle} />
            <span>{label}</span>
        </label>
    );
}