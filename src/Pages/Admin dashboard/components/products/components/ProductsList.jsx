import { useEffect, useState } from "react";
import { useProducts } from "../../../../../context/ProductContext";
import { useCategories } from "../../../../../context/CategoryContext";
import { useSubcategories } from "../../../../../context/SubcategoryContext";
import { deleteProduct as deleteProductAPI } from "../../../../../api";
import AdminDashboardProductCard from "./AdminDashboardProductCard";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import "./ProductsList.css";

const PAGE_SIZE = 40;

export default function ProductsList({ onEditProduct, onAddProduct }) {
    const {
        fetchProductsPaginated,
        paginatedProducts,
        paginationLoading,
        paginationMeta,
    } = useProducts();
    const { categories } = useCategories();
    const { subcategories } = useSubcategories();

    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [categoryId, subcategoryId, debouncedSearch]);

    // Fetch when filters/page change
    useEffect(() => {
        fetchProductsPaginated({
            categoryId: categoryId ? Number(categoryId) : null,
            subcategoryId: subcategoryId ? Number(subcategoryId) : null,
            search: debouncedSearch || null,
            page,
            limit: PAGE_SIZE,
        });
    }, [fetchProductsPaginated, categoryId, subcategoryId, debouncedSearch, page]);

    const filteredSubcategories = categoryId
        ? subcategories.filter((s) => Number(s.category_id) === Number(categoryId))
        : [];

    const totalPages = Math.max(1, Math.ceil(paginationMeta.total / PAGE_SIZE));

    const handleDeleteClick = (id, name) => setPendingDelete({ id, name });

    const performDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const ok = await deleteProductAPI(pendingDelete.id);
            if (!ok) throw new Error("Failed to delete");
            toast.success("Product deleted");
            setPendingDelete(null);
            // Refresh current page
            fetchProductsPaginated({
                categoryId: categoryId ? Number(categoryId) : null,
                subcategoryId: subcategoryId ? Number(subcategoryId) : null,
                search: debouncedSearch || null,
                page,
                limit: PAGE_SIZE,
            });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="pl-wrap">
            {/* Toolbar */}
            <div className="pl-toolbar">
                <div className="pl-search">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Search by name or product number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="pl-select"
                    value={categoryId}
                    onChange={(e) => {
                        setCategoryId(e.target.value);
                        setSubcategoryId("");
                    }}
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {categoryId && filteredSubcategories.length > 0 && (
                    <select
                        className="pl-select"
                        value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}
                    >
                        <option value="">All subcategories</option>
                        {filteredSubcategories.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Meta line */}
            <div className="pl-meta">
                <span>
                    {paginationMeta.total.toLocaleString("de-DE")} products
                    {paginationMeta.total > 0 && ` · page ${page} of ${totalPages}`}
                </span>
            </div>

            {/* Content */}
            {paginationLoading ? (
                <div className="pl-state">Loading products...</div>
            ) : paginatedProducts.length === 0 ? (
                <div className="pl-empty">
                    <span className="material-symbols-outlined">inventory_2</span>
                    <h3>No products found</h3>
                    <p>Try changing the filters, or add a new product.</p>
                    <button className="pl-add-btn" onClick={onAddProduct}>
                        <span className="material-symbols-outlined">add</span>
                        Add Product
                    </button>
                </div>
            ) : (
                <>
                    <div className="pl-grid">
                        {paginatedProducts.map((p) => (
                            <AdminDashboardProductCard
                                key={p.id}
                                id={p.id}
                                name={p.name}
                                image={p.image}
                                price={p.price}
                                total_price={p.total_price}
                                weight={p.weight}
                                weight_unit={p.weight_unit}
                                tax_rate={p.tax_rate}
                                category_id={p.category_id}
                                subcategory_id={p.subcategory_id}
                                product_number={p.product_number}
                                ingredients={p.ingredients}
                                description={p.description}
                                nutritionObject={p.nutrition_facts}
                                storageObject={p.storage_notes}
                                onDelete={handleDeleteClick}
                                onEdit={() => onEditProduct(p)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pl-pagination">
                            <button
                                className="pl-page-btn"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                                Previous
                            </button>

                            <span className="pl-page-info">
                                Page {page} / {totalPages}
                            </span>

                            <button
                                className="pl-page-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Next
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {pendingDelete && (
                <ConfirmDialog
                    isOpen={true}
                    title={`Delete "${pendingDelete.name}"?`}
                    message="This action cannot be undone."
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