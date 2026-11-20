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
        { id: "konto", title: "5. Bestellungen" },
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
                {company.contact_phone && (
                    <>
                        <br />
                        Telefon: {company.contact_phone}
                    </>
                )}
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
                <strong>Website:</strong> Unsere Website wird über{" "}
                <strong>Vercel Inc.</strong> (USA) ausgeliefert. Beim Aufruf
                verarbeitet Vercel technisch notwendige Verbindungsdaten
                (insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene Seite,
                Browser- und Geräteinformationen), damit die Seite bereitgestellt und
                abgesichert werden kann. Dies kann auch über Server außerhalb der EU
                erfolgen.
            </p>
            <p>
                <strong>Datenbank und Backend:</strong> Datenbank, Dateispeicher (z.B.
                Produktbilder) und Backend-Funktionen betreiben wir bei{" "}
                <strong>Supabase, Inc.</strong> (USA) in der Region{" "}
                <strong>Frankfurt am Main (Deutschland)</strong>. Ihre Bestell- und
                Kundendaten werden dort innerhalb der EU gespeichert.
            </p>
            <p>
                Mit Vercel und Supabase bestehen Verträge zur Auftragsverarbeitung
                gemäß Art. 28 DSGVO. Soweit Daten in die USA übermittelt werden oder
                ein Zugriff von dort möglich ist, stützen wir uns auf Garantien nach
                Art. 46 DSGVO (Standardvertragsklauseln) bzw., soweit der jeweilige
                Anbieter zertifiziert ist, auf den Angemessenheitsbeschluss zum
                EU-US Data Privacy Framework.
            </p>

            <h2 id="konto">5. Bestellungen</h2>
            <p>
                Sie können bei uns <strong>ohne Kundenkonto als Gast</strong>{" "}
                bestellen. Bei einer Bestellung verarbeiten wir die für Vertrag,
                Lieferung und Support erforderlichen Daten (Name, Kontaktdaten,
                Liefer- und Rechnungsadresse, Zugangshinweise und Bestelldetails).
                Pflichtfelder sind auf das notwendige Maß begrenzt. Ein
                Kundenkonto mit Registrierung bieten wir derzeit nicht an;
                Zugangskonten bestehen nur für unsere Mitarbeiter.
            </p>
            <p>
                <strong>Speicherdauer:</strong> Bestelldaten werden gemäß den
                handels- und steuerrechtlichen Aufbewahrungsfristen gespeichert
                (siehe Abschnitt 11).
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
                Um die Lieferkosten zu berechnen und zu prüfen, ob Ihre Adresse in
                unserem Liefergebiet liegt, wandeln wir Ihre Lieferadresse (Straße,
                Hausnummer, Postleitzahl, Ort) in Koordinaten um und berechnen die
                Entfernung zu unserem Lager. Dies geschieht über unseren Server und
                nicht direkt aus Ihrem Browser; Ihre IP-Adresse wird dabei nicht an
                die Kartendienste weitergegeben.
            </p>
            <p>
                Hierfür nutzen wir <strong>Mapbox</strong> (Mapbox, Inc., USA).
                Findet Mapbox eine Adresse nicht, verwenden wir ersatzweise{" "}
                <strong>OpenStreetMap Nominatim</strong> (OpenStreetMap Foundation,
                Vereinigtes Königreich). Weitere Daten wie Name, Telefonnummer oder
                Warenkorb werden an diese Dienste nicht übermittelt. Rechtsgrundlage
                ist Art. 6 Abs. 1 lit. b DSGVO. Für Übermittlungen in die USA stützen
                wir uns auf Standardvertragsklauseln bzw. den Angemessenheitsbeschluss
                zum EU-US Data Privacy Framework, soweit der Anbieter zertifiziert
                ist.
            </p>
            <p>
                Für die Zustellung erhalten die mit der Auslieferung befassten
                Personen die dafür erforderlichen Daten (Name, Lieferadresse,
                Zugangshinweise, Telefonnummer, Bestellinhalt).
            </p>

            <h2 id="email">8. E-Mail und Benachrichtigungen</h2>
            <p>
                <strong>Transaktions-E-Mails:</strong> Bestellbestätigungen,
                Lieferbenachrichtigungen und Bestätigungen zu Widerrufen versenden wir
                über <strong>Resend</strong> (Resend, Inc., USA; Versand über Server
                in der EU). Dabei verarbeitet Resend Empfängeradresse, Betreff und
                Inhalt der Nachricht.
            </p>
            <p>
                <strong>Geschäftliche Kommunikation:</strong> Für unser
                E-Mail-Postfach (z.B. Beantwortung Ihrer Anfragen an{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
                ) nutzen wir <strong>Google Workspace</strong> (Google Ireland
                Limited, Irland, ggf. Google LLC, USA). Wenn Sie uns schreiben,
                werden Ihre Nachricht und Ihre Absenderdaten dort verarbeitet.
            </p>
            <p>
                Mit beiden Anbietern bestehen Verträge zur Auftragsverarbeitung gemäß
                Art. 28 DSGVO. Für Übermittlungen in die USA stützen wir uns auf
                Standardvertragsklauseln bzw. den Angemessenheitsbeschluss zum EU-US
                Data Privacy Framework, soweit der Anbieter zertifiziert ist.
            </p>
            <p>
                Marketing-E-Mails senden wir nur mit Ihrer ausdrücklichen Einwilligung
                (Art. 6 Abs. 1 lit. a DSGVO).
            </p>

            <h2 id="cookies">9. Cookies und lokale Speicherung</h2>
            <p>
                Wir setzen <strong>keine Tracking-, Analyse- oder
                    Marketing-Technologien</strong> ein. Unsere Website speichert
                ausschließlich technisch erforderliche Informationen in Ihrem Browser
                (Local Storage bzw. Session Storage). Das ist nach § 25 Abs. 2 Nr. 2
                TDDDG ohne Einwilligung zulässig; die weitere Verarbeitung erfolgt
                auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Im Einzelnen:
            </p>
            <ul>
                <li>
                    <strong>Warenkorb</strong> (Local Storage): Produkte und Mengen,
                    damit Ihr Warenkorb erhalten bleibt.
                </li>
                <li>
                    <strong>Favoriten</strong> (Local Storage): von Ihnen markierte
                    Produkte.
                </li>
                <li>
                    <strong>Gespeicherte Kontakt- und Lieferdaten</strong> (Local
                    Storage): Angaben, die Sie für künftige Bestellungen im Shop
                    speichern. Sie bleiben auf Ihrem Gerät und werden erst bei einer
                    Bestellung an uns übermittelt.
                </li>
                <li>
                    <strong>Eingaben im Bestellablauf</strong> (Session Storage):
                    werden beim Schließen des Browser-Tabs gelöscht.
                </li>
                <li>
                    <strong>Letzte Bestellung</strong> (Local Storage):
                    Bestellnummer, E-Mail-Adresse und Zeitpunkt, bis zu 30 Tage, zur
                    Bestellverfolgung.
                </li>
                <li>
                    <strong>Einstellung zu Ersatzprodukten</strong> (Local Storage).
                </li>
                <li>
                    <strong>Anmeldesitzung und Anzeigeeinstellungen</strong>{" "}
                    (ausschließlich für Mitarbeiter im Verwaltungsbereich).
                </li>
            </ul>
            <p>
                Auf der Bezahlseite lädt Ihr Browser das Skript{" "}
                <strong>Stripe.js</strong> von Stripe. Stripe kann dabei zur
                Zahlungsabwicklung und Betrugsprävention technisch erforderliche
                Kennungen setzen (siehe Abschnitt 6).
            </p>
            <p>
                Sie können die gespeicherten Daten jederzeit über die Einstellungen
                Ihres Browsers löschen. Sollten wir künftig Analyse- oder
                Marketing-Dienste einsetzen, holen wir vorher Ihre Einwilligung ein.
            </p>

            <h2 id="empfaenger">10. Empfänger und Auftragsverarbeiter</h2>
            <p>
                Ihre Daten können an folgende Empfänger übermittelt werden.
            </p>
            <p>
                <strong>Auftragsverarbeiter</strong> (Art. 28 DSGVO):
            </p>
            <ul>
                <li>Supabase (Datenbank, Dateispeicher & Backend; Region Frankfurt)</li>
                <li>Vercel (Hosting der Website)</li>
                <li>Resend (Versand von Transaktions-E-Mails)</li>
                <li>Google Workspace (geschäftliche E-Mail-Kommunikation)</li>
                <li>Mapbox (Adress- und Entfernungsberechnung für den Versand)</li>
            </ul>
            <p>
                <strong>Weitere Empfänger:</strong>
            </p>
            <ul>
                <li>
                    Stripe (Zahlungsabwicklung; teilweise in eigener Verantwortung,
                    z.B. bei Betrugsprävention)
                </li>
                <li>
                    OpenStreetMap Nominatim (Adressauflösung, nur als Ersatz für
                    Mapbox)
                </li>
                <li>
                    mit der Auslieferung befasste Personen (nur Lieferdaten)
                </li>
                <li>
                    Steuerberater, Behörden und Gerichte, soweit gesetzlich
                    erforderlich
                </li>
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