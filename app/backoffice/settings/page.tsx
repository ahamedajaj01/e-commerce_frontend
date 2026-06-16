"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { UserCircle, Key, Shield, User, Lock, Smartphone } from "lucide-react";
import { changePassword } from "@/lib/api/auth";

type GeneralTab = "PROFILE" | "PASSWORD" | "SECURITY";

export default function GeneralSettingsPage() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState<GeneralTab>("PROFILE");

    // Password Change State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handlePasswordChange = async () => {
        if (!token) return;
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await changePassword(token, oldPassword, newPassword);
            setSuccess("Password updated successfully.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.message || "Failed to update password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* TOP COMPACT NAV-BAR */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-px">
                <TabItem
                    active={activeTab === "PROFILE"}
                    onClick={() => setActiveTab("PROFILE")}
                    label="Profile Details"
                />
                <TabItem
                    active={activeTab === "PASSWORD"}
                    onClick={() => setActiveTab("PASSWORD")}
                    label="Password"
                />
                <TabItem
                    active={activeTab === "SECURITY"}
                    onClick={() => setActiveTab("SECURITY")}
                    label="Security"
                />
            </div>

            {/* CONTENT AREA */}
            <div className="pt-4">
                {activeTab === "PROFILE" && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
                        {/* PROFILE INFO */}
                        <section className="space-y-6">
                            <SectionHeader title="Account Information" description="Your platform identity retrieved from the system." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                <Field label="Email Address" value={user?.email || ""} readOnly />
                                <Field label="Phone Number" value={user?.phone_number || ""} readOnly />
                                <Field label="Role" value={user?.role || ""} readOnly />
                            </div>
                        </section>

                        {/* METADATA CARDS */}
                        <section className="space-y-6">
                            <SectionHeader title="Account Metadata" description="System-level lifecycle and authorization details." />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetaCard label="Account Created" value={user?.created_at ? new Date(user.created_at).toLocaleString() : ""} />
                                <MetaCard label="Last Login" value={user?.last_login ? new Date(user.last_login).toLocaleString() : ""} />
                                <MetaCard label="Last Modified" value={user?.updated_at ? new Date(user.updated_at).toLocaleString() : ""} />
                                <MetaCard label="User ID" value={user?.id ? user.id.substring(0, 12) + "..." : ""} />
                                <MetaCard label="Staff Access" value={user?.is_staff ? "Yes" : "No"} variant={user?.is_staff ? "emerald" : "default"} />
                                <MetaCard label="Superuser" value={user?.is_superuser ? "Yes" : "No"} variant={user?.is_superuser ? "emerald" : "default"} />
                                <MetaCard label="Account Active" value={user?.is_active ? "Yes" : "No"} variant={user?.is_active ? "emerald" : "default"} />
                                <MetaCard label="Email Verified" value={user?.is_email_verified ? "Yes" : "No"} variant={user?.is_email_verified ? "emerald" : "default"} />
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "PASSWORD" && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300 max-w-sm">
                        <SectionHeader title="Update Password" description="Ensure your account uses a strong, unique password." />

                        {(error || success) && (
                            <div className={`p-4 rounded-xl border text-center ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                <p className="text-[11px] font-bold uppercase tracking-wider">{error || success}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Field
                                label="Current Password"
                                type="password"
                                placeholder="••••••••"
                                value={oldPassword}
                                onChange={(e: any) => setOldPassword(e.target.value)}
                            />
                            <Field
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e: any) => setNewPassword(e.target.value)}
                            />
                            <Field
                                label="Confirm Security Key"
                                type="password"
                                value={confirmPassword}
                                onChange={(e: any) => setConfirmPassword(e.target.value)}
                            />
                            <div className="pt-4">
                                <Button
                                    className="h-10 text-xs font-bold w-full"
                                    onClick={handlePasswordChange}
                                    loading={isSubmitting}
                                >
                                    Apply New Credentials
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "SECURITY" && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300 max-w-xl">
                        <SectionHeader title="Access Security" description="Configure advanced multi-factor authentication protocols." />
                        <div className="grid gap-3">
                            <SecurityToggle
                                title="App Authenticator (TOTP)"
                                description="Use an app like Google Authenticator or 1Password."
                                active
                            />
                            <SecurityToggle
                                title="Login Alert Records"
                                description="Receive audit emails for every successful administrative login."
                                active
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function TabItem({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all relative ${active ? "text-slate-950" : "text-slate-400 hover:text-slate-600"
                }`}
        >
            {label}
            {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full animate-in fade-in duration-300" />
            )}
        </button>
    );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[10px] text-slate-500 font-medium">{description}</p>
        </div>
    );
}

function Field({ label, value, defaultValue, onChange, type = "text", readOnly = false, placeholder = "" }: any) {
    const isReadOnly = readOnly || (value !== undefined && !onChange);
    const inputProps: any = {
        type,
        onChange,
        readOnly: isReadOnly,
        placeholder,
        className: `w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 outline-none transition-all ${isReadOnly ? "bg-slate-50 text-slate-400 cursor-default" : "focus:border-slate-950"
            }`
    };

    if (value !== undefined) inputProps.value = value;
    else if (defaultValue !== undefined) inputProps.defaultValue = defaultValue;

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</label>
            <input {...inputProps} />
        </div>
    );
}

function MetaCard({ label, value, variant = "default" }: any) {
    return (
        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
            <p className={`text-[11px] font-bold mt-0.5 ${variant === 'emerald' ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function SecurityToggle({ title, description, active = false }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">{title}</p>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">{description}</p>
            </div>
            <div className={`h-5 w-9 rounded-full relative transition-colors ${active ? 'bg-slate-950' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${active ? 'left-5' : 'left-1'}`} />
            </div>
        </div>
    );
}
