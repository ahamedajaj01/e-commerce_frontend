"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor?: (item: T, idx: number) => string;
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyState?: ReactNode;
}

export function DataTable<T>({ data, columns, keyExtractor, onRowClick, isLoading, emptyState }: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200 rounded-3xl">
                <div className="h-5 w-5 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Data...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                {emptyState || (
                    <div className="py-20 text-center space-y-4">
                        <span className="text-4xl opacity-10">📂</span>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No entries found</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm shadow-slate-100">
            <div className="rounded-[2rem]">
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="bg-slate-50/50">
                            {columns.map((col, idx) => (
                                <th
                                    key={col.header}
                                    className={cn(
                                        "px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 border-b border-slate-100",
                                        idx === 0 && "rounded-tl-[2rem]",
                                        idx === columns.length - 1 && "rounded-tr-[2rem]",
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((item, rowIdx) => (
                            <tr
                                key={keyExtractor ? keyExtractor(item, rowIdx) : String(rowIdx)}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    "transition-colors duration-150",
                                    onRowClick ? "cursor-pointer hover:bg-slate-50/50" : "hover:bg-slate-50/30"
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.header}
                                        className={cn("px-6 py-4 text-slate-600 font-medium", col.className)}
                                    >
                                        {typeof col.accessor === "function"
                                            ? col.accessor(item)
                                            : (item[col.accessor] as ReactNode)
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
