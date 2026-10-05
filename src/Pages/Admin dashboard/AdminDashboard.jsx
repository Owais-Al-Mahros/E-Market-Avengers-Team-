import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AdminSideNavbar from "./components/layout/AdminSideNavbar";
import ProductsSection from "./components/products/ProductsSection";
import OrderManagementSection from "./components/orders/OrderManagementSection";
import ShippingSection from "./components/Shipping/ShippingSection";
import OverViewSection from "./components/overview/OverViewSection";
import AdminManagement from "./components/admin-management/AdminManagement";
import MessagesSection from "./components/messages/MessagesSection";
import FeaturedSection from "./components/featured/FeaturedSection";
import FaqSection from "./components/faq/FaqSection"
import "./AdminDashboard.css";

const SECTIONS = {
  overview: OverViewSection,
  products: ProductsSection,
  orders: OrderManagementSection,
  shipping: ShippingSection,
  messages: MessagesSection,
  faq: FaqSection,
  featured: FeaturedSection,
  admins: AdminManagement,
};

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("products");

  const ActiveComponent = SECTIONS[activeSection] || ProductsSection;

  return (
    <div className="dashboard-container">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "10px",
          },
          success: {
            style: { background: "#065f46", color: "#a7f3d0" },
          },
          error: {
            style: { background: "#991b1b", color: "#fecaca" },
          },
        }}
      />

      <AdminSideNavbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="dashboard-content">
        {activeSection === "analytics" ? (
          <div className="dashboard-placeholder">
            Analytics Section (coming soon)
          </div>
        ) : (
          <ActiveComponent />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;