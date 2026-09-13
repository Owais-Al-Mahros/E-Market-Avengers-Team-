import "./HowItWorks.css";
import { usePricing } from "../../../context/PricingContext";

import distanceImg from "../../../assets/illustrations/pricing-distance.png";
import weightImg from "../../../assets/illustrations/pricing-weight.png";
import floorImg from "../../../assets/illustrations/pricing-floor.png";
import coverageImg from "../../../assets/illustrations/pricing-coverage.png";
import browseImg from "../../../assets/illustrations/step-browse.png";
import addressImg from "../../../assets/illustrations/step-address.png";
import deliveryImg from "../../../assets/illustrations/step-delivery.png";

export default function HowItWorks() {
    const { pricing, loading } = usePricing();

    if (loading) {
        return (
            <section className="hiw-section">
                <div className="hiw-container">
                    <p className="hiw-loading">Loading pricing...</p>
                </div>
            </section>
        );
    }

    const steps = [
        {
            number: "01",
            image: browseImg,
            title: "Browse & Add",
            desc: "Explore our fresh catalog and add your favorites to the cart.",
        },
        {
            number: "02",
            image: addressImg,
            title: "Enter Your Address",
            desc: "We calculate the exact shipping cost in real time.",
        },
        {
            number: "03",
            image: deliveryImg,
            title: "We Deliver",
            desc: "Your order arrives at your door, fresh and on time.",
        },
    ];

    const pricingCards = [
        {
            image: distanceImg,
            title: "Distance",
            value: `€${pricing.pricePerKm.toFixed(2)}`,
            unit: "per kilometer",
            desc: "Calculated from our warehouse to your doorstep.",
        },
        {
            image: weightImg,
            title: "Weight",
            value: `Free < ${pricing.freeWeightThresholdKg} kg`,
            unit: `€${pricing.pricePerExtraKg.toFixed(2)} per extra kg`,
            desc: "Heavy orders beyond the free threshold.",
        },
        {
            image: floorImg,
            title: "Floors",
            value: `€${pricing.pricePerFloorWithElevator.toFixed(2)}`,
            unit: `with lift · €${pricing.pricePerFloorWithoutElevator.toFixed(2)} without`,
            desc: "Per floor above ground level.",
        },
        {
            image: coverageImg,
            title: "Coverage",
            value: `${pricing.maxDeliveryDistanceKm} km`,
            unit: "max delivery radius",
            desc: `Based in ${pricing.baseAddress || "Berlin, Germany"}.`,
        },
    ];

    return (
        <section className="hiw-section" id="how-it-works">
            <div className="hiw-container">
                {/* ============================================
            🚀 1. How It Works (الآن أولاً)
        ============================================ */}
                <div className="hiw-steps-header">
                    <span className="hiw-badge">🚀 Simple & Fast</span>
                    <h3 className="hiw-steps-title">How It Works</h3>
                    <p className="hiw-steps-subtitle">
                        Three simple steps to your doorstep
                    </p>
                </div>

                <div className="hiw-steps-grid">
                    {steps.map((step, idx) => (
                        <div className="hiw-step" key={idx}>
                            <div className="hiw-step-number">{step.number}</div>
                            <div className="hiw-step-image-wrap">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="hiw-step-image"
                                    loading="lazy"
                                />
                            </div>
                            <h4 className="hiw-step-title">{step.title}</h4>
                            <p className="hiw-step-desc">{step.desc}</p>

                            {idx < steps.length - 1 && (
                                <div className="hiw-step-arrow">→</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ============================================
            💰 2. Pricing (الآن ثانياً)
        ============================================ */}
                <div className="hiw-header">
                    <span className="hiw-badge">💡 Transparent Pricing</span>
                    <h2 className="hiw-title">How We Calculate Your Delivery</h2>
                    <p className="hiw-subtitle">
                        No hidden fees. Just clear, honest pricing based on distance and weight.
                    </p>
                </div>

                <div className="hiw-pricing-grid">
                    {pricingCards.map((card, idx) => (
                        <div className="hiw-pricing-card" key={idx}>
                            <div className="hiw-pricing-image-wrap">
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    className="hiw-pricing-image"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="hiw-pricing-title">{card.title}</h3>
                            <div className="hiw-pricing-value">{card.value}</div>
                            <div className="hiw-pricing-unit">{card.unit}</div>
                            <p className="hiw-pricing-desc">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ===== Free Delivery Banner ===== */}
                {pricing.freeDeliveryThresholdAmount > 0 && (
                    <div className="hiw-free-banner">
                        <span className="hiw-free-icon">🎉</span>
                        <div className="hiw-free-text">
                            <strong>Free Delivery</strong>
                            <span>
                                On orders above €{pricing.freeDeliveryThresholdAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}