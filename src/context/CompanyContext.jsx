import { createContext, useContext } from "react";
import { useSupabaseSingleton } from "../hooks/useSupabaseSingleton";

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
    const {
        data: company,
        loading,
        fetchOne,
        save,
    } = useSupabaseSingleton("company_settings");

    return (
        <CompanyContext.Provider
            value={{
                company,
                loading,
                refreshCompany: fetchOne,
                updateCompany: save,
            }}
        >
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompany = () => {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
    return ctx;
};