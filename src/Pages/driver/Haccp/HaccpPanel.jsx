// src/Pages/driver/Haccp/HaccpPanel.jsx
import { useState } from "react";
import VehicleCheckForm from "./VehicleCheckForm";
import TemperatureLogForm from "./TemperatureLogForm";
import CoolingEquipmentCheck from "./CoolingEquipmentCheck";
import CleaningLogForm from "./CleaningLogForm";
import MyRecordsView from "./MyRecordsView";
import "./HaccpPanel.css";

const SUB_TABS = [
    { key: "vehicle", label: "Fahrzeugcheck", icon: "directions_car" },
    { key: "temperature", label: "Temperatur", icon: "thermostat" },
    { key: "cooling", label: "Kühlgeräte", icon: "ac_unit" },
    { key: "cleaning", label: "Reinigung", icon: "cleaning_services" },
    { key: "records", label: "Meine Protokolle", icon: "history" },
];

export default function HaccpPanel({ driverId, onCheckCompleted }) {
    const [activeSubTab, setActiveSubTab] = useState("vehicle");

    return (
        <div className="haccp-panel">
            <nav className="haccp-subtabs">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`haccp-subtab ${activeSubTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveSubTab(tab.key)}
                    >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="haccp-subtab-content">
                {activeSubTab === "vehicle" && (
                    <VehicleCheckForm driverId={driverId} onSuccess={onCheckCompleted} />
                )}
                {activeSubTab === "temperature" && (
                    <TemperatureLogForm driverId={driverId} />
                )}
                {activeSubTab === "cooling" && (
                    <CoolingEquipmentCheck driverId={driverId} />
                )}
                {activeSubTab === "cleaning" && (
                    <CleaningLogForm driverId={driverId} />
                )}
                {activeSubTab === "records" && <MyRecordsView />}
            </div>
        </div>
    );
}