"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/backoffice/PageHeader";
import {
    fetchShippingRules,
    createShippingRule,
    updateShippingRule,
    deleteShippingRule,
    toggleShippingRule,
} from "@/lib/api/shipping";
import type { ShippingRule, CreateShippingRule } from "@/types/shipping";
import { useAuth } from "@/hooks/useAuth";
import {
    Trash2,
    Edit,
    Search,
    Plus,
    X,
    Loader2,
    MapPin,
    ToggleLeft,
    ToggleRight,
    Globe,
    Star,
} from "lucide-react";

const EMPTY_FORM: CreateShippingRule = {
    title: "",
    province: "",
    district: "",
    city_or_municipality: "",
    shipping_fee: 0,
    estimated_days: "",
    is_default: false,
    is_active: true,
};

export default function ShippingDeliveryPage() {
    const { token } = useAuth();
    const [rules, setRules] = useState<ShippingRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [deletingRule, setDeletingRule] = useState<ShippingRule | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateShippingRule>(EMPTY_FORM);

    // ─── DATA ────────────────────────────────────────────────────────────────

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

    // ─── HANDLERS ────────────────────────────────────────────────────────────

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData({ ...EMPTY_FORM });
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
            estimated_days: rule.estimated_days || "",
            is_default: rule.is_default,
            is_active: rule.is_active,
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: CreateShippingRule = {
                ...formData,
                shipping_fee: Number(formData.shipping_fee),
                // For default rules, geo fields are omitted
                province: formData.is_default ? undefined : formData.province || undefined,
                district: formData.is_default ? undefined : formData.district || undefined,
                city_or_municipality: formData.is_default ? undefined : formData.city_or_municipality || undefined,
            };

            if (formMode === "create") {
                await createShippingRule(payload, token ?? undefined);
            } else if (editingRuleId) {
                await updateShippingRule(editingRuleId, payload, token ?? undefined);
            }
            setIsFormOpen(false);
            loadRules();
        } catch {
            alert("Action failed. Please verify connectivity and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingRule) return;
        setIsSubmitting(true);
        try {
            await deleteShippingRule(deletingRule.id, token ?? undefined);
            setDeletingRule(null);
            loadRules();
        } catch {
            alert("Deletion failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (rule: ShippingRule) => {
        setTogglingId(rule.id);
        try {
            await toggleShippingRule(rule.id, token ?? undefined);
            loadRules();
        } catch {
            alert("Toggle failed.");
        } finally {
            setTogglingId(null);
        }
    };

    // ─── FILTERS ─────────────────────────────────────────────────────────────

    const filteredRules = useMemo(
        () =>
            rules.filter(
                (r) =>
                    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.province || "").toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [rules, searchTerm]
    );

    const defaultRule = rules.find((r) => r.is_default);

    // ─── RENDER ──────────────────────────────────────────────────────────────

    return (
        <div className="bg-[#fbfcff] min-h-screen pb-24 space-y-8">
            <PageHeader
                title="Shipping & Delivery"
                subtitle="Configure hierarchical delivery rates and geographic coverage."
                category="Logistics Strategy"
                breadcrumbs={[{ label: "Fulfillment" }, { label: "Shipping Rules" }]}
                actions={
                    <button
                        onClick={handleOpenCreate}
                        className="bg-black text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" />
                        New Rule
                    </button>
                }
            />

            {/* Default Rule Banner */}
            {defaultRule && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-slate-900 text-white rounded-[2rem] px-12 py-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">
                                    Nationwide Fallback Rule
                                </p>
                                <p className="text-lg font-bold">{defaultRule.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[10px] text-white/50 font-bold uppercase">
                                        Rs {defaultRule.shipping_fee} &bull; {defaultRule.estimated_days}
                                    </p>
                                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${defaultRule.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {defaultRule.is_active ? 'Live' : 'Off'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleOpenEdit(defaultRule)}
                                className="px-6 py-3 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setDeletingRule(defaultRule)}
                                className="px-6 py-3 border border-rose-500/40 text-rose-400 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden max-w-7xl mx-auto">
                <div className="p-10 border-b border-slate-50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-12 py-8">Rule Title</th>
                                <th className="px-12 py-8">Coverage</th>
                                <th className="px-12 py-8">Rate (NPR)</th>
                                <th className="px-12 py-8 text-center">Status</th>
                                <th className="px-12 py-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(3)
                                    .fill(0)
                                    .map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-12 py-14" />
                                        </tr>
                                    ))
                            ) : filteredRules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-12 py-20 text-center">
                                        <p className="text-slate-300 font-bold text-sm uppercase tracking-widest">
                                            No shipping rules found
                                        </p>
                                        <p className="text-slate-200 text-xs mt-2">
                                            Create a rule to start configuring delivery rates.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRules
                                    .filter((r) => !r.is_default) // default shown in banner above
                                    .map((rule) => (
                                        <tr
                                            key={rule.id}
                                            className="group hover:bg-slate-50/30 transition-all border-b border-slate-50 last:border-0"
                                        >
                                            {/* Title */}
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-3">
                                                    {rule.is_default && (
                                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                                                    )}
                                                    <p className="font-bold text-slate-900 text-lg leading-tight">
                                                        {rule.title}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Coverage */}
                                            <td className="px-12 py-10">
                                                {rule.is_default ? (
                                                    <div className="flex items-center gap-3">
                                                        <Globe className="w-4 h-4 text-slate-300" />
                                                        <p className="text-sm font-bold text-slate-700">
                                                            Nationwide (Default)
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-4 h-4 text-slate-200" />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">
                                                                {rule.province || "Any Province"}
                                                            </p>
                                                            <p className="text-[10px] text-slate-300 font-bold uppercase">
                                                                {rule.district || "Any District"}
                                                                {rule.city_or_municipality
                                                                    ? ` • ${rule.city_or_municipality}`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Rate */}
                                            <td className="px-12 py-10">
                                                <p className="text-xl font-black text-slate-900">
                                                    Rs {rule.shipping_fee}
                                                </p>
                                                <p className="text-[9px] text-slate-300 font-bold uppercase mt-1 italic">
                                                    {rule.estimated_days || "Standard Transit"}
                                                </p>
                                            </td>

                                            {/* Status toggle */}
                                            <td className="px-12 py-10 text-center">
                                                <button
                                                    onClick={() => handleToggle(rule)}
                                                    disabled={togglingId === rule.id}
                                                    className="inline-flex items-center gap-2 transition-all disabled:opacity-50"
                                                    title={rule.is_active ? "Click to deactivate" : "Click to activate"}
                                                >
                                                    {togglingId === rule.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                                                    ) : rule.is_active ? (
                                                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                                                    ) : (
                                                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                                                    )}
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-widest ${rule.is_active
                                                            ? "text-emerald-500"
                                                            : "text-slate-300"
                                                            }`}
                                                    >
                                                        {rule.is_active ? "Live" : "Off"}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-12 py-10 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEdit(rule)}
                                                        className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-950 transition-all"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingRule(rule)}
                                                        className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────────── */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
                    <div
                        className="absolute inset-0 bg-slate-950/20 backdrop-blur-md"
                        onClick={() => setIsFormOpen(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-[3rem] p-16 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="absolute top-12 right-12 text-slate-300 hover:text-slate-950"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <form onSubmit={handleSubmit} className="space-y-12">
                            <h3 className="text-3xl font-bold font-serif text-slate-900">
                                {formMode === "create" ? "Define Rule" : "Refine Rule"}
                            </h3>

                            <div className="space-y-10">
                                {/* Title + Status */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                            Rule Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. Bagmati + Kathmandu + Kathmandu Metropolitan"
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-semibold outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-slate-900 uppercase">
                                            Operational Status
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    is_active: !formData.is_active,
                                                })
                                            }
                                            className={`w-12 h-6 rounded-full relative transition ${formData.is_active ? "bg-slate-900" : "bg-slate-200"
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? "left-7" : "left-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Default Rule Toggle */}
                                <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <Globe className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">
                                            Nationwide Fallback (Default Rule)
                                        </p>
                                        <p className="text-[10px] text-amber-600 mt-1">
                                            When enabled, this rule matches any address not covered by a
                                            specific rule. Only one default rule is allowed.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({ ...formData, is_default: !formData.is_default })
                                        }
                                        className={`w-12 h-6 rounded-full relative transition flex-shrink-0 ${formData.is_default ? "bg-amber-500" : "bg-amber-200"
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_default ? "left-7" : "left-1"
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Regional Targeting (hidden for default rules) */}
                                {!formData.is_default && (
                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                            Regional Targeting
                                        </label>
                                        <p className="text-[9px] text-slate-300 font-bold mt-1 ml-1">
                                            Matching priority: Province + District + City &gt; Province + District
                                            &gt; Province only. Leave narrower fields blank for broader coverage.
                                        </p>
                                        <input
                                            required={!formData.is_default}
                                            type="text"
                                            placeholder="Province (e.g. Bagmati)"
                                            value={formData.province || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, province: e.target.value })
                                            }
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="District (Optional)"
                                            value={formData.district || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, district: e.target.value })
                                            }
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City / Municipality (Optional)"
                                            value={formData.city_or_municipality || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    city_or_municipality: e.target.value,
                                                })
                                            }
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none"
                                        />
                                        <p className="text-[9px] text-slate-300 italic ml-1">
                                            Do NOT enter neighborhood names (Anamnagar, Baneshwor). Those
                                            automatically fall under the district or province rule.
                                        </p>
                                    </div>
                                )}

                                {/* Pricing & Speed */}
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                        Pricing & Speed
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 ml-1">
                                                Shipping Fee (NPR)
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="e.g. 100"
                                                value={formData.shipping_fee || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        shipping_fee: Number(e.target.value),
                                                    })
                                                }
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-400 ml-1">
                                                Estimated Days
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. 2-3 Business Days"
                                                value={formData.estimated_days || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        estimated_days: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full py-6 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : formMode === "create" ? (
                                    "Publish Rule"
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM ──────────────────────────────────────────────────── */}
            {deletingRule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
                    <div
                        className="absolute inset-0 bg-slate-950/20 backdrop-blur-md"
                        onClick={() => setDeletingRule(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-12 shadow-2xl text-center space-y-10 animate-in zoom-in-95">
                        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-serif text-slate-900">
                                Delete &ldquo;{deletingRule.title}&rdquo;?
                            </h3>
                            {deletingRule.is_default && (
                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-3">
                                    Warning: This is your nationwide fallback rule.
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setDeletingRule(null)}
                                className="py-5 bg-slate-50 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleDelete}
                                className="py-5 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
