"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteImportHistory } from "@/actions/history";

interface ImportHistoryItem {
    id: string;
    fileName: string;
    importedAt: Date;
    newItems: number;
    updatedItems: number;
    removedItems: number;
    _count: {
        changes: number;
    };
}

interface HistoryListProps {
    imports: ImportHistoryItem[];
    detailId?: string;
    latestImportId?: string;
}

export function HistoryList({ imports, detailId, latestImportId }: HistoryListProps) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState<ImportHistoryItem | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(date));
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        const result = await deleteImportHistory(deleteTarget.id);

        if (result.success) {
            setMessage({ type: "success", text: result.message || "Xóa thành công" });
            router.refresh();
        } else {
            setMessage({ type: "error", text: result.error || "Có lỗi xảy ra" });
        }

        setDeleteTarget(null);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <>
            {/* Thông báo */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                    {message.text}
                </div>
            )}

            {imports.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-400">Chưa có lịch sử import</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {imports.map((imp, index) => (
                        <div
                            key={imp.id}
                            className={`relative p-4 rounded-xl border transition-all ${detailId === imp.id
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-gray-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                                }`}
                        >
                            <Link
                                href={`/lich-su?detail=${imp.id}`}
                                className="block"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium truncate pr-8" title={imp.fileName}>
                                        {imp.fileName}
                                    </span>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {imp._count.changes} thay đổi
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 mb-2">
                                    {formatDate(imp.importedAt)}
                                    {index === 0 && (
                                        <span className="ml-2 text-xs text-indigo-400 font-medium">
                                            (Gần nhất)
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 text-xs">
                                    {imp.newItems > 0 && (
                                        <span className="badge badge-success">+{imp.newItems} mới</span>
                                    )}
                                    {imp.updatedItems > 0 && (
                                        <span className="badge badge-info">{imp.updatedItems} cập nhật</span>
                                    )}
                                    {imp.removedItems > 0 && (
                                        <span className="badge badge-danger">-{imp.removedItems} hết</span>
                                    )}
                                </div>
                            </Link>

                            {/* Nút xóa */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteTarget(imp);
                                }}
                                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Xóa lịch sử này"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Xóa lịch sử Import"
                message={
                    deleteTarget?.id === latestImportId
                        ? `Đây là lần import gần nhất. Khi xóa, dữ liệu vật tư sẽ được hoàn tác về trạng thái trước đó. Bạn có chắc muốn xóa "${deleteTarget?.fileName}"?`
                        : `Bạn có chắc muốn xóa lịch sử "${deleteTarget?.fileName}"? Dữ liệu vật tư hiện tại sẽ không bị thay đổi.`
                }
                confirmText="Xóa"
                variant="danger"
            />
        </>
    );
}
