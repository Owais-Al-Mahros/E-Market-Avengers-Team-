import { useState } from "react";
import { useMyInfo } from "../../../context/MyInfoContext";
import HomePageHeader from "../components/HomePageHeader";
import Footer from "../../../Components/Footer";
import Subscribe from "../../../Components/Subscribe";
import BackButton from "../../../Components/BackButton";
import "./MyInfo.css";

export default function MyInfo() {
  const { info, setInfo } = useMyInfo();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [draftInfo, setDraftInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    address: {},
  });

  const handleOpenModal = () => {
    setDraftInfo({
      firstName: info?.firstName || "",
      lastName: info?.lastName || "",
      phone: info?.phone || "",
      email: info?.email || "",
      age: info?.age || "",
      address: {
        country: info?.address?.country || "",
        governorate: info?.address?.governorate || "",
        region: info?.address?.region || "",
      },
    });
    setIsModalOpen(true);
  };

  const handleDraftFieldChange = (e) => {
    const { name, value } = e.target;
    setDraftInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAddressInfo = (e) => {
    const { name, value } = e.target;
    setDraftInfo((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setInfo(draftInfo);
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <HomePageHeader />
      <BackButton label={"Back"} />
      <div className="container">
        <div className="profile-card">
          <h2>My Info</h2>
          <div className="info-grid">
            <p>
              <strong>First Name:</strong> {info?.firstName || "Unknown"}
            </p>
            <p>
              <strong>Last Name:</strong> {info?.lastName || "Unknown"}
            </p>
            <p>
              <strong>Phone: </strong> <span>{info?.phone || "Unknown"}</span>
            </p>
            <p>
              <strong>Email: </strong> {info?.email || "Unknown"}
            </p>
            <p>
              <strong>Age:</strong> {info?.age || "Unknown"}
            </p>
            <p>
              <strong>Country: </strong> {info?.address?.country || "Unknown"}
            </p>
            <p>
              <strong>Governorate: </strong>{" "}
              {info?.address?.governorate || "Unknown"}
            </p>
            <p>
              <strong>Region: </strong> {info?.address?.region || "Unknown"}
            </p>
          </div>
          <button className="edit-btn" onClick={handleOpenModal}>
            Edit My Info
          </button>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit My Info </h3>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder={draftInfo.firstName}
                    onChange={handleDraftFieldChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder={draftInfo.lastName}
                    onChange={handleDraftFieldChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={draftInfo.phone}
                    onChange={handleDraftFieldChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder={draftInfo.email}
                    onChange={handleDraftFieldChange}
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    placeholder={draftInfo.age}
                    onChange={handleDraftFieldChange}
                    min="1"
                  />
                </div>

                <div className="section-title">العنوان</div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    placeholder={draftInfo.address?.country}
                    onChange={handleUpdateAddressInfo}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Governorate</label>
                    <input
                      type="text"
                      name="governorate"
                      placeholder={draftInfo.address?.governorate}
                      onChange={handleUpdateAddressInfo}
                    />
                  </div>
                  <div className="form-group">
                    <label>Region</label>
                    <input
                      type="text"
                      name="region"
                      placeholder={draftInfo.address?.region}
                      onChange={handleUpdateAddressInfo}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Save Edit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Subscribe />
      <Footer />
    </>
  );
}
