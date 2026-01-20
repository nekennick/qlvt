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
 * Kiểm tra xem giá trị có match với bất kỳ key nào không (không phân biệt hoa thường)
 */
function isMatch(val: any, keys: string[]): boolean {
    if (!val) return false;
    const str = String(val).toLowerCase().replace(/[\s\u00A0]/g, "");
    return keys.some(k => str.includes(k.toLowerCase().replace(/[\s\u00A0]/g, "")));
}

/**
 * Tìm index của cột trong header row
 */
function findColumnIndex(headerRow: any[], keys: string[]): number {
    return headerRow.findIndex((h: any) => isMatch(h, keys));
}

/**
 * Chuyển đổi giá trị số từ Excel (xử lý dấu phẩy, chấm, khoảng trắng)
 * Ví dụ: "8,00" -> 8, "600 800,00" -> 600800, "1.234.567" -> 1234567
 */
function parseNumber(raw: any): number {
    if (raw === undefined || raw === null || raw === "") return 0;

    if (typeof raw === "number") return raw;

    const str = String(raw).trim();

    // Kiểm tra xem số có định dạng với dấu phẩy làm phân cách thập phân không
    // Ví dụ: "8,00" hoặc "1.234,56"
    const commaDecimalMatch = str.match(/^[\d\s.]+,\d{2}$/);
    if (commaDecimalMatch) {
        // Định dạng châu Âu: 1.234,56 -> 1234.56
        const cleaned = str.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
        const val = parseFloat(cleaned);
        return isNaN(val) ? 0 : val;
    }

    // Trường hợp số có dấu chấm làm phân cách hàng nghìn: 1.234.567
    const dotThousandMatch = str.match(/^\d{1,3}(\.\d{3})+$/);
    if (dotThousandMatch) {
        const cleaned = str.replace(/\./g, "");
        const val = parseFloat(cleaned);
        return isNaN(val) ? 0 : val;
    }

    // Trường hợp thông thường: bỏ tất cả dấu phẩy và khoảng trắng
    const cleaned = str.replace(/[,\s]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

/**
 * Đọc file Excel và trả về danh sách vật tư
 * Thuật toán cải tiến:
 * - Duyệt qua tất cả các sheet để tìm dữ liệu
 * - Tự động tìm dòng header trong 20 dòng đầu tiên
 * - Match column name linh hoạt (không phân biệt hoa thường, bỏ qua khoảng trắng)
 */
export function parseExcelFile(buffer: ArrayBuffer): MaterialRow[] {
    console.log("[Excel Parser] Starting to parse file...");

    const workbook = XLSX.read(buffer, { type: "array" });
    console.log("[Excel Parser] Workbook sheets:", workbook.SheetNames);

    let validSheetFound = false;
    let jsonData: any[][] = [];
    let headerRowIndex = -1;

    // Column indices
    let sttIndex = -1;
    let maVTIndex = -1;
    let tenVTIndex = -1;
    let dvtIndex = -1;
    let soLoIndex = -1;
    let noiSXIndex = -1;
    let chatLuongIndex = -1;
    let soLuongIndex = -1;
    let donGiaIndex = -1;
    let thanhTienIndex = -1;

    // Duyệt qua từng sheet để tìm dữ liệu
    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        // Sử dụng raw: false để lấy giá trị đã format (vd: "8,00")
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
        console.log(`[Excel Parser] Checking sheet "${sheetName}": ${sheetData.length} rows`);

        if (sheetData.length === 0) continue;

        // Quét 20 dòng đầu tiên để tìm header
        for (let i = 0; i < Math.min(sheetData.length, 20); i++) {
            const row = sheetData[i];
            if (!row || !Array.isArray(row)) continue;

            // Tìm cột Mã VT (bắt buộc)
            const currentMaVTIndex = findColumnIndex(row, ["mavt", "mã vt", "mã vật tư", "ma vat tu"]);

            // Tìm cột Số lượng (bắt buộc)
            const currentSoLuongIndex = findColumnIndex(row, [
                "soluong", "số lượng", "so luong", "sl", "thực tế", "tồn kho", "ton kho"
            ]);

            if (currentMaVTIndex !== -1 && currentSoLuongIndex !== -1) {
                headerRowIndex = i;
                maVTIndex = currentMaVTIndex;
                soLuongIndex = currentSoLuongIndex;
                jsonData = sheetData;

                // Tìm các cột khác (không bắt buộc)
                sttIndex = findColumnIndex(row, ["stt", "số tt", "số thứ tự", "so tt", "so thu tu"]);
                tenVTIndex = findColumnIndex(row, ["tên vt", "ten vt", "tên vật tư", "sản phẩm", "vat tu", "diễn giải"]);
                dvtIndex = findColumnIndex(row, ["đvt", "dvt", "đơn vị", "don vi"]);
                soLoIndex = findColumnIndex(row, ["số lô", "so lo", "lô"]);
                noiSXIndex = findColumnIndex(row, ["nơi sx", "noi sx", "xuất xứ", "xuat xu", "vietnam"]);
                chatLuongIndex = findColumnIndex(row, ["chất lượng", "chat luong", "tình trạng"]);
                donGiaIndex = findColumnIndex(row, ["đơn giá", "don gia", "giá"]);
                thanhTienIndex = findColumnIndex(row, ["thành tiền", "thanh tien", "tổng tiền"]);

                validSheetFound = true;
                console.log(`[Excel Parser] ✅ Header found in sheet "${sheetName}" at row ${i + 1}`);
                console.log(`[Excel Parser] Column indices: MaVT=${maVTIndex}, SoLuong=${soLuongIndex}, TenVT=${tenVTIndex}, DonGia=${donGiaIndex}`);
                break;
            }
        }

        if (validSheetFound) break;
    }

    if (!validSheetFound) {
        console.warn("[Excel Parser] ❌ Header detection failed in all sheets!");
        throw new Error("Không tìm thấy dòng tiêu đề chứa 'Mã VT' và 'Số lượng' trong file Excel!");
    }

    const materials: MaterialRow[] = [];

    // Đọc dữ liệu từ dòng sau header
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        // Lấy Mã VT
        const maVT = row[maVTIndex]?.toString().trim() || "";
        if (!maVT) continue;

        // Bỏ qua các dòng tổng cộng/ghi chú cuối file
        const lowerMa = maVT.toLowerCase();
        if (lowerMa.includes("tổng") || lowerMa.includes("cộng") || lowerMa.includes("ghi chú")) continue;

        // Lấy Số lượng
        const soLuong = parseNumber(row[soLuongIndex]);

        // Lấy các giá trị khác
        const stt = sttIndex !== -1 ? (row[sttIndex]?.toString().trim() || "") : "";
        const tenVT = tenVTIndex !== -1 ? (row[tenVTIndex]?.toString().trim() || "") : "";
        const dvt = dvtIndex !== -1 ? (row[dvtIndex]?.toString().trim() || null) : null;
        const soLo = soLoIndex !== -1 ? (row[soLoIndex]?.toString().trim() || null) : null;
        const noiSX = noiSXIndex !== -1 ? (row[noiSXIndex]?.toString().trim() || null) : null;
        const chatLuong = chatLuongIndex !== -1 ? (row[chatLuongIndex]?.toString().trim() || null) : null;
        const donGia = donGiaIndex !== -1 ? parseNumber(row[donGiaIndex]) : null;
        const thanhTien = thanhTienIndex !== -1 ? parseNumber(row[thanhTienIndex]) : null;

        materials.push({
            stt,
            maVT,
            tenVT,
            dvt,
            soLo,
            noiSX,
            chatLuong,
            soLuong,
            donGia: donGia !== null && donGia !== 0 ? donGia : null,
            thanhTien: thanhTien !== null && thanhTien !== 0 ? thanhTien : null,
        });
    }

    console.log(`[Excel Parser] ✅ Parsed ${materials.length} materials from file`);
    return materials;
}
