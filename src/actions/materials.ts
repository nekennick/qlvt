"use server";

import { db } from "@/lib/db";
import { parseExcelFile, MaterialRow } from "@/lib/excel-parser";
import { detectChanges, ChangeDetectionResult } from "@/lib/change-detector";
import { revalidatePath } from "next/cache";

export interface ImportPreviewResult {
    success: boolean;
    data?: MaterialRow[];
    changes?: ChangeDetectionResult;
    error?: string;
}

export interface ImportCommitResult {
    success: boolean;
    importId?: string;
    summary?: string;
    error?: string;
}

/**
 * Preview dữ liệu từ file Excel và phát hiện thay đổi
 */
export async function previewImport(formData: FormData): Promise<ImportPreviewResult> {
    try {
        const file = formData.get("file") as File;

        if (!file) {
            return { success: false, error: "Không tìm thấy file" };
        }

        const buffer = await file.arrayBuffer();
        const data = parseExcelFile(buffer);

        if (data.length === 0) {
            return { success: false, error: "File không có dữ liệu hoặc định dạng không đúng" };
        }

        // Lấy danh sách vật tư hiện tại
        const existingMaterials = await db.material.findMany({
            where: { isActive: true },
        });

        // Phát hiện thay đổi
        const changes = detectChanges(data, existingMaterials);

        return {
            success: true,
            data,
            changes,
        };
    } catch (error) {
        console.error("Preview import error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Lỗi không xác định",
        };
    }
}

/**
 * Commit dữ liệu import vào database
 */
export async function commitImport(
    fileName: string,
    data: MaterialRow[],
    changes: ChangeDetectionResult
): Promise<ImportCommitResult> {
    try {
        // Tạo record ImportHistory
        const importHistory = await db.importHistory.create({
            data: {
                fileName,
                totalItems: data.length,
                newItems: changes.newItems.length,
                updatedItems: changes.increasedItems.length + changes.decreasedItems.length,
                removedItems: changes.removedItems.length,
            },
        });

        // Xử lý vật tư mới (hoặc vật tư đã bị ẩn trước đó)
        for (const item of changes.newItems) {
            const rowData = data.find((d) => d.maVT === item.maVT);
            if (!rowData) continue;

            // Sử dụng upsert để xử lý cả trường hợp vật tư đã tồn tại nhưng bị ẩn
            const material = await db.material.upsert({
                where: { maVT: rowData.maVT },
                create: {
                    stt: rowData.stt,
                    maVT: rowData.maVT,
                    tenVT: rowData.tenVT,
                    dvt: rowData.dvt,
                    soLo: rowData.soLo,
                    noiSX: rowData.noiSX,
                    chatLuong: rowData.chatLuong,
                    soLuong: rowData.soLuong,
                    donGia: rowData.donGia,
                    thanhTien: rowData.thanhTien,
                    isActive: true,
                },
                update: {
                    stt: rowData.stt,
                    tenVT: rowData.tenVT,
                    dvt: rowData.dvt,
                    soLo: rowData.soLo,
                    noiSX: rowData.noiSX,
                    chatLuong: rowData.chatLuong,
                    soLuong: rowData.soLuong,
                    donGia: rowData.donGia,
                    thanhTien: rowData.thanhTien,
                    isActive: true,
                },
            });

            await db.materialChange.create({
                data: {
                    materialId: material.id,
                    importId: importHistory.id,
                    changeType: "NEW",
                    oldQuantity: null,
                    newQuantity: rowData.soLuong,
                    quantityDiff: rowData.soLuong,
                    note: item.note,
                },
            });
        }

        // Xử lý vật tư tăng số lượng
        for (const item of changes.increasedItems) {
            const rowData = data.find((d) => d.maVT === item.maVT);
            if (!rowData) continue;

            const material = await db.material.update({
                where: { maVT: item.maVT },
                data: {
                    stt: rowData.stt,
                    tenVT: rowData.tenVT,
                    dvt: rowData.dvt,
                    soLo: rowData.soLo,
                    noiSX: rowData.noiSX,
                    chatLuong: rowData.chatLuong,
                    soLuong: rowData.soLuong,
                    donGia: rowData.donGia,
                    thanhTien: rowData.thanhTien,
                },
            });

            await db.materialChange.create({
                data: {
                    materialId: material.id,
                    importId: importHistory.id,
                    changeType: "INCREASE",
                    oldQuantity: item.oldQuantity,
                    newQuantity: item.newQuantity,
                    quantityDiff: item.quantityDiff,
                    note: item.note,
                },
            });
        }

        // Xử lý vật tư giảm số lượng
        for (const item of changes.decreasedItems) {
            const rowData = data.find((d) => d.maVT === item.maVT);
            if (!rowData) continue;

            const material = await db.material.update({
                where: { maVT: item.maVT },
                data: {
                    tenVT: rowData.tenVT,
                    dvt: rowData.dvt,
                    soLo: rowData.soLo,
                    noiSX: rowData.noiSX,
                    chatLuong: rowData.chatLuong,
                    soLuong: rowData.soLuong,
                    donGia: rowData.donGia,
                    thanhTien: rowData.thanhTien,
                },
            });

            await db.materialChange.create({
                data: {
                    materialId: material.id,
                    importId: importHistory.id,
                    changeType: "DECREASE",
                    oldQuantity: item.oldQuantity,
                    newQuantity: item.newQuantity,
                    quantityDiff: item.quantityDiff,
                    note: item.note,
                },
            });
        }

        // Xử lý vật tư hết hàng (đánh dấu isActive = false)
        for (const item of changes.removedItems) {
            const material = await db.material.update({
                where: { maVT: item.maVT },
                data: {
                    isActive: false,
                    soLuong: 0,
                },
            });

            await db.materialChange.create({
                data: {
                    materialId: material.id,
                    importId: importHistory.id,
                    changeType: "REMOVED",
                    oldQuantity: item.oldQuantity,
                    newQuantity: 0,
                    quantityDiff: item.quantityDiff,
                    note: item.note,
                },
            });
        }

        // Cập nhật các vật tư không thay đổi (chỉ cập nhật thông tin mới nhất)
        for (const rowData of data) {
            const isInChanges =
                changes.newItems.some((c) => c.maVT === rowData.maVT) ||
                changes.increasedItems.some((c) => c.maVT === rowData.maVT) ||
                changes.decreasedItems.some((c) => c.maVT === rowData.maVT);

            if (!isInChanges) {
                await db.material.updateMany({
                    where: { maVT: rowData.maVT },
                    data: {
                        stt: rowData.stt,
                        tenVT: rowData.tenVT,
                        dvt: rowData.dvt,
                        soLo: rowData.soLo,
                        noiSX: rowData.noiSX,
                        chatLuong: rowData.chatLuong,
                        donGia: rowData.donGia,
                        thanhTien: rowData.thanhTien,
                    },
                });
            }
        }

        revalidatePath("/");
        revalidatePath("/vat-tu");
        revalidatePath("/lich-su");

        const summary = `Import thành công: ${changes.newItems.length} mới, ${changes.increasedItems.length} tăng, ${changes.decreasedItems.length} giảm, ${changes.removedItems.length} hết hàng`;

        return {
            success: true,
            importId: importHistory.id,
            summary,
        };
    } catch (error) {
        console.error("Commit import error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Lỗi không xác định",
        };
    }
}

/**
 * Lấy danh sách vật tư
 */
export async function getMaterials(options?: {
    search?: string;
    showInactive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
}) {
    const {
        search = "",
        showInactive = false,
        page = 1,
        limit = 50,
        sortBy = "maVT",
        order = "asc"
    } = options || {};

    const where = {
        ...(showInactive ? {} : { isActive: true }),
        ...(search
            ? {
                OR: [
                    { maVT: { contains: search } },
                    { tenVT: { contains: search } },
                ],
            }
            : {}),
    };

    // Xác định logic sắp xếp
    let orderBy: any = { [sortBy]: order };

    // Nếu sắp xếp theo stt, cần handle vì nó là string trong DB
    if (sortBy === "stt") {
        orderBy = { stt: order };
    }

    const [materials, total] = await Promise.all([
        db.material.findMany({
            where,
            orderBy,
            ...(limit > 0 ? {
                skip: (page - 1) * limit,
                take: limit,
            } : {}),
        }),
        db.material.count({ where }),
    ]);

    return {
        materials,
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    };
}

/**
 * Lấy lịch sử import
 */
export async function getImportHistory(page = 1, limit = 10) {
    const [imports, total] = await Promise.all([
        db.importHistory.findMany({
            orderBy: { importedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: {
                    select: { changes: true },
                },
            },
        }),
        db.importHistory.count(),
    ]);

    return {
        imports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Lấy chi tiết thay đổi của một lần import
 */
export async function getImportChanges(importId: string) {
    const changes = await db.materialChange.findMany({
        where: { importId },
        include: {
            material: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return changes;
}

/**
 * Lấy thống kê tổng quan
 */
export async function getDashboardStats() {
    const [
        totalMaterials,
        activeMaterials,
        inactiveMaterials,
        totalValue,
        recentImport,
    ] = await Promise.all([
        db.material.count(),
        db.material.count({ where: { isActive: true } }),
        db.material.count({ where: { isActive: false } }),
        db.material.aggregate({
            where: { isActive: true },
            _sum: { thanhTien: true },
        }),
        db.importHistory.findFirst({
            orderBy: { importedAt: "desc" },
        }),
    ]);

    return {
        totalMaterials,
        activeMaterials,
        inactiveMaterials,
        totalValue: totalValue._sum.thanhTien || 0,
        recentImport,
    };
}
