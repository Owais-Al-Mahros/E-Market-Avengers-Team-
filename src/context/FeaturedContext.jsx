import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import {
    fetchFeaturedProducts,
    saveFeaturedProducts,
} from "../api/featured";

const FeaturedContext = createContext();

export function FeaturedProvider({ children }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    /* ═══ Load ═══ */
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await fetchFeaturedProducts();
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

    /* ═══ Save (admin) ═══ */
    const save = useCallback(
        async (productIds) => {
            setSaving(true);
            const result = await saveFeaturedProducts(productIds);
            if (result.success) {
                await refresh();
            }
            setSaving(false);
            return result;
        },
        [refresh]
    );

    const value = useMemo(
        () => ({ items, loading, saving, error, refresh, save }),
        [items, loading, saving, error, refresh, save]
    );

    return (
        <FeaturedContext.Provider value={value}>
            {children}
        </FeaturedContext.Provider>
    );
}

export function useFeatured() {
    const ctx = useContext(FeaturedContext);
    if (!ctx) throw new Error("useFeatured must be used within FeaturedProvider");
    return ctx;
}