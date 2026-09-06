import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import ProductCard from "./ProductCard.jsx";
import "./CategorySection.css";

function CategorySection({ categoryName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsForCategory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("category", categoryName);

      console.log(`الفئة المطلوبة: "${categoryName}"`);
      console.log("البيانات القادمة من Supabase:", data);
      if (error) console.error("حدث خطأ:", error);
      if (!error) {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProductsForCategory();
  }, [categoryName]);

  return (
    <div className="category-section">
      <h2>{categoryName}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="products">
          {products.map((product) => (
            <div key={product.id} className="product">
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                image={product.image}
                category={product.category}
                price={product.price}
                weight={product.weight}
                tax_rate={product.tax_rate}
                weight_unit={product.weight_unit}
                total_price={product.total_price}
                description={product.description}
                nutritionObject={product.nutrition_facts}
                storageObject={product.storage_notes}
                ingredients={product.ingredients}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategorySection;
