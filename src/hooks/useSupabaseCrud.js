// src/hooks/useSupabaseCrud.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const STORAGE_BUCKET = "upload-image";

async function uploadImage(file, name) {
    const fileName = `${Date.now()}_${name}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName).data.publicUrl;
}

export function useSupabaseCrud(table, { orderBy = "id", nameField = "name" } = {}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from(table).select("*").order(orderBy);
        if (error) toast.error(`Failed to load ${table}: ${error.message}`);
        else setItems(data || []);
        setLoading(false);
    }, [table, orderBy]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const create = async (payload, imageFile) => {
        try {
            let image = payload.image?.trim() || null;
            if (imageFile) image = await uploadImage(imageFile, payload[nameField]);

            const { data, error } = await supabase
                .from(table)
                .insert([{ ...payload, image }])
                .select();
            if (error) throw error;

            setItems((prev) => [...prev, data[0]]);
            return { success: true, data: data[0] };
        } catch (err) {
            console.error(err);
            toast.error(err.message);
            return { success: false, error: err.message };
        }
    };

    const update = async (id, payload, imageFile) => {
        try {
            let image = payload.image?.trim() || null;
            if (imageFile) image = await uploadImage(imageFile, payload[nameField]);

            const { data, error } = await supabase
                .from(table)
                .update({ ...payload, image })
                .eq("id", id)
                .select();
            if (error) throw error;

            setItems((prev) => prev.map((it) => (it.id === id ? data[0] : it)));
            return { success: true, data: data[0] };
        } catch (err) {
            console.error(err);
            toast.error(err.message);
            return { success: false, error: err.message };
        }
    };

    const remove = async (id) => {
        try {
            const { error } = await supabase.from(table).delete().eq("id", id);
            if (error) throw error;
            setItems((prev) => prev.filter((it) => it.id !== id));
            return { success: true };
        } catch (err) {
            console.error(err);
            toast.error(err.message);
            return { success: false, error: err.message };
        }
    };

    return { items, setItems, loading, fetchAll, create, update, remove };
}