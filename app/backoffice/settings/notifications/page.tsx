"use client";

import { Bell, Mail, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotificationsSettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* HEADER */}
            <div className="border-b border-slate-100 pb-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administrative Notifications</h1>
                <p className="text-[11px] text-slate-500 font-medium">Configure how you receive operational alerts and system reports.</p>
            </div>

            <div className="space-y-10">
                {/* SECTION: Email Alerts */}
                <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email Dispatch
                    </h3>

                    <div className="divide-y divide-slate-50 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <ToggleRow
                            title="Daily Sales Summary"
                            description="Receive a consolidated report of all catalog performance every 24 hours."
                            defaultChecked
                        />
                        <ToggleRow
                            title="Inventory Threshold Alerts"
                            description="Alert when product variants fall below the safety stock level."
                            defaultChecked
                        />
                        <ToggleRow
                            title="Staff Action Notifications"
                            description="Notify admins when critical configuration changes are made."
                        />
                    </div>
                </section>

                {/* SECTION: System Alerts */}
                <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-slate-400" />
                        In-App Alerts
                    </h3>

                    <div className="divide-y divide-slate-50 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <ToggleRow
                            title="New Order Real-time Alert"
                            description="Visual and audio notification within the admin panel for incoming sales."
                            defaultChecked
                        />
                        <ToggleRow
                            title="System Health Alerts"
                            description="Notify of API latency spikes or synchronization issues."
                            defaultChecked
                        />
                    </div>
                </section>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button className="h-9 px-6 text-xs font-bold">Update Preferences</Button>
            </div>
        </div>
    );
}

function ToggleRow({ title, description, defaultChecked = false }: { title: string; description: string; defaultChecked?: boolean }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">{title}</p>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-slate-950 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
            </label>
        </div>
    );
}
