// src/Pages/driver/components/Haccp/VehicleCheckForm.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { useHaccp } from "../../../context/HaccpContext";
import { saveVehicleCheck } from "../../../api/haccp";
import { computeVehicleCheckStatus } from "../../../lib/haccpHelpers";
import "./HaccpForms.css";

const CHECKS = [
    { key: "is_vehicle_suitable", label: "Fahrzeug ist für den Lebensmitteltransport geeignet." },
    { key: "is_cargo_clean", label: "Der Laderaum ist sauber und trocken." },
    { key: "no_dirt_or_contaminants", label: "Keine sichtbaren Verschmutzungen oder Verunreinigungen." },
    { key: "no_abnormal_odors", label: "Keine anormalen Gerüche im Laderaum." },
    { key: "no_chemicals", label: "Keine Chemikalien im Transportbereich." },
    { key: "boxes_clean_and_intact", label: "Transportboxen sind sauber und unbeschädigt." },
    { key: "no_pests", label: "Keine Spuren von Schädlingen." },
    { key: "no_damaged_food", label: "Keine beschädigten Lebensmittel." },
    { key: "driver_hygiene_compliant", label: "Der Fahrer hält die persönliche Hygiene ein." },
    { key: "no_health_issues", label: "Keine gesundheitlichen Einschränkungen." },
];

const INITIAL = Object.fromEntries(CHECKS.map((c) => [c.key, false]));

export default function VehicleCheckForm({ driverId, onSuccess }) {
    const { correctiveActions } = useHaccp();

    const [vehicleNumber, setVehicleNumber] = useState("");
    const [checks, setChecks] = useState(INITIAL);
    const [selectedActions, setSelectedActions] = useState([]);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const overallStatus = computeVehicleCheckStatus(checks);
    const hasFailure = overallStatus === "failed";

    const toggleCheck = (key) =>
        setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

    const toggleAction = (key) =>
        setSelectedActions((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );

    const resetForm = () => {
        setVehicleNumber("");
        setChecks(INITIAL);
        setSelectedActions([]);
        setNotes("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!vehicleNumber.trim()) {
            toast.error("Bitte Fahrzeugnummer eingeben.");
            return;
        }
        if (hasFailure && selectedActions.length === 0) {
            toast.error("Bitte mindestens eine Korrekturmaßnahme wählen.");
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading("Fahrzeugcheck wird gespeichert...");

        const result = await saveVehicleCheck({
            vehicle_number: vehicleNumber.trim(),
            ...checks,
            corrective_action_keys: selectedActions,
            notes: notes.trim() || null,
        });

        if (!result.success) {
            toast.error(result.error || "Fehler", { id: toastId });
            setSubmitting(false);
            return;
        }

        if (hasFailure) {
            toast.error("⚠️ Check fehlgeschlagen — Verstoß gemeldet", {
                id: toastId,
                duration: 5000,
            });
        } else {
            toast.success("✅ Fahrzeugcheck bestanden", { id: toastId });
        }

        resetForm();
        setSubmitting(false);

        // ✅ إشعار الأب — لإعادة جلب حالة الجولة فورًا
        onSuccess?.();
    };

    return (
        <form className="hf-form" onSubmit={handleSubmit}>
            <div className="hf-form-header">
                <span className="material-symbols-outlined">directions_car</span>
                <h3>Fahrzeug- & Hygienecheck</h3>
            </div>

            {/* Vehicle number */}
            <div className="hf-field">
                <label>Fahrzeugnummer / Kennzeichen *</label>
                <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="z.B. B-SH-2026"
                    disabled={submitting}
                />
            </div>

            {/* Checklist */}
            <div className="hf-checklist">
                <div className="hf-checklist-title">
                    Pflichtpunkte ({CHECKS.length})
                </div>
                {CHECKS.map((c) => {
                    const failed = hasFailure && !checks[c.key];
                    return (
                        <label
                            key={c.key}
                            className={`hf-check-item ${failed ? "is-failed" : ""}`}
                        >
                            <input
                                type="checkbox"
                                checked={checks[c.key]}
                                onChange={() => toggleCheck(c.key)}
                                disabled={submitting}
                            />
                            <span>{c.label}</span>
                        </label>
                    );
                })}
            </div>

            {/* Status banner — auto-computed */}
            <div
                className={`hf-status ${hasFailure ? "hf-status-failed" : "hf-status-passed"}`}
            >
                <span className="material-symbols-outlined">
                    {hasFailure ? "error" : "check_circle"}
                </span>
                {hasFailure
                    ? "Mindestens ein Pflichtpunkt nicht erfüllt — Korrekturmaßnahmen erforderlich"
                    : "Alle Pflichtpunkte erfüllt — bereit für die Abfahrt"}
            </div>

            {/* Fail section */}
            {hasFailure && (
                <div className="hf-fail-section">
                    <div className="hf-fail-title">
                        <span className="material-symbols-outlined">warning</span>
                        Korrekturmaßnahmen *
                    </div>

                    <div className="hf-chips">
                        {correctiveActions.map((action) => {
                            const active = selectedActions.includes(action.key);
                            return (
                                <button
                                    key={action.key}
                                    type="button"
                                    className={`hf-chip ${active ? "is-active" : ""}`}
                                    onClick={() => toggleAction(action.key)}
                                    disabled={submitting}
                                >
                                    {active ? "✓ " : ""}
                                    {action.label_de}
                                </button>
                            );
                        })}
                    </div>

                    <div className="hf-field">
                        <label>Notizen</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Beschreiben Sie das Problem..."
                            maxLength={500}
                            disabled={submitting}
                        />
                    </div>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                className="hf-submit"
                disabled={submitting}
            >
                {submitting ? (
                    <>
                        <span className="hf-spinner" />
                        Wird gespeichert...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">save</span>
                        Fahrzeugcheck speichern
                    </>
                )}
            </button>
        </form>
    );
}