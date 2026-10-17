import { useState } from "react";
import AdminRecordsView from "./AdminRecordsView";
import ViolationsPanel from "./ViolationsPanel";
import "./HaccpSection.css";

const SUB_TABS = [
    { key: "records", label: "📋 Records", icon: "history" },
    { key: "violations", label: "⚠️ Violations", icon: "warning" },
];

export default function HaccpSection() {
    const [activeTab, setActiveTab] = useState("records");

    return (
        <div className="haccp-admin-wrap">
            <header className="haccp-admin-header">
                <div>
                    <h2>🛡️ HACCP & Food Hygiene</h2>
                    <p>Monitor driver HACCP records and violations</p>
                </div>
            </header>

            <nav className="haccp-admin-tabs">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`haccp-admin-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="haccp-admin-content">
                {activeTab === "records" && <AdminRecordsView />}
                {activeTab === "violations" && <ViolationsPanel />}
            </div>
        </div>
    );
}