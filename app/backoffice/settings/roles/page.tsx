"use client";

import { Shield, Plus, Key, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RolesSettingsPage() {
    const roles = [
        { name: "Super Admin", description: "Full access to all platform systems and settings.", userCount: 2 },
        { name: "Inventory Staff", description: "Manage products, categories, and stock logistics.", userCount: 5 },
        { name: "Support Agent", description: "Process orders, manage returns, and view customers.", userCount: 3 },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            {/* HEADER */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-[11px] text-slate-500 font-medium">Define access control policies and delegate staff authorities.</p>
                </div>
                <Button className="h-9 px-4 text-xs font-bold gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    New Custom Role
                </Button>
            </div>

            {/* ROLES LIST */}
            <div className="grid gap-4">
                {roles.map((role) => (
                    <div key={role.name} className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-950 transition-all shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                                <Key className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
                                <p className="text-[11px] text-slate-500 font-medium max-w-md">{role.description}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{role.userCount} Assigned Staff</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" className="h-8 px-4 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit Permissions
                            <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* POLICY OVERVIEW FOUNDATION */}
            <section className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <Shield className="w-6 h-6 text-slate-300 mx-auto" />
                <div>
                    <p className="text-xs font-bold text-slate-900">Custom Authorization Policies</p>
                    <p className="text-[11px] text-slate-400 font-medium max-w-sm mx-auto">Future integration will allow for granular resource-level permissions and audit-compliant access rules.</p>
                </div>
            </section>
        </div>
    );
}
