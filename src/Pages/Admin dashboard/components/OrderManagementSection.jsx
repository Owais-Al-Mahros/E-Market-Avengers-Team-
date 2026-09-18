import { useState, useEffect, useRef } from "react";
import { useOrders } from "../../../context/OrdersContext";
import NewOrders from "./modals/NewOrders";
import ConfirmedOrders from "./modals/ConfirmedOrders";
import ShippedOrders from "./modals/ShippedOrders";
import DeliveredOrders from "./modals/DeliveredOrders";
import CancelledOrders from "./modals/CancelledOrders";
import OrdersTable from "./modals/OrdersTable";
import "./OrderManagementSection.css";

export default function OrderManagementSection() {
    const [activeTab, setActiveTab] = useState("pending");
    const [searchTerm, setSearchTerm] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    const inputRef = useRef(null);

    // ✅ كل شيء من السياق — لا state محلي
    const {
        orders,
        loading,
        searchOrders,
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
                fetchOrders(); // إعادة تعيين إلى كل الطلبات
            }
            return;
        }

        const timer = setTimeout(async () => {
            setHasSearched(true);
            await searchOrders(term);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const clearSearch = () => {
        setSearchTerm("");
        setHasSearched(false);
        fetchOrders();
        if (inputRef.current) inputRef.current.focus();
    };

    const handleRefresh = async () => {
        if (hasSearched && searchTerm.trim()) {
            await searchOrders(searchTerm.trim());
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

    const renderContent = () => {
        switch (activeTab) {
            case "pending": return <NewOrders />;
            case "confirmed": return <ConfirmedOrders />;
            case "shipped": return <ShippedOrders />;
            case "delivered": return <DeliveredOrders />;
            case "cancelled": return <CancelledOrders />;
            default: return <NewOrders />;
        }
    };

    return (
        <div className="orders-management-container">
            {/* Search Bar */}
            <div className="oms-search-bar">
                <div className="oms-search-input-wrap">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Bestellnummer suchen... (z.B. ORD-20260918-1234)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="oms-search-clear"
                            onClick={clearSearch}
                            type="button"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {hasSearched && !loading && (
                    <span className="oms-search-count">
                        {orders.length} Ergebnis{orders.length !== 1 ? "se" : ""}
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
                            <span
                                className="tab-dot"
                                style={{ background: tab.color }}
                            ></span>
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
                            onUpdateStatus={updateOrderStatus}   // ✅ الدالة الحقيقية مباشرة
                            onRefresh={handleRefresh}
                        />
                    ) : (
                        <div className="empty-state">
                            <span className="material-symbols-outlined">search_off</span>
                            <p>Keine Bestellung gefunden für "{searchTerm}"</p>
                        </div>
                    )
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
}