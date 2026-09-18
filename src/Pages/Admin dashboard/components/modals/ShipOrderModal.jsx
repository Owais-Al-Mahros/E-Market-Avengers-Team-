import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import "./ShipOrderModal.css";
import { isWeightBased, normalizeUnit } from "../../../../lib/units";

export default function ShipOrderModal({ order, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [substitutingItem, setSubstitutingItem] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [substitutionsLog, setSubstitutionsLog] = useState([]);

  const paymentMethod = order.payment_method || "cod";
  const isCOD = paymentMethod === "cod";
  const hasStripe = !!order.payment_intent_id;
  const allowSubstitution = order.allow_substitution === true;

  // ============================================
  // Helper: حساب السعر لكل وحدة (مع ضريبة)
  // ============================================
  const getPricePerUnit = (item) => {
    const weightBased = isWeightBased(item.weight_unit);
    const totalPrice = parseFloat(item.total_price) || 0; // ✅ مع ضريبة

    if (weightBased) {
      const originalWeight = parseFloat(item.weight) || 0;
      if (originalWeight > 0) return totalPrice / originalWeight;
    }

    const quantity = parseFloat(item.quantity) || 1;
    return totalPrice / quantity;
  };

  // ============================================
  // تحميل المنتجات
  // ============================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: orderItems, error: itemsErr } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsErr) {
        toast.error("Failed to load items");
        setLoading(false);
        return;
      }

      const normalized = (orderItems || []).map((item) => {
        const weightBased = isWeightBased(item.weight_unit);
        const originalWeight = parseFloat(item.weight) || 0;
        const pricePerUnit = getPricePerUnit(item);

        return {
          ...item,
          status: item.status || "pending",
          actual_weight:
            item.actual_weight != null && item.actual_weight !== ""
              ? item.actual_weight
              : weightBased
                ? originalWeight
                : "",
          actual_quantity:
            item.actual_quantity != null && item.actual_quantity !== ""
              ? item.actual_quantity
              : !weightBased
                ? item.quantity
                : "",
          actual_unit_price:
            item.actual_unit_price != null && item.actual_unit_price !== ""
              ? item.actual_unit_price
              : pricePerUnit.toFixed(2),
          actual_total: item.actual_total != null ? item.actual_total : null,
          price_difference:
            item.price_difference != null ? item.price_difference : null,
        };
      });

      setItems(normalized);

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("name");

      setAllProducts(products || []);
      setLoading(false);
    };

    loadData();
  }, [order.id]);

  // ============================================
  // حساب الإجمالي لمنتج
  // ============================================
  const calculateTotal = (item) => {
    const weightBased = isWeightBased(item.weight_unit);
    const weight = parseFloat(item.actual_weight) || 0;
    const qty = parseFloat(item.actual_quantity) || 0;
    const price = parseFloat(item.actual_unit_price) || 0;

    if (weightBased && weight > 0) return weight * price;
    if (!weightBased && qty > 0) return qty * price;
    return 0;
  };

  const updateField = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // ============================================
  // تأكيد منتج
  // ============================================
  const confirmItem = (item) => {
    const weightBased = isWeightBased(item.weight_unit);
    const total = calculateTotal(item);

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          status: "scanned",
          actual_quantity: weightBased ? i.actual_quantity : i.quantity,
          actual_total: total,
          price_difference: total - parseFloat(i.total_price || 0),
        };
      })
    );
    setEditingId(null);
  };

  // ============================================
  // وضع علامة غير متوفر
  // ============================================
  const markUnavailable = (item) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          status: "removed",
          actual_weight: null,
          actual_quantity: null,
          actual_total: 0,
          price_difference: -parseFloat(i.total_price || 0),
        };
      })
    );

    setSubstitutionsLog((prev) =>
      prev.filter((s) => s.item_id !== item.id)
    );
  };

  // ============================================
  // استرجاع منتج
  // ============================================
  const restoreItem = (item) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          status: "pending",
          actual_total: null,
          price_difference: null,
        };
      })
    );

    setSubstitutionsLog((prev) =>
      prev.filter((s) => s.item_id !== item.id)
    );
  };

  // ============================================
  // ✅ استبدال منتج (مع ضريبة)
  // ============================================
  const applySubstitution = (originalItem, substituteProduct) => {
    const weightBased = isWeightBased(substituteProduct.weight_unit);

    // ✅ احسب السعر مع ضريبة
    const subTaxRate = parseFloat(substituteProduct.tax_rate) || 0;
    const subBasePrice = parseFloat(substituteProduct.price) || 0;
    const subGrossPrice = subBasePrice * (1 + subTaxRate / 100);

    const subWeight = parseFloat(substituteProduct.weight) || 0;

    const subPricePerUnit =
      weightBased && subWeight > 0
        ? subGrossPrice / subWeight
        : subGrossPrice;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== originalItem.id) return i;

        return {
          ...i,
          status: "substituted",
          original_product_id: i.product_id,
          original_product_name: i.product_name,
          product_id: substituteProduct.id,
          product_name: substituteProduct.name,
          unit_price: substituteProduct.price,
          weight: substituteProduct.weight,
          weight_unit: substituteProduct.weight_unit,
          tax_rate: substituteProduct.tax_rate,
          actual_unit_price: subPricePerUnit.toFixed(2),
          actual_weight: weightBased ? substituteProduct.weight : "",
          actual_quantity: weightBased ? "" : i.quantity,
          actual_total: null,
          price_difference: null,
        };
      })
    );

    setSubstitutionsLog((prev) => {
      const filtered = prev.filter(
        (s) => s.original_product_id !== originalItem.product_id
      );

      return [
        ...filtered,
        {
          item_id: originalItem.id,
          original_product_id: originalItem.product_id,
          original_product_name: originalItem.product_name,
          original_price: parseFloat(originalItem.unit_price) || 0,
          original_weight: parseFloat(originalItem.weight) || 0,
          original_weight_unit: originalItem.weight_unit || "kg",
          substitute_product_id: substituteProduct.id,
          substitute_product_name: substituteProduct.name,
          substitute_price: parseFloat(substituteProduct.price) || 0,
          substitute_weight: parseFloat(substituteProduct.weight) || 0,
          substitute_weight_unit: substituteProduct.weight_unit || "kg",
          substitute_image: substituteProduct.image || null,
          quantity: originalItem.quantity || 1,
          substituted_at: new Date().toISOString(),
        },
      ];
    });

    setSubstitutingItem(null);
    toast.success(`Substituted with "${substituteProduct.name}"`);
  };

  // ============================================
  // الإجماليات
  // ============================================
  const actualProductsTotal = items.reduce((sum, i) => {
    if (i.status === "scanned" || i.status === "substituted")
      return sum + (i.actual_total || 0);
    if (i.status === "removed") return sum + 0;
    return sum;
  }, 0);

  const shippingCost = parseFloat(order.shipping_cost || 0);
  const finalTotal = actualProductsTotal + shippingCost;

  const authorizedMax = parseFloat(order.authorized_amount || 0);
  const remainingBuffer = authorizedMax - finalTotal;

  const allHandled = items.every(
    (i) =>
      i.status === "scanned" ||
      i.status === "removed" ||
      i.status === "substituted"
  );
  const pendingCount = items.filter((i) => i.status === "pending").length;

  // ============================================
  // تأكيد الشحن
  // ============================================
  const handleConfirmShip = async () => {
    if (!allHandled) {
      toast.error(`Please handle all items (${pendingCount} remaining)`);
      return;
    }

    if (!isCOD && hasStripe && remainingBuffer < 0) {
      toast.error(
        `Amount exceeds authorized limit by €${Math.abs(remainingBuffer).toFixed(2)}.`
      );
      return;
    }

    const confirmMsg = isCOD
      ? `Confirm shipment?\n\nTotal to collect: €${finalTotal.toFixed(2)}`
      : `Confirm shipment and charge €${finalTotal.toFixed(2)}?`;

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      for (const item of items) {
        const { error: itemError } = await supabase
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

        if (itemError) throw new Error(`Failed to update ${item.product_name}`);
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          total_price: finalTotal,
          subtotal: actualProductsTotal,
          shipping_cost: shippingCost,
          tax: 0,
          price_adjustment: 0,
          status: "shipped",
          updated_at: new Date().toISOString(),
          substitutions: substitutionsLog,
        })
        .eq("id", order.id);

      if (orderError) throw new Error(`Order update: ${orderError.message}`);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Payment failed");
        setSubmitting(false);
        return;
      }

      if (result.type === "cod") {
        toast.success(
          `✅ Order shipped! €${result.amountToCollect.toFixed(2)} to collect`
        );
      } else if (result.type === "bank_transfer") {
        toast.success(`✅ Order shipped! Awaiting transfer`);
      } else {
        toast.success(
          `✅ Shipped & €${result.finalAmount?.toFixed(2)} charged!`
        );
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Ship failed:", error);
      toast.error(error.message || "Failed to ship order");
    } finally {
      setSubmitting(false);
    }
  };

  const customer = order.customer_info || {};
  const address = order.shipping_address || {};

  const substitutesForItem = useMemo(() => {
    if (!substitutingItem) return [];
    const original = allProducts.find(
      (p) => p.id === substitutingItem.product_id
    );
    if (!original) return [];
    return allProducts.filter(
      (p) => p.category_id === original.category_id && p.id !== original.id
    );
  }, [substitutingItem, allProducts]);

  // ============================================
  // Render
  // ============================================
  return createPortal(
    <div className="ship-modal-overlay" onClick={onClose}>
      <div className="ship-modal" onClick={(e) => e.stopPropagation()}>
        {/* ============ Header ============ */}
        <div className="ship-modal-header-sticky">
          <div className="ship-modal-header">
            <div className="ship-modal-header-left">
              <span className="material-symbols-outlined ship-header-icon">
                local_shipping
              </span>
              <h2>Prepare Shipment</h2>
              <span className="ship-order-badge">#{order.order_number}</span>
              {isCOD && <span className="ship-cod-badge">COD</span>}
            </div>
            <button className="ship-modal-close" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="ship-modal-customer-compact">
            <span className="ship-info-item">
              <span className="material-symbols-outlined">person</span>
              {customer.first_name} {customer.last_name}
            </span>

            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="ship-info-item">
                <span className="material-symbols-outlined">call</span>
                {customer.phone}
              </a>
            )}

            {address.street && (
              <span className="ship-info-item ship-info-address">
                <span className="material-symbols-outlined">location_on</span>
                {address.street} {address.house_number}, {address.postal_code}{" "}
                {address.city}
              </span>
            )}

            <span
              className={`ship-sub-inline ${allowSubstitution ? "yes" : "no"}`}
            >
              <span className="material-symbols-outlined">
                {allowSubstitution ? "swap_horiz" : "block"}
              </span>
              {allowSubstitution ? "Allows substitutes" : "No substitutes"}
            </span>
          </div>
        </div>

        {/* ============ Body ============ */}
        <div className="ship-modal-body">
          {loading ? (
            <div className="ship-loading">
              <div className="ship-spinner" />
              <p>Loading items...</p>
            </div>
          ) : (
            <div className="ship-items">
              {items.map((item, idx) => {
                // ✅ الوحدات الموحّدة
                const weightBased = isWeightBased(item.weight_unit);
                const unitLabel = normalizeUnit(item.weight_unit);

                const calc = calculateTotal(item);
                const isPending = item.status === "pending";
                const isScanned = item.status === "scanned";
                const isRemoved = item.status === "removed";
                const isSubstituted = item.status === "substituted";
                const isEditing = editingId === item.id;
                const showInput = isPending || isEditing;

                return (
                  <div
                    key={item.id}
                    className={`ship-item ${isScanned || isSubstituted ? "is-scanned" : ""
                      } ${isRemoved ? "is-removed" : ""}`}
                  >
                    {/* Head */}
                    <div className="ship-item-head">
                      <span className="ship-item-num">{idx + 1}</span>
                      <div className="ship-item-name">
                        {item.product_name}
                        {item.original_product_name && (
                          <span className="ship-sub-original">
                            (was: {item.original_product_name})
                          </span>
                        )}
                      </div>
                      {isScanned && <span className="ship-badge ok">✓</span>}
                      {isSubstituted && (
                        <span className="ship-badge sub">⇄</span>
                      )}
                      {isRemoved && <span className="ship-badge no">✕</span>}
                      {isPending && (
                        <span className="ship-badge pending">•</span>
                      )}
                    </div>

                    {/* Requested info */}
                    <div className="ship-item-requested">
                      <span>
                        Requested: <strong>{item.quantity}</strong>
                        {weightBased && item.weight
                          ? ` × ${item.weight} ${unitLabel}`
                          : ""}
                      </span>
                      <span>
                        €
                        <strong>
                          {parseFloat(item.unit_price || 0).toFixed(2)}
                        </strong>
                        {weightBased ? `/${unitLabel}` : ""}
                      </span>
                    </div>

                    {/* Edit mode */}
                    {showInput && (
                      <div className="ship-item-edit">
                        <div className="ship-input-row">
                          <div className="ship-field">
                            <label>
                              {weightBased
                                ? `Actual ${unitLabel}`
                                : "Quantity"}
                            </label>
                            <div className="ship-input-wrap">
                              <input
                                type="number"
                                step="0.001"
                                inputMode="decimal"
                                value={
                                  weightBased
                                    ? item.actual_weight
                                    : item.actual_quantity
                                }
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    weightBased
                                      ? "actual_weight"
                                      : "actual_quantity",
                                    e.target.value
                                  )
                                }
                                autoFocus={idx === 0}
                              />
                              <span className="ship-unit">{unitLabel}</span>
                            </div>
                          </div>

                          <div className="ship-field">
                            <label>Price (€/{unitLabel})</label>
                            <div className="ship-input-wrap">
                              <input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                value={item.actual_unit_price}
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    "actual_unit_price",
                                    e.target.value
                                  )
                                }
                              />
                              <span className="ship-unit">€</span>
                            </div>
                          </div>
                        </div>

                        <div className="ship-calc-row">
                          <span>Calculated Total:</span>
                          <strong>€{calc.toFixed(2)}</strong>
                        </div>

                        <div className="ship-item-actions">
                          <button
                            className="ship-btn-confirm"
                            onClick={() => confirmItem(item)}
                            disabled={
                              weightBased
                                ? !item.actual_weight ||
                                !item.actual_unit_price
                                : !item.actual_unit_price
                            }
                          >
                            <span className="material-symbols-outlined">
                              check
                            </span>
                            Confirm
                          </button>

                          <button
                            className="ship-btn-unavailable"
                            onClick={() => {
                              if (allowSubstitution) {
                                setSubstitutingItem(item);
                              } else {
                                markUnavailable(item);
                              }
                            }}
                          >
                            <span className="material-symbols-outlined">
                              {allowSubstitution ? "swap_horiz" : "block"}
                            </span>
                            {allowSubstitution
                              ? "Substitute"
                              : "Not Available"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Final view */}
                    {!showInput && (
                      <div className="ship-item-final">
                        {(isScanned || isSubstituted) && (
                          <>
                            <div className="ship-item-result">
                              <span className="ship-item-weight">
                                {weightBased
                                  ? `${item.actual_weight} ${unitLabel} × €${parseFloat(
                                    item.actual_unit_price || 0
                                  ).toFixed(2)}`
                                  : `${item.actual_quantity} ${unitLabel} × €${parseFloat(
                                    item.actual_unit_price || 0
                                  ).toFixed(2)}`}
                              </span>
                              <strong className="ship-item-total">
                                €
                                {parseFloat(
                                  item.actual_total || 0
                                ).toFixed(2)}
                              </strong>
                            </div>
                            <div className="ship-item-actions">
                              <button
                                className="ship-btn-edit"
                                onClick={() => setEditingId(item.id)}
                              >
                                <span className="material-symbols-outlined">
                                  edit
                                </span>
                                Edit
                              </button>
                              <button
                                className="ship-btn-unavailable"
                                onClick={() => markUnavailable(item)}
                              >
                                <span className="material-symbols-outlined">
                                  block
                                </span>
                                Not Available
                              </button>
                            </div>
                          </>
                        )}

                        {isRemoved && (
                          <>
                            <div className="ship-item-result">
                              <span className="ship-item-removed-text">
                                Not available in store
                              </span>
                              <strong className="ship-item-total-zero">
                                €0.00
                              </strong>
                            </div>
                            <div className="ship-item-actions">
                              {allowSubstitution && (
                                <button
                                  className="ship-btn-restore"
                                  onClick={() => setSubstitutingItem(item)}
                                >
                                  <span className="material-symbols-outlined">
                                    swap_horiz
                                  </span>
                                  Substitute
                                </button>
                              )}
                              <button
                                className="ship-btn-restore"
                                onClick={() => restoreItem(item)}
                              >
                                <span className="material-symbols-outlined">
                                  undo
                                </span>
                                Restore
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ Footer ============ */}
        <div className="ship-modal-footer">
          <div className="ship-totals">
            <div className="ship-total-row">
              <span>Products (actual)</span>
              <span className="actual-products">
                €{actualProductsTotal.toFixed(2)}
              </span>
            </div>
            <div className="ship-total-row">
              <span>Shipping</span>
              <span>€{shippingCost.toFixed(2)}</span>
            </div>

            <div className="ship-total-row actual">
              <span>
                Final Total {isCOD ? "(to collect)" : "(to charge)"}
              </span>
              <span>€{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="ship-footer-actions">
            <button
              className="ship-btn-ship"
              onClick={handleConfirmShip}
              disabled={
                !allHandled || submitting || (!isCOD && remainingBuffer < 0)
              }
            >
              <span className="material-symbols-outlined">
                local_shipping
              </span>
              {submitting
                ? "Processing..."
                : !allHandled
                  ? `${pendingCount} items remaining`
                  : !isCOD && remainingBuffer < 0
                    ? "Amount exceeds limit"
                    : `Confirm & Ship · €${finalTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* ============ Substitute Sub-modal ============ */}
      {substitutingItem && (
        <SubstituteModal
          item={substitutingItem}
          products={substitutesForItem}
          onSelect={(product) => applySubstitution(substitutingItem, product)}
          onClose={() => setSubstitutingItem(null)}
        />
      )}
    </div>,
    document.body
  );
}

/* ============================================
   Sub-modal للاستبدال
============================================ */
function SubstituteModal({ item, products, onSelect, onClose }) {
  return createPortal(
    <div className="substitute-overlay" onClick={onClose}>
      <div className="substitute-modal" onClick={(e) => e.stopPropagation()}>
        <div className="substitute-header">
          <div>
            <h3>⇄ Choose Substitute</h3>
            <p>
              Replace <strong>{item.product_name}</strong> with a similar
              product from the same category
            </p>
          </div>
          <button className="substitute-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="substitute-body">
          {products.length === 0 ? (
            <div className="substitute-empty">
              <span className="material-symbols-outlined">inventory_2</span>
              <p>No alternatives available in this category</p>
              <button className="substitute-btn-cancel" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <div className="substitute-list">
              {products.map((product) => {
                const productUnit = normalizeUnit(product.weight_unit);
                return (
                  <button
                    key={product.id}
                    className="substitute-item"
                    onClick={() => onSelect(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="substitute-img"
                    />
                    <div className="substitute-info">
                      <span className="substitute-name">
                        {product.name}
                      </span>
                      <span className="substitute-meta">
                        €{parseFloat(product.price || 0).toFixed(2)}
                        {product.weight
                          ? ` · ${product.weight} ${productUnit}`
                          : ""}
                      </span>
                    </div>
                    <span className="material-symbols-outlined substitute-arrow">
                      arrow_forward
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}