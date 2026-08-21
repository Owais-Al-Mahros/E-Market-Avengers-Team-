import { useState } from 'react';


export function useDynamicFields(initialFields = []) {
    const [fields, setFields] = useState(initialFields);

    // إضافة حقل جديد فارغ
    const addField = () => {
        setFields([...fields, { key: '', value: '' }]);
    };

    // تحديث حقل معين (المفتاح أو القيمة)
    const updateField = (index, fieldName, newValue) => {
        const updated = [...fields];
        updated[index][fieldName] = newValue;
        setFields(updated);
    };

    // حذف حقل معين
    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    // تحويل المصفوفة إلى كائن (للتخزين في قاعدة البيانات)
    const toObject = () => {
        return fields.reduce((acc, field) => {
            if (field.key.trim()) {
                acc[field.key.trim()] = field.value.trim();
            }
            return acc;
        }, {});
    };

    // إعادة تعيين الحقول (لمسح النموذج بعد الإضافة)
    const resetFields = () => {
        setFields([]);
    };

    return {
        fields,
        setFields,       // في حال أردت تعيينها مباشرة (مثل من props)
        addField,
        updateField,
        removeField,
        toObject,
        resetFields,
    };
}