import confetti from 'canvas-confetti';
import googleScriptCode from './google-script.js?raw';

interface RevenueItem {
    id: string;
    date: string;
    itemName: string;
    amount: number;
    paymentMethod: string;
    month: string;
    quarter: string;
    year: number;
    notes: string;
    synced: boolean;
    createdAt: number;
}

const STORAGE_KEY_ITEMS = 'revenue_mini_app_transactions_v1';
const STORAGE_KEY_SCRIPT_URL = 'revenue_mini_app_script_url_v1';
const STORAGE_KEY_THEME = 'revenue_mini_app_theme_v1';

class RevenueApp {
    private transactions: RevenueItem[] = [];
    private filteredTransactions: RevenueItem[] = [];
    private scriptUrl: string = '';
    private editingId: string | null = null;
    private isDarkMode: boolean = false;

    // DOM Elements
    private form = document.getElementById('revenue-form') as HTMLFormElement;
    private editIdInput = document.getElementById('edit-id') as HTMLInputElement;
    private formTitle = document.getElementById('form-title') as HTMLElement;
    private btnSubmitText = document.getElementById('btn-submit-text') as HTMLElement;
    private btnCancelEdit = document.getElementById('btn-cancel-edit') as HTMLElement;

    private itemNameInput = document.getElementById('item-name') as HTMLInputElement;
    private amountInput = document.getElementById('amount') as HTMLInputElement;
    private amountPreview = document.getElementById('amount-preview') as HTMLElement;
    private paymentMethodSelect = document.getElementById('payment-method') as HTMLSelectElement;
    private saleDateInput = document.getElementById('sale-date') as HTMLInputElement;
    private notesInput = document.getElementById('notes') as HTMLInputElement;

    private calcMonthEl = document.getElementById('calc-month') as HTMLElement;
    private calcQuarterEl = document.getElementById('calc-quarter') as HTMLElement;
    private calcYearEl = document.getElementById('calc-year') as HTMLElement;

    private statTodayEl = document.getElementById('stat-today') as HTMLElement;
    private statTodayCountEl = document.getElementById('stat-today-count') as HTMLElement;
    private statMonthEl = document.getElementById('stat-month') as HTMLElement;
    private statMonthLabelEl = document.getElementById('stat-month-label') as HTMLElement;
    private statQuarterEl = document.getElementById('stat-quarter') as HTMLElement;
    private statQuarterLabelEl = document.getElementById('stat-quarter-label') as HTMLElement;

    private historyListEl = document.getElementById('history-list') as HTMLElement;
    private syncStatusEl = document.getElementById('sync-status') as HTMLElement;

    // Filters
    private searchInput = document.getElementById('search-input') as HTMLInputElement;
    private filterPaymentSelect = document.getElementById('filter-payment') as HTMLSelectElement;

    // Theme & Export & Chart
    private btnThemeToggle = document.getElementById('btn-theme-toggle') as HTMLElement;
    private themeIcon = document.getElementById('theme-icon') as HTMLElement;
    private btnExportExcel = document.getElementById('btn-export-excel') as HTMLElement;
    private chartBarsEl = document.getElementById('chart-bars') as HTMLElement;

    // Modals
    private modalConfig = document.getElementById('modal-config') as HTMLElement;
    private modalCode = document.getElementById('modal-code') as HTMLElement;
    private scriptUrlInput = document.getElementById('script-url-input') as HTMLInputElement;

    constructor() {
        this.init();
    }

    private async init() {
        this.loadState();
        this.setDefaultDate();
        this.attachEvents();
        this.updateDateCalculations();
        this.applyTheme();
        this.applyFilter();

        if (this.scriptUrl) {
            await this.fetchFromGoogleSheet();
        }
    }

    private loadState() {
        const savedItems = localStorage.getItem(STORAGE_KEY_ITEMS);
        if (savedItems) {
            try {
                this.transactions = JSON.parse(savedItems);
            } catch (e) {
                this.transactions = [];
            }
        }

        this.scriptUrl = localStorage.getItem(STORAGE_KEY_SCRIPT_URL) || '';
        this.scriptUrlInput.value = this.scriptUrl;

        this.isDarkMode = localStorage.getItem(STORAGE_KEY_THEME) === 'dark';
    }

    private applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.themeIcon.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            this.themeIcon.textContent = '🌙';
        }
    }

    private toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem(STORAGE_KEY_THEME, this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
    }

    private renderSkeletonLoading() {
        this.historyListEl.innerHTML = Array(4)
            .fill(0)
            .map(
                () => `
          <div class="skeleton-item">
            <div>
              <div class="skeleton-line title"></div>
              <div class="skeleton-line subtitle"></div>
            </div>
            <div>
              <div class="skeleton-line amount"></div>
              <div class="skeleton-line badge"></div>
            </div>
          </div>
        `
            )
            .join('');
    }

    private async fetchFromGoogleSheet() {
        if (!this.scriptUrl) return;

        this.syncStatusEl.className = 'status-indicator syncing';
        this.syncStatusEl.innerHTML = `<span class="status-dot sync-loading"></span> Đang tải dữ liệu từ Google Sheet...`;

        // If local list is empty, show skeleton loaders
        if (this.transactions.length === 0) {
            this.renderSkeletonLoading();
        }

        try {
            const res = await fetch(this.scriptUrl);
            const result = await res.json();

            if (result && result.status === 'success' && Array.isArray(result.data)) {
                const fetchedItems: RevenueItem[] = result.data.map((item: any) => ({
                    id: item.id || ('tx_' + Math.random().toString(36).substring(2, 8)),
                    date: item.date || '',
                    itemName: item.itemName || 'Không tên',
                    amount: Number(item.amount) || 0,
                    paymentMethod: item.paymentMethod || 'Tiền mặt',
                    month: item.month || '',
                    quarter: item.quarter || '',
                    year: Number(item.year) || new Date().getFullYear(),
                    notes: item.notes || '',
                    synced: true,
                    createdAt: item.date ? new Date(item.date).getTime() || Date.now() : Date.now()
                })).reverse();

                this.transactions = fetchedItems;
                this.saveState();
                this.applyFilter();

                this.syncStatusEl.className = 'status-indicator synced-success';
                this.syncStatusEl.innerHTML = `<span class="status-dot online"></span> Đã đồng bộ ${fetchedItems.length} giao dịch từ Sheet`;

                // Return status to default after 4 seconds
                setTimeout(() => {
                    this.updateStatusIndicator();
                }, 4000);
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu từ Google Sheet:', err);
            this.updateStatusIndicator();
        }
    }


    private saveState() {
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(this.transactions));
        localStorage.setItem(STORAGE_KEY_SCRIPT_URL, this.scriptUrl);
    }

    private setDefaultDate() {
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        this.saleDateInput.value = localIso;
    }

    private attachEvents() {
        this.btnThemeToggle.addEventListener('click', () => this.toggleTheme());
        this.btnExportExcel.addEventListener('click', () => this.exportCSV());

        this.amountInput.addEventListener('input', () => {
            const val = Number(this.amountInput.value) || 0;
            this.amountPreview.textContent = this.formatCurrency(val);
        });

        this.saleDateInput.addEventListener('change', () => {
            this.updateDateCalculations();
        });

        this.searchInput.addEventListener('input', () => this.applyFilter());
        this.filterPaymentSelect.addEventListener('change', () => this.applyFilter());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        this.btnCancelEdit.addEventListener('click', () => this.resetForm());

        document.getElementById('btn-config-script')?.addEventListener('click', () => {
            this.modalConfig.classList.add('active');
        });

        document.getElementById('btn-close-config')?.addEventListener('click', () => {
            this.modalConfig.classList.remove('active');
        });

        document.getElementById('btn-save-config')?.addEventListener('click', () => {
            this.scriptUrl = this.scriptUrlInput.value.trim();
            this.saveState();
            this.updateStatusIndicator();
            this.modalConfig.classList.remove('active');
            if (this.scriptUrl) {
                this.fetchFromGoogleSheet();
            }
            alert('Đã lưu Google Apps Script Web App URL!');
        });

        document.getElementById('btn-view-code')?.addEventListener('click', () => {
            const codeBlock = document.getElementById('script-code-block');
            if (codeBlock) codeBlock.textContent = googleScriptCode;
            this.modalCode.classList.add('active');
        });

        document.getElementById('btn-close-code')?.addEventListener('click', () => {
            this.modalCode.classList.remove('active');
        });

        document.getElementById('btn-copy-code')?.addEventListener('click', () => {
            navigator.clipboard.writeText(googleScriptCode);
            alert('Đã sao chép mã Google Apps Script vào bộ nhớ tạm!');
        });

        document.getElementById('btn-sync-all')?.addEventListener('click', () => {
            this.syncPendingTransactions();
        });

        // Quick Amount Chips Event Listeners
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = (e.currentTarget as HTMLElement).dataset.val;
                if (val) {
                    this.amountInput.value = val;
                    this.amountPreview.textContent = this.formatCurrency(Number(val));
                }
            });
        });
    }

    private getDateInfo(dateObj: Date) {
        const monthNum = dateObj.getMonth() + 1;
        const monthStr = `Tháng ${monthNum < 10 ? '0' + monthNum : monthNum}`;
        const quarterNum = Math.ceil(monthNum / 3);
        const quarterStr = `Quý ${quarterNum}`;
        const year = dateObj.getFullYear();

        return { monthNum, monthStr, quarterNum, quarterStr, year };
    }

    private updateDateCalculations() {
        const val = this.saleDateInput.value;
        if (!val) return;
        const d = new Date(val);
        const info = this.getDateInfo(d);

        this.calcMonthEl.textContent = info.monthStr;
        this.calcQuarterEl.textContent = info.quarterStr;
        this.calcYearEl.textContent = `Năm ${info.year}`;
    }

    private updateStatusIndicator() {
        if (this.scriptUrl) {
            this.syncStatusEl.innerHTML = `<span class="status-dot online"></span> Đã kết nối Google Sheet`;
        } else {
            this.syncStatusEl.innerHTML = `<span class="status-dot offline"></span> Chưa cấu hình URL (Lưu local)`;
        }
    }

    private applyFilter() {
        const q = this.searchInput.value.toLowerCase().trim();
        const paymentFilter = this.filterPaymentSelect.value;

        this.filteredTransactions = this.transactions.filter(t => {
            const matchesQuery = !q || t.itemName.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
            const matchesPayment = paymentFilter === 'ALL' || t.paymentMethod === paymentFilter;
            return matchesQuery && matchesPayment;
        });

        this.renderStats();
        this.renderHistory();
        this.renderChart();
    }

    private async handleSubmit() {
        const rawItemName = this.itemNameInput.value.trim();
        const itemName = rawItemName || 'Đơn hàng';
        const amount = Number(this.amountInput.value) || 0;
        const paymentMethod = this.paymentMethodSelect.value;
        const dateVal = this.saleDateInput.value;
        const notes = this.notesInput.value.trim();

        if (amount <= 0 || !dateVal) {
            alert('Vui lòng nhập số tiền hợp lệ!');
            return;
        }

        const d = new Date(dateVal);
        const info = this.getDateInfo(d);

        if (this.editingId) {
            // Edit Existing Item
            const idx = this.transactions.findIndex(t => t.id === this.editingId);
            if (idx !== -1) {
                const updatedItem: RevenueItem = {
                    ...this.transactions[idx],
                    itemName,
                    amount,
                    paymentMethod,
                    date: d.toLocaleString('vi-VN'),
                    month: info.monthStr,
                    quarter: info.quarterStr,
                    year: info.year,
                    notes,
                    synced: false
                };

                this.transactions[idx] = updatedItem;
                this.saveState();
                this.resetForm();
                this.applyFilter();

                await this.sendActionToGoogleSheet('edit', updatedItem);
            }
        } else {
            // Create New Item
            const newItem: RevenueItem = {
                id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                date: d.toLocaleString('vi-VN'),
                itemName,
                amount,
                paymentMethod,
                month: info.monthStr,
                quarter: info.quarterStr,
                year: info.year,
                notes,
                synced: false,
                createdAt: d.getTime()
            };

            this.transactions.unshift(newItem);
            this.saveState();

            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 }
            });

            this.resetForm();
            this.applyFilter();

            await this.sendActionToGoogleSheet('create', newItem);
        }
    }

    private editTransaction(id: string) {
        const item = this.transactions.find(t => t.id === id);
        if (!item) return;

        this.editingId = item.id;
        this.editIdInput.value = item.id;
        this.itemNameInput.value = item.itemName;
        this.amountInput.value = item.amount.toString();
        this.amountPreview.textContent = this.formatCurrency(item.amount);
        this.paymentMethodSelect.value = item.paymentMethod;
        this.notesInput.value = item.notes || '';

        this.formTitle.innerHTML = `<span class="dot mustard"></span> Hiệu Chỉnh Giao Dịch`;
        this.btnSubmitText.textContent = `Lưu Cập Nhật Giao Dịch`;
        this.btnCancelEdit.style.display = 'block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private async deleteTransaction(id: string) {
        const item = this.transactions.find(t => t.id === id);
        if (!item) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa giao dịch "${item.itemName}" (${this.formatCurrency(item.amount)})?`)) {
            return;
        }

        // Xóa local
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveState();
        this.applyFilter();

        // Xóa trên Google Sheet
        await this.sendActionToGoogleSheet('delete', item);
    }

    private resetForm() {
        this.editingId = null;
        this.editIdInput.value = '';
        this.itemNameInput.value = '';
        this.amountInput.value = '';
        this.amountPreview.textContent = '0 đ';
        this.notesInput.value = '';
        this.setDefaultDate();
        this.updateDateCalculations();

        this.formTitle.innerHTML = `<span class="dot terracotta"></span> Ghi Nhận Doanh Thu Mới`;
        this.btnSubmitText.textContent = `Ghi Nhận & Bắn Về Google Sheet`;
        this.btnCancelEdit.style.display = 'none';
    }

    private async sendActionToGoogleSheet(action: 'create' | 'edit' | 'delete', item: RevenueItem) {
        if (!this.scriptUrl) {
            console.warn('Chưa cấu hình Google Apps Script URL.');
            return;
        }

        try {
            const payload = {
                action,
                ...item
            };

            await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            if (action !== 'delete') {
                const idx = this.transactions.findIndex(t => t.id === item.id);
                if (idx !== -1) {
                    this.transactions[idx].synced = true;
                    this.saveState();
                    this.applyFilter();
                }
            }
        } catch (err) {
            console.error(`Lỗi thực hiện ${action} lên Google Sheet:`, err);
        }
    }

    private async syncPendingTransactions() {
        if (!this.scriptUrl) {
            alert('Vui lòng cấu hình Web App URL trước!');
            this.modalConfig.classList.add('active');
            return;
        }

        const pending = this.transactions.filter(t => !t.synced);
        if (pending.length > 0) {
            let count = 0;
            for (const item of pending) {
                await this.sendActionToGoogleSheet('create', item);
                count++;
            }
            alert(`Đã hoàn tất bắn ${count} giao dịch lên Google Sheet!`);
        }

        await this.fetchFromGoogleSheet();
    }

    private renderStats() {
        const now = new Date();
        const todayStr = now.toLocaleDateString('vi-VN');
        const currentInfo = this.getDateInfo(now);

        let todayTotal = 0;
        let todayCount = 0;
        let monthTotal = 0;
        let quarterTotal = 0;

        for (const t of this.transactions) {
            const tDate = new Date(t.createdAt);
            const tInfo = this.getDateInfo(tDate);

            if (tDate.toLocaleDateString('vi-VN') === todayStr) {
                todayTotal += t.amount;
                todayCount++;
            }

            if (tInfo.monthStr === currentInfo.monthStr && tInfo.year === currentInfo.year) {
                monthTotal += t.amount;
            }

            if (tInfo.quarterStr === currentInfo.quarterStr && tInfo.year === currentInfo.year) {
                quarterTotal += t.amount;
            }
        }

        this.statTodayEl.textContent = this.formatCurrency(todayTotal);
        this.statTodayCountEl.textContent = `${todayCount} giao dịch`;

        this.statMonthEl.textContent = this.formatCurrency(monthTotal);
        this.statMonthLabelEl.textContent = `${currentInfo.monthStr}/${currentInfo.year}`;

        this.statQuarterEl.textContent = this.formatCurrency(quarterTotal);
        this.statQuarterLabelEl.textContent = `${currentInfo.quarterStr}/${currentInfo.year}`;
    }

    private renderHistory() {
        if (this.filteredTransactions.length === 0) {
            this.historyListEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>Không tìm thấy giao dịch nào phù hợp.</p>
        </div>
      `;
            return;
        }

        this.historyListEl.innerHTML = this.filteredTransactions
            .map((item) => `
        <div class="history-item" data-id="${item.id}">
          <div class="item-info">
            <span class="item-name">${this.escapeHtml(item.itemName)}</span>
            <div class="item-meta">
              <span>📅 ${item.date}</span>
              <span>• ${item.month}</span>
              <span>• ${item.paymentMethod}</span>
              ${item.notes ? `<span>• 📝 ${this.escapeHtml(item.notes)}</span>` : ''}
            </div>
            <div class="history-actions">
              <button class="btn-icon edit-btn" data-id="${item.id}">✏️ Sửa</button>
              <button class="btn-icon delete-btn" data-id="${item.id}">🗑️ Xóa</button>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount">+${this.formatCurrency(item.amount)}</div>
            <span class="sync-badge ${item.synced ? 'synced' : 'pending'}">
              ${item.synced ? '✓ Đã bắn Sheet' : '⏳ Chờ đồng bộ'}
            </span>
          </div>
        </div>
      `)
            .join('');

        // Attach action listeners
        this.historyListEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id;
                if (id) this.editTransaction(id);
            });
        });

        this.historyListEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.currentTarget as HTMLElement).dataset.id;
                if (id) this.deleteTransaction(id);
            });
        });
    }

    private renderChart() {
        const methodTotals: { [key: string]: number } = {
            'Chuyển khoản / Thẻ': 0,
            'Tiền mặt': 0
        };

        let grandTotal = 0;
        for (const t of this.transactions) {
            const key = t.paymentMethod.includes('Tiền mặt') ? 'Tiền mặt' : 'Chuyển khoản / Thẻ';
            if (methodTotals[key] !== undefined) {
                methodTotals[key] += t.amount;
            } else {
                methodTotals[key] = t.amount;
            }
            grandTotal += t.amount;
        }

        if (grandTotal === 0) {
            this.chartBarsEl.innerHTML = `<div class="empty-state"><p>Chưa có dữ liệu để vẽ biểu đồ phân tích.</p></div>`;
            return;
        }

        const classMap: { [key: string]: string } = {
            'Chuyển khoản / Thẻ': 'banking',
            'Tiền mặt': 'cash'
        };

        this.chartBarsEl.innerHTML = Object.keys(methodTotals)
            .map(method => {
                const amount = methodTotals[method];
                const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
                const cls = classMap[method] || 'banking';

                return `
          <div class="chart-row">
            <div class="chart-label-group">
              <span>${method} (${pct}%)</span>
              <span>${this.formatCurrency(amount)}</span>
            </div>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill ${cls}" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
            })
            .join('');
    }

    private exportCSV() {
        if (this.transactions.length === 0) {
            alert('Chưa có dữ liệu giao dịch để xuất file!');
            return;
        }

        const headers = ['ID Giao Dich', 'Thoi Gian', 'Ten Don Hang', 'So Tien', 'Phuong Thuc Thanh Toan', 'Thang', 'Quy', 'Nam', 'Ghi Chu'];
        const rows = this.transactions.map(t => [
            t.id,
            `"${t.date}"`,
            `"${t.itemName.replace(/"/g, '""')}"`,
            t.amount,
            `"${t.paymentMethod}"`,
            `"${t.month}"`,
            `"${t.quarter}"`,
            t.year,
            `"${(t.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private formatCurrency(num: number): string {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    private escapeHtml(str: string): string {
        return str.replace(/[&<>"']/g, (m) => {
            return (
                {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                }[m] || m
            );
        });
    }
}

new RevenueApp();
