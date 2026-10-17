// ==========================================================
// 🛡️ HACCP API Layer
// كل نداءات قاعدة البيانات للسائق والأدمن
// ==========================================================

import { supabase } from "../lib/supabase";
import {
    computeVehicleCheckStatus,
    computeCoolingEquipmentStatus,
    computeProductReceiptStatus,
    computeTemperatureStatus,
} from "../lib/haccpHelpers";

/* ══════════════════════════════════════════════════════════
   🔧 Helpers
   ══════════════════════════════════════════════════════════ */

async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

async function getCurrentProfile() {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const { data } = await supabase
        .from("profiles")
        .select("id, is_admin, role, is_active")
        .eq("id", userId)
        .single();
    return data;
}

/* ══════════════════════════════════════════════════════════
   📚 1. البيانات المرجعية (يقرأها السائق والأدمن)
   ══════════════════════════════════════════════════════════ */

export async function fetchThermalCategories() {
    const { data, error } = await supabase
        .from("haccp_thermal_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function fetchCorrectiveActions() {
    const { data, error } = await supabase
        .from("haccp_corrective_actions")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function fetchViolationTypes() {
    const { data, error } = await supabase
        .from("haccp_violation_types")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function fetchHaccpSettings() {
    const { data, error } = await supabase
        .from("haccp_settings")
        .select("*")
        .eq("id", 1)
        .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

/* ══════════════════════════════════════════════════════════
   🔴 2. إنشاء مخالفة تلقائيًا (داخلي)
   ══════════════════════════════════════════════════════════ */

async function createViolationInternal({
    driverId,
    violationTypeKey,
    severity,
    orderId = null,
    affectedProducts = null,
    correctiveActionKeys = [],
    notes = null,
}) {
    const { data, error } = await supabase
        .from("haccp_violations")
        .insert({
            driver_id: driverId,
            violation_type: violationTypeKey,   // legacy text
            severity: severity || "minor",
            status: "pending",
            order_id: orderId,
            affected_products: affectedProducts,
            corrective_action_taken: notes,
            corrective_action_keys: correctiveActionKeys,
        })
        .select()
        .single();
    return { success: !error, data, error: error?.message };
}

/* ══════════════════════════════════════════════════════════
   ✍️ 3. كتابة السائق — الأنشطة الخمسة
   ══════════════════════════════════════════════════════════ */

/**
 * فحص السيارة والنظافة (بند 1)
 */
export async function saveVehicleCheck(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const overallStatus = computeVehicleCheckStatus(payload);

        const { data, error } = await supabase
            .from("haccp_vehicle_checks")
            .insert({
                driver_id: driverId,
                vehicle_number: payload.vehicle_number,
                is_vehicle_suitable: payload.is_vehicle_suitable,
                is_cargo_clean: payload.is_cargo_clean,
                no_dirt_or_contaminants: payload.no_dirt_or_contaminants,
                no_abnormal_odors: payload.no_abnormal_odors,
                no_chemicals: payload.no_chemicals,
                boxes_clean_and_intact: payload.boxes_clean_and_intact,
                no_pests: payload.no_pests,
                no_damaged_food: payload.no_damaged_food,
                driver_hygiene_compliant: payload.driver_hygiene_compliant,
                no_health_issues: payload.no_health_issues,
                overall_status: overallStatus,
                notes: payload.notes || null,
                corrective_actions: (payload.corrective_action_keys || []).join(",") || null,
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        // إذا فشل → أنشئ مخالفة تلقائية
        if (overallStatus === "failed") {
            await createViolationInternal({
                driverId,
                violationTypeKey: "unclean_vehicle",
                severity: "critical",
                correctiveActionKeys: payload.corrective_action_keys || [],
                notes: payload.notes || "Fahrzeug-/Hygienecheck fehlgeschlagen",
            });
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * تسجيل درجة الحرارة (بند 4)
 */
export async function saveTemperatureLog(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        // جلب الفئة للحصول على الحدود
        const { data: category } = await supabase
            .from("haccp_thermal_categories")
            .select("min_temp, max_temp, key, label_de")
            .eq("id", payload.category_id)
            .single();

        if (!category) return { success: false, error: "Thermalkategorie nicht gefunden" };

        const status = computeTemperatureStatus(
            payload.actual_temp,
            parseFloat(category.min_temp),
            parseFloat(category.max_temp)
        );

        const { data, error } = await supabase
            .from("haccp_temperature_logs")
            .insert({
                driver_id: driverId,
                round_number: payload.round_number,
                box_number: payload.box_number,
                category_id: payload.category_id,
                product_type: category.label_de,   // legacy — نُخزّن التسمية الألمانية
                required_temp: payload.required_temp,
                actual_temp: payload.actual_temp,
                check_status: status,
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        // إذا غير مطابق → مخالفة تلقائية
        if (status === "non_compliant") {
            await createViolationInternal({
                driverId,
                violationTypeKey: "improper_temperature",
                severity: "critical",
                notes: `Box ${payload.box_number}: ${payload.actual_temp}°C (erlaubt ${category.min_temp}–${category.max_temp}°C)`,
            });
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * سجل التنظيف (بند 6)
 */
export async function saveCleaningLog(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const { data, error } = await supabase
            .from("haccp_cleaning_logs")
            .insert({
                driver_id: driverId,
                equipment_name: payload.equipment_name,
                cleaning_method: payload.cleaning_method,
                result: payload.result,
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        if (payload.result === "failed") {
            await createViolationInternal({
                driverId,
                violationTypeKey: "unclean_vehicle",
                severity: "minor",
                notes: `Reinigung fehlgeschlagen: ${payload.equipment_name}`,
            });
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * فحص المنتجات عند الاستلام (بند 3)
 */
export async function saveProductReceiptCheck(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const overallStatus = computeProductReceiptStatus(payload);

        const { data, error } = await supabase
            .from("haccp_product_checks")
            .insert({
                driver_id: driverId,
                order_id: payload.order_id,
                products_match_order: payload.products_match_order,
                packaging_intact: payload.packaging_intact,
                no_open_or_leaking_packages: payload.no_open_or_leaking_packages,
                no_visible_damage_or_spoilage: payload.no_visible_damage_or_spoilage,
                chilled_products_stored_correctly: payload.chilled_products_stored_correctly,
                frozen_products_not_thawed: payload.frozen_products_not_thawed,
                no_cross_contamination_risk: payload.no_cross_contamination_risk,
                overall_status: overallStatus,
                affected_products: payload.affected_products || null,
                notes: payload.notes || null,
                corrective_action_keys: payload.corrective_action_keys || [],
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        if (overallStatus === "failed") {
            await createViolationInternal({
                driverId,
                violationTypeKey: "damaged_packaging",
                severity: "critical",
                orderId: payload.order_id,
                affectedProducts: payload.affected_products || null,
                correctiveActionKeys: payload.corrective_action_keys || [],
                notes: payload.notes || "Produktprüfung fehlgeschlagen",
            });
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * فحص معدات التبريد (بند 2)
 */
export async function saveCoolingEquipmentCheck(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const overallStatus = computeCoolingEquipmentStatus(payload);

        const { data, error } = await supabase
            .from("haccp_cooling_equipment_checks")
            .insert({
                driver_id: driverId,
                round_number: payload.round_number || null,
                box_number: payload.box_number,
                box_clean: payload.box_clean,
                box_intact: payload.box_intact,
                cooling_unit_working: payload.cooling_unit_working,
                thermometer_working: payload.thermometer_working,
                required_temp_achieved: payload.required_temp_achieved,
                products_in_correct_compartment: payload.products_in_correct_compartment,
                no_cross_contamination_risk: payload.no_cross_contamination_risk,
                overall_status: overallStatus,
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        if (overallStatus === "failed") {
            await createViolationInternal({
                driverId,
                violationTypeKey: "defective_cooling_unit",
                severity: "critical",
                notes: `Box ${payload.box_number}: Kühlgerät-Check fehlgeschlagen`,
            });
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/* ══════════════════════════════════════════════════════════
   🚦 4. قواعد الحجب للسائق (بند 9)
   ══════════════════════════════════════════════════════════ */

/**
 * هل يستطيع السائق بدء الجولة الآن؟
 * يعتمد على haccp_settings + سجلات السائق
 */
/**
 * هل يستطيع السائق بدء الجولة الآن؟
 * 
 * يتحقق من:
 *   1. فحص سيارة حديث (افتراضي 12 ساعة)
 *   2. فحص حرارة حديث (افتراضي 12 ساعة) — بند 4
 *   3. سجل تنظيف حديث (افتراضي 48 ساعة) — بند 6
 *   4. لا توجد مخالفات حرجة معلقة — بند 9
 */
export async function canStartRound() {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const { data: settings } = await fetchHaccpSettings();
        if (!settings) return { success: false, error: "Settings unavailable" };

        const reasons = [];

        /* ═══ 1. فحص السيارة ═══ */
        let vehicleCheckFresh = true;
        if (settings.require_vehicle_check_before_round) {
            const hoursAgo = settings.require_vehicle_check_fresh_hours || 12;
            const since = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

            const { data: recent } = await supabase
                .from("haccp_vehicle_checks")
                .select("id, overall_status, check_date")
                .eq("driver_id", driverId)
                .gte("check_date", since)
                .order("check_date", { ascending: false })
                .limit(1);

            const check = recent?.[0];
            if (!check) {
                vehicleCheckFresh = false;
                reasons.push(`Fahrzeugcheck älter als ${hoursAgo}h oder fehlt`);
            } else if (check.overall_status === "failed") {
                vehicleCheckFresh = false;
                reasons.push("Letzter Fahrzeugcheck fehlgeschlagen");
            }
        }

        /* ═══ 2. فحص درجة الحرارة ═══ */
        let temperatureFresh = true;
        if (settings.require_temperature_check !== false) {
            const hoursAgo = settings.require_temperature_check_fresh_hours || 12;
            const since = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

            const { data: recent } = await supabase
                .from("haccp_temperature_logs")
                .select("id, check_status, measured_at")
                .eq("driver_id", driverId)
                .gte("measured_at", since)
                .order("measured_at", { ascending: false })
                .limit(1);

            const check = recent?.[0];
            if (!check) {
                temperatureFresh = false;
                reasons.push(`Temperaturkontrolle älter als ${hoursAgo}h oder fehlt`);
            } else if (check.check_status === "non_compliant") {
                temperatureFresh = false;
                reasons.push("Letzte Temperaturmessung nicht konform");
            } else if (check.check_status === "review_needed") {
                temperatureFresh = false;
                reasons.push("Letzte Temperaturmessung bedarf Prüfung");
            }
        }

        /* ═══ 3. سجل التنظيف ═══ */
        let cleaningFresh = true;
        if (settings.require_cleaning_check !== false) {
            const hoursAgo = settings.require_cleaning_check_fresh_hours || 48;
            const since = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

            const { data: recent } = await supabase
                .from("haccp_cleaning_logs")
                .select("id, result, cleaned_at")
                .eq("driver_id", driverId)
                .gte("cleaned_at", since)
                .order("cleaned_at", { ascending: false })
                .limit(1);

            const check = recent?.[0];
            if (!check) {
                cleaningFresh = false;
                reasons.push(`Reinigungsprotokoll älter als ${hoursAgo}h oder fehlt`);
            } else if (check.result === "failed") {
                cleaningFresh = false;
                reasons.push("Letzte Reinigung fehlgeschlagen");
            }
        }

        /* ═══ 4. المخالفات الحرجة المعلقة ═══ */
        let noPendingCriticalViolations = true;
        if (settings.block_round_on_pending_violation) {
            const { data: violations } = await supabase
                .from("haccp_violations")
                .select("id, severity, violation_type")
                .eq("driver_id", driverId)
                .eq("severity", "critical")
                .in("status", ["pending", "escalated"]);

            if (violations && violations.length > 0) {
                noPendingCriticalViolations = false;
                reasons.push(
                    `${violations.length} kritische(r) Verstoß(e) offen`
                );
            }
        }

        return {
            success: true,
            data: {
                allowed: reasons.length === 0,
                reasons,
                checks: {
                    vehicleCheckFresh,
                    temperatureFresh,
                    cleaningFresh,
                    noPendingCriticalViolations,
                },
            },
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/* ══════════════════════════════════════════════════════════
   📖 5. قراءات السائق
   ══════════════════════════════════════════════════════════ */

export async function fetchMyActiveViolations() {
    const driverId = await getCurrentUserId();
    if (!driverId) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase
        .from("haccp_violations")
        .select("*")
        .eq("driver_id", driverId)
        .in("status", ["pending", "escalated"])
        .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

export async function fetchMyProductChecks(orderId) {
    if (!orderId) return { success: false, error: "orderId required" };
    const { data, error } = await supabase
        .from("haccp_product_checks")
        .select("*")
        .eq("order_id", orderId)
        .order("checked_at", { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

/* ══════════════════════════════════════════════════════════
   👨‍💼 6. قراءات وكتابات الأدمن
   ══════════════════════════════════════════════════════════ */

/**
 * إحصائيات لوحة HACCP
 */
export async function getHaccpDashboardStats() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            vehicleToday,
            vehicleFailed,
            tempToday,
            tempNonCompliant,
            openViolations,
            closedThisWeek,
        ] = await Promise.all([
            supabase.from("haccp_vehicle_checks").select("*", { count: "exact", head: true }).gte("check_date", todayStart.toISOString()),
            supabase.from("haccp_vehicle_checks").select("*", { count: "exact", head: true }).eq("overall_status", "failed").gte("check_date", weekAgo.toISOString()),
            supabase.from("haccp_temperature_logs").select("*", { count: "exact", head: true }).gte("measured_at", todayStart.toISOString()),
            supabase.from("haccp_temperature_logs").select("*", { count: "exact", head: true }).eq("check_status", "non_compliant").gte("measured_at", weekAgo.toISOString()),
            supabase.from("haccp_violations").select("*", { count: "exact", head: true }).in("status", ["pending", "escalated"]),
            supabase.from("haccp_violations").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("closed_at", weekAgo.toISOString()),
        ]);

        return {
            success: true,
            data: {
                vehicleChecksToday: vehicleToday.count || 0,
                vehicleChecksFailed: vehicleFailed.count || 0,
                temperatureLogsToday: tempToday.count || 0,
                temperatureNonCompliant: tempNonCompliant.count || 0,
                openViolations: openViolations.count || 0,
                closedThisWeek: closedThisWeek.count || 0,
            },
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * جلب سجلات HACCP مع فلاتر (للتقارير)
 */
export async function fetchHaccpRecords(filters = {}) {
    try {
        const {
            type = "violation",
            dateFrom,
            dateTo,
            driverId,
            limit = 50,
            offset = 0,
        } = filters;

        const tableMap = {
            vehicle_check: "haccp_vehicle_checks",
            temperature: "haccp_temperature_logs",
            cleaning: "haccp_cleaning_logs",
            product_check: "haccp_product_checks",
            cooling_check: "haccp_cooling_equipment_checks",
            violation: "haccp_violations",
        };

        const table = tableMap[type];
        if (!table) return { success: false, error: "Unknown record type" };

        let query = supabase
            .from(table)
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (driverId) query = query.eq("driver_id", driverId);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo);

        const { data, error, count } = await query;
        if (error) return { success: false, error: error.message };

        return { success: true, data: data || [], total: count || 0 };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * جلب كل المخالفات (للأدمن)
 */
/**
 * جلب كل المخالفات (للأدمن) — مع دمج بيانات السائق يدويًا
 */
export async function fetchAllViolations({ status = null, limit = 100 } = {}) {
    try {
        let query = supabase
            .from("haccp_violations")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status) query = query.eq("status", status);

        const { data: violations, error } = await query;
        if (error) return { success: false, error: error.message };

        if (!violations || violations.length === 0) {
            return { success: true, data: [] };
        }

        // اجلب السائقين المرتبطين فقط
        const driverIds = [...new Set(violations.map((v) => v.driver_id))];
        const { data: drivers } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", driverIds);

        const driverMap = new Map((drivers || []).map((d) => [d.id, d]));

        // اجلب أرقام الطلبات المرتبطة
        const orderIds = [...new Set(violations.map((v) => v.order_id).filter(Boolean))];
        const { data: orders } = orderIds.length
            ? await supabase.from("orders").select("id, order_number").in("id", orderIds)
            : { data: [] };

        const orderMap = new Map((orders || []).map((o) => [o.id, o]));

        // دمج
        const merged = violations.map((v) => ({
            ...v,
            driver: driverMap.get(v.driver_id) || null,
            order: v.order_id ? orderMap.get(v.order_id) || null : null,
        }));

        return { success: true, data: merged };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * إغلاق مخالفة — للأدمن فقط
 */
export async function closeViolation(violationId, payload) {
    try {
        const profile = await getCurrentProfile();
        if (!profile?.is_admin) {
            return { success: false, error: "Only admins can close violations" };
        }

        if (!payload.corrective_action_keys?.length) {
            return { success: false, error: "Mindestens eine Korrekturmaßnahme erforderlich" };
        }
        if (!payload.notes?.trim()) {
            return { success: false, error: "Notiz ist erforderlich" };
        }

        const { data, error } = await supabase
            .from("haccp_violations")
            .update({
                status: "resolved",
                closed_by: profile.id,
                closed_at: new Date().toISOString(),
                corrective_action_taken: payload.notes.trim(),
                corrective_action_keys: payload.corrective_action_keys,
            })
            .eq("id", violationId)
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * تصعيد مخالفة — للأدمن
 */
export async function escalateViolation(violationId) {
    try {
        const profile = await getCurrentProfile();
        if (!profile?.is_admin) {
            return { success: false, error: "Only admins can escalate" };
        }

        const { data, error } = await supabase
            .from("haccp_violations")
            .update({ status: "escalated" })
            .eq("id", violationId)
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * تحديث إعدادات HACCP — للأدمن
 */
export async function updateHaccpSettings(payload) {
    try {
        const profile = await getCurrentProfile();
        if (!profile?.is_admin) {
            return { success: false, error: "Only admins can update settings" };
        }

        const { data, error } = await supabase
            .from("haccp_settings")
            .update({
                ...payload,
                updated_at: new Date().toISOString(),
                updated_by: profile.id,
            })
            .eq("id", 1)
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * هل يمكن تسليم هذا الطلب الآن؟
 * يمنع التسليم إذا كانت هناك مخالفة حرجة مفتوحة على الطلب
 * (بند 7 + بند 9 من الوثيقة)
 */
export async function canDeliverOrder(orderId) {
    try {
        if (!orderId) return { success: false, error: "orderId required" };

        const { data: settings } = await fetchHaccpSettings();
        const blockOnCritical = settings?.block_delivery_on_open_critical ?? true;

        // إذا الحجب معطّل → سماح دائم
        if (!blockOnCritical) {
            return { success: true, data: { allowed: true, reasons: [], violations: [] } };
        }

        // البحث عن مخالفات مفتوحة على هذا الطلب
        const { data: violations, error } = await supabase
            .from("haccp_violations")
            .select("id, violation_type, severity, status, created_at")
            .eq("order_id", orderId)
            .in("status", ["pending", "escalated"]);

        if (error) return { success: false, error: error.message };

        const blocking = (violations || []).filter(
            (v) => v.severity === "critical"
        );

        const reasons = blocking.map(
            (v) => `${v.violation_type} (${v.severity})`
        );

        return {
            success: true,
            data: {
                allowed: blocking.length === 0,
                reasons,
                violations: violations || [],
            },
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
/* ══════════════════════════════════════════════════════════
   📖 5.b — جلب سجلات السائق الموحّدة (Timeline)
   ══════════════════════════════════════════════════════════ */

/**
 * يجلب كل سجلات السائق من الجداول الستة ويدمجها في مصفوفة موحّدة
 * RLS يضمن رؤية سجلاته فقط
 */
export async function fetchMyRecords({ dateFrom = null, dateTo = null } = {}) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const [vehicles, temps, cleanings, products, coolings, violations] =
            await Promise.all([
                supabase
                    .from("haccp_vehicle_checks")
                    .select("*")
                    .eq("driver_id", driverId)
                    .order("check_date", { ascending: false })
                    .limit(200),

                supabase
                    .from("haccp_temperature_logs")
                    .select("*, category:haccp_thermal_categories(label_de, min_temp, max_temp)")
                    .eq("driver_id", driverId)
                    .order("measured_at", { ascending: false })
                    .limit(200),

                supabase
                    .from("haccp_cleaning_logs")
                    .select("*")
                    .eq("driver_id", driverId)
                    .order("cleaned_at", { ascending: false })
                    .limit(200),

                supabase
                    .from("haccp_product_checks")
                    .select("*, order:orders(order_number)")
                    .eq("driver_id", driverId)
                    .order("checked_at", { ascending: false })
                    .limit(200),

                supabase
                    .from("haccp_cooling_equipment_checks")
                    .select("*")
                    .eq("driver_id", driverId)
                    .order("checked_at", { ascending: false })
                    .limit(200),

                supabase
                    .from("haccp_violations")
                    .select("*, order:orders(order_number)")
                    .eq("driver_id", driverId)
                    .order("created_at", { ascending: false })
                    .limit(200),
            ]);

        const firstErr =
            vehicles.error || temps.error || cleanings.error ||
            products.error || coolings.error || violations.error;
        if (firstErr) return { success: false, error: firstErr.message };

        /* ═══ Normalize each table → unified shape ═══ */
        const normalized = [
            ...(vehicles.data || []).map((r) => ({
                id: r.id,
                type: "vehicle_check",
                status: r.overall_status,
                timestamp: r.check_date,
                title: r.vehicle_number ? `Kennzeichen ${r.vehicle_number}` : "Fahrzeugcheck",
                subtitle: r.notes || null,
                raw: r,
            })),

            ...(temps.data || []).map((r) => ({
                id: r.id,
                type: "temperature",
                status: r.check_status,
                timestamp: r.measured_at,
                title: `${r.box_number} · ${r.category?.label_de || r.product_type || "—"}`,
                subtitle: `Ist: ${Number(r.actual_temp).toFixed(1)} °C · Soll: ${Number(r.required_temp).toFixed(1)} °C`,
                raw: r,
            })),

            ...(cleanings.data || []).map((r) => ({
                id: r.id,
                type: "cleaning",
                status: r.result,
                timestamp: r.cleaned_at,
                title: r.equipment_name,
                subtitle: r.cleaning_method,
                raw: r,
            })),

            ...(products.data || []).map((r) => ({
                id: r.id,
                type: "product_check",
                status: r.overall_status,
                timestamp: r.checked_at,
                title: `Bestellung #${r.order?.order_number || "—"}`,
                subtitle: r.notes || null,
                raw: r,
            })),

            ...(coolings.data || []).map((r) => ({
                id: r.id,
                type: "cooling_check",
                status: r.overall_status,
                timestamp: r.checked_at,
                title: `Box ${r.box_number}${r.round_number ? ` · ${r.round_number}` : ""}`,
                subtitle: r.notes || null,
                raw: r,
            })),

            ...(violations.data || []).map((r) => ({
                id: r.id,
                type: "violation",
                status: r.status,
                severity: r.severity,
                timestamp: r.created_at,
                title: r.violation_type,
                subtitle:
                    r.order?.order_number
                        ? `Bestellung #${r.order.order_number}`
                        : r.corrective_action_taken || null,
                raw: r,
            })),
        ];

        /* ═══ فلترة زمنية (client-side) ═══ */
        let filtered = normalized;
        if (dateFrom) {
            filtered = filtered.filter(
                (r) => new Date(r.timestamp) >= new Date(dateFrom)
            );
        }
        if (dateTo) {
            filtered = filtered.filter(
                (r) => new Date(r.timestamp) <= new Date(dateTo)
            );
        }

        /* ═══ ترتيب تنازلي ═══ */
        filtered.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        return { success: true, data: filtered };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
/* ══════════════════════════════════════════════════════════
   👨‍💼 6.b — للأدمن: جلب كل السجلات
   ══════════════════════════════════════════════════════════ */

/**
 * يجلب كل سجلات HACCP لجميع السائقين مع معلومات السائق
 * RLS يسمح للأدمن برؤية الكل
 */
export async function fetchAllRecordsForAdmin({
    driverId = null,
    dateFrom = null,
    dateTo = null,
    type = null,
} = {}) {
    try {
        const profile = await getCurrentProfile();
        if (!profile?.is_admin) {
            return { success: false, error: "Only admins can access this" };
        }

        const wantsType = (t) => !type || type === "all" || type === t;

        const promises = [];

        if (wantsType("vehicle_check")) {
            let q = supabase
                .from("haccp_vehicle_checks")
                .select("*")
                .order("check_date", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("check_date", dateFrom);
            if (dateTo) q = q.lte("check_date", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "vehicle_check" })));
        }

        if (wantsType("temperature")) {
            let q = supabase
                .from("haccp_temperature_logs")
                .select("*, category:haccp_thermal_categories(label_de, min_temp, max_temp)")
                .order("measured_at", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("measured_at", dateFrom);
            if (dateTo) q = q.lte("measured_at", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "temperature" })));
        }

        if (wantsType("cleaning")) {
            let q = supabase
                .from("haccp_cleaning_logs")
                .select("*")
                .order("cleaned_at", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("cleaned_at", dateFrom);
            if (dateTo) q = q.lte("cleaned_at", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "cleaning" })));
        }

        if (wantsType("product_check")) {
            let q = supabase
                .from("haccp_product_checks")
                .select("*, order:orders(order_number)")
                .order("checked_at", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("checked_at", dateFrom);
            if (dateTo) q = q.lte("checked_at", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "product_check" })));
        }

        if (wantsType("cooling_check")) {
            let q = supabase
                .from("haccp_cooling_equipment_checks")
                .select("*")
                .order("checked_at", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("checked_at", dateFrom);
            if (dateTo) q = q.lte("checked_at", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "cooling_check" })));
        }

        if (wantsType("violation")) {
            let q = supabase
                .from("haccp_violations")
                .select("*, order:orders(order_number)")
                .order("created_at", { ascending: false })
                .limit(300);
            if (driverId) q = q.eq("driver_id", driverId);
            if (dateFrom) q = q.gte("created_at", dateFrom);
            if (dateTo) q = q.lte("created_at", dateTo);
            promises.push(q.then((r) => ({ data: r.data, error: r.error, kind: "violation" })));
        }

        const results = await Promise.all(promises);

        const firstErr = results.find((r) => r.error)?.error;
        if (firstErr) return { success: false, error: firstErr.message };

        /* ═══ جلب أسماء السائقين ═══ */
        const driverIds = new Set();
        results.forEach((r) => (r.data || []).forEach((row) => driverIds.add(row.driver_id)));

        const { data: drivers } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", Array.from(driverIds));

        const driverMap = new Map((drivers || []).map((d) => [d.id, d]));

        /* ═══ Normalize ═══ */
        const normalized = [];

        results.forEach(({ data, kind }) => {
            (data || []).forEach((row) => {
                const driver = driverMap.get(row.driver_id) || { name: "—", email: "" };

                if (kind === "vehicle_check") {
                    normalized.push({
                        id: row.id, type: kind, status: row.overall_status,
                        timestamp: row.check_date,
                        title: row.vehicle_number ? `Kennzeichen ${row.vehicle_number}` : "Fahrzeugcheck",
                        subtitle: row.notes || null, driver, raw: row,
                    });
                } else if (kind === "temperature") {
                    normalized.push({
                        id: row.id, type: kind, status: row.check_status,
                        timestamp: row.measured_at,
                        title: `${row.box_number} · ${row.category?.label_de || row.product_type || "—"}`,
                        subtitle: `Ist: ${Number(row.actual_temp).toFixed(1)} °C · Soll: ${Number(row.required_temp).toFixed(1)} °C`,
                        driver, raw: row,
                    });
                } else if (kind === "cleaning") {
                    normalized.push({
                        id: row.id, type: kind, status: row.result,
                        timestamp: row.cleaned_at,
                        title: row.equipment_name,
                        subtitle: row.cleaning_method, driver, raw: row,
                    });
                } else if (kind === "product_check") {
                    normalized.push({
                        id: row.id, type: kind, status: row.overall_status,
                        timestamp: row.checked_at,
                        title: `Bestellung #${row.order?.order_number || "—"}`,
                        subtitle: row.notes || null, driver, raw: row,
                    });
                } else if (kind === "cooling_check") {
                    normalized.push({
                        id: row.id, type: kind, status: row.overall_status,
                        timestamp: row.checked_at,
                        title: `Box ${row.box_number}${row.round_number ? ` · ${row.round_number}` : ""}`,
                        subtitle: row.notes || null, driver, raw: row,
                    });
                } else if (kind === "violation") {
                    normalized.push({
                        id: row.id, type: kind, status: row.status, severity: row.severity,
                        timestamp: row.created_at,
                        title: row.violation_type,
                        subtitle: row.order?.order_number
                            ? `Bestellung #${row.order.order_number}`
                            : row.corrective_action_taken || null,
                        driver, raw: row,
                    });
                }
            });
        });

        normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return { success: true, data: normalized };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * للأدمن: جلب قائمة كل السائقين النشطين للفلترة
 */
export async function fetchAllDriversList() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("role", "driver")
        .order("name");

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

/**
 * للأدمن: إحصائيات سريعة
 */
export async function getHaccpAdminStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
        openViolations,
        criticalPending,
        resolvedWeek,
        totalRecordsWeek,
    ] = await Promise.all([
        supabase.from("haccp_violations").select("*", { count: "exact", head: true }).in("status", ["pending", "escalated"]),
        supabase.from("haccp_violations").select("*", { count: "exact", head: true }).eq("severity", "critical").eq("status", "pending"),
        supabase.from("haccp_violations").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("closed_at", weekAgo),
        supabase.from("haccp_vehicle_checks").select("*", { count: "exact", head: true }).gte("check_date", weekAgo),
    ]);

    return {
        success: true,
        data: {
            openViolations: openViolations.count || 0,
            criticalPending: criticalPending.count || 0,
            resolvedWeek: resolvedWeek.count || 0,
            vehicleChecksWeek: totalRecordsWeek.count || 0,
        },
    };
}