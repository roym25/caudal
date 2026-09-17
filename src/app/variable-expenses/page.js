'use client';

import { useState, useEffect } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
} from '@/components/icons';
import Toast from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import LoadingTable from '@/components/LoadingTable';
import SlidePanel from '@/components/SlidePanel';

export default function VariableExpensesPage() {
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    date: '',
    amount: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchVariableExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/variable-expenses');
      const data = await response.json();
      if (Array.isArray(data)) {
        setVariableExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching variable expenses:', err);
      showToast('Error loading variable expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariableExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.date || !form.amount) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/variable-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to save variable expense', 'error');
        return;
      }

      setForm({
        description: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
      });
      setShowForm(false);
      showToast('Variable expense added successfully');
      fetchVariableExpenses();
    } catch (err) {
      console.error('Error creating variable expense:', err);
      showToast('Network error while saving', 'error');
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      description: expense.description,
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount,
    });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/variable-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to update variable expense', 'error');
        return;
      }

      setEditingId(null);
      showToast('Variable expense updated successfully');
      fetchVariableExpenses();
    } catch (err) {
      console.error('Error updating variable expense:', err);
      showToast('Network error while updating', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/variable-expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete variable expense', 'error');
        return;
      }
      showToast('Variable expense deleted successfully');
      fetchVariableExpenses();
    } catch (err) {
      console.error('Error deleting variable expense:', err);
      showToast('Network error while deleting', 'error');
    }
  };

  const totalVariable = variableExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-caudal-text">Variable Expenses</h1>
          <p className="text-sm text-caudal-text-muted mt-0.5">One-off purchases, dining, and daily spending</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-caudal-orange text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Variable Expense
        </button>
      </div>

      <SlidePanel isOpen={showForm} onClose={() => setShowForm(false)} title="New Variable Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Dinner, Electronics"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-orange transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-orange transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-orange transition-colors"
              required
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-caudal-orange text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-opacity-90 transition-colors"
            >
              Save Variable Expense
            </button>
          </div>
        </form>
      </SlidePanel>

      {loading ? (
        <LoadingTable columns={4} rows={3} />
      ) : variableExpenses.length === 0 ? (
        <EmptyState
          message="No variable expenses recorded yet"
          action="Click '+ New Variable Expense' to record daily purchases or one-off expenses."
        />
      ) : (
        <div className="bg-caudal-surface border border-caudal-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-caudal-surface-alt text-caudal-text-muted uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-caudal-border text-caudal-text">
              {variableExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-caudal-surface-alt/50 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === expense.id ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-caudal-text focus:outline-none focus:border-caudal-orange w-full"
                      />
                    ) : (
                      <span className="font-medium text-caudal-text">{expense.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caudal-text-muted">
                    {editingId === expense.id ? (
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-caudal-text focus:outline-none focus:border-caudal-orange"
                      />
                    ) : (
                      formatDate(expense.date)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-caudal-orange">
                    {editingId === expense.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm text-right text-caudal-text focus:outline-none focus:border-caudal-orange w-24"
                      />
                    ) : (
                      formatMoney(expense.amount)
                    )}
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
                <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-caudal-text-muted">
                  Total Variable Expenses:
                </td>
                <td className="px-4 py-3 text-right font-bold text-caudal-orange">
                  {formatMoney(totalVariable)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
