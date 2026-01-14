import { getImportHistory, getImportChanges } from "@/actions/materials";
import Link from "next/link";
import { HistoryList } from "./HistoryList";
import { ChangeDetails } from "./ChangeDetails";

export default async function LichSuPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; detail?: string }>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const detailId = params.detail;

    const { imports, total, totalPages } = await getImportHistory(page, 10);
    const detailChanges = detailId ? await getImportChanges(detailId) : null;

    // Lấy ID của lần import gần nhất
    const latestImportId = imports.length > 0 ? imports[0].id : undefined;

    // Lấy thông tin tóm tắt của lần import được chọn
    const selectedImport = imports.find(i => i.id === detailId);
    const summary = selectedImport ? {
        newItems: selectedImport.newItems,
        updatedItems: selectedImport.updatedItems,
        removedItems: selectedImport.removedItems,
    } : { newItems: 0, updatedItems: 0, removedItems: 0 };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold gradient-text mb-8">Lịch Sử Import</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Import History List */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Danh sách lần Import</h2>

                    <HistoryList
                        imports={imports}
                        detailId={detailId}
                        latestImportId={latestImportId}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {page > 1 && (
                                <Link
                                    href={`/lich-su?page=${page - 1}`}
                                    className="btn-secondary text-sm"
                                >
                                    ← Trước
                                </Link>
                            )}
                            <span className="text-sm text-gray-400">
                                {page} / {totalPages}
                            </span>
                            {page < totalPages && (
                                <Link
                                    href={`/lich-su?page=${page + 1}`}
                                    className="btn-secondary text-sm"
                                >
                                    Sau →
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Change Details */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Chi tiết thay đổi</h2>

                    {!detailId ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <p className="text-gray-400">Chọn một lần import để xem chi tiết</p>
                        </div>
                    ) : !detailChanges || detailChanges.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Không có thay đổi nào</p>
                        </div>
                    ) : (
                        <ChangeDetails
                            changes={detailChanges}
                            summary={summary}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
