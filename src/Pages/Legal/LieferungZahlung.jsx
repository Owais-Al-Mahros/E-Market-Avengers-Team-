import LegalLayout from "./LegalLayout";
import { useCompany } from "../../context/CompanyContext";
import { usePricing } from "../../context/PricingContext";

export default function LieferungZahlung() {
    const { company, loading: companyLoading } = useCompany();
    const { pricing, loading: pricingLoading } = usePricing();

    if (companyLoading || pricingLoading || !company) {
        return <div>Loading...</div>;
    }

    const sections = [
        { id: "liefergebiet", title: "1. Liefergebiet" },
        { id: "preise", title: "2. Lieferpreise" },
        { id: "zeitfenster", title: "3. Lieferzeitfenster" },
        { id: "zugang", title: "4. Zugang zum Lieferort" },
        { id: "kuehlware", title: "5. Kühl- und Tiefkühlware" },
        { id: "gewicht", title: "6. Gewichtsware" },
        { id: "zahlung", title: "7. Zahlungsarten" },
    ];

    return (
        <LegalLayout
            title="Lieferung & Zahlung"
            subtitle="Informationen zu Liefergebiet, Preisen und Zahlungsarten"
            sections={sections}
        >
            <h2 id="liefergebiet">1. Liefergebiet</h2>
            <p>
                {company.brand_name} liefert ausschließlich innerhalb des im Checkout
                angezeigten Liefergebiets. Die maximale Lieferentfernung beträgt{" "}
                <strong>{pricing?.maxDeliveryDistanceKm || 30} km</strong> vom
                zentralen Lager.
            </p>
            <p>
                Adressen außerhalb dieses Gebiets können nicht als Lieferadresse
                gebucht werden.
            </p>

            <h2 id="preise">2. Lieferpreise</h2>
            <p>
                Der für Ihre konkrete Bestellung geltende Lieferpreis wird vor Abgabe
                der Bestellung transparent im Checkout angezeigt. Er setzt sich
                zusammen aus:
            </p>
            <ul>
                <li>
                    <strong>Entfernung:</strong> €
                    {pricing?.pricePerKm?.toFixed(2) || "1.50"} pro Kilometer vom Lager
                    zur Lieferadresse
                </li>
                <li>
                    <strong>Gewicht:</strong> Kostenlos bis{" "}
                    {pricing?.freeWeightThresholdKg || 50} kg. Darüber hinaus €
                    {pricing?.pricePerExtraKg?.toFixed(2) || "0.50"} pro zusätzlichem
                    Kilogramm
                </li>
                <li>
                    <strong>Etage:</strong> €
                    {pricing?.pricePerFloorWithElevator?.toFixed(2) || "0.50"} pro Etage
                    mit Aufzug, €
                    {pricing?.pricePerFloorWithoutElevator?.toFixed(2) || "1.00"} pro
                    Etage ohne Aufzug
                </li>
                {pricing?.freeDeliveryThresholdAmount > 0 && (
                    <li>
                        <strong>Kostenlose Lieferung:</strong> Bei Bestellungen über €
                        {pricing.freeDeliveryThresholdAmount.toFixed(2)}
                    </li>
                )}
            </ul>
            <div className="legal-box">
                <strong>📌 Transparente Preise</strong>
                Alle Lieferkosten werden vor dem Bestellabschluss angezeigt. Keine
                versteckten Gebühren.
            </div>

            <h2 id="zeitfenster">3. Lieferzeitfenster</h2>
            <p>
                Lieferzeitfenster werden kalenderbasiert pro Lager freigeschaltet.
                Jedes Zeitfenster besitzt eine interne Kapazität.
            </p>
            <p>
                Ausgebuchte oder deaktivierte Zeitfenster sind für Kunden nicht
                buchbar. Der Kunde sieht keine interne Kapazitätszahl.
            </p>

            <h2 id="zugang">4. Zugang zum Lieferort</h2>
            <p>
                Der Kunde gibt Etage, Aufzugssituation und erforderliche
                Zugangsinformationen (z.B. Klingelname) wahrheitsgemäß an.
            </p>
            <p>
                Ist die Übergabe aus vom Kunden zu vertretenden Gründen nicht möglich
                (z.B. falsche Adresse, niemand anwesend), behalten wir uns vor, die
                Kosten für eine erneute Zustellung in Rechnung zu stellen.
            </p>

            <h2 id="kuehlware">5. Kühl- und Tiefkühlware</h2>
            <p>
                Kühl- und Tiefkühlprodukte werden nach den für das jeweilige Produkt
                geltenden Anforderungen transportiert. Bitte lagern Sie diese Produkte
                nach Übergabe unverzüglich entsprechend.
            </p>

            <h2 id="gewicht">6. Gewichtsware und Preisabweichungen</h2>
            <p>
                Bei gewichtsabhängigen Produkten (z.B. Obst, Gemüse, Fleisch) kann die
                tatsächlich gelieferte Menge geringfügig von der bestellten
                Zielmenge abweichen.
            </p>
            <p>
                Der endgültige Warenpreis wird anhand der tatsächlichen Menge und des
                vor Bestellung angegebenen Grundpreises berechnet.
            </p>
            <div className="legal-box warning">
                <strong>⚠️ Zahlungsmodell bei Kartenzahlung</strong>
                Bei Kartenzahlung wird zunächst ein Betrag inklusive eines
                Sicherheitspuffers reserviert. Die endgültige Belastung erfolgt erst
                nach Bestätigung der tatsächlichen Menge. Nicht benötigte Beträge
                werden automatisch freigegeben.
            </div>

            <h2 id="zahlung">7. Zahlungsarten</h2>
            <p>Wir akzeptieren die folgenden Zahlungsarten:</p>
            <ul>
                <li>
                    <strong>Kredit- / Debitkarte</strong> (über Stripe) — sicher und
                    verschlüsselt
                </li>
                <li>
                    <strong>Weitere Zahlungsarten</strong> (PayPal, etc.) werden zu
                    einem späteren Zeitpunkt ergänzt.
                </li>
            </ul>
            <p>
                Zahlungsdienstleister:{" "}
                <strong>Stripe Payments Europe, Ltd.</strong> (Irland). Es gelten
                zusätzlich die Bedingungen von Stripe.
            </p>
        </LegalLayout>
    );
}