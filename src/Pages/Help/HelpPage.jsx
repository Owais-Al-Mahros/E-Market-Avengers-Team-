import { useState } from "react";
import toast from "react-hot-toast";
import { sendContactMessage } from "../../api/messages";
import { MESSAGE_CATEGORIES } from "../../lib/messageHelpers";
import { useMyInfo } from "../../context/MyInfoContext";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import "./HelpPage.css";

const EMPTY = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "general",
};

export default function HelpPage() {
    const { info } = useMyInfo();
    const [form, setForm] = useState(() => ({
        ...EMPTY,
        name: `${info.firstName || ""} ${info.lastName || ""}`.trim(),
        email: info.email || "",
        phone: info.phone || "",
    }));
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (sending) return;

        setSending(true);
        const toastId = toast.loading("Nachricht wird gesendet...");

        const result = await sendContactMessage(form);

        if (!result.success) {
            toast.error(result.error || "Senden fehlgeschlagen", { id: toastId });
            setSending(false);
            return;
        }

        toast.success("✅ Nachricht gesendet! Wir melden uns bald.", {
            id: toastId,
            duration: 5000,
        });
        setSent(true);
        setSending(false);
        setForm({ ...EMPTY });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <Header />

            <main className="help-page">
                <div className="help-hero">
                    <span className="help-badge">📮 Kontakt</span>
                    <h1>Wie können wir helfen?</h1>
                    <p>Schreiben Sie uns Ihr Anliegen – wir antworten innerhalb von 24h.</p>
                </div>

                <div className="help-layout">
                    {/* Left: Info + FAQ link */}
                    <aside className="help-info">
                        <div className="help-info-card">
                            <span className="material-symbols-outlined">help_center</span>
                            <h3>Häufige Fragen</h3>
                            <p>Viele Antworten finden Sie direkt in unserem FAQ-Bereich.</p>
                            <a href="/faq" className="help-info-link">
                                Zum FAQ <span className="material-symbols-outlined">arrow_forward</span>
                            </a>
                        </div>

                        <div className="help-info-card">
                            <span className="material-symbols-outlined">schedule</span>
                            <h3>Antwortzeit</h3>
                            <p>Wir antworten normalerweise innerhalb von <strong>24 Stunden</strong>, Mo–Fr.</p>
                        </div>

                        <div className="help-info-card">
                            <span className="material-symbols-outlined">shield</span>
                            <h3>Datenschutz</h3>
                            <p>Ihre Daten werden vertraulich behandelt und nicht weitergegeben.</p>
                        </div>
                    </aside>

                    {/* Right: Form */}
                    <section className="help-form-wrap">
                        {sent ? (
                            <div className="help-success">
                                <span className="material-symbols-outlined">mark_email_read</span>
                                <h2>Nachricht gesendet!</h2>
                                <p>Vielen Dank für Ihre Nachricht. Wir melden uns schnellstmöglich.</p>
                                <button
                                    className="help-success-btn"
                                    onClick={() => setSent(false)}
                                >
                                    Weitere Nachricht senden
                                </button>
                            </div>
                        ) : (
                            <form className="help-form" onSubmit={handleSubmit}>
                                {/* Category chips */}
                                <div className="help-field">
                                    <label>Anliegen *</label>
                                    <div className="help-category-chips">
                                        {MESSAGE_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.key}
                                                type="button"
                                                className={`help-chip ${form.category === cat.key ? "active" : ""
                                                    }`}
                                                onClick={() => setField("category", cat.key)}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {cat.icon}
                                                </span>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="help-field">
                                    <label>Betreff *</label>
                                    <input
                                        type="text"
                                        value={form.subject}
                                        onChange={(e) => setField("subject", e.target.value)}
                                        placeholder="z.B. Frage zu meiner Bestellung #1234"
                                        required
                                        maxLength={120}
                                    />
                                </div>

                                <div className="help-row">
                                    <div className="help-field">
                                        <label>Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setField("name", e.target.value)}
                                            required
                                            maxLength={80}
                                        />
                                    </div>
                                    <div className="help-field">
                                        <label>E-Mail *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setField("email", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="help-field">
                                    <label>Telefon (optional)</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setField("phone", e.target.value)}
                                        placeholder="+49..."
                                    />
                                </div>

                                <div className="help-field">
                                    <label>Nachricht *</label>
                                    <textarea
                                        rows={6}
                                        value={form.message}
                                        onChange={(e) => setField("message", e.target.value)}
                                        placeholder="Beschreiben Sie Ihr Anliegen..."
                                        required
                                        minLength={10}
                                        maxLength={2000}
                                    />
                                    <small className="help-counter">
                                        {form.message.length} / 2000
                                    </small>
                                </div>

                                <button
                                    type="submit"
                                    className="help-submit"
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <>
                                            <span className="help-spinner" />
                                            Wird gesendet...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">send</span>
                                            Nachricht senden
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            </main>

            <Subscribe />
            <Footer />
        </>
    );
}