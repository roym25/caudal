'use client'

import { useState, useEffect } from "react"

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function FixedExpenses() {
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [currentYear] = useState(new Date().getFullYear())
  const [form, setForm] = useState({ name: '', cost: '', dueDay: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', cost: '', dueDay: '' })

  const fetchFixedExpenses = async () => {
    const response = await fetch('/api/fixed-expenses')
    const data = await response.json()
    setFixedExpenses(data)
  }

  useEffect(() => {
    fetchFixedExpenses()
  }, [])

  const handleSubmit = async () => {
    await fetch('/api/fixed-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cost: parseFloat(form.cost),
        dueDay: parseInt(form.dueDay)
      })
    })
    setForm({ name: '', cost: '', dueDay: '' })
    fetchFixedExpenses()
  }

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({ name: expense.name, cost: expense.cost, dueDay: expense.dueDay })
  }

  const handleUpdate = async (id) => {
    await fetch(`/api/fixed-expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        cost: parseFloat(editForm.cost),
        dueDay: parseInt(editForm.dueDay)
      })
    })
    setEditingId(null)
    fetchFixedExpenses()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    await fetch(`/api/fixed-expenses/${id}`, { method: 'DELETE' })
    fetchFixedExpenses()
  }

  const togglePayment = async (expenseId, monthIndex, isPaid) => {
    const date = new Date(currentYear, monthIndex, 1)
    await fetch('/api/fixed-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixedExpenseId: expenseId,
        date: date.toISOString(),
        paid: !isPaid
      })
    })
    fetchFixedExpenses()
  }

  const getPaymentForMonth = (payments, monthIndex) => {
    return payments.find(p => {
      const d = new Date(p.date)
      return d.getMonth() === monthIndex && d.getFullYear() === currentYear
    })
  }

  const getTotalPaid = (expense) => {
    const paidCount = MONTHS.filter((_, monthIndex) => {
      const payment = getPaymentForMonth(expense.payments, monthIndex)
      return payment?.paid ?? false
    }).length
    return paidCount * expense.cost
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fixed Expenses {currentYear}</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">New Fixed Expense</h2>
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} className="border p-2 rounded w-32" />
          <input type="number" placeholder="Due Day" value={form.dueDay} onChange={(e) => setForm({...form, dueDay: e.target.value})} className="border p-2 rounded w-28" />
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-black-100">
              <th className="border p-2 text-left">Expense</th>
              <th className="border p-2 text-left">Cost</th>
              <th className="border p-2 text-left">Due</th>
              {MONTHS.map((month) => (
                <th key={month} className="border p-2 text-center">{month}</th>
              ))}
              <th className="border p-2 text-center bg-black-200">Total Paid</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fixedExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border p-1 rounded w-full" />
                    : <span className="font-medium">{expense.name}</span>
                  }
                </td>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input type="number" value={editForm.cost} onChange={(e) => setEditForm({...editForm, cost: e.target.value})} className="border p-1 rounded w-24" />
                    : `$${expense.cost}`
                  }
                </td>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input type="number" value={editForm.dueDay} onChange={(e) => setEditForm({...editForm, dueDay: e.target.value})} className="border p-1 rounded w-16" />
                    : expense.dueDay
                  }
                </td>
                {MONTHS.map((month, monthIndex) => {
                  const payment = getPaymentForMonth(expense.payments, monthIndex)
                  const isPaid = payment?.paid ?? false
                  return (
                    <td key={month} className="border p-2 text-center">
                      <button
                        onClick={() => togglePayment(expense.id, monthIndex, isPaid)}
                        className={`w-8 h-8 rounded-full text-white text-xs font-bold ${isPaid ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        {isPaid ? '✓' : ''}
                      </button>
                    </td>
                  )
                })}
                <td className="border p-2 text-center font-bold text-green-700">
                  ${getTotalPaid(expense)}
                </td>
                <td className="border p-2 text-center">
                  {editingId === expense.id ? (
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleUpdate(expense.id)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-black-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleEdit(expense)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                      <button onClick={() => handleDelete(expense.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black-100">
              <td colSpan={3 + MONTHS.length} className="border p-2 text-right font-bold">Annual Total Paid:</td>
              <td className="border p-2 text-center font-bold text-green-700">
                ${fixedExpenses.reduce((acc, expense) => acc + getTotalPaid(expense), 0)}
              </td>
              <td className="border p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  )
}