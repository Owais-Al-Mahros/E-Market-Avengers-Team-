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
    // ✅ جلب عدد الطلبات لكل ساعة (capacity check)
    // ============================================
    useEffect(() => {
        const fetchOrdersCount = async () => {
            if (!selectedDate) return;

            setLoadingOrders(true);
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("delivery_time, status")
                    .eq("delivery_date", selectedDate)
                    .in("status", [
                        "pending",
                        "confirmed",
                        "shipped",
                        "delivered",
                        "awaiting_payment",
                    ]);

                if (error) throw error;

                // عدّ الطلبات لكل ساعة
                const counts = {};
                (data || []).forEach((order) => {
                    const time = order.delivery_time;
                    if (time) {
                        counts[time] = (counts[time] || 0) + 1;
                    }
                });

                setOrdersCount(counts);
            } catch (err) {
                console.error("Failed to count orders:", err);
                setOrdersCount({});
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchOrdersCount();
    }, [selectedDate]);

    // ============================================
    // حساب الفترات المتاحة
    // ============================================
    const slots = useMemo(() => {
        if (!selectedDate) return [];

        const dayName = new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
        });

        const hoursForDay =
            settings.dateOverrides?.[dayName] ||
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
        const hour = parseInt(timeStr.split(":")[0], 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:00 ${ampm}`;
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
                    Mindestdauer: {settings.minDurationHours || 2} Stunden
                    {maxOrders > 0 && (
                        <> · Max. {maxOrders} Bestellungen pro Stunde</>
                    )}
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

                                {isDisabled ? (
                                    <span className="tsp-slot-full-badge">
                                        Ausgebucht
                                    </span>
                                ) : (
                                    maxOrders > 0 && (
                                        <span className="tsp-slot-availability">
                                            {slot.booked}/{maxOrders}
                                        </span>
                                    )
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