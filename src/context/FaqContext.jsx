import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { fetchPublicFaq } from "../api/faq";

const FaqContext = createContext();

export function FaqProvider({ children }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await fetchPublicFaq();
        if (result.success) {
            setItems(result.data);
        } else {
            setError(result.error);
            setItems([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({ items, loading, error, refresh }),
        [items, loading, error, refresh]
    );

    return <FaqContext.Provider value={value}>{children}</FaqContext.Provider>;
}

export function useFaq() {
    const ctx = useContext(FaqContext);
    if (!ctx) throw new Error("useFaq must be used within FaqProvider");
    return ctx;
}