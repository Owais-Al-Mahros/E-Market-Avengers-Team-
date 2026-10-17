// src/context/HaccpContext.jsx
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import {
    fetchThermalCategories,
    fetchCorrectiveActions,
    fetchViolationTypes,
    fetchHaccpSettings,
} from "../api/haccp";

const HaccpContext = createContext();

export function HaccpProvider({ children }) {
    const [thermalCategories, setThermalCategories] = useState([]);
    const [correctiveActions, setCorrectiveActions] = useState([]);
    const [violationTypes, setViolationTypes] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ═══════════════════════════════════════════
       تحميل كل البيانات المرجعية دفعة واحدة
       ═══════════════════════════════════════════ */
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [cats, actions, types, settingsRes] = await Promise.all([
                fetchThermalCategories(),
                fetchCorrectiveActions(),
                fetchViolationTypes(),
                fetchHaccpSettings(),
            ]);

            const firstError =
                (!cats.success && cats.error) ||
                (!actions.success && actions.error) ||
                (!types.success && types.error) ||
                (!settingsRes.success && settingsRes.error);

            if (firstError) {
                setError(firstError);
                setLoading(false);
                return;
            }

            setThermalCategories(cats.data);
            setCorrectiveActions(actions.data);
            setViolationTypes(types.data);
            setSettings(settingsRes.data);
        } catch (err) {
            setError(err.message || "Failed to load HACCP data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    /* ═══════════════════════════════════════════
       Value
       ═══════════════════════════════════════════ */
    const value = useMemo(
        () => ({
            // البيانات
            thermalCategories,
            correctiveActions,
            violationTypes,
            settings,

            // الحالة
            loading,
            error,

            // إعادة التحميل (مثلًا بعد تعديل الأدمن للإعدادات)
            refresh,
        }),
        [
            thermalCategories,
            correctiveActions,
            violationTypes,
            settings,
            loading,
            error,
            refresh,
        ]
    );

    return (
        <HaccpContext.Provider value={value}>
            {children}
        </HaccpContext.Provider>
    );
}

export function useHaccp() {
    const ctx = useContext(HaccpContext);
    if (!ctx) throw new Error("useHaccp must be used within HaccpProvider");
    return ctx;
}