'use client';

import { useState, useEffect } from 'react';
import { formatMoney } from '@/lib/format';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@/components/icons';
import Toast from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import LoadingTable from '@/components/LoadingTable';
import SlidePanel from '@/components/SlidePanel';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FixedExpensesPage() {
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [form, setForm] = useState({ name: '', cost: '', dueDay: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', cost: '', dueDay: '' });
  const [paymentModal, setPaymentModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchFixedExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fixed-expenses');
      const data = await response.json();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name));
        setFixedExpenses(sorted);
      }
    } catch (err) {
      console.error('Error fetching fixed expenses:', err);
      showToast('Error loading fixed expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixedExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cost || !form.dueDay) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cost: parseFloat(form.cost),
          dueDay: parseInt(form.dueDay, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to save fixed expense', 'error');
        return;
      }

      setForm({ name: '', cost: '', dueDay: '' });
      setShowForm(false);
      showToast('Fixed expense added successfully');
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error creating fixed expense:', err);
      showToast('Network error while saving', 'error');
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({ name: expense.name, cost: expense.cost, dueDay: expense.dueDay });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/fixed-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          cost: parseFloat(editForm.cost),
          dueDay: parseInt(editForm.dueDay, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to update fixed expense', 'error');
        return;
      }

      setEditingId(null);
      showToast('Fixed expense updated successfully');
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error updating fixed expense:', err);
      showToast('Network error while updating', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/fixed-expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete fixed expense', 'error');
        return;
      }
      showToast('Fixed expense deleted successfully');
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error deleting fixed expense:', err);
      showToast('Network error while deleting', 'error');
    }
  };

  const togglePayment = async (expenseId, monthIndex, isPaid, optionalAmount) => {
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${monthNum}-01T12:00:00Z`;
    try {
      const payload = {
        fixedExpenseId: expenseId,
        date: dateStr,
        paid: !isPaid,
      };
      if (optionalAmount !== undefined && optionalAmount !== null) {
        payload.amount = optionalAmount;
      }
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        showToast('Failed to update payment status', 'error');
        return;
      }
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error toggling payment:', err);
      showToast('Network error updating payment', 'error');
    }
  };

  const getPaymentForMonth = (payments, monthIndex) => {
    if (!Array.isArray(payments)) return null;
    return payments.find(p => {
      const d = new Date(p.date);
      return d.getUTCMonth() === monthIndex && d.getUTCFullYear() === currentYear;
    });
  };

  const getTotalPaid = (expense) => {
    return MONTHS.reduce((sum, _, monthIndex) => {
      const payment = getPaymentForMonth(expense.payments, monthIndex);
      if (payment?.paid) {
        const amount = payment.amount !== null && payment.amount !== undefined ? payment.amount : (expense.cost || 0);
        return sum + amount;
      }
      return sum;
    }, 0);
  };

  const handleMonthClick = (expense, monthIndex) => {
    const payment = getPaymentForMonth(expense.payments, monthIndex);
    const isPaid = payment?.paid ?? false;
    if (!isPaid) {
      togglePayment(expense.id, monthIndex, false, expense.cost);
    } else {
      const paidAmount = payment.amount !== null && payment.amount !== undefined ? payment.amount : expense.cost;
      setPaymentModal({
        expenseId: expense.id,
        expenseName: expense.name,
        monthIndex,
        monthName: MONTHS[monthIndex],
        amount: String(paidAmount),
        defaultCost: expense.cost,
        isPaid: true,
      });
    }
  };

  const handleMonthContextMenu = (e, expense, monthIndex) => {
    e.preventDefault();
    const payment = getPaymentForMonth(expense.payments, monthIndex);
    const isPaid = payment?.paid ?? false;
    const paidAmount = payment?.amount !== null && payment?.amount !== undefined ? payment.amount : expense.cost;
    setPaymentModal({
      expenseId: expense.id,
      expenseName: expense.name,
      monthIndex,
      monthName: MONTHS[monthIndex],
      amount: String(paidAmount),
      defaultCost: expense.cost,
      isPaid,
    });
  };

  const handleSavePaymentAmount = async () => {
    if (!paymentModal) return;
    const parsed = parseFloat(paymentModal.amount);
    if (isNaN(parsed) || parsed < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const monthNum = String(paymentModal.monthIndex + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${monthNum}-01T12:00:00Z`;
    try {
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedExpenseId: paymentModal.expenseId,
          date: dateStr,
          paid: true,
          amount: parsed,
        }),
      });
      if (!res.ok) {
        showToast('Failed to update payment amount', 'error');
        return;
      }
      showToast(`Updated ${paymentModal.monthName} payment: ${formatMoney(parsed)}`);
      setPaymentModal(null);
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error updating payment amount:', err);
      showToast('Network error updating payment', 'error');
    }
  };

  const handleUnmarkPayment = async () => {
    if (!paymentModal) return;
    const monthNum = String(paymentModal.monthIndex + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${monthNum}-01T12:00:00Z`;
    try {
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedExpenseId: paymentModal.expenseId,
          date: dateStr,
          paid: false,
        }),
      });
      if (!res.ok) {
        showToast('Failed to unmark payment', 'error');
        return;
      }
      showToast(`Marked ${paymentModal.monthName} as unpaid`);
      setPaymentModal(null);
      fetchFixedExpenses();
    } catch (err) {
      console.error('Error unmarking payment:', err);
      showToast('Network error unmarking payment', 'error');
    }
  };

  const annualTotal = fixedExpenses.reduce((acc, expense) => acc + getTotalPaid(expense), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-caudal-text">Fixed Expenses</h1>
            <p className="text-sm text-caudal-text-muted mt-0.5">Recurring monthly bills & subscriptions</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => setCurrentYear(y => y - 1)}
              className="p-1.5 bg-caudal-surface hover:bg-caudal-surface-alt rounded-lg border border-caudal-border text-caudal-text-muted hover:text-caudal-text transition-colors"
              title="Previous year"
              aria-label="Previous year"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-base font-bold min-w-[3.5rem] text-center text-caudal-text">
              {currentYear}
            </span>
            <button
              onClick={() => setCurrentYear(y => y + 1)}
              className="p-1.5 bg-caudal-surface hover:bg-caudal-surface-alt rounded-lg border border-caudal-border text-caudal-text-muted hover:text-caudal-text transition-colors"
              title="Next year"
              aria-label="Next year"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-caudal-green text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          New Fixed Expense
        </button>
      </div>

      <SlidePanel isOpen={showForm} onClose={() => setShowForm(false)} title="New Fixed Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Expense Name</label>
            <input
              type="text"
              placeholder="e.g. Rent, Netflix, Internet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Monthly Cost</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Due Day of Month (1–31)</label>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="15"
              value={form.dueDay}
              onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors"
              required
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-caudal-green text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-opacity-90 transition-colors"
            >
              Save Fixed Expense
            </button>
          </div>
        </form>
      </SlidePanel>

      {loading ? (
        <LoadingTable columns={16} rows={3} />
      ) : fixedExpenses.length === 0 ? (
        <EmptyState
          message="No fixed expenses defined yet"
          action="Click '+ New Fixed Expense' to add recurring bills or subscriptions."
        />
      ) : (
        <div className="bg-caudal-surface border border-caudal-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[1000px]">
            <thead className="bg-caudal-surface-alt text-caudal-text-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Expense</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-3 py-3 text-center font-medium">Due Day</th>
                {MONTHS.map((month) => (
                  <th key={month} className="px-2 py-3 text-center font-medium">{month}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-caudal-green">Total Paid</th>
                <th className="px-4 py-3 text-center font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-caudal-border text-caudal-text">
              {fixedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-caudal-surface-alt/50 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === expense.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-caudal-text focus:outline-none focus:border-caudal-green w-full"
                      />
                    ) : (
                      <span className="font-medium text-caudal-text">{expense.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        value={editForm.cost}
                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-right text-caudal-text focus:outline-none focus:border-caudal-green w-24"
                      />
                    ) : (
                      formatMoney(expense.cost)
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editForm.dueDay}
                        onChange={(e) => setEditForm({ ...editForm, dueDay: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-center text-caudal-text focus:outline-none focus:border-caudal-green w-14"
                      />
                    ) : (
                      <span className="font-mono text-xs text-caudal-text-muted bg-caudal-surface-alt px-2 py-0.5 rounded border border-caudal-border/40">
                        Day {expense.dueDay}
                      </span>
                    )}
                  </td>
                  {MONTHS.map((month, monthIndex) => {
                    const payment = getPaymentForMonth(expense.payments, monthIndex);
                    const isPaid = payment?.paid ?? false;
                    const paidAmount = payment?.amount !== null && payment?.amount !== undefined ? payment.amount : expense.cost;
                    const hasCustomAmount = isPaid && payment?.amount !== null && payment?.amount !== undefined && payment.amount !== expense.cost;

                    return (
                      <td key={month} className="px-1.5 py-2.5 text-center">
                        <button
                          onClick={() => handleMonthClick(expense, monthIndex)}
                          onContextMenu={(e) => handleMonthContextMenu(e, expense, monthIndex)}
                          className={`relative w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center mx-auto ${
                            isPaid
                              ? hasCustomAmount
                                ? 'bg-caudal-green text-black hover:bg-opacity-80 scale-105 ring-2 ring-caudal-orange'
                                : 'bg-caudal-green text-black hover:bg-opacity-80 scale-105'
                              : 'bg-caudal-surface-alt border border-caudal-border text-caudal-text-dim hover:border-caudal-text-muted hover:text-caudal-text'
                          }`}
                          title={
                            isPaid
                              ? `${month} ${currentYear}: Paid ${formatMoney(paidAmount)}${hasCustomAmount ? ` (Base cost: ${formatMoney(expense.cost)})` : ''}\nClick to edit amount or mark unpaid`
                              : `${month} ${currentYear}: Unpaid (Cost: ${formatMoney(expense.cost)})\nClick to mark paid (Right-click to set custom amount)`
                          }
                        >
                          {isPaid ? <CheckIcon className="w-3.5 h-3.5" /> : null}
                          {hasCustomAmount && (
                            <span
                              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-caudal-orange border border-caudal-surface"
                              title={`Custom amount: ${formatMoney(paidAmount)}`}
                            />
                          )}
                        </button>
                        {isPaid && (
                          <span className={`text-[10px] block mt-0.5 leading-none font-mono ${hasCustomAmount ? 'text-caudal-orange font-semibold' : 'text-caudal-text-dim'}`}>
                            ${Math.round(paidAmount)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-bold text-caudal-green">
                    {formatMoney(getTotalPaid(expense))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === expense.id ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleUpdate(expense.id)}
                          className="p-1 text-caudal-green hover:bg-caudal-surface-alt rounded transition-colors"
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-caudal-text-muted hover:bg-caudal-surface-alt rounded transition-colors"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-1 text-caudal-text-muted hover:text-caudal-text hover:bg-caudal-surface-alt rounded transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1 text-caudal-text-muted hover:text-caudal-error hover:bg-caudal-surface-alt rounded transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-caudal-surface-alt text-caudal-text font-semibold border-t border-caudal-border">
                <td colSpan={3 + MONTHS.length} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-caudal-text-muted">
                  Annual Total Paid:
                </td>
                <td className="px-4 py-3 text-right font-bold text-caudal-green">
                  {formatMoney(annualTotal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-caudal-surface border border-caudal-border rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-caudal-text">{paymentModal.expenseName}</h3>
                <p className="text-xs text-caudal-text-muted">{paymentModal.monthName} {currentYear} Payment</p>
              </div>
              <button
                onClick={() => setPaymentModal(null)}
                className="p-1 text-caudal-text-muted hover:text-caudal-text rounded-lg hover:bg-caudal-surface-alt transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-caudal-text-muted mb-1">
                Amount Paid (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-caudal-text-dim text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePaymentAmount();
                    if (e.key === 'Escape') setPaymentModal(null);
                  }}
                  autoFocus
                  className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg pl-7 pr-3 py-2 text-caudal-text font-semibold focus:outline-none focus:border-caudal-green transition-colors"
                />
              </div>
              <div className="text-[11px] text-caudal-text-dim mt-1.5 flex items-center justify-between">
                <span>Base cost: {formatMoney(paymentModal.defaultCost)}</span>
                {paymentModal.amount && parseFloat(paymentModal.amount) !== paymentModal.defaultCost && (
                  <span className="text-caudal-orange font-medium">Custom amount</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-caudal-border">
              {paymentModal.isPaid ? (
                <button
                  type="button"
                  onClick={handleUnmarkPayment}
                  className="text-xs text-caudal-error hover:underline transition-colors font-medium"
                >
                  Mark as Unpaid
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="px-3 py-1.5 text-xs text-caudal-text-muted hover:text-caudal-text rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentAmount}
                  className="px-3.5 py-1.5 bg-caudal-green text-black font-semibold text-xs rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
