import "./EditProduct.css";
import { useState } from "react";

export default function EditProduct(props) {
    const [productInfo, setProductInfo] = useState({
        id: props.id,
        name: props.name,
        price: props.price,
        image: props.image,
        category: props.category,
    })

    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        setIsLoading(true);
        const result = await props.onUpdate(productInfo.id, productInfo);
        if (result.success) {
            props.closeModel();
        } else {
            setIsLoading(false);
        }
    }


    return (
        <div className="modal-overlay" onClick={props.closeModel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="edit-card">

                    <div className="image-section">
                        <img src={productInfo.image} alt={productInfo.name} className="product-image" />
                    </div>
                    <form action="">
                        <div className="name-section">
                            <input
                                type="text"
                                className="product-name"
                                value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                                placeholder="name"
                            />
                        </div>

                        <div className="green-container">
                            <div className="info-row">
                                <div className="info-item">
                                    <span className="info-label">Price</span>
                                    <span className="info-value">{productInfo.price} $</span>
                                    <input
                                        type="number"
                                        className="edit-input box-input"
                                        value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                                        placeholder="Price"
                                    />
                                </div>
                                <div className="info-item">
                                    <span className="info-label">category</span>
                                    <span className="info-value">{productInfo.category}</span>
                                    <input
                                        type="text"
                                        className="edit-input box-input"
                                        value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                                        placeholder="category"
                                    />
                                </div>
                            </div>

                            <div className="url-section">
                                <span className="info-label">Image URL</span>
                                <input
                                    type="text"
                                    className="edit-input url-input"
                                    value={productInfo.image} onChange={(e) => setProductInfo({ ...productInfo, image: e.target.value })}
                                    placeholder="Enter the image URL"
                                />
                            </div>
                        </div>
                    </form>


                    <div className="modal-actions">
                        <button className="action-btn save-btn" onClick={handleUpdate}>{isLoading ? "⏳ Saving..." : "💾 Save"}</button>
                        <button className="action-btn cancel-btn" onClick={props.closeModel}>
                            Cancel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}