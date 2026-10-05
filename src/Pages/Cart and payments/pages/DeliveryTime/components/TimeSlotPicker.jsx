// src/Pages/Cart and payments/pages/DeliveryTime/components/TimeSlotPicker.jsx

import { useMemo, useState, useEffect } from "react";
import { useShippingSettings } from "../../../../../context/ShippingSettingsContext";
import { supabase } from "../../../../../lib/supabase";
import "./TimeSlotPicker.css";

export default function TimeSlotPicker({
    selectedDate,
    selectedTime,
    onSelectTime,
}) {
    const { settings } = useShippingSettings();
    const [ordersCount, setOrdersCount] = useState({});
    const [loadingOrders, setLoadingOrders] = useState(false);

    // ============================================
    // ✅ استخدم RPC بدل select مباشر (RLS يمنع anon)
    // ============================================
    // ============================================
    // ✅ جلب عدد الطلبات لكل ساعة عبر RPC (RLS-safe)
    // ============================================
    useEffect(() => {
        const fetchOrdersCount = async () => {
            if (!selectedDate) return;

            setLoadingOrders(true);
            try {
                const { data, error } = await supabase.rpc(
                    "get_delivery_slot_counts",
                    { p_date: selectedDate }
                );

                if (error) throw error;

                // [{ slot: "10:00", cnt: 3 }, ...] → { "10:00": 3, ... }
                const counts = {};
                (data || []).forEach((row) => {
                    if (row?.slot) counts[row.slot] = Number(row.cnt) || 0;
                });

                setOrdersCount(counts);
            } catch (err) {
                console.error("Failed to count orders:", err);
                setOrdersCount({}); // fallback: جميع الساعات متاحة
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrdersCount();
    }, [selectedDate]);;


    // ============================================
    // حساب الفترات المتاحة
    // ============================================
    const slots = useMemo(() => {
        if (!selectedDate) return [];

        // ✅ المفتاح هو التاريخ نفسه (نفس صيغة DayPicker)
        const hoursForDay =
            settings.dateOverrides?.[selectedDate] ||
            settings.defaultHours ||
            [];
        const normalizedHours = hoursForDay.map((h) => {
            const [hour, min] = h.split(":");
            return `${String(parseInt(hour, 10)).padStart(2, "0")}:${min || "00"
                }`;
        });

        const uniqueHours = [...new Set(normalizedHours)].filter(
            (h) => h !== ""
        );

        const duration = settings.minDurationHours || 2;
        const result = [];

        const availableHours = uniqueHours
            .map((h) => parseInt(h.split(":")[0], 10))
            .sort((a, b) => a - b);


        for (let i = 0; i < availableHours.length; i++) {
            const start = availableHours[i];
            const end = start + duration;

            const startStr = `${String(start).padStart(2, "0")}:00`;
            const endStr = `${String(end).padStart(2, "0")}:00`;

            // ✅ هل الساعة ممتلئة؟
            const booked = ordersCount[startStr] || 0;
            const maxOrders = settings.maxOrdersPerHour || 0;
            const isFull = maxOrders > 0 && booked >= maxOrders;

            // كل الساعات المتتالية ضمن النطاق
            if (availableHours.includes(end)) {
                result.push({
                    start,
                    end,
                    startStr,
                    endStr,
                    booked,
                    isFull,
                });
            }
        }

        return result;
    }, [
        selectedDate,
        settings.dateOverrides,
        settings.defaultHours,
        settings.minDurationHours,
        settings.maxOrdersPerHour,
        ordersCount,
    ]);

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(":");
        return `${String(h).padStart(2, "0")}:${m || "00"} Uhr`;
    };

    const maxOrders = settings.maxOrdersPerHour || 0;

    return (
        <div className="tsp-container">
            <div className="tsp-header">
                <h2>
                    <span className="material-symbols-outlined">schedule</span>
                    Lieferzeit auswählen
                </h2>
                <p className="tsp-subtitle">
                    Mindestdauer: {settings.minDurationHours || 2}{" "}
                    {(settings.minDurationHours || 2) === 1 ? "Stunde" : "Stunden"}
                </p>
            </div>

            {loadingOrders ? (
                <div className="tsp-empty">
                    <span className="material-symbols-outlined">hourglass</span>
                    <p>Verfügbarkeit wird geprüft...</p>
                </div>
            ) : slots.length === 0 ? (
                <div className="tsp-empty">
                    <span className="material-symbols-outlined">schedule</span>
                    <p>
                        Für diesen Tag sind keine Zeitfenster verfügbar. Bitte
                        wählen Sie einen anderen Tag.
                    </p>
                </div>
            ) : (
                <div className="tsp-grid">
                    {slots.map((slot) => {
                        const isSelected = selectedTime === slot.startStr;
                        const isDisabled = slot.isFull;

                        return (
                            <button
                                key={slot.startStr}
                                type="button"
                                disabled={isDisabled}
                                className={`tsp-slot ${isSelected ? "tsp-slot-selected" : ""
                                    } ${isDisabled ? "tsp-slot-full" : ""}`}
                                onClick={() =>
                                    !isDisabled && onSelectTime(slot.startStr)
                                }
                            >
                                <span className="tsp-slot-time">
                                    {formatTime(slot.startStr)} –{" "}
                                    {formatTime(slot.endStr)}
                                </span>
                                <span className="tsp-slot-duration">
                                    {slot.end - slot.start}h
                                </span>
                                {isDisabled && (
                                    <span className="tsp-slot-full-badge">Ausgebucht</span>
                                )}
                                {isSelected && !isDisabled && (
                                    <span className="tsp-slot-check">
                                        <span className="material-symbols-outlined">
                                            check
                                        </span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}