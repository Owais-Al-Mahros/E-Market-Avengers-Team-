import "./AdminDashboardProductCard.css";

export default function AdminDashboardProductCard(props) {
  const { onEdit } = props;

  const handleCardClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <div className="card-container-admin" onClick={handleCardClick}>
      <div className="image-container-admin-dashboard">
        <img
          src={props.image}
          alt={props.name || "product"}
          className="image-admin-dashboard"
          loading="lazy"
        />
      </div>

      <div className="title-admin">
        <span>{props.name}</span>
        {props.product_number && (
          <span className="title-product-number">
            NO.{props.product_number}
          </span>
        )}
      </div>

      <div className="weight-admin">
        <span>
          {props.weight} {props.weight_unit}
        </span>
        <div className="price">
          <span>€{Number(props.total_price || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="action-admin">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete?.(props.id, props.name);
          }}
          className="delete-button"
          aria-label={`Delete ${props.name}`}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}