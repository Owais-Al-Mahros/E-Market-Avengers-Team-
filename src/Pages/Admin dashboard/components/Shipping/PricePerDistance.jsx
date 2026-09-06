// src/Pages/Admin dashboard/components/Shipping/PricePerDistance.jsx
import { useState } from "react";
import "./PricePerDistance.css";

export default function PricePerDistance({ onPriceChange }) {
    const [prices, setPrices] = useState({
        baseFee: 5.99,
        costPerKm: 0.5,
        freeDeliveryThreshold: 50,
    });

    const handleChange = (key, value) => {
        const updated = { ...prices, [key]: value };
        setPrices(updated);
        if (onPriceChange) onPriceChange(updated);
    };

    return (
        <div className="price-per-distance">
            <h3>💰 Delivery Pricing</h3>
            <div className="price-grid">
                <div className="price-field">
                    <label>Base Delivery Fee</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={prices.baseFee}
                        onChange={(e) => handleChange("baseFee", parseFloat(e.target.value))}
                    />
                    <small>Base fee for any delivery</small>
                </div>

                <div className="price-field">
                    <label>Cost per Kilometer</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={prices.costPerKm}
                        onChange={(e) => handleChange("costPerKm", parseFloat(e.target.value))}
                    />
                    <small>Additional cost per km</small>
                </div>

                <div className="price-field">
                    <label>Free Delivery Threshold</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={prices.freeDeliveryThreshold}
                        onChange={(e) => handleChange("freeDeliveryThreshold", parseFloat(e.target.value))}
                    />
                    <small>Order above this amount = free delivery</small>
                </div>
            </div>
        </div>
    );
}