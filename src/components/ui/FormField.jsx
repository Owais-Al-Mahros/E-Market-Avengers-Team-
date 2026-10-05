export default function FormField({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    disabled,
    min,
}) {
    // ✅ عند القراءة + فارغ → "Not set"
    const effectivePlaceholder =
        disabled && !value ? "Not set" : placeholder;

    return (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <input
                id={name}
                type={type}
                name={name}
                value={value}
                placeholder={effectivePlaceholder}
                onChange={onChange}
                disabled={disabled}
                min={min}
            />
        </div>
    );
}