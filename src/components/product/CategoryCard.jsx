// src/Pages/Home page/components/CategoryCard.jsx
import "./CategoryCard.css";

export default function CategoryCard({ category, onSelect }) {
    return (
        <div className="category-card" onClick={() => onSelect(category.id)}>
            <img
                src={category.image}
                className="category-card-image"
                alt={category.name}
            />
            <span className="category-card-name">{category.name}</span>
        </div>
    );
}