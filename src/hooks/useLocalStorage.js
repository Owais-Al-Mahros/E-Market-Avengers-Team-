import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
    // 1. قراءة القيمة المخزنة (أو القيمة الافتراضية)
    const readStoredValue = () => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState(readStoredValue);

    // 2. حفظ القيمة في localStorage كلما تغيرت
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    // 3. دالة لتحديث القيمة (مثل setState)
    const setValue = (value) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    };

    // 4. دالة لحذف القيمة من localStorage
    const removeValue = () => {
        try {
            localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key “${key}”:`, error);
        }
    };

    return [storedValue, setValue, removeValue];
}