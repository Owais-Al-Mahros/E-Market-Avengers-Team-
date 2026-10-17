// src/Pages/driver/components/Haccp/CoolingEquipmentCheck.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { saveCoolingEquipmentCheck } from "../../../api/haccp";
import { computeCoolingEquipmentStatus } from "../../../lib/haccpHelpers";
import "./HaccpForms.css";

const CHECKS = [
    { key: "box_clean", label: "Kühlbox ist sauber." },
    { key: "box_intact", label: "Kühlbox ist unbeschädigt." },
    { key: "cooling_unit_working", label: "Kühlgerät funktioniert." },
    { key: "thermometer_working", label: "Thermometer funktioniert." },
    { key: "required_temp_achieved", label: "Erforderliche Temperatur ist erreicht." },
    { key: "products_in_correct_compartment", label: "Produkte sind im richtigen Fach." },
    { key: "no_cross_contamination_risk", label: "Keine Kreuzkontaminationsgefahr." },
];

const INITIAL = Object.fromEntries(CHECKS.map((c) => [c.key, false]));

export default function CoolingEquipmentCheck() {
    const [roundNumber, setRoundNumber] = useState("");
    const [boxNumber, setBoxNumber] = useState("");
    const [checks, setChecks] = useState(INITIAL);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const overallStatus = computeCoolingEquipmentStatus(checks);
    const hasFailure = overallStatus === "failed";

    const toggleCheck = (key) =>
        setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

    const resetForm = () => {
        setRoundNumber("");
        setBoxNumber("");
        setChecks(INITIAL);
        setNotes("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!boxNumber.trim()) return toast.error("Bitte Kühlbox-Nummer eingeben.");

        setSubmitting(true);
        const toastId = toast.loading("Kühlgeräte-Check wird gespeichert...");

        const result = await saveCoolingEquipmentCheck({
            round_number: roundNumber.trim() || null,
            box_number: boxNumber.trim(),
            ...checks,
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
            toast.success("✅ Kühlgeräte-Check bestanden", { id: toastId });
        }

        resetForm();
        setSubmitting(false);
    };

    return (
        <form className="hf-form" onSubmit={handleSubmit}>
            <div className="hf-form-header">
                <span className="material-symbols-outlined">ac_unit</span>
                <h3>Kühlgeräte- & Boxencheck</h3>
            </div>

            <div className="hf-row">
                <div className="hf-field">
                    <label>Tournummer</label>
                    <input
                        type="text"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(e.target.value)}
                        placeholder="optional"
                        disabled={submitting}
                    />
                </div>

                <div className="hf-field">
                    <label>Kühlbox-Nummer *</label>
                    <input
                        type="text"
                        value={boxNumber}
                        onChange={(e) => setBoxNumber(e.target.value)}
                        placeholder="z.B. BOX-01"
                        disabled={submitting}
                    />
                </div>
            </div>

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

            <div
                className={`hf-status ${hasFailure ? "hf-status-failed" : "hf-status-passed"}`}
            >
                <span className="material-symbols-outlined">
                    {hasFailure ? "error" : "check_circle"}
                </span>
                {hasFailure
                    ? "Problem erkannt — Verstoß wird gemeldet"
                    : "Alle Punkte erfüllt"}
            </div>

            <div className="hf-field">
                <label>Notizen</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optionale Anmerkungen..."
                    maxLength={500}
                    disabled={submitting}
                />
            </div>

            <button type="submit" className="hf-submit" disabled={submitting}>
                {submitting ? (
                    <>
                        <span className="hf-spinner" />
                        Wird gespeichert...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">save</span>
                        Check speichern
                    </>
                )}
            </button>
        </form>
    );
}