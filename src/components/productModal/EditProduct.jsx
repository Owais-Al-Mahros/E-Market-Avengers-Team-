import "./EditProduct.css";

export default function EditProduct({ closeModel }) {
    const data = {
        name: "سماعة أبل اللاسلكية",
        price: 299,
        category: "إلكترونيات",
        image: "https://media.zid.store/8ff46300-a154-4219-93c1-3fb81a87353f/59b2d3d6-f069-4bd7-bd71-7ed0cdeef952.jpg",
        description: "جودة صوت عالية وعزل ممتاز للضوضاء",
    };

    return (
        <div className="modal-overlay" onClick={closeModel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="edit-card">

                    <div className="image-section">
                        <img src={data.image} alt={data.name} className="product-image" />
                    </div>

                    {/* الاسم (فوق الحاوية الخضراء) */}
                    <div className="name-section">
                        <h2 className="product-name">{data.name}</h2>
                    </div>

                    {/* ===== الحاوية الخضراء الواحدة ===== */}
                    <div className="green-container">

                        {/* الصورة في الأعلى */}


                        {/* السعر والفئة في صف واحد أسفل الصورة */}
                        <div className="info-row">
                            <div className="info-item">
                                <span className="info-label">السعر</span>
                                <span className="info-value">{data.price} $</span>
                                <input
                                    type="number"
                                    className="edit-input box-input"
                                    defaultValue={data.price}
                                    placeholder="السعر"
                                />
                            </div>
                            <div className="info-item">
                                <span className="info-label">الفئة</span>
                                <span className="info-value">{data.category}</span>
                                <input
                                    type="text"
                                    className="edit-input box-input"
                                    defaultValue={data.category}
                                    placeholder="الفئة"
                                />
                            </div>
                        </div>

                        {/* رابط الصورة (أسفل الحاوية الخضراء) */}
                        <div className="url-section">
                            <span className="info-label">رابط الصورة</span>
                            <input
                                type="text"
                                className="edit-input url-input"
                                defaultValue={data.image}
                                placeholder="أدخل رابط الصورة"
                            />
                        </div>

                    </div> {/* نهاية الحاوية الخضراء */}

                    {/* أزرار التحكم */}
                    <div className="modal-actions">
                        <button className="action-btn save-btn">💾 حفظ</button>
                        <button className="action-btn cancel-btn" onClick={closeModel}>
                            إلغاء
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}