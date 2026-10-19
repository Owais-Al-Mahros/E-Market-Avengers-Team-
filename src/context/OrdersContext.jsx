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
   SELECT Templates
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

  /* ✅ الدالة الذكية لجلب أرقام المنتجات من قاعدة البيانات */
  const enrichOrders = useCallback(async (ordersData) => {
    const productIds = [
      ...new Set(
        (ordersData || [])
          .flatMap((o) => o.order_items || [])
          .map((item) => item.product_id)
          .filter(Boolean)
      ),
    ];

    let productMap = {};
    if (productIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, product_number")
        .in("id", productIds);

      if (productsData) {
        productMap = productsData.reduce((acc, p) => {
          acc[p.id] = p.product_number;
          return acc;
        }, {});
      }
    }

    return (ordersData || []).map((order) => ({
      ...order,
      order_items: (order.order_items || []).map((item) => ({
        ...item,
        // نستخدم الرقم المحفوظ في الطلب، وإذا كان فارغاً نجيبه من جدول المنتجات
        product_number: item.product_number || productMap[item.product_id] || null,
      })),
    }));
  }, []);

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
      const enriched = await enrichOrders(data);
      setOrders(enriched);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [enrichOrders]);

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
      const enriched = await enrichOrders(data);
      setOrders(enriched);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [enrichOrders]);

  /* ═══ Search ═══ */
  const searchOrders = useCallback(
    async (term) => {
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
        const enriched = await enrichOrders(data);
        setOrders(enriched);
        return { success: true, data: enriched };
      } catch (err) {
        setError(err.message || "Search failed");
        setOrders([]);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, enrichOrders],
  );

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

      const [enrichedOrder] = await enrichOrders([updatedOrder]);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? enrichedOrder : o)),
      );

      return { success: true, data: enrichedOrder };
    } catch (err) {
      console.error("Error updating order:", err);
      return { success: false, error: err.message };
    }
  }, [enrichOrders]);

  /* ═══════════════════════════════════════════
     Helpers لـ ShipOrderModal (بدون تغيير)
     ═══════════════════════════════════════════ */
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

  const saveShippedItems = useCallback(async (items, orderUpdate) => {
    const touched = [];
    const itemIds = items.map((i) => i.id);

    const { data: originalSnapshot, error: snapshotErr } = await supabase
      .from("order_items")
      .select(
        "id, product_id, product_name, unit_price, weight, weight_unit, " +
        "actual_piece_weight, actual_piece_price, actual_total_weight, " +
        "actual_weight, actual_quantity, actual_unit_price, actual_total, " +
        "price_difference, status, substitution_note, scanned_at"
      )
      .in("id", itemIds);

    if (snapshotErr) {
      console.error("saveShippedItems snapshot failed:", snapshotErr);
      return { success: false, error: `Snapshot failed: ${snapshotErr.message}` };
    }

    const originalMap = new Map(
      (originalSnapshot || []).map((row) => [row.id, row])
    );

    const { data: originalOrder } = await supabase
      .from("orders")
      .select(
        "id, status, subtotal, tax, total_price, current_total, " +
        "shipping_cost, price_adjustment, substitutions, payment_status, updated_at"
      )
      .eq("id", orderUpdate.id)
      .single();

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
            actual_piece_weight: parseFloat(item.actual_piece_weight) || null,
            actual_piece_price: parseFloat(item.actual_piece_price) || null,
            actual_total_weight: parseFloat(item.actual_total_weight) || null,
            actual_weight: parseFloat(item.actual_total_weight) || null,
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
          console.error(`❌ Item ${item.id} failed:`, error.message);
          for (const prevId of touched) {
            const original = originalMap.get(prevId);
            if (!original) continue;
            await supabase.from("order_items").update(original).eq("id", prevId);
          }
          throw new Error(`Rollback complete — failed on ${item.product_name}: ${error.message}`);
        }
        touched.push(item.id);
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("id", orderUpdate.id);

      if (orderError) {
        for (const prevId of touched) {
          const original = originalMap.get(prevId);
          if (original) await supabase.from("order_items").update(original).eq("id", prevId);
        }
        if (originalOrder) {
          await supabase.from("orders").update(originalOrder).eq("id", orderUpdate.id);
        }
        throw new Error(`Order update failed: ${orderError.message}`);
      }

      return { success: true };
    } catch (err) {
      console.error("saveShippedItems failed:", err);
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
    ],
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