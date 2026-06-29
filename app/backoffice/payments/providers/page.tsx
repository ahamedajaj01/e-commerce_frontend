"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchPaymentProviders, createPaymentProvider, updatePaymentProvider } from "@/lib/api/payments";
import { PaymentProvider } from "@/types/payment";
import {
    Plus,
    Zap,
    Loader2,
    ShieldCheck,
    Settings,
    X,
    Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/AlertBanner";

// From docs: provider_type is either MANUAL (admin verifies) or GATEWAY (future API)
const PROVIDER_TYPES = [
    { id: "MANUAL", label: "Manual", description: "Admin manually reviews and approves payment proofs. Use for Bank Transfer, QR, Wallets, ConnectIPS." },
    { id: "GATEWAY", label: "API Gateway", description: "Automated settlement via a payment gateway API (eSewa Merchant, Khalti, Stripe). For future integration." },
];

export default function ProvidersPage() {
    const { token } = useAuth();
    const [providers, setProviders] = useState<PaymentProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
    const [formData, setFormData] = useState<Partial<PaymentProvider>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchPaymentProviders(token);
            setProviders(data);
        } catch (err: any) {
            setError(err.message || "Failed to load providers.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [token]);

    const handleCreate = () => {
        setEditingProvider(null);
        setFormData({
            name: "",
            code: "",
            type: "MANUAL", // frontend uses `type`; mapped to `provider_type` on submit
            is_active: true,
        });
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleEdit = (provider: PaymentProvider) => {
        setEditingProvider(provider);
        // Backend returns `provider_type`; frontend form uses `type` internally
        const normalised = { ...provider, type: (provider as any).provider_type || provider.type || "MANUAL" };
        setFormData(normalised);
        setFormError(null);
        setIsFormOpen(true);
    };

    const handleToggle = async (provider: PaymentProvider) => {
        if (!token) return;
        try {
            await updatePaymentProvider(provider.id, { is_active: !provider.is_active }, token);
            setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, is_active: !p.is_active } : p));
            setSuccess(`"${provider.name}" is now ${!provider.is_active ? "active" : "inactive"}.`);
        } catch (err: any) {
            setError(err.message || "Failed to update provider status.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setFormError(null);
        setIsSaving(true);
        try {
            // Docs: backend expects `provider_type`, not `type`
            const { type, ...rest } = formData as any;
            const payload = { ...rest, provider_type: type };

            if (editingProvider) {
                await updatePaymentProvider(editingProvider.id, payload, token);
                setSuccess(`"${formData.name}" updated successfully.`);
            } else {
                await createPaymentProvider(payload, token);
                setSuccess(`"${formData.name}" created successfully.`);
            }
            await load();
            setIsFormOpen(false);
        } catch (err: any) {
            const backendData = err?.data;
            if (backendData && typeof backendData === "object") {
                const fieldErrors = Object.entries(backendData)
                    .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
                    .join(" | ");
                setFormError(fieldErrors);
            } else {
                setFormError(err.message || "Failed to save provider.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Gateways</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Configure payment engine providers. Each Payment Method must be linked to a provider.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="h-10 px-4 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Provider
                </button>
            </div>

            {/* Feedback */}
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Info callout */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                <p>
                    <span className="font-bold">Providers are the engine behind each Payment Method.</span>{" "}
                    You must create at least one provider before you can create a Payment Method.
                    For manual bank transfers and QR payments, use the <code className="bg-blue-100 px-1 rounded font-mono text-[11px]">MANUAL</code> type.
                </p>
            </div>

            {/* Providers Table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Provider Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Internal Code</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Integration Type</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm font-medium">Loading providers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : providers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center space-y-3">
                                        <Zap className="w-8 h-8 text-slate-200 mx-auto" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">No payment providers yet</p>
                                            <p className="text-xs text-slate-400 mt-1">Click "Add Provider" to create your first gateway. You'll need at least one to create Payment Methods.</p>
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add your first provider
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                providers.map((provider) => (
                                    <tr key={provider.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <span className="text-[13px] font-bold text-slate-900">{provider.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                {provider.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                {PROVIDER_TYPES.find(t => t.id === provider.type)?.label || provider.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {provider.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-200">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleToggle(provider)}
                                                    className="text-[12px] font-bold text-slate-500 hover:text-slate-900"
                                                >
                                                    {provider.is_active ? "Disable" : "Enable"}
                                                </button>
                                                <div className="w-px h-3 bg-slate-200" />
                                                <button
                                                    onClick={() => handleEdit(provider)}
                                                    className="text-[12px] font-bold text-blue-600 hover:text-blue-800"
                                                >
                                                    Edit
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

            {/* Slide-out Form Drawer */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-xl bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">

                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {editingProvider ? "Edit Provider" : "Add Provider"}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {editingProvider?.code || "New gateway configuration"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="provider-form" onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
                                {formError && (
                                    <AlertBanner message={formError} type="error" onClose={() => setFormError(null)} />
                                )}

                                {/* Identity */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Provider Identity</h3>

                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-slate-700">
                                            Display Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name || ""}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                            placeholder="e.g. Manual Bank Transfer"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-bold text-slate-700">
                                            Internal Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code || ""}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                            placeholder="e.g. MANUAL_BANK"
                                        />
                                        <p className="text-[11px] text-slate-400">Unique identifier used internally. Cannot be changed after creation.</p>
                                    </div>
                                </div>

                                {/* Integration Type */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Integration Type</h3>

                                    <div className="grid grid-cols-1 gap-2">
                                        {PROVIDER_TYPES.map(pt => (
                                            <label
                                                key={pt.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                    formData.type === pt.id
                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                        : "border-slate-200 bg-white hover:border-slate-300"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="provider_type"
                                                    value={pt.id}
                                                    checked={formData.type === pt.id}
                                                    onChange={() => setFormData({ ...formData, type: pt.id })}
                                                    className="mt-0.5 hidden"
                                                />
                                                <div className={cn(
                                                    "w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center",
                                                    formData.type === pt.id ? "border-white" : "border-slate-400"
                                                )}>
                                                    {formData.type === pt.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={cn("text-[13px] font-bold", formData.type === pt.id ? "text-white" : "text-slate-900")}>
                                                        {pt.label}
                                                    </p>
                                                    <p className={cn("text-[11px] mt-0.5", formData.type === pt.id ? "text-white/70" : "text-slate-400")}>
                                                        {pt.description}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Status</h3>
                                    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="provider_active"
                                            checked={formData.is_active ?? true}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor="provider_active" className="text-sm font-bold text-slate-900 cursor-pointer block">
                                                Enable this provider
                                            </label>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Only active providers appear in the Payment Method configuration.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Drawer footer */}
                        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="provider-form"
                                disabled={isSaving}
                                className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-md hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {editingProvider ? "Save Changes" : "Create Provider"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
