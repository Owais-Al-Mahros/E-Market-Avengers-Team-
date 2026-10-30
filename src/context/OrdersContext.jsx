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
  actual_total, actual_piece_weight, actual_piece_price, actual_total_weight, price_difference, status,
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
    // 1. استخراج كل الـ product_ids من الطلبات
    const productIds = [
      ...new Set(
        (ordersData || [])
          .flatMap((o) => o.order_items || [])
          .map((item) => item.product_id)
          .filter(Boolean)
      ),
    ];

    // 2. جلب المنتجات من جدول products
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

    // 3. دمج رقم المنتج مع الطلبات (إذا لم يكن موجوداً في الطلب، نأخذه من جدول المنتجات)
    return (ordersData || []).map((order) => ({
      ...order,
      order_items: (order.order_items || []).map((item) => ({
        ...item,
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

  /* ═══ Search By Order Number ═══ */
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

  /* ═══ Search By Product Name (Last 30 Days) ═══ */
  const searchOrdersByProduct = useCallback(
    async (productName) => {
      setLoading(true);
      setError(null);
      try {
        const clean = String(productName || "").trim();
        if (!clean) {
          await fetchOrders();
          return { success: true, data: [] };
        }

        // 1. حساب تاريخ 30 يوماً مضت
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 2. البحث في order_items عن اسم المنتج لجلب أرقام الطلبات (بدون تكرار)
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("order_id")
          .ilike("product_name", `%${clean}%`);

        if (itemsError) throw itemsError;

        const orderIds = [...new Set((items || []).map((i) => i.order_id))];

        if (orderIds.length === 0) {
          setOrders([]);
          return { success: true, data: [] };
        }

        // 3. جلب الطلبات الكاملة بناءً على الأرقام المستخرجة وتاريخ 30 يوم
        const { data, error } = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .in("id", orderIds)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        const enriched = await enrichOrders(data);
        setOrders(enriched);
        return { success: true, data: enriched };
      } catch (err) {
        setError(err.message || "Product search failed");
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
     Helpers
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
    try {
      // 1. تحديث كل بند في الطلب (order_items)
      const itemUpdates = items.map((item) => {
        // تجهيز البيانات المرسلة من مودال الشحن
        const payload = {
          status: item.status,
          actual_quantity: parseFloat(item.actual_quantity) || null,
          actual_piece_weight: parseFloat(item.actual_piece_weight) || null,
          actual_piece_price: parseFloat(item.actual_piece_price) || null,
          actual_total_weight: parseFloat(item.actual_total_weight) || null,
          actual_total: item.actual_total !== null && item.actual_total !== undefined
            ? parseFloat(item.actual_total)
            : null,
          price_difference: item.price_difference !== null && item.price_difference !== undefined
            ? parseFloat(item.price_difference)
            : null,
          actual_unit_price: item.actual_unit_price || null,
          scanned_at: new Date().toISOString(),
        };

        // إذا كان المنتج مستبدلاً (Substituted)
        if (item.status === "substituted") {
          payload.product_id = item.product_id;
          payload.product_name = item.product_name;
          payload.substitution_note = item.original_product_name
            ? `Ersetzt durch: ${item.product_name} (war: ${item.original_product_name})`
            : `Ersetzt durch: ${item.product_name}`;
        } else if (item.substitution_note) {
          payload.substitution_note = item.substitution_note;
        }

        // إذا تم إزالة المنتج (Removed / Not Available)
        if (item.status === "removed") {
          payload.actual_total = 0;
          payload.price_difference = -parseFloat(item.total_price || 0);
        }

        // تنفيذ التحديث في قاعدة البيانات
        return supabase
          .from("order_items")
          .update(payload)
          .eq("id", item.id);
      });

      // تنفيذ جميع التحديثات بالتوازي لتوفير الوقت
      const itemResults = await Promise.all(itemUpdates);

      // التحقق من وجود أي خطأ في تحديث البنود
      const itemError = itemResults.find((r) => r.error);
      if (itemError) {
        throw new Error(itemError.error.message);
      }

      // 2. تحديث حالة الطلب الرئيسي (orders)
      // فصلنا `substitutions` لأنها بيانات للقراءة فقط وليست عموداً في الجدول
      const { substitutions, ...orderData } = orderUpdate;

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: orderData.status,
          total_price: parseFloat(orderData.total_price),
          subtotal: parseFloat(orderData.subtotal),
          shipping_cost: parseFloat(orderData.shipping_cost),
          tax: parseFloat(orderData.tax),
          has_cooling_items: orderData.has_cooling_items || false, // ✅ الحقل الجديد
          updated_at: orderData.updated_at,
        })
        .eq("id", orderData.id);

      if (orderError) {
        throw new Error(orderError.message);
      }

      // إذا وصلنا هنا، فكل شيء تم بنجاح
      return { success: true };

    } catch (err) {
      console.error("saveShippedItems error:", err);
      return { success: false, error: err.message || "Fehler beim Speichern der Versanddaten." };
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
      searchOrdersByProduct, // ✅ الدالة الجديدة
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
      searchOrdersByProduct, // ✅ الدالة الجديدة
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