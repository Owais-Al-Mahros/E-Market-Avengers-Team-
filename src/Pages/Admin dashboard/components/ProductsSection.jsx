import "./ProductsSection.css";
import { useProducts } from "../../../context/ProductContext.jsx";
import { useState } from "react";
import ProductModal from "../modals/ProductModal.jsx";
import AddCataeory from "../modals/AddCategory.jsx";
import { deleteProduct as deleteProductAPI } from "../../../hooks/useProduct.js";
import { updateProduct as updateProductAPI } from "../../../hooks/useProduct.js";
import AdminDashboardProductCard from "./AdminDashboardProductCard.jsx";
import toast from "react-hot-toast";

function ProductsSection() {
  const { products, loading, deleteProduct, updateProduct, refreshProducts } =
    useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [CategoryModal, setCategoryModal] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openCategoryModal = () => setCategoryModal(true);
  const closeCategoryModal = () => setCategoryModal(false);

  const handleDelete = async (productId, productName) => {
    toast.dismiss("delete-confirm-toast");
    toast.custom(
      (t) => (
        <div className="delete-confirm-toast">
          <p className="delete-confirm-message">
            Are you sure you want to delete <strong>{productName}</strong>
          </p>
          <div className="delete-confirm-action">
            <button
              className="delete-confirm-btn delete-btn-danger"
              onClick={() => {
                toast.dismiss(t.id);
                const deletePromise = deleteProductAPI(productId).then(
                  (success) => {
                    if (success) deleteProduct(productId);
                    else throw new Error("Failed to delete the product.");
                  },
                );
                toast.promise(deletePromise, {
                  loading: "Delete Product...",
                  success: "Product Delete Was Successfully! 🗑️",
                  error: (err) => err.message,
                });
              }}
            >
              Delete
            </button>
            <button
              className="delete-confirm-btn delete-btn-cancel"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        id: "delete-confirm-toast",
        duration : Infinity,
        position : "top-center",
        className: "custom-delete-toast-wrapper"
      },
    );
  };

  const handleUpdate = async (productId, updatedData) => {
    const result = await updateProductAPI(productId, updatedData);
    if (result.success) {
      updateProduct(result.data); // ✅ تحديث السياق
    } else {
      alert("Failed to update product.");
    }
    return result;
  };

  const filteredProducts = products.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchName && matchCategory;
  });

  const renderProducts = () => {
    if (loading) return <h1>...loading products</h1>;
    return filteredProducts.map((product) => (
      <AdminDashboardProductCard
        key={product.id}
        id={product.id}
        name={product.name}
        category={product.category}
        price={product.price}
        image={product.image}
        weight={product.weight}
        tax_rate={product.tax_rate}
        weight_unit={product.weight_unit}
        total_price={product.total_price}
        nutritionObject={product.nutrition_facts}
        storageObject={product.storage_notes}
        ingredients={product.ingredients}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    ));
  };

  return (
    <div className="psection">
      <div className="ps-header">
        <div>
          <h2>Product Management</h2>
          <p>Manage your catalog, pricing, and inventory.</p>
        </div>
        <div className="add-buttons">
          <button className="ps-add-btn" onClick={openCategoryModal}>
            <span className="material-symbols-outlined">add</span>
            Add Category
          </button>
          <button className="ps-add-btn" onClick={openModal}>
            <span className="material-symbols-outlined">add</span>
            Add Product
          </button>
        </div>
      </div>

      <div className="ps-toolbar">
        <div className="ps-search-group">
          <div className="ps-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ps-filter">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="vegetables">vegetables</option>
              <option value="fruit">fruit</option>
            </select>
            <span className="material-symbols-outlined">arrow_drop_down</span>
          </div>
        </div>
        <div className="ps-tools">
          <button className="ps-icon-btn">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      <div className="ps-grid">{renderProducts()}</div>

      {isModalOpen && (
        <ProductModal
          closeModel={closeModal}
          onProductAdded={refreshProducts}
        />
      )}
      {CategoryModal && <AddCataeory closeModel={closeCategoryModal} />}
    </div>
  );
}

export default ProductsSection;
