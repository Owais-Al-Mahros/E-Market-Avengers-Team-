import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useProducts } from "../../../../context/ProductContext";
import { useFeatured } from "../../../../context/FeaturedContext";
import { fetchFeaturedIds } from "../../../../api/featured";
import {
    MAX_FEATURED,
    toggleFeatured,
    moveUp,
} from "../../../../lib/featuredHelpers";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import "./FeaturedSection.css";

export default function FeaturedSection() {
    const { products, loading: productsLoading } = useProducts();
    const { save, saving } = useFeatured();

    const [selected, setSelected] = useState([]);
    const [initial, setInitial] = useState([]);
    const [loadingIds, setLoadingIds] = useState(true);
    const [search, setSearch] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    /* ═══ Load current ═══ */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingIds(true);
            const result = await fetchFeaturedIds();
            if (cancelled) return;
            if (result.success) {
                setSelected(result.data);
                setInitial(result.data);
            }
            setLoadingIds(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /* ═══ Derived ═══ */
    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return products;
        return products.filter(
            (p) =>
                p.name?.toLowerCase().includes(term) ||
                String(p.product_number || "").includes(term)
        );
    }, [products, search]);

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const hasChanges = useMemo(() => {
        if (selected.length !== initial.length) return true;
        return selected.some((id, i) => id !== initial[i]);
    }, [selected, initial]);

    const isFull = selected.length >= MAX_FEATURED;

    /* ═══ Handlers ═══ */
    const handleToggle = (productId) => {
        if (!selectedSet.has(productId) && isFull) {
            toast.error(`Maximum ${MAX_FEATURED} products allowed`);
            return;
        }
        setSelected((prev) => toggleFeatured(prev, productId));
    };

    const handleRemove = (productId) => {
        setSelected((prev) => prev.filter((id) => id !== productId));
    };

    const handleMoveUp = (productId) => {
        setSelected((prev) => moveUp(prev, productId));
    };

    const handleSave = async () => {
        setShowConfirm(false);
        const result = await save(selected);
        if (result.success) {
            toast.success("Featured products updated");
            setInitial(selected);
        } else {
            toast.error(result.error);
        }
    };

    const handleReset = () => {
        setSelected(initial);
        toast("Reverted to last saved", { icon: "↺" });
    };

    /* ═══ Render ═══ */
    return (
        <div className="feat-page">
            {/* Header */}
            <header className="feat-head">
                <div>
                    <h2>🔥 Featured Products</h2>
                    <p>
                        Hand-pick up to {MAX_FEATURED} products to display on the home
                        page, between the features bar and the categories section.
                    </p>
                </div>
                <div className="feat-head-actions">
                    {hasChanges && (
                        <button
                            type="button"
                            className="feat-btn feat-btn-secondary"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            <span className="material-symbols-outlined">undo</span>
                            Reset
                        </button>
                    )}
                    <button
                        type="button"
                        className="feat-btn feat-btn-primary"
                        onClick={() => setShowConfirm(true)}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <>
                                <span className="feat-spinner-sm" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Progress */}
            <div className="feat-progress-bar">
                <div className="feat-progress-info">
                    <strong>{selected.length}</strong> / {MAX_FEATURED} selected
                    {isFull && <span className="feat-progress-full">· Full</span>}
                    {hasChanges && (
                        <span className="feat-progress-dirty">· Unsaved changes</span>
                    )}
                </div>
                <div className="feat-progress-track">
                    <div
                        className="feat-progress-fill"
                        style={{ width: `${(selected.length / MAX_FEATURED) * 100}%` }}
                    />
                </div>
            </div>

            {/* Selected Preview */}
            {selected.length > 0 && (
                <section className="feat-selected-panel">
                    <h3 className="feat-subtitle">
                        <span className="material-symbols-outlined">star</span>
                        Selected Order
                    </h3>
                    <div className="feat-selected-list">
                        {selected.map((id, idx) => {
                            const product = products.find((p) => p.id === id);
                            if (!product) return null;
                            return (
                                <div key={id} className="feat-selected-chip">
                                    <span className="feat-selected-rank">#{idx + 1}</span>
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt=""
                                            className="feat-selected-thumb"
                                        />
                                    )}
                                    <span className="feat-selected-name">{product.name}</span>
                                    <div className="feat-selected-actions">
                                        <button
                                            type="button"
                                            className="feat-icon-btn-sm"
                                            onClick={() => handleMoveUp(id)}
                                            disabled={idx === 0}
                                            title="Move up"
                                        >
                                            <span className="material-symbols-outlined">
                                                arrow_upward
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className="feat-icon-btn-sm feat-danger"
                                            onClick={() => handleRemove(id)}
                                            title="Remove"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Search */}
            <div className="feat-search">
                <span className="material-symbols-outlined">search</span>
                <input
                    type="text"
                    placeholder="Search products by name or number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        type="button"
                        className="feat-search-clear"
                        onClick={() => setSearch("")}
                        aria-label="Clear"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {/* Grid */}
            {productsLoading || loadingIds ? (
                <div className="feat-state">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="feat-state">
                    <span className="material-symbols-outlined">search_off</span>
                    <p>No products found</p>
                </div>
            ) : (
                <div className="feat-grid">
                    {filteredProducts.map((product) => {
                        const isSelected = selectedSet.has(product.id);
                        const rank = isSelected
                            ? selected.indexOf(product.id) + 1
                            : null;
                        const isDisabled = !isSelected && isFull;

                        return (
                            <button
                                key={product.id}
                                type="button"
                                className={`feat-card ${isSelected ? "is-selected" : ""} ${isDisabled ? "is-disabled" : ""
                                    }`}
                                onClick={() => handleToggle(product.id)}
                                disabled={isDisabled}
                            >
                                {isSelected && (
                                    <span className="feat-card-rank">#{rank}</span>
                                )}
                                <span className="feat-card-check">
                                    <span className="material-symbols-outlined">
                                        {isSelected ? "check" : "add"}
                                    </span>
                                </span>

                                <div className="feat-card-image">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined">image</span>
                                    )}
                                </div>

                                <div className="feat-card-info">
                                    <span className="feat-card-name">{product.name}</span>
                                    <span className="feat-card-price">
                                        €{Number(product.total_price || 0).toFixed(2)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Confirm */}
            {showConfirm && (
                <ConfirmDialog
                    isOpen={true}
                    title="Save featured products?"
                    message={
                        <>
                            <p>
                                <strong>{selected.length}</strong> product
                                {selected.length !== 1 ? "s" : ""} will be displayed on the
                                home page.
                            </p>
                            <p>This replaces the current featured selection.</p>
                        </>
                    }
                    variant="warning"
                    icon="star"
                    confirmLabel="Save"
                    cancelLabel="Cancel"
                    isLoading={saving}
                    onConfirm={handleSave}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
}