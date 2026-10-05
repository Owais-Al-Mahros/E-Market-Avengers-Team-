import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMyInfo } from "../../context/MyInfoContext";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import FormField from "../../components/ui/FormField";
import "./MyInfo.css";

// ============================================================
// Field Configurations
// ============================================================
const PERSONAL_FIELDS = [
  { label: "First Name", name: "firstName", sanitize: "name" },
  { label: "Last Name", name: "lastName", sanitize: "name" },
  { label: "Phone", name: "phone", type: "tel", sanitize: "phone" },
  { label: "Email", name: "email", type: "email" },
];

const ADDRESS_FIELDS = [
  { label: "Street", name: "street", sanitize: "name" },
  { label: "House Number", name: "houseNumber", sanitize: "house" },
  { label: "Postal Code", name: "postalCode", sanitize: "postal" },
  { label: "City", name: "city", sanitize: "name" },
];

const ACCESS_FIELDS = [
  { label: "Floor", name: "floor", type: "number", sanitize: "floor", min: 0 },
  { label: "Apartment (optional)", name: "apartment", sanitize: "apartment" },
  { label: "Doorbell Name", name: "doorbellName", sanitize: "name" },
];

const ALL_FIELDS = [...PERSONAL_FIELDS, ...ADDRESS_FIELDS, ...ACCESS_FIELDS];

// ============================================================
// Sanitizers
// ============================================================
const sanitize = (type, value) => {
  switch (type) {
    case "name":
      return value.replace(/[^a-zA-Z\u0600-\u06FF\s\-'.]/g, "");
    case "phone":
      return value.replace(/[^\d+\-\s()]/g, "");
    case "postal":
      return value.replace(/\D/g, "").slice(0, 5);
    case "house":
      return value.replace(/[^\d\w\-\/]/g, "").slice(0, 6);
    case "floor":
      return value.replace(/\D/g, "").slice(0, 2);   // ✅ أرقام فقط — لا سالب
    case "apartment":
      return value.replace(/[^\d\w\-]/g, "").slice(0, 6);
    default:
      return value;
  }
};

const hasAnyValue = (info) =>
  Object.entries(info || {}).some(([key, value]) => {
    if (key === "hasElevator") return value === "yes";
    return value && value !== "";
  });

// ============================================================
// Component
// ============================================================
export default function MyInfo() {
  const navigate = useNavigate();
  const { info, setInfo } = useMyInfo();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(info);

  const handleEdit = () => {
    setDraft({ ...info });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = ALL_FIELDS.find((f) => f.name === name);
    const clean = field?.sanitize ? sanitize(field.sanitize, value) : value;
    setDraft((prev) => ({ ...prev, [name]: clean }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setInfo(draft);
    setIsEditing(false);
    toast.success("Saved! We'll use this info on your next order.", {
      icon: "✨",
    });
  };

  const handleCancel = () => {
    setDraft({ ...info });
    setIsEditing(false);
  };

  const isFilled = hasAnyValue(info);
  const disabled = !isEditing;

  return (
    <>
      <Header />

      <div className="myinfo-back">
        <button
          type="button"
          className="myinfo-back-btn"
          onClick={() => navigate("/")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Go Home
        </button>
      </div>

      <div className="myinfo-page">
        <form className="profile-card" onSubmit={handleSave}>
          <h2>My Info</h2>
          <p className="profile-subtitle">
            Save your details once — we'll fill them in automatically at
            checkout.
          </p>

          {/* ===== Personal ===== */}
          <section className="profile-section">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">person</span>
              Personal Information
            </h3>
            <div className="info-grid">
              {PERSONAL_FIELDS.map((f) => (
                <FormField
                  key={f.name}
                  {...f}
                  value={draft[f.name] || ""}
                  onChange={handleChange}
                  disabled={disabled}
                />
              ))}
            </div>
          </section>

          {/* ===== Address ===== */}
          <section className="profile-section">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">location_on</span>
              Delivery Address
            </h3>
            <div className="info-grid">
              {ADDRESS_FIELDS.map((f) => (
                <FormField
                  key={f.name}
                  {...f}
                  value={draft[f.name] || ""}
                  onChange={handleChange}
                  disabled={disabled}
                />
              ))}
            </div>
          </section>

          {/* ===== Access ===== */}
          <section className="profile-section">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">apartment</span>
              Access Details
            </h3>
            <div className="info-grid">
              {ACCESS_FIELDS.map((f) => (
                <FormField
                  key={f.name}
                  {...f}
                  value={draft[f.name] || ""}
                  onChange={handleChange}
                  disabled={disabled}
                />
              ))}

              <div className="form-group">
                <label htmlFor="hasElevator">Elevator</label>
                <select
                  id="hasElevator"
                  name="hasElevator"
                  value={draft.hasElevator || "no"}
                  onChange={handleChange}
                  disabled={disabled}
                >
                  <option value="no">No Elevator</option>
                  <option value="yes">With Elevator</option>
                </select>
              </div>
            </div>
          </section>

          {/* ===== Actions ===== */}
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </>
            ) : (
              <button
                type="button"
                className="edit-btn"
                onClick={handleEdit}
              >
                <span className="material-symbols-outlined">
                  {isFilled ? "edit" : "add"}
                </span>
                {isFilled ? "Edit My Info" : "Fill My Info"}
              </button>
            )}
          </div>
        </form>
      </div>

      <Subscribe />
      <Footer />
    </>
  );
}