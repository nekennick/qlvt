import { getMaterials } from "@/actions/materials";
import Link from "next/link";

export default async function VatTuPage({
    searchParams,
}: {
    searchParams: Promise<{
        search?: string;
        page?: string;
        inactive?: string;
        limit?: string;
        sortBy?: string;
        order?: string;
    }>;
}) {
    const params = await searchParams;
    const search = params.search || "";
    const page = parseInt(params.page || "1");
    const limit = parseInt(params.limit || "50");
    const showInactive = params.inactive === "true";
    const sortBy = params.sortBy || "updatedAt";
    const sortOrder = (params.order as "asc" | "desc") || "desc";

    const { materials, total, totalPages } = await getMaterials({
        search,
        showInactive,
        page,
        limit,
        sortBy,
        order: sortOrder,
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

    const getSortLink = (column: string) => {
        const nextOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
        const query = new URLSearchParams({
            search,
            inactive: String(showInactive),
            limit: String(limit),
            page: "1",
            sortBy: column,
            order: nextOrder,
        });
        return `/vat-tu?${query.toString()}`;
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) return <span className="ml-1 opacity-20">⇅</span>;
        return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
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
                    <input type="hidden" name="limit" value={limit} />
                    <input type="hidden" name="sortBy" value={sortBy} />
                    <input type="hidden" name="order" value={sortOrder} />

                    <div className="flex-1">
                        <input
                            type="text"
                            name="search"
                            placeholder="Tìm kiếm theo mã VT hoặc tên..."
                            defaultValue={search}
                            className="input-field"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <input
                            type="checkbox"
                            name="inactive"
                            value="true"
                            defaultChecked={showInactive}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500"
                        />
                        Hiện hết hàng
                    </label>
                    <button type="submit" className="btn-primary">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* Results Info & Rows Per Page */}
            <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-gray-400 text-sm">
                    Hiển thị {materials.length} / {total} vật tư
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Hiển thị:</span>
                    {[50, 100, 150].map((size) => (
                        <Link
                            key={size}
                            href={`/vat-tu?limit=${size}&search=${search}&inactive=${showInactive}`}
                            className={`px-2 py-1 rounded hover:bg-white/10 transition-colors ${limit === size ? "text-indigo-400 font-bold bg-indigo-500/10" : ""
                                }`}
                        >
                            {size}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Materials Table */}
            <div className="glass-card overflow-hidden">
                {materials.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-xl text-gray-400">Không tìm thấy vật tư</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="w-16">
                                        <Link href={getSortLink("stt")} className="flex items-center">
                                            STT <SortIcon column="stt" />
                                        </Link>
                                    </th>
                                    <th>
                                        <Link href={getSortLink("maVT")} className="flex items-center">
                                            Mã VT <SortIcon column="maVT" />
                                        </Link>
                                    </th>
                                    <th>
                                        <Link href={getSortLink("tenVT")} className="flex items-center">
                                            Tên VT <SortIcon column="tenVT" />
                                        </Link>
                                    </th>
                                    <th>ĐVT</th>
                                    <th>Chất lượng</th>
                                    <th>
                                        <Link href={getSortLink("soLuong")} className="flex items-center">
                                            Số lượng <SortIcon column="soLuong" />
                                        </Link>
                                    </th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((material) => (
                                    <tr key={material.id}>
                                        <td className="text-gray-500 text-xs">{material.stt || "-"}</td>
                                        <td className="font-mono text-sm">{material.maVT}</td>
                                        <td className="max-w-xs truncate text-sm" title={material.tenVT}>
                                            {material.tenVT}
                                        </td>
                                        <td className="text-sm">{material.dvt || "-"}</td>
                                        <td className="text-sm">
                                            <span className={`text-xs ${material.chatLuong === "Hàng mới" ? "text-green-400" : "text-amber-400"}`}>
                                                {material.chatLuong || "-"}
                                            </span>
                                        </td>
                                        <td className="font-medium text-sm">
                                            {formatNumber(material.soLuong)}
                                        </td>
                                        <td className="text-sm">{formatCurrency(material.donGia)}</td>
                                        <td className="text-sm">{formatCurrency(material.thanhTien)}</td>
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
                            href={`/vat-tu?page=${page - 1}&search=${search}&inactive=${showInactive}&limit=${limit}&sortBy=${sortBy}&order=${sortOrder}`}
                            className="btn-secondary text-sm py-2"
                        >
                            ← Trước
                        </Link>
                    )}

                    <span className="px-4 py-2 text-gray-400 text-sm">
                        Trang {page} / {totalPages}
                    </span>

                    {page < totalPages && (
                        <Link
                            href={`/vat-tu?page=${page + 1}&search=${search}&inactive=${showInactive}&limit=${limit}&sortBy=${sortBy}&order=${sortOrder}`}
                            className="btn-secondary text-sm py-2"
                        >
                            Sau →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
