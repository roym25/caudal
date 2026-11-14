'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/lib/format';
import {
  BanknoteIcon,
  ReceiptIcon,
  WalletIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  TrendUpIcon,
} from '@/components/icons';

const PALETTE_SWATCHES = {
  green: 'var(--caudal-green)',
  warning: 'var(--caudal-warning)',
  orange: 'var(--caudal-orange)',
  success: 'var(--caudal-success)',
  muted: 'var(--caudal-text-muted)',
};
const FALLBACK_COLORS = [
  'var(--caudal-green)',
  'var(--caudal-warning)',
  'var(--caudal-orange)',
  'var(--caudal-success)',
  'var(--caudal-text-muted)',
];

function resolveBankColor(account, idx) {
  if (account.color && PALETTE_SWATCHES[account.color]) return PALETTE_SWATCHES[account.color];
  const n = (account.name || '').toLowerCase();
  if (n.includes('open')) return PALETTE_SWATCHES.green;
  if (n.includes('mercado')) return PALETTE_SWATCHES.warning;
  if (n.includes('didi')) return PALETTE_SWATCHES.orange;
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [payrollData, setPayrollData] = useState([]);
  const [fixedExpensesData, setFixedExpensesData] = useState([]);
  const [variableExpensesData, setVariableExpensesData] = useState([]);
  const [investmentAccounts, setInvestmentAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingExpenseId, setPayingExpenseId] = useState(null);
  const [isUpdatingSavingsCycle, setIsUpdatingSavingsCycle] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('caudal_hide_investments') === '1') {
        setHideAmounts(true);
      }
    } catch {}
  }, []);

  const toggleHideAmounts = () => {
    setHideAmounts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('caudal_hide_investments', next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const money = (value) => (hideAmounts ? '••••••' : formatMoney(value));

  // Generate list of months for selector (Current year + past year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const years = [currentYear, currentYear - 1];
  const monthsNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthOptions = [
    { value: 'all', label: 'All-Time Overview' },
    ...years.flatMap(y =>
      monthsNames.map((name, idx) => {
        const m = String(idx + 1).padStart(2, '0');
        return {
          value: `${y}-${m}`,
          label: `${name} ${y}`,
        };
      })
    ),
  ];

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const isAll = selectedMonth === 'all';
        const payrollUrl = isAll ? '/api/payroll' : `/api/payroll?month=${selectedMonth}`;
        const variableUrl = isAll ? '/api/variable-expenses' : `/api/variable-expenses?month=${selectedMonth}`;

        const [payrollRes, fixedRes, variableRes, investmentsRes] = await Promise.all([
          fetch(payrollUrl),
          fetch('/api/fixed-expenses'),
          fetch(variableUrl),
          fetch('/api/investment-accounts'),
        ]);

        const payrolls = await payrollRes.json();
        const fixed = await fixedRes.json();
        const variable = await variableRes.json();
        const investments = await investmentsRes.json();

        if (isCancelled) return;

        setPayrollData(Array.isArray(payrolls) ? payrolls : []);
        setFixedExpensesData(Array.isArray(fixed) ? fixed : []);
        setVariableExpensesData(Array.isArray(variable) ? variable : []);
        setInvestmentAccounts(Array.isArray(investments) ? investments : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { isCancelled = true; };
  }, [selectedMonth]);

  const isAll = selectedMonth === 'all';

  // Payroll & Tax Calculations
  const totalIncome = payrollData.reduce((sum, item) => sum + (item.amountReceived || 0), 0);
  const totalIsr = payrollData.reduce((sum, item) => sum + (item.isr || 0), 0);
  const totalWeeks = payrollData.length;
  const avgWeeklyIncome = totalWeeks > 0 ? totalIncome / totalWeeks : 0;

  // Fixed Expenses Total for selected period
  let totalFixedExpenses = 0;
  if (Array.isArray(fixedExpensesData)) {
    if (isAll) {
      totalFixedExpenses = fixedExpensesData.reduce((acc, e) => {
        const paidPayments = e.payments?.filter(p => p.paid) || [];
        const sumPaid = paidPayments.reduce((s, p) => s + (p.amount !== null && p.amount !== undefined ? p.amount : (e.cost || 0)), 0);
        return acc + sumPaid;
      }, 0);
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      totalFixedExpenses = fixedExpensesData.reduce((acc, e) => {
        const payment = e.payments?.find(p => {
          const d = new Date(p.date);
          return d.getUTCFullYear() === year && (d.getUTCMonth() + 1) === month;
        });
        if (payment?.paid) {
          return acc + (payment.amount !== null && payment.amount !== undefined ? payment.amount : (e.cost || 0));
        }
        return acc;
      }, 0);
    }
  }

  const totalVariableExpenses = variableExpensesData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const remainingBalance = totalIncome - totalExpenses;

  // Actionable Monthly Fixed Bills Tracker (uses selected month, or current calendar month when in All-Time view)
  const [targetYear, targetMonth] = isAll
    ? [currentYear, currentMonth]
    : selectedMonth.split('-').map(Number);
  const targetMonthLabel = `${monthsNames[targetMonth - 1]} ${targetYear}`;

  const monthlyBillsStatus = (Array.isArray(fixedExpensesData) ? fixedExpensesData : []).map(e => {
    const payment = e.payments?.find(p => {
      const d = new Date(p.date);
      return d.getUTCFullYear() === targetYear && (d.getUTCMonth() + 1) === targetMonth;
    });
    const isPaid = Boolean(payment?.paid);
    const effectiveAmount = isPaid && payment?.amount !== null && payment?.amount !== undefined
      ? payment.amount
      : (e.cost || 0);
    return {
      ...e,
      isPaid,
      effectiveAmount,
    };
  }).sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));

  const paidBillsCount = monthlyBillsStatus.filter(b => b.isPaid).length;
  const totalBillsCount = monthlyBillsStatus.length;
  const monthlyBillsPaidAmount = monthlyBillsStatus
    .filter(b => b.isPaid)
    .reduce((sum, b) => sum + b.effectiveAmount, 0);
  const monthlyBillsTotalBudget = monthlyBillsStatus
    .reduce((sum, b) => sum + b.effectiveAmount, 0);
  const pendingBills = monthlyBillsStatus.filter(b => !b.isPaid);
  const billsProgressPercent = totalBillsCount > 0 ? (paidBillsCount / totalBillsCount) * 100 : 0;

  const handleQuickPayBill = async (bill) => {
    if (payingExpenseId) return;
    setPayingExpenseId(bill.id);
    try {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T12:00:00Z`;
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedExpenseId: bill.id,
          date: dateStr,
          paid: true,
          amount: bill.cost,
        }),
      });
      if (res.ok) {
        const refreshed = await fetch('/api/fixed-expenses');
        const fixed = await refreshed.json();
        if (Array.isArray(fixed)) {
          setFixedExpensesData(fixed);
        }
      }
    } catch (err) {
      console.error('Error marking bill as paid:', err);
    } finally {
      setPayingExpenseId(null);
    }
  };

  // Savings Fund calculations (Active cycle vs. Last paid-out cycle)
  const activeSavingsPayrolls = isAll
    ? payrollData.filter((item) => !item.savingsPaidAt)
    : payrollData;

  const employeeSavings = activeSavingsPayrolls.reduce((sum, item) => sum + (item.savingsFund || 0), 0);
  const employerSavings = activeSavingsPayrolls.reduce((sum, item) => sum + (item.employerMatch || item.savingsFund || 0), 0);
  const totalSavings = employeeSavings + employerSavings;
  const savingsWeeks = activeSavingsPayrolls.length;
  const avgWeeklySavings = savingsWeeks > 0 ? totalSavings / savingsWeeks : 0;
  const projectedAnnualSavings = avgWeeklySavings * 52;

  // Last payout calculation (most recent closed cycle batch)
  const paidOutPayrolls = payrollData.filter((item) => Boolean(item.savingsPaidAt));
  const latestPaidAtMs =
    paidOutPayrolls.length > 0
      ? Math.max(...paidOutPayrolls.map((item) => new Date(item.savingsPaidAt).getTime()))
      : null;
  const lastPayoutBatch =
    latestPaidAtMs !== null
      ? paidOutPayrolls.filter((item) => new Date(item.savingsPaidAt).getTime() === latestPaidAtMs)
      : [];
  const lastPayoutTotal = lastPayoutBatch.reduce(
    (sum, item) => sum + (item.savingsFund || 0) + (item.employerMatch || item.savingsFund || 0),
    0
  );
  const lastPayoutWeeks = lastPayoutBatch.length;

  const refreshPayrolls = async () => {
    const payrollUrl = isAll ? '/api/payroll' : `/api/payroll?month=${selectedMonth}`;
    const res = await fetch(payrollUrl);
    const data = await res.json();
    if (Array.isArray(data)) setPayrollData(data);
  };

  const handleCloseSavingsCycle = async () => {
    if (isUpdatingSavingsCycle || totalSavings <= 0) return;
    if (
      !confirm(
        `Mark current Savings Fund (${formatMoney(totalSavings)}) as paid out and start a new count from $0.00?`
      )
    ) {
      return;
    }
    setIsUpdatingSavingsCycle(true);
    try {
      const res = await fetch('/api/payroll/savings-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      if (res.ok) await refreshPayrolls();
    } catch (err) {
      console.error('Error closing savings cycle:', err);
    } finally {
      setIsUpdatingSavingsCycle(false);
    }
  };

  const handleUndoSavingsCycle = async () => {
    if (isUpdatingSavingsCycle || lastPayoutBatch.length === 0) return;
    if (!confirm(`Restore last payout (${formatMoney(lastPayoutTotal)}) back into the active count?`)) {
      return;
    }
    setIsUpdatingSavingsCycle(true);
    try {
      const res = await fetch('/api/payroll/savings-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo' }),
      });
      if (res.ok) await refreshPayrolls();
    } catch (err) {
      console.error('Error undoing savings cycle:', err);
    } finally {
      setIsUpdatingSavingsCycle(false);
    }
  };

  // Investments (SOFIPOs) summary calculations
  const accountsWithTotals = investmentAccounts.map((acc, idx) => {
    const total = (acc.pockets || []).reduce((s, p) => s + (p.amount || 0), 0);
    const hasCap = acc.maxAmount !== null && acc.maxAmount !== undefined && acc.maxAmount > 0;
    const earningPrincipal = hasCap ? Math.min(total, acc.maxAmount) : total;
    const annualYield = acc.rate ? earningPrincipal * (acc.rate / 100) : 0;
    const capPercent = hasCap ? Math.min(100, (total / acc.maxAmount) * 100) : 0;
    return {
      ...acc,
      total,
      hasCap,
      annualYield,
      capPercent,
      color: resolveBankColor(acc, idx),
    };
  });
  const totalInvested = accountsWithTotals.reduce((s, a) => s + a.total, 0);
  const totalPockets = accountsWithTotals.reduce((s, a) => s + (a.pockets?.length || 0), 0);
  const totalAnnualYield = accountsWithTotals.reduce((s, a) => s + a.annualYield, 0);
  const totalMonthlyYield = totalAnnualYield / 12;

  // Recent activity: merge payroll and variable expenses (show top 4 in 2x2 grid)
  const activities = [
    ...payrollData.map(p => ({
      id: `p-${p.id}`,
      date: p.date,
      description: `Payroll — Week ${p.week}${p.notes ? ` (${p.notes})` : ''}`,
      amount: p.amountReceived,
      type: 'income',
    })),
    ...variableExpensesData.map(v => ({
      id: `v-${v.id}`,
      date: v.date,
      description: `${v.description}${v.comments ? ` (${v.comments})` : ''}`,
      amount: v.amount,
      type: 'expense',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const selectedOptionLabel = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;

  const handlePrevMonth = () => {
    const currentIndex = monthOptions.findIndex(o => o.value === selectedMonth);
    if (currentIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = monthOptions.findIndex(o => o.value === selectedMonth);
    if (currentIndex > 1) {
      setSelectedMonth(monthOptions[currentIndex - 1].value);
    } else if (currentIndex === 1) {
      setSelectedMonth('all');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 max-w-6xl mx-auto w-full">
        <div className="flex justify-center items-center h-64 text-caudal-text-muted">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto w-full space-y-3.5">
      {/* Header with privacy toggle & clean month selector */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[23px] font-bold text-caudal-text">Dashboard</h1>
          <p className="text-xs sm:text-[13.5px] text-caudal-text-muted mt-0.5">{selectedOptionLabel}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={toggleHideAmounts}
            className="p-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={hideAmounts ? 'Show amounts' : 'Hide amounts (Privacy mode)'}
            aria-label={hideAmounts ? 'Show amounts' : 'Hide amounts'}
          >
            {hideAmounts ? <EyeSlashIcon className="w-4 h-4 text-caudal-green" /> : <EyeIcon className="w-4 h-4" />}
          </button>

          {!isAll && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-w-[34px] min-h-[36px] flex items-center justify-center"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-w-[34px] min-h-[36px] flex items-center justify-center"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-caudal-surface border border-caudal-border rounded-lg text-xs sm:text-[13.5px] font-medium text-caudal-text focus:outline-none focus:border-caudal-green cursor-pointer hover:bg-caudal-surface-alt transition-colors min-h-[36px]"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-caudal-surface text-caudal-text">
                {opt.label}
              </option>
            ))}
          </select>

          {!isAll && (
            <button
              onClick={() => setSelectedMonth('all')}
              className="px-3 py-1.5 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-xs font-semibold text-caudal-text-muted hover:text-caudal-text transition-colors min-h-[36px]"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Net Income */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-4 hover:border-caudal-green/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-caudal-green/10 flex items-center justify-center text-caudal-green shrink-0">
              <BanknoteIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-xs sm:text-[13.5px] font-medium text-caudal-text-muted truncate">Net Income</h3>
          </div>
          <div>
            <div className="text-lg sm:text-[22px] font-bold text-caudal-green truncate leading-tight">{money(totalIncome)}</div>
            <p className="text-[11px] sm:text-xs text-caudal-text-dim mt-1 truncate">
              {totalWeeks > 0 ? `Avg: ${money(avgWeeklyIncome)}/wk (${totalWeeks})` : 'No payrolls recorded'}
            </p>
          </div>
        </div>

        {/* ISR Retained (Taxes) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-4 hover:border-caudal-orange/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-caudal-orange/10 flex items-center justify-center text-caudal-orange shrink-0">
              <ReceiptIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-xs sm:text-[13.5px] font-medium text-caudal-text-muted truncate">ISR Retained</h3>
          </div>
          <div>
            <div className="text-lg sm:text-[22px] font-bold text-caudal-orange truncate leading-tight">{money(totalIsr)}</div>
            <p className="text-[11px] sm:text-xs text-caudal-text-dim mt-1 truncate">
              Payroll tax deducted
            </p>
          </div>
        </div>

        {/* Total Expenses (Fixed + Important Variable) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-4 hover:border-caudal-orange/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-caudal-orange/10 flex items-center justify-center text-caudal-orange shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-xs sm:text-[13.5px] font-medium text-caudal-text-muted truncate">Recorded Expenses</h3>
          </div>
          <div>
            <div className="text-lg sm:text-[22px] font-bold text-caudal-orange truncate leading-tight">{money(totalExpenses)}</div>
            <p className="text-[11px] sm:text-xs text-caudal-text-dim mt-1 truncate flex items-center gap-1.5">
              <span className="text-caudal-green font-semibold">Fixed: {money(totalFixedExpenses)}</span>
              <span className="text-caudal-border">|</span>
              <span className="text-caudal-orange font-semibold">Var: {money(totalVariableExpenses)}</span>
            </p>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-4 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-caudal-surface-alt flex items-center justify-center text-caudal-text shrink-0">
              <WalletIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-xs sm:text-[13.5px] font-medium text-caudal-text-muted truncate">Remaining</h3>
          </div>
          <div>
            <div className={`text-lg sm:text-[22px] font-bold truncate leading-tight ${remainingBalance >= 0 ? 'text-caudal-green' : 'text-caudal-error'}`}>
              {money(remainingBalance)}
            </div>
            <p className="text-[11px] sm:text-xs text-caudal-text-dim mt-1 truncate">After fixed & major expenses</p>
          </div>
        </div>
      </div>

      {/* 3-Column Bento Grid: Fixed Bills | Savings Fund | Investments (SOFIPOs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
        {/* Column 1: Monthly Fixed Bills Status & Quick-Pay Checklist */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <h2 className="text-[15.5px] font-bold text-caudal-text truncate">Fixed Bills — {targetMonthLabel}</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5 truncate">
                  {paidBillsCount}/{totalBillsCount} paid ({money(monthlyBillsPaidAmount)} / {money(monthlyBillsTotalBudget)})
                </p>
              </div>
              <Link
                href="/fixed-expenses"
                className="text-xs font-semibold text-caudal-green hover:underline shrink-0"
              >
                Matrix →
              </Link>
            </div>

            {/* Monthly Bills Progress Bar */}
            <div className="mb-3">
              <div className="h-2 w-full bg-caudal-surface-alt rounded-full overflow-hidden shadow-inner">
                <div
                  style={{ width: `${billsProgressPercent}%` }}
                  className="bg-caudal-green h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Pending Bills List or All Paid State */}
            {totalBillsCount === 0 ? (
              <div className="flex items-center justify-center h-36 text-caudal-text-dim text-sm">
                No fixed expenses configured yet.
              </div>
            ) : pendingBills.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-caudal-text-dim pb-0.5">
                  <span>Pending ({pendingBills.length})</span>
                  <span>Left: {money(monthlyBillsTotalBudget - monthlyBillsPaidAmount)}</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 touch-scroll">
                  {pendingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-caudal-surface-alt border border-caudal-border/60 hover:border-caudal-border transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-caudal-surface border border-caudal-border text-[11px] font-semibold text-caudal-text-muted shrink-0">
                          Day {bill.dueDay || 1}
                        </span>
                        <span className="text-sm font-medium text-caudal-text truncate">{bill.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-caudal-orange">{money(bill.cost)}</span>
                        <button
                          onClick={() => handleQuickPayBill(bill)}
                          disabled={payingExpenseId === bill.id}
                          title={`Mark ${bill.name} as paid for ${targetMonthLabel}`}
                          className="px-2 py-1 rounded-md bg-caudal-green/15 hover:bg-caudal-green text-caudal-green hover:text-caudal-bg text-xs font-semibold border border-caudal-green/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>{payingExpenseId === bill.id ? '...' : 'Pay'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-caudal-green/5 border border-caudal-green/20 flex flex-col items-center justify-center text-center my-2">
                <div className="w-9 h-9 rounded-full bg-caudal-green/15 text-caudal-green flex items-center justify-center mb-1.5">
                  <CheckIcon className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-caudal-text">All fixed bills paid for {targetMonthLabel}!</p>
                <p className="text-xs text-caudal-text-muted mt-0.5">
                  Total paid this month: {money(monthlyBillsPaidAmount)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Single Authoritative Savings Fund Card (Fondo de Ahorro) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <h2 className="text-[15.5px] font-bold text-caudal-text truncate">Savings Fund</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5 truncate">Fondo de Ahorro (1:1 Match)</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isAll && totalSavings > 0 && (
                  <button
                    type="button"
                    onClick={handleCloseSavingsCycle}
                    disabled={isUpdatingSavingsCycle}
                    title="Mark current savings as paid out and start a new cycle from $0"
                    className="px-2 py-0.5 bg-caudal-surface-alt hover:bg-caudal-green/15 text-caudal-text-muted hover:text-caudal-green text-[11px] font-semibold rounded-full border border-caudal-border hover:border-caudal-green/30 transition-colors disabled:opacity-50"
                  >
                    New Cycle
                  </button>
                )}
                <span className="px-2 py-0.5 bg-caudal-green/10 text-caudal-green text-[11px] font-semibold rounded-full border border-caudal-green/20">
                  1:1 Match
                </span>
              </div>
            </div>

            {/* Big Total Box */}
            <div className="p-3 rounded-xl bg-caudal-surface-alt border border-caudal-border/80 mb-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-caudal-text-muted uppercase tracking-wider font-medium">
                  {isAll ? 'Current cycle' : 'Accumulated in month'}
                </p>
                {isAll && savingsWeeks > 0 && (
                  <span className="text-[11px] text-caudal-green font-semibold">
                    Est. 52-wk: ~{money(projectedAnnualSavings)}
                  </span>
                )}
              </div>
              <p className="text-[23px] font-extrabold text-caudal-green leading-tight">{money(totalSavings)}</p>
            </div>

            {/* 2 Clear breakdown cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-[11px] text-caudal-text-muted block mb-0.5">Your Savings</span>
                <span className="text-sm sm:text-[15px] font-bold text-caudal-text">{money(employeeSavings)}</span>
              </div>
              <div className="p-2.5 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-[11px] text-caudal-text-muted block mb-0.5">Company (+100%)</span>
                <span className="text-sm sm:text-[15px] font-bold text-caudal-green">{money(employerSavings)}</span>
              </div>
            </div>

            {/* Last Payout Reference Box */}
            {isAll && lastPayoutTotal > 0 && (
              <div className="mt-2.5 px-3 py-2 rounded-lg bg-caudal-green/5 border border-caudal-green/20 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-caudal-text block truncate">
                    Last payout received
                  </span>
                  <span className="text-[11px] text-caudal-text-dim">
                    {lastPayoutWeeks} weekly payrolls
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-extrabold text-caudal-green">
                    {money(lastPayoutTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={handleUndoSavingsCycle}
                    disabled={isUpdatingSavingsCycle}
                    title="Undo payout and restore to current count"
                    className="text-[11px] text-caudal-text-dim hover:text-caudal-text underline transition-colors disabled:opacity-50"
                  >
                    Undo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Helpful footer summary */}
          <div className="mt-3 pt-2.5 border-t border-caudal-border/60 flex items-center justify-between text-[11px] text-caudal-text-dim">
            <span>{savingsWeeks} wk in current cycle</span>
            <span>Avg: ~{money(avgWeeklySavings)}/wk</span>
          </div>
        </div>

        {/* Column 3: Investments (SOFIPOs) Summary Card */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <h2 className="text-[15.5px] font-bold text-caudal-text truncate">Investments (SOFIPOs)</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5 truncate">
                  {accountsWithTotals.length} bank{accountsWithTotals.length === 1 ? '' : 's'} · {totalPockets} pocket{totalPockets === 1 ? '' : 's'}
                </p>
              </div>
              <Link
                href="/investments"
                className="text-xs font-semibold text-caudal-green hover:underline shrink-0"
              >
                Manage →
              </Link>
            </div>

            {accountsWithTotals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <TrendUpIcon className="w-6 h-6 text-caudal-green mb-2" />
                <p className="text-sm font-medium text-caudal-text">No SOFIPO accounts yet</p>
                <Link href="/investments" className="text-xs text-caudal-green hover:underline mt-1">
                  Set up your banks →
                </Link>
              </div>
            ) : (
              <>
                {/* Total Invested + Yield Box */}
                <div className="p-3 rounded-xl bg-caudal-surface-alt border border-caudal-border/80 mb-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[11px] text-caudal-text-muted uppercase tracking-wider font-medium">
                      Total Invested
                    </p>
                    {totalAnnualYield > 0 && (
                      <span className="text-[11px] text-caudal-green font-semibold">
                        +{money(totalMonthlyYield)}/mo
                      </span>
                    )}
                  </div>
                  <p className="text-[23px] font-extrabold text-caudal-green leading-tight">{money(totalInvested)}</p>

                  {/* Multi-bank distribution bar */}
                  {totalInvested > 0 && (
                    <div className="h-1.5 w-full bg-caudal-surface rounded-full overflow-hidden flex mt-2">
                      {accountsWithTotals.map((a) =>
                        a.total > 0 ? (
                          <div
                            key={a.id}
                            style={{ width: `${(a.total / totalInvested) * 100}%`, backgroundColor: a.color }}
                            className="h-full transition-all duration-500"
                            title={`${a.name}: ${((a.total / totalInvested) * 100).toFixed(0)}%`}
                          />
                        ) : null
                      )}
                    </div>
                  )}
                </div>

                {/* Per-bank mini list */}
                <div className="space-y-1.5">
                  {accountsWithTotals.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-caudal-surface-alt/60 border border-caudal-border/40"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span className="text-sm font-medium text-caudal-text truncate">{acc.name}</span>
                        {acc.rate ? (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 leading-none"
                            style={{
                              color: acc.color,
                              borderColor: `color-mix(in srgb, ${acc.color} 35%, transparent)`,
                              backgroundColor: `color-mix(in srgb, ${acc.color} 12%, transparent)`,
                            }}
                          >
                            {acc.rate}%
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: acc.color }}>
                        {money(acc.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {totalAnnualYield > 0 && (
            <div className="mt-3 pt-2.5 border-t border-caudal-border/60 flex items-center justify-between text-[11px] text-caudal-text-dim">
              <span>Est. annual yield</span>
              <span className="font-semibold text-caudal-text-muted">≈ {money(totalAnnualYield)}/yr</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Recent Activity (2x2 Grid so there is no vertical scroll) */}
      <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[15.5px] font-bold text-caudal-text">Recent Activity</h2>
            <span className="text-xs text-caudal-text-muted hidden sm:inline">Latest payrolls & variable expenses</span>
          </div>
          <span className="text-xs text-caudal-text-dim">Last {activities.length} entries</span>
        </div>

        {activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="px-3 py-2 rounded-lg bg-caudal-surface-alt/50 border border-caudal-border/40 flex justify-between items-center gap-3"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-caudal-text-dim shrink-0">
                    {formatDate(activity.date)}
                  </span>
                  <p className="text-sm font-medium text-caudal-text truncate">{activity.description}</p>
                </div>
                <div className={`text-sm font-bold shrink-0 ${activity.type === 'income' ? 'text-caudal-green' : 'text-caudal-orange'}`}>
                  {activity.type === 'income' ? '+' : '-'}{money(activity.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-caudal-text-dim py-2 text-center">No recent activity to show.</p>
        )}
      </div>
    </div>
  );
}
