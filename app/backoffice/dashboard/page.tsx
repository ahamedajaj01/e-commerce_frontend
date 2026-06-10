"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchDashboardStats, fetchLowStockAlerts, DashboardStats, LowStockItem } from "@/lib/api/analytics";
import { PageHeader } from "@/components/backoffice/PageHeader";
import { DataTable, Column } from "@/components/backoffice/DataTable";
import { StatusBadge } from "@/components/backoffice/StatusBadge";

export default function DashboardPage() {
  const { token, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardStats(token)
        .then(setStats)
        .catch(() => { })
        .finally(() => setIsLoading(false));
      fetchLowStockAlerts(token).then(setLowStock).catch(() => { });
    }
  }, [token, isAuthenticated]);

  const kpis = [
    { label: "Active Orders", value: stats?.active_orders || 0, trend: "Live", color: "text-blue-600" },
    { label: "Low Stock", value: stats?.low_stock_count || 0, trend: "Requires Action", color: "text-rose-600" },
    { label: "Revenue (MTD)", value: stats?.monthly_revenue || "NPR 0", trend: "+12.4%", color: "text-emerald-600" },
    { label: "Active Campaigns", value: stats?.active_campaigns || 0, trend: "Standard", color: "text-fuchsia-600" },
  ];

  type Transaction = DashboardStats["recent_transactions"][number];

  const columns: Column<Transaction>[] = [
    {
      header: "Ref / Transaction",
      accessor: (t: Transaction) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center text-xs">🏷️</div>
          <span className="font-black text-slate-900 uppercase tracking-widest">{t.id}</span>
        </div>
      )
    },
    {
      header: "Customer",
      accessor: "customer"
    },
    {
      header: "Amount",
      accessor: (t: Transaction) => <span className="font-bold text-slate-900">{t.amount}</span>
    },
    {
      header: "Status",
      accessor: (t: Transaction) => <StatusBadge status={t.status} />
    }
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="Command Center"
        subtitle="Real-time operational overview of orders, inventory, and merchandising."
        category="Intelligence"
        breadcrumbs={[{ label: "Backoffice" }, { label: "Overview" }]}
      />

      {/* KPI Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:border-slate-300">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${kpi.color}`}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest pl-1 border-l-4 border-fuchsia-600">Recent Transactions</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition underline underline-offset-4 decoration-slate-200">Full History</button>
          </div>
          <DataTable
            isLoading={isLoading}
            data={stats?.recent_transactions || []}
            columns={columns}
            keyExtractor={(t) => t.id}
          />
        </div>

        <div className="space-y-8">

          {/* Low Stock Alerts Card */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Low Stock Alerts</p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${lowStock.length > 0
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
                }`}>
                {lowStock.length > 0 ? `${lowStock.length} Items` : "All Clear"}
              </span>
            </div>

            {lowStock.length === 0 ? (
              <div className="px-8 py-10 text-center">
                <span className="text-3xl">✅</span>
                <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-widest">Stock levels are healthy</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {lowStock.slice(0, 5).map((item, idx) => (
                  <div key={item.variant_id ?? item.sku ?? String(idx)} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50/60 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{item.product_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {item.size} / {item.color} · {item.sku}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${item.available_quantity === 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                        }`}>
                        {item.available_quantity === 0 ? "Out of Stock" : `${item.available_quantity} left`}
                      </span>
                    </div>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <div className="px-8 py-3 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">+{lowStock.length - 5} more items need restocking</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-600">Quick Actions</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "New Product Entry", icon: "➕" },
                { label: "Bulk Print Labels", icon: "🏷️" },
                { label: "Export Daily Report", icon: "📂" }
              ].map(action => (
                <button key={action.label} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-950 hover:text-white transition group text-left">
                  <span className="text-sm group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
