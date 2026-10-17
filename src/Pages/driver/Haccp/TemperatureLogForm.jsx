// src/Pages/driver/components/Haccp/TemperatureLogForm.jsx
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { useHaccp } from "../../../context/HaccpContext";
import { saveTemperatureLog } from "../../../api/haccp";
import {
    computeTemperatureStatus,
    formatTemp,
} from "../../../lib/haccpHelpers";
import "./HaccpForms.css";

export default function TemperatureLogForm() {
    const { thermalCategories } = useHaccp();

    const [roundNumber, setRoundNumber] = useState("");
    const [boxNumber, setBoxNumber] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [requiredTemp, setRequiredTemp] = useState("");
    const [actualTemp, setActualTemp] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const selectedCategory = useMemo(
        () => thermalCategories.find((c) => c.id === categoryId),
        [thermalCategories, categoryId]
    );

    /* عند تغيير الفئة → نعيّن درجة الحرارة المطلوبة الافتراضية */
    useEffect(() => {
        if (selectedCategory) {
            setRequiredTemp(String(selectedCategory.default_temp));
        }
    }, [selectedCategory]);

    /* الحالة تُحسب آليًا */
    const computedStatus = useMemo(() => {
        if (!selectedCategory || actualTemp === "") return null;
        const actual = parseFloat(actualTemp);
        if (isNaN(actual)) return null;
        return computeTemperatureStatus(
            actual,
            parseFloat(selectedCategory.min_temp),
            parseFloat(selectedCategory.max_temp)
        );
    }, [selectedCategory, actualTemp]);

    const resetForm = () => {
        setRoundNumber("");
        setBoxNumber("");
        setCategoryId("");
        setRequiredTemp("");
        setActualTemp("");
        setNotes("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!roundNumber.trim()) return toast.error("Bitte Tournummer eingeben.");
        if (!boxNumber.trim()) return toast.error("Bitte Kühlbox-Nummer eingeben.");
        if (!categoryId) return toast.error("Bitte Produktkategorie wählen.");
        if (actualTemp === "") return toast.error("Bitte Ist-Temperatur eingeben.");

        setSubmitting(true);
        const toastId = toast.loading("Temperatur wird protokolliert...");

        const result = await saveTemperatureLog({
            round_number: roundNumber.trim(),
            box_number: boxNumber.trim(),
            category_id: categoryId,
            required_temp: parseFloat(requiredTemp),
            actual_temp: parseFloat(actualTemp),
            notes: notes.trim() || null,
        });

        if (!result.success) {
            toast.error(result.error || "Fehler", { id: toastId });
            setSubmitting(false);
            return;
        }

        const status = result.data?.check_status;
        if (status === "non_compliant") {
            toast.error("🚨 Temperatur außerhalb des Bereichs — Verstoß gemeldet", {
                id: toastId,
                duration: 6000,
            });
        } else if (status === "review_needed") {
            toast("⚠️ Temperatur nahe der Grenze — wird überprüft", {
                id: toastId,
                duration: 5000,
            });
        } else {
            toast.success("✅ Temperatur im zulässigen Bereich", { id: toastId });
        }

        resetForm();
        setSubmitting(false);
    };

    const statusBannerClass =
        computedStatus === "compliant"
            ? "hf-status-passed"
            : computedStatus === "review_needed"
                ? "hf-status-info"
                : "hf-status-failed";

    const statusBannerIcon =
        computedStatus === "compliant"
            ? "check_circle"
            : computedStatus === "review_needed"
                ? "info"
                : "error";

    const statusBannerText =
        computedStatus === "compliant"
            ? "Temperatur im zulässigen Bereich"
            : computedStatus === "review_needed"
                ? "Temperatur nahe der Grenze — Nachkontrolle empfohlen"
                : "Temperatur außerhalb des Bereichs — Verstoß wird gemeldet";

    return (
        <form className="hf-form" onSubmit={handleSubmit}>
            <div className="hf-form-header">
                <span className="material-symbols-outlined">thermostat</span>
                <h3>Kühlkettenüberwachung</h3>
            </div>

            <div className="hf-row">
                <div className="hf-field">
                    <label>Tournummer *</label>
                    <input
                        type="text"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(e.target.value)}
                        placeholder="z.B. TOUR-01"
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

            <div className="hf-field">
                <label>Produktkategorie *</label>
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={submitting}
                >
                    <option value="">— Kategorie wählen —</option>
                    {thermalCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.label_de} ({c.min_temp} bis {c.max_temp} °C)
                        </option>
                    ))}
                </select>
                {selectedCategory && (
                    <span className="hf-field-hint">{selectedCategory.description_de}</span>
                )}
            </div>

            <div className="hf-row">
                <div className="hf-field">
                    <label>Soll-Temperatur (°C)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={requiredTemp}
                        onChange={(e) => setRequiredTemp(e.target.value)}
                        disabled={submitting || !selectedCategory}
                        readOnly={!!selectedCategory}
                    />
                </div>

                <div className="hf-field">
                    <label>Ist-Temperatur (°C) *</label>
                    <input
                        type="number"
                        step="0.1"
                        value={actualTemp}
                        onChange={(e) => setActualTemp(e.target.value)}
                        placeholder="z.B. -17.5"
                        disabled={submitting}
                    />
                </div>
            </div>

            {/* Auto status */}
            {computedStatus && (
                <div className={`hf-status ${statusBannerClass}`}>
                    <span className="material-symbols-outlined">{statusBannerIcon}</span>
                    {statusBannerText}
                </div>
            )}

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
                        Temperatur speichern
                    </>
                )}
            </button>
        </form>
    );
}