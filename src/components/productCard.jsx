import "./ProductCard.css"
import image from "../assets/image.jpg"


export default function ProductCard(props) {
    return (
        <div className="container">
            <div className="sub-container">
                <h3>{props.name}</h3>
                <p>{props.description}</p>
                <img src={image} />
                <div className="sub-container-two">
                    <div className="section-one">
                        <span className="price"> {props.price}$ </span>
                        <span>☆☆☆☆☆</span>
                    </div>
                    <div className="section-two">
                        <button className="btn-counter" id="btn-increase">
                            +
                        </button>
                        <section className="count">1</section>
                        <button className="btn-counter" id="btn-decrease">
                            -
                        </button>
                    </div>
                    <div className="section-three">
                        <span className="span-size">SIZE</span>
                        <div className="group-size">
                            <label>
                                <input type="radio" /> XS
                            </label>
                            <label>
                                <input type="radio" /> S
                            </label>
                            <label>
                                <input type="radio" /> M
                            </label>
                            <label>
                                <input type="radio" /> L
                            </label>
                            <label>
                                <input type="radio" /> XL
                            </label>
                        </div>
                    </div>
                    <div className="section-four">
                        <span className="span-color">COLOR</span>
                        <div className="group-color">
                            <label>
                                <input type="checkbox" />
                            </label>
                            <label>
                                <input type="checkbox" />
                            </label>
                            <label>
                                <input type="checkbox" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <button className="btn">ADD</button>
        </div>

    )
} 
