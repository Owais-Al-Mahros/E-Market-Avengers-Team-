import "./BackButton.css";
import { useNavigate } from "react-router-dom";
const BackButton = ({ label }) => {
  const navigate = useNavigate();
  const handleClickBack = () => {
    if (label === "Go Home") {
      navigate("/");
    } else {
      if (typeof window !== "undefined" && window.history) {
        navigate(-1);
      }
    }
  };

  return (
    <button onClick={handleClickBack} className="btn-back">
      <span className="material-symbols-outlined">arrow_back</span>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
