// =============================================
// 1. OrdersContext.jsx (مع جلب order_items والوزن)
// =============================================
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            // ✅ جلب الطلبات مع بنودها (order_items) وكل المعلومات
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            weight,
            total_weight
          )
        `)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            setError(err.message || "Failed to load orders.");
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);
            if (error) throw error;

            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
            return { success: true };
        } catch (error) {
            console.error("Error updating order:", error);
            return { success: false, error: error.message };
        }
    };
    const fetchOrdersByStatus = async (status) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          weight,
          total_weight
        )
      `)
                .eq("status", status) // ✅ هنا التصفية حسب الحالة
                .order("created_at", { ascending: true });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            setError(err.message || "Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    const value = {
        orders,
        loading,
        error,
        fetchOrders,
        fetchOrdersByStatus, // ✅ الدالة الجديدة
        updateOrderStatus,
    };

    return (
        <OrdersContext.Provider value={value}>
            {children}
        </OrdersContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error("useOrders must be used within an OrdersProvider");
    }
    return context;
}