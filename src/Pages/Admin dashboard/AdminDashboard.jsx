import { useState } from "react";
import "./AdminDashboard.css";
import AdminSideNavbar from "./components/AdminSideNavbar.jsx";
import ProductsSection from "./components/ProductsSection.jsx";


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


      <div className="dashboard-layout">
        <div className="sidebar-wrapper">
          <AdminSideNavbar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;