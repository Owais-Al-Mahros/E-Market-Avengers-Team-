import { useState } from "react";
import WiderrufRequestsSection from "./WiderrufRequests/WiderrufRequestsSection";
import ContactMessagesSection from "./ContactMessages/ContactMessagesSection";
import { useWiderruf } from "../../../../context/WiderrufContext";
import { useMessages } from "../../../../context/MessagesContext";
import "./MessagesSection.css";

const TABS = [
    { key: "widerruf", label: "Withdrawal Requests", icon: "gavel", source: "widerruf" },
    { key: "contact", label: "Contact Messages", icon: "mail", source: "messages" },
];

export default function MessagesSection() {
    const [activeTab, setActiveTab] = useState("widerruf");
    const { counts: widerrufCounts } = useWiderruf();
    const { counts: messageCounts } = useMessages();

    const getCount = (source) => {
        if (source === "widerruf") return widerrufCounts.pending;
        if (source === "messages") return messageCounts.pending;
        return 0;
    };

    return (
        <div className="msg-hub">
            <div className="msg-hub-tabs">
                {TABS.map((tab) => {
                    const count = getCount(tab.source);
                    return (
                        <button
                            key={tab.key}
                            className={`msg-hub-tab ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="material-symbols-outlined">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {count > 0 && <span className="msg-hub-count">{count}</span>}
                        </button>
                    );
                })}
            </div>

            {activeTab === "widerruf" && <WiderrufRequestsSection />}
            {activeTab === "contact" && <ContactMessagesSection />}
        </div>
    );
}