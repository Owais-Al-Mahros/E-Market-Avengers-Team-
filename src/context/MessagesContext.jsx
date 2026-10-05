import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchContactMessages,
    updateMessageStatus,
    replyToMessage,
    deleteMessage,
} from "../api/messages";

const MessagesContext = createContext();

export function MessagesProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await fetchContactMessages();
        if (result.success) {
            setMessages(result.data);
        } else {
            setError(result.error);
        }
        setLoading(false);
    }, []);

    const markRead = useCallback(async (id) => {
        const result = await updateMessageStatus(id, "read");
        if (result.success) {
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, status: "read" } : m))
            );
        }
        return result;
    }, []);

    const reply = useCallback(async (id, text, adminId) => {
        const result = await replyToMessage(id, text, adminId);
        if (result.success) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? {
                            ...m,
                            admin_reply: text,
                            replied_at: new Date().toISOString(),
                            status: "replied",
                        }
                        : m
                )
            );
        }
        return result;
    }, []);

    const remove = useCallback(async (id) => {
        const result = await deleteMessage(id);
        if (result.success) {
            setMessages((prev) => prev.filter((m) => m.id !== id));
        }
        return result;
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const counts = useMemo(() => {
        const c = { all: messages.length, pending: 0, read: 0, replied: 0, archived: 0 };
        messages.forEach((m) => {
            if (c[m.status] !== undefined) c[m.status]++;
        });
        return c;
    }, [messages]);

    const value = useMemo(
        () => ({ messages, loading, error, counts, refresh, markRead, reply, remove }),
        [messages, loading, error, counts, refresh, markRead, reply, remove]
    );

    return (
        <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
    );
}

export function useMessages() {
    const ctx = useContext(MessagesContext);
    if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
    return ctx;
}