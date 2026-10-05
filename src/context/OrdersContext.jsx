import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";

const OrdersContext = createContext();

/* ═══════════════════════════════════════════
   SELECT Templates — تعريف واحد
   ═══════════════════════════════════════════ */
const ORDER_ITEMS_SELECT = `
  id, product_id, product_number, product_name,
  quantity, unit_price, total_price, tax_rate,
  weight, weight_unit, total_weight,
  actual_weight, actual_quantity, actual_unit_price,
  actual_total, price_difference, status,
  substitution_note, scanned_at
`;

const ORDER_SELECT = `
  *,
  order_items (${ORDER_ITEMS_SELECT}),
  driver:profiles!orders_driver_profile_fk (
    id,
    name,
    email,
    phone
  )
`;
/* ═══════════════════════════════════════════
   Provider
   ═══════════════════════════════════════════ */
export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ═══ Fetch All ═══ */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ═══ Fetch By Status ═══ */
  const fetchOrdersByStatus = useCallback(async (status) => {
    if (!status) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("status", status)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ═══ Search ═══ */
  const searchOrders = useCallback(async (term) => {
    setLoading(true);
    setError(null);
    try {
      const clean = String(term || "").trim();
      if (!clean) {
        await fetchOrders();
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .ilike("order_number", `%${clean}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
      return { success: true, data: data || [] };
    } catch (err) {
      setError(err.message || "Search failed");
      setOrders([]);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  /* ═══ Update Status ═══ */
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      const { data: updatedOrder, error: fetchError } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      );

      return { success: true, data: updatedOrder };
    } catch (err) {
      console.error("Error updating order:", err);
      return { success: false, error: err.message };
    }
  }, []);

  /* ═══════════════════════════════════════════
     🆕 Helpers لـ ShipOrderModal (بدل supabase مباشر)
     ═══════════════════════════════════════════ */

  /* ═══ جلب بنود طلب (للشحن) ═══ */
  const getOrderItemsForShip = useCallback(async (orderId) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) {
      console.error("getOrderItemsForShip:", error);
      return [];
    }
    return data || [];
  }, []);

  /* ═══ جلب منتجات للاستبدال ═══ */
  const getProductsForSubstitution = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error("getProductsForSubstitution:", error);
      return [];
    }
    return data || [];
  }, []);

  /* ═══ حفظ نتائج الشحن (batch) ═══ */
  const saveShippedItems = useCallback(async (items, orderUpdate) => {
    const touched = [];
    try {
      for (const item of items) {
        const { error } = await supabase
          .from("order_items")
          .update({
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            weight: item.weight,
            weight_unit: item.weight_unit,
            actual_weight: parseFloat(item.actual_weight) || null,
            actual_quantity: parseFloat(item.actual_quantity) || null,
            actual_unit_price: parseFloat(item.actual_unit_price) || null,
            actual_total: item.actual_total,
            price_difference: item.price_difference,
            status: item.status,
            substitution_note: item.original_product_name
              ? `Substituted from: ${item.original_product_name}`
              : null,
            scanned_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) {
          // Rollback
          for (const prevId of touched) {
            const prev = items.find((i) => i.id === prevId);
            if (prev) {
              await supabase.from("order_items").update({
                actual_weight: prev.actual_weight,
                actual_quantity: prev.actual_quantity,
                actual_unit_price: prev.actual_unit_price,
                actual_total: prev.actual_total,
                price_difference: prev.price_difference,
                status: prev.status,
              }).eq("id", prevId);
            }
          }
          throw new Error(`Rolled back — failed on ${item.product_name}`);
        }
        touched.push(item.id);
      }

      // تحديث الطلب
      const { error: orderError } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("id", orderUpdate.id);

      if (orderError) throw orderError;

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /* ═══ Initial Load ═══ */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ═══ Value ═══ */
  const value = useMemo(
    () => ({
      orders,
      loading,
      error,
      fetchOrders,
      fetchOrdersByStatus,
      searchOrders,
      updateOrderStatus,
      setOrders,
      // New helpers
      getOrderItemsForShip,
      getProductsForSubstitution,
      saveShippedItems,
    }),
    [
      orders,
      loading,
      error,
      fetchOrders,
      fetchOrdersByStatus,
      searchOrders,
      updateOrderStatus,
      getOrderItemsForShip,
      getProductsForSubstitution,
      saveShippedItems,
    ]
  );

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