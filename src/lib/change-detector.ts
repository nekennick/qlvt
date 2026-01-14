import { Material } from "@prisma/client";
import { MaterialRow } from "./excel-parser";

export type ChangeType = "NEW" | "INCREASE" | "DECREASE" | "REMOVED" | "INFO_UPDATE";

export interface MaterialChange {
    maVT: string;
    tenVT: string;
    changeType: ChangeType;
    oldQuantity: number | null;
    newQuantity: number | null;
    quantityDiff: number | null;
    note?: string;
}

export interface ChangeDetectionResult {
    newItems: MaterialChange[];
    increasedItems: MaterialChange[];
    decreasedItems: MaterialChange[];
    removedItems: MaterialChange[];
    unchangedCount: number;
    totalInFile: number;
}

/**
 * So sánh dữ liệu từ file Excel với dữ liệu hiện tại trong database
 * để phát hiện các thay đổi: tăng, giảm, mới, hết hàng
 */
export function detectChanges(
    newData: MaterialRow[],
    existingMaterials: Material[]
): ChangeDetectionResult {
    const result: ChangeDetectionResult = {
        newItems: [],
        increasedItems: [],
        decreasedItems: [],
        removedItems: [],
        unchangedCount: 0,
        totalInFile: newData.length,
    };

    // Tạo map từ mã VT để tra cứu nhanh
    const existingMap = new Map<string, Material>();
    for (const material of existingMaterials) {
        existingMap.set(material.maVT, material);
    }

    const newMaVTSet = new Set<string>();

    // Duyệt qua từng vật tư trong file mới
    for (const row of newData) {
        newMaVTSet.add(row.maVT);
        const existing = existingMap.get(row.maVT);

        if (!existing) {
            // Vật tư mới
            result.newItems.push({
                maVT: row.maVT,
                tenVT: row.tenVT,
                changeType: "NEW",
                oldQuantity: null,
                newQuantity: row.soLuong,
                quantityDiff: row.soLuong,
                note: `Vật tư mới: ${row.tenVT}`,
            });
        } else if (existing.soLuong !== row.soLuong) {
            // Số lượng thay đổi
            const diff = row.soLuong - existing.soLuong;
            const changeType: ChangeType = diff > 0 ? "INCREASE" : "DECREASE";

            const change: MaterialChange = {
                maVT: row.maVT,
                tenVT: row.tenVT,
                changeType,
                oldQuantity: existing.soLuong,
                newQuantity: row.soLuong,
                quantityDiff: diff,
                note: `${changeType === "INCREASE" ? "Tăng" : "Giảm"} ${Math.abs(diff)} ${existing.dvt || "đơn vị"}`,
            };

            if (changeType === "INCREASE") {
                result.increasedItems.push(change);
            } else {
                result.decreasedItems.push(change);
            }
        } else {
            // Không thay đổi số lượng
            result.unchangedCount++;
        }
    }

    // Tìm các vật tư đã hết (có trong DB nhưng không có trong file mới)
    for (const material of existingMaterials) {
        if (material.isActive && !newMaVTSet.has(material.maVT)) {
            result.removedItems.push({
                maVT: material.maVT,
                tenVT: material.tenVT,
                changeType: "REMOVED",
                oldQuantity: material.soLuong,
                newQuantity: 0,
                quantityDiff: -material.soLuong,
                note: `Vật tư không còn trong file: ${material.tenVT}`,
            });
        }
    }

    return result;
}

/**
 * Tạo summary text từ kết quả phát hiện thay đổi
 */
export function createChangeSummary(result: ChangeDetectionResult): string {
    const parts: string[] = [];

    if (result.newItems.length > 0) {
        parts.push(`✅ ${result.newItems.length} vật tư mới`);
    }
    if (result.increasedItems.length > 0) {
        parts.push(`📈 ${result.increasedItems.length} vật tư tăng số lượng`);
    }
    if (result.decreasedItems.length > 0) {
        parts.push(`📉 ${result.decreasedItems.length} vật tư giảm số lượng`);
    }
    if (result.removedItems.length > 0) {
        parts.push(`❌ ${result.removedItems.length} vật tư hết hàng`);
    }
    if (result.unchangedCount > 0) {
        parts.push(`⏸️ ${result.unchangedCount} vật tư không đổi`);
    }

    return parts.length > 0 ? parts.join(" | ") : "Không có thay đổi";
}
