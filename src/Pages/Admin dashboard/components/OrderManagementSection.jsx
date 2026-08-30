// src/Pages/Admin dashboard/components/OrderManagementSection.jsx
import { useState } from "react";
import NewOrders from "./modals/NewOrders";
import ConfirmedOrders from "./modals/ConfirmedOrders";
import ShippedOrders from "./modals/ShippedOrders";
import DeliveredOrders from "./modals/DeliveredOrders";
import CancelledOrders from "./modals/CancelledOrders";
import "./OrderManagementSection.css";

export default function OrderManagementSection() {
    const [activeTab, setActiveTab] = useState("pending");

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
            {/* شريط التبويبات الداخلي */}
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

            {/* المحتوى المتغير حسب التبويب النشط */}
            <div className="tabs-content">
                {renderContent()}
            </div>
        </div>
    );
}