import "./FeaturesBar.css";

function FeaturesBar() {
  const features = [
    {
      id: 1,
      icon: "eco",
      title: "Farm Fresh",
      description: "Straight from the farm",
    },
    {
      id: 2,
      icon: "local_shipping",
      title: "Free Delivery",
      description: "On orders over $50",
    },
    {
      id: 3,
      icon: "verified",
      title: "Best Quality",
      description: "100% fresh & organic",
    },
    {
      id: 4,
      icon: "sync",
      title: "Easy Returns",
      description: "Hassle free returns",
    },
    {
      id: 5,
      icon: "headset_mic",
      title: "24/7 Support",
      description: "We're here to help",
    },
  ];

  return (
    <section className="features-container">
      {features.map((feature) => (
        <div key={feature.id} className="feature-item">
          <div className="icon-wrapper">
            <span className="material-symbols-outlined">{feature.icon}</span>
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

export default FeaturesBar;