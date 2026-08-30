import { useOrders } from '../../../../context/OrdersContext'
import { useEffect, useState } from 'react'
import OrdersTable from "./OrdersTable";

function ConfirmedOrders() {
    const { orders, loading, fetchOrdersByStatus, updateOrderStatus } = useOrders();

    useEffect(() => {
        fetchOrdersByStatus("confirmed");
    }, []);

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <OrdersTable
            orders={orders}
            status="confirmed"
            onUpdateStatus={updateOrderStatus}
            onRefresh={() => fetchOrdersByStatus("confirmed")}
        />
    );
}

export default ConfirmedOrders