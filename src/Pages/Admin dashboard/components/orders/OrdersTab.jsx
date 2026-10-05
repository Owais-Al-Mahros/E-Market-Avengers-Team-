import { useEffect } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTable from "./OrdersTable";

export default function OrdersTab({ status }) {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus(status);
    }, [status, fetchOrdersByStatus]);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status={status}
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus(status)}
        />
    );
}