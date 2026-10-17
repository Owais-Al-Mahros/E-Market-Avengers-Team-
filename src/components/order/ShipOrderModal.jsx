import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useOrders } from "../../context/OrdersContext";
import { capturePayment } from "../../api/orders";
import { normalizeUnit } from "../../lib/units";
import { supabase } from "../../lib/supabase";
import "./ShipOrderModal.css";

/* ══════════════════════════════════════════════════════════
   🎯 Brutto Total — Piece Price هو Brutto مباشرة
   ══════════════════════════════════════════════════════════ */
const calculateTotal = (item) => {
  const price = parseFloat(item.actual_piece_price) || 0;
  const pieceWeight = parseFloat(item.actual_piece_weight) || 0;
  const totalWeight = parseFloat(item.actual_total_weight) || 0;

  if (pieceWeight <= 0 || totalWeight <= 0) return 0;
  return (price / pieceWeight) * totalWeight;
};

/* ══════════════════════════════════════════════════════════
   🎯 تفكيك Brutto → Netto + MwSt.
   ══════════════════════════════════════════════════════════ */
const splitTax = (brutto, taxRate) => {
  const rate = parseFloat(taxRate) || 0;
  const netto = rate > 0 ? brutto / (1 + rate / 100) : brutto;
  return { brutto, netto, tax: brutto - netto };
};

export default function ShipOrderModal({ order, onClose, onSuccess }) {
  const {
    getOrderItemsForShip,
    getProductsForSubstitution,
    saveShippedItems,
  } = useOrders();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [substitutingItem, setSubstitutingItem] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [substitutionsLog, setSubstitutionsLog] = useState([]);

  const hasStripe = !!order.payment_intent_id;
  const allowSubstitution = order.allow_substitution === true;

  /* ═══ Load ═══ */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [orderItems, products] = await Promise.all([
        getOrderItemsForShip(order.id),
        getProductsForSubstitution(),
      ]);
      if (cancelled) return;

      const normalized = (orderItems || []).map((item) => {
        const weight = parseFloat(item.weight) || 0;
        const quantity = parseFloat(item.quantity) || 1;
        const lineTotal = parseFloat(item.total_price) || 0;

        const bruttoPiecePrice = quantity > 0 ? lineTotal / quantity : 0;

        const product = (products || []).find(
          (p) => p.id === item.product_id
        );
        const taxRate =
          parseFloat(item.tax_rate) || parseFloat(product?.tax_rate) || 0;

        return {
          ...item,
          status: item.status || "pending",
          tax_rate: taxRate,

          actual_quantity:
            item.actual_quantity != null && item.actual_quantity !== ""
              ? item.actual_quantity
              : quantity,

          actual_piece_weight:
            item.actual_piece_weight != null && item.actual_piece_weight !== ""
              ? item.actual_piece_weight
              : weight > 0
                ? weight.toFixed(3)
                : "",

          actual_piece_price:
            item.actual_piece_price != null && item.actual_piece_price !== ""
              ? item.actual_piece_price
              : bruttoPiecePrice > 0
                ? bruttoPiecePrice.toFixed(2)
                : "",

          actual_total_weight:
            item.actual_total_weight != null && item.actual_total_weight !== ""
              ? item.actual_total_weight
              : weight > 0
                ? (weight * quantity).toFixed(3)
                : "",

          actual_total: item.actual_total != null ? item.actual_total : null,
          price_difference:
            item.price_difference != null ? item.price_difference : null,
        };
      });

      setItems(normalized);
      setAllProducts(products || []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [order.id, getOrderItemsForShip, getProductsForSubstitution]);

  const updateField = (id, field, value) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  /* ═══ Confirm ═══ */
  const confirmItem = (item) => {
    const total = calculateTotal(item);
    const taxRate = parseFloat(item.tax_rate) || 0;

    const piecePriceBrutto = parseFloat(item.actual_piece_price) || 0;
    const pieceWeight = parseFloat(item.actual_piece_weight) || 0;

    // ✅ Brutto per unit of weight (per g / kg / L / ml)
    // مثال: 0.37 / 200 = 0.00185 €/g
    const bruttoPerWeightUnit =
      pieceWeight > 0 ? piecePriceBrutto / pieceWeight : 0;

    // ✅ Netto per unit of weight (للحفظ في DB)
    // مثال: 0.00185 / 1.07 = 0.001729 €/g Netto
    const nettoPerWeightUnit =
      taxRate > 0
        ? bruttoPerWeightUnit / (1 + taxRate / 100)
        : bruttoPerWeightUnit;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          status: "scanned",
          // ✅ 6 منازل لدقة g/ml
          actual_unit_price: +nettoPerWeightUnit.toFixed(6),
          actual_total: total,
          price_difference: total - parseFloat(i.total_price || 0),
        };
      })
    );
    setEditingId(null);
  };

  const markUnavailable = (item) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          status: "removed",
          actual_total: 0,
          price_difference: -parseFloat(i.total_price || 0),
        };
      })
    );
    setSubstitutionsLog((prev) =>
      prev.filter((s) => s.item_id !== item.id)
    );
  };

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

  const applySubstitution = (originalItem, substituteProduct) => {
    const subTaxRate = parseFloat(substituteProduct.tax_rate) || 0;
    const subBasePrice = parseFloat(substituteProduct.price) || 0;
    const subBruttoPrice = subBasePrice * (1 + subTaxRate / 100);
    const subWeight = parseFloat(substituteProduct.weight) || 0;
    const qty = originalItem.quantity || 1;

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
          tax_rate: subTaxRate,
          actual_quantity: qty,
          actual_piece_price: subBruttoPrice.toFixed(2),
          actual_piece_weight: subWeight > 0 ? subWeight.toFixed(3) : "",
          actual_total_weight:
            subWeight > 0 ? (subWeight * qty).toFixed(3) : "",
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
          substitute_product_id: substituteProduct.id,
          substitute_product_name: substituteProduct.name,
          substitute_price: parseFloat(substituteProduct.price) || 0,
          substitute_weight: subWeight,
          substitute_weight_unit: substituteProduct.weight_unit || "kg",
          quantity: qty,
          substituted_at: new Date().toISOString(),
        },
      ];
    });

    setSubstitutingItem(null);
    toast.success(`Ersetzt mit "${substituteProduct.name}"`);
  };

  /* ═══ Totals ═══ */
  const actualProductsTotal = items.reduce((sum, i) => {
    if (i.status === "scanned" || i.status === "substituted")
      return sum + (i.actual_total || 0);
    if (i.status === "removed") return sum + 0;
    return sum;
  }, 0);

  /* ✅ FIX #5: حساب الضريبة الإجمالية */
  const totalTax = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.status === "removed") return sum;
      const brutto =
        item.actual_total != null
          ? parseFloat(item.actual_total)
          : parseFloat(item.total_price || 0);
      const rate = parseFloat(item.tax_rate) || 0;
      if (rate <= 0 || brutto <= 0) return sum;
      const netto = brutto / (1 + rate / 100);
      return sum + (brutto - netto);
    }, 0);
  }, [items]);

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

  /* ═══ Confirm Ship ═══ */
  const handleConfirmShip = async () => {
    if (!allHandled) {
      toast.error(`Bitte alle Artikel bearbeiten (${pendingCount} ausstehend)`);
      return;
    }

    if (hasStripe && remainingBuffer < 0) {
      toast.error(
        `Betrag überschreitet Limit um €${Math.abs(remainingBuffer).toFixed(2)}.`
      );
      return;
    }

    const confirmMsg = `Versand bestätigen und €${finalTotal.toFixed(2)} belasten?`;
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    const toastId = toast.loading("Wird gespeichert & Zahlung verarbeitet...");

    try {
      // 1. حفظ البنود + تغيير الحالة إلى "shipped"
      const saveResult = await saveShippedItems(items, {
        id: order.id,
        total_price: finalTotal,
        subtotal: actualProductsTotal,
        shipping_cost: shippingCost,
        tax: +totalTax.toFixed(2),
        price_adjustment: 0,
        status: "shipped",
        updated_at: new Date().toISOString(),
        substitutions: substitutionsLog,
      });

      if (!saveResult.success)
        throw new Error(saveResult.error || "Fehler beim Speichern");

      // 2. محاولة capture
      const result = await capturePayment(order.id);

      if (!result.success) {
        console.error(
          "❌ Capture failed, reverting order status:",
          result.error
        );

        // ✅ FIX #32: تراجع عن status إلى "confirmed"
        const { error: revertErr } = await supabase
          .from("orders")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (revertErr) {
          console.error("❌ Revert failed:", revertErr);
          toast.error(
            `Zahlung fehlgeschlagen: ${result.error}. ` +
            `Manueller Eingriff erforderlich — Support kontaktieren.`,
            { id: toastId, duration: 12000 }
          );
        } else {
          toast.error(
            `❌ Zahlung fehlgeschlagen: ${result.error}. ` +
            `Bestellung zurück auf "Confirmed" — bitte erneut versuchen.`,
            { id: toastId, duration: 10000 }
          );
        }

        setSubmitting(false);
        onSuccess();
        return;
      }

      // 3. نجاح
      if (result.type === "already_paid") {
        toast.success(
          `✅ Versandt! Zahlung war bereits erfasst (€${result.finalAmount?.toFixed(2)}).`,
          { id: toastId }
        );
      } else {
        toast.success(
          `✅ Versandt & €${result.finalAmount?.toFixed(2)} belastet!`,
          { id: toastId }
        );
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Ship failed:", error);
      toast.error(error.message || "Fehler beim Versand", { id: toastId });
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

  /* ═══ Render ═══ */
  return createPortal(
    <div className="ship-modal-overlay" onClick={onClose}>
      <div className="ship-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ship-modal-header-sticky">
          <div className="ship-modal-header">
            <div className="ship-modal-header-left">
              <span className="material-symbols-outlined ship-header-icon">
                local_shipping
              </span>
              <h2>Versand vorbereiten</h2>
              <span className="ship-order-badge">#{order.order_number}</span>
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
                {address.street} {address.house_number},{" "}
                {address.postal_code} {address.city}
              </span>
            )}
            <span
              className={`ship-sub-inline ${allowSubstitution ? "yes" : "no"}`}
            >
              <span className="material-symbols-outlined">
                {allowSubstitution ? "swap_horiz" : "block"}
              </span>
              {allowSubstitution ? "Ersatz erlaubt" : "Kein Ersatz"}
            </span>
          </div>
        </div>

        <div className="ship-modal-body">
          {loading ? (
            <div className="ship-loading">
              <div className="ship-spinner" />
              <p>Artikel werden geladen...</p>
            </div>
          ) : (
            <div className="ship-items">
              {items.map((item, idx) => {
                const unitLabel = normalizeUnit(item.weight_unit) || "g";
                const calc = calculateTotal(item);
                const taxRate = parseFloat(item.tax_rate) || 0;
                const taxSplit = splitTax(calc, taxRate);
                const nettoTotal = taxSplit.netto;
                const taxAmount = taxSplit.tax;

                const originalBruttoUnit =
                  (parseFloat(item.total_price) || 0) /
                  (parseFloat(item.quantity) || 1);

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
                    <div className="ship-item-head">
                      <span className="ship-item-num">{idx + 1}</span>
                      <div className="ship-item-name">
                        {item.product_name}
                        {item.original_product_name && (
                          <span className="ship-sub-original">
                            (war: {item.original_product_name})
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

                    <div className="ship-item-requested">
                      <span>
                        Bestellt: <strong>{item.quantity}</strong>
                        {item.weight
                          ? ` × ${item.weight} ${normalizeUnit(
                            item.weight_unit
                          )}`
                          : ""}
                      </span>
                      <span>
                        Original (Brutto):{" "}
                        <strong>€{originalBruttoUnit.toFixed(2)}</strong>
                        {item.weight
                          ? ` / ${item.weight} ${normalizeUnit(
                            item.weight_unit
                          )}`
                          : ""}
                      </span>
                    </div>

                    {showInput && (
                      <div className="ship-item-edit">
                        <div className="ship-input-row">
                          <div className="ship-field">
                            <label>
                              Piece Price (Brutto)
                              <small className="ship-field-hint">
                                Preis pro Stück (inkl. MwSt.)
                              </small>
                            </label>
                            <div className="ship-input-wrap">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                inputMode="decimal"
                                value={item.actual_piece_price}
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    "actual_piece_price",
                                    e.target.value
                                  )
                                }
                                autoFocus={idx === 0}
                              />
                              <span className="ship-unit">€</span>
                            </div>
                          </div>

                          <div className="ship-field">
                            <label>
                              Piece Weight ({unitLabel})
                              <small className="ship-field-hint">
                                Gewicht einer Einheit
                              </small>
                            </label>
                            <div className="ship-input-wrap">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                inputMode="decimal"
                                value={item.actual_piece_weight}
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    "actual_piece_weight",
                                    e.target.value
                                  )
                                }
                              />
                              <span className="ship-unit">{unitLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ship-input-row">
                          <div className="ship-field">
                            <label>
                              Quantity (Ordered)
                              <small className="ship-field-hint ship-field-hint-lock">
                                <span className="material-symbols-outlined">
                                  lock
                                </span>
                                Vom Kunden bestellt
                              </small>
                            </label>
                            <div className="ship-input-wrap ship-input-locked">
                              <input
                                type="number"
                                value={item.actual_quantity}
                                readOnly
                                tabIndex={-1}
                              />
                              <span className="ship-unit">Stk</span>
                            </div>
                          </div>

                          <div className="ship-field">
                            <label>
                              Total Weight ({unitLabel})
                              <small className="ship-field-hint">
                                Gesamtgewicht aller Einheiten
                              </small>
                            </label>
                            <div className="ship-input-wrap">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                inputMode="decimal"
                                value={item.actual_total_weight}
                                onChange={(e) =>
                                  updateField(
                                    item.id,
                                    "actual_total_weight",
                                    e.target.value
                                  )
                                }
                              />
                              <span className="ship-unit">{unitLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ship-calc-row ship-calc-detail">
                          <div className="ship-calc-line">
                            <span>Netto Total:</span>
                            <strong>€{nettoTotal.toFixed(2)}</strong>
                          </div>
                          <div className="ship-calc-line">
                            <span>+ MwSt. ({taxRate}%):</span>
                            <strong>€{taxAmount.toFixed(2)}</strong>
                          </div>
                          <div className="ship-calc-line ship-calc-brutto">
                            <span>Brutto Total:</span>
                            <strong className="ship-calc-total">
                              €{calc.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        <div className="ship-item-actions">
                          <button
                            className="ship-btn-confirm"
                            onClick={() => confirmItem(item)}
                            disabled={
                              !item.actual_quantity ||
                              !item.actual_piece_weight ||
                              !item.actual_piece_price ||
                              !item.actual_total_weight
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
                              if (allowSubstitution) setSubstitutingItem(item);
                              else markUnavailable(item);
                            }}
                          >
                            <span className="material-symbols-outlined">
                              {allowSubstitution ? "swap_horiz" : "block"}
                            </span>
                            {allowSubstitution ? "Substitute" : "Not Available"}
                          </button>
                        </div>
                      </div>
                    )}

                    {!showInput && (
                      <div className="ship-item-final">
                        {(isScanned || isSubstituted) && (
                          <>
                            <div className="ship-item-result">
                              <span className="ship-item-weight">
                                {item.actual_quantity} ×{" "}
                                {item.actual_piece_weight} {unitLabel} · Total:{" "}
                                {item.actual_total_weight} {unitLabel}
                              </span>
                              <strong className="ship-item-total">
                                €
                                {parseFloat(item.actual_total || 0).toFixed(2)}
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
                                Bearbeiten
                              </button>
                              <button
                                className="ship-btn-unavailable"
                                onClick={() => markUnavailable(item)}
                              >
                                <span className="material-symbols-outlined">
                                  block
                                </span>
                                Nicht verfügbar
                              </button>
                            </div>
                          </>
                        )}

                        {isRemoved && (
                          <>
                            <div className="ship-item-result">
                              <span className="ship-item-removed-text">
                                Nicht verfügbar
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
                                  Ersatz
                                </button>
                              )}
                              <button
                                className="ship-btn-restore"
                                onClick={() => restoreItem(item)}
                              >
                                <span className="material-symbols-outlined">
                                  undo
                                </span>
                                Wiederherstellen
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

        <div className="ship-modal-footer">
          <div className="ship-totals">
            <div className="ship-total-row">
              <span>Produkte (Brutto)</span>
              <span className="actual-products">
                €{actualProductsTotal.toFixed(2)}
              </span>
            </div>
            <div className="ship-total-row">
              <span>Versand</span>
              <span>€{shippingCost.toFixed(2)}</span>
            </div>
            <div className="ship-total-row actual">
              <span>Endbetrag (zu belasten)</span>
              <span>€{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="ship-footer-actions">
            <button
              className="ship-btn-ship"
              onClick={handleConfirmShip}
              disabled={
                !allHandled || submitting || (hasStripe && remainingBuffer < 0)
              }
            >
              <span className="material-symbols-outlined">
                local_shipping
              </span>
              {submitting
                ? "Wird verarbeitet..."
                : !allHandled
                  ? `${pendingCount} Artikel ausstehend`
                  : hasStripe && remainingBuffer < 0
                    ? "Betrag überschreitet Limit"
                    : `Bestätigen & Versenden · €${finalTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {substitutingItem && (
        <SubstituteModal
          item={substitutingItem}
          products={substitutesForItem}
          onSelect={(product) =>
            applySubstitution(substitutingItem, product)
          }
          onClose={() => setSubstitutingItem(null)}
        />
      )}
    </div>,
    document.body
  );
}

function SubstituteModal({ item, products, onSelect, onClose }) {
  return createPortal(
    <div className="substitute-overlay" onClick={onClose}>
      <div className="substitute-modal" onClick={(e) => e.stopPropagation()}>
        <div className="substitute-header">
          <div>
            <h3>⇄ Ersatzprodukt wählen</h3>
            <p>
              <strong>{item.product_name}</strong> durch ein ähnliches Produkt
              ersetzen
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
              <p>Keine Alternativen verfügbar</p>
              <button className="substitute-btn-cancel" onClick={onClose}>
                Schließen
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