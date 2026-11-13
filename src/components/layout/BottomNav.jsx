import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import "./BottomNav.css";

const navClass = ({ isActive }) => `bn-item${isActive ? " active" : ""}`;

function Pill({ icon, badge }) {
  return (
    <span className="bn-pill">
      <span className="material-symbols-outlined bn-icon" aria-hidden="true">
        {icon}
      </span>
      {badge > 0 && <span className="bn-badge">{badge > 99 ? "99+" : badge}</span>}
    </span>
  );
}

/* ============================================
   نافذة الفئات (Bottom sheet)
   صفحة /DisplayProducts لا تعرض الفئات في أعلاها (قائمتها أسفل الصفحة)،
   فالنافذة هي الطريقة الصحيحة للوصول لها بإبهام واحدة.
   ============================================ */
function CategorySheet({ onClose }) {
  const { categories, loading } = useCategories();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("bn-lock"); // يمنع تمرير الصفحة خلف النافذة
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("bn-lock");
    };
  }, [onClose]);

  const pick = (id) => {
    onClose();
    navigate(`/DisplayProducts?categoryId=${id}`);
  };

  return (
    <div className="bn-sheet-root">
      <div className="bn-sheet-backdrop" onClick={onClose} />

      <div className="bn-sheet" role="dialog" aria-modal="true" aria-label="Kategorien">
        <div className="bn-sheet-handle" aria-hidden="true" />

        <div className="bn-sheet-head">
          <h2>Kategorien</h2>
          <button
            type="button"
            className="bn-sheet-close"
            onClick={onClose}
            aria-label="Schließen"
            autoFocus
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="bn-sheet-state">Kategorien werden geladen...</p>
        ) : (
          <div className="bn-sheet-grid">
            {categories.map((cat) => (
              <button key={cat.id} type="button" className="bn-cat" onClick={() => pick(cat.id)}>
                <span className="bn-cat-media">
                  {cat.image && (
                    <img src={cat.image} alt="" loading="lazy" decoding="async" />
                  )}
                </span>
                <span className="bn-cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   BottomNav — يظهر على الجوال فقط (≤ 768px)
   ============================================ */
export default function BottomNav({ cartCount = 0, favCount = 0, onOpenCart }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <>
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <NavLink to="/" end className={navClass}>
          <Pill icon="home" />
          <span className="bn-label">Start</span>
        </NavLink>

        <button
          type="button"
          className={`bn-item${sheetOpen ? " active" : ""}`}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <Pill icon="grid_view" />
          <span className="bn-label">Kategorien</span>
        </button>

        <button type="button" className="bn-item bn-item--cart" onClick={onOpenCart}>
          <Pill icon="shopping_cart" badge={cartCount} />
          <span className="bn-label">Warenkorb</span>
        </button>

        <NavLink to="/favorites" className={navClass}>
          <Pill icon="favorite" badge={favCount} />
          <span className="bn-label">Favoriten</span>
        </NavLink>

        <NavLink to="/my-info" className={navClass}>
          <Pill icon="person" />
          <span className="bn-label">Konto</span>
        </NavLink>
      </nav>

      {sheetOpen && <CategorySheet onClose={closeSheet} />}
    </>
  );
}
