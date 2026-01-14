"use client";

import { useState, useMemo } from "react";

interface MaterialChange {
    id: string;
    changeType: string;
    oldQuantity: number | null;
    newQuantity: number | null;
    quantityDiff: number | null;
    note: string | null;
    material: {
        maVT: string;
        tenVT: string;
        donGia: number | null;
    };
}

interface ChangeDetailsProps {
    changes: MaterialChange[];
    summary: {
        newItems: number;
        updatedItems: number;
        removedItems: number;
    };
}

type FilterType = "ALL" | "NEW" | "UPDATE" | "REMOVED";

export function ChangeDetails({ changes, summary }: ChangeDetailsProps) {
    const [filter, setFilter] = useState<FilterType>("ALL");

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(num);
    };

    const getChangeTypeLabel = (type: string) => {
        switch (type) {
            case "NEW":
                return { label: "Mới", className: "badge-success" };
            case "INCREASE":
                return { label: "Tăng", className: "badge-success" };
            case "DECREASE":
                return { label: "Giảm", className: "badge-warning" };
            case "REMOVED":
                return { label: "Hết hàng", className: "badge-danger" };
            default:
                return { label: type, className: "badge-info" };
        }
    };

    // Lọc theo filter
    const filteredChanges = useMemo(() => {
        if (filter === "ALL") return changes;
        if (filter === "NEW") return changes.filter(c => c.changeType === "NEW");
        if (filter === "REMOVED") return changes.filter(c => c.changeType === "REMOVED");
        if (filter === "UPDATE") return changes.filter(c => c.changeType === "INCREASE" || c.changeType === "DECREASE");
        return changes;
    }, [changes, filter]);

    // Tính tổng giá trị biến động
    const totalValue = useMemo(() => {
        return filteredChanges.reduce((sum, change) => {
            const diff = change.quantityDiff || 0;
            const price = change.material.donGia || 0;
            return sum + (diff * price);
        }, 0);
    }, [filteredChanges]);

    // Tính giá trị cho từng item
    const getItemValue = (change: MaterialChange) => {
        const diff = change.quantityDiff || 0;
        const price = change.material.donGia || 0;
        return diff * price;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Filter Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setFilter("ALL")}
                    className={`badge transition-all cursor-pointer ${filter === "ALL"
                        ? "badge-info ring-2 ring-indigo-400"
                        : "badge-info opacity-60 hover:opacity-100"
                        }`}
                >
                    Tất cả ({changes.length})
                </button>
                {summary.newItems > 0 && (
                    <button
                        onClick={() => setFilter("NEW")}
                        className={`badge transition-all cursor-pointer ${filter === "NEW"
                            ? "badge-success ring-2 ring-green-400"
                            : "badge-success opacity-60 hover:opacity-100"
                            }`}
                    >
                        +{summary.newItems} mới
                    </button>
                )}
                {summary.updatedItems > 0 && (
                    <button
                        onClick={() => setFilter("UPDATE")}
                        className={`badge transition-all cursor-pointer ${filter === "UPDATE"
                            ? "badge-warning ring-2 ring-amber-400"
                            : "badge-warning opacity-60 hover:opacity-100"
                            }`}
                    >
                        {summary.updatedItems} cập nhật
                    </button>
                )}
                {summary.removedItems > 0 && (
                    <button
                        onClick={() => setFilter("REMOVED")}
                        className={`badge transition-all cursor-pointer ${filter === "REMOVED"
                            ? "badge-danger ring-2 ring-red-400"
                            : "badge-danger opacity-60 hover:opacity-100"
                            }`}
                    >
                        -{summary.removedItems} hết
                    </button>
                )}
            </div>

            {/* Changes List */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto flex-1">
                {filteredChanges.map((change) => {
                    const typeInfo = getChangeTypeLabel(change.changeType);
                    const itemValue = getItemValue(change);

                    return (
                        <div
                            key={change.id}
                            className="p-4 rounded-xl border border-gray-700 bg-gray-800/50"
                        >
                            <div className="flex items-start justify-between mb-2 gap-4">
                                <div className="min-w-0 flex-1">
                                    <span className="font-mono text-xs text-indigo-400">
                                        {change.material.maVT}
                                    </span>
                                    <p className="text-sm mt-1 font-medium truncate" title={change.material.tenVT}>
                                        {change.material.tenVT}
                                    </p>
                                </div>
                                <span className={`badge flex-shrink-0 ${typeInfo.className}`}>
                                    {typeInfo.label}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4 text-sm mt-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400 font-mono">
                                        {change.changeType === "NEW" ? "Mới" : change.oldQuantity}
                                        {" → "}
                                        {change.changeType === "REMOVED" ? "Hết" : change.newQuantity}
                                    </span>
                                    <span className={`font-bold ${change.quantityDiff && change.quantityDiff > 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                        }`}>
                                        {change.quantityDiff && change.quantityDiff > 0 ? "+" : ""}
                                        {change.quantityDiff}
                                    </span>
                                </div>

                                {/* Giá trị biến động */}
                                {itemValue !== 0 && (
                                    <span className={`text-xs font-medium ${itemValue > 0 ? "text-green-400" : "text-red-400"
                                        }`}>
                                        {itemValue > 0 ? "+" : ""}{formatCurrency(itemValue)}
                                    </span>
                                )}
                            </div>

                            {change.note && (
                                <p className="text-xs text-gray-500 mt-2 truncate" title={change.note}>
                                    {change.note}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tổng giá trị */}
            {filteredChanges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            Tổng giá trị biến động ({filteredChanges.length} mục):
                        </span>
                        <span className={`text-lg font-bold ${totalValue >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                            {totalValue >= 0 ? "+" : ""}{formatCurrency(totalValue)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
