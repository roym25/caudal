'use client';

import { useState, useEffect } from 'react';
import { formatMoney, formatDate } from '@/lib/format';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon } from '@/components/icons';
import Toast from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import LoadingTable from '@/components/LoadingTable';
import SlidePanel from '@/components/SlidePanel';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    week: '',
    amountReceived: '',
    isr: '',
    savingsFund: '',
    notes: ''
  });

  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch('/api/payroll');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPayrolls(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const savings = Number(formData.savingsFund || 0);
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          week: Number(formData.week),
          amountReceived: Number(formData.amountReceived),
          isr: Number(formData.isr || 0),
          savingsFund: savings,
          employerMatch: savings,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errors?.join(', ') || 'Failed to create payroll record');
      }

      await fetchPayrolls();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        week: '',
        amountReceived: '',
        isr: '',
        savingsFund: '',
        notes: ''
      });
      setShowForm(false);
      showToast('Payroll record created successfully');
    } catch (error) {
      showToast(error.message || 'Failed to create payroll', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      await fetchPayrolls();
      showToast('Payroll record deleted');
    } catch (error) {
      showToast(error.message || 'Failed to delete record', 'error');
    }
  };

  const handleEdit = (payroll) => {
    setEditingId(payroll.id);
    setEditFormData({
      date: new Date(payroll.date).toISOString().split('T')[0],
      week: payroll.week,
      amountReceived: payroll.amountReceived,
      isr: payroll.isr,
      savingsFund: payroll.savingsFund,
      notes: payroll.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id) => {
    try {
      const savings = Number(editFormData.savingsFund || 0);
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          week: Number(editFormData.week),
          amountReceived: Number(editFormData.amountReceived),
          isr: Number(editFormData.isr || 0),
          savingsFund: savings,
          employerMatch: savings,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errors?.join(', ') || 'Failed to update');
      }

      await fetchPayrolls();
      setEditingId(null);
      showToast('Payroll updated successfully');
    } catch (error) {
      showToast(error.message || 'Failed to update record', 'error');
    }
  };

  const groupedPayrolls = payrolls.reduce((acc, payroll) => {
    const date = new Date(payroll.date);
    const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(payroll);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-caudal-text">Payroll</h1>
          <p className="text-sm text-caudal-text-muted mt-0.5">Weekly income and deductions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-caudal-green text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Payroll
        </button>
      </div>

      <SlidePanel isOpen={showForm} onClose={() => setShowForm(false)} title="New Payroll">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Date</label>
            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Week (1–5)</label>
            <input required type="number" min="1" max="5" name="week" placeholder="1" value={formData.week} onChange={handleInputChange} className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Amount Received (Net Pay)</label>
            <input required type="number" step="0.01" name="amountReceived" placeholder="0.00" value={formData.amountReceived} onChange={handleInputChange} className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">ISR</label>
            <input required type="number" step="0.01" name="isr" placeholder="0.00" value={formData.isr} onChange={handleInputChange} className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors" />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-sm text-caudal-text-muted">Savings Fund (Deduction)</label>
              <span className="text-xs text-caudal-green font-medium">1:1 match auto-applied</span>
            </div>
            <input
              type="number"
              step="0.01"
              name="savingsFund"
              placeholder="0.00"
              value={formData.savingsFund}
              onChange={handleInputChange}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors"
            />
            {Number(formData.savingsFund) > 0 && (
              <p className="text-xs text-caudal-text-dim mt-1.5 flex items-center justify-between">
                <span>Company match (+100%):</span>
                <span className="text-caudal-green font-semibold">+{formatMoney(Number(formData.savingsFund))} (Total: {formatMoney(Number(formData.savingsFund) * 2)})</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Notes</label>
            <input type="text" name="notes" placeholder="Optional notes" value={formData.notes} onChange={handleInputChange} className="w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors" />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full bg-caudal-green text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-opacity-90 transition-colors">
              Save Payroll
            </button>
          </div>
        </form>
      </SlidePanel>

      {loading ? (
        <LoadingTable columns={8} rows={4} />
      ) : payrolls.length === 0 ? (
        <EmptyState message="No payroll records registered yet" action="Click '+ New Payroll' to add your first payment." />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPayrolls).map(([month, records]) => (
            <div key={month} className="space-y-3">
              <h2 className="text-base font-semibold text-caudal-text border-l-4 border-caudal-green pl-3">{month}</h2>
              <div className="bg-caudal-surface border border-caudal-border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[750px]">
                  <thead className="bg-caudal-surface-alt text-caudal-text-muted uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Week</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-right font-medium">ISR</th>
                      <th className="px-4 py-3 text-right font-medium">Savings</th>
                      <th className="px-4 py-3 text-right font-medium">Match (1:1)</th>
                      <th className="px-4 py-3 font-medium">Notes</th>
                      <th className="px-4 py-3 text-center font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-caudal-border text-caudal-text">
                    {records.map(record => (
                      <tr key={record.id} className="hover:bg-caudal-surface-alt/50 transition-colors">
                        {editingId === record.id ? (
                          <>
                            <td className="px-4 py-3">
                              <input type="date" name="date" value={editFormData.date} onChange={handleEditInputChange} className="w-full min-w-[130px] bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input type="number" min="1" max="5" name="week" value={editFormData.week} onChange={handleEditInputChange} className="w-full min-w-[50px] text-right bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input type="number" step="0.01" name="amountReceived" value={editFormData.amountReceived} onChange={handleEditInputChange} className="w-full min-w-[90px] text-right bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input type="number" step="0.01" name="isr" value={editFormData.isr} onChange={handleEditInputChange} className="w-full min-w-[80px] text-right bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input type="number" step="0.01" name="savingsFund" value={editFormData.savingsFund} onChange={handleEditInputChange} className="w-full min-w-[80px] text-right bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-right text-caudal-green font-medium">
                              +{formatMoney(Number(editFormData.savingsFund || 0))}
                            </td>
                            <td className="px-4 py-3">
                              <input type="text" name="notes" value={editFormData.notes} onChange={handleEditInputChange} className="w-full min-w-[120px] bg-caudal-surface-alt border border-caudal-border rounded px-2 py-1 text-sm focus:outline-none focus:border-caudal-green" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleUpdate(record.id)} className="p-1 text-caudal-green hover:bg-caudal-surface-alt rounded transition-colors" title="Save">
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancelEdit} className="p-1 text-caudal-text-muted hover:bg-caudal-surface-alt rounded transition-colors" title="Cancel">
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">{formatDate(record.date)}</td>
                            <td className="px-4 py-3 text-right text-caudal-text-muted">{record.week}</td>
                            <td className="px-4 py-3 text-right font-medium text-caudal-green">{formatMoney(record.amountReceived)}</td>
                            <td className="px-4 py-3 text-right font-medium text-caudal-orange">{formatMoney(record.isr)}</td>
                            <td className="px-4 py-3 text-right text-caudal-green">{formatMoney(record.savingsFund)}</td>
                            <td className="px-4 py-3 text-right text-caudal-green">+{formatMoney(record.employerMatch || record.savingsFund || 0)}</td>
                            <td className="px-4 py-3 text-caudal-text-muted truncate max-w-[180px]" title={record.notes || ''}>{record.notes || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleEdit(record)} className="p-1 text-caudal-text-muted hover:text-caudal-text hover:bg-caudal-surface-alt rounded transition-colors" title="Edit">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(record.id)} className="p-1 text-caudal-text-muted hover:text-caudal-error hover:bg-caudal-surface-alt rounded transition-colors" title="Delete">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
