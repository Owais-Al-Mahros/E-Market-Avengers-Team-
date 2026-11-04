import { useRef, useEffect } from "react";

export default function RichTextEditor({ value, onChange, placeholder }) {
    const editorRef = useRef(null);

    // ✅ مزامنة القيمة الخارجية فقط إذا تغيرت فعلياً لمنع قفز المؤشر أثناء الكتابة
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const handleCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="rte-wrapper">
            {/* شريط الأدوات */}
            <div className="rte-toolbar">
                <button type="button" onClick={() => handleCommand("bold")} title="Fett">
                    <span className="material-symbols-outlined">format_bold</span>
                </button>
                <button type="button" onClick={() => handleCommand("italic")} title="Kursiv">
                    <span className="material-symbols-outlined">format_italic</span>
                </button>
                <button type="button" onClick={() => handleCommand("underline")} title="Unterstrichen">
                    <span className="material-symbols-outlined">format_underlined</span>
                </button>
                <button type="button" onClick={() => handleCommand("formatBlock", "h4")} title="Überschrift">
                    <span className="material-symbols-outlined">title</span>
                </button>
            </div>

            <div
                ref={editorRef}
                className="rte-content"
                contentEditable
                dir="ltr"
                onInput={handleInput}
                onBlur={handleInput}
                data-placeholder={placeholder}
            />
        </div>
    );
}