import { useEffect, useState, useMemo, useCallback } from "react";
import "./OverViewSection.css";
import { useOrders } from "../../../../context/OrdersContext";
import { useProducts } from "../../../../context/ProductContext";
import { getOverviewStats } from "../../../../api/analytics";
import BackButton from "../../../../components/ui/BackButton";

// ══════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════
const formatEuro = (value) =>
  Number(value || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });

const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (["delivered", "paid"].includes(s)) return "status-delivered";
  if (s === "shipped") return "status-shipped";
  if (s === "confirmed") return "status-confirmed";
  if (s === "cancelled") return "status-cancelled";
  return "status-pending";
};

// ══════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════
function StatCard({ icon, value, label, hint, accent }) {
  return (
    <div className={`overview-card ${accent ? `accent-${accent}` : ""}`}>
      <div className="overview-card-top">
        <div className="overview-icon">{icon}</div>
      </div>
      <p className="overview-metric">{value}</p>
      <p className="overview-label">{label}</p>
      {hint && <p className="overview-hint">{hint}</p>}
    </div>
  );
}

function OverviewRow({ children }) {
  return <li className="overview-row">{children}</li>;
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function OverViewSection() {
  const { fetchBestSellers } = useProducts();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();

  const [bestSold, setBestSold] = useState([]);
  const [bestSoldLoading, setBestSoldLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // ══════════════════════════════════════════════════════
  // Load Overview Stats (RPC-based)
  // ══════════════════════════════════════════════════════
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    const result = await getOverviewStats();

    if (result.success) {
      setStats(result.data);
    } else {
      setStatsError(result.error);
    }
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ══════════════════════════════════════════════════════
  // Load Best Sellers
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchBestSellers(10);
        if (!cancelled) setBestSold(data || []);
      } catch (err) {
        console.error("Failed to load best sellers:", err);
      } finally {
        if (!cancelled) setBestSoldLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchBestSellers]);

  // ══════════════════════════════════════════════════════
  // Recent Orders (memoized)
  // ══════════════════════════════════════════════════════
  const recentOrders = useMemo(() => {
    return orders
      .slice(-4)
      .reverse()
      .map((o) => ({
        id: o.id,
        number: o.order_number,
        customer:
          `${o.customer_info?.first_name || ""} ${o.customer_info?.last_name || ""
            }`.trim() || "Unknown",
        total: formatEuro(o.total_price),
        status: o.status || "pending",
      }));
  }, [orders]);

  // ══════════════════════════════════════════════════════
  // Build Cards Config
  // ══════════════════════════════════════════════════════
  const cards = useMemo(() => {
    if (!stats) return [];

    const {
      deliveryRevenue,
      revenueOrderCount,
      pendingOrders,
      inProgressOrders,
      incomingMessages,
      customerCount,      // ← جديد
      totalOrders,
    } = stats;

    return [
      {
        id: "revenue",
        icon: "💰",
        value: formatEuro(deliveryRevenue),
        label: "Revenue This Month",     // ← تغيّر
        hint:
          revenueOrderCount > 0
            ? `from ${revenueOrderCount} delivered ${revenueOrderCount === 1 ? "order" : "orders"
            }`
            : "No delivered orders this month",
        accent: "success",
      },
      {
        id: "pending",
        icon: "⏳",
        value: pendingOrders,
        label: "Pending Orders",
        hint: pendingOrders > 0 ? "Waiting for confirmation" : "All clear",
        accent: pendingOrders > 0 ? "warning" : null,
      },
      {
        id: "in-progress",
        icon: "🚚",
        value: inProgressOrders,
        label: "In Progress",
        hint: inProgressOrders > 0 ? "Confirmed or shipping" : "Nothing active",
        accent: inProgressOrders > 0 ? "info" : null,
      },
      {
        id: "messages",
        icon: "💬",
        value: incomingMessages.total,
        label: "New Messages",
        hint:
          incomingMessages.total > 0
            ? `${incomingMessages.contactMessages} contact · ${incomingMessages.widerrufRequests} returns`
            : "Inbox is empty",
        accent: incomingMessages.total > 0 ? "danger" : null,
      },
      {
        id: "customers",
        icon: "👥",
        value: customerCount,
        label: "Customers",
        hint:
          totalOrders > 0
            ? `From ${totalOrders} total ${totalOrders === 1 ? "order" : "orders"}`
            : "No customers yet",
        accent: null,
      },
    ];
  }, [stats]);

  // ══════════════════════════════════════════════════════
  // Loading / Error States
  // ══════════════════════════════════════════════════════
  if (ordersLoading || statsLoading) {
    return (
      <div className="overview-state">
        <div className="overview-spinner" />
        <p>Loading overview data...</p>
      </div>
    );
  }

  if (ordersError || statsError) {
    return (
      <div className="overview-state overview-state-error">
        <span className="material-symbols-outlined">error</span>
        <p>Error: {ordersError || statsError}</p>
        <button
          type="button"
          className="overview-retry-btn"
          onClick={loadStats}
        >
          Retry
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════
  return (
    <section className="overview-section">
      {/* ═══ Header ═══ */}
      <header className="overview-header">
        <div>
          <h2 className="overview-title">Overview</h2>
          <p className="overview-subtitle">
            Your business at a glance
          </p>
        </div>
        <BackButton label="Back" />
      </header>

      {/* ═══ Stats Cards ═══ */}
      <div className="overview-cards">
        {cards.map((c) => (
          <StatCard
            key={c.id}
            icon={c.icon}
            value={c.value}
            label={c.label}
            hint={c.hint}
            accent={c.accent}
          />
        ))}
      </div>

      {/* ═══ Recent Orders ═══ */}
      <div className="overview-panel">
        <div className="overview-panel-header">
          <h3 className="overview-panel-title">📋 Recent Orders</h3>
        </div>

        {recentOrders.length > 0 ? (
          <ul className="overview-list">
            {recentOrders.map((o) => (
              <OverviewRow key={o.id}>
                <div className="overview-row-left">
                  <div className="overview-info">
                    <p className="overview-order-id">#{o.number}</p>
                    <p className="overview-customer">{o.customer}</p>
                  </div>
                </div>

                <div className="overview-row-right">
                  <span className="overview-total">{o.total}</span>
                  <span
                    className={`overview-status ${getStatusClass(o.status)}`}
                  >
                    {o.status}
                  </span>
                </div>
              </OverviewRow>
            ))}
          </ul>
        ) : (
          <p className="overview-empty">No recent orders found</p>
        )}
      </div>

      {/* ═══ Top Selling Products ═══ */}
      <div className="overview-panel">
        <div className="overview-panel-header">
          <h3 className="overview-panel-title">🔥 Top Selling Products</h3>
        </div>

        {bestSoldLoading ? (
          <p className="overview-empty">Loading top products...</p>
        ) : bestSold.length > 0 ? (
          <ul className="overview-list">
            {bestSold.map((p, i) => (
              <OverviewRow key={p.id}>
                <div className="overview-row-left">
                  <span className="overview-rank">#{i + 1}</span>

                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="overview-thumb"
                    />
                  )}

                  <div className="overview-info">
                    <p className="overview-order-id" title={p.name}>
                      {p.name}
                    </p>
                    <p className="overview-customer">
                      {formatEuro(p.total_price)}
                    </p>
                  </div>
                </div>

                <div className="overview-row-right">
                  <span className="overview-status sales-badge">
                    {p.total_sold || 0} sold
                  </span>
                </div>
              </OverviewRow>
            ))}
          </ul>
        ) : (
          <p className="overview-empty">No sales data available</p>
        )}
      </div>
    </section>
  );
}