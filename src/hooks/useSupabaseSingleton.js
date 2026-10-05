import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useSupabaseSingleton(table, {
    defaults = {},
    fromDb = (row) => row,
    toDb = (data) => data,
} = {}) {
    const [data, setData] = useState(defaults);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // ✅ احفظ المراجع — لا تتغير أبدًا
    const fromDbRef = useRef(fromDb);
    const toDbRef = useRef(toDb);

    // حدّث المراجع إذا تغيرت فعلاً (نادر)
    useEffect(() => {
        fromDbRef.current = fromDb;
        toDbRef.current = toDb;
    }, [fromDb, toDb]);

    const fetchOne = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: row, error } = await supabase
                .from(table)
                .select("*")
                .limit(1)
                .maybeSingle();

            if (error && error.code !== "PGRST116") throw error;
            if (row) setData(fromDbRef.current(row));   // ← استخدم المرجع
        } catch (err) {
            setError(err.message || `Failed to load ${table}`);
            console.error(`❌ fetch ${table}:`, err);
        } finally {
            setLoading(false);
        }
    }, [table]);   // ← فقط table — لا fromDb

    useEffect(() => { fetchOne(); }, [fetchOne]);

    const save = async (updates) => {
        setSaving(true);
        try {
            const merged = { ...data, ...updates };
            const payload = toDbRef.current(merged);   // ← استخدم المرجع

            const { data: existing, error: selectErr } = await supabase
                .from(table)
                .select("id")
                .limit(1);
            if (selectErr) throw selectErr;

            let opError;
            if (existing?.length > 0) {
                ({ error: opError } = await supabase
                    .from(table)
                    .update(payload)
                    .eq("id", existing[0].id));
            } else {
                ({ error: opError } = await supabase.from(table).insert([payload]));
            }
            if (opError) throw opError;

            setData(merged);
            return { success: true };
        } catch (err) {
            console.error(`❌ save ${table}:`, err);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    return { data, setData, loading, saving, error, fetchOne, save };
}