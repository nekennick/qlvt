"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Xóa một bản ghi lịch sử import.
 * - Nếu là lần import gần nhất: hoàn tác số lượng vật tư về trạng thái trước đó.
 * - Nếu là lần import cũ hơn: chỉ xóa bản ghi lịch sử, không thay đổi số lượng hiện tại.
 */
export async function deleteImportHistory(historyId: string) {
    try {
        // Lấy thông tin lịch sử cần xóa
        const history = await db.importHistory.findUnique({
            where: { id: historyId },
            include: {
                changes: true,
            },
        });

        if (!history) {
            return { success: false, error: "Không tìm thấy bản ghi lịch sử" };
        }

        // Kiểm tra xem đây có phải là lần import gần nhất không
        const latestImport = await db.importHistory.findFirst({
            orderBy: { importedAt: "desc" },
        });

        const isLatestImport = latestImport?.id === historyId;

        // Nếu là lần import gần nhất, hoàn tác số lượng vật tư
        if (isLatestImport && history.changes.length > 0) {
            for (const change of history.changes) {
                const material = await db.material.findUnique({
                    where: { id: change.materialId },
                });

                if (material) {
                    // Hoàn tác số lượng
                    if (change.changeType === "NEW") {
                        // Vật tư mới -> Xóa hoặc đánh dấu không còn
                        await db.material.update({
                            where: { id: change.materialId },
                            data: {
                                isActive: false,
                                soLuong: 0,
                            },
                        });
                    } else if (change.changeType === "REMOVED") {
                        // Vật tư bị xóa -> Khôi phục lại
                        await db.material.update({
                            where: { id: change.materialId },
                            data: {
                                isActive: true,
                                soLuong: change.oldQuantity || 0,
                            },
                        });
                    } else {
                        // Thay đổi số lượng -> Quay về số lượng cũ
                        await db.material.update({
                            where: { id: change.materialId },
                            data: {
                                soLuong: change.oldQuantity || 0,
                            },
                        });
                    }
                }
            }
        }

        // Xóa các bản ghi MaterialChange liên quan
        await db.materialChange.deleteMany({
            where: { importId: historyId },
        });

        // Xóa bản ghi ImportHistory
        await db.importHistory.delete({
            where: { id: historyId },
        });

        // Revalidate các trang liên quan
        revalidatePath("/");
        revalidatePath("/vat-tu");
        revalidatePath("/lich-su");

        return {
            success: true,
            message: isLatestImport
                ? "Đã xóa lịch sử và hoàn tác dữ liệu vật tư thành công"
                : "Đã xóa lịch sử (dữ liệu vật tư hiện tại không thay đổi)",
            undoApplied: isLatestImport,
        };
    } catch (error) {
        console.error("Error deleting import history:", error);
        return {
            success: false,
            error: "Có lỗi xảy ra khi xóa lịch sử import",
        };
    }
}

/**
 * Lấy danh sách lịch sử import
 */
export async function getImportHistories() {
    const histories = await db.importHistory.findMany({
        orderBy: { importedAt: "desc" },
        include: {
            _count: {
                select: { changes: true },
            },
        },
    });

    return histories;
}

/**
 * Lấy chi tiết thay đổi của một lần import
 */
export async function getImportChanges(historyId: string) {
    const changes = await db.materialChange.findMany({
        where: { importId: historyId },
        include: {
            material: true,
        },
        orderBy: { material: { maVT: "asc" } },
    });

    return changes;
}
