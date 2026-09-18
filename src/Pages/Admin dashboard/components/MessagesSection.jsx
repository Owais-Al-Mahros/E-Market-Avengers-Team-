import WiderrufRequestsSection from "./WiderrufRequestsSection";
import "./MessagesSection.css";
import { useState } from "react";

export default function MessagesSection() {
    const [activeTab, setActiveTab] = useState("widerruf");

    return (
        <div className="msg-hub">
            <div className="msg-hub-tabs">
                <button
                    className={`msg-hub-tab ${activeTab === "widerruf" ? "active" : ""}`}
                    onClick={() => setActiveTab("widerruf")}
                >
                    <span className="material-symbols-outlined">gavel</span>
                    <span>Withdrawal Requests</span>
                </button>
            </div>

            {activeTab === "widerruf" && <WiderrufRequestsSection />}
        </div>
    );
}