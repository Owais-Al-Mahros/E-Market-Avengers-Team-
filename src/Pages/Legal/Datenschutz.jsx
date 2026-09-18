import LegalLayout from "./LegalLayout";
import { useCompany } from "../../context/CompanyContext";

export default function Datenschutz() {
    const { company, loading } = useCompany();
    if (loading || !company) return <div>Loading...</div>;

    const sections = [
        { id: "verantwortlicher", title: "1. Verantwortlicher" },
        { id: "daten", title: "2. Verarbeitete Daten" },
        { id: "zwecke", title: "3. Zwecke & Rechtsgrundlagen" },
        { id: "hosting", title: "4. Hosting" },
        { id: "konto", title: "5. Kundenkonto & Bestellungen" },
        { id: "zahlung", title: "6. Zahlungsabwicklung" },
        { id: "lieferung", title: "7. Lieferung & Routing" },
        { id: "email", title: "8. E-Mail" },
        { id: "cookies", title: "9. Cookies" },
        { id: "empfaenger", title: "10. Empfänger" },
        { id: "speicherdauer", title: "11. Speicherdauer" },
        { id: "rechte", title: "12. Ihre Rechte" },
        { id: "sicherheit", title: "13. Sicherheit" },
        { id: "aktualisierung", title: "14. Aktualisierung" },
    ];

    return (
        <LegalLayout
            title="Datenschutzerklärung"
            subtitle="Informationen zur Verarbeitung Ihrer personenbezogenen Daten nach DSGVO"
            sections={sections}
        >
            <h2 id="verantwortlicher">1. Verantwortlicher</h2>
            <p>
                Verantwortlicher für die Verarbeitung personenbezogener Daten im
                Sinne der DSGVO ist:
            </p>
            <p>
                <strong>{company.brand_name}</strong>
                <br />
                {company.owner_name}
                <br />
                {company.address}
                <br />
                {company.postal_code} {company.city}
                <br />
                E-Mail:{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
                <br />
                Telefon: {company.contact_phone}
            </p>

            <h2 id="daten">2. Welche Daten wir verarbeiten</h2>
            <p>Je nach Nutzung verarbeiten wir insbesondere:</p>
            <ul>
                <li>Stammdaten (Name)</li>
                <li>Kontaktdaten (E-Mail, Telefon)</li>
                <li>Liefer- und Rechnungsadresse</li>
                <li>Zugangshinweise zur Lieferung (Etage, Klingelname)</li>
                <li>Bestell- und Warenkorbdaten</li>
                <li>Zahlungsstatus (nicht Kartendaten)</li>
                <li>Liefertermin</li>
                <li>Kommunikationsdaten</li>
                <li>Technische Protokolldaten (IP-Adresse)</li>
            </ul>

            <h2 id="zwecke">3. Zwecke und Rechtsgrundlagen</h2>
            <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken:</p>
            <ul>
                <li>
                    <strong>Vertragsanbahnung und -durchführung</strong> (Art. 6 Abs.
                    1 lit. b DSGVO)
                </li>
                <li>
                    <strong>Zahlungsabwicklung</strong> (Art. 6 Abs. 1 lit. b DSGVO)
                </li>
                <li>
                    <strong>Lieferung</strong> (Art. 6 Abs. 1 lit. b DSGVO)
                </li>
                <li>
                    <strong>Kundenkommunikation</strong> (Art. 6 Abs. 1 lit. b DSGVO)
                </li>
                <li>
                    <strong>Erfüllung gesetzlicher Pflichten</strong> (Art. 6 Abs. 1
                    lit. c DSGVO)
                </li>
                <li>
                    <strong>IT-Sicherheit</strong> (Art. 6 Abs. 1 lit. f DSGVO)
                </li>
            </ul>

            <h2 id="hosting">4. Hosting und technische Bereitstellung</h2>
            <p>
                Unsere Website wird auf Servern von <strong>Vercel Inc.</strong>{" "}
                gehostet. Die Datenbank und Backend-Dienste werden von{" "}
                <strong>Supabase Inc.</strong> bereitgestellt. Mit beiden Anbietern
                bestehen Verträge zur Auftragsverarbeitung gemäß Art. 28 DSGVO.
            </p>
            <p>
                Die Serverstandorte befinden sich innerhalb der EU. Bei einer
                Übermittlung in Drittländer (z.B. USA) stützen wir uns auf
                Standardvertragsklauseln der EU-Kommission.
            </p>

            <h2 id="konto">5. Kundenkonto und Bestellungen</h2>
            <p>
                Bei Registrierung und Bestellung verarbeiten wir die für Konto,
                Vertrag, Lieferung und Support erforderlichen Daten. Pflichtfelder
                sind auf das notwendige Maß begrenzt.
            </p>
            <p>
                <strong>Speicherdauer:</strong> Bestelldaten werden gemäß den
                handels- und steuerrechtlichen Aufbewahrungsfristen (in der Regel 10
                Jahre) gespeichert.
            </p>

            <h2 id="zahlung">6. Zahlungsabwicklung</h2>
            <p>
                Zur Zahlungsabwicklung nutzen wir{" "}
                <strong>Stripe Payments Europe, Ltd.</strong> (Irland). Bei Zahlung
                per Kreditkarte werden die Zahlungsdaten direkt an Stripe
                übermittelt. Wir speichern keine vollständigen Kartendaten.
            </p>
            <p>
                Weitere Informationen:{" "}
                <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    stripe.com/privacy
                </a>
            </p>

            <h2 id="lieferung">7. Lieferung, Karten und Routing</h2>
            <p>
                Zur Berechnung von Lieferkosten und Routen nutzen wir
                Geocoding-Dienste (OpenStreetMap Nominatim). Die Lieferadresse wird
                hierfür in Koordinaten umgewandelt.
            </p>

            <h2 id="email">8. E-Mail und Benachrichtigungen</h2>
            <p>
                Für den Versand von Bestellbestätigungen und
                Lieferbenachrichtigungen nutzen wir <strong>Resend</strong> (Resend,
                Inc., USA). Die Übermittlung erfolgt auf Basis von
                Standardvertragsklauseln.
            </p>
            <p>
                Marketing-E-Mails senden wir nur mit Ihrer ausdrücklichen Einwilligung
                (Art. 6 Abs. 1 lit. a DSGVO).
            </p>

            <h2 id="cookies">9. Cookies und lokale Speicherung</h2>
            <p>
                Wir setzen technisch notwendige Cookies und lokale Speicherung ein
                (z.B. Warenkorb, Login-Session). Diese sind für den Betrieb der
                Website erforderlich (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
            <p>
                Analyse- oder Marketing-Cookies setzen wir nur nach Ihrer
                ausdrücklichen Einwilligung.
            </p>

            <h2 id="empfaenger">10. Empfänger und Auftragsverarbeiter</h2>
            <p>Ihre Daten können an folgende Empfänger übermittelt werden:</p>
            <ul>
                <li>Supabase (Datenbank & Backend)</li>
                <li>Vercel (Hosting)</li>
                <li>Stripe (Zahlungsabwicklung)</li>
                <li>Resend (E-Mail-Versand)</li>
                <li>OpenStreetMap / Nominatim (Geocoding)</li>
            </ul>

            <h2 id="speicherdauer">11. Speicherdauer</h2>
            <p>
                Wir speichern personenbezogene Daten nur so lange, wie es für den
                jeweiligen Zweck erforderlich ist oder gesetzliche
                Aufbewahrungspflichten bestehen:
            </p>
            <ul>
                <li>Bestelldaten: 10 Jahre (steuerrechtlich)</li>
                <li>Kontodaten: bis zur Löschung des Kontos</li>
                <li>Technische Logs: 30 Tage</li>
                <li>Widerrufsdaten: 3 Jahre (Nachweis)</li>
            </ul>

            <h2 id="rechte">12. Ihre Rechte</h2>
            <p>Sie haben nach DSGVO folgende Rechte:</p>
            <ul>
                <li>
                    <strong>Auskunft</strong> (Art. 15 DSGVO)
                </li>
                <li>
                    <strong>Berichtigung</strong> (Art. 16 DSGVO)
                </li>
                <li>
                    <strong>Löschung</strong> (Art. 17 DSGVO)
                </li>
                <li>
                    <strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)
                </li>
                <li>
                    <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)
                </li>
                <li>
                    <strong>Widerspruch</strong> (Art. 21 DSGVO)
                </li>
                <li>
                    <strong>Widerruf von Einwilligungen</strong> (Art. 7 Abs. 3 DSGVO)
                </li>
                <li>
                    <strong>Beschwerde bei der Aufsichtsbehörde</strong> (Art. 77 DSGVO)
                </li>
            </ul>
            <p>
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
            </p>

            <h2 id="sicherheit">13. Sicherheit</h2>
            <p>
                Wir setzen angemessene technische und organisatorische Maßnahmen zum
                Schutz Ihrer Daten ein:
            </p>
            <ul>
                <li>Transportverschlüsselung (HTTPS/TLS)</li>
                <li>Rollenbasierte Zugriffe</li>
                <li>Sichere Authentifizierung</li>
                <li>Protokollierung sicherheitsrelevanter Ereignisse</li>
                <li>Regelmäßige Backups</li>
            </ul>

            <h2 id="aktualisierung">14. Aktualisierung</h2>
            <p>
                Diese Datenschutzerklärung wird bei wesentlichen Änderungen des Shops,
                neuer Dienstleister oder neuer Datenverarbeitungen überprüft und
                aktualisiert. Die jeweils aktuelle Fassung finden Sie stets auf dieser
                Seite.
            </p>
        </LegalLayout>
    );
}