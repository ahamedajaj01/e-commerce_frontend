"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, fetchPaymentProviders } from "@/lib/api/payments";

import { PaymentMethod, PaymentProvider } from "@/types/payment";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Eye,
    Power,
    GripVertical,
    Loader2,
    Settings2,
    ShieldCheck,
    CreditCard,
    Smartphone,
    QrCode,
    Link2,
    Image as ImageIcon,
    X
} from "lucide-react";
import { cn, getMediaUrl } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/AlertBanner";

export default function PaymentMethodsPage() {
    const { token } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [providers, setProviders] = useState<PaymentProvider[]>([]);

    const loadMethods = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchPaymentMethods(token);
            setMethods(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMethods();
        if (token) {
            fetchPaymentProviders(token).then(setProviders).catch(console.error);
        }
    }, [token]);

    const toggleStatus = async (method: PaymentMethod) => {
        if (!token) return;
        try {
            await updatePaymentMethod(method.id, { is_active: !method.is_active }, token);
            setMethods(prev => prev.map(m => m.id === method.id ? { ...m, is_active: !m.is_active } : m));
            setSuccess(`"${method.name}" is now ${!method.is_active ? 'active' : 'inactive'}.`);
        } catch (err: any) {
            setError(err.message || "Failed to update method status.");
        }
    };

    const filteredMethods = methods.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase())
    );

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({});
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    const deleteMethod = async (method: PaymentMethod) => {
        if (!token) return;
        if (!confirm(`Delete "${method.name}"? This cannot be undone.`)) return;
        try {
            await deletePaymentMethod(method.id, token);
            setMethods(prev => prev.filter(m => m.id !== method.id));
            setSuccess(`"${method.name}" deleted.`);
        } catch (err: any) {
            setError(err.message || "Failed to delete method.");
        }
    };

    const PAYMENT_TYPES = [
        { id: "BANK", label: "Bank Transfer", icon: CreditCard },
        { id: "WALLET", label: "Digital Wallet", icon: Smartphone },
        { id: "QR", label: "QR Payment", icon: QrCode },
        { id: "CONNECT_IPS", label: "ConnectIPS", icon: Link2 },
    ];

    const handleCreate = () => {
        setEditingMethod(null);
        setFormData({
            name: "",
            code: "",
            payment_type: "MANUAL",
            type: "BANK",
            description: "",
            instructions: "",
            requires_proof: false,
            is_active: true,
            display_order: methods.length + 1,
            provider_id: undefined
        });
        setQrFile(null);
        setQrPreview(null);
        setIsFormOpen(true);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        // Normalise: populate provider_id from the nested provider object if needed
        setFormData({ ...method, provider_id: method.provider_id || method.provider?.id });
        setQrFile(null);
        setQrPreview(getMediaUrl(method.qr_image) || null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setFormError(null);
        try {
            const payload = new FormData();
            const skipKeys = new Set(['qr_image', 'provider', 'type', 'id', 'payment_type']);
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && !skipKeys.has(key)) {
                    payload.append(key, value.toString());
                }
            });

            // Derive payment_type from the selected provider
            const selectedProvider = providers.find(p => p.id === formData.provider_id);
            const pType = selectedProvider?.provider_type || "MANUAL";
            payload.append('payment_type', pType);

            // Backend expects `provider` as the provider ID
            if (formData.provider_id) payload.append('provider', formData.provider_id);
            if (qrFile) payload.append('qr_image', qrFile);

            if (editingMethod) {
                await updatePaymentMethod(editingMethod.id, payload, token);
            } else {
                await createPaymentMethod(payload, token);
            }
            await loadMethods();
            setIsFormOpen(false);
            setSuccess(editingMethod ? `"${formData.name}" updated successfully.` : `"${formData.name}" created successfully.`);
        } catch (err: any) {
            // Parse backend validation errors if available
            const backendData = err?.data;
            if (backendData && typeof backendData === 'object') {
                const fieldErrors = Object.entries(backendData)
                    .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                    .join(' | ');
                setFormError(fieldErrors);
            } else {
                setFormError(err.message || "Failed to save payment method.");
            }
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-8 space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Methods</h1>
                    <p className="text-sm text-slate-500 font-medium">Configure customer-facing settlement options and verify instructions.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="h-10 px-4 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Method
                </button>
            </div>

            {/* Global Feedback */}
            {error && <AlertBanner message={error} type="error" onClose={() => setError(null)} />}
            {success && <AlertBanner message={success} type="success" onClose={() => setSuccess(null)} />}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Display Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Internal Code</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engine</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                        <span className="text-sm font-medium">Loading methods...</span>
                                    </td>
                                </tr>
                            ) : filteredMethods.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                                        No payment methods found.
                                    </td>
                                </tr>
                            ) : (
                                filteredMethods.map((method) => (
                                    <tr key={method.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {method.qr_image && (
                                                    <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        <img src={getMediaUrl(method.qr_image)} className="w-full h-full object-cover opacity-50 select-none" alt="" />
                                                    </div>
                                                )}
                                                <span className="text-[13px] font-bold text-slate-900">{method.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{method.code}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border",
                                                method.payment_type === 'GATEWAY' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                                {method.payment_type || 'MANUAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                                                {method.provider ? (
                                                    <><Settings2 className="w-3.5 h-3.5" /> API Configured</>
                                                ) : (
                                                    <><CreditCard className="w-3.5 h-3.5" /> Manual</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {method.is_active ? (
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
                                                    onClick={() => toggleStatus(method)}
                                                    className="text-[12px] font-bold text-slate-500 hover:text-slate-900"
                                                    title={method.is_active ? "Disable" : "Enable"}
                                                >
                                                    {method.is_active ? "Disable" : "Enable"}
                                                </button>
                                                <div className="w-px h-3 bg-slate-200" />
                                                <button
                                                    onClick={() => handleEdit(method)}
                                                    className="text-[12px] font-bold text-blue-600 hover:text-blue-800"
                                                >
                                                    Edit
                                                </button>
                                                <div className="w-px h-3 bg-slate-200" />
                                                <button
                                                    onClick={() => deleteMethod(method)}
                                                    className="text-[12px] font-bold text-rose-500 hover:text-rose-700"
                                                >
                                                    Delete
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
                    <div className="relative w-full max-w-2xl bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
                                </h2>
                                <p className="text-xs text-slate-500">{editingMethod?.code || "New integration configuration"}</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="method-form" onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto">
                                {formError && <AlertBanner message={formError} type="error" onClose={() => setFormError(null)} />}
                                {/* General Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">General Information</h3>

                                    <div className="grid gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700">Display Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                                placeholder="e.g. Bank Transfer (NIC ASIA)"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700">Internal Code</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                                placeholder="e.g. NIC_BANK"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700">Display Order</label>
                                            <input
                                                type="number"
                                                value={formData.display_order}
                                                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Configuration</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700">UI Category</label>
                                            <select
                                                value={formData.type || "BANK"}
                                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                            >
                                                {PAYMENT_TYPES.map(pt => (
                                                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-slate-400">Controls icons and layout (Frontend only)</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-slate-700">
                                                Provider
                                                <span className="ml-1 text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={formData.provider_id || ""}
                                                onChange={e => setFormData({ ...formData, provider_id: e.target.value })}
                                                required
                                                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm"
                                            >
                                                <option value="">Select provider...</option>
                                                {providers.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            {providers.length === 0 && (
                                                <p className="text-[11px] text-amber-600 font-medium">No providers found. Add a gateway first.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                                            Enable this payment method at checkout
                                        </label>
                                    </div>
                                </div>

                                {/* Verification */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Verification Settings</h3>

                                    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="requires_proof"
                                            checked={formData.requires_proof}
                                            onChange={e => setFormData({ ...formData, requires_proof: e.target.checked })}
                                            className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor="requires_proof" className="text-sm font-bold text-slate-900 cursor-pointer block">
                                                Require Deposit Slip / Screenshot
                                            </label>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Customers must upload a verification image before the order can be placed.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code — always visible */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">QR Code Image</h3>
                                    <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col items-center gap-4 text-center shadow-sm">
                                        {qrPreview ? (
                                            <div className="relative group w-48 h-48 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                                <img src={qrPreview} className="w-full h-full object-contain p-2" alt="QR Code Preview" />
                                                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => qrInputRef.current?.click()}
                                                        className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Replace QR
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQrPreview(null);
                                                            setQrFile(null);
                                                        }}
                                                        className="text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => qrInputRef.current?.click()}
                                                className="w-full py-8 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer flex flex-col items-center gap-2"
                                            >
                                                <QrCode className="w-8 h-8 text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">Upload QR Image</p>
                                                    <p className="text-xs text-slate-500">PNG or JPG — shown at checkout for customer scanning</p>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            ref={qrInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setQrFile(file);
                                                    setQrPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Customer Instructions</h3>

                                    <div className="space-y-1.5">
                                        <textarea
                                            value={formData.instructions}
                                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all min-h-[120px] shadow-sm"
                                            placeholder="Provide necessary bank details, connectIPS instructions, or specific notes for the customer..."
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

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
                                form="method-form"
                                className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-md hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                {editingMethod ? "Save Changes" : "Create Method"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
