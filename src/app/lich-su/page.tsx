import { getImportHistory, getImportChanges } from "@/actions/materials";
import Link from "next/link";

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

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "full",
            timeStyle: "short",
        }).format(new Date(date));
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

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold gradient-text mb-8">Lịch Sử Import</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Import History List */}
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-4">Danh sách lần Import</h2>

                    {imports.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-400">Chưa có lịch sử import</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {imports.map((imp) => (
                                <Link
                                    key={imp.id}
                                    href={`/lich-su?detail=${imp.id}`}
                                    className={`block p-4 rounded-xl border transition-all ${detailId === imp.id
                                        ? "border-indigo-500 bg-indigo-500/10"
                                        : "border-gray-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{imp.fileName}</span>
                                        <span className="text-xs text-gray-400">
                                            {imp._count.changes} thay đổi
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 mb-2">
                                        {formatDate(imp.importedAt)}
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
                            ))}
                        </div>
                    )}

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
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {detailChanges.map((change) => {
                                const typeInfo = getChangeTypeLabel(change.changeType);
                                return (
                                    <div
                                        key={change.id}
                                        className="p-4 rounded-xl border border-gray-700 bg-gray-800/50"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <span className="font-mono text-sm text-indigo-400">
                                                    {change.material.maVT}
                                                </span>
                                                <p className="text-sm mt-1">{change.material.tenVT}</p>
                                            </div>
                                            <span className={`badge ${typeInfo.className}`}>
                                                {typeInfo.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm mt-2">
                                            <span className="text-gray-400">
                                                {change.changeType === "NEW" ? "Mới" : change.oldQuantity}
                                                {" → "}
                                                {change.changeType === "REMOVED" ? "Hết" : change.newQuantity}
                                            </span>
                                            <span className={
                                                change.quantityDiff && change.quantityDiff > 0
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }>
                                                {change.quantityDiff && change.quantityDiff > 0 ? "+" : ""}
                                                {change.quantityDiff}
                                            </span>
                                        </div>

                                        {change.note && (
                                            <p className="text-xs text-gray-500 mt-2">{change.note}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
