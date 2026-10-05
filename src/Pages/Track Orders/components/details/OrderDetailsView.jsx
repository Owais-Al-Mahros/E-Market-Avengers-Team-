import Invoice from "../../../../components/invoice/Invoice";

export default function OrderDetailsView({ order }) {
    if (!order) return null;

    const rawItems = order.order_items || [];

    // ============================================
    // ✅ Normalize: استخدم القيم الفعلية إن وُجدت
    // ============================================
    const items = rawItems.map((item) => {
        const isRemoved = item.status === "removed";
        const isProcessed =
            item.status === "scanned" || item.status === "substituted";

        // --- منتج مُزال ---
        if (isRemoved) {
            return {
                ...item,
                total_price: 0,
                _displayQuantity: 0,
                _isRemoved: true,
                _isAdjusted: true,
                _originalTotal: parseFloat(item.total_price) || 0,
            };
        }

        // --- منتج تم مسحه/استبداله ---
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
                _finalUnitPrice: parseFloat(item.actual_unit_price) || 0,
                _isRemoved: false,
                _isAdjusted: true,
                _originalTotal: parseFloat(item.total_price) || 0,
            };
        }

        // --- منتج لم يُلمس ---
        return {
            ...item,
            _displayQuantity: item.quantity,
            _isRemoved: false,
            _isAdjusted: false,
        };
    });

    // ============================================
    // ✅ استخدم Invoice component الموحّد
    // ============================================
    return (
        <Invoice
            order={order}
            items={items}
            variant={order.status === "delivered" ? "receipt" : "preview"}
            showTaxBreakdown={true}
            showAdjustmentNotice={true}
            showWarningBanner={true}
            showPaymentInfo={true}
            showBufferInfo={false}
        />
    );
}