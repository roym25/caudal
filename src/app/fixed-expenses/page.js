'use client'

import { useState, useEffect } from "react"
import { formatMoney } from "@/lib/format"
import Toast from "@/components/Toast"
import EmptyState from "@/components/EmptyState"
import LoadingTable from "@/components/LoadingTable"

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function FixedExpenses() {
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [form, setForm] = useState({ name: '', cost: '', dueDay: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', cost: '', dueDay: '' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchFixedExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fixed-expenses')
      const data = await response.json()
      if (Array.isArray(data)) {
        setFixedExpenses(data)
      }
    } catch (err) {
      console.error("Error fetching fixed expenses:", err)
      showToast('Error loading fixed expenses', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFixedExpenses()
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.cost || !form.dueDay) {
      showToast('Please fill in all fields', 'error')
      return
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
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to save fixed expense', 'error')
        return
      }

      setForm({ name: '', cost: '', dueDay: '' })
      showToast('Fixed expense added successfully')
      fetchFixedExpenses()
    } catch (err) {
      console.error("Error creating fixed expense:", err)
      showToast('Network error while saving', 'error')
    }
  }

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({ name: expense.name, cost: expense.cost, dueDay: expense.dueDay })
  }

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
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to update fixed expense', 'error')
        return
      }

      setEditingId(null)
      showToast('Fixed expense updated successfully')
      fetchFixedExpenses()
    } catch (err) {
      console.error("Error updating fixed expense:", err)
      showToast('Network error while updating', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`/api/fixed-expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Failed to delete fixed expense', 'error')
        return
      }
      showToast('Fixed expense deleted successfully')
      fetchFixedExpenses()
    } catch (err) {
      console.error("Error deleting fixed expense:", err)
      showToast('Network error while deleting', 'error')
    }
  }

  const togglePayment = async (expenseId, monthIndex, isPaid) => {
    const monthNum = String(monthIndex + 1).padStart(2, '0')
    const dateStr = `${currentYear}-${monthNum}-01T12:00:00Z`
    try {
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedExpenseId: expenseId,
          date: dateStr,
          paid: !isPaid,
        }),
      })
      if (!res.ok) {
        showToast('Failed to update payment status', 'error')
        return
      }
      fetchFixedExpenses()
    } catch (err) {
      console.error("Error toggling payment:", err)
      showToast('Network error updating payment', 'error')
    }
  }

  const getPaymentForMonth = (payments, monthIndex) => {
    if (!Array.isArray(payments)) return null
    return payments.find(p => {
      const d = new Date(p.date)
      return d.getUTCMonth() === monthIndex && d.getUTCFullYear() === currentYear
    })
  }

  const getTotalPaid = (expense) => {
    const paidCount = MONTHS.filter((_, monthIndex) => {
      const payment = getPaymentForMonth(expense.payments, monthIndex)
      return payment?.paid ?? false
    }).length
    return paidCount * (expense.cost || 0)
  }

  return (
    <main className="p-6 max-w-6xl mx-auto w-full text-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fixed Expenses</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentYear(y => y - 1)}
            className="px-3 py-1 bg-white hover:bg-gray-100 rounded border border-gray-300 text-sm font-semibold text-gray-800 transition-colors"
            title="Previous year"
          >
            ?
          </button>
          <span className="text-base font-bold min-w-[4rem] text-center text-gray-900">
            {currentYear}
          </span>
          <button
            onClick={() => setCurrentYear(y => y + 1)}
            className="px-3 py-1 bg-white hover:bg-gray-100 rounded border border-gray-300 text-sm font-semibold text-gray-800 transition-colors"
            title="Next year"
          >
            ?
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">New Fixed Expense</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className="border border-gray-300 p-2 rounded bg-white text-gray-900 w-48"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cost"
            value={form.cost}
            onChange={(e) => setForm({...form, cost: e.target.value})}
            className="border border-gray-300 p-2 rounded bg-white text-gray-900 w-32"
          />
          <input
            type="number"
            placeholder="Due Day (1-31)"
            value={form.dueDay}
            onChange={(e) => setForm({...form, dueDay: e.target.value})}
            className="border border-gray-300 p-2 rounded bg-white text-gray-900 w-36"
          />
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium transition-colors">
            Save
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingTable columns={15} rows={3} />
      ) : fixedExpenses.length === 0 ? (
        <EmptyState 
          message="No fixed expenses defined" 
          action="Add regular expenses like rent, subscriptions or utilities using the form above." 
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="border border-gray-200 p-2 text-left">Expense</th>
                <th className="border border-gray-200 p-2 text-left">Cost</th>
                <th className="border border-gray-200 p-2 text-left">Due</th>
                {MONTHS.map((month) => (
                  <th key={month} className="border border-gray-200 p-2 text-center">{month}</th>
                ))}
                <th className="border border-gray-200 p-2 text-center bg-gray-200 font-semibold text-gray-900">Total Paid</th>
                <th className="border border-gray-200 p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fixedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 text-gray-900">
                  <td className="border border-gray-200 p-2">
                    {editingId === expense.id
                      ? <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-gray-300 p-1 rounded w-full bg-white text-gray-900" />
                      : <span className="font-medium text-gray-900">{expense.name}</span>
                    }
                  </td>
                  <td className="border border-gray-200 p-2 font-medium text-gray-900">
                    {editingId === expense.id
                      ? <input type="number" value={editForm.cost} onChange={(e) => setEditForm({...editForm, cost: e.target.value})} className="border border-gray-300 p-1 rounded w-24 bg-white text-gray-900" />
                      : formatMoney(expense.cost)
                    }
                  </td>
                  <td className="border border-gray-200 p-2 text-gray-800">
                    {editingId === expense.id
                      ? <input type="number" value={editForm.dueDay} onChange={(e) => setEditForm({...editForm, dueDay: e.target.value})} className="border border-gray-300 p-1 rounded w-16 bg-white text-gray-900" />
                      : expense.dueDay
                    }
                  </td>
                  {MONTHS.map((month, monthIndex) => {
                    const payment = getPaymentForMonth(expense.payments, monthIndex)
                    const isPaid = payment?.paid ?? false
                    return (
                      <td key={month} className="border border-gray-200 p-2 text-center">
                        <button
                          onClick={() => togglePayment(expense.id, monthIndex, isPaid)}
                          className={`w-7 h-7 rounded-full text-white text-xs font-bold transition-colors ${
                            isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                        >
                          {isPaid ? '?' : ''}
                        </button>
                      </td>
                    )
                  })}
                  <td className="border border-gray-200 p-2 text-center font-bold text-green-700">
                    {formatMoney(getTotalPaid(expense))}
                  </td>
                  <td className="border border-gray-200 p-2 text-center">
                    {editingId === expense.id ? (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleUpdate(expense.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">Save</button>
                        <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEdit(expense)} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(expense.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 text-gray-900">
                <td colSpan={3 + MONTHS.length} className="border border-gray-200 p-2 text-right font-bold text-gray-900">Annual Total Paid:</td>
                <td className="border border-gray-200 p-2 text-center font-bold text-green-700">
                  {formatMoney(fixedExpenses.reduce((acc, expense) => acc + getTotalPaid(expense), 0))}
                </td>
                <td className="border border-gray-200 p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </main>
  )
}
