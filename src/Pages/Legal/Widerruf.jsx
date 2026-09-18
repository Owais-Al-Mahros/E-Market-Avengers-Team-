import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { useCompany } from "../../context/CompanyContext";

export default function Widerruf() {
    const { company, loading } = useCompany();
    if (loading || !company) return <div>Loading...</div>;

    const sections = [
        { id: "grundsatz", title: "A. Grundsatz" },
        { id: "belehrung", title: "B. Widerrufsbelehrung" },
        { id: "ausnahmen", title: "C. Gesetzliche Ausnahmen" },
        { id: "ausuebung", title: "D. So üben Sie Ihr Widerrufsrecht aus" },
        { id: "formular", title: "E. Muster-Widerrufsformular" },
    ];

    return (
        <LegalLayout
            title="Widerrufsbelehrung"
            subtitle="Ihr gesetzliches Widerrufsrecht als Verbraucher"
            sections={sections}
        >
            <h2 id="grundsatz">A. Grundsatz</h2>
            <p>
                Verbrauchern steht bei Fernabsatzverträgen grundsätzlich ein
                gesetzliches Widerrufsrecht zu, soweit keine gesetzliche Ausnahme
                eingreift.
            </p>
            <div className="legal-box">
                <strong>⚠️ Wichtig für Lebensmittel</strong>
                Wegen des Verkaufs von Lebensmitteln, verderblicher Ware und
                konkreten Lieferzeitfenstern gilt für {company.brand_name} eine
                artikel- und leistungsbezogene Regelung. Bitte lesen Sie Abschnitt C.
            </div>

            <h2 id="belehrung">B. Widerrufsbelehrung</h2>
            <p>
                <strong>Widerrufsrecht:</strong> Sie haben das Recht, binnen{" "}
                <strong>vierzehn Tagen</strong> ohne Angabe von Gründen einen
                widerrufbaren Vertrag zu widerrufen. Die Widerrufsfrist beginnt mit
                dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht
                der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
            </p>
            <p>
                Um Ihr Widerrufsrecht auszuüben, müssen Sie {company.brand_name},{" "}
                {company.owner_name}, {company.address}, {company.postal_code}{" "}
                {company.city}, E-Mail:{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
                , Telefon: {company.contact_phone}, mittels einer eindeutigen
                Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über
                Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
            <p>
                Sie können dafür das unten stehende Muster-Widerrufsformular
                verwenden; dies ist nicht vorgeschrieben.
            </p>
            <p>
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
                Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
                Widerrufsfrist absenden.
            </p>

            <h2 id="ausnahmen">C. Gesetzliche Ausnahmen</h2>
            <p>
                Ein Widerrufsrecht besteht insbesondere <strong>nicht</strong> bei:
            </p>
            <ul>
                <li>
                    Waren, die schnell verderben können oder deren Verfallsdatum
                    schnell überschritten würde (z.B. frisches Obst, Gemüse, Fleisch,
                    Fisch, Milchprodukte, frisches Brot)
                </li>
                <li>
                    versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder
                    der Hygiene nicht zur Rückgabe geeignet sind, wenn die
                    Versiegelung nach Lieferung entfernt wurde
                </li>
                <li>Waren, die nach Kundenspezifikation angefertigt werden</li>
            </ul>
            <div className="legal-box warning">
                <strong>⚠️ Achtung bei gemischten Bestellungen</strong>
                Bei Bestellungen mit gemischten Produkten (frisch + haltbar) gilt
                die Ausnahme nur für die frischen Produkte. Für haltbare Produkte
                (z.B. Konserven, Nudeln) gilt das 14-tägige Widerrufsrecht weiterhin.
            </div>

            <h2 id="ausuebung">D. So üben Sie Ihr Widerrufsrecht aus</h2>
            <p>
                Um Ihr Widerrufsrecht <strong>elektronisch</strong> und unkompliziert
                auszuüben, nutzen Sie bitte unsere Funktion{" "}
                <strong>"Meine Bestellung verfolgen"</strong>. Dort können Sie:
            </p>
            <ul>
                <li>Ihre Bestellung mit Bestellnummer und E-Mail aufrufen</li>
                <li>
                    Die Produkte auswählen, die Sie zurückgeben möchten
                </li>
                <li>Den Widerruf direkt absenden</li>
            </ul>

            <div className="legal-cta">
                <span className="legal-cta-icon">📦</span>
                <div className="legal-cta-content">
                    <strong>Widerruf elektronisch einreichen</strong>
                    <p>
                        Nutzen Sie unsere Funktion "Meine Bestellung verfolgen", um
                        Ihren Widerruf direkt online einzureichen.
                    </p>
                </div>
                <Link to="/track-order" className="legal-cta-btn">
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Zum Widerruf
                </Link>
            </div>

            <p>
                Nach Absenden erhalten Sie unverzüglich eine elektronische
                Eingangsbestätigung mit Inhalt, Datum und Uhrzeit Ihrer Erklärung.
            </p>
            <p>
                Alternativ können Sie den Widerruf auch per E-Mail an{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>{" "}
                oder per Post an die oben genannte Adresse senden.
            </p>

            <h2 id="formular">E. Muster-Widerrufsformular</h2>
            <p>
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
                dieses Formular aus und senden Sie es zurück.)
            </p>
            <div className="legal-box">
                <p>
                    An: {company.brand_name}, {company.owner_name}, {company.address},{" "}
                    {company.postal_code} {company.city}, E-Mail:{" "}
                    {company.contact_email}
                </p>
                <p>
                    Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen
                    Vertrag über den Kauf der folgenden Waren / die Erbringung der
                    folgenden Leistung:
                </p>
                <p>_____________________________________________</p>
                <p>Bestellt am / erhalten am: ___________________</p>
                <p>Name des/der Verbraucher(s): _________________</p>
                <p>Anschrift des/der Verbraucher(s): ______________</p>
                <p>Datum: ______________</p>
            </div>
        </LegalLayout>
    );
}