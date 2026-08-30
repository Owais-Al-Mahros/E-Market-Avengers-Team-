import "./NewOrders.css"
import { useEffect } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTable from "./OrdersTable";

export default function NewOrders() {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus("pending");
    }, []);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status="pending"
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus("pending")}
        />
    );
}