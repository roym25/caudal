'use client';

import { useState, useEffect } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import { BanknoteIcon, ReceiptIcon, WalletIcon, PiggyBankIcon } from '@/components/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [payrollData, setPayrollData] = useState([]);
  const [fixedExpensesData, setFixedExpensesData] = useState([]);
  const [variableExpensesData, setVariableExpensesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Savings
  const employeeSavings = payrollData.reduce((sum, item) => sum + (item.savingsFund || 0), 0);
  const employerSavings = payrollData.reduce((sum, item) => sum + (item.employerMatch || 0), 0);
  const totalSavings = employeeSavings + employerSavings;
  const numPayrollRecords = payrollData.length || 1;
  const projectedSavings = payrollData.length > 0 ? (totalSavings / numPayrollRecords) * 52 : 0;

  // Pie chart data
  const pieData = [
    { name: 'Fixed Expenses', value: totalFixedExpenses, color: '#00C853' },
    { name: 'Variable Expenses', value: totalVariableExpenses, color: '#E65100' },
  ].filter(d => d.value > 0);

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
      description: v.description,
      amount: v.amount,
      type: 'expense',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const periodLabel = isAll
    ? 'All-Time Overview'
    : new Date(`${selectedMonth}-15T12:00:00Z`).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });

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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-caudal-text">Dashboard</h1>
          <p className="text-sm text-caudal-text-muted mt-0.5 capitalize">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMonth('all')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isAll
                ? 'bg-caudal-green text-black font-semibold'
                : 'bg-caudal-surface border border-caudal-border text-caudal-text-muted hover:text-caudal-text'
            }`}
          >
            View All
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-caudal-text-muted">Month:</span>
            <input
              type="month"
              value={isAll ? '' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'all')}
              className="px-3 py-1.5 bg-caudal-surface border border-caudal-border rounded-lg text-sm text-caudal-text focus:outline-none focus:border-caudal-green"
            />
          </div>
        </div>
      </header>

      {/* KPI Cards */}
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
          {!isAll && (
            <p className="text-xs text-caudal-text-dim mt-1.5">
              Fixed: {formatMoney(totalFixedExpenses)} | Var: {formatMoney(totalVariableExpenses)}
            </p>
          )}
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
          <div className="text-xs text-caudal-text-dim mt-1.5">
            You: {formatMoney(employeeSavings)} | Match: {formatMoney(employerSavings)}
          </div>
        </div>
      </div>

      {/* Middle Row: Charts and Savings Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-bold text-caudal-text mb-4">Expense Breakdown</h2>
          <div className="flex-1 min-h-[220px] relative flex flex-col justify-center">
            {totalExpenses > 0 ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-xs text-caudal-text-muted">Total</span>
                  <span className="text-lg font-bold text-caudal-text">{formatMoney(totalExpenses)}</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatMoney(value)}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        borderColor: '#2E2E2E',
                        borderRadius: '8px',
                        color: '#E4E4E4',
                      }}
                      itemStyle={{ color: '#E4E4E4' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-caudal-text-dim text-sm">
                No expense data for this period
              </div>
            )}
          </div>
          {totalExpenses > 0 && (
            <div className="mt-2 flex justify-center gap-6">
              {pieData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <div className="text-xs">
                    <span className="text-caudal-text-muted">{entry.name}: </span>
                    <span className="text-caudal-text font-medium">{formatMoney(entry.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Savings Fund Tracker */}
        <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-bold text-caudal-text mb-4">Savings Fund Tracker</h2>

          <div className="space-y-5 flex-1">
            <div className="flex justify-between items-end border-b border-caudal-border pb-4">
              <div>
                <p className="text-xs text-caudal-text-muted mb-1">Accumulated Total</p>
                <p className="text-3xl font-bold text-caudal-green">{formatMoney(totalSavings)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-caudal-text-muted mb-1">Projected Year-End</p>
                <p className="text-base font-semibold text-caudal-text">{formatMoney(projectedSavings)}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-caudal-text-muted">Your Contributions</span>
                <span className="text-caudal-text font-medium">{formatMoney(employeeSavings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-caudal-text-muted">Employer Match</span>
                <span className="text-caudal-green font-medium">+{formatMoney(employerSavings)}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs text-caudal-text-dim mb-2">
                <span>Annual Progress</span>
                <span>{payrollData.length} of 52 weeks recorded</span>
              </div>
              <div className="h-2 w-full bg-caudal-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-caudal-green rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (payrollData.length / 52) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-caudal-surface border border-caudal-border rounded-xl p-6">
        <h2 className="text-base font-bold text-caudal-text mb-4">Recent Activity</h2>
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
