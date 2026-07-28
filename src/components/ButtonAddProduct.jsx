import "./ButtonAddProduct.css";

function ButtonAddProduct({ openModel }) {
  return (
    <>
      <button type="button" className="add-product" onClick={openModel}>
        +
      </button>
    </>
  );
}

export default ButtonAddProduct;
