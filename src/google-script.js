/**
 * GOOGLE APPS SCRIPT - TỔNG HỢP DOANH THU TỰ ĐỘNG & TẢI/SỬA/XÓA 2 CHIỀU
 * 
 * Hướng dẫn cài đặt / Cập nhật:
 * 1. Mở file Google Sheet của bạn -> Tiện ích mở rộng (Extensions) -> Apps Script
 * 2. Dán toàn bộ mã dưới đây vào file Code.gs (thay thế code cũ)
 * 3. Bấm Deploy (Triển khai) -> Manage deployments (Quản lý triển khai) -> Chỉnh sửa (biểu tượng bút chì) -> Phiên bản mới (New version) -> Triển khai
 * 4. Copy URL Web App dán vào ứng dụng Revenue Tracker.
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

        var action = data.action || 'create';

        // 1. Xóa giao dịch theo ID
        if (action === 'delete') {
            var targetId = data.id;
            var lastRow = sheet.getLastRow();
            var deleted = false;

            if (lastRow > 1) {
                var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
                for (var i = 0; i < ids.length; i++) {
                    if (String(ids[i][0]) === String(targetId)) {
                        sheet.deleteRow(i + 2); // +2 vì bỏ hàng 1 tiêu đề và index 0
                        deleted = true;
                        break;
                    }
                }
            }

            return ContentService
                .createTextOutput(JSON.stringify({
                    status: deleted ? 'success' : 'not_found',
                    message: deleted ? 'Đã xóa hàng khỏi Google Sheet!' : 'Không tìm thấy ID trên Sheet'
                }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // 2. Cập nhật (Edit) giao dịch theo ID
        if (action === 'edit') {
            var targetId = data.id;
            var lastRow = sheet.getLastRow();
            var updated = false;

            if (lastRow > 1) {
                var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
                for (var i = 0; i < ids.length; i++) {
                    if (String(ids[i][0]) === String(targetId)) {
                        var rowIndex = i + 2;
                        var updateRow = [
                            targetId,
                            data.date || new Date().toLocaleString('vi-VN'),
                            data.itemName || 'Không tên',
                            Number(data.amount) || 0,
                            data.paymentMethod || 'Tiền mặt',
                            data.month || '',
                            data.quarter || '',
                            data.year || new Date().getFullYear(),
                            data.notes || ''
                        ];
                        sheet.getRange(rowIndex, 1, 1, updateRow.length).setValues([updateRow]);
                        sheet.getRange(rowIndex, 4).setNumberFormat('#,##0 "VNĐ"');
                        updated = true;
                        break;
                    }
                }
            }

            return ContentService
                .createTextOutput(JSON.stringify({
                    status: updated ? 'success' : 'not_found',
                    message: updated ? 'Đã cập nhật hàng trên Google Sheet!' : 'Không tìm thấy ID để sửa'
                }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // 3. Tạo mới (Create - Mặc định)
        var transactionId = data.id || ('TX-' + Math.floor(Math.random() * 900000 + 100000));

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

        sheet.appendRow(newRow);
        var lastRowIndex = sheet.getLastRow();
        sheet.getRange(lastRowIndex, 4).setNumberFormat('#,##0 "VNĐ"');
        sheet.getRange(lastRowIndex, 1, 1, newRow.length).setVerticalAlignment('middle');

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
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var lastRow = sheet.getLastRow();

        if (lastRow <= 1) {
            return ContentService
                .createTextOutput(JSON.stringify({ status: 'success', data: [] }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        var range = sheet.getRange(2, 1, lastRow - 1, 9);
        var values = range.getValues();

        var transactions = values.map(function (row) {
            return {
                id: String(row[0] || ''),
                date: String(row[1] || ''),
                itemName: String(row[2] || ''),
                amount: Number(row[3]) || 0,
                paymentMethod: String(row[4] || ''),
                month: String(row[5] || ''),
                quarter: String(row[6] || ''),
                year: Number(row[7]) || new Date().getFullYear(),
                notes: String(row[8] || ''),
                synced: true
            };
        });

        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                data: transactions
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


