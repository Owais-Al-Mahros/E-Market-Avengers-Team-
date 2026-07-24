import "./ProductModal.css"
import { useState, useEffect } from "react"


function ProductModal({ closeModel, onProductAdded }) {
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



    const handleSubmit = (event) => {
        event.preventDefault();

        const storedProducts = localStorage.getItem("products");

        const productsArray = storedProducts ? JSON.parse(storedProducts) : [];

        productsArray.push(productInfo);

        localStorage.setItem("products", JSON.stringify(productsArray));

        if (onProductAdded) {
            onProductAdded();
        }

        closeModel();
    };

    return (
        // 1. الحاجز: يغطي الشاشة كلها ويمنع التفاعل مع الخلفية
        <div className="modal-overlay">
            {/* 2. البطاقة: المربع الأبيض الذي يظهر في المنتصف */}
            <div className="modal-card">

                {/* 3. النموذج: نفس حقول الإدخال لديك */}

                <form className="inputs" onSubmit={handleSubmit}>
                    <label htmlFor="productName">Name of the product</label>
                    <input id="productName" type="text"
                        value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                        placeholder="the name" />

                    <label htmlFor="productDescription">description of the product</label>
                    <input id="productDescription" type="text"
                        value={productInfo.description} onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} />

                    <label htmlFor="productPrice" >Price of the product</label>
                    <input id="productPrice" type="text"
                        value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })} />

                    <label htmlFor="productImage" >image of the product</label>
                    <input maxLength={10000} id="productImage" type="text"
                        value={productInfo.image} onChange={(e) => setProductInfo({ ...productInfo, image: e.target.value })} />

                    <label htmlFor="productCategory">category of the product</label>
                    <input id="productCategory" type="text"
                        value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })} />


                    {/* 4. الأزرار في صف واحد أسفل الحقول */}
                    <div className="modal-actions">
                        <button type="submit" className="save-btn">Save</button>
                        <button type="button" onClick={closeModel} className="cancel-btn">Cancel</button>
                    </div>
                </form>

            </div>
        </div>
    );

}
export default ProductModal