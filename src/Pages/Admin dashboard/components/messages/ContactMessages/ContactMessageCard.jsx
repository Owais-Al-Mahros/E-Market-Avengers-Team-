import {
    getMessageCategory,
    getMessageStatus,
    formatMessageDate,
} from "../../../../../lib/messageHelpers";
import "./ContactMessageCard.css";

export default function ContactMessageCard({ message, onClick }) {
    const cat = getMessageCategory(message.category);
    const status = getMessageStatus(message.status);

    const preview =
        message.message.length > 120
            ? `${message.message.slice(0, 120)}…`
            : message.message;

    return (
        <button
            type="button"
            className={`cmsg-card cmsg-card-${message.status}`}
            onClick={onClick}
        >
            <div className="cmsg-card-header">
                <span className="cmsg-card-subject">{message.subject}</span>
                <span className={`cmsg-status-badge ${status.class}`}>
                    {status.icon} {status.label}
                </span>
            </div>

            <div className="cmsg-card-body">
                <strong className="cmsg-card-name">{message.name}</strong>
                <span className="cmsg-card-email">{message.email}</span>
            </div>

            <p className="cmsg-card-preview">{preview}</p>

            <div className="cmsg-card-meta">
                <span className="cmsg-card-cat">
                    <span className="material-symbols-outlined">{cat.icon}</span>
                    {cat.label}
                </span>
                <span className="cmsg-card-date">
                    {formatMessageDate(message.created_at)}
                </span>
            </div>
        </button>
    );
}