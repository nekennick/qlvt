"use client";

import { useState, useRef } from "react";
import { previewImport, commitImport, ImportPreviewResult } from "@/actions/materials";
import { MaterialRow } from "@/lib/excel-parser";
import { ChangeDetectionResult } from "@/lib/change-detector";

export default function ImportPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<MaterialRow[] | null>(null);
    const [changes, setChanges] = useState<ChangeDetectionResult | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setFileName(file.name);

        const formData = new FormData();
        formData.append("file", file);

        const result: ImportPreviewResult = await previewImport(formData);

        if (result.success && result.data && result.changes) {
            setPreviewData(result.data);
            setChanges(result.changes);
        } else {
            setError(result.error || "Lỗi không xác định");
            setPreviewData(null);
            setChanges(null);
        }

        setIsLoading(false);
    };

    const handleCommit = async () => {
        if (!previewData || !changes) return;

        setIsLoading(true);
        setError(null);

        const result = await commitImport(fileName, previewData, changes);

        if (result.success) {
            setSuccess(result.summary || "Import thành công!");
            setPreviewData(null);
            setChanges(null);
            setFileName("");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } else {
            setError(result.error || "Lỗi khi commit");
        }

        setIsLoading(false);
    };

    const handleCancel = () => {
        setPreviewData(null);
        setChanges(null);
        setFileName("");
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const hasChanges = changes && (
        changes.newItems.length > 0 ||
        changes.increasedItems.length > 0 ||
        changes.decreasedItems.length > 0 ||
        changes.removedItems.length > 0
    );

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold gradient-text mb-8">Import Excel</h1>

            {/* Upload Zone */}
            {!previewData && (
                <div className="glass-card p-8">
                    <label className="upload-zone block cursor-pointer">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col items-center">
                            {isLoading ? (
                                <>
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-lg">Đang xử lý...</p>
                                </>
                            ) : (
                                <>
                                    <svg className="w-16 h-16 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-xl font-medium mb-2">Kéo thả file Excel vào đây</p>
                                    <p className="text-gray-400">hoặc click để chọn file (.xlsx, .xls)</p>
                                </>
                            )}
                        </div>
                    </label>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="glass-card p-4 mt-6 border-red-500/50 bg-red-500/10">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="glass-card p-4 mt-6 border-green-500/50 bg-green-500/10">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-green-400">{success}</p>
                    </div>
                </div>
            )}

            {/* Preview Changes */}
            {changes && previewData && (
                <div className="mt-8 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-card p-4 border-green-500/30">
                            <p className="text-green-400 text-2xl font-bold">{changes.newItems.length}</p>
                            <p className="text-gray-400 text-sm">Vật tư mới</p>
                        </div>
                        <div className="glass-card p-4 border-emerald-500/30">
                            <p className="text-emerald-400 text-2xl font-bold">{changes.increasedItems.length}</p>
                            <p className="text-gray-400 text-sm">Tăng số lượng</p>
                        </div>
                        <div className="glass-card p-4 border-amber-500/30">
                            <p className="text-amber-400 text-2xl font-bold">{changes.decreasedItems.length}</p>
                            <p className="text-gray-400 text-sm">Giảm số lượng</p>
                        </div>
                        <div className="glass-card p-4 border-red-500/30">
                            <p className="text-red-400 text-2xl font-bold">{changes.removedItems.length}</p>
                            <p className="text-gray-400 text-sm">Hết hàng</p>
                        </div>
                    </div>

                    {/* Change Details */}
                    {hasChanges && (
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4">Chi tiết thay đổi</h2>

                            {/* New Items */}
                            {changes.newItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                        Vật tư mới ({changes.newItems.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã VT</th>
                                                    <th>Tên VT</th>
                                                    <th>Số lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {changes.newItems.slice(0, 10).map((item) => (
                                                    <tr key={item.maVT}>
                                                        <td className="font-mono">{item.maVT}</td>
                                                        <td>{item.tenVT}</td>
                                                        <td className="text-green-400">+{item.newQuantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {changes.newItems.length > 10 && (
                                            <p className="text-gray-400 text-sm mt-2">...và {changes.newItems.length - 10} vật tư khác</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Increased Items */}
                            {changes.increasedItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                        Tăng số lượng ({changes.increasedItems.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã VT</th>
                                                    <th>Tên VT</th>
                                                    <th>Cũ</th>
                                                    <th>Mới</th>
                                                    <th>Chênh lệch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {changes.increasedItems.slice(0, 10).map((item) => (
                                                    <tr key={item.maVT}>
                                                        <td className="font-mono">{item.maVT}</td>
                                                        <td>{item.tenVT}</td>
                                                        <td>{item.oldQuantity}</td>
                                                        <td>{item.newQuantity}</td>
                                                        <td className="text-emerald-400">+{item.quantityDiff}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Decreased Items */}
                            {changes.decreasedItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                        Giảm số lượng ({changes.decreasedItems.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã VT</th>
                                                    <th>Tên VT</th>
                                                    <th>Cũ</th>
                                                    <th>Mới</th>
                                                    <th>Chênh lệch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {changes.decreasedItems.slice(0, 10).map((item) => (
                                                    <tr key={item.maVT}>
                                                        <td className="font-mono">{item.maVT}</td>
                                                        <td>{item.tenVT}</td>
                                                        <td>{item.oldQuantity}</td>
                                                        <td>{item.newQuantity}</td>
                                                        <td className="text-amber-400">{item.quantityDiff}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Removed Items */}
                            {changes.removedItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        Hết hàng ({changes.removedItems.length})
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã VT</th>
                                                    <th>Tên VT</th>
                                                    <th>Số lượng cũ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {changes.removedItems.slice(0, 10).map((item) => (
                                                    <tr key={item.maVT}>
                                                        <td className="font-mono">{item.maVT}</td>
                                                        <td>{item.tenVT}</td>
                                                        <td className="text-red-400">{item.oldQuantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No changes message */}
                    {!hasChanges && (
                        <div className="glass-card p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xl text-gray-400">Không có thay đổi nào</p>
                            <p className="text-gray-500 mt-2">Dữ liệu trong file giống với dữ liệu hiện tại</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end">
                        <button onClick={handleCancel} className="btn-secondary" disabled={isLoading}>
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleCommit}
                            className="btn-primary"
                            disabled={isLoading || !hasChanges}
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận Import"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
