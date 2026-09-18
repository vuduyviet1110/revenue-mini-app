import confetti from 'canvas-confetti';
import googleScriptCode from './google-script.js?raw';
import { translations, Language } from './i18n';

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
const STORAGE_KEY_LANG = 'revenue_mini_app_lang_v1';

class RevenueApp {
    private transactions: RevenueItem[] = [];
    private filteredTransactions: RevenueItem[] = [];
    private scriptUrl: string = '';
    private editingId: string | null = null;
    private isDarkMode: boolean = false;
    private currentLang: Language = 'vi';

    // DOM Elements
    private form = document.getElementById('revenue-form') as HTMLFormElement;
    private editIdInput = document.getElementById('edit-id') as HTMLInputElement;
    private formTitleText = document.getElementById('form-title-text') as HTMLElement;
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
    private syncStatusTextEl = document.getElementById('sync-status-text') as HTMLElement;

    // Filters
    private searchInput = document.getElementById('search-input') as HTMLInputElement;
    private filterPaymentSelect = document.getElementById('filter-payment') as HTMLSelectElement;

    // i18n Elements
    private langSelect = document.getElementById('lang-select') as HTMLSelectElement;
    private themeTextEl = document.getElementById('theme-text') as HTMLElement;
    private btnExportTextEl = document.getElementById('btn-export-text') as HTMLElement;
    private btnConfigTextEl = document.getElementById('btn-config-text') as HTMLElement;
    private btnCodeTextEl = document.getElementById('btn-code-text') as HTMLElement;
    private lblItemNameEl = document.getElementById('lbl-item-name') as HTMLElement;
    private lblAmountEl = document.getElementById('lbl-amount') as HTMLElement;
    private lblPaymentMethodEl = document.getElementById('lbl-payment-method') as HTMLElement;
    private titleStatTodayEl = document.getElementById('title-stat-today') as HTMLElement;
    private titleStatMonthEl = document.getElementById('title-stat-month') as HTMLElement;
    private titleStatQuarterEl = document.getElementById('title-stat-quarter') as HTMLElement;
    private titleHistoryEl = document.getElementById('title-history') as HTMLElement;
    private btnSyncTextEl = document.getElementById('btn-sync-text') as HTMLElement;
    private chartTitleEl = document.getElementById('chart-title') as HTMLElement;

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
        this.applyLanguage();
        this.updateDateCalculations();
        this.applyTheme();
        this.applyFilter();

        if (this.scriptUrl) {
            await this.fetchFromGoogleSheet();
        }
    }

    private get t() {
        return translations[this.currentLang];
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
        const savedLang = localStorage.getItem(STORAGE_KEY_LANG) as Language;
        if (savedLang && (savedLang === 'vi' || savedLang === 'en' || savedLang === 'cs')) {
            this.currentLang = savedLang;
        }
        if (this.langSelect) {
            this.langSelect.value = this.currentLang;
        }
    }

    private applyLanguage() {
        const t = this.t;
        document.documentElement.lang = this.currentLang;

        // Static header & controls
        if (this.themeTextEl) this.themeTextEl.textContent = this.isDarkMode ? t.lightMode : t.darkMode;
        if (this.btnExportTextEl) this.btnExportTextEl.textContent = t.exportExcel.replace('📊 ', '');
        if (this.btnConfigTextEl) this.btnConfigTextEl.textContent = t.configUrl;
        if (this.btnCodeTextEl) this.btnCodeTextEl.textContent = t.viewScript;

        // Form labels & placeholders
        if (this.formTitleText) this.formTitleText.textContent = this.editingId ? t.formTitleEdit : t.formTitleAdd;
        if (this.btnSubmitText) this.btnSubmitText.textContent = this.editingId ? t.btnSubmitEdit : t.btnSubmitAdd;
        if (this.btnCancelEdit) this.btnCancelEdit.textContent = t.btnCancelEdit;
        if (this.lblItemNameEl) this.lblItemNameEl.innerHTML = `${t.itemNameLabel} <span class="optional-text">${t.optionalText}</span>`;
        if (this.itemNameInput) this.itemNameInput.placeholder = t.itemNamePlaceholder;
        if (this.lblAmountEl) this.lblAmountEl.textContent = t.amountLabel;
        if (this.lblPaymentMethodEl) this.lblPaymentMethodEl.textContent = t.paymentMethodLabel;
        if (this.notesInput) this.notesInput.placeholder = t.notesPlaceholder;

        // Update payment method select options text
        const cashOpt = this.paymentMethodSelect.querySelector('option[value="Tiền mặt"]');
        if (cashOpt) cashOpt.textContent = t.cash;
        const cardOpt = this.paymentMethodSelect.querySelector('option[value="Chuyển khoản / Thẻ"]');
        if (cardOpt) cardOpt.textContent = t.transferCard;

        // Stats titles
        if (this.titleStatTodayEl) this.titleStatTodayEl.textContent = t.statToday;
        if (this.titleStatMonthEl) this.titleStatMonthEl.textContent = t.statMonth;
        if (this.titleStatQuarterEl) this.titleStatQuarterEl.textContent = t.statQuarter;
        if (this.titleHistoryEl) this.titleHistoryEl.textContent = t.historyTitle;
        if (this.btnSyncTextEl) this.btnSyncTextEl.textContent = t.syncBtn;
        if (this.chartTitleEl) this.chartTitleEl.innerHTML = `<span class="dot mustard"></span> ${t.chartTitle}`;

        // Filter search & select
        if (this.searchInput) this.searchInput.placeholder = t.searchPlaceholder;
        const allOpt = this.filterPaymentSelect.querySelector('option[value="ALL"]');
        if (allOpt) allOpt.textContent = t.filterAllMethods;
        const filterCashOpt = this.filterPaymentSelect.querySelector('option[value="Tiền mặt"]');
        if (filterCashOpt) filterCashOpt.textContent = t.cash;
        const filterCardOpt = this.filterPaymentSelect.querySelector('option[value="Chuyển khoản / Thẻ"]');
        if (filterCardOpt) filterCardOpt.textContent = t.transferCard;

        this.updateStatusIndicator();
        this.renderStats();
        this.renderHistory();
        this.renderChart();
    }

    private applyTheme() {
        const t = this.t;
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.themeIcon.textContent = '☀️';
            if (this.themeTextEl) this.themeTextEl.textContent = t.lightMode;
        } else {
            document.body.classList.remove('dark-mode');
            this.themeIcon.textContent = '🌙';
            if (this.themeTextEl) this.themeTextEl.textContent = t.darkMode;
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
        this.syncStatusEl.innerHTML = `<span class="status-dot sync-loading"></span> ${this.t.syncing}`;

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
                    itemName: item.itemName || this.t.defaultItemName,
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
                this.syncStatusEl.innerHTML = `<span class="status-dot online"></span> ${this.t.syncedCount.replace('{count}', fetchedItems.length.toString())}`;

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
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        this.saleDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    private attachEvents() {
        this.langSelect?.addEventListener('change', () => {
            this.currentLang = this.langSelect.value as Language;
            localStorage.setItem(STORAGE_KEY_LANG, this.currentLang);
            this.applyLanguage();
        });

        this.amountInput.addEventListener('input', () => {
            const val = Number(this.amountInput.value) || 0;
            this.amountPreview.textContent = this.formatCurrency(val);
        });

        this.saleDateInput.addEventListener('change', () => {
            this.updateDateCalculations();
        });

        this.searchInput.addEventListener('input', () => {
            this.applyFilter();
        });

        this.filterPaymentSelect.addEventListener('change', () => {
            this.applyFilter();
        });

        this.btnThemeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        this.btnExportExcel.addEventListener('click', () => {
            this.exportCSV();
        });

        this.btnCancelEdit.addEventListener('click', () => {
            this.resetForm();
        });

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
            alert('Đã sao chép mã Google Apps Script!');
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

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
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
        const t = this.t;

        this.calcMonthEl.textContent = t.monthTag.replace('{m}', info.monthNum.toString());
        this.calcQuarterEl.textContent = t.quarterTag.replace('{q}', info.quarterNum.toString());
        this.calcYearEl.textContent = t.yearTag.replace('{y}', info.year.toString());
    }

    private updateStatusIndicator() {
        if (this.scriptUrl) {
            this.syncStatusEl.className = 'status-indicator';
            this.syncStatusEl.innerHTML = `<span class="status-dot online"></span> ${this.t.connectedSheet}`;
        } else {
            this.syncStatusEl.className = 'status-indicator';
            this.syncStatusEl.innerHTML = `<span class="status-dot offline"></span> ${this.t.unconfiguredUrl}`;
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
        const itemName = rawItemName || this.t.defaultItemName;
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
            const idx = this.transactions.findIndex(t => t.id === this.editingId);
            if (idx !== -1) {
                const updatedItem: RevenueItem = {
                    ...this.transactions[idx],
                    date: dateVal.replace('T', ' '),
                    itemName,
                    amount,
                    paymentMethod,
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
            const newItem: RevenueItem = {
                id: 'tx_' + Math.random().toString(36).substring(2, 9),
                date: dateVal.replace('T', ' '),
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

        this.formTitleText.textContent = this.t.formTitleEdit;
        this.btnSubmitText.textContent = this.t.btnSubmitEdit;
        this.btnCancelEdit.style.display = 'block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private async deleteTransaction(id: string) {
        const item = this.transactions.find(t => t.id === id);
        if (!item) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa giao dịch "${item.itemName}" (${this.formatCurrency(item.amount)})?`)) {
            return;
        }

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveState();
        this.applyFilter();

        await this.sendActionToGoogleSheet('delete', item);
    }

    private resetForm() {
        this.editingId = null;
        this.editIdInput.value = '';
        this.itemNameInput.value = '';
        this.amountInput.value = '';
        this.amountPreview.textContent = '0 Kč';
        this.notesInput.value = '';
        this.setDefaultDate();
        this.updateDateCalculations();

        this.formTitleText.textContent = this.t.formTitleAdd;
        this.btnSubmitText.textContent = this.t.btnSubmitAdd;
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
        const t = this.t;
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const currentInfo = this.getDateInfo(now);

        let todayTotal = 0;
        let todayCount = 0;
        let monthTotal = 0;
        let quarterTotal = 0;

        for (const tr of this.transactions) {
            const tDate = new Date(tr.createdAt);
            const tInfo = this.getDateInfo(tDate);

            if (tDate.toLocaleDateString() === todayStr) {
                todayTotal += tr.amount;
                todayCount++;
            }

            if (tInfo.monthStr === currentInfo.monthStr && tInfo.year === currentInfo.year) {
                monthTotal += tr.amount;
            }

            if (tInfo.quarterStr === currentInfo.quarterStr && tInfo.year === currentInfo.year) {
                quarterTotal += tr.amount;
            }
        }

        this.statTodayEl.textContent = this.formatCurrency(todayTotal);
        this.statTodayCountEl.textContent = t.txCount.replace('{count}', todayCount.toString());

        this.statMonthEl.textContent = this.formatCurrency(monthTotal);
        this.statMonthLabelEl.textContent = `${currentInfo.monthStr}/${currentInfo.year}`;

        this.statQuarterEl.textContent = this.formatCurrency(quarterTotal);
        this.statQuarterLabelEl.textContent = `${currentInfo.quarterStr}/${currentInfo.year}`;
    }

    private renderHistory() {
        const t = this.t;
        if (this.filteredTransactions.length === 0) {
            this.historyListEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>${t.noTransactionsFound}</p>
        </div>
      `;
            return;
        }

        this.historyListEl.innerHTML = this.filteredTransactions
            .map((item) => {
                const methodLabel = item.paymentMethod.includes('Tiền mặt') ? t.cash : t.transferCard;
                return `
        <div class="history-item" data-id="${item.id}">
          <div class="item-info">
            <span class="item-name">${this.escapeHtml(item.itemName)}</span>
            <div class="item-meta">
              <span>📅 ${item.date}</span>
              <span>• ${item.month}</span>
              <span>• ${methodLabel}</span>
              ${item.notes ? `<span>• 📝 ${this.escapeHtml(item.notes)}</span>` : ''}
            </div>
            <div class="history-actions">
              <button class="btn-icon edit-btn" data-id="${item.id}">${t.btnEdit}</button>
              <button class="btn-icon delete-btn" data-id="${item.id}">${t.btnDelete}</button>
            </div>
          </div>
          <div class="item-right">
            <div class="item-amount">+${this.formatCurrency(item.amount)}</div>
            <span class="sync-badge ${item.synced ? 'synced' : 'pending'}">
              ${item.synced ? t.syncedBadge : t.pendingBadge}
            </span>
          </div>
        </div>
      `;
            })
            .join('');

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
        const t = this.t;
        const methodTotals: { [key: string]: number } = {
            [t.cash]: 0,
            [t.transferCard]: 0
        };

        let grandTotal = 0;
        for (const item of this.transactions) {
            const key = item.paymentMethod.includes('Tiền mặt') ? t.cash : t.transferCard;
            if (methodTotals[key] !== undefined) {
                methodTotals[key] += item.amount;
            } else {
                methodTotals[key] = item.amount;
            }
            grandTotal += item.amount;
        }

        if (grandTotal === 0) {
            this.chartBarsEl.innerHTML = `<div class="empty-state"><p>${t.chartEmpty}</p></div>`;
            return;
        }

        const classMap: { [key: string]: string } = {
            [t.cash]: 'cash',
            [t.transferCard]: 'banking'
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

        const headers = ['ID Giao Dich', 'Thoi Gian', 'Ten Don Hang', 'So Tien (CZK)', 'Phuong Thuc Thanh Toan', 'Thang', 'Quy', 'Nam', 'Ghi Chu'];
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
        return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(num);
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
