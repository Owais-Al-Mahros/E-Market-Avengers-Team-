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

  // ============================================
  // ✅ بحث برقم الطلب (يستخدم نفس الحالة المشتركة)
  // ============================================
  const searchOrders = async (term) => {
    setLoading(true);
    setError(null);

    try {
      const cleanTerm = String(term || "").trim();

      if (!cleanTerm) {
        // إذا كان البحث فارغاً → أرجع الطلبات الكاملة
        await fetchOrders();
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
        *,
        order_items (
          id,
          product_id,
          product_number,
          product_name,
          quantity,
          unit_price,
          total_price,
          weight,
          weight_unit,
          total_weight,
          actual_weight,
          actual_quantity,
          actual_unit_price,
          actual_total,
          price_difference,
          status,
          substitution_note,
          scanned_at
        )
      `)
        .ilike("order_number", `%${cleanTerm}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // ✅ نُحدّث نفس الحالة المشتركة → Actions تعمل تلقائياً
      setOrders(data || []);

      return { success: true, data: data || [] };
    } catch (err) {
      setError(err.message || "Search failed");
      setOrders([]);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ جلب الطلبات مع بنودها (order_items) وكل المعلومات
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
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
        `,
        )
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
      // 1. تحديث الحالة في DB
      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // ✅ 2. إعادة جلب الطلب بالكامل مع كل الحقول المحدثة
      const { data: updatedOrder, error: fetchError } = await supabase
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
          weight_unit,
          total_weight,
          actual_weight,
          actual_quantity,
          actual_unit_price,
          actual_total,
          price_difference,
          status,
          substitution_note,
          scanned_at
        )
      `)
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      // 3. تحديث الحالة المحلية بالكامل
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      return { success: true, data: updatedOrder };
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
    product_number,
    product_name,
    quantity,
    unit_price,
    total_price,
    weight,
    weight_unit,
    total_weight,
    actual_weight,
    actual_quantity,
    actual_unit_price,
    actual_total,
    price_difference,
    status,
    substitution_note,
    scanned_at
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
    fetchOrdersByStatus,
    searchOrders,           // ✅ جديد
    updateOrderStatus,
    setOrders,              // ✅ قد تحتاجها
  };

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}
