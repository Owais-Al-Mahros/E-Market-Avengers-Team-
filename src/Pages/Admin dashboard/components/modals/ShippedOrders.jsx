// src/Pages/Admin dashboard/components/modules/ShippedOrders.jsx
import { useEffect } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTable from "./OrdersTable";

export default function ShippedOrders() {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus("shipped");
    }, []);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status="shipped"
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus("shipped")}
        />
    );
}