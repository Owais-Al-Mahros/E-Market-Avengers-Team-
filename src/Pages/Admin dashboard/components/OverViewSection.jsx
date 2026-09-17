import { useEffect, useState } from "react";
import "./OverViewSection.css";
import { useOrders } from "../../../context/OrdersContext";
import BackButton from "../../../Components/BackButton";
import { useProducts } from "../../../context/ProductContext";
import BestSellers from "./BestSellers";

export default function OverViewSection() {
  const { fetchBestSellers } = useProducts();
  const [bestSold, setBestSold] = useState([]);
  const [bestSoldLoading, setBestSoldLoading] = useState(true);

  useEffect(() => {
    const loadBestSold = async () => {
      const data = await fetchBestSellers(5);
      setBestSold(data || []);
      setBestSoldLoading(false);
    };
    loadBestSold();
  }, [fetchBestSellers]);

  const { orders, loading, error } = useOrders();

  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.total_price || 0);
  }, 0);

  const total_orders = orders.length;

  const shipped_orders = orders.filter((o) => o.status === "shipped").length;
  const delivered_orders = orders.filter(
    (o) => o.status === "delivered",
  ).length;

  const stats = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: "💰",
    },
    {
      title: "Orders",
      value: total_orders,
      icon: "🛒",
    },
    {
      title: "shipped orders",
      value: shipped_orders,
      icon: "📦",
    },
    {
      title: "delivered orders",
      value: delivered_orders,
      icon: "🚚",
    },
  ];

  const recentOrders = orders
    .slice(-4)
    .reverse()
    .map((order) => ({
      id: `#${order.id}`,
      customer:
        order.customer_info?.first_name +
          " " +
          order.customer_info?.last_name || "Unknown",
      total: `$${Number(order.total_price || 0).toFixed(2)}`,
      status: order.status || "Pending",
    }));

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading overview data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#b91c1c" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <section className="overview-section">
      <div className="overview-header">
        <div>
          <h2 className="overview-title">Overview</h2>
          <p className="overview-subtitle">
            Your sales summary for the last 30 days
          </p>
        </div>
        <BackButton label={"Back"} />
      </div>

      <div className="overview-cards">
        {stats.map((stat) => (
          <div key={stat.title} className="overview-card">
            <div className="overview-card-top">
              <div className="overview-icon">{stat.icon}</div>
            </div>
            <p className="overview-metric">{stat.value}</p>
            <p className="overview-label">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="overview-panel">
        <div className="overview-panel-header">
          <h3 className="overview-panel-title">Recent Orders</h3>
        </div>

        <ul className="overview-list">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <li key={order.id} className="overview-row">
                <div>
                  <p className="overview-order-id">{order.id}</p>
                  <p className="overview-customer">{order.customer}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="overview-total">{order.total}</div>
                  <span
                    className="overview-status"
                    style={{
                      background:
                        order.status.toLowerCase() === "delivered" ||
                        order.status.toLowerCase() === "paid"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        order.status.toLowerCase() === "delivered" ||
                        order.status.toLowerCase() === "paid"
                          ? "#166534"
                          : "#b91c1c",
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <p>No recent orders found</p>
          )}
        </ul>
      </div>
      <BestSellers />
    </section>
  );
}
