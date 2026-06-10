"use client";

import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
    return (
        <div className="space-y-10">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Preferences</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">System Configuration</h1>
                <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                    Configure domain endpoints, update branding, and manage global platform constraints.
                </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
                <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Branding</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Platform Name</label>
                            <input type="text" value="lyralabel" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Primary Color</label>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-fuchsia-600" />
                                <span className="text-sm font-bold text-slate-600">Fuchsia Vivid</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">API & Connectivity</h3>
                    <div className="space-y-6">
                        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                            <span className="text-xl">🛡️</span>
                            <div>
                                <p className="text-xs font-black text-emerald-900">Backend Connected</p>
                                <p className="text-[10px] text-emerald-600 font-medium font-mono uppercase">v1.2.0-stable</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="w-full">Test Connection</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
