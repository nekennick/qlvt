import { getMaterials } from "@/actions/materials";
import Link from "next/link";

export default async function VatTuPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string; inactive?: string }>;
}) {
    const params = await searchParams;
    const search = params.search || "";
    const page = parseInt(params.page || "1");
    const showInactive = params.inactive === "true";

    const { materials, total, totalPages } = await getMaterials({
        search,
        showInactive,
        page,
        limit: 20,
    });

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("vi-VN").format(num);
    };

    const formatCurrency = (num: number | null) => {
        if (num === null) return "-";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(num);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold gradient-text">Danh Sách Vật Tư</h1>
                <Link href="/import" className="btn-primary">
                    + Import Excel
                </Link>
            </div>

            {/* Search & Filters */}
            <div className="glass-card p-4 mb-6">
                <form className="flex gap-4 items-center">
                    <div className="flex-1">
                        <input
                            type="text"
                            name="search"
                            placeholder="Tìm kiếm theo mã VT hoặc tên..."
                            defaultValue={search}
                            className="input-field"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="inactive"
                            value="true"
                            defaultChecked={showInactive}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500"
                        />
                        Hiển thị hết hàng
                    </label>
                    <button type="submit" className="btn-primary">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400">
                    Hiển thị {materials.length} / {total} vật tư
                </p>
            </div>

            {/* Materials Table */}
            <div className="glass-card overflow-hidden">
                {materials.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-xl text-gray-400">Không tìm thấy vật tư</p>
                        <p className="text-gray-500 mt-2">Hãy import file Excel để thêm dữ liệu</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mã VT</th>
                                    <th>Tên VT</th>
                                    <th>ĐVT</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((material) => (
                                    <tr key={material.id}>
                                        <td className="font-mono text-sm">{material.maVT}</td>
                                        <td className="max-w-xs truncate" title={material.tenVT}>
                                            {material.tenVT}
                                        </td>
                                        <td>{material.dvt || "-"}</td>
                                        <td className="font-medium">
                                            {formatNumber(material.soLuong)}
                                        </td>
                                        <td>{formatCurrency(material.donGia)}</td>
                                        <td>{formatCurrency(material.thanhTien)}</td>
                                        <td>
                                            {material.isActive ? (
                                                <span className="badge badge-success">Còn hàng</span>
                                            ) : (
                                                <span className="badge badge-danger">Hết hàng</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {page > 1 && (
                        <Link
                            href={`/vat-tu?page=${page - 1}&search=${search}&inactive=${showInactive}`}
                            className="btn-secondary"
                        >
                            ← Trước
                        </Link>
                    )}

                    <span className="px-4 py-2 text-gray-400">
                        Trang {page} / {totalPages}
                    </span>

                    {page < totalPages && (
                        <Link
                            href={`/vat-tu?page=${page + 1}&search=${search}&inactive=${showInactive}`}
                            className="btn-secondary"
                        >
                            Sau →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
