import "./CartProductCard.css";

export default function CartProductCard(props) {
    // ✅ استقبل removeFromCart من props
    const {
        id,
        name,
        image,
        qty,
        price,
        increaseQty,
        decreaseQty,
        removeFromCart
    } = props;

    return (
        <div className="flex-grow space-y-6">
            <div key={id} className="crd p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <img
                    src={image}
                    alt={name}
                    className="w-full sm:w-[130px] h-[130px] object-cover rounded-xl border-2 bl bg-white"
                />
                <div className="flex-grow w-full">
                    <h2 className="text-xl fw-bold td">{name}</h2>
                    <div className="flex flex-wrap justify-between items-end mt-4 gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <button className="qb" onClick={() => decreaseQty(id)}>−</button>
                                <input type="text" className="qi" value={qty} readOnly />
                                <button className="qb" onClick={() => increaseQty(id)}>+</button>
                            </div>
                            <button
                                className="rmb tc text-danger fw-bold text-lg flex items-center gap-1"
                                onClick={() => removeFromCart(id)}  // ✅ الآن تعمل
                            >
                                <span className="material-symbols-outlined">delete</span> Remove
                            </button>
                        </div>
                        <span className="txl fw-extrabold tl">${(price * qty).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}