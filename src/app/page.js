'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/lib/format';
import {
  BanknoteIcon,
  ReceiptIcon,
  WalletIcon,
  PiggyBankIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [payrollData, setPayrollData] = useState([]);
  const [fixedExpensesData, setFixedExpensesData] = useState([]);
  const [variableExpensesData, setVariableExpensesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate list of months for selector (Current year + past year)
  const now = new Date();
  const currentYear = now.getFullYear();
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

  // Calculations
  const totalIncome = payrollData.reduce((sum, item) => sum + (item.amountReceived || 0), 0);

  let totalFixedExpenses = 0;
  if (Array.isArray(fixedExpensesData)) {
    if (isAll) {
      totalFixedExpenses = fixedExpensesData.reduce((acc, e) => acc + (e.cost || 0), 0);
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      totalFixedExpenses = fixedExpensesData.reduce((acc, e) => {
        const payment = e.payments?.find(p => {
          const d = new Date(p.date);
          return d.getUTCFullYear() === year && (d.getUTCMonth() + 1) === month;
        });
        return acc + (payment?.paid ? (e.cost || 0) : 0);
      }, 0);
    }
  }

  const totalVariableExpenses = variableExpensesData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const remainingBalance = totalIncome - totalExpenses;

  // Savings Fund calculations (all payrolls registered)
  const employeeSavings = payrollData.reduce((sum, item) => sum + (item.savingsFund || 0), 0);
  const employerSavings = payrollData.reduce((sum, item) => sum + (item.employerMatch || 0), 0);
  const totalSavings = employeeSavings + employerSavings;
  const totalWeeks = payrollData.length;
  const avgWeeklySavings = totalWeeks > 0 ? totalSavings / totalWeeks : 0;

  // Expense distribution percentages
  const fixedPercent = totalExpenses > 0 ? (totalFixedExpenses / totalExpenses) * 100 : 0;
  const variablePercent = totalExpenses > 0 ? (totalVariableExpenses / totalExpenses) * 100 : 0;

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
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header with improved clean month selector */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-caudal-text">Dashboard</h1>
          <p className="text-sm text-caudal-text-muted mt-0.5">{selectedOptionLabel}</p>
        </div>

        {/* Clean dropdown selector */}
        <div className="flex items-center gap-2">
          {!isAll && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors"
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
            className="px-3.5 py-2 bg-caudal-surface border border-caudal-border rounded-lg text-sm font-medium text-caudal-text focus:outline-none focus:border-caudal-green cursor-pointer hover:bg-caudal-surface-alt transition-colors"
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
              className="px-3 py-2 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-xs font-semibold text-caudal-text-muted hover:text-caudal-text transition-colors"
            >
              Reset to All
            </button>
          )}
        </div>
      </header>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-5 hover:border-caudal-green/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-caudal-green/10 flex items-center justify-center text-caudal-green">
              <BanknoteIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-caudal-text-muted">Total Income</h3>
          </div>
          <div className="text-2xl font-bold text-caudal-green">{formatMoney(totalIncome)}</div>
          <p className="text-xs text-caudal-text-dim mt-1.5">Payroll received</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-5 hover:border-caudal-orange/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-caudal-orange/10 flex items-center justify-center text-caudal-orange">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-caudal-text-muted">Total Expenses</h3>
          </div>
          <div className="text-2xl font-bold text-caudal-orange">{formatMoney(totalExpenses)}</div>
          <p className="text-xs text-caudal-text-dim mt-1.5">
            Fixed: {formatMoney(totalFixedExpenses)} | Var: {formatMoney(totalVariableExpenses)}
          </p>
        </div>

        {/* Remaining Balance */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-5 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-caudal-surface-alt flex items-center justify-center text-caudal-text">
              <WalletIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-caudal-text-muted">Remaining Balance</h3>
          </div>
          <div className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-caudal-text' : 'text-caudal-error'}`}>
            {formatMoney(remainingBalance)}
          </div>
          <p className="text-xs text-caudal-text-dim mt-1.5">Income minus expenses</p>
        </div>

        {/* Savings Fund */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-5 hover:border-caudal-green/30 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-caudal-green/10 flex items-center justify-center text-caudal-green">
              <PiggyBankIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-caudal-text-muted">Savings Fund</h3>
          </div>
          <div className="text-2xl font-bold text-caudal-green">{formatMoney(totalSavings)}</div>
          <p className="text-xs text-caudal-text-dim mt-1.5">
            You: {formatMoney(employeeSavings)} | Match: {formatMoney(employerSavings)}
          </p>
        </div>
      </div>

      {/* Clear Visual Breakdown & Savings Fund Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clear Expense Breakdown Card (No confusing donut) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-caudal-text">Where Did Your Money Go?</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5">Fixed vs. Variable expenses distribution</p>
              </div>
              <span className="text-sm font-bold text-caudal-orange">{formatMoney(totalExpenses)}</span>
            </div>

            {totalExpenses > 0 ? (
              <div className="space-y-4 pt-1">
                {/* Visual distribution split bar */}
                <div>
                  <div className="flex justify-between text-xs text-caudal-text-muted mb-2 font-medium">
                    <span className="flex items-center gap-1.5 text-caudal-green font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-caudal-green inline-block"></span>
                      Fixed: {fixedPercent.toFixed(0)}% ({formatMoney(totalFixedExpenses)})
                    </span>
                    <span className="flex items-center gap-1.5 text-caudal-orange font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-caudal-orange inline-block"></span>
                      Variable: {variablePercent.toFixed(0)}% ({formatMoney(totalVariableExpenses)})
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-caudal-surface-alt rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${fixedPercent}%` }}
                      className="bg-caudal-green h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${variablePercent}%` }}
                      className="bg-caudal-orange h-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* 2 Clear detail blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/fixed-expenses"
                    className="p-3.5 rounded-lg bg-caudal-surface-alt border border-caudal-border/60 hover:border-caudal-green/40 transition-colors block"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-caudal-text-muted font-medium">Fixed Expenses</span>
                      <span className="text-xs text-caudal-green font-bold">{fixedPercent.toFixed(0)}%</span>
                    </div>
                    <p className="text-xl font-bold text-caudal-text">{formatMoney(totalFixedExpenses)}</p>
                    <p className="text-xs text-caudal-text-dim mt-1">Rent, subscriptions, internet & utilities</p>
                  </Link>

                  <Link
                    href="/variable-expenses"
                    className="p-3.5 rounded-lg bg-caudal-surface-alt border border-caudal-border/60 hover:border-caudal-orange/40 transition-colors block"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-caudal-text-muted font-medium">Variable Expenses</span>
                      <span className="text-xs text-caudal-orange font-bold">{variablePercent.toFixed(0)}%</span>
                    </div>
                    <p className="text-xl font-bold text-caudal-text">{formatMoney(totalVariableExpenses)}</p>
                    <p className="text-xs text-caudal-text-dim mt-1">Daily purchases, food, dining & outings</p>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-36 text-caudal-text-dim text-sm">
                No expense records found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Clear Savings Fund Card (Fondo de Ahorro para fin de año) */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-caudal-text">Savings Fund (Fondo de Ahorro)</h2>
                <p className="text-xs text-caudal-text-muted mt-0.5">Annual company savings payout in December</p>
              </div>
              <span className="px-2.5 py-1 bg-caudal-green/10 text-caudal-green text-xs font-semibold rounded-full border border-caudal-green/20">
                1:1 Match
              </span>
            </div>

            {/* Big Total Box */}
            <div className="p-4 rounded-xl bg-caudal-surface-alt border border-caudal-border/80 mb-4">
              <p className="text-xs text-caudal-text-muted uppercase tracking-wider mb-1 font-medium">
                Total to receive in December
              </p>
              <p className="text-3xl font-extrabold text-caudal-green">{formatMoney(totalSavings)}</p>
              <p className="text-xs text-caudal-text-dim mt-1">
                Your accumulated deductions + company contributions
              </p>
            </div>

            {/* 2 Clear breakdown cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-xs text-caudal-text-muted block mb-1">Your Savings (Deducted)</span>
                <span className="text-lg font-bold text-caudal-text">{formatMoney(employeeSavings)}</span>
              </div>
              <div className="p-3 bg-caudal-surface-alt/60 rounded-lg border border-caudal-border/40">
                <span className="text-xs text-caudal-text-muted block mb-1">Company Match (+100%)</span>
                <span className="text-lg font-bold text-caudal-green">{formatMoney(employerSavings)}</span>
              </div>
            </div>

            {/* Helpful footer summary */}
            {totalWeeks > 0 && (
              <div className="mt-4 pt-3 border-t border-caudal-border/60 flex items-center justify-between text-xs text-caudal-text-dim">
                <span>{totalWeeks} weekly payrolls recorded</span>
                <span>Avg: ~{formatMoney(avgWeeklySavings)}/week saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-caudal-text">Recent Activity</h2>
            <p className="text-xs text-caudal-text-muted mt-0.5">Latest transactions and payroll entries</p>
          </div>
          <span className="text-xs text-caudal-text-dim">Last 5 entries</span>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-caudal-border">
            {activities.map((activity) => (
              <div key={activity.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-caudal-text">{activity.description}</p>
                  <p className="text-xs text-caudal-text-dim mt-0.5">{formatDate(activity.date)}</p>
                </div>
                <div className={`text-sm font-bold ${activity.type === 'income' ? 'text-caudal-green' : 'text-caudal-orange'}`}>
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
