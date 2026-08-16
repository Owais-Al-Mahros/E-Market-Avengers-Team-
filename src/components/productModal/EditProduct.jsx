import "./EditProduct.css";
import { useEffect, useState, useMemo } from "react";

export default function EditProduct(props) {
    const [productInfo, setProductInfo] = useState({
        id: props.id,
        name: props.name,
        price: props.price,
        image: props.image,
        category: props.category,
        weight: props.weight,
        tax_rate: props.tax_rate,
        weight_unit: props.weight_unit,
        total_price: props.total_price,
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

    const totalPrice = useMemo(() => {
        const netPrice = parseFloat(productInfo.price) || 0;
        const taxRate = parseFloat(productInfo.tax_rate) || 0;
        setProductInfo({ ...productInfo, total_price: netPrice + (netPrice * taxRate / 100) });
    }, [productInfo.price, productInfo.tax_rate]);

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
                                    <div>
                                        <span className="info-label">Price {productInfo.price} €</span>
                                        <input
                                            type="number"
                                            className="edit-input box-input"
                                            value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                                            placeholder="Price"
                                        /> </div>

                                    <div>
                                        <span className="info-label">Tax Rate %</span>
                                        <input
                                            type="number"
                                            className="edit-input box-input"
                                            value={productInfo.tax_rate} onChange={(e) => setProductInfo({ ...productInfo, tax_rate: e.target.value })}
                                            placeholder="Tax Rate"
                                        />
                                    </div>
                                    <div>
                                        <span className="info-label">Total (incl. tax)</span>
                                        <input
                                            type="text"
                                            className="edit-input box-input disabled-input"
                                            value={productInfo.total_price.toFixed(2)}
                                            disabled
                                        /> </div>
                                </div>
                                <div className="info-item">
                                    <div>
                                        <span className="info-label">category</span>
                                        <input
                                            type="text"
                                            className="edit-input box-input"
                                            value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                                            placeholder="category"
                                        />
                                    </div>
                                    <div>
                                        <div>
                                            <span className="info-label">weight</span>
                                            <input
                                                type="text"
                                                className="edit-input box-input"
                                                value={productInfo.weight} onChange={(e) => setProductInfo({ ...productInfo, weight: e.target.value })}
                                                placeholder="weight"
                                            />
                                        </div>
                                        <div>
                                            <span className="info-label">Weight unit</span>
                                            <select
                                                className="edit-input box-input unit-select"
                                                value={productInfo.weight_unit}
                                                onChange={(e) => setProductInfo({ ...productInfo, weight_unit: e.target.value })}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="L">L</option>
                                            </select>
                                        </div>
                                    </div>
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