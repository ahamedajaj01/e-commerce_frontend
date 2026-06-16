"use client";

import { Users as UsersIcon, Plus, Search, Mail, Shield, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UsersSettingsPage() {
    // Mock data for foundation
    const staff = [
        { id: 1, name: "Admin User", email: "admin@lyralabel.com", role: "Super Admin", status: "Active" },
        { id: 2, name: "Inventory Lead", email: "stock@lyralabel.com", role: "Inventory", status: "Active" },
        { id: 3, name: "Support Agent", email: "support@lyralabel.com", role: "Support", status: "Suspended" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
                    <p className="text-[11px] text-slate-500 font-medium">Manage internal platform users and their administrative access.</p>
                </div>
                <Button className="h-9 px-4 text-xs font-bold gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Invite Staff
                </Button>
            </div>

            {/* FILTERS */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                    placeholder="Search staff by name or email..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-slate-950 transition-all"
                />
            </div>

            {/* DATA GRID */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">User</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Role</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staff.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{u.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-1.5 w-1.5 rounded-full", u.status === "Active" ? "bg-emerald-500" : "bg-slate-300")} />
                                        <span className="text-[11px] font-bold text-slate-600">{u.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-slate-900 p-1 rounded-md transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
