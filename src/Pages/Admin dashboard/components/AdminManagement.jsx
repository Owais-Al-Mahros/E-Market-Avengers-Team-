import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import "./AdminManagement.css";

const ROLES = {
    admin: { label: "Admin", icon: "🛡️", color: "#3b82f6", tabLabel: "Admins" },
    super_admin: { label: "Super Admin", icon: "👑", color: "#f59e0b", tabLabel: "Super Admins" },
    driver: { label: "Driver", icon: "🚚", color: "#8b5cf6", tabLabel: "Drivers" },
    tax_collector: { label: "Tax Collector", icon: "💰", color: "#10b981", tabLabel: "Tax Collectors" },
    data_entry: { label: "Data Entry", icon: "📊", color: "#ec4899", tabLabel: "Data Entry" },
};

const MENU_HEIGHT = 210;
const MENU_WIDTH = 240;

export default function AdminManagement() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("my-account");

    // Change password
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // Create staff modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [newStaff, setNewStaff] = useState({
        email: "", password: "", name: "", phone: "",
        license_number: "", vehicle_type: "", vehicle_plate: "",
        region: "", tax_id: "", department: "",
    });
    const [creating, setCreating] = useState(false);

    // Three-dots menu
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    // ===== Fetch Data =====
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error("Not authenticated"); return; }
            setCurrentUser(user);

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setCurrentProfile(profile);

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

    useEffect(() => { fetchData(); }, []);

    // ===== Group staff by role =====
    const staffByRole = useMemo(() => {
        const groups = { super_admin: [], admin: [], driver: [], tax_collector: [], data_entry: [] };
        staff.forEach((member) => {
            const role = member.role || (member.is_super_admin ? "super_admin" : member.is_admin ? "admin" : null);
            if (role && groups[role]) {
                groups[role].push(member);
            }
        });
        return groups;
    }, [staff]);

    // ===== Close menu =====
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

    // ===== Open menu =====
    const handleOpenMenu = (e, memberId) => {
        e.stopPropagation();
        if (openMenuId === memberId) { setOpenMenuId(null); return; }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < MENU_HEIGHT + 20 && spaceAbove > MENU_HEIGHT + 20;

        const top = openUpward ? rect.top - MENU_HEIGHT - 8 : rect.bottom + 8;
        const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));

        setMenuPos({ top, left });
        setOpenMenuId(memberId);
    };

    // ===== Change Password =====
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { toast.error("Min 8 characters"); return; }
        if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success("✅ Password updated!");
            setNewPassword(""); setConfirmPassword("");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    // ===== Create Staff =====
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.email || !newStaff.password) { toast.error("Email and password required"); return; }
        if (newStaff.password.length < 8) { toast.error("Password min 8 characters"); return; }

        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const extraData = {};
            if (selectedRole === "driver") {
                extraData.phone = newStaff.phone;
                extraData.license_number = newStaff.license_number;
                extraData.vehicle_type = newStaff.vehicle_type;
                extraData.vehicle_plate = newStaff.vehicle_plate;
            } else if (selectedRole === "tax_collector") {
                extraData.phone = newStaff.phone;
                extraData.region = newStaff.region;
                extraData.tax_id = newStaff.tax_id;
            } else if (selectedRole === "data_entry") {
                extraData.phone = newStaff.phone;
                extraData.department = newStaff.department;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        email: newStaff.email, password: newStaff.password,
                        name: newStaff.name, role: selectedRole, extraData,
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

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateStep(1);
        setSelectedRole(null);
        setNewStaff({
            email: "", password: "", name: "", phone: "",
            license_number: "", vehicle_type: "", vehicle_plate: "",
            region: "", tax_id: "", department: "",
        });
    };

    // ===== Update Staff =====
    const handleAction = async (userId, action, userName) => {
        const messages = {
            activate: `Activate ${userName}?`,
            deactivate: `Deactivate ${userName}?`,
            promote: `Promote ${userName} to Super Admin?`,
            demote: `Remove Super Admin from ${userName}?`,
            delete: `⚠️ Permanently DELETE ${userName}? This cannot be undone!`,
        };
        if (!window.confirm(messages[action])) return;

        setOpenMenuId(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-staff`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ targetUserId: userId, action }),
                }
            );

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success("✅ Done!");
            fetchData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ===== Render =====
    if (loading) {
        return (
            <div className="adm-loading">
                <div className="adm-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    const isSuperAdmin = currentProfile?.is_super_admin;

    // ✅ حماية: فقط السوبر آدمن يمكنه الوصول
    if (!isSuperAdmin) {
        return (
            <div className="adm-access-denied">
                <div className="adm-denied-icon">🔒</div>
                <h2>Access Denied</h2>
                <p>Only Super Admins can access this section.</p>
            </div>
        );
    }

    const currentMember = staff.find((s) => s.id === openMenuId);

    // ===== Tabs Config =====
    const tabs = [
        { key: "my-account", label: "My Account", icon: "👤" },
        ...(isSuperAdmin
            ? [
                { key: "super_admin", label: "Super Admins", icon: "👑", count: staffByRole.super_admin.length },
                { key: "admin", label: "Admins", icon: "🛡️", count: staffByRole.admin.length },
                { key: "driver", label: "Drivers", icon: "🚚", count: staffByRole.driver.length },
                { key: "tax_collector", label: "Tax Collectors", icon: "💰", count: staffByRole.tax_collector.length },
                { key: "data_entry", label: "Data Entry", icon: "📊", count: staffByRole.data_entry.length },
            ]
            : []),
    ];

    return (
        <div className="adm-page">
            {/* Header */}
            <div className="adm-header">
                <div>
                    <h2>🛡️ Staff Management</h2>
                    <p>Manage your account and team members by role</p>
                </div>
                {isSuperAdmin && <span className="adm-super-badge">⭐ Super Admin</span>}
            </div>

            {/* Tabs */}
            <div className="adm-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`adm-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className="adm-tab-count">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ===== Tab: My Account ===== */}
            {activeTab === "my-account" && (
                <div className="adm-content">
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <span className="material-symbols-outlined">account_circle</span>
                            <h3>Profile Information</h3>
                        </div>
                        <div className="adm-info-row">
                            <span className="adm-info-label">Name</span>
                            <span className="adm-info-value">{currentProfile?.name || "Admin"}</span>
                        </div>
                        <div className="adm-info-row">
                            <span className="adm-info-label">Email</span>
                            <span className="adm-info-value">{currentUser?.email}</span>
                        </div>
                        <div className="adm-info-row">
                            <span className="adm-info-label">Role</span>
                            <span className="adm-info-value">
                                {isSuperAdmin ? (
                                    <span className="adm-role super">⭐ Super Admin</span>
                                ) : (
                                    <span className="adm-role regular">🛡️ Admin</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="adm-card">
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
                                />
                            </div>
                            <button type="submit" className="adm-btn primary" disabled={changingPassword}>
                                {changingPassword ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Tab: Staff Role ===== */}
            {isSuperAdmin && activeTab !== "my-account" && ROLES[activeTab] && (
                <div className="adm-content">
                    <div className="adm-actions-bar">
                        <p>
                            <strong>{staffByRole[activeTab].length}</strong>{" "}
                            {staffByRole[activeTab].length === 1 ? "member" : "members"} in{" "}
                            {ROLES[activeTab].tabLabel}
                        </p>
                        <button
                            className="adm-btn primary"
                            onClick={() => {
                                setSelectedRole(activeTab);
                                setShowCreateModal(true);
                                setCreateStep(2);
                            }}
                        >
                            <span className="material-symbols-outlined">person_add</span>
                            Add {ROLES[activeTab].label}
                        </button>
                    </div>

                    {staffByRole[activeTab].length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">{ROLES[activeTab].icon}</div>
                            <h3>No {ROLES[activeTab].tabLabel} yet</h3>
                            <p>Click "Add {ROLES[activeTab].label}" to create the first one.</p>
                        </div>
                    ) : (
                        <div className="adm-card">
                            <div className="adm-card-header">
                                <span className="material-symbols-outlined">group</span>
                                <h3>{ROLES[activeTab].tabLabel} ({staffByRole[activeTab].length})</h3>
                            </div>

                            <div className="adm-list">
                                {staffByRole[activeTab].map((member) => {
                                    const isSelf = member.id === currentUser?.id;
                                    const isSuper = member.is_super_admin;
                                    const isActive = member.is_active !== false;
                                    const roleData = ROLES[member.role] || ROLES.admin;

                                    return (
                                        <div
                                            key={member.id}
                                            className={`adm-list-item ${!isActive ? "inactive" : ""}`}
                                        >
                                            <div
                                                className="adm-list-avatar"
                                                style={{ background: `linear-gradient(135deg, ${roleData.color}, #0f4a3b)` }}
                                            >
                                                {member.name?.[0]?.toUpperCase() || "?"}
                                            </div>

                                            <div className="adm-list-info">
                                                <div className="adm-list-name">
                                                    {member.name || "Staff"}
                                                    {isSelf && <span className="adm-self-badge">You</span>}
                                                    {!isActive && <span className="adm-inactive-badge">Inactive</span>}
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
                                                ) : isSuper && activeTab !== "super_admin" ? (
                                                    <span className="adm-hint">Protected</span>
                                                ) : (
                                                    <button
                                                        className="adm-menu-btn"
                                                        onClick={(e) => handleOpenMenu(e, member.id)}
                                                    >
                                                        <span className="material-symbols-outlined">more_vert</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Portal-based Menu */}
            {openMenuId && currentMember &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="adm-menu-fixed"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        {currentMember.is_active !== false ? (
                            <button
                                className="adm-menu-item"
                                onClick={() => handleAction(currentMember.id, "deactivate", currentMember.name)}
                            >
                                <span className="material-symbols-outlined">block</span>
                                Deactivate
                            </button>
                        ) : (
                            <button
                                className="adm-menu-item"
                                onClick={() => handleAction(currentMember.id, "activate", currentMember.name)}
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Activate
                            </button>
                        )}

                        {!currentMember.is_super_admin ? (
                            <button
                                className="adm-menu-item promote"
                                onClick={() => handleAction(currentMember.id, "promote", currentMember.name)}
                            >
                                <span className="material-symbols-outlined">star</span>
                                Promote to Super Admin
                            </button>
                        ) : (
                            <button
                                className="adm-menu-item demote"
                                onClick={() => handleAction(currentMember.id, "demote", currentMember.name)}
                            >
                                <span className="material-symbols-outlined">star_border</span>
                                Remove Super Admin
                            </button>
                        )}

                        <div className="adm-menu-divider" />

                        <button
                            className="adm-menu-item danger"
                            onClick={() => handleAction(currentMember.id, "delete", currentMember.name)}
                        >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Account
                        </button>
                    </div>,
                    document.body
                )}

            {/* ===== Create Modal ===== */}
            {showCreateModal && (
                <div className="adm-modal-overlay" onClick={closeCreateModal}>
                    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="adm-modal-header">
                            <h3>
                                {createStep === 1
                                    ? "Choose Role"
                                    : `Create ${ROLES[selectedRole]?.label}`}
                            </h3>
                            <button className="adm-modal-close" onClick={closeCreateModal}>✕</button>
                        </div>

                        {createStep === 1 && (
                            <div className="adm-modal-body">
                                <div className="adm-role-grid">
                                    {Object.entries(ROLES).map(([key, data]) => (
                                        <button
                                            key={key}
                                            className="adm-role-card"
                                            onClick={() => { setSelectedRole(key); setCreateStep(2); }}
                                            style={{ borderColor: data.color }}
                                        >
                                            <div className="adm-role-icon" style={{ background: data.color }}>
                                                {data.icon}
                                            </div>
                                            <span className="adm-role-label">{data.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {createStep === 2 && (
                            <form onSubmit={handleCreateStaff} className="adm-modal-body">
                                <div className="adm-field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                        placeholder="e.g., Ahmed Mohamed"
                                    />
                                </div>

                                <div className="adm-field">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>

                                <div className="adm-field">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        placeholder="At least 8 characters"
                                        required
                                    />
                                </div>

                                {(selectedRole === "driver" ||
                                    selectedRole === "tax_collector" ||
                                    selectedRole === "data_entry") && (
                                        <div className="adm-field">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                value={newStaff.phone}
                                                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
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
                                                onChange={(e) => setNewStaff({ ...newStaff, license_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="adm-field-row">
                                            <div className="adm-field">
                                                <label>Vehicle Type</label>
                                                <input
                                                    type="text"
                                                    value={newStaff.vehicle_type}
                                                    onChange={(e) => setNewStaff({ ...newStaff, vehicle_type: e.target.value })}
                                                    placeholder="Van / Car"
                                                />
                                            </div>
                                            <div className="adm-field">
                                                <label>Plate</label>
                                                <input
                                                    type="text"
                                                    value={newStaff.vehicle_plate}
                                                    onChange={(e) => setNewStaff({ ...newStaff, vehicle_plate: e.target.value })}
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
                                                onChange={(e) => setNewStaff({ ...newStaff, region: e.target.value })}
                                                placeholder="e.g., Berlin-Mitte"
                                            />
                                        </div>
                                        <div className="adm-field">
                                            <label>Tax ID</label>
                                            <input
                                                type="text"
                                                value={newStaff.tax_id}
                                                onChange={(e) => setNewStaff({ ...newStaff, tax_id: e.target.value })}
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
                                            onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                                            placeholder="e.g., Products"
                                        />
                                    </div>
                                )}

                                <div className="adm-modal-actions">
                                    <button type="button" className="adm-btn secondary" onClick={() => setCreateStep(1)}>
                                        ← Back
                                    </button>
                                    <button type="submit" className="adm-btn primary" disabled={creating}>
                                        {creating ? "Creating..." : "Create Account"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}