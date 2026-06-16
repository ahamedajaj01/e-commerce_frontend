"use client";

import { Terminal, Search, Clock, User } from "lucide-react";

export default function ActivityLogsPage() {
    const logs = [
        { id: 1, action: "Order #9901 Fulfilled", actor: "admin@lyralabel.com", timestamp: "2 mins ago", type: "ORDER" },
        { id: 2, action: "Updated Global Shipping Rule", actor: "lead_dev", timestamp: "14 mins ago", type: "SYSTEM" },
        { id: 3, action: "Suspended Staff: support_03", actor: "admin@lyralabel.com", timestamp: "1 hour ago", type: "SECURITY" },
        { id: 4, action: "Bulk Inventory Update (23 items)", actor: "stock_manager", timestamp: "3 hours ago", type: "CATALOG" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="border-b border-slate-100 pb-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
                <p className="text-[11px] text-slate-500 font-medium">Audit trail of all administrative actions and system security events.</p>
            </div>

            {/* SEARCH FOUNDATION */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                    placeholder="Filter logs by actor or action..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-slate-950 transition-all"
                />
            </div>

            {/* LOG STREAM */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Description</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actor</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 tracking-tighter">
                                        {log.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs font-bold text-slate-900">{log.action}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                            <User className="w-2.5 h-2.5 text-slate-400" />
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-600">{log.actor}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px] font-bold">{log.timestamp}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* LOAD MORE FOUNDATION */}
            <div className="text-center py-4">
                <button className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                    Load older activity records
                </button>
            </div>
        </div>
    );
}
