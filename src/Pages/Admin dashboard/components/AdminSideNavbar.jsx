import "./AdminSideNavbar.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase.js"; // ✅ استيراد supabase

export default function AdminSideNavbar({ activeSection, onSectionChange }) {
  const menuItems = [
    { icon: "dashboard", label: "Overview", section: "overview" },
    { icon: "inventory_2", label: "Product Management", section: "products" },
    { icon: "shopping_cart", label: "Order Management", section: "orders" },
    { icon: "local_shipping", label: "Shipping Settings", section: "shipping" },
    {
      icon: "admin_panel_settings",
      label: "Admin Management",
      section: "admins",
    },
    { icon: "analytics", label: "Analytics", section: "analytics" },
    { icon: "home", label: "Go to Home Page", section: "home", isLink: true },
  ];

  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    image: "",
  });
  const [loadingAdmin, setLoadingAdmin] = useState(true); // ✅ تعريف المتغير المفقود

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("name, email, image")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          setAdminData({
            name: profile.name || "Admin",
            email: profile.email || "",
            image: profile.image || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoadingAdmin(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <nav className="sidebar">
      {/* ✅ الشعار مع صورة الأدمن واسمه وبريده */}
      <div className="logo-container">
        <div className="logo-icon">
          {adminData.image ? (
            <img src={adminData.image} alt="Admin" className="admin-avatar" />
          ) : (
            <span className="material-symbols-outlined fill">
              local_florist
            </span>
          )}
        </div>
        <div>
          <h1>{adminData.name || "GreenCart Admin"}</h1>
          <p>{adminData.email || "E-commerce Solutions"}</p>
        </div>
      </div>

      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.section}>
            {item.isLink ? (
              <Link
                to="/"
                className={`menu-item ${activeSection === item.section ? "active" : ""}`}
                onClick={(e) => {
                  if (activeSection === item.section) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ) : (
              <a
                href="#"
                className={`menu-item ${activeSection === item.section ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange(item.section);
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
