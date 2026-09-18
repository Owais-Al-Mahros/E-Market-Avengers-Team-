import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCompany = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("company_settings")
            .select("*")
            .limit(1)
            .single();

        if (!error && data) setCompany(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCompany();
    }, []);

    const updateCompany = async (newData) => {
        try {
            const { data: existing } = await supabase
                .from("company_settings")
                .select("id")
                .limit(1);

            const payload = { ...newData, updated_at: new Date().toISOString() };
            let error;

            if (existing && existing.length > 0) {
                const { error: e } = await supabase
                    .from("company_settings")
                    .update(payload)
                    .eq("id", existing[0].id);
                error = e;
            } else {
                const { error: e } = await supabase
                    .from("company_settings")
                    .insert([payload]);
                error = e;
            }

            if (error) throw error;
            setCompany((prev) => ({ ...prev, ...newData }));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    return (
        <CompanyContext.Provider value={{ company, loading, refreshCompany: fetchCompany, updateCompany }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
    return ctx;
}