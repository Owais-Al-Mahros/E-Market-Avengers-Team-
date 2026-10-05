import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../../lib/supabase.js";
import "./AdminSideNavbar.css";

// ══════════════════════════════════════════════════════════
// Menu Config
// ══════════════════════════════════════════════════════════
const BASE_MENU = [
  { icon: "dashboard", label: "Overview", section: "overview" },
  { icon: "inventory_2", label: "Product Management", section: "products" },
  { icon: "shopping_cart", label: "Order Management", section: "orders" },
  { icon: "local_shipping", label: "Shipping Settings", section: "shipping" },
  { icon: "mail", label: "Messages", section: "messages" },
  { icon: "quiz", label: "FAQ", section: "faq" },
  { icon: "star", label: "Featured Products", section: "featured" },
];

const ADMIN_MENU_ITEM = {
  icon: "admin_panel_settings",
  label: "Admin Management",
  section: "admins",
};

const TAIL_MENU = [
  {
    icon: "home",
    label: "Go to Home Page",
    section: "home",
    isLink: true,
    href: "/",
  },
];

const DEFAULT_ADMIN = {
  name: "",
  email: "",
  image: "",
  is_super_admin: false,
};

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function AdminSideNavbar({ activeSection, onSectionChange }) {
  const [adminData, setAdminData] = useState(DEFAULT_ADMIN);

  // ===== Fetch Admin Profile =====
  useEffect(() => {
    let cancelled = false;

    const fetchAdminData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("name, email, image, is_super_admin")
          .eq("id", user.id)
          .single();

        if (!error && profile && !cancelled) {
          setAdminData({
            name: profile.name || "Admin",
            email: profile.email || "",
            image: profile.image || "",
            is_super_admin: profile.is_super_admin === true,
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      }
    };

    fetchAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===== Menu Items (memoized) =====
  const menuItems = useMemo(() => {
    const items = [...BASE_MENU];

    if (adminData.is_super_admin) {
      items.push(ADMIN_MENU_ITEM);
    }

    return [...items, ...TAIL_MENU];
  }, [adminData.is_super_admin]);

  // ===== Render =====
  return (
    <nav className="sidebar" aria-label="Admin navigation">
      {/* ═══ Profile ═══ */}
      <div className="logo-container">
        <div className="logo-icon">
          {adminData.image ? (
            <img
              src={adminData.image}
              alt="Admin avatar"
              className="admin-avatar"
            />
          ) : (
            <span className="material-symbols-outlined">local_florist</span>
          )}
        </div>
        <div>
          <h1>{adminData.name || "Admin"}</h1>
          <p>
            {adminData.email || "E-commerce Solutions"}
            {adminData.is_super_admin && " ⭐"}
          </p>
        </div>
      </div>

      {/* ═══ Menu ═══ */}
      <ul className="menu-list">
        {menuItems.map((item) => {
          const isActive = activeSection === item.section;

          if (item.isLink) {
            return (
              <li key={item.section}>
                <Link
                  to={item.href || "/"}
                  className="menu-item"
                  aria-label={item.label}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.section}>
              <button
                type="button"
                className={`menu-item ${isActive ? "active" : ""}`}
                onClick={() => onSectionChange(item.section)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}