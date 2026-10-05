import "./CategoriesGrid.css";
import CategoryCard from "../../../components/product/CategoryCard";

export default function CategoriesGrid({ categories, loading, onSelect }) {
    if (loading) return <p className="categories-grid-state">Loading categories...</p>;
    if (!categories.length) return <p className="categories-grid-state">No categories available.</p>;

    return (
        <div className="home-categories-grid">
            {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} onSelect={onSelect} />
            ))}
        </div>
    );
}