'use client'

import { useState, useEffect } from "react"

export default function VariableExpenses() {
  const [variableExpenses, setVariableExpenses] = useState([])
  const [form, setForm] = useState({
    description: '', date: '', amount: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    description: '', date: '', amount: ''
  })

  const fetchVariableExpenses = async () => {
    const response = await fetch('/api/variable-expenses')
    const data = await response.json()
    setVariableExpenses(data)
  }

  useEffect(() => {
    fetchVariableExpenses()
  }, [])

  const handleSubmit = async () => {
    await fetch('/api/variable-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount)
      })
    })
    setForm({ description: '', date: '', amount: '' })
    fetchVariableExpenses()
  }

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({
      description: expense.description,
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount,
    })
  }

  const handleUpdate = async (id) => {
    await fetch(`/api/variable-expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        date: new Date(editForm.date),
        amount: parseFloat(editForm.amount),
      })
    })
    setEditingId(null)
    fetchVariableExpenses()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    await fetch(`/api/variable-expenses/${id}`, { method: 'DELETE' })
    fetchVariableExpenses()
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Variable Expenses</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">New Variable Expense</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="border p-2 rounded" />
          <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="border p-2 rounded" />
          <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded">Save</button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Variable Expenses List</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variableExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="border p-1 rounded w-full" />
                    : expense.description
                  }
                </td>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="border p-1 rounded" />
                    : new Date(expense.date).toLocaleDateString()
                  }
                </td>
                <td className="border p-2">
                  {editingId === expense.id
                    ? <input type="number" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} className="border p-1 rounded w-24" />
                    : `$${expense.amount}`
                  }
                </td>
                <td className="border p-2">
                  {editingId === expense.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdate(expense.id)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(expense)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                      <button onClick={() => handleDelete(expense.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}