import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import toast from "react-hot-toast";
import "./PricingSettings.css";
import { usePricing } from "../../../../../context/PricingContext";
import { calculateDelivery } from "../../../../../api/delivery";
import DistanceTiersEditor from "./DistanceTiersEditor";
import WeightTiersEditor from "./WeightTiersEditor";

/* ═══════════════════════════════════════════
   Warehouse Address — Structured Fields
   ═══════════════════════════════════════════ */
const WAREHOUSE_ADDRESS_FIELDS = [
  { name: "baseStreet", label: "Street", placeholder: "Marienplatz", span: 2 },
  { name: "baseHouseNumber", label: "No.", placeholder: "1", span: 1 },
  { name: "basePostalCode", label: "Postal Code", placeholder: "80331", span: 1 },
  { name: "baseCity", label: "City", placeholder: "München", span: 2 },
];

const PricingSettings = forwardRef((_props, ref) => {
  const { pricing, loading, savePricing } = usePricing();

  const [formData, setFormData] = useState(pricing);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setFormData(pricing);
  }, [pricing]);

  /* ═══════════════════════════════════════════
     Expose save() to parent
     ═══════════════════════════════════════════ */
  useImperativeHandle(ref, () => ({
    save: async () => {
      return await savePricing(formData);
    },
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  /* ═══════════════════════════════════════════
     Compose address from structured fields
     ═══════════════════════════════════════════ */
  const getFullAddress = () => {
    const { baseStreet, baseHouseNumber, basePostalCode, baseCity } = formData;

    if (!baseStreet?.trim() || !basePostalCode?.trim() || !baseCity?.trim()) {
      return null;
    }

    return [
      baseStreet.trim(),
      baseHouseNumber?.trim(),
      `${basePostalCode.trim()} ${baseCity.trim()}`,
      "Germany",
    ]
      .filter(Boolean)
      .join(", ");
  };

  /* ═══════════════════════════════════════════
     Geocoding via API layer
     ═══════════════════════════════════════════ */
  const geocodeAddress = async () => {
    const fullAddress = getFullAddress();

    if (!fullAddress) {
      toast.error("Please fill Street, Postal Code and City first.");
      return;
    }

    setGeocoding(true);
    try {
      const data = await calculateDelivery({
        customerAddress: fullAddress,
        itemsWeight: 0,
        floor: 0,
        hasElevator: false,
        cartSubtotal: 0,
      });

      if (!data.success || !data.customerCoordinates) {
        toast.error(data.error || "Address not found.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        baseLatitude: data.customerCoordinates.lat,
        baseLongitude: data.customerCoordinates.lon,
      }));

      toast.success("Coordinates updated");
    } catch (err) {
      console.error(err);
      toast.error("Geocoding failed.");
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return <div className="pricing-loading">Loading pricing...</div>;
  }

  return (
    <div className="pricing-container">
      <div className="pricing-grid">
        {/* ═══ Warehouse Address ═══ */}
        <div className="pricing-card pricing-card-wide">
          <h4>📍 Warehouse Address</h4>

          <div className="warehouse-address-grid">
            {WAREHOUSE_ADDRESS_FIELDS.map((field) => (
              <div
                key={field.name}
                className="pricing-field"
                data-span={field.span}
              >
                <label>{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="warehouse-geo-row">
            <button
              type="button"
              className="geo-btn"
              onClick={geocodeAddress}
              disabled={geocoding}
            >
              {geocoding ? "⏳ Locating..." : "📍 Locate on Map"}
            </button>

            <span className="warehouse-coords">
              {formData.baseLatitude && formData.baseLongitude
                ? `${Number(formData.baseLatitude).toFixed(5)}, ${Number(formData.baseLongitude).toFixed(5)}`
                : "Coordinates not set"}
            </span>
          </div>

          <small>
            Used to measure distance to each customer's address.
          </small>
        </div>

        {/* ═══ Floor Fees ═══ */}
        <div className="pricing-card">
          <h4>🏢 Floor Fees (per floor)</h4>

          <label>With Elevator (€)</label>
          <input
            type="number"
            step="0.01"
            name="pricePerFloorWithElevator"
            value={formData.pricePerFloorWithElevator || 0}
            onChange={handleChange}
          />

          <label>
            Without Elevator (€){" "}
            <span className="badge">+effort</span>
          </label>
          <input
            type="number"
            step="0.01"
            name="pricePerFloorWithoutElevator"
            value={formData.pricePerFloorWithoutElevator || 0}
            onChange={handleChange}
          />

          <small>Applied per floor above ground level.</small>
        </div>

        {/* ═══ Weight Pricing ═══ */}
        <div className="pricing-card pricing-card-wide">
          <h4>⚖️ Weight Pricing</h4>

          <div className="weight-pricing-top">
            <div className="weight-pricing-field">
              <label>Maximum Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="maxWeightKg"
                value={formData.maxWeightKg || 0}
                onChange={handleChange}
              />
              <small>Orders above this weight are rejected.</small>
            </div>
          </div>

          <WeightTiersEditor
            tiers={formData.weightTiers || []}
            maxWeight={formData.maxWeightKg || 0}
            onChange={(newTiers) =>
              setFormData((prev) => ({
                ...prev,
                weightTiers: newTiers,
              }))
            }
          />
        </div>

        {/* ═══ Distance Pricing ═══ */}
        <div className="pricing-card pricing-card-wide">
          <h4>🚗 Distance Pricing</h4>

          <div className="distance-pricing-top">
            <div className="distance-pricing-field">
              <label>Max Delivery Distance (km)</label>
              <input
                type="number"
                step="0.1"
                name="maxDeliveryDistanceKm"
                value={formData.maxDeliveryDistanceKm || 0}
                onChange={handleChange}
              />
              <small>Orders beyond this distance are rejected.</small>
            </div>

            <div className="distance-pricing-field">
              <label>Free Delivery above (€)</label>
              <input
                type="number"
                step="0.01"
                name="freeDeliveryThresholdAmount"
                value={formData.freeDeliveryThresholdAmount || 0}
                onChange={handleChange}
              />
              <small>0 = disabled.</small>
            </div>
          </div>

          <DistanceTiersEditor
            tiers={formData.distanceTiers || []}
            maxDistance={formData.maxDeliveryDistanceKm || 0}
            onChange={(newTiers) =>
              setFormData((prev) => ({
                ...prev,
                distanceTiers: newTiers,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
});

PricingSettings.displayName = "PricingSettings";

export default PricingSettings;