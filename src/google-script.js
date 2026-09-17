/**
 * GOOGLE APPS SCRIPT - TỔNG HỢP DOANH THU TỰ ĐỘNG
 * 
 * Hướng dẫn cài đặt:
 * 1. Mở file Google Sheet của bạn -> Tiện ích mở rộng (Extensions) -> Apps Script
 * 2. Dán toàn bộ mã dưới đây vào file Code.gs (xóa hết code mặc định)
 * 3. Bấm Deploy (Triển khai) -> New deployment (Triển khai mới)
 * 4. Chọn loại: Web App
 *    - Execute as: Me (Tôi)
 *    - Who has access: Anyone (Bất kỳ ai)
 * 5. Coppy lấy URL nhận được dán vào Mini App.
 */

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        // Kiểm tra & Khởi tạo tiêu đề cột nếu sheet còn trống
        if (sheet.getLastRow() === 0) {
            var headers = ['ID Giao Dịch', 'Thời Gian', 'Tên Đơn Hàng / Món', 'Số Tiền (VNĐ)', 'Phương Thức Thanh Toán', 'Tháng', 'Quý', 'Năm', 'Ghi Chú'];
            var headerRange = sheet.getRange(1, 1, 1, headers.length);
            headerRange.setValues([headers]);
            headerRange.setFontWeight('bold');
            headerRange.setBackground('#1e293b');
            headerRange.setFontColor('#ffffff');
            sheet.setRowHeight(1, 35);
        }

        // Tạo ID giao dịch ngẫu nhiên
        var transactionId = 'TX-' + Math.floor(Math.random() * 900000 + 100000);

        // Dữ liệu hàng mới
        var newRow = [
            transactionId,
            data.date || new Date().toLocaleString('vi-VN'),
            data.itemName || 'Không tên',
            Number(data.amount) || 0,
            data.paymentMethod || 'Tiền mặt',
            data.month || '',
            data.quarter || '',
            data.year || new Date().getFullYear(),
            data.notes || ''
        ];

        // Thêm hàng vào sheet
        sheet.appendRow(newRow);

        var lastRowIndex = sheet.getLastRow();

        // Định dạng cột số tiền (Cột D - Cột 4) là tiền tệ VNĐ
        sheet.getRange(lastRowIndex, 4).setNumberFormat('#,##0 "VNĐ"');
        sheet.getRange(lastRowIndex, 1, 1, newRow.length).setVerticalAlignment('middle');

        // Trả về JSON thành công
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                message: 'Đã bắn dữ liệu thành công lên Google Sheet!',
                transactionId: transactionId,
                rowNumber: lastRowIndex
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'error',
                message: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'active', service: 'Revenue Sync Web App API' }))
        .setMimeType(ContentService.MimeType.JSON);
}
