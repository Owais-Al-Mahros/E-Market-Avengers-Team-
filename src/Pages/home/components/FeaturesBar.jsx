import "./FeaturesBar.css";

const FEATURES = [
  {
    id: 1,
    icon: "🏠",
    title: "Bis an deine Haustür",
    description: "Dein Einkauf bequem nach Hause geliefert.",
  },
  {
    id: 2,
    icon: "🥗",
    title: "Große Auswahl",
    description: "Lebensmittel & mehr aus deinem Supermarkt.",
  },
  {
    id: 3,
    icon: "✅",
    title: "Frische & Qualität",
    description: "Sorgfältig ausgewählt und sicher geliefert.",
  },
  {
    id: 4,
    icon: "🚚",
    title: "Flexible Lieferzeiten",
    description: "Wähle deinen bequemen Zeitraum.",
  },
  {
    id: 5,
    icon: "💳",
    title: "Transparente Preise",
    description: "Keine versteckten Kosten – alles im Blick.",
  },
];

export default function FeaturesBar() {
  return (
    <section className="features-container">
      {FEATURES.map((feature) => (
        <div key={feature.id} className="feature-item">
          <div className="icon-wrapper">
            <span className="feature-icon" role="img" aria-label={feature.title}>
              {feature.icon}
            </span>
          </div>
          <div className="feature-info">
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}