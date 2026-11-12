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
} from '@/components/icons';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [payrollData, setPayrollData] = useState([]);
  const [fixedExpensesData, setFixedExpensesData] = useState([]);
  const [variableExpensesData, setVariableExpensesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingExpenseId, setPayingExpenseId] = useState(null);

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

        const [payrollRes, fixedRes, variableRes] = await Promise.all([
          fetch(payrollUrl),
          fetch('/api/fixed-expenses'),
          fetch(variableUrl),
        ]);

        const payrolls = await payrollRes.json();
        const fixed = await fixedRes.json();
        const variable = await variableRes.json();

        if (isCancelled) return;

        setPayrollData(Array.isArray(payrolls) ? payrolls : []);
        setFixedExpensesData(Array.isArray(fixed) ? fixed : []);
        setVariableExpensesData(Array.isArray(variable) ? variable : []);
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

  // Savings Fund calculations (Single authoritative card with year-end projection)
  const employeeSavings = payrollData.reduce((sum, item) => sum + (item.savingsFund || 0), 0);
  const employerSavings = payrollData.reduce((sum, item) => sum + (item.employerMatch || item.savingsFund || 0), 0);
  const totalSavings = employeeSavings + employerSavings;
  const avgWeeklySavings = totalWeeks > 0 ? totalSavings / totalWeeks : 0;
  // Projected 52-week annual payout based on average weekly contribution + match
  const projectedAnnualSavings = avgWeeklySavings * 52;

  // Recent activity: merge payroll and variable expenses
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
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

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
      <div className="p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-center items-center h-64 text-caudal-text-muted">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Header with improved clean month selector */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-caudal-text">Dashboard</h1>
          <p className="text-xs sm:text-sm text-caudal-text-muted mt-0.5">{selectedOptionLabel}</p>
        </div>

        {/* Clean dropdown selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!isAll && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-caudal-surface border border-caudal-border rounded-lg text-xs sm:text-sm font-medium text-caudal-text focus:outline-none focus:border-caudal-green cursor-pointer hover:bg-caudal-surface-alt transition-colors min-h-[36px]"
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
              className="px-3 py-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-xs font-semibold text-caudal-text-muted hover:text-caudal-text transition-colors min-h-[36px]"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* 4 Core Metric Cards (2x2 on mobile, 4 in row on desktop — no duplicate Savings Fund) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Income */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-5 hover:border-caudal-green/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-caudal-green/10 flex items-center justify-center text-caudal-green shrink-0">
              <BanknoteIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-caudal-text-muted truncate">Net Income</h3>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-caudal-green truncate">{formatMoney(totalIncome)}</div>
            <p className="text-[10px] sm:text-xs text-caudal-text-dim mt-0.5 sm:mt-1.5 truncate">
              {totalWeeks > 0 ? `Avg: ${formatMoney(avgWeeklyIncome)}/wk (${totalWeeks})` : 'No payrolls recorded'}
            </p>
          </div>
        </div>

        {/* ISR Retained (Taxes) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-5 hover:border-caudal-orange/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-caudal-orange/10 flex items-center justify-center text-caudal-orange shrink-0">
              <ReceiptIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-caudal-text-muted truncate">ISR Retained</h3>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-caudal-orange truncate">{formatMoney(totalIsr)}</div>
            <p className="text-[10px] sm:text-xs text-caudal-text-dim mt-0.5 sm:mt-1.5 truncate">
              Payroll tax deducted
            </p>
          </div>
        </div>

        {/* Total Expenses (Fixed + Important Variable) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-5 hover:border-caudal-orange/30 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-caudal-orange/10 flex items-center justify-center text-caudal-orange shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-caudal-text-muted truncate">Recorded Expenses</h3>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-caudal-orange truncate">{formatMoney(totalExpenses)}</div>
            <p className="text-[10px] sm:text-xs text-caudal-text-dim mt-0.5 sm:mt-1.5 truncate flex items-center gap-1.5">
              <span className="text-caudal-green font-semibold">Fixed: {formatMoney(totalFixedExpenses)}</span>
              <span className="text-caudal-border">|</span>
              <span className="text-caudal-orange font-semibold">Var: {formatMoney(totalVariableExpenses)}</span>
            </p>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-3.5 sm:p-5 transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-caudal-surface-alt flex items-center justify-center text-caudal-text shrink-0">
              <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-caudal-text-muted truncate">Remaining</h3>
          </div>
          <div>
            <div className={`text-lg sm:text-2xl font-bold truncate ${remainingBalance >= 0 ? 'text-caudal-green' : 'text-caudal-error'}`}>
              {formatMoney(remainingBalance)}
            </div>
            <p className="text-[10px] sm:text-xs text-caudal-text-dim mt-0.5 sm:mt-1.5 truncate">After fixed & major expenses</p>
          </div>
        </div>
      </div>

      {/* Actionable Fixed Bills Checklist & Single Savings Fund Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Fixed Bills Status & Quick-Pay Checklist */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-caudal-text">Fixed Bills — {targetMonthLabel}</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5">
                  {paidBillsCount} of {totalBillsCount} bills paid ({formatMoney(monthlyBillsPaidAmount)} / {formatMoney(monthlyBillsTotalBudget)})
                </p>
              </div>
              <Link
                href="/fixed-expenses"
                className="text-xs font-semibold text-caudal-green hover:underline shrink-0"
              >
                View Matrix →
              </Link>
            </div>

            {/* Monthly Bills Progress Bar */}
            <div className="mb-4">
              <div className="h-2.5 w-full bg-caudal-surface-alt rounded-full overflow-hidden shadow-inner">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-caudal-text-dim pb-1">
                  <span>Pending to pay ({pendingBills.length})</span>
                  <span>Remaining: {formatMoney(monthlyBillsTotalBudget - monthlyBillsPaidAmount)}</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {pendingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-caudal-surface-alt border border-caudal-border/60 hover:border-caudal-border transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-caudal-surface border border-caudal-border text-[11px] font-semibold text-caudal-text-muted shrink-0">
                          Day {bill.dueDay || 1}
                        </span>
                        <span className="text-sm font-medium text-caudal-text truncate">{bill.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-sm font-bold text-caudal-orange">{formatMoney(bill.cost)}</span>
                        <button
                          onClick={() => handleQuickPayBill(bill)}
                          disabled={payingExpenseId === bill.id}
                          title={`Mark ${bill.name} as paid for ${targetMonthLabel}`}
                          className="px-2.5 py-1.5 rounded-md bg-caudal-green/15 hover:bg-caudal-green text-caudal-green hover:text-caudal-bg text-xs font-semibold border border-caudal-green/30 transition-colors flex items-center gap-1 disabled:opacity-50"
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
              <div className="p-5 rounded-xl bg-caudal-green/5 border border-caudal-green/20 flex flex-col items-center justify-center text-center my-2">
                <div className="w-10 h-10 rounded-full bg-caudal-green/15 text-caudal-green flex items-center justify-center mb-2">
                  <CheckIcon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-caudal-text">All fixed bills paid for {targetMonthLabel}!</p>
                <p className="text-xs text-caudal-text-muted mt-0.5">
                  Total paid this month: {formatMoney(monthlyBillsPaidAmount)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Single Authoritative Savings Fund Card (Fondo de Ahorro) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-caudal-text">Savings Fund (Fondo de Ahorro)</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5">Annual company savings payout in December</p>
              </div>
              <span className="px-2.5 py-1 bg-caudal-green/10 text-caudal-green text-xs font-semibold rounded-full border border-caudal-green/20 shrink-0">
                1:1 Match
              </span>
            </div>

            {/* Big Total Box */}
            <div className="p-4 rounded-xl bg-caudal-surface-alt border border-caudal-border/80 mb-3.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-caudal-text-muted uppercase tracking-wider font-medium">
                  Accumulated so far
                </p>
                {isAll && totalWeeks > 0 && (
                  <span className="text-[11px] text-caudal-green font-semibold">
                    Est. 52-wk: ~{formatMoney(projectedAnnualSavings)}
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-caudal-green">{formatMoney(totalSavings)}</p>
              <p className="text-xs text-caudal-text-dim mt-1">
                Your payroll deductions + 100% company contribution
              </p>
            </div>

            {/* 2 Clear breakdown cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-xs text-caudal-text-muted block mb-1">Your Savings (Deducted)</span>
                <span className="text-base sm:text-lg font-bold text-caudal-text">{formatMoney(employeeSavings)}</span>
              </div>
              <div className="p-3 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-xs text-caudal-text-muted block mb-1">Company Match (+100%)</span>
                <span className="text-base sm:text-lg font-bold text-caudal-green">{formatMoney(employerSavings)}</span>
              </div>
            </div>
          </div>

          {/* Helpful footer summary */}
          <div className="mt-4 pt-3 border-t border-caudal-border/60 flex items-center justify-between text-xs text-caudal-text-dim">
            <span>{totalWeeks} weekly payrolls recorded</span>
            <span>Avg: ~{formatMoney(avgWeeklySavings)}/week saved</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-caudal-text">Recent Activity</h2>
            <p className="text-xs text-caudal-text-muted mt-0.5">Latest payrolls and important variable expenses</p>
          </div>
          <span className="text-xs text-caudal-text-dim">Last 5 entries</span>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-caudal-border">
            {activities.map((activity) => (
              <div key={activity.id} className="py-3 flex justify-between items-center gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-caudal-text truncate">{activity.description}</p>
                  <p className="text-xs text-caudal-text-dim mt-0.5">{formatDate(activity.date)}</p>
                </div>
                <div className={`text-sm font-bold shrink-0 ${activity.type === 'income' ? 'text-caudal-green' : 'text-caudal-orange'}`}>
                  {activity.type === 'income' ? '+' : '-'}{formatMoney(activity.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-caudal-text-dim py-4 text-center">No recent activity to show.</p>
        )}
      </div>
    </div>
  );
}
