import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { useCompany } from "../../context/CompanyContext";

export default function AGB() {
    const { company, loading } = useCompany();
    if (loading || !company) return <div>Loading...</div>;

    const sections = [
        { id: "geltung", title: "1. Geltungsbereich" },
        { id: "vertrag", title: "2. Vertragsschluss" },
        { id: "produkte", title: "3. Produkte & Ersatzartikel" },
        { id: "preise", title: "4. Preise & Mengen" },
        { id: "lieferung", title: "5. Lieferung" },
        { id: "zeitfenster", title: "6. Lieferzeitfenster" },
        { id: "zahlung", title: "7. Zahlung" },
        { id: "eigentum", title: "8. Eigentumsvorbehalt" },
        { id: "widerruf", title: "9. Widerrufsrecht" },
        { id: "aenderung", title: "10. Änderungen vor Versand" },
        { id: "maengel", title: "11. Mängelrechte" },
        { id: "alter", title: "12. Altersbeschränkte Produkte" },
        { id: "streit", title: "13. Streitbeilegung" },
        { id: "sprache", title: "14. Vertragssprache" },
        { id: "kontakt", title: "15. Kontakt" },
    ];

    return (
        <LegalLayout
            title="Allgemeine Geschäftsbedingungen"
            subtitle="AGB für Bestellungen über den Online-Shop"
            sections={sections}
        >
            <h2 id="geltung">1. Geltungsbereich</h2>
            <p>
                Diese Allgemeinen Geschäftsbedingungen gelten für Bestellungen von
                Verbrauchern über den Online-Shop <strong>{company.brand_name}</strong>.
                Vertragspartner ist {company.owner_name}, handelnd unter "
                {company.brand_name}", {company.address}, {company.postal_code}{" "}
                {company.city}.
            </p>
            <p>
                Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu
                Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch
                ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können.
            </p>

            <h2 id="vertrag">2. Angebot und Vertragsschluss</h2>
            <p>
                Die Darstellung von Waren im Online-Shop stellt noch kein bindendes
                Vertragsangebot dar. Der Kunde legt Produkte in den Warenkorb, gibt
                Lieferadresse und Liefertermin an, wählt die Zahlungsart und kann
                seine Eingaben vor Abgabe der Bestellung prüfen.
            </p>
            <p>
                Mit Betätigung der eindeutig als zahlungspflichtig gekennzeichneten
                Bestellschaltfläche gibt der Kunde eine verbindliche Bestellung ab.
                Der Zugang der Bestellung wird elektronisch bestätigt.
            </p>
            <div className="legal-box">
                <strong>⚠️ Wichtig: Vertragsschluss</strong>
                Der Vertrag kommt erst mit unserer ausdrücklichen Auftragsbestätigung
                zustande. Wir behalten uns das Recht vor, Bestellungen ohne Angabe von
                Gründen abzulehnen.
            </div>

            <h2 id="produkte">3. Produkte, Verfügbarkeit und Ersatzartikel</h2>
            <p>
                Es gelten die im Shop zum Bestellzeitpunkt dargestellten
                Produktinformationen. Ist ein Artikel nach Bestellung nicht verfügbar,
                wird der Kunde informiert.
            </p>
            <p>
                <strong>Ersatzartikel</strong> dürfen nur geliefert und berechnet
                werden, wenn der Kunde dies zuvor wirksam ausgewählt bzw. akzeptiert
                hat. Ohne Zustimmung wird kein höherpreisiger Ersatzartikel berechnet.
            </p>

            <h2 id="preise">4. Preise und variable Mengen</h2>
            <p>
                Alle Endpreise werden einschließlich der jeweils geltenden
                Umsatzsteuer angezeigt. Zusätzliche Liefer-, Gewichts-, Etagen- oder
                sonstige Kosten werden vor Abgabe der Bestellung klar ausgewiesen und
                im Gesamtpreis berücksichtigt.
            </p>
            <p>
                Bei Waren, deren Endpreis vom tatsächlichen Gewicht abhängt, erfolgt
                die Preisberechnung transparent anhand des angegebenen Grundpreises
                und der tatsächlich gelieferten Menge.
            </p>

            <h2 id="lieferung">5. Lieferung und Liefergebiet</h2>
            <p>
                {company.brand_name} liefert ausschließlich in die im Checkout als
                verfügbar ausgewiesenen Liefergebiete und zu den dort angebotenen
                Lieferzeitfenstern.
            </p>
            <p>
                Der Kunde ist verpflichtet, eine vollständige und erreichbare
                Lieferadresse sowie zutreffende Zugangsinformationen anzugeben.
            </p>

            <h2 id="zeitfenster">6. Lieferzeitfenster</h2>
            <p>
                Der Kunde wählt ein im Shop freigeschaltetes Lieferzeitfenster. Bei
                außergewöhnlichen Ereignissen kann eine Verschiebung erforderlich
                sein; der Kunde wird unverzüglich informiert.
            </p>

            <h2 id="zahlung">7. Zahlung</h2>
            <p>
                Es werden ausschließlich die im Checkout angezeigten Zahlungsarten
                akzeptiert. Zahlungsabwicklung, Autorisierung und endgültige Belastung
                werden dem Kunden vor Bestellung transparent dargestellt.
            </p>
            <p>
                Eingesetzter Zahlungsdienstleister: <strong>Stripe</strong>. Für
                Zahlungsdienste können zusätzlich die Bedingungen des jeweiligen
                Zahlungsdienstleisters gelten.
            </p>

            <h2 id="eigentum">8. Eigentumsvorbehalt</h2>
            <p>
                Die gelieferte Ware bleibt bis zur vollständigen Bezahlung Eigentum
                von {company.brand_name}.
            </p>

            <h2 id="widerruf">9. Widerrufsrecht und gesetzliche Ausnahmen</h2>
            <p>
                Verbrauchern steht grundsätzlich das gesetzliche Widerrufsrecht zu,
                soweit keine gesetzliche Ausnahme greift. Für schnell verderbliche
                Waren bzw. Waren mit schnell überschrittenem Verfallsdatum kann das
                Widerrufsrecht ausgeschlossen sein.
            </p>
            <div className="legal-box warning">
                <strong>⚠️ Hinweis für frische Produkte</strong>
                Für frisches Obst, Gemüse, Fleisch, Fisch und andere schnell
                verderbliche Lebensmittel besteht gemäß § 312g Abs. 2 Nr. 2 BGB
                <strong> kein Widerrufsrecht</strong>.
            </div>
            <p>
                Die Einzelheiten ergeben sich aus der{" "}
                <Link to="/widerruf">gesonderten Widerrufsbelehrung</Link>.
            </p>

            <h2 id="aenderung">10. Änderungen der Bestellung vor Versand</h2>
            <p>
                <strong>Vor dem Versand</strong> kann der Kunde seine Bestellung
                jederzeit selbstständig ändern (Artikel hinzufügen, entfernen oder
                Mengen anpassen). Dies erfolgt über die Funktion{" "}
                <strong>"Meine Bestellung verfolgen"</strong>, die auf der
                Startseite verfügbar ist.
            </p>
            <p>
                Änderungen sind möglich, solange sich die Bestellung im Status{" "}
                <strong>"Ausstehend"</strong> oder <strong>"Bestätigt"</strong> befindet.
                Nach dem Versand sind keine Änderungen mehr möglich.
            </p>
            <div className="legal-box">
                <strong>📌 Technischer Hinweis</strong>
                Jede Änderung wird als separate <strong>Bestelländerung</strong>{" "}
                dokumentiert. Die ursprüngliche Bestellung bleibt unverändert und
                dient als Grundlage für die Rechnungsstellung (GoBD-konform).
            </div>

            <h2 id="maengel">11. Mängelrechte</h2>
            <p>
                Es gelten die gesetzlichen Mängelhaftungsrechte. Bei mangelhafter,
                falscher oder beschädigter Ware soll der Kunde {company.brand_name}{" "}
                möglichst zeitnah kontaktieren; dies beschränkt die gesetzlichen
                Rechte nicht.
            </p>

            <h2 id="alter">12. Altersbeschränkte Produkte</h2>
            <p>
                Altersbeschränkte Waren dürfen nur angeboten werden, wenn die
                gesetzlichen Anforderungen an Altersprüfung, Produktdarstellung,
                Bestellung und Übergabe technisch und organisatorisch umgesetzt sind.
                {company.brand_name} kann die Übergabe verweigern, wenn der
                erforderliche Altersnachweis nicht erbracht wird.
            </p>

            <h2 id="streit">13. Streitbeilegung</h2>
            <p>
                {company.participates_in_dispute
                    ? "Wir sind bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
                    : "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."}
            </p>

            <h2 id="sprache">14. Vertragssprache und Speicherung</h2>
            <p>
                Vertragssprache ist Deutsch. Der Kunde muss die Vertragsbestimmungen
                einschließlich der bei Vertragsschluss geltenden AGB abrufen und
                speichern können.
            </p>

            <h2 id="kontakt">15. Kontakt</h2>
            <p>
                <strong>{company.brand_name}</strong>
                <br />
                {company.owner_name}
                <br />
                {company.address}, {company.postal_code} {company.city}
                <br />
                E-Mail:{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
                <br />
                Telefon: {company.contact_phone}
            </p>
        </LegalLayout>
    );
}