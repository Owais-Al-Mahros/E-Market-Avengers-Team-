import { useState } from "react";
import "./AdminDashboard.css";
import AdminSideNavbar from "./components/AdminSideNavbar.jsx";
import ProductsSection from "./components/ProductsSection.jsx";
import { Toaster } from "react-hot-toast";
function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("products");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <div>Overview Section (coming soon)</div>;
      case "products":
        return <ProductsSection />;
      case "orders":
        return <div>Orders Section (coming soon)</div>;
      case "shipping":
        return <div>Shipping Section (coming soon)</div>;
      case "admins":
        return <div>Admins Section (coming soon)</div>;
      case "analytics":
        return <div>Analytics Section (coming soon)</div>;
      default:
        return <ProductsSection />;
    }
  };

  return (
    <div className="dashboard-container">
      <Toaster
        position="top-center"
        toastOptions={{
          // التنسيق الافتراضي لجميع التنبيهات
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "10px",
          },
          // تخصيص لون الإشعارات الناجحة فقط
          success: {
            style: {
              background: "#065f46",
              color: "#a7f3d0",
            },
          },
          // تخصيص لون إشعارات الخطأ فقط
          error: {
            style: {
              background: "#991b1b",
              color: "#fecaca",
            },
          },
        }}
      />

      <div className="dashboard-layout">
        <div className="sidebar-wrapper">
          <AdminSideNavbar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
        <div className="content-wrapper">{renderContent()}</div>
      </div>
    </div>
  );
}

export default AdminDashboard;
