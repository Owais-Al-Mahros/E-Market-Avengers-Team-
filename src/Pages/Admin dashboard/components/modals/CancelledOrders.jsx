import { useEffect } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTable from "./OrdersTable";

export default function CancelledOrders() {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus("cancelled");
    }, []);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status="cancelled"
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus("cancelled")}
        />
    );
}