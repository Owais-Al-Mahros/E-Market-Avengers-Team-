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
        setOrders(data || []);
        return { success: true, data: data || [] };
      } catch (err) {
        setError(err.message || "Search failed");
        setOrders([]);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders],
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

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );

      return { success: true, data: updatedOrder };
    } catch (err) {
      console.error("Error updating order:", err);
      return { success: false, error: err.message };
    }
  }, []);

  /* ═══════════════════════════════════════════
     Helpers لـ ShipOrderModal
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

  /* ═══ حفظ نتائج الشحن (batch) — مع Rollback حقيقي ═══ */
  const saveShippedItems = useCallback(async (items, orderUpdate) => {
    const touched = [];

    // ✅ FIX #13: اجلب القيم الأصلية من DB قبل أي تعديل (snapshot)
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
      return {
        success: false,
        error: `Snapshot failed: ${snapshotErr.message}`,
      };
    }

    const originalMap = new Map(
      (originalSnapshot || []).map((row) => [row.id, row])
    );

    // ✅ حفظ لقطة من الطلب نفسه (للrollback)
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

            // ✅ FIX #25: مدخلات الأدمن الأصلية
            actual_piece_weight: parseFloat(item.actual_piece_weight) || null,
            actual_piece_price: parseFloat(item.actual_piece_price) || null,
            actual_total_weight: parseFloat(item.actual_total_weight) || null,

            // ✅ FIX #1: الوزن الكلي الفعلي
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
          // ✅ FIX #13: Rollback حقيقي من الـ snapshot
          console.error(`❌ Item ${item.id} failed:`, error.message);
          console.log(`🔄 Rolling back ${touched.length} item(s)...`);

          for (const prevId of touched) {
            const original = originalMap.get(prevId);
            if (!original) {
              console.warn(`⚠️ No snapshot for ${prevId} — skipping rollback`);
              continue;
            }

            const { error: rollbackErr } = await supabase
              .from("order_items")
              .update({
                product_id: original.product_id,
                product_name: original.product_name,
                unit_price: original.unit_price,
                weight: original.weight,
                weight_unit: original.weight_unit,
                actual_piece_weight: original.actual_piece_weight,
                actual_piece_price: original.actual_piece_price,
                actual_total_weight: original.actual_total_weight,
                actual_weight: original.actual_weight,
                actual_quantity: original.actual_quantity,
                actual_unit_price: original.actual_unit_price,
                actual_total: original.actual_total,
                price_difference: original.price_difference,
                status: original.status,
                substitution_note: original.substitution_note,
                scanned_at: original.scanned_at,
              })
              .eq("id", prevId);

            if (rollbackErr) {
              console.error(`⚠️ Rollback failed for ${prevId}:`, rollbackErr);
            }
          }

          throw new Error(
            `Rollback complete — failed on ${item.product_name}: ${error.message}`
          );
        }

        touched.push(item.id);
      }

      // ✅ تحديث الطلب (بعد نجاح كل البنود)
      const { error: orderError } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("id", orderUpdate.id);

      if (orderError) {
        // ✅ FIX #13: Rollback للبنود إذا فشل تحديث الطلب
        console.error(`❌ Order update failed:`, orderError.message);
        console.log(`🔄 Rolling back all ${touched.length} items...`);

        for (const prevId of touched) {
          const original = originalMap.get(prevId);
          if (!original) continue;

          await supabase
            .from("order_items")
            .update({
              product_id: original.product_id,
              product_name: original.product_name,
              unit_price: original.unit_price,
              weight: original.weight,
              weight_unit: original.weight_unit,
              actual_piece_weight: original.actual_piece_weight,
              actual_piece_price: original.actual_piece_price,
              actual_total_weight: original.actual_total_weight,
              actual_weight: original.actual_weight,
              actual_quantity: original.actual_quantity,
              actual_unit_price: original.actual_unit_price,
              actual_total: original.actual_total,
              price_difference: original.price_difference,
              status: original.status,
              substitution_note: original.substitution_note,
              scanned_at: original.scanned_at,
            })
            .eq("id", prevId);
        }

        // ✅ Rollback للطلب أيضًا
        if (originalOrder) {
          await supabase
            .from("orders")
            .update({
              status: originalOrder.status,
              subtotal: originalOrder.subtotal,
              tax: originalOrder.tax,
              total_price: originalOrder.total_price,
              current_total: originalOrder.current_total,
              shipping_cost: originalOrder.shipping_cost,
              payment_status: originalOrder.payment_status,
              updated_at: originalOrder.updated_at,
            })
            .eq("id", orderUpdate.id);
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