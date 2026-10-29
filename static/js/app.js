/**
 * Personal Expense Tracker - Modern Frontend Logic
 */

// Category Color Mapping
const CATEGORY_COLORS = {
  'Food': '#f59e0b',
  'Travel': '#06b6d4',
  'Shopping': '#ec4899',
  'Education': '#8b5cf6',
  'Bills': '#ef4444',
  'Health': '#10b981',
  'Entertainment': '#6366f1',
  'Other': '#94a3b8'
};

// Application State
const state = {
  category: 'all',
  search: '',
  sort: 'date_desc',
  deleteTarget: null
};

// DOM Elements
const elements = {
  tableBody: document.getElementById('expensesTableBody'),
  emptyState: document.getElementById('emptyState'),
  expensesTable: document.getElementById('expensesTable'),
  filteredSummaryText: document.getElementById('filteredSummaryText'),

  // Stat elements
  statTotalAmount: document.getElementById('statTotalAmount'),
  statTotalCount: document.getElementById('statTotalCount'),
  statMonthLabel: document.getElementById('statMonthLabel'),
  statMonthAmount: document.getElementById('statMonthAmount'),
  statAvgAmount: document.getElementById('statAvgAmount'),
  statTopCategory: document.getElementById('statTopCategory'),

  // Donut chart elements
  donutSvg: document.getElementById('donutSvg'),
  donutTotalText: document.getElementById('donutTotalText'),
  categoryLegend: document.getElementById('categoryLegend'),
  categoryCountBadge: document.getElementById('categoryCountBadge'),

  // Bar chart elements
  barChartContainer: document.getElementById('barChartContainer'),

  // Filter controls
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortSelect: document.getElementById('sortSelect'),
  categoryPills: document.getElementById('categoryPills'),

  // Modals
  addModal: document.getElementById('addModal'),
  deleteModal: document.getElementById('deleteModal'),
  openAddModalBtn: document.getElementById('openAddModalBtn'),
  closeAddModalBtn: document.getElementById('closeAddModalBtn'),
  cancelAddModalBtn: document.getElementById('cancelAddModalBtn'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  deleteTargetTitle: document.getElementById('deleteTargetTitle'),
  deleteTargetAmount: document.getElementById('deleteTargetAmount'),
  emptyAddBtn: document.getElementById('emptyAddBtn'),

  // Add Form
  addExpenseForm: document.getElementById('addExpenseForm'),
  expenseTitle: document.getElementById('expenseTitle'),
  expenseAmount: document.getElementById('expenseAmount'),
  expenseCategory: document.getElementById('expenseCategory'),
  expenseDate: document.getElementById('expenseDate'),
  titleError: document.getElementById('titleError'),
  amountError: document.getElementById('amountError'),

  // Others
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  seedDataBtn: document.getElementById('seedDataBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// Helpers
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
}

function showToast(message, type = 'success', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <button class="clear-btn" style="position:static; padding: 0 4px;" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);

  elements.toastContainer.appendChild(toast);
}

// Fetch Expenses & Refresh UI
async function loadData() {
  try {
    const params = new URLSearchParams({
      category: state.category,
      search: state.search,
      sort: state.sort
    });

    const [expensesRes, summaryRes] = await Promise.all([
      fetch(`/api/expenses?${params.toString()}`),
      fetch('/api/summary')
    ]);

    if (!expensesRes.ok || !summaryRes.ok) {
      throw new Error('Failed to retrieve financial records.');
    }

    const expensesData = await expensesRes.json();
    const summaryData = await summaryRes.json();

    renderStats(expensesData.stats, expensesData.filteredCount, expensesData.filteredTotal);
    renderTable(expensesData.expenses);
    renderDonutChart(summaryData.categoryBreakdown, summaryData.grandTotal);
    renderBarChart(summaryData.monthlyTrend);

  } catch (err) {
    console.error(err);
    showToast('Error loading expense data. Please refresh.', 'error');
  }
}

// Render Stat Cards
function renderStats(stats, filteredCount, filteredTotal) {
  if (!stats) return;

  elements.statTotalAmount.textContent = formatCurrency(stats.totalExpenses);
  elements.statTotalCount.textContent = `${stats.totalCount} record${stats.totalCount === 1 ? '' : 's'} logged`;

  elements.statMonthLabel.textContent = stats.currentMonth;
  elements.statMonthAmount.textContent = formatCurrency(stats.currentMonthTotal);

  elements.statAvgAmount.textContent = formatCurrency(stats.avgExpense);
  elements.statTopCategory.textContent = stats.topCategory;

  if (state.category !== 'all' || state.search.trim() !== '') {
    elements.filteredSummaryText.textContent = `Showing ${filteredCount} of ${stats.totalCount} records • Filtered: ${formatCurrency(filteredTotal)}`;
  } else {
    elements.filteredSummaryText.textContent = `Showing ${filteredCount} expenses • Total: ${formatCurrency(filteredTotal)}`;
  }
}

// Render Expenses Table
function renderTable(expenses) {
  elements.tableBody.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    elements.expensesTable.style.display = 'none';
    elements.emptyState.style.display = 'flex';
    return;
  }

  elements.expensesTable.style.display = 'table';
  elements.emptyState.style.display = 'none';

  expenses.forEach(item => {
    const tr = document.createElement('tr');
    const catClass = `badge-${(item.category || 'other').toLowerCase()}`;

    tr.innerHTML = `
      <td class="expense-id">#${item.id}</td>
      <td class="expense-title">${escapeHtml(item.title)}</td>
      <td>
        <span class="badge ${catClass}">
          ${escapeHtml(item.category || 'Other')}
        </span>
      </td>
      <td class="expense-date">${escapeHtml(item.date || '--')}</td>
      <td class="expense-amount">${formatCurrency(item.amount)}</td>
      <td style="text-align: center;">
        <button class="delete-row-btn" data-id="${item.id}" data-title="${escapeHtml(item.title)}" data-amount="${item.amount}" title="Delete expense" aria-label="Delete">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </td>
    `;

    const delBtn = tr.querySelector('.delete-row-btn');
    delBtn.addEventListener('click', () => {
      openDeleteModal({
        id: item.id,
        title: item.title,
        amount: item.amount
      });
    });

    elements.tableBody.appendChild(tr);
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Render Dynamic SVG Donut Chart
function renderDonutChart(breakdown, grandTotal) {
  elements.donutTotalText.textContent = formatCurrency(grandTotal);
  elements.categoryLegend.innerHTML = '';

  // Clean existing segments
  const existingSegments = elements.donutSvg.querySelectorAll('.donut-segment');
  existingSegments.forEach(el => el.remove());

  if (!breakdown || breakdown.length === 0 || grandTotal <= 0) {
    elements.categoryCountBadge.textContent = '0 categories';
    elements.categoryLegend.innerHTML = '<p class="field-hint" style="text-align:center; padding: 1rem 0;">No category data yet.</p>';
    return;
  }

  elements.categoryCountBadge.textContent = `${breakdown.length} active categor${breakdown.length === 1 ? 'y' : 'ies'}`;

  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99
  let currentOffset = 0;

  breakdown.forEach(item => {
    const color = getCategoryColor(item.category);
    const pct = (item.total / grandTotal);
    const dashLength = pct * circumference;
    const gapLength = circumference - dashLength;

    // SVG Circle Segment
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '80');
    circle.setAttribute('cy', '80');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('class', 'donut-segment');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-dasharray', `${dashLength} ${gapLength}`);
    circle.setAttribute('stroke-dashoffset', (-currentOffset).toString());

    // Hover tooltip info
    circle.addEventListener('mouseenter', () => {
      elements.donutTotalText.textContent = formatCurrency(item.total);
    });
    circle.addEventListener('mouseleave', () => {
      elements.donutTotalText.textContent = formatCurrency(grandTotal);
    });

    elements.donutSvg.appendChild(circle);
    currentOffset += dashLength;

    // Legend item
    const legendRow = document.createElement('div');
    legendRow.className = 'legend-item';
    legendRow.innerHTML = `
      <div class="legend-left">
        <span class="legend-color-dot" style="background-color: ${color};"></span>
        <span class="legend-name">${escapeHtml(item.category)}</span>
      </div>
      <div class="legend-right">
        <span class="legend-amount">${formatCurrency(item.total)}</span>
        <span class="legend-pct">${(pct * 100).toFixed(1)}%</span>
      </div>
    `;
    elements.categoryLegend.appendChild(legendRow);
  });
}

// Render Monthly Trend Bar Chart
function renderBarChart(monthlyTrend) {
  elements.barChartContainer.innerHTML = '';

  if (!monthlyTrend || monthlyTrend.length === 0) {
    elements.barChartContainer.innerHTML = '<p class="field-hint" style="align-self:center; margin:auto;">No monthly trend recorded.</p>';
    return;
  }

  const maxTotal = Math.max(...monthlyTrend.map(m => m.total), 1);

  monthlyTrend.forEach(item => {
    const col = document.createElement('div');
    col.className = 'bar-column';

    // Height ratio between 15% and 90%
    const heightPct = Math.max((item.total / maxTotal) * 85, 8);

    col.innerHTML = `
      <span class="bar-amount-tag">${formatCurrency(item.total)}</span>
      <div class="bar-pill" style="height: ${heightPct}%;" title="${item.month}: ${formatCurrency(item.total)}"></div>
      <span class="bar-label">${item.month}</span>
    `;

    // Clicking a bar filters table by that month!
    col.addEventListener('click', () => {
      showToast(`Showing expenses for ${item.month}`, 'info');
      filterByMonth(item.month);
    });

    elements.barChartContainer.appendChild(col);
  });
}

function filterByMonth(month) {
  state.search = '';
  elements.searchInput.value = '';
  elements.clearSearchBtn.style.display = 'none';

  // Fetch with month filter
  const params = new URLSearchParams({
    category: state.category,
    month: month,
    sort: state.sort
  });

  fetch(`/api/expenses?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      renderTable(data.expenses);
      elements.filteredSummaryText.textContent = `Month ${month} • ${data.filteredCount} records • Total: ${formatCurrency(data.filteredTotal)}`;
    })
    .catch(err => console.error(err));
}

// Modal Handlers
function openAddModal() {
  elements.addExpenseForm.reset();
  elements.titleError.textContent = '';
  elements.amountError.textContent = '';
  // Set default date to today YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  elements.expenseDate.value = today;

  elements.addModal.style.display = 'flex';
  setTimeout(() => elements.expenseTitle.focus(), 100);
}

function closeAddModal() {
  elements.addModal.style.display = 'none';
}

function openDeleteModal(target) {
  state.deleteTarget = target;
  elements.deleteTargetTitle.textContent = target.title;
  elements.deleteTargetAmount.textContent = formatCurrency(target.amount);
  elements.deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
  state.deleteTarget = null;
  elements.deleteModal.style.display = 'none';
}

// Add Expense Form Submission
elements.addExpenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  elements.titleError.textContent = '';
  elements.amountError.textContent = '';

  const title = elements.expenseTitle.value.trim();
  const rawAmount = elements.expenseAmount.value.trim();
  const category = elements.expenseCategory.value;
  const date = elements.expenseDate.value.trim();

  let hasError = false;

  if (!title) {
    elements.titleError.textContent = 'Please enter an expense title.';
    hasError = true;
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    elements.amountError.textContent = 'Please enter a valid positive amount.';
    hasError = true;
  }

  if (hasError) return;

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, category, date })
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.error || 'Failed to save expense.', 'error');
      return;
    }

    closeAddModal();
    showToast(`Added "${result.expense.title}" (${formatCurrency(result.expense.amount)}) successfully!`, 'success');
    await loadData();

  } catch (err) {
    console.error(err);
    showToast('Network error while saving expense.', 'error');
  }
});

// Confirm Delete Handler
elements.confirmDeleteBtn.addEventListener('click', async () => {
  if (!state.deleteTarget) return;

  const { id, title } = state.deleteTarget;

  try {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.error || 'Failed to delete expense.', 'error');
      return;
    }

    closeDeleteModal();
    showToast(`Deleted "${title}" successfully.`, 'info');
    await loadData();

  } catch (err) {
    console.error(err);
    showToast('Network error while deleting expense.', 'error');
  }
});

// Search & Filter Listeners
let searchDebounceTimer = null;
elements.searchInput.addEventListener('input', (e) => {
  const query = e.target.value;
  elements.clearSearchBtn.style.display = query ? 'block' : 'none';

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.search = query.trim();
    loadData();
  }, 250);
});

elements.clearSearchBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.clearSearchBtn.style.display = 'none';
  state.search = '';
  loadData();
  elements.searchInput.focus();
});

elements.categoryFilter.addEventListener('change', (e) => {
  setCategoryFilter(e.target.value);
});

elements.sortSelect.addEventListener('change', (e) => {
  state.sort = e.target.value;
  loadData();
});

// Category Pills Click
elements.categoryPills.addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;

  const category = pill.getAttribute('data-category');
  setCategoryFilter(category);
});

function setCategoryFilter(category) {
  state.category = category;
  elements.categoryFilter.value = category;

  // Update pills UI
  const pills = elements.categoryPills.querySelectorAll('.pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === category) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  loadData();
}

// Seed Demo Data Handler
elements.seedDataBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/seed-samples', { method: 'POST' });
    const data = await res.json();
    showToast(data.message, 'success');
    await loadData();
  } catch (err) {
    showToast('Failed to seed demo data.', 'error');
  }
});

// Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('pet_theme') || 'dark';
  applyTheme(savedTheme);

  elements.themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    localStorage.setItem('pet_theme', 'light');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('pet_theme', 'dark');
  }
}

// Modal open/close bindings
elements.openAddModalBtn.addEventListener('click', openAddModal);
elements.closeAddModalBtn.addEventListener('click', closeAddModal);
elements.cancelAddModalBtn.addEventListener('click', closeAddModal);
elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
elements.emptyAddBtn.addEventListener('click', openAddModal);

// Close modal when clicking backdrop
window.addEventListener('click', (e) => {
  if (e.target === elements.addModal) closeAddModal();
  if (e.target === elements.deleteModal) closeDeleteModal();
});

// Keyboard shortcuts (Escape closes modals)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAddModal();
    closeDeleteModal();
  }
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
});
