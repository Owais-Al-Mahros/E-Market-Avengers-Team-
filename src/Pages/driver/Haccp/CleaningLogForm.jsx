// src/Pages/driver/components/Haccp/CleaningLogForm.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { saveCleaningLog } from "../../../api/haccp";
import "./HaccpForms.css";

const EQUIPMENT_OPTIONS = [
    { key: "Ladefläche / Ladebereich", label: "🚚 Ladefläche / Ladebereich" },
    { key: "Transportboxen", label: "📦 Transportboxen" },
    { key: "Kühlboxen", label: "❄️ Kühlboxen" },
    { key: "Transportwerkzeuge", label: "🔧 Transportwerkzeuge" },
    { key: "Sonstiges", label: "🔹 Sonstiges" },
];

export default function CleaningLogForm() {
    const [equipmentName, setEquipmentName] = useState("");
    const [customEquipment, setCustomEquipment] = useState("");
    const [cleaningMethod, setCleaningMethod] = useState("");
    const [result, setResult] = useState("passed");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setEquipmentName("");
        setCustomEquipment("");
        setCleaningMethod("");
        setResult("passed");
        setNotes("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalEquipment =
            equipmentName === "Sonstiges" ? customEquipment.trim() : equipmentName;

        if (!finalEquipment)
            return toast.error("Bitte Ausrüstung wählen oder angeben.");
        if (!cleaningMethod.trim())
            return toast.error("Bitte Reinigungsmethode angeben.");

        setSubmitting(true);
        const toastId = toast.loading("Reinigungsprotokoll wird gespeichert...");

        const res = await saveCleaningLog({
            equipment_name: finalEquipment,
            cleaning_method: cleaningMethod.trim(),
            result,
            notes: notes.trim() || null,
        });

        if (!res.success) {
            toast.error(res.error || "Fehler", { id: toastId });
            setSubmitting(false);
            return;
        }

        if (result === "failed") {
            toast.error("⚠️ Reinigung fehlgeschlagen — Verstoß gemeldet", {
                id: toastId,
                duration: 5000,
            });
        } else {
            toast.success("✅ Reinigungsprotokoll gespeichert", { id: toastId });
        }

        resetForm();
        setSubmitting(false);
    };

    return (
        <form className="hf-form" onSubmit={handleSubmit}>
            <div className="hf-form-header">
                <span className="material-symbols-outlined">cleaning_services</span>
                <h3>Reinigungsprotokoll</h3>
            </div>

            <div className="hf-field">
                <label>Gereinigte Ausrüstung *</label>
                <select
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    disabled={submitting}
                >
                    <option value="">— Ausrüstung wählen —</option>
                    {EQUIPMENT_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {equipmentName === "Sonstiges" && (
                <div className="hf-field">
                    <label>Welche Ausrüstung? *</label>
                    <input
                        type="text"
                        value={customEquipment}
                        onChange={(e) => setCustomEquipment(e.target.value)}
                        placeholder="Beschreiben Sie die Ausrüstung..."
                        maxLength={100}
                        disabled={submitting}
                    />
                </div>
            )}

            <div className="hf-field">
                <label>Reinigungsmethode *</label>
                <textarea
                    value={cleaningMethod}
                    onChange={(e) => setCleaningMethod(e.target.value)}
                    placeholder="z.B. Heißwasser + Desinfektionsmittel, 5 Min Einwirkzeit"
                    maxLength={300}
                    disabled={submitting}
                />
                <span className="hf-field-hint">
                    Gemäß genehmigtem Reinigungsplan
                </span>
            </div>

            <div className="hf-field">
                <label>Ergebnis *</label>
                <div className="hf-chips">
                    <button
                        type="button"
                        className={`hf-chip ${result === "passed" ? "is-active" : ""}`}
                        onClick={() => setResult("passed")}
                        disabled={submitting}
                    >
                        ✅ Bestanden
                    </button>
                    <button
                        type="button"
                        className={`hf-chip ${result === "failed" ? "is-active" : ""}`}
                        onClick={() => setResult("failed")}
                        disabled={submitting}
                        style={
                            result === "failed"
                                ? { background: "#dc2626", borderColor: "#dc2626" }
                                : undefined
                        }
                    >
                        ❌ Fehlgeschlagen
                    </button>
                </div>
            </div>

            <div
                className={`hf-status ${result === "passed" ? "hf-status-passed" : "hf-status-failed"}`}
            >
                <span className="material-symbols-outlined">
                    {result === "passed" ? "check_circle" : "error"}
                </span>
                {result === "passed"
                    ? "Reinigung erfolgreich abgeschlossen"
                    : "Reinigung fehlgeschlagen — Verstoß wird gemeldet"}
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
                        Protokoll speichern
                    </>
                )}
            </button>
        </form>
    );
}