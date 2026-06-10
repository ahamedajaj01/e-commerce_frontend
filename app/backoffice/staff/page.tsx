"use client";

import { useAuth } from "@/hooks/useAuth";

export default function StaffPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-10">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-fuchsia-600">Access Control</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900 leading-tight">Team Management</h1>
                <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                    Manage staff permissions, add new team members, and review administrative logs.
                </p>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[9px] uppercase tracking-[0.4em] font-black text-slate-400">
                        <tr>
                            <th className="px-10 py-6">Member</th>
                            <th className="px-10 py-6">Primary Role</th>
                            <th className="px-10 py-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                            <td className="px-10 py-8">
                                <p className="font-black text-slate-900">{user?.name || "Self"}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{user?.email}</p>
                            </td>
                            <td className="px-10 py-8">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-900 border border-slate-200 px-3 py-1 rounded-full bg-white shadow-sm">
                                    {(user?.roles || ["Admin"])[0]}
                                </span>
                            </td>
                            <td className="px-10 py-8">
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Online Now</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
