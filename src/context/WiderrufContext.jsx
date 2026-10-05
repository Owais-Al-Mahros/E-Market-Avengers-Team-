import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import {
    fetchWiderrufRequests as fetchAPI,
    processWiderrufRequest as processAPI,
} from "../api/widerruf";

const WiderrufContext = createContext();

export function WiderrufProvider({ children }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ═══ Fetch ═══ */
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAPI();
            setRequests(data);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ═══ Process (approve/reject) ═══ */
    const processRequest = useCallback(async (payload) => {
        const result = await processAPI(payload);
        if (result.success) {
            // حدّث الطلب محليًا
            setRequests((prev) =>
                prev.map((r) =>
                    r.id === payload.amendmentId
                        ? {
                            ...r,
                            status:
                                payload.action === "approve"
                                    ? "approved"
                                    : "rejected",
                            rejection_reason: payload.rejectionReason || null,
                            stripe_refund_id: result.stripe_refund_id || null,
                            stripe_refund_amount: result.refund_amount || null,
                        }
                        : r
                )
            );
        }
        return result;
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    /* ═══ Counts (memoized) ═══ */
    const counts = useMemo(() => {
        return {
            all: requests.length,
            pending: requests.filter((r) => r.status === "pending").length,
            approved: requests.filter((r) => r.status === "approved").length,
            rejected: requests.filter((r) => r.status === "rejected").length,
        };
    }, [requests]);

    const value = useMemo(
        () => ({
            requests,
            loading,
            error,
            counts,
            fetchRequests,
            processRequest,
        }),
        [requests, loading, error, counts, fetchRequests, processRequest]
    );

    return (
        <WiderrufContext.Provider value={value}>
            {children}
        </WiderrufContext.Provider>
    );
}

export function useWiderruf() {
    const ctx = useContext(WiderrufContext);
    if (!ctx) {
        throw new Error("useWiderruf must be used within WiderrufProvider");
    }
    return ctx;
}