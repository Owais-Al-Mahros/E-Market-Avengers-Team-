import "./ProductCardDetails.css";
import toast from "react-hot-toast"; // ✅ اختياري
import { useState, useEffect } from "react";
import { useCart } from "../../../context/CartContext.jsx"; // ✅ استيراد السياق
import {
  getProductById,
  getProductsByCategory,
} from "../../../hooks/useProduct.js";
import { useSearchParams } from "react-router-dom";
import HomePageHeader from "../../Home page/components/HomePageHeader.jsx";
import Footer from "../../../Components/Footer.jsx";
import BackButton from "../../../Components/BackButton.jsx";
import Subscribe from "../../../Components/Subscribe.jsx";
import ProductCard from "../components/ProductCard.jsx";
export default function ProductCardDetails() {
  const [searchParams] = useSearchParams();
  const productId =
    searchParams.get("ProductId") ||
    searchParams.get("productId") ||
    searchParams.get("id");

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setLoadingProduct(false);
        return;
      }
      setLoadingProduct(true);
      const result = await getProductById(productId);
      if (result && result.success) {
        setProduct(result.data);
      }
      setLoadingProduct(false);
    };
    loadProduct();
  }, [productId]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (product && product.category_id) {
        const res = await getProductsByCategory(
          product.category_id,
          product.id,
        );
        if (res.success) {
          setRelatedProducts(res.data);
        }
      }
    };
    fetchProducts();
  }, [product]);

  const finalCategory = product?.categories?.name;

  const {
    id = "",
    name = "",
    image = "",
    price = "",
    weight = "",
    tax_rate = "",
    weight_unit = "",
    total_price = "",
    description = "",
    nutrition_facts: nutritionObject = {},
    storage_notes: storageObject = {},
    ingredients = "",
  } = product || {};

  const { addToCart } = useCart(); // ✅ جلب دالة الإضافة
  const [quantity, setQuantity] = useState(1); // ✅ كمية المنتج داخل المودال

  // ✅ زيادة الكمية
  const increaseQty = (e) => {
    e.stopPropagation();
    setQuantity((prev) => prev + 1);
  };

  // ✅ نقص الكمية
  const decreaseQty = (e) => {
    e.stopPropagation();
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // ✅ دالة إضافة المنتج للسلة (مع الكمية المحددة)
  const handleAddToCart = () => {
    addToCart(
      {
        id,
        name,
        price,
        image,
        weight,
        weight_unit,
      },
      quantity,
    );

    toast.success(`Added ${quantity} × ${name} to cart!`, {
      duration: 2000,
    });
  };

  if (!product) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Product not found.
      </div>
    );
  }
  const hasNutrition =
    ingredients || (nutritionObject && Object.keys(nutritionObject).length > 0);
  const hasStorage = storageObject && Object.keys(storageObject).length > 0;

  return (
    <>
      <HomePageHeader />
      <div className="product-page-container">
        <div className="btn-group">
          <BackButton label={"Back"} />
          <BackButton label={"Go Home"} />
        </div>
        <div className="product-main-layout">
          <div className="product-img-box">
            <img src={image} alt={name} />
          </div>

          <div className="product-info-box">
            <h1 className="main-product-title">{name}</h1>

            <div className="main-product-price">
              {price} $
              {weight && (
                <span className="unit-label">
                  {" "}
                  / {weight} {weight_unit}
                </span>
              )}
            </div>

            {finalCategory && (
              <p className="meta-info">
                <strong>Category:</strong> {finalCategory}
              </p>
            )}
            {tax_rate != null && (
              <p className="meta-info">
                <strong>Tax:</strong> {tax_rate}% (Total: {total_price} $)
              </p>
            )}

            {description && <p className="main-description">{description}</p>}

            <div className="purchase-section">
              <div className="quantity-picker">
                <button onClick={decreaseQty}>−</button>
                <span>{quantity}</span>
                <button onClick={increaseQty}>+</button>
              </div>

              <button className="checkout-add-btn" onClick={handleAddToCart}>
                🛒 Add To Cart ({(price * quantity).toFixed(2)} $)
              </button>
            </div>
          </div>
        </div>

        <div className="product-extra-details-stack">
          {hasNutrition && (
            <div className="detail-section-card">
              <h3>🥗 Nutritional Values & Ingredients</h3>
              {nutritionObject && Object.keys(nutritionObject).length > 0 && (
                <table className="page-nutrition-table">
                  <thead>
                    <tr>
                      <th>Nutritional Value</th>
                      <th>per 100 ml</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(nutritionObject).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {ingredients && (
                <div className="page-ingredients">
                  <h4>Ingredients:</h4>
                  <p>{ingredients}</p>
                </div>
              )}
            </div>
          )}

          {hasStorage && (
            <div className="detail-section-card">
              <h3>📦 Storage and Notes</h3>
              <ul className="storage-list-page">
                {Object.entries(storageObject).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Subscribe />
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h3>🛒 Products in the same category</h3>
          <div className="related-products">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.image}
                category={item.category}
                price={item.price}
                weight={item.weight}
                tax_rate={item.tax_rate}
                weight_unit={item.weight_unit}
                total_price={item.total_price}
                description={item.description}
                nutritionObject={item.nutrition_facts}
                storageObject={item.storage_notes}
                ingredients={item.ingredients}
              />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
