// src/context/HaccpContext.jsx
import { createContext, useContext } from "react";

const HaccpContext = createContext();

export function HaccpProvider({ children }) {
    // 🛑 النظام القديم تم حذفه. 
    // هذا مجرد مزود مؤقت لمنع انهيار المكونات القديمة التي لم يتم حذفها بعد.
    return (
        <HaccpContext.Provider
            value={{
                loading: false,
                thermalCategories: [],
                correctiveActions: [],
                violationTypes: [],
                settings: null,
                refresh: () => { }
            }}
        >
            {children}
        </HaccpContext.Provider>
    );
}

export function useHaccp() {
    return useContext(HaccpContext);
}