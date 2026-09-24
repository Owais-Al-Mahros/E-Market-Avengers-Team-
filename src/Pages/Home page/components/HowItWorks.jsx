import "./HowItWorks.css";
import { usePricing } from "../../../context/PricingContext";

import distanceImg from "../../../assets/illustrations/pricing-distance.png";
import weightImg from "../../../assets/illustrations/pricing-weight.png";
import floorImg from "../../../assets/illustrations/pricing-floor.png";
import coverageImg from "../../../assets/illustrations/pricing-coverage.png";

/* German price format: 27,90 */
const fmt = (val) =>
    parseFloat(val || 0).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function HowItWorks() {
    const { pricing, loading } = usePricing();

    if (loading) {
        return (
            <section className="hiw-section">
                <div className="hiw-container">
                    <p className="hiw-loading">Preise werden geladen...</p>
                </div>
            </section>
        );
    }

    // ============================================
    // Distance tiers
    // ============================================
    const distanceTiers = [...(pricing.distanceTiers || [])].sort(
        (a, b) => parseFloat(a.from) - parseFloat(b.from)
    );

    const minDistancePrice =
        distanceTiers.length > 0
            ? Math.min(...distanceTiers.map((t) => parseFloat(t.price) || 0))
            : 0;

    const firstTierTo = distanceTiers[0]
        ? parseFloat(distanceTiers[0].to)
        : 15;

    // ============================================
    // Weight tiers
    // ============================================
    const weightTiers = [...(pricing.weightTiers || [])].sort(
        (a, b) => parseFloat(a.from) - parseFloat(b.from)
    );

    const firstFreeWeightTier = weightTiers.find(
        (t) => parseFloat(t.price) === 0
    );
    const freeWeight = firstFreeWeightTier
        ? parseFloat(firstFreeWeightTier.to)
        : 0;

    // ============================================
    // Floors
    // ============================================
    const floorWithElevator =
        parseFloat(pricing.pricePerFloorWithElevator) || 0;
    const floorWithoutElevator =
        parseFloat(pricing.pricePerFloorWithoutElevator) || 0;

    const floorRows = [
        { floor: 0, label: "Erdgeschoss (0)" },
        { floor: 1, label: "1. Etage" },
        { floor: 2, label: "2. Etage" },
        { floor: 3, label: "3. Etage" },
        { floor: 4, label: "4. Etage" },
    ];

    // ============================================
    // Coverage
    // ============================================
    const maxDistance = parseFloat(pricing.maxDeliveryDistanceKm) || 0;

    return (
        <section className="hiw-section" id="how-it-works">
            <div className="hiw-container">
                {/* ============================================
                    Section Header
                ============================================ */}
                <div className="hiw-header">
                    <span className="hiw-badge">💡 Transparent Pricing</span>
                    <h2 className="hiw-title">
                        How We Calculate Your Delivery
                    </h2>
                    <p className="hiw-subtitle">
                        No hidden fees. Just clear, honest pricing based on
                        distance, weight, floors, and coverage.
                    </p>
                </div>

                <div className="hiw-cards-grid">
                    {/* ============================================
                        CARD 1 — Entfernung
                    ============================================ */}
                    <article className="hiw-card">
                        <header className="hiw-card-header">
                            <div className="hiw-card-icon">
                                <span className="material-symbols-outlined">
                                    location_on
                                </span>
                            </div>
                            <div className="hiw-card-title-wrap">
                                <h3 className="hiw-card-title">Entfernung</h3>
                                <p className="hiw-card-subtitle">
                                    Klare Preise – egal ob nah oder weiter weg.
                                </p>
                            </div>
                        </header>

                        <div className="hiw-card-image">
                            <img src={distanceImg} alt="Entfernung" />
                        </div>

                        <div className="hiw-card-highlight">
                            <span className="hiw-card-highlight-icon">🏷️</span>
                            <div>
                                <strong>
                                    Mindestlieferpreis: {fmt(minDistancePrice)} €
                                </strong>
                                <span>
                                    Inkl. der ersten {firstTierTo} km – der
                                    gleiche Preis, egal ob 1 km oder{" "}
                                    {firstTierTo} km.
                                </span>
                            </div>
                        </div>

                        <div className="hiw-card-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Entfernung</th>
                                        <th>Lieferpreis</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {distanceTiers.length > 0 ? (
                                        distanceTiers.map((tier, i) => (
                                            <tr key={tier.id || i}>
                                                <td>
                                                    {tier.from} – {tier.to} km
                                                </td>
                                                <td className="hiw-td-price">
                                                    {fmt(tier.price)} €
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="2"
                                                className="hiw-td-empty"
                                            >
                                                Keine Stufen definiert
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="hiw-card-note">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            <p>
                                Die Entfernung wird automatisch im Warenkorb
                                anhand deiner Adresse berechnet.
                            </p>
                        </div>

                        <div className="hiw-card-footer">
                            <span className="hiw-card-footer-icon">🚗</span>
                            <p>
                                Unsere Lieferungen erfolgen mit dem Auto – für
                                einen sicheren und frischen Transport deiner
                                Einkäufe.
                            </p>
                        </div>
                    </article>

                    {/* ============================================
                        CARD 2 — Gewicht
                    ============================================ */}
                    <article className="hiw-card">
                        <header className="hiw-card-header">
                            <div className="hiw-card-icon">
                                <span className="hiw-card-kg-badge">KG</span>
                            </div>
                            <div className="hiw-card-title-wrap">
                                <h3 className="hiw-card-title">Gewicht</h3>
                                <p className="hiw-card-subtitle">
                                    Fair und transparent.
                                </p>
                            </div>
                        </header>

                        <div className="hiw-card-image">
                            <img src={weightImg} alt="Gewicht" />
                        </div>

                        <div className="hiw-card-highlight">
                            <span className="hiw-card-highlight-icon">🏷️</span>
                            <div>
                                <strong>
                                    {freeWeight > 0
                                        ? `Inklusive: ${freeWeight} kg`
                                        : "Gewichtsabhängige Preise"}
                                </strong>
                                <span>
                                    {freeWeight > 0
                                        ? "Im Lieferpreis bereits enthalten."
                                        : "Der Preis wird nach dem tatsächlichen Gewicht berechnet."}
                                </span>
                            </div>
                        </div>

                        <div className="hiw-card-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Gesamtgewicht</th>
                                        <th>Preis Pro kg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {weightTiers.length > 0 ? (
                                        weightTiers.map((tier, i) => (
                                            <tr key={tier.id || i}>
                                                <td>
                                                    {tier.from} – {tier.to} kg
                                                </td>
                                                <td
                                                    className={
                                                        parseFloat(
                                                            tier.price
                                                        ) === 0
                                                            ? "hiw-td-included"
                                                            : "hiw-td-price"
                                                    }
                                                >
                                                    {parseFloat(tier.price) ===
                                                        0
                                                        ? "inklusive"
                                                        : `+ ${fmt(
                                                            tier.price
                                                        )} €`}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="2"
                                                className="hiw-td-empty"
                                            >
                                                Keine Gewichtsstufen definiert
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="hiw-card-note">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            <p>
                                Das tatsächliche Gewicht wird nach dem Einkauf
                                ermittelt. Eine mögliche Anpassung erfolgt nach
                                der Lieferung.
                            </p>
                        </div>

                        <div className="hiw-card-footer">
                            <span className="hiw-card-footer-icon">🌿</span>
                            <p>
                                Wir achten auf sorgfältige Auswahl und
                                schonenden Transport – für beste Qualität.
                            </p>
                        </div>
                    </article>

                    {/* ============================================
                        CARD 3 — Etagen
                    ============================================ */}
                    <article className="hiw-card">
                        <header className="hiw-card-header">
                            <div className="hiw-card-icon">
                                <span className="material-symbols-outlined">
                                    apartment
                                </span>
                            </div>
                            <div className="hiw-card-title-wrap">
                                <h3 className="hiw-card-title">Etagen</h3>
                                <p className="hiw-card-subtitle">
                                    Bequem bis an deine Tür.
                                </p>
                            </div>
                        </header>

                        <div className="hiw-card-image">
                            <img src={floorImg} alt="Etagen" />
                        </div>

                        <div className="hiw-card-highlight">
                            <span className="hiw-card-highlight-icon">🏷️</span>
                            <div>
                                <strong>
                                    Pro Etage: {fmt(floorWithElevator)} € mit
                                    Aufzug
                                </strong>
                                <span>
                                    {fmt(floorWithoutElevator)} € ohne Aufzug
                                </span>
                            </div>
                        </div>

                        <div className="hiw-card-table hiw-card-table-3col">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Etage</th>
                                        <th>Preis (Aufzug)</th>
                                        <th>Preis (ohne)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {floorRows.map((row) => (
                                        <tr key={row.floor}>
                                            <td>{row.label}</td>
                                            <td className="hiw-td-price">
                                                {fmt(
                                                    row.floor *
                                                    floorWithElevator
                                                )}{" "}
                                                €
                                            </td>
                                            <td className="hiw-td-price">
                                                {fmt(
                                                    row.floor *
                                                    floorWithoutElevator
                                                )}{" "}
                                                €
                                            </td>
                                        </tr>
                                    ))}
                                    {/* <tr>
                                        <td>ab 5. Etage</td>
                                        <td
                                            colSpan="2"
                                            className="hiw-td-muted"
                                        >
                                            auf Anfrage
                                        </td>
                                    </tr> */}
                                </tbody>
                            </table>
                        </div>

                        <div className="hiw-card-note">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            <p>
                                Gilt ab dem 1. Stock (Erdgeschoss = 0). Bei sehr
                                großen oder schweren Bestellungen kann ein
                                zusätzlicher Aufwand anfallen.
                            </p>
                        </div>

                        <div className="hiw-card-footer">
                            <span className="hiw-card-footer-icon">🏠</span>
                            <p>
                                Wir liefern bis an deine Wohnungstür – einfach,
                                komfortabel und zuverlässig.
                            </p>
                        </div>
                    </article>

                    {/* ============================================
                        CARD 4 — Liefergebiet
                    ============================================ */}
                    {/* <article className="hiw-card">
                        <header className="hiw-card-header">
                            <div className="hiw-card-icon">
                                <span className="material-symbols-outlined">
                                    map
                                </span>
                            </div>
                            <div className="hiw-card-title-wrap">
                                <h3 className="hiw-card-title">
                                    Liefergebiet
                                </h3>
                                <p className="hiw-card-subtitle">
                                    Bis {maxDistance} km – flexibel und
                                    regional.
                                </p>
                            </div>
                        </header>

                        <div className="hiw-card-image">
                            <img src={coverageImg} alt="Liefergebiet" />
                        </div>

                        <div className="hiw-card-highlight">
                            <span className="hiw-card-highlight-icon">🏷️</span>
                            <div>
                                <strong>
                                    Maximale Lieferdistanz: {maxDistance} km
                                </strong>
                                <span>
                                    Zuverlässig, flexibel und fair bepreist.
                                </span>
                            </div>
                        </div>

                        <div className="hiw-card-hubs">
                            <h4 className="hiw-card-hubs-title">
                                Unsere Hubs
                            </h4>
                            <p className="hiw-card-hubs-desc">
                                Wir liefern aus mehreren Standorten, um dir
                                einen schnellen und zuverlässigen Service zu
                                bieten.
                            </p>
                            <div className="hiw-card-hubs-grid">
                                {[
                                    {
                                        name: "Hub 1",
                                        region: "Zentrale Region",
                                    },
                                    {
                                        name: "Hub 2",
                                        region: "Weitere Region",
                                    },
                                    {
                                        name: "Hub 3",
                                        region: "Weitere Region",
                                    },
                                    {
                                        name: "Weitere Hubs",
                                        region: "in Planung",
                                    },
                                ].map((hub, i) => (
                                    <div key={i} className="hiw-card-hub">
                                        <span className="material-symbols-outlined">
                                            apartment
                                        </span>
                                        <strong>{hub.name}</strong>
                                        <small>{hub.region}</small>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hiw-card-note">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            <p>
                                Gib deine Adresse im Warenkorb ein, um die
                                Verfügbarkeit und die genauen Lieferkosten für
                                deine Region zu prüfen.
                            </p>
                        </div>

                        <div className="hiw-card-footer">
                            <span className="hiw-card-footer-icon">📍</span>
                            <p>
                                Shopora wächst – schon bald sind wir in
                                weiteren Regionen für dich da.
                            </p>
                        </div>
                    </article> */}
                </div>
            </div>
        </section>
    );
}