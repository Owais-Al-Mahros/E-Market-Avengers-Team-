import "./DeliveredOrders.css"
import { useEffect } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTable from "./OrdersTable";

export default function DeliveredOrders() {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus("delivered");
    }, []);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status="delivered"
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus("delivered")}
        />
    );
}