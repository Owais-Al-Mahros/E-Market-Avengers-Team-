import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    fetchAllFaq,
    createFaq,
    updateFaq,
    deleteFaq,
    toggleFaqPublished,
} from "../../../../api/faq";
import { FAQ_CATEGORIES, getFaqCategory } from "../../../../lib/faqHelpers";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import "./FaqSection.css";

const EMPTY = {
    question: "",
    answer: "",
    category: "general",
    display_order: 0,
    is_published: true,
};

export default function FaqSection() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        setLoading(true);
        const res = await fetchAllFaq();
        if (res.success) setItems(res.data);
        else toast.error(res.error);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setDraft({ ...EMPTY, display_order: items.length });
        setEditorOpen(true);
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setDraft({
            question: item.question,
            answer: item.answer,
            category: item.category,
            display_order: item.display_order || 0,
            is_published: item.is_published !== false,
        });
        setEditorOpen(true);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEditingId(null);
        setDraft(EMPTY);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!draft.question.trim() || !draft.answer.trim()) {
            toast.error("Question and answer are required");
            return;
        }

        setSaving(true);
        const payload = {
            question: draft.question.trim(),
            answer: draft.answer.trim(),
            category: draft.category,
            display_order: Number(draft.display_order) || 0,
            is_published: draft.is_published,
        };

        const result = editingId
            ? await updateFaq(editingId, payload)
            : await createFaq(payload);

        if (result.success) {
            toast.success(editingId ? "FAQ updated" : "FAQ created");
            closeEditor();
            load();
        } else {
            toast.error(result.error);
        }
        setSaving(false);
    };

    const handleToggle = async (item) => {
        const result = await toggleFaqPublished(item.id, !item.is_published);
        if (result.success) {
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id ? { ...i, is_published: !i.is_published } : i
                )
            );
            toast.success(item.is_published ? "Hidden from public" : "Published");
        } else {
            toast.error(result.error);
        }
    };

    const performDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        const result = await deleteFaq(pendingDelete.id);
        if (result.success) {
            toast.success("FAQ deleted");
            setPendingDelete(null);
            load();
        } else {
            toast.error(result.error);
        }
        setDeleting(false);
    };

    return (
        <div className="faq-section">
            {/* Header */}
            <header className="faq-head">
                <div>
                    <h2>📚 FAQ Management</h2>
                    <p>Create and manage frequently asked questions for your customers.</p>
                </div>
                <button className="faq-add-btn" onClick={openCreate}>
                    <span className="material-symbols-outlined">add</span>
                    New Question
                </button>
            </header>

            {/* List */}
            {loading ? (
                <div className="faq-state">Loading...</div>
            ) : items.length === 0 ? (
                <div className="faq-state faq-empty">
                    <span className="material-symbols-outlined">quiz</span>
                    <h3>No questions yet</h3>
                    <p>Create your first FAQ entry.</p>
                </div>
            ) : (
                <div className="faq-admin-list">
                    {items.map((item) => {
                        const cat = getFaqCategory(item.category);
                        return (
                            <article
                                key={item.id}
                                className={`faq-admin-item ${!item.is_published ? "is-hidden" : ""
                                    }`}
                            >
                                <div className="faq-admin-main">
                                    <div className="faq-admin-meta">
                                        <span className="faq-admin-cat">
                                            <span className="material-symbols-outlined">
                                                {cat.icon}
                                            </span>
                                            {cat.label}
                                        </span>
                                        <span className="faq-admin-order">
                                            #{item.display_order}
                                        </span>
                                        {!item.is_published && (
                                            <span className="faq-admin-hidden">Hidden</span>
                                        )}
                                    </div>
                                    <h4 className="faq-admin-q">{item.question}</h4>
                                    <p className="faq-admin-a">{item.answer}</p>
                                </div>

                                <div className="faq-admin-actions">
                                    <button
                                        className="faq-icon-btn"
                                        onClick={() => handleToggle(item)}
                                        title={item.is_published ? "Hide" : "Publish"}
                                    >
                                        <span className="material-symbols-outlined">
                                            {item.is_published ? "visibility" : "visibility_off"}
                                        </span>
                                    </button>
                                    <button
                                        className="faq-icon-btn"
                                        onClick={() => openEdit(item)}
                                        title="Edit"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        className="faq-icon-btn faq-icon-danger"
                                        onClick={() => setPendingDelete(item)}
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Editor Modal */}
            {editorOpen && (
                <div className="faq-modal-overlay" onClick={closeEditor}>
                    <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
                        <header className="faq-modal-head">
                            <h3>{editingId ? "Edit Question" : "New Question"}</h3>
                            <button onClick={closeEditor} className="faq-modal-close">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleSave} className="faq-modal-body">
                            <div className="faq-field">
                                <label>Category</label>
                                <select
                                    value={draft.category}
                                    onChange={(e) =>
                                        setDraft({ ...draft, category: e.target.value })
                                    }
                                >
                                    {FAQ_CATEGORIES.map((c) => (
                                        <option key={c.key} value={c.key}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="faq-field">
                                <label>Question *</label>
                                <input
                                    type="text"
                                    value={draft.question}
                                    onChange={(e) =>
                                        setDraft({ ...draft, question: e.target.value })
                                    }
                                    placeholder="e.g., How long does delivery take?"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="faq-field">
                                <label>Answer *</label>
                                <textarea
                                    rows={6}
                                    value={draft.answer}
                                    onChange={(e) =>
                                        setDraft({ ...draft, answer: e.target.value })
                                    }
                                    placeholder="Detailed answer..."
                                    required
                                    maxLength={2000}
                                />
                            </div>

                            <div className="faq-row">
                                <div className="faq-field">
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        value={draft.display_order}
                                        onChange={(e) =>
                                            setDraft({
                                                ...draft,
                                                display_order: Number(e.target.value),
                                            })
                                        }
                                        min={0}
                                    />
                                </div>

                                <div className="faq-field faq-field-toggle">
                                    <label>Visibility</label>
                                    <label className="faq-toggle">
                                        <input
                                            type="checkbox"
                                            checked={draft.is_published}
                                            onChange={(e) =>
                                                setDraft({ ...draft, is_published: e.target.checked })
                                            }
                                        />
                                        <span>
                                            {draft.is_published ? "Published" : "Hidden"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="faq-modal-actions">
                                <button
                                    type="button"
                                    className="faq-btn faq-btn-secondary"
                                    onClick={closeEditor}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="faq-btn faq-btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {pendingDelete && (
                <ConfirmDialog
                    isOpen={true}
                    title="Delete this question?"
                    message={`"${pendingDelete.question}" will be permanently removed.`}
                    variant="danger"
                    icon="delete"
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    isLoading={deleting}
                    onConfirm={performDelete}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
        </div>
    );
}