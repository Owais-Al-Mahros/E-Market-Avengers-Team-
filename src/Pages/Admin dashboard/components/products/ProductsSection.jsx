import { useState } from "react";
import ProductsList from "./components/ProductsList";
import CategoriesView from "./components/CategoriesView";
import ProductFormPage from "./components/ProductFormPage";
import BackButton from "../../../../components/ui/BackButton";
import "./ProductsSection.css";

export default function ProductsSection() {
  const [activeTab, setActiveTab] = useState("products");
  const [formState, setFormState] = useState(null); // null | { mode: 'new' | 'edit', product }

  // ─── عندما تكون الصفحة الفرعية مفتوحة ───
  if (formState) {
    return (
      <ProductFormPage
        mode={formState.mode}
        product={formState.product || null}
        onBack={() => setFormState(null)}
        onSaved={() => setFormState(null)}
      />
    );
  }

  return (
    <div className="products-section">
      {/* Header */}
      <div className="ps-header">
        <div>
          <h2>📦 Product Management</h2>
          <p>Manage your catalog, pricing, and inventory.</p>
        </div>
        <BackButton label="Back" />
      </div>

      {/* Tabs + Add button */}
      <div className="ps-tabs">
        <button
          className={`ps-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          Products
        </button>

        <button
          className={`ps-tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <span className="material-symbols-outlined">folder</span>
          Categories
        </button>

        <div className="ps-tab-spacer" />

        <button
          className="ps-new-btn"
          onClick={() => setFormState({ mode: "new" })}
        >
          <span className="material-symbols-outlined">add</span>
          Add Product
        </button>
      </div>

      {/* Content */}
      <div className="ps-content">
        {activeTab === "products" && (
          <ProductsList
            onEditProduct={(product) => setFormState({ mode: "edit", product })}
            onAddProduct={() => setFormState({ mode: "new" })}
          />
        )}
        {activeTab === "categories" && <CategoriesView />}
      </div>
    </div>
  );
}