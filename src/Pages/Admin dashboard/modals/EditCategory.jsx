import { useState, useRef } from "react";
import toast from "react-hot-toast";
import "./AddCategory.css";

export default function EditCategory({ title, initialData, onSave, onClose }) {
  const [name, setName] = useState(initialData.name || "");
  const [image, setImage] = useState(initialData.image || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectFile, setSelectFile] = useState("");
  const [preViewUrl, serPreViewUrl] = useState(initialData.image || "");
  const fileInputRef = useRef(null);

  const handelCameraClick = () => {
    if (fileInputRef) fileInputRef.current.click();
  };

  const handelFileChange = (e) => {
    const file = e.target.files[0];
    setSelectFile(file);
    serPreViewUrl(URL.createObjectURL(file));
    setImage("");
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Category name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(
        { name: name.trim(), image: image?.trim() || null },
        selectFile,
      );
      toast.success(`${title} updated successfully!`);
      onClose();
    } catch (error) {
      console.error("error in saving ", error);
      toast.error("Failed to update category: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit {title}</h2>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            X
          </button>
        </div>

        <form className="modal-body" onSubmit={handelSubmit}>
          <div className="category-image-section">
            <label className="section-subtitle">Category Image</label>
            <div className="container-of-product-image">
              {preViewUrl ? (
                <img
                  className="image-of-product-dashboard"
                  src={preViewUrl}
                  alt="Category Preview"
                />
              ) : (
                <div className="image-placeholder-icon">
                  <span className="material-symbols-outlined">image</span>
                </div>
              )}
              <button
                className="icon-of-image-dashboard"
                type="button"
                onClick={handelCameraClick}
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handelFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="form-fields">
            <input
              type="text"
              placeholder="Category name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <input
              type="text"
              placeholder="Image URL (optional)..."
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                serPreViewUrl(e.target.value);
                setSelectFile(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: "10px" }}>
            <button type="submit" className="add-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
