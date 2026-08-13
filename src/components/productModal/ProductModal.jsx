import "./ProductModal.css"
import { useState, useEffect } from "react"
import { supabase } from '../../lib/supabase';

function ProductModal({ closeModel, onProductAdded }) {
    const [loading, setLoading] = useState(false);
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        price: "",
        image: "",
        category: "",
    })


    useEffect(() => {
        // عند فتح النافذة: أخفِ شريط التمرير في الصفحة
        document.body.style.overflow = "hidden";
        // عند إغلاق النافذة (التنظيف): أعد شريط التمرير
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []); // القوس الفارغ يعني "نفذ هذا مرة واحدة عند التحميل والإزالة"



    const ColseTheModel = () => {
        setProductInfo({
            name: "",
            description: "",
            price: "",
            image: "",
            category: "",
        })
        closeModel();
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (
            !productInfo.name.trim() ||
            !productInfo.price.trim() ||
            !productInfo.image.trim() ||
            !productInfo.category.trim()) {
            alert("One of the main feature is missing");
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from("products")
                .insert([{
                    name: productInfo.name.trim(),
                    description: productInfo.description.trim(),
                    price: parseFloat(productInfo.price) || 0,
                    image: productInfo.image.trim() || null,
                    category: productInfo.category.trim() || null,
                }]).select();

            if (error) {
                throw error;
            }

            if (onProductAdded) {
                onProductAdded();
            }
            ColseTheModel();
            setLoading(false);

        } catch (error) {
            setLoading(false);
            alert(`there is an error ${error.message}`);
        }

    }



    return (
        // 1. الحاجز: يغطي الشاشة كلها ويمنع التفاعل مع الخلفية
        <div className="modal-overlay" onClick={ColseTheModel}>
            {/* 2. البطاقة: المربع الأبيض الذي يظهر في المنتصف */}
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>

                {/* 3. النموذج: نفس حقول الإدخال لديك */}

                <form className="inputs" onSubmit={handleSubmit}>
                    <label htmlFor="productName">Name of the product</label>
                    <input maxLength={999} id="productName" type="text"
                        value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                        placeholder="the name" />

                    <label htmlFor="productDescription">description of the product</label>
                    <input maxLength={100000} id="productDescription" type="text"
                        value={productInfo.description} onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} />

                    <label htmlFor="productPrice" >Price of the product</label>
                    <input id="productPrice" type="number"
                        value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })} />

                    <label htmlFor="productImage" >image of the product</label>
                    <input id="productImage" type="text"
                        value={productInfo.image} onChange={(e) => setProductInfo({ ...productInfo, image: e.target.value })} />

                    <label htmlFor="productCategory">category of the product</label>
                    <input id="productCategory" type="text"
                        value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })} />


                    {/* 4. الأزرار في صف واحد أسفل الحقول */}
                    <div className="modal-actions">
                        <button type="submit" className="save-btn"> {loading ? "loading..." : "Save"}</button>
                        <button type="button" onClick={closeModel} className="cancel-btn">Cancel</button>
                    </div>
                </form>

            </div>
        </div>
    );

}
export default ProductModal