import { useState } from "react";

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });
    const setValue = (value) => {
        setStoredValue((prev) => {
            const next = value instanceof Function ? value(prev) : value;
            try {
                localStorage.setItem(key, JSON.stringify(next));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
            return next;
        });
    };
    const removeValue = () => {
        try {
            localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue, removeValue];
}