import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import "./AdminManagement.css";

// ══════════════════════════════════════════════════════════
// Roles — super_admin مُعرَّف لكن غير قابل للإنشاء/العرض
// ══════════════════════════════════════════════════════════
const ROLES = {
    admin: {
        label: "Admin",
        icon: "🛡️",
        color: "#3b82f6",
        tabLabel: "Admins",
        canCreate: true,
    },
    driver: {
        label: "Driver",
        icon: "🚚",
        color: "#8b5cf6",
        tabLabel: "Drivers",
        canCreate: true,
    },
    tax_collector: {
        label: "Tax Collector",
        icon: "💰",
        color: "#10b981",
        tabLabel: "Tax Collectors",
        canCreate: true,
    },
    data_entry: {
        label: "Data Entry",
        icon: "📊",
        color: "#ec4899",
        tabLabel: "Data Entry",
        canCreate: true,
    },
};

// الأدوار القابلة للإنشاء من الواجهة
const CREATABLE_ROLES = Object.entries(ROLES)
    .filter(([, r]) => r.canCreate)
    .map(([key]) => key);

const MENU_HEIGHT = 210;
const MENU_WIDTH = 240;

const EMPTY_STAFF = {
    email: "",
    password: "",
    name: "",
    phone: "",
    license_number: "",
    vehicle_type: "",
    vehicle_plate: "",
    region: "",
    tax_id: "",
    department: "",
};

// ══════════════════════════════════════════════════════════
// Helper: JWT للـ Edge Functions
// ══════════════════════════════════════════════════════════
async function getAdminHeaders() {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
    };
}

export default function AdminManagement() {
    // ─── Data ───
    const [currentUser, setCurrentUser] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("my-account");

    // ─── Change Password ───
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // ─── Create Staff Modal ───
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [newStaff, setNewStaff] = useState(EMPTY_STAFF);
    const [creating, setCreating] = useState(false);

    // ─── Three-dots Menu (Portal) ───
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    // ─── ConfirmDialog ───
    const [pendingAction, setPendingAction] = useState(null);
    const [actionProcessing, setActionProcessing] = useState(false);

    // ══════════════════════════════════════════════════════════
    // Fetch
    // ══════════════════════════════════════════════════════════
    const fetchData = async () => {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Not authenticated");
                return;
            }
            setCurrentUser(user);

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setCurrentProfile(profile);

            // ✅ سوبر أدمن فقط يمكنه جلب قائمة الموظفين
            if (profile?.is_super_admin) {
                const { data: all } = await supabase
                    .from("profiles")
                    .select("*")
                    .order("created_at", { ascending: true });
                setStaff(all || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ══════════════════════════════════════════════════════════
    // Group staff by role — 🚫 يستثني كل السوبر أدمن
    // ══════════════════════════════════════════════════════════
    const staffByRole = useMemo(() => {
        const groups = {
            admin: [],
            driver: [],
            tax_collector: [],
            data_entry: [],
        };

        staff.forEach((member) => {
            // 🚫 تجاهل السوبر أدمن تمامًا (لا يظهرون لأي أحد)
            if (member.is_super_admin) return;

            const role = member.role || (member.is_admin ? "admin" : null);
            if (role && groups[role]) groups[role].push(member);
        });

        return groups;
    }, [staff]);

    // ══════════════════════════════════════════════════════════
    // Close menu (outside click / scroll / resize)
    // ══════════════════════════════════════════════════════════
    useEffect(() => {
        if (!openMenuId) return;

        const closeMenu = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            setOpenMenuId(null);
        };
        const closeOnScroll = () => setOpenMenuId(null);

        document.addEventListener("mousedown", closeMenu);
        window.addEventListener("scroll", closeOnScroll, true);
        window.addEventListener("resize", closeOnScroll);

        return () => {
            document.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("scroll", closeOnScroll, true);
            window.removeEventListener("resize", closeOnScroll);
        };
    }, [openMenuId]);

    // ══════════════════════════════════════════════════════════
    // Open menu with smart positioning
    // ══════════════════════════════════════════════════════════
    const handleOpenMenu = (e, memberId) => {
        e.stopPropagation();
        if (openMenuId === memberId) {
            setOpenMenuId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward =
            spaceBelow < MENU_HEIGHT + 20 && spaceAbove > MENU_HEIGHT + 20;

        const top = openUpward
            ? rect.top - MENU_HEIGHT - 8
            : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
        );

        setMenuPos({ top, left });
        setOpenMenuId(memberId);
    };

    // ══════════════════════════════════════════════════════════
    // Change Password
    // ══════════════════════════════════════════════════════════
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("Min 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            toast.success("✅ Password updated!");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    // ══════════════════════════════════════════════════════════
    // Create Staff
    // ══════════════════════════════════════════════════════════
    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateStep(1);
        setSelectedRole(null);
        setNewStaff(EMPTY_STAFF);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.email || !newStaff.password) {
            toast.error("Email and password required");
            return;
        }
        if (newStaff.password.length < 8) {
            toast.error("Password min 8 characters");
            return;
        }
        // ✅ حماية إضافية: لا يمكن إنشاء super_admin
        if (!CREATABLE_ROLES.includes(selectedRole)) {
            toast.error("This role cannot be created from here");
            return;
        }

        setCreating(true);
        try {
            const headers = await getAdminHeaders();

            const extraData = {};
            if (selectedRole === "driver") {
                Object.assign(extraData, {
                    phone: newStaff.phone,
                    license_number: newStaff.license_number,
                    vehicle_type: newStaff.vehicle_type,
                    vehicle_plate: newStaff.vehicle_plate,
                });
            } else if (selectedRole === "tax_collector") {
                Object.assign(extraData, {
                    phone: newStaff.phone,
                    region: newStaff.region,
                    tax_id: newStaff.tax_id,
                });
            } else if (selectedRole === "data_entry") {
                Object.assign(extraData, {
                    phone: newStaff.phone,
                    department: newStaff.department,
                });
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        email: newStaff.email,
                        password: newStaff.password,
                        name: newStaff.name,
                        role: selectedRole,
                        extraData,
                    }),
                }
            );

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success(`✅ ${ROLES[selectedRole].label} created!`);
            closeCreateModal();
            fetchData();
        } catch (error) {
            toast.error(error.message || "Failed to create staff");
        } finally {
            setCreating(false);
        }
    };

    // ══════════════════════════════════════════════════════════
    // Member Actions
    // ══════════════════════════════════════════════════════════
    const handleAction = (userId, action, userName) => {
        setOpenMenuId(null);
        setPendingAction({ userId, action, userName });
    };

    const performAction = async () => {
        if (!pendingAction) return;
        const { userId, action, userName } = pendingAction;

        setActionProcessing(true);
        try {
            const headers = await getAdminHeaders();
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-staff`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ targetUserId: userId, action }),
                }
            );

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success(`✅ ${action} — ${userName}`);
            setPendingAction(null);
            fetchData();
        } catch (error) {
            toast.error(error.message);
            setPendingAction(null);
        } finally {
            setActionProcessing(false);
        }
    };

    // ══════════════════════════════════════════════════════════
    // Loading / Access Denied
    // ══════════════════════════════════════════════════════════
    if (loading) {
        return (
            <div className="adm-loading">
                <div className="adm-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    const isSuperAdmin = currentProfile?.is_super_admin;

    if (!isSuperAdmin) {
        return (
            <div className="adm-access-denied">
                <div className="adm-denied-icon">🔒</div>
                <h2>Access Denied</h2>
                <p>Only Super Admins can access this section.</p>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════
    // Tabs Config — 🚫 بدون تبويب Super Admins
    // ══════════════════════════════════════════════════════════
    const tabs = [
        { key: "my-account", label: "My Account", icon: "👤" },
        {
            key: "admin",
            label: "Admins",
            icon: "🛡️",
            count: staffByRole.admin.length,
        },
        {
            key: "driver",
            label: "Drivers",
            icon: "🚚",
            count: staffByRole.driver.length,
        },
        {
            key: "tax_collector",
            label: "Tax Collectors",
            icon: "💰",
            count: staffByRole.tax_collector.length,
        },
        {
            key: "data_entry",
            label: "Data Entry",
            icon: "📊",
            count: staffByRole.data_entry.length,
        },
    ];

    // ══════════════════════════════════════════════════════════
    // Action Config for ConfirmDialog
    // ══════════════════════════════════════════════════════════
    const getActionConfig = () => {
        if (!pendingAction) return null;
        const { action, userName } = pendingAction;

        const configs = {
            activate: {
                title: `Activate ${userName}?`,
                message: "The staff member will regain access.",
                variant: "default",
                icon: "check_circle",
                confirmLabel: "Activate",
            },
            deactivate: {
                title: `Deactivate ${userName}?`,
                message: "The staff member will lose access immediately.",
                variant: "warning",
                icon: "block",
                confirmLabel: "Deactivate",
            },
            delete: {
                title: `Delete ${userName}?`,
                message:
                    "⚠️ This action cannot be undone. The account will be permanently deleted.",
                variant: "danger",
                icon: "delete",
                confirmLabel: "Delete permanently",
            },
        };

        return configs[action] || null;
    };

    const actionConfig = getActionConfig();
    const currentMember = staff.find((s) => s.id === openMenuId);

    // ✅ هل يمكن تعديل هذا العضو؟
    // - لا تعدّل نفسك
    // - 🚫 لا تعدّل أي سوبر أدمن
    const canModify = (member) => {
        if (!member) return false;
        if (member.id === currentUser?.id) return false;
        if (member.is_super_admin) return false;
        return true;
    };

    // ══════════════════════════════════════════════════════════
    // Render
    // ══════════════════════════════════════════════════════════
    return (
        <div className="adm-page">
            {/* ═══ Header ═══ */}
            <header className="adm-header">
                <div>
                    <h2>🛡️ Staff Management</h2>
                    <p>Manage your account and team members by role</p>
                </div>
                <span className="adm-super-badge">⭐ Super Admin</span>
            </header>

            {/* ═══ Tabs ═══ */}
            <nav className="adm-tabs" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        className={`adm-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span className="adm-tab-icon">{tab.icon}</span>
                        <span className="adm-tab-label">{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className="adm-tab-count">{tab.count}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* ═══════════════════════════════════════════════════════
          Tab: My Account
      ═══════════════════════════════════════════════════════ */}
            {activeTab === "my-account" && (
                <div className="adm-content">
                    <section className="adm-card">
                        <div className="adm-card-header">
                            <span className="material-symbols-outlined">account_circle</span>
                            <h3>Profile Information</h3>
                        </div>

                        <div className="adm-info-row">
                            <span className="adm-info-label">Name</span>
                            <span className="adm-info-value">
                                {currentProfile?.name || "Admin"}
                            </span>
                        </div>
                        <div className="adm-info-row">
                            <span className="adm-info-label">Email</span>
                            <span className="adm-info-value">{currentUser?.email}</span>
                        </div>
                        <div className="adm-info-row">
                            <span className="adm-info-label">Role</span>
                            <span className="adm-info-value">
                                <span className="adm-role super">⭐ Super Admin</span>
                            </span>
                        </div>
                    </section>

                    <section className="adm-card">
                        <div className="adm-card-header">
                            <span className="material-symbols-outlined">lock_reset</span>
                            <h3>Change Password</h3>
                        </div>

                        <form onSubmit={handleChangePassword} className="adm-form">
                            <div className="adm-field">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="adm-field">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <button
                                type="submit"
                                className="adm-btn primary"
                                disabled={changingPassword}
                            >
                                <span className="material-symbols-outlined">
                                    {changingPassword ? "hourglass_top" : "check"}
                                </span>
                                {changingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </section>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
          Tab: Staff by Role
      ═══════════════════════════════════════════════════════ */}
            {activeTab !== "my-account" && ROLES[activeTab] && (
                <div className="adm-content">
                    {/* Actions Bar */}
                    <div className="adm-actions-bar">
                        <p>
                            <strong>{staffByRole[activeTab].length}</strong>{" "}
                            {staffByRole[activeTab].length === 1 ? "member" : "members"}{" "}
                            in {ROLES[activeTab].tabLabel}
                        </p>

                        {ROLES[activeTab].canCreate && (
                            <button
                                className="adm-btn primary"
                                onClick={() => {
                                    setSelectedRole(activeTab);
                                    setShowCreateModal(true);
                                    setCreateStep(2);
                                }}
                            >
                                <span className="material-symbols-outlined">person_add</span>
                                <span className="adm-btn-label">
                                    Add {ROLES[activeTab].label}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* List or Empty */}
                    {staffByRole[activeTab].length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">{ROLES[activeTab].icon}</div>
                            <h3>No {ROLES[activeTab].tabLabel} yet</h3>
                            <p>
                                {ROLES[activeTab].canCreate
                                    ? `Click "Add ${ROLES[activeTab].label}" to create the first one.`
                                    : "This role is managed externally."}
                            </p>
                        </div>
                    ) : (
                        <section className="adm-card">
                            <div className="adm-card-header">
                                <span className="material-symbols-outlined">group</span>
                                <h3>
                                    {ROLES[activeTab].tabLabel} (
                                    {staffByRole[activeTab].length})
                                </h3>
                            </div>

                            <div className="adm-list">
                                {staffByRole[activeTab].map((member) => {
                                    const isSelf = member.id === currentUser?.id;
                                    const isActive = member.is_active !== false;
                                    const roleData = ROLES[member.role] || ROLES.admin;
                                    const canEdit = canModify(member);

                                    return (
                                        <div
                                            key={member.id}
                                            className={`adm-list-item ${!isActive ? "is-inactive" : ""
                                                }`}
                                        >
                                            <div
                                                className="adm-list-avatar"
                                                style={{
                                                    background: `linear-gradient(135deg, ${roleData.color}, #0f4a3b)`,
                                                }}
                                            >
                                                {member.name?.[0]?.toUpperCase() || "?"}
                                            </div>

                                            <div className="adm-list-info">
                                                <div className="adm-list-name">
                                                    <span className="adm-list-name-text">
                                                        {member.name || "Staff"}
                                                    </span>
                                                    {isSelf && (
                                                        <span className="adm-self-badge">You</span>
                                                    )}
                                                    {!isActive && (
                                                        <span className="adm-inactive-badge">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="adm-list-email">{member.email}</div>
                                            </div>

                                            <div className="adm-list-role">
                                                <span
                                                    className="adm-role-badge"
                                                    style={{
                                                        background: `${roleData.color}20`,
                                                        color: roleData.color,
                                                    }}
                                                >
                                                    {roleData.icon} {roleData.label}
                                                </span>
                                            </div>

                                            <div className="adm-list-actions">
                                                {isSelf ? (
                                                    <span className="adm-hint">Your account</span>
                                                ) : !canEdit ? (
                                                    <span className="adm-hint adm-hint-locked">
                                                        <span className="material-symbols-outlined">
                                                            lock
                                                        </span>
                                                        Protected
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="adm-menu-btn"
                                                        onClick={(e) => handleOpenMenu(e, member.id)}
                                                        aria-label="Member actions"
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            more_vert
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
          Portal-based 3-dot Menu
      ═══════════════════════════════════════════════════════ */}
            {openMenuId &&
                currentMember &&
                canModify(currentMember) &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="adm-menu-fixed"
                        style={{ top: menuPos.top, left: menuPos.left }}
                        role="menu"
                    >
                        {currentMember.is_active !== false ? (
                            <button
                                type="button"
                                role="menuitem"
                                className="adm-menu-item warning"
                                onClick={() =>
                                    handleAction(
                                        currentMember.id,
                                        "deactivate",
                                        currentMember.name
                                    )
                                }
                            >
                                <span className="material-symbols-outlined">block</span>
                                Deactivate
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="menuitem"
                                className="adm-menu-item"
                                onClick={() =>
                                    handleAction(
                                        currentMember.id,
                                        "activate",
                                        currentMember.name
                                    )
                                }
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Activate
                            </button>
                        )}

                        <div className="adm-menu-divider" />

                        <button
                            type="button"
                            role="menuitem"
                            className="adm-menu-item danger"
                            onClick={() =>
                                handleAction(currentMember.id, "delete", currentMember.name)
                            }
                        >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Account
                        </button>
                    </div>,
                    document.body
                )}

            {/* ═══════════════════════════════════════════════════════
          Create Staff Modal
      ═══════════════════════════════════════════════════════ */}
            {showCreateModal && (
                <div className="adm-modal-overlay" onClick={closeCreateModal}>
                    <div
                        className="adm-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <header className="adm-modal-header">
                            <h3>
                                {createStep === 1
                                    ? "Choose Role"
                                    : `Create ${ROLES[selectedRole]?.label}`}
                            </h3>
                            <button
                                type="button"
                                className="adm-modal-close"
                                onClick={closeCreateModal}
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>

                        {/* Step 1 — Role Grid */}
                        {createStep === 1 && (
                            <div className="adm-modal-body">
                                <p className="adm-modal-hint">
                                    Choose the role for the new staff member.
                                </p>

                                <div className="adm-role-grid">
                                    {CREATABLE_ROLES.map((key) => {
                                        const data = ROLES[key];
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className="adm-role-card"
                                                onClick={() => {
                                                    setSelectedRole(key);
                                                    setCreateStep(2);
                                                }}
                                                style={{ "--role-color": data.color }}
                                            >
                                                <div
                                                    className="adm-role-icon"
                                                    style={{ background: data.color }}
                                                >
                                                    {data.icon}
                                                </div>
                                                <span className="adm-role-label">{data.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 2 — Form */}
                        {createStep === 2 && (
                            <form onSubmit={handleCreateStaff} className="adm-modal-body">
                                <div className="adm-field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={newStaff.name}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, name: e.target.value })
                                        }
                                        placeholder="e.g., Ahmed Mohamed"
                                    />
                                </div>

                                <div className="adm-field">
                                    <label>
                                        Email <span className="adm-required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={newStaff.email}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, email: e.target.value })
                                        }
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>

                                <div className="adm-field">
                                    <label>
                                        Password <span className="adm-required">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={newStaff.password}
                                        onChange={(e) =>
                                            setNewStaff({ ...newStaff, password: e.target.value })
                                        }
                                        placeholder="At least 8 characters"
                                        required
                                        minLength={8}
                                    />
                                </div>

                                {["driver", "tax_collector", "data_entry"].includes(
                                    selectedRole
                                ) && (
                                        <div className="adm-field">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                value={newStaff.phone}
                                                onChange={(e) =>
                                                    setNewStaff({ ...newStaff, phone: e.target.value })
                                                }
                                                placeholder="+49..."
                                            />
                                        </div>
                                    )}

                                {selectedRole === "driver" && (
                                    <>
                                        <div className="adm-field">
                                            <label>License Number</label>
                                            <input
                                                type="text"
                                                value={newStaff.license_number}
                                                onChange={(e) =>
                                                    setNewStaff({
                                                        ...newStaff,
                                                        license_number: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="adm-field-row">
                                            <div className="adm-field">
                                                <label>Vehicle Type</label>
                                                <input
                                                    type="text"
                                                    value={newStaff.vehicle_type}
                                                    onChange={(e) =>
                                                        setNewStaff({
                                                            ...newStaff,
                                                            vehicle_type: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Van / Car"
                                                />
                                            </div>
                                            <div className="adm-field">
                                                <label>Plate</label>
                                                <input
                                                    type="text"
                                                    value={newStaff.vehicle_plate}
                                                    onChange={(e) =>
                                                        setNewStaff({
                                                            ...newStaff,
                                                            vehicle_plate: e.target.value,
                                                        })
                                                    }
                                                    placeholder="B-XX-1234"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedRole === "tax_collector" && (
                                    <>
                                        <div className="adm-field">
                                            <label>Region</label>
                                            <input
                                                type="text"
                                                value={newStaff.region}
                                                onChange={(e) =>
                                                    setNewStaff({
                                                        ...newStaff,
                                                        region: e.target.value,
                                                    })
                                                }
                                                placeholder="e.g., Berlin-Mitte"
                                            />
                                        </div>
                                        <div className="adm-field">
                                            <label>Tax ID</label>
                                            <input
                                                type="text"
                                                value={newStaff.tax_id}
                                                onChange={(e) =>
                                                    setNewStaff({
                                                        ...newStaff,
                                                        tax_id: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedRole === "data_entry" && (
                                    <div className="adm-field">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={newStaff.department}
                                            onChange={(e) =>
                                                setNewStaff({
                                                    ...newStaff,
                                                    department: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Products"
                                        />
                                    </div>
                                )}

                                <div className="adm-modal-actions">
                                    <button
                                        type="button"
                                        className="adm-btn secondary"
                                        onClick={() => setCreateStep(1)}
                                        disabled={creating}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="adm-btn primary"
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <>
                                                <span className="adm-btn-spinner" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════
          Confirm Dialog
      ═══════════════════════════════════════════════════════ */}
            {pendingAction && actionConfig && (
                <ConfirmDialog
                    isOpen={true}
                    title={actionConfig.title}
                    message={actionConfig.message}
                    variant={actionConfig.variant}
                    icon={actionConfig.icon}
                    confirmLabel={actionConfig.confirmLabel}
                    cancelLabel="Cancel"
                    isLoading={actionProcessing}
                    onConfirm={performAction}
                    onCancel={() => setPendingAction(null)}
                />
            )}
        </div>
    );
}