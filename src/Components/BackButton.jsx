import "./BackButton.css"
const BackButton = ({label}) => {
  const handleClickBack = () => {
    if (typeof window !== "undefined" && window.history) {
      window.history.back();
    }
  };

  return (
    <button onClick={handleClickBack} className="back-btn">
        <span className="material-symbols-outlined">arrow_back</span> 
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
