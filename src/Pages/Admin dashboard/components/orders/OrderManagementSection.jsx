import { useState, useEffect, useRef } from "react";
import { useOrders } from "../../../../context/OrdersContext";
import OrdersTab from "./OrdersTab";
import OrdersTable from "./OrdersTable";
import "./OrderManagementSection.css";

export default function OrderManagementSection() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState("order"); // "order" أو "product"
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef(null);

  const {
    orders,
    loading,
    searchOrders,
    searchOrdersByProduct, // الدالة الجديدة
    updateOrderStatus,
    fetchOrders,
  } = useOrders();

  // ============================================
  // Debounced Search
  // ============================================
  useEffect(() => {
    const term = searchTerm.trim();

    if (!term) {
      if (hasSearched) {
        setHasSearched(false);
        fetchOrders();
      }
      return;
    }

    const timer = setTimeout(async () => {
      setHasSearched(true);
      if (searchMode === "order") {
        await searchOrders(term);
      } else {
        await searchOrdersByProduct(term);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, searchMode, hasSearched, fetchOrders, searchOrders, searchOrdersByProduct]);

  const clearSearch = () => {
    setSearchTerm("");
    setHasSearched(false);
    fetchOrders();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRefresh = async () => {
    if (hasSearched && searchTerm.trim()) {
      if (searchMode === "order") await searchOrders(searchTerm.trim());
      else await searchOrdersByProduct(searchTerm.trim());
    }
  };

  // ============================================
  // Tabs
  // ============================================
  const tabs = [
    { key: "pending", label: "⏳ Pending", color: "#f59e0b" },
    { key: "confirmed", label: "✅ Confirmed", color: "#3b82f6" },
    { key: "shipped", label: "📦 Shipped", color: "#8b5cf6" },
    { key: "delivered", label: "🎉 Delivered", color: "#10b981" },
    { key: "cancelled", label: "❌ Cancelled", color: "#ef4444" },
  ];

  return (
    <div className="orders-management-container">
      {/* Search Bar */}
      <div className="oms-search-bar">
        {/* أزرار تبديل نوع البحث */}
        <select
          className="oms-search-mode"
          value={searchMode}
          onChange={(e) => {
            setSearchMode(e.target.value);
            setSearchTerm("");
            setHasSearched(false);
          }}
        >
          <option value="order">🔍 Bestellnummer</option>
          <option value="product">📦 Produktname</option>
        </select>

        <div className="oms-search-input-wrap">
          <span className="material-symbols-outlined">search</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              searchMode === "order"
                ? "Bestellnummer suchen... (z.B. ORD-20260918-1234)"
                : "Produktname suchen... (z.B. Milch)"
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="oms-search-clear" onClick={clearSearch} type="button">
              ✕
            </button>
          )}
        </div>

        {hasSearched && !loading && (
          <span className="oms-search-count">
            {orders.length} Ergebnis{orders.length !== 1 ? "se" : ""}
            {searchMode === "product" && " (Letzte 30 Tage)"}
          </span>
        )}
      </div>

      {/* Tabs — تُخفى عند البحث */}
      {!hasSearched && (
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-dot" style={{ background: tab.color }}></span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="tabs-content">
        {hasSearched ? (
          loading ? (
            <div className="loading-state">Suche läuft...</div>
          ) : orders.length > 0 ? (
            <OrdersTable
              orders={orders}
              status="search"
              onUpdateStatus={updateOrderStatus}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined">search_off</span>
              <p>
                {searchMode === "order"
                  ? `Keine Bestellung gefunden für "${searchTerm}"`
                  : `Keine Bestellung mit dem Produkt "${searchTerm}" in den letzten 30 Tagen gefunden.`}
              </p>
            </div>
          )
        ) : (
          <OrdersTab status={activeTab} />
        )}
      </div>
    </div>
  );
}