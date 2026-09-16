'use client'

import { useState, useEffect } from "react"
import { formatMoney, formatDate } from "@/lib/format"

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
    try {
      const response = await fetch('/api/variable-expenses')
      const data = await response.json()
      if (Array.isArray(data)) {
        setVariableExpenses(data)
      }
    } catch (err) {
      console.error("Error fetching variable expenses:", err)
    }
  }

  useEffect(() => {
    fetchVariableExpenses()
  }, [])

  const handleSubmit = async () => {
    if (!form.description || !form.date || !form.amount) {
      alert('Please fill in all fields')
      return
    }

    try {
      await fetch('/api/variable-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      setForm({ description: '', date: '', amount: '' })
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error creating variable expense:", err)
    }
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
    try {
      await fetch(`/api/variable-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      })
      setEditingId(null)
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error updating variable expense:", err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      await fetch(`/api/variable-expenses/${id}`, { method: 'DELETE' })
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error deleting variable expense:", err)
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">Variable Expenses</h1>

      <div className="mb-8 bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">New Variable Expense</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input 
            type="text" 
            placeholder="Description" 
            value={form.description} 
            onChange={(e) => setForm({...form, description: e.target.value})} 
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="date" 
            value={form.date} 
            onChange={(e) => setForm({...form, date: e.target.value})} 
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="number" 
            step="0.01" 
            placeholder="Amount" 
            value={form.amount} 
            onChange={(e) => setForm({...form, amount: e.target.value})} 
            className="border p-2 rounded bg-white" 
          />
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium">
            Save
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Variable Expenses List</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse min-w-[600px]">
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
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="border p-2">
                    {editingId === expense.id
                      ? <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="border p-1 rounded w-full" />
                      : expense.description
                    }
                  </td>
                  <td className="border p-2">
                    {editingId === expense.id
                      ? <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="border p-1 rounded" />
                      : formatDate(expense.date)
                    }
                  </td>
                  <td className="border p-2 font-medium">
                    {editingId === expense.id
                      ? <input type="number" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} className="border p-1 rounded w-24" />
                      : formatMoney(expense.amount)
                    }
                  </td>
                  <td className="border p-2">
                    {editingId === expense.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdate(expense.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">Save</button>
                        <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(expense)} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(expense.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
