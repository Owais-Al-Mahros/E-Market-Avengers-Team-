import LegalLayout from "./LegalLayout";
import { useCompany } from "../../context/CompanyContext";

export default function Impressum() {
    const { company, loading } = useCompany();

    if (loading || !company) {
        return <div className="legal-loading">Loading...</div>;
    }

    const sections = [
        { id: "anbieter", title: "Angaben gemäß § 5 DDG" },
        { id: "kontakt", title: "Kontakt" },
        { id: "register", title: "Registereintrag" },
        { id: "ust", title: "Umsatzsteuer-ID" },
        { id: "verantwortlich", title: "Verantwortlich für den Inhalt" },
        { id: "streit", title: "Verbraucherstreitbeilegung" },
    ];

    return (
        <LegalLayout
            title="Impressum"
            subtitle="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)"
            sections={sections}
        >
            <h2 id="anbieter">Angaben gemäß § 5 DDG</h2>
            <p>
                <strong>{company.brand_name}</strong>
                <br />
                Inhaber: {company.owner_name}
                <br />
                Rechtsform: {company.legal_form}
                <br />
                {company.address}
                <br />
                {company.postal_code} {company.city}
                <br />
                {company.country}
            </p>

            <h2 id="kontakt">Kontakt</h2>
            <p>
                Telefon:{" "}
                <a href={`tel:${company.contact_phone}`}>
                    {company.contact_phone}
                </a>
                <br />
                E-Mail:{" "}
                <a href={`mailto:${company.contact_email}`}>
                    {company.contact_email}
                </a>
                <br />
                Website:{" "}
                <a href={`https://${company.website_url}`}>
                    {company.website_url}
                </a>
            </p>

            {company.register_number && (
                <>
                    <h2 id="register">Registereintrag</h2>
                    <p>Handelsregister: {company.register_number}</p>
                </>
            )}

            {company.vat_id && (
                <>
                    <h2 id="ust">Umsatzsteuer-Identifikationsnummer</h2>
                    <p>
                        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
                        <br />
                        <strong>{company.vat_id}</strong>
                    </p>
                </>
            )}

            <h2 id="verantwortlich">Verantwortlich für den Inhalt</h2>
            <p>
                {company.owner_name}
                <br />
                {company.address}, {company.postal_code} {company.city}
            </p>

            <h2 id="streit">Verbraucherstreitbeilegung</h2>
            <p>
                {company.participates_in_dispute ? (
                    <>
                        Wir sind bereit, an Streitbeilegungsverfahren vor einer
                        Verbraucherschlichtungsstelle teilzunehmen.
                    </>
                ) : (
                    <>
                        Wir sind <strong>nicht bereit</strong> und{" "}
                        <strong>nicht verpflichtet</strong>, an
                        Streitbeilegungsverfahren vor einer
                        Verbraucherschlichtungsstelle teilzunehmen.
                    </>
                )}
            </p>

            <div className="legal-box">
                <strong>📌 Hinweis</strong>
                Diese Seite erfüllt die gesetzlichen Anforderungen gemäß § 5 DDG
                (früher § 5 TMG).
            </div>
        </LegalLayout>
    );
}