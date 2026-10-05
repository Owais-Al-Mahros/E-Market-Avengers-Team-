import "./BackButton.css";
import { useNavigate } from "react-router-dom";

/**
 * زر الرجوع
 * @param {string} label - النص المعروض
 * @param {string} to - إن مُرِّر، يذهب لهذا المسار مباشرة (بدل الرجوع)
 */
export default function BackButton({ label = "Back", to }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button type="button" className="back-btn" onClick={handleClick}>
      <span className="material-symbols-outlined">arrow_back</span>
      <span>{label}</span>
    </button>
  );
}