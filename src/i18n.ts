export type Language = 'vi' | 'en' | 'cs';

export const translations = {
    vi: {
        appTitle: "Revenue Tracker",
        subtitle: "Nhập tổng hợp doanh thu & Tự động bắn dữ liệu về Google Sheets",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        exportExcel: "📊 Xuất CSV/Excel",
        configUrl: "Cấu Hình URL",
        viewScript: "Mã Google Script",

        // Form
        formTitleAdd: "Ghi Nhận Doanh Thu Mới",
        formTitleEdit: "Hiệu Chỉnh Giao Dịch",
        itemNameLabel: "Tên đơn hàng / Sản phẩm",
        optionalText: "(Không bắt buộc)",
        itemNamePlaceholder: "Ví dụ: Đơn hàng #102 (Mặc định: Đơn hàng)",
        amountLabel: "Số tiền bán được (Kč / CZK)",
        paymentMethodLabel: "Phương thức thanh toán",
        transferCard: "Chuyển khoản / Thẻ",
        cash: "Tiền mặt",
        saleDateLabel: "Ngày bán hàng",
        timeClassification: "Thời gian phân loại",
        monthTag: "Tháng {m}",
        quarterTag: "Quý {q}",
        yearTag: "Năm {y}",
        notesLabel: "Ghi chú (Tùy chọn)",
        notesPlaceholder: "Mã khách hàng, ghi chú...",
        btnSubmitAdd: "Ghi Nhận & Bắn Về Google Sheet",
        btnSubmitEdit: "Lưu Cập Nhật Giao Dịch",
        btnCancelEdit: "Hủy Chỉnh Sửa",

        // Stats
        statToday: "Doanh Thu Hôm Nay",
        statMonth: "Doanh Thu Tháng Này",
        statQuarter: "Doanh Thu Quý Này",
        txCount: "{count} giao dịch",

        // History & Filter
        historyTitle: "Lịch Sử Giao Dịch",
        syncBtn: "Đồng Bộ Sheet",
        searchPlaceholder: "🔍 Tìm theo tên, ghi chú...",
        filterAllMethods: "Tất cả PT thanh toán",
        noTransactionsFound: "Không tìm thấy giao dịch nào phù hợp.",
        btnEdit: "✏️ Sửa",
        btnDelete: "🗑️ Xóa",
        syncedBadge: "✓ Đã bắn Sheet",
        pendingBadge: "⏳ Chờ đồng bộ",

        // Chart
        chartTitle: "Phân Tích Doanh Thu Theo Phương Thức Thanh Toán",
        chartEmpty: "Chưa có dữ liệu để vẽ biểu đồ phân tích.",

        // Status
        readyToSync: "Sẵn sàng đồng bộ",
        syncing: "Đang tải dữ liệu từ Google Sheet...",
        connectedSheet: "Đã kết nối Google Sheet",
        unconfiguredUrl: "Chưa cấu hình URL (Lưu local)",
        syncedCount: "Đã đồng bộ {count} giao dịch từ Sheet",

        // Default item name
        defaultItemName: "Đơn hàng"
    },
    en: {
        appTitle: "Revenue Tracker",
        subtitle: "Track sales revenue & Automatically sync data to Google Sheets",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        exportExcel: "📊 Export CSV/Excel",
        configUrl: "Config URL",
        viewScript: "Google Script Code",

        // Form
        formTitleAdd: "Record New Revenue",
        formTitleEdit: "Edit Transaction",
        itemNameLabel: "Item / Order Name",
        optionalText: "(Optional)",
        itemNamePlaceholder: "e.g. Order #102 (Default: Order)",
        amountLabel: "Revenue Amount (Kč / CZK)",
        paymentMethodLabel: "Payment Method",
        transferCard: "Transfer / Card",
        cash: "Cash",
        saleDateLabel: "Sale Date",
        timeClassification: "Time Period",
        monthTag: "Month {m}",
        quarterTag: "Quarter {q}",
        yearTag: "Year {y}",
        notesLabel: "Notes (Optional)",
        notesPlaceholder: "Customer ID, tracking code...",
        btnSubmitAdd: "Record & Sync to Google Sheet",
        btnSubmitEdit: "Save Changes",
        btnCancelEdit: "Cancel Edit",

        // Stats
        statToday: "Today's Revenue",
        statMonth: "This Month's Revenue",
        statQuarter: "This Quarter's Revenue",
        txCount: "{count} transactions",

        // History & Filter
        historyTitle: "Transaction History",
        syncBtn: "Sync Sheet",
        searchPlaceholder: "🔍 Search by name, notes...",
        filterAllMethods: "All Payment Methods",
        noTransactionsFound: "No matching transactions found.",
        btnEdit: "✏️ Edit",
        btnDelete: "🗑️ Delete",
        syncedBadge: "✓ Synced",
        pendingBadge: "⏳ Pending Sync",

        // Chart
        chartTitle: "Revenue Analysis by Payment Method",
        chartEmpty: "No data available for chart analysis.",

        // Status
        readyToSync: "Ready to sync",
        syncing: "Loading data from Google Sheet...",
        connectedSheet: "Connected to Google Sheet",
        unconfiguredUrl: "URL not configured (Local storage)",
        syncedCount: "Synced {count} transactions from Sheet",

        // Default item name
        defaultItemName: "Order"
    },
    cs: {
        appTitle: "Revenue Tracker",
        subtitle: "Sledování tržeb & Automatická synchronizace s Google Sheets",
        darkMode: "Tmavý mód",
        lightMode: "Světlý mód",
        exportExcel: "📊 Exportovat CSV/Excel",
        configUrl: "Konfigurovat URL",
        viewScript: "Kód Google Script",

        // Form
        formTitleAdd: "Zaznamenat Novou Tržbu",
        formTitleEdit: "Upravit Transakci",
        itemNameLabel: "Název položky / Objednávky",
        optionalText: "(Volitelné)",
        itemNamePlaceholder: "např. Objednávka #102 (Výchozí: Objednávka)",
        amountLabel: "Částka tržby (Kč / CZK)",
        paymentMethodLabel: "Způsob platby",
        transferCard: "Převod / Karta",
        cash: "Hotovost",
        saleDateLabel: "Datum prodeje",
        timeClassification: "Časové období",
        monthTag: "Měsíc {m}",
        quarterTag: "Q{q}",
        yearTag: "Rok {y}",
        notesLabel: "Poznámka (Volitelné)",
        notesPlaceholder: "ID zákazníka, poznámky...",
        btnSubmitAdd: "Uložit & Odeslat na Google Sheet",
        btnSubmitEdit: "Uložit Změny",
        btnCancelEdit: "Zrušit Úpravy",

        // Stats
        statToday: "Dnešní Tržby",
        statMonth: "Tento Měsíc",
        statQuarter: "Tento Kvartál",
        txCount: "{count} transakcí",

        // History & Filter
        historyTitle: "Historie Transakcí",
        syncBtn: "Synchronizovat",
        searchPlaceholder: "🔍 Hledat podle názvu, poznámky...",
        filterAllMethods: "Všechny způsoby platby",
        noTransactionsFound: "Nenalezeny žádné odpovídající transakce.",
        btnEdit: "✏️ Upravit",
        btnDelete: "🗑️ Smazat",
        syncedBadge: "✓ Synchronizováno",
        pendingBadge: "⏳ Čeká na sync",

        // Chart
        chartTitle: "Analýza Tržeb Podle Způsobu Platby",
        chartEmpty: "Žádná data pro grafickou analýzu.",

        // Status
        readyToSync: "Připraveno k synchronizaci",
        syncing: "Načítání dat z Google Sheet...",
        connectedSheet: "Připojeno ke Google Sheet",
        unconfiguredUrl: "URL nenakonfigurováno (Local storage)",
        syncedCount: "Synchronizováno {count} transakcí z Sheetu",

        // Default item name
        defaultItemName: "Objednávka"
    }
};
