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

// Local Storage Keys
const STORAGE_KEY_ITEMS = 'revenue_mini_app_transactions_v1';
const STORAGE_KEY_SCRIPT_URL = 'revenue_mini_app_script_url_v1';

class RevenueApp {
    private transactions: RevenueItem[] = [];
    private scriptUrl: string = '';

    // DOM Elements
    private form = document.getElementById('revenue-form') as HTMLFormElement;
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

    // Modals
    private modalConfig = document.getElementById('modal-config') as HTMLElement;
    private modalCode = document.getElementById('modal-code') as HTMLElement;
    private scriptUrlInput = document.getElementById('script-url-input') as HTMLInputElement;

    constructor() {
        this.init();
    }

    private init() {
        this.loadState();
        this.setDefaultDate();
        this.attachEvents();
        this.updateDateCalculations();
        this.renderStats();
        this.renderHistory();
        this.updateStatusIndicator();
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
    }

    private saveState() {
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(this.transactions));
        localStorage.setItem(STORAGE_KEY_SCRIPT_URL, this.scriptUrl);
    }

    private setDefaultDate() {
        const now = new Date();
        // Format YYYY-MM-DDTHH:mm
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        this.saleDateInput.value = localIso;
    }

    private attachEvents() {
        // Amount formatting preview
        this.amountInput.addEventListener('input', () => {
            const val = Number(this.amountInput.value) || 0;
            this.amountPreview.textContent = this.formatCurrency(val);
        });

        // Date change listener -> recalculate month, quarter, year
        this.saleDateInput.addEventListener('change', () => {
            this.updateDateCalculations();
        });

        // Form Submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Config Modal
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
            alert('Đã lưu Google Apps Script Web App URL!');
        });

        // Code Modal
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

        // Sync All Button
        document.getElementById('btn-sync-all')?.addEventListener('click', () => {
            this.syncPendingTransactions();
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
            this.syncStatusEl.innerHTML = `<span class="status-dot offline"></span> Chưa cấu hình URL (Chỉ lưu local)`;
        }
    }

    private async handleSubmit() {
        const itemName = this.itemNameInput.value.trim();
        const amount = Number(this.amountInput.value) || 0;
        const paymentMethod = this.paymentMethodSelect.value;
        const dateVal = this.saleDateInput.value;
        const notes = this.notesInput.value.trim();

        if (!itemName || amount <= 0 || !dateVal) {
            alert('Vui lòng điền đầy đủ tên sản phẩm và số tiền hợp lệ!');
            return;
        }

        const d = new Date(dateVal);
        const info = this.getDateInfo(d);

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

        // Add to state
        this.transactions.unshift(newItem);
        this.saveState();

        // Trigger confetti visual reward
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
        });

        // Reset Form
        this.itemNameInput.value = '';
        this.amountInput.value = '';
        this.amountPreview.textContent = '0 đ';
        this.notesInput.value = '';
        this.setDefaultDate();
        this.updateDateCalculations();

        // Update UI
        this.renderStats();
        this.renderHistory();

        // Send to Google Sheet
        await this.sendToGoogleSheet(newItem);
    }

    private async sendToGoogleSheet(item: RevenueItem) {
        if (!this.scriptUrl) {
            console.warn('Chưa cấu hình Google Apps Script URL. Giao dịch được lưu ở bộ nhớ máy.');
            return;
        }

        try {
            // POST to Google Apps Script Web App
            // Note: Using no-cors mode to bypass CORS restriction if redirect occurs
            await fetch(this.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(item)
            });

            // Mark item as synced
            const idx = this.transactions.findIndex((t) => t.id === item.id);
            if (idx !== -1) {
                this.transactions[idx].synced = true;
                this.saveState();
                this.renderHistory();
            }
        } catch (err) {
            console.error('Lỗi bắn Google Sheet:', err);
        }
    }

    private async syncPendingTransactions() {
        const pending = this.transactions.filter((t) => !t.synced);
        if (pending.length === 0) {
            alert('Tất cả giao dịch đã được đồng bộ!');
            return;
        }
        if (!this.scriptUrl) {
            alert('Vui lòng cấu hình Web App URL trước!');
            this.modalConfig.classList.add('active');
            return;
        }

        let count = 0;
        for (const item of pending) {
            await this.sendToGoogleSheet(item);
            count++;
        }
        alert(`Đã hoàn tất gửi ${count} giao dịch lên Google Sheet!`);
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

            // Today
            if (tDate.toLocaleDateString('vi-VN') === todayStr) {
                todayTotal += t.amount;
                todayCount++;
            }

            // Month
            if (tInfo.monthStr === currentInfo.monthStr && tInfo.year === currentInfo.year) {
                monthTotal += t.amount;
            }

            // Quarter
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
        if (this.transactions.length === 0) {
            this.historyListEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>Chưa có giao dịch nào được nhập.</p>
        </div>
      `;
            return;
        }

        this.historyListEl.innerHTML = this.transactions
            .map((item) => `
        <div class="history-item">
          <div class="item-info">
            <span class="item-name">${this.escapeHtml(item.itemName)}</span>
            <div class="item-meta">
              <span>📅 ${item.date}</span>
              <span>• ${item.month} (${item.quarter})</span>
              <span>• ${item.paymentMethod}</span>
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

// Initialize App
new RevenueApp();
