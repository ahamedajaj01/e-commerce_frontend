"use client";

import { useEffect, useState, useMemo } from "react";
import {
    fetchShippingRules,
    createShippingRule,
    updateShippingRule,
    deleteShippingRule,
    toggleShippingRule,
} from "@/lib/api/shipping";
import type { ShippingRule, CreateShippingRule } from "@/types/shipping";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/providers/ModalProvider";
import { Button } from "@/components/ui/Button";
import {
    Trash2,
    Pencil,
    Search,
    Plus,
    X,
    Loader2,
    ChevronDown,
    AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateShippingRule = {
    title: "",
    province: "",
    district: "",
    city_or_municipality: "",
    shipping_fee: 0,
    transit_days_min: 0,
    transit_days_max: 0,
    estimated_days: "",
    is_default: false,
    is_active: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"
                    }`}
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function DefaultBadge() {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Default
        </span>
    );
}

function CoverageCell({ rule }: { rule: ShippingRule }) {
    if (rule.is_default) {
        return <span className="text-slate-500 text-sm">All remaining areas</span>;
    }
    const parts = [rule.province, rule.district, rule.city_or_municipality].filter(Boolean);
    if (parts.length === 0) return <span className="text-slate-400 text-sm">—</span>;
    return (
        <span className="text-slate-700 text-sm">
            {parts.join(" › ")}
        </span>
    );
}

// ─── Field component for the modal form ──────────────────────────────────────

function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const INPUT =
    "w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition placeholder:text-slate-300";

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-slate-900" : "bg-slate-200"
                }`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowActions({
    rule,
    togglingId,
    onEdit,
    onDelete,
    onToggle,
}: {
    rule: ShippingRule;
    togglingId: string | null;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative flex items-center justify-end gap-1">
            <button
                onClick={onEdit}
                title="Edit"
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
                <button
                    onClick={() => setOpen((v) => !v)}
                    title="More actions"
                    className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-0.5"
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {open && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-md shadow-lg z-20 py-1 text-sm">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onToggle();
                                }}
                                disabled={togglingId === rule.id}
                                className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                            >
                                {togglingId === rule.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                ) : null}
                                {rule.is_active ? "Disable" : "Enable"}
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onDelete();
                                }}
                                className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShippingDeliveryPage() {
    const { token } = useAuth();
    const { confirm } = useModal();
    const [rules, setRules] = useState<ShippingRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateShippingRule>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);

    // ─── Data ────────────────────────────────────────────────────────────────

    const loadRules = async () => {
        setIsLoading(true);
        try {
            const data = await fetchShippingRules(token ?? undefined);
            setRules(data);
        } catch {
            setRules([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, [token]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData({ ...EMPTY_FORM });
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (rule: ShippingRule) => {
        setFormMode("edit");
        setEditingRuleId(rule.id);
        setFormData({
            title: rule.title,
            province: rule.province || "",
            district: rule.district || "",
            city_or_municipality: rule.city_or_municipality || "",
            shipping_fee: Number(rule.shipping_fee),
            transit_days_min: rule.transit_days_min || 0,
            transit_days_max: rule.transit_days_max || 0,
            estimated_days: rule.estimated_days || "",
            is_default: rule.is_default,
            is_active: rule.is_active,
        });
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        try {
            const payload: CreateShippingRule = {
                ...formData,
                shipping_fee: Number(formData.shipping_fee),
                province: formData.is_default ? undefined : formData.province || undefined,
                district: formData.is_default ? undefined : formData.district || undefined,
                city_or_municipality: formData.is_default
                    ? undefined
                    : formData.city_or_municipality || undefined,
            };

            if (formMode === "create") {
                await createShippingRule(payload, token ?? undefined);
            } else if (editingRuleId) {
                await updateShippingRule(editingRuleId, payload, token ?? undefined);
            }
            setIsFormOpen(false);
            loadRules();
        } catch (err: any) {
            setFormError(err?.message || "Action failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (rule: ShippingRule) => {
        confirm({
            title: "Delete shipping rule?",
            description: `Warning: "${rule.title}" will be permanently removed. ${rule.is_default ? "This is the default fallback rule. Deleting it may affect shipments to uncovered areas." : ""}`,
            confirmText: "Delete Rule",
            variant: "danger",
            onConfirm: async () => {
                await deleteShippingRule(rule.id, token ?? undefined);
                loadRules();
            }
        });
    };

    const handleToggle = async (rule: ShippingRule) => {
        setTogglingId(rule.id);
        try {
            await toggleShippingRule(rule.id, token ?? undefined);
            await loadRules();
        } catch {
            // silent
        } finally {
            setTogglingId(null);
        }
    };

    // ─── Filters ─────────────────────────────────────────────────────────────

    const filteredRules = useMemo(() => {
        return rules.filter((r) => {
            const matchesSearch =
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.province || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.district || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && r.is_active) ||
                (filterStatus === "inactive" && !r.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [rules, searchTerm, filterStatus]);

    const activeCount = rules.filter((r) => r.is_active).length;
    const defaultRule = rules.find((r) => r.is_default);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
                        Shipping &amp; Delivery
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage shipping coverage, delivery fees, and provider configuration.
                    </p>
                </div>
                <Button
                    onClick={handleOpenCreate}
                    className="gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Shipping Rule
                </Button>
            </div>

            {/* ── Provider Section ─────────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-md bg-white">
                <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Active Shipping Provider
                    </p>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">Manual Shipping</span>
                            <span className="text-xs text-slate-500">Rule-based fee assignment</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge active={true} />
                        <button
                            onClick={() => setIsProviderModalOpen(true)}
                            className="text-xs text-slate-500 border border-slate-200 rounded px-2.5 py-1.5 hover:border-slate-400 hover:text-slate-700 transition"
                        >
                            Change Provider
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Summary Stats ────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Rules", value: rules.length },
                    { label: "Active Rules", value: activeCount },
                    {
                        label: "Default Fallback",
                        value: defaultRule ? defaultRule.title : "Not configured",
                        warn: !defaultRule,
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="border border-slate-200 rounded-md bg-white px-4 py-3"
                    >
                        <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                        <p
                            className={`text-sm font-semibold truncate ${stat.warn ? "text-amber-600" : "text-slate-900"
                                }`}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Rules Table ──────────────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-md bg-white overflow-hidden">

                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search rules…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="border border-slate-200 rounded-md py-1.5 px-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 transition appearance-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <span className="ml-auto text-xs text-slate-400">
                        {filteredRules.length} rule{filteredRules.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {["Title", "Coverage", "Fee (NPR)", "ETA", "Status", ""].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap last:text-right"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array(4)
                                    .fill(0)
                                    .map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {Array(6)
                                                .fill(0)
                                                .map((__, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <div className="h-3.5 bg-slate-100 rounded w-full" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : filteredRules.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-sm text-slate-400"
                                    >
                                        {rules.length === 0
                                            ? "No shipping rules configured yet."
                                            : "No rules match your filters."}
                                    </td>
                                </tr>
                            ) : (
                                filteredRules.map((rule) => (
                                    <tr
                                        key={rule.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        {/* Title */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {rule.title}
                                                </span>
                                                {rule.is_default && <DefaultBadge />}
                                            </div>
                                        </td>

                                        {/* Coverage */}
                                        <td className="px-4 py-3">
                                            <CoverageCell rule={rule} />
                                        </td>

                                        {/* Fee */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {Number(rule.shipping_fee).toLocaleString()}
                                            </span>
                                        </td>

                                        {/* ETA */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-slate-500">
                                                {rule.estimated_days || "—"}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <StatusBadge active={rule.is_active} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <RowActions
                                                rule={rule}
                                                togglingId={togglingId}
                                                onEdit={() => handleOpenEdit(rule)}
                                                onDelete={() => handleDelete(rule)}
                                                onToggle={() => handleToggle(rule)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Matching Priority Note ───────────────────────────────────── */}
            <p className="text-xs text-slate-400">
                <strong className="font-medium text-slate-500">Matching priority:</strong>{" "}
                City / Municipality → District → Province → Default (fallback). More specific rules always take precedence.
            </p>

            {/* ══ Create / Edit Modal ══════════════════════════════════════════ */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsFormOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {formMode === "create" ? "Add Shipping Rule" : "Edit Shipping Rule"}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-slate-400 hover:text-slate-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                            {formError && (
                                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2.5 text-sm text-rose-700">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}

                            <Field label="Rule Title" required>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Kathmandu District"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className={INPUT}
                                />
                            </Field>

                            {/* Default fallback toggle */}
                            <div className="flex items-center justify-between py-3 border-t border-b border-slate-100">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">
                                        Default Fallback Rule
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Applies to addresses not covered by any specific rule
                                    </p>
                                </div>
                                <Toggle
                                    checked={formData.is_default}
                                    onChange={(v) =>
                                        setFormData({ ...formData, is_default: v })
                                    }
                                />
                            </div>

                            {/* Geographic targeting — only for non-default rules */}
                            {!formData.is_default && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Geographic Targeting
                                    </p>
                                    <Field label="Province" required>
                                        <input
                                            required={!formData.is_default}
                                            type="text"
                                            placeholder="e.g. Bagmati"
                                            value={formData.province || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, province: e.target.value })
                                            }
                                            className={INPUT}
                                        />
                                    </Field>
                                    <Field label="District">
                                        <input
                                            type="text"
                                            placeholder="e.g. Kathmandu (optional)"
                                            value={formData.district || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, district: e.target.value })
                                            }
                                            className={INPUT}
                                        />
                                    </Field>
                                    <Field label="City / Municipality">
                                        <input
                                            type="text"
                                            placeholder="e.g. Kathmandu Metropolitan (optional)"
                                            value={formData.city_or_municipality || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    city_or_municipality: e.target.value,
                                                })
                                            }
                                            className={INPUT}
                                        />
                                    </Field>
                                </div>
                            )}

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Shipping Fee (NPR)" required>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        value={formData.shipping_fee || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                shipping_fee: Number(e.target.value),
                                            })
                                        }
                                        className={INPUT}
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Transit Days Min" required>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 1"
                                        value={formData.transit_days_min || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                transit_days_min: Number(e.target.value),
                                            })
                                        }
                                        className={INPUT}
                                    />
                                </Field>
                                <Field label="Transit Days Max" required>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 3"
                                        value={formData.transit_days_max || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                transit_days_max: Number(e.target.value),
                                            })
                                        }
                                        className={INPUT}
                                    />
                                </Field>
                            </div>
                            <div className="space-y-4">
                                <Field label="Legacy Estimated ETA (String)" required>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. 1-2 days"
                                        value={formData.estimated_days || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                estimated_days: e.target.value,
                                            })
                                        }
                                        className={INPUT}
                                    />
                                </Field>
                            </div>

                            {/* Active status toggle */}
                            <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                <p className="text-sm font-medium text-slate-700">Active</p>
                                <Toggle
                                    checked={formData.is_active}
                                    onChange={(v) =>
                                        setFormData({ ...formData, is_active: v })
                                    }
                                />
                            </div>

                            {/* Footer buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={isSubmitting}
                                >
                                    {formMode === "create" ? "Save Rule" : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ══ Provider Modal ═══════════════════════════════════════════════ */}
            {isProviderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsProviderModalOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Shipping Provider
                            </h2>
                            <button
                                onClick={() => setIsProviderModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-5 py-5 space-y-4">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-slate-900">Manual Shipping</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    You are currently using rule-based manual shipping. This allows you to define custom fees for every city, district, and province.
                                </p>
                            </div>

                            <div className="p-3 border border-slate-100 rounded-md opacity-50 grayscale">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-slate-500">Automated Courier</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coming Soon</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Direct integration with local couriers for real-time tracking and automatic rate calculation.
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-4 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setIsProviderModalOpen(false)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-400 transition"
                            >
                                Close Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
