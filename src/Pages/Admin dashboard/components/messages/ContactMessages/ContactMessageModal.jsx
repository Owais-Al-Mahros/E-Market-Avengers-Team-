import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { supabase } from "../../../../../lib/supabase";
import { useMessages } from "../../../../../context/MessagesContext";
import {
    getMessageCategory,
    getMessageStatus,
    formatMessageDate,
} from "../../../../../lib/messageHelpers";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import "./ContactMessageModal.css";

export default function ContactMessageModal({ message, onClose }) {
    const { markRead, reply, remove } = useMessages();
    const [replyText, setReplyText] = useState(message.admin_reply || "");
    const [sending, setSending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /* ═══ Auto mark as read ═══ */
    useEffect(() => {
        if (message.status === "pending") {
            markRead(message.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message.id]);

    const cat = getMessageCategory(message.category);
    const status = getMessageStatus(message.status);

    /* ═══ Send Reply ═══ */
    const handleSendReply = async () => {
        const text = replyText.trim();
        if (text.length < 5) {
            toast.error("Antwort ist zu kurz");
            return;
        }

        setSending(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const result = await reply(message.id, text, user?.id);

        if (result.success) {
            toast.success("✅ Antwort gespeichert");
            onClose();
        } else {
            toast.error(result.error || "Antwort konnte nicht gespeichert werden");
        }
        setSending(false);
    };

    /* ═══ Delete Message ═══ */
    const handleDelete = async () => {
        setDeleting(true);
        const result = await remove(message.id);
        if (result.success) {
            toast.success("Nachricht gelöscht");
            setShowDeleteConfirm(false);
            onClose();
        } else {
            toast.error(result.error);
        }
        setDeleting(false);
    };

    const replyIsValid = replyText.trim().length >= 5;

    return createPortal(
        <>
            <div className="cmsgm-overlay" onClick={onClose}>
                <div className="cmsgm-modal" onClick={(e) => e.stopPropagation()}>
                    {/* ═══ Header ═══ */}
                    <header className="cmsgm-header">
                        <div className="cmsgm-header-info">
                            <h2>{message.subject}</h2>
                            <p>{formatMessageDate(message.created_at)}</p>
                        </div>
                        <button
                            type="button"
                            className="cmsgm-close"
                            onClick={onClose}
                            aria-label="Schließen"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </header>

                    {/* ═══ Body ═══ */}
                    <div className="cmsgm-body">
                        {/* Info Grid */}
                        <div className="cmsgm-info-grid">
                            <div className="cmsgm-info-block">
                                <span className="cmsgm-label">Absender</span>
                                <strong className="cmsgm-name">{message.name}</strong>
                                <a
                                    href={`mailto:${message.email}`}
                                    className="cmsgm-link"
                                >
                                    {message.email}
                                </a>
                                {message.phone && (
                                    <a
                                        href={`tel:${message.phone}`}
                                        className="cmsgm-link"
                                    >
                                        📞 {message.phone}
                                    </a>
                                )}
                            </div>

                            <div className="cmsgm-info-block">
                                <span className="cmsgm-label">Kategorie & Status</span>
                                <span className="cmsgm-cat">
                                    <span className="material-symbols-outlined">
                                        {cat.icon}
                                    </span>
                                    {cat.label}
                                </span>
                                <span className={`cmsg-status-badge ${status.class}`}>
                                    {status.icon} {status.label}
                                </span>
                            </div>
                        </div>

                        {/* Original Message */}
                        <div className="cmsgm-block">
                            <span className="cmsgm-label">Nachricht</span>
                            <p className="cmsgm-text">{message.message}</p>
                        </div>

                        {/* Existing Reply */}
                        {message.admin_reply && (
                            <div className="cmsgm-block cmsgm-block-reply">
                                <span className="cmsgm-label">
                                    Ihre Antwort · {formatMessageDate(message.replied_at)}
                                </span>
                                <p className="cmsgm-text">{message.admin_reply}</p>
                            </div>
                        )}

                        {/* Reply Form */}
                        <div className="cmsgm-block">
                            <label className="cmsgm-label" htmlFor="cmsgm-reply">
                                {message.admin_reply
                                    ? "Antwort bearbeiten"
                                    : "Antwort schreiben"}
                            </label>
                            <textarea
                                id="cmsgm-reply"
                                rows={5}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Schreiben Sie Ihre Antwort..."
                                maxLength={2000}
                                disabled={sending}
                            />
                            <small className="cmsgm-counter">
                                {replyText.length} / 2000
                            </small>
                        </div>
                    </div>

                    {/* ═══ Footer ═══ */}
                    <footer className="cmsgm-footer">
                        <button
                            type="button"
                            className="cmsgm-btn cmsgm-btn-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={sending}
                        >
                            <span className="material-symbols-outlined">delete</span>
                            Löschen
                        </button>

                        <div className="cmsgm-footer-right">
                            <button
                                type="button"
                                className="cmsgm-btn cmsgm-btn-secondary"
                                onClick={onClose}
                                disabled={sending}
                            >
                                Schließen
                            </button>
                            <button
                                type="button"
                                className="cmsgm-btn cmsgm-btn-primary"
                                onClick={handleSendReply}
                                disabled={sending || !replyIsValid}
                            >
                                {sending ? (
                                    <>
                                        <span className="cmsgm-spinner" />
                                        Wird gesendet...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">send</span>
                                        Antworten
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            {/* ═══ Delete Confirm ═══ */}
            {showDeleteConfirm && (
                <ConfirmDialog
                    isOpen={true}
                    title="Nachricht löschen?"
                    message="Diese Aktion kann nicht rückgängig gemacht werden. Die Nachricht wird dauerhaft entfernt."
                    variant="danger"
                    icon="delete"
                    confirmLabel="Löschen"
                    cancelLabel="Abbrechen"
                    isLoading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>,
        document.body
    );
}