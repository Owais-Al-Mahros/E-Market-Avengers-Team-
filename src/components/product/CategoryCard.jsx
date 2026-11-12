import "./CategoryCard.css";

/* <button> بدل <div onClick>: Tab وEnter/Space يعملان دون أي كود إضافي.
   السهم في الزاوية يُرسم من CSS (::after)، فلا يحتاج خط أيقونات ولا عنصرًا إضافيًا. */
export default function CategoryCard({ category, onSelect }) {
    return (
        <button
            type="button"
            className="category-card"
            onClick={() => onSelect(category.id)}
        >
            <span className="category-card-media">
                {/* alt فارغ: الاسم ظاهر في النص التالي، وتكراره يجعل قارئ الشاشة ينطقه مرتين */}
                <img
                    src={category.image}
                    className="category-card-image"
                    alt=""
                    loading="lazy"
                    decoding="async"
                />
            </span>
            <span className="category-card-name">{category.name}</span>
        </button>
    );
}
