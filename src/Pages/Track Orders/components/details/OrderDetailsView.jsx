import Invoice from "../../../../components/invoice/Invoice";
import Vorinformation from "../../../../components/invoice/Vorinformation";

export default function OrderDetailsView({ order }) {
    if (!order) return null;

    const rawItems = order.order_items || [];

    const items = rawItems.map((item) => {
        const isRemoved = item.status === "removed";
        const isProcessed =
            item.status === "scanned" || item.status === "substituted";

        if (isRemoved) {
            return {
                ...item,
                total_price: 0,
                _displayQuantity: 0,
                _isRemoved: true,
                _isAdjusted: true,
            };
        }

        if (isProcessed && item.actual_total != null) {
            const isWeightBased =
                !item.weight_unit ||
                ["kg", "g", "l", "ml"].includes(
                    String(item.weight_unit).toLowerCase()
                );

            const finalQty = isWeightBased
                ? item.actual_weight ?? item.quantity
                : item.actual_quantity ?? item.quantity;

            return {
                ...item,
                total_price: parseFloat(item.actual_total) || 0,
                _displayQuantity: finalQty,
                _isRemoved: false,
                _isAdjusted: true,
            };
        }

        return {
            ...item,
            _displayQuantity: item.quantity,
            _isRemoved: false,
            _isAdjusted: false,
        };
    });

    /* ✅ اختيار المكوّن حسب الحالة */
    const isDelivered = order.status === "delivered";

    if (isDelivered) {
        return <Invoice order={order} items={items} />;
    }

    return (
        <Vorinformation
            order={order}
            items={items}
            showPaymentInfo={true}
            showBufferInfo={
                order.authorized_amount > 0 &&
                order.authorized_amount > parseFloat(order.total_price || 0)
            }
            bufferAmount={
                order.authorized_amount
                    ? Math.max(
                        0,
                        order.authorized_amount -
                        parseFloat(order.total_price || 0)
                    )
                    : 0
            }
        />
    );
}