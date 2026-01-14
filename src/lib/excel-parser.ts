import * as XLSX from "xlsx";

export interface MaterialRow {
    stt: string | number;
    maVT: string;
    tenVT: string;
    dvt: string | null;
    soLo: string | null;
    noiSX: string | null;
    chatLuong: string | null;
    soLuong: number;
    donGia: number | null;
    thanhTien: number | null;
}

/**
 * Tìm giá trị trong row dựa trên key (không phân biệt hoa thường, trim khoảng trắng)
 */
function getValue(row: Record<string, any>, possibleKeys: string[]): any {
    const keys = Object.keys(row);
    for (const pKey of possibleKeys) {
        // Trim cả khoảng trắng unicode \u00A0 thường gặp trong Excel
        const target = pKey.toLowerCase().replace(/[\s\u00A0]/g, "");
        const foundKey = keys.find(k => k.toLowerCase().replace(/[\s\u00A0]/g, "") === target);
        if (foundKey !== undefined) return row[foundKey];
    }
    return null;
}

/**
 * Đọc file Excel và trả về danh sách vật tư
 */
export function parseExcelFile(buffer: ArrayBuffer): MaterialRow[] {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Đọc dữ liệu raw với header
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: null,
    });

    const materials: MaterialRow[] = [];

    for (const row of rawData) {
        // Map các cột từ file Excel linh hoạt hơn
        const maVT = String(getValue(row, ["Mã VT", "Ma VT"]) || "").trim();

        // Bỏ qua các dòng không có mã vật tư
        if (!maVT) continue;

        const tenVT = String(getValue(row, ["Tên VT", "Ten VT"]) || "").trim();
        const dvt = getValue(row, ["ĐVT", "DVT"]);
        const soLo = getValue(row, ["Số lô", "So lo"]);
        const noiSX = getValue(row, ["Nơi SX", "Noi SX"]);
        const chatLuong = getValue(row, ["Chất lượng", "Chat luong"]);

        let soLuongRaw = getValue(row, ["Số lượng", "So luong"]);
        let soLuong = 0;
        if (typeof soLuongRaw === "number") {
            soLuong = soLuongRaw;
        } else if (typeof soLuongRaw === "string") {
            // Xử lý chuỗi số có dấu phẩy hoặc khoảng trắng
            const cleaned = soLuongRaw.replace(/,/g, "").trim();
            soLuong = parseFloat(cleaned);
        }

        const donGia = getValue(row, ["Đơn giá", "Don gia"]);
        const thanhTien = getValue(row, ["Thành tiền", "Thanh tien"]);

        materials.push({
            stt: getValue(row, ["STT"]) || "",
            maVT,
            tenVT,
            dvt: dvt ? String(dvt) : null,
            soLo: soLo ? String(soLo) : null,
            noiSX: noiSX ? String(noiSX) : null,
            chatLuong: chatLuong ? String(chatLuong) : null,
            soLuong: isNaN(soLuong) ? 0 : soLuong,
            donGia: donGia !== null ? Number(String(donGia).replace(/,/g, "")) : null,
            thanhTien: thanhTien !== null ? Number(String(thanhTien).replace(/,/g, "")) : null,
        });
    }

    return materials;
}
