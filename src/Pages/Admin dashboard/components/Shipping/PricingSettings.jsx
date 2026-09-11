import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./PricingSettings.css";
import { usePricing } from "../../../../context/PricingContext";


export default function PricingSettings() {
  const {
    pricing,
    loading,
    saving,
    savePricing,
  } = usePricing();

  const [formData, setFormData] = useState(pricing);
  const [geocoding, setGeocoding] = useState(false);

  // مزامنة البيانات عند تحميل الإعدادات من السيرفر
  useEffect(() => {
    setFormData(pricing);
  }, [pricing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  // ✅ زر جلب الإحداثيات تلقائياً من العنوان
  const geocodeAddress = async () => {
    if (!formData.baseAddress?.trim()) {
      toast.error("Please enter an address first!");
      return;
    }
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          formData.baseAddress
        )}&format=json&limit=1`,
        { headers: { "User-Agent": "Shopora-App" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          baseLatitude: parseFloat(data[0].lat),
          baseLongitude: parseFloat(data[0].lon),
        }));
        toast.success("✅ Coordinates updated!");
      } else {
        toast.error("Address not found.");
      }
    } catch (error) {
      toast.error("Geocoding failed.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    const result = await savePricing(formData);
    if (result.success) toast.success("✅ Pricing saved successfully!");
    else toast.error(`Failed: ${result.error}`);
  };

  if (loading) return <div className="pricing-loading">Loading pricing...</div>;

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h3>💰 Pricing & Delivery Rules</h3>
        <p>Configure how shipping costs are calculated for each order.</p>
      </div>

      <div className="pricing-grid">
        {/* ===== بطاقة المركز ===== */}
        <div className="pricing-card">
          <h4>📍 Warehouse Location</h4>
          <div className="address-row">
            <input
              type="text"
              name="baseAddress"
              value={formData.baseAddress || ""}
              onChange={handleChange}
              placeholder="e.g., Marienplatz 1, München"
            />
            <button
              className="geo-btn"
              onClick={geocodeAddress}
              disabled={geocoding}
            >
              {geocoding ? "⏳" : "📍 Auto"}
            </button>
          </div>
          <div className="coord-row">
            <div>
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="baseLatitude"
                value={formData.baseLatitude || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="baseLongitude"
                value={formData.baseLongitude || ""}
                onChange={handleChange}
              />
            </div>
          </div>
          <small>Used to measure distance to the customer.</small>
        </div>

        {/* ===== بطاقة المسافة ===== */}
        <div className="pricing-card">
          <h4>🚗 Distance Pricing</h4>
          <label>Price per Kilometer (€)</label>
          <input
            type="number" step="0.01" name="pricePerKm"
            value={formData.pricePerKm || 0}
            onChange={handleChange}
          />
          <label>Max Delivery Distance (Km)</label>
          <input
            type="number" step="0.1" name="maxDeliveryDistanceKm"
            value={formData.maxDeliveryDistanceKm || 0}
            onChange={handleChange}
          />
          <label>Free Delivery above (€)</label>
          <input
            type="number" step="0.01" name="freeDeliveryThresholdAmount"
            value={formData.freeDeliveryThresholdAmount || 0}
            onChange={handleChange}
          />
          <small>Set 0 to disable free delivery.</small>
        </div>

        {/* ===== بطاقة الوزن ===== */}
        <div className="pricing-card">
          <h4>⚖️ Weight Pricing</h4>
          <label>Free Weight up to (Kg)</label>
          <input
            type="number" step="0.1" name="freeWeightThresholdKg"
            value={formData.freeWeightThresholdKg || 0}
            onChange={handleChange}
          />
          <small>No weight fee below this threshold.</small>
          <label>Price per Extra Kg (€)</label>
          <input
            type="number" step="0.01" name="pricePerExtraKg"
            value={formData.pricePerExtraKg || 0}
            onChange={handleChange}
          />
        </div>

        {/* ===== بطاقة الطوابق ===== */}
        <div className="pricing-card">
          <h4>🏢 Floor Fees (per floor)</h4>
          <label>With Elevator (€)</label>
          <input
            type="number" step="0.01" name="pricePerFloorWithElevator"
            value={formData.pricePerFloorWithElevator || 0}
            onChange={handleChange}
          />
          <label>Without Elevator (€) <span className="badge">+effort</span></label>
          <input
            type="number" step="0.01" name="pricePerFloorWithoutElevator"
            value={formData.pricePerFloorWithoutElevator || 0}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="pricing-footer">
        <button className="save-pricing-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "💾 Save Pricing"}
        </button>
      </div>
    </div>
  );
}