// src/Pages/DisplayProducts/DisplayProducts.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import ProductCard from "../DisplayProducts/components/ProductCard";
import HomePageHeader from "../Home page/components/HomePageHeader";
import HomePageFooter from "../Home page/components/HomePageFooter";
import "./DisplayProducts.css";

function DisplayProducts() {
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get("categoryId");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!categoryId) {
                setLoading(false);
                setProducts([]);
                setCategoryName("Products");
                return;
            }

            setLoading(true);
            try {
                // جلب اسم الفئة
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("name")
                    .eq("id", categoryId)
                    .single();
                setCategoryName(categoryData?.name || "Products");

                // جلب المنتجات الخاصة بهذه الفئة
                const { data, error } = await supabase
                    .from("products")
                    .select("*")
                    .eq("category_id", categoryId)
                    .order("name");
                if (error) throw error;
                setProducts(data || []);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId]);

    return (
        <>
            <HomePageHeader />
            <div className="display-products-page">
                <h1>{categoryName}</h1>
                {loading ? (
                    <div className="loading">Loading products...</div>
                ) : products.length === 0 ? (
                    <div className="empty">No products found.</div>
                ) : (
                    <div className="products-grid">
                        {products.map((product) => (
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
                        ))}
                    </div>
                )}
            </div>
            <HomePageFooter />
        </>
    );
}

export default DisplayProducts;